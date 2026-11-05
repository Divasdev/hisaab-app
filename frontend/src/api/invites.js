import { request, fail, me, logActivity, requireMember, requireAdmin, findMember, nextId } from './client';

const DAY = 24 * 3600_000;
const randomToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 22);
};
const isActive = (inv) => !inv.revoked && new Date(inv.expires_at) > new Date();

function newInvite(s, groupId, userId) {
  // The real backend signs the token (group id + expiry) so it can't be guessed or changed.
  const now = new Date();
  const inv = { token: randomToken(), group_id: groupId, created_by: userId, created_at: now.toISOString(), expires_at: new Date(now.getTime() + DAY).toISOString(), revoked: false };
  s.invites.push(inv);
  return inv;
}
const view = (inv) => ({ token: inv.token, expires_at: inv.expires_at });

/** POST /api/groups/{id}/invites -> the active invite link (creates one if none is active). Any member. */
export async function getInvite(groupId) {
  // Read first, and only write when a new link is needed (a write makes every screen reload).
  const existing = await request((s) => {
    const user = me(s);
    const { group } = requireMember(s, groupId, user.id);
    const active = s.invites.find((i) => i.group_id === group.id && isActive(i));
    return active ? view(active) : null;
  });
  if (existing) return existing;
  return request((s) => {
    const user = me(s);
    const { group } = requireMember(s, groupId, user.id);
    return view(newInvite(s, group.id, user.id));
  }, { write: true });
}

/** POST /api/groups/{id}/invites/reset -> old links stop working, a new one is made. Admins only. */
export function resetInvite(groupId) {
  return request((s) => {
    const user = me(s);
    const { group } = requireAdmin(s, groupId, user.id);
    s.invites.filter((i) => i.group_id === group.id).forEach((i) => (i.revoked = true));
    logActivity(s, group.id, user.id, 'invite_reset', {});
    return view(newInvite(s, group.id, user.id));
  }, { write: true });
}

/**
 * Link an account to a name that was added to the group.
 * The real backend must do this as ONE update, so two people can't claim the same name at once:
 *   UPDATE members SET user_id = :me, joined_at = now() WHERE id = :member_id AND user_id IS NULL
 * If that changes 0 rows, someone else got there first → 409.
 */
function claim(s, groupId, memberId, user) {
  const m = s.members.find((x) => x.id === memberId && x.group_id === groupId && !x.removed_at);
  if (!m) fail(404, 'That name is not in this group any more.');
  if (m.user_id) fail(409, `Someone already joined as ${m.name}. Pick another name, or join as a new person.`);
  m.user_id = user.id;
  m.joined_at = new Date().toISOString();
  m.invite_email = null;
  logActivity(s, groupId, user.id, 'member_claimed', { member_id: m.id, as_name: m.name });
}

/**
 * POST /api/invites/{token}/join  { member_id? } -> { group_id }
 * member_id: "I am this person" (a name already in the group). Leave it out to join as a new person.
 */
export function joinInvite(token, memberId = null) {
  return request((s) => {
    const user = me(s);
    const inv = s.invites.find((i) => i.token === token);
    if (!inv || inv.revoked) fail(404, 'This invite link does not work.');
    if (!isActive(inv)) fail(410, 'This invite link has expired.');
    const groupId = inv.group_id;
    if (findMember(s, groupId, user.id)) return { group_id: groupId };
    const old = s.members.find((m) => m.group_id === groupId && m.user_id === user.id && m.removed_at);
    if (old) {
      // Coming back after leaving: same member row, so old expenses are still theirs.
      old.removed_at = null;
      old.joined_at = new Date().toISOString();
      logActivity(s, groupId, user.id, 'member_joined', { member_id: old.id });
    } else if (memberId) {
      claim(s, groupId, memberId, user);
    } else {
      const now = new Date().toISOString();
      const m = { id: nextId(s, 'member'), group_id: groupId, user_id: user.id, name: user.name, invite_email: null, role: 'member', added_by: user.id, added_at: now, joined_at: now, removed_at: null };
      s.members.push(m);
      logActivity(s, groupId, user.id, 'member_joined', { member_id: m.id });
    }
    return { group_id: groupId };
  }, { write: true });
}

function openInviteFor(s, memberId, user) {
  const m = s.members.find((x) => x.id === memberId);
  if (!m || m.removed_at || m.user_id || m.invite_email !== user.email) fail(404, 'This invite is no longer open.');
  return m;
}

/** POST /api/members/{member_id}/accept -> { group_id }   (someone added you by your email) */
export function acceptInvite(memberId) {
  return request((s) => {
    const user = me(s);
    const m = openInviteFor(s, memberId, user);
    if (findMember(s, m.group_id, user.id)) fail(409, 'You are already in this group.');
    claim(s, m.group_id, m.id, user);
    return { group_id: m.group_id };
  }, { write: true });
}

/** POST /api/members/{member_id}/decline   ("Not me": the name stays in the group, the invite goes away) */
export function declineInvite(memberId) {
  return request((s) => {
    const user = me(s);
    const m = openInviteFor(s, memberId, user);
    m.invite_email = null;
  }, { write: true });
}
