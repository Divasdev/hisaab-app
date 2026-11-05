// Mock resolvers: they answer the GraphQL schema (src/api/schema.graphql) from the mock database.
// In the real backend these become Strawberry resolvers. Same idea: one function per field
// that is not a plain column.
//
// A resolver gets (parent, args, context). context = { state, user, stats, cache }.
import { fail, findMember, requireMember } from '../api/client';
import { groupLedger, groupNet, lastActivityAt, liveExpenses, memberById, memberName, membersOf, settlementsOf } from '../api/ledger';

/**
 * Every User or Member lookup goes through these two functions, so we can count them.
 * In a real database each lookup would be one SQL query: that is the N+1 problem.
 * The backend fixes it with a DataLoader (see the note in api/graphql.js).
 */
function loadUser(ctx, id) {
  ctx.stats.lookups++;
  const u = ctx.state.users.find((x) => x.id === id);
  return u ? { id: u.id, name: u.name, upi_id: u.upi_id } : { id, name: 'Former member', upi_id: null };
}
function loadMember(ctx, id) {
  ctx.stats.lookups++;
  return memberById(ctx.state, id) || { id, group_id: null, user_id: null, name: 'Former member', role: 'member', removed_at: 'x' };
}

/** Net balances are needed by several fields of the same group; work them out once per request. */
function netOf(ctx, groupId) {
  const key = `net:${groupId}`;
  if (!ctx.cache.has(key)) ctx.cache.set(key, groupNet(ctx.state, groupId));
  return ctx.cache.get(key);
}

const newestFirst = (a, b) => b.created_at.localeCompare(a.created_at);
const myMember = (ctx, groupId) => findMember(ctx.state, groupId, ctx.user.id);

/** The small, safe view of a group shown to people who are not members. */
function inviteGroup(ctx, group) {
  const members = membersOf(ctx.state, group.id);
  return {
    id: group.id,
    name: group.name,
    kind: group.kind,
    member_count: members.length,
    members_preview: members.slice(0, 5).map((m) => ({ id: m.id, name: memberName(ctx.state, m) })),
  };
}

function activityData(ctx, a) {
  const data = { ...a.data };
  for (const key of ['member_id', 'from_member_id', 'to_member_id']) {
    if (!(key in data)) continue;
    const m = loadMember(ctx, data[key]);
    data[`${key}_name`] = memberName(ctx.state, m);
    data[`${key}_is_me`] = m.user_id === ctx.user.id;
  }
  return data;
}

export const resolvers = {
  Query: {
    groups: (_, __, { state, user }) =>
      state.members
        .filter((m) => m.user_id === user.id && !m.removed_at)
        .map((m) => state.groups.find((g) => g.id === m.group_id))
        .sort((a, b) => (lastActivityAt(state, b.id) || b.created_at).localeCompare(lastActivityAt(state, a.id) || a.created_at)),

    my_balance: (_, __, ctx) => {
      const out = { owed_to_me_paise: 0, i_owe_paise: 0, groups_owed: 0, groups_owe: 0 };
      for (const m of ctx.state.members.filter((x) => x.user_id === ctx.user.id && !x.removed_at)) {
        const v = netOf(ctx, m.group_id)[m.id] || 0;
        if (v > 0) {
          out.owed_to_me_paise += v;
          out.groups_owed++;
        }
        if (v < 0) {
          out.i_owe_paise += -v;
          out.groups_owe++;
        }
      }
      return { ...out, net_paise: out.owed_to_me_paise - out.i_owe_paise };
    },

    recent_activity: (_, { limit }, { state, user }) => {
      const mine = new Set(state.members.filter((m) => m.user_id === user.id && !m.removed_at).map((m) => m.group_id));
      return state.activity.filter((a) => mine.has(a.group_id)).sort(newestFirst).slice(0, limit);
    },

    my_invites: (_, __, ctx) => {
      const { state, user } = ctx;
      return state.members
        .filter((m) => !m.user_id && !m.removed_at && m.invite_email === user.email && !findMember(state, m.group_id, user.id))
        .map((m) => ({
          member_id: m.id,
          name: m.name,
          added_by: loadUser(ctx, m.added_by),
          group: inviteGroup(ctx, state.groups.find((g) => g.id === m.group_id)),
        }));
    },

    // Permission check: the same one every REST group endpoint uses.
    group: (_, { id }, { state, user }) => requireMember(state, id, user.id).group,

    expense: (_, { id }, { state, user }) => {
      const e = state.expenses.find((x) => x.id === id);
      if (!e) fail(404, 'This expense does not exist.');
      requireMember(state, e.group_id, user.id);
      if (e.deleted_at) fail(404, 'This expense was deleted.');
      return e;
    },

    invite: (_, { token }, ctx) => {
      const { state, user } = ctx;
      const inv = state.invites.find((i) => i.token === token);
      if (!inv || inv.revoked) fail(404, 'This invite link does not work.');
      const group = state.groups.find((g) => g.id === inv.group_id);
      const active = new Date(inv.expires_at) > new Date();
      return {
        status: findMember(state, group.id, user.id) ? 'member' : active ? 'valid' : 'expired',
        expires_at: inv.expires_at,
        invited_by: loadUser(ctx, inv.created_by),
        group: inviteGroup(ctx, group),
        open_members: membersOf(state, group.id)
          .filter((m) => !m.user_id)
          .map((m) => ({ id: m.id, name: m.name })),
      };
    },
  },

  Group: {
    my_member_id: (g, _, ctx) => myMember(ctx, g.id).id,
    my_role: (g, _, ctx) => myMember(ctx, g.id).role,
    my_balance_paise: (g, _, ctx) => netOf(ctx, g.id)[myMember(ctx, g.id).id] || 0,
    total_spent_paise: (g, _, { state }) => liveExpenses(state, g.id).reduce((sum, e) => sum + e.amount_paise, 0),
    member_count: (g, _, { state }) => membersOf(state, g.id).length,
    last_activity_at: (g, _, { state }) => lastActivityAt(state, g.id) || g.created_at,
    // Joined people first (in the order they joined), then names that have not joined yet.
    members: (g, _, { state }) =>
      membersOf(state, g.id).sort((a, b) => Number(!a.user_id) - Number(!b.user_id) || (a.joined_at || a.added_at).localeCompare(b.joined_at || b.added_at)),
    past_members: (g, _, { state }) => state.members.filter((m) => m.group_id === g.id && m.removed_at),
    expenses: (g, { limit }, { state }) => {
      const list = liveExpenses(state, g.id).sort((a, b) => b.date.localeCompare(a.date) || newestFirst(a, b));
      return limit ? list.slice(0, limit) : list;
    },
    settlements: (g, _, { state }) => settlementsOf(state, g.id).sort(newestFirst),
    balances: (g, _, { state }) => {
      const { suggested, pairwise } = groupLedger(state, g.id);
      return { suggested, pairwise };
    },
    activity: (g, { limit }, { state }) => state.activity.filter((a) => a.group_id === g.id).sort(newestFirst).slice(0, limit),
  },

  Member: {
    name: (m, _, { state }) => memberName(state, m),
    upi_id: (m, _, { state }) => (m.user_id ? state.users.find((u) => u.id === m.user_id)?.upi_id ?? null : null),
    joined: (m) => Boolean(m.user_id),
    invite_email: (m) => (m.user_id ? null : m.invite_email),
    balance_paise: (m, _, ctx) => (m.group_id ? netOf(ctx, m.group_id)[m.id] || 0 : 0),
  },

  Expense: {
    payer: (e, _, ctx) => loadMember(ctx, e.paid_by),
    creator: (e, _, ctx) => loadUser(ctx, e.created_by),
    // Reaching a group through an expense still needs the membership check.
    group: (e, _, { state, user }) => requireMember(state, e.group_id, user.id).group,
  },
  Split: {
    member: (s, _, ctx) => loadMember(ctx, s.member_id),
  },
  Settlement: {
    from_member: (p, _, ctx) => loadMember(ctx, p.from_member_id),
    to_member: (p, _, ctx) => loadMember(ctx, p.to_member_id),
  },
  Transfer: {
    from_member: (t, _, ctx) => loadMember(ctx, t.from_member_id),
    to_member: (t, _, ctx) => loadMember(ctx, t.to_member_id),
  },
  Activity: {
    actor: (a, _, ctx) => loadUser(ctx, a.actor_id),
    data: (a, _, ctx) => activityData(ctx, a),
    group: (a, _, { state, user }) => requireMember(state, a.group_id, user.id).group,
  },
};
