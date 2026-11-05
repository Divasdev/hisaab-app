import { request, fail, me, nextId, logActivity, requireMember, requireAdmin } from './client';
import { membersOf, groupNet } from './ledger';

const KINDS = ['hostel', 'flat', 'trip', 'other'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateGroup({ name, kind }) {
  name = (name || '').trim();
  if (!name) fail(422, 'Give the group a name.');
  if (name.length > 40) fail(422, 'Keep the name under 40 characters.');
  if (!KINDS.includes(kind)) fail(422, 'Pick what kind of group this is.');
  return { name, kind };
}

/** A person added by name: name 1–40 characters, email optional. */
function cleanPerson(person) {
  const name = (person?.name || '').trim();
  const email = (person?.email || '').trim().toLowerCase() || null;
  if (!name) fail(422, 'Type their name.');
  if (name.length > 40) fail(422, 'Keep names under 40 characters.');
  if (email && !EMAIL.test(email)) fail(422, 'That email address looks wrong.');
  return { name, email };
}

/** Nobody in the group may already have this email (as an account or as an invite). */
function checkEmailFree(s, groupId, email, exceptMemberId = null) {
  if (!email) return;
  const taken = membersOf(s, groupId).some((m) => {
    if (m.id === exceptMemberId) return false;
    if (m.invite_email === email) return true;
    return m.user_id && s.users.find((u) => u.id === m.user_id)?.email === email;
  });
  if (taken) fail(409, 'Someone with this email is already in the group.');
}

function addPlaceholder(s, groupId, person, userId) {
  const now = new Date().toISOString();
  const m = { id: nextId(s, 'member'), group_id: groupId, user_id: null, name: person.name, invite_email: person.email, role: 'member', added_by: userId, added_at: now, joined_at: null, removed_at: null };
  s.members.push(m);
  logActivity(s, groupId, userId, 'member_added', { member_id: m.id, name: m.name });
  return m;
}

const view = (m) => ({ id: m.id, name: m.name, joined: Boolean(m.user_id), invite_email: m.user_id ? null : m.invite_email });

/**
 * POST /api/groups  { name, kind, members?: [{ name, email? }] } -> { id, name, kind }
 * The creator becomes admin. People typed in are added by name. All in one transaction.
 */
export function createGroup(input) {
  return request((s) => {
    const user = me(s);
    const { name, kind } = validateGroup(input);
    const people = (input.members || []).map(cleanPerson);
    if (people.length > 50) fail(422, 'A group can have at most 50 people.');
    const id = nextId(s, 'group');
    const now = new Date().toISOString();
    s.groups.push({ id, name, kind, created_by: user.id, created_at: now });
    s.members.push({ id: nextId(s, 'member'), group_id: id, user_id: user.id, name: user.name, invite_email: null, role: 'admin', added_by: user.id, added_at: now, joined_at: now, removed_at: null });
    logActivity(s, id, user.id, 'group_created', { name });
    for (const p of people) {
      if (p.email === user.email) continue; // that's you
      checkEmailFree(s, id, p.email);
      addPlaceholder(s, id, p, user.id);
    }
    return { id, name, kind };
  }, { write: true });
}

/** PATCH /api/groups/{id}  { name, kind }   (admins only) */
export function updateGroup(groupId, input) {
  return request((s) => {
    const user = me(s);
    const { group } = requireAdmin(s, groupId, user.id);
    const { name, kind } = validateGroup(input);
    if (name !== group.name) logActivity(s, group.id, user.id, 'group_renamed', { from: group.name, to: name });
    Object.assign(group, { name, kind });
    return { id: group.id, name, kind };
  }, { write: true });
}

/** POST /api/groups/{id}/members  { name, email? } -> member   (any member can add people by name) */
export function addMember(groupId, person) {
  return request((s) => {
    const user = me(s);
    const { group } = requireMember(s, groupId, user.id);
    const p = cleanPerson(person);
    if (p.email === user.email) fail(409, 'That is your own email. You are already in the group.');
    checkEmailFree(s, group.id, p.email);
    return view(addPlaceholder(s, group.id, p, user.id));
  }, { write: true });
}

/**
 * PATCH /api/groups/{id}/members/{member_id}  { role? } or { name?, email? }
 * - role: admins only, and only for people who have joined. A group keeps at least one admin.
 * - name/email: any member, and only for people who have NOT joined (joined people own their name).
 */
export function updateMember(groupId, memberId, changes) {
  return request((s) => {
    const user = me(s);
    const { group, membership } = requireMember(s, groupId, user.id);
    const target = membersOf(s, group.id).find((m) => m.id === memberId);
    if (!target) fail(404, 'That person is not in this group.');
    if ('role' in changes) {
      if (membership.role !== 'admin') fail(403, 'Only group admins can do this.');
      if (!['admin', 'member'].includes(changes.role)) fail(422, 'Unknown role.');
      if (!target.user_id) fail(409, 'Only people who have joined Hisaab can be admins.');
      const admins = membersOf(s, group.id).filter((m) => m.role === 'admin');
      if (changes.role === 'member' && target.role === 'admin' && admins.length === 1) fail(409, 'A group needs at least one admin.');
      target.role = changes.role;
      logActivity(s, group.id, user.id, 'role_changed', { member_id: target.id, role: changes.role });
    }
    if ('name' in changes || 'email' in changes) {
      if (target.user_id) fail(409, 'They have joined, so they choose their own name.');
      const p = cleanPerson({ name: changes.name ?? target.name, email: 'email' in changes ? changes.email : target.invite_email });
      checkEmailFree(s, group.id, p.email, target.id);
      if (p.name !== target.name) logActivity(s, group.id, user.id, 'member_renamed', { member_id: target.id, from: target.name, to: p.name });
      target.name = p.name;
      target.invite_email = p.email;
    }
    return view(target);
  }, { write: true });
}

/** DELETE /api/groups/{id}/members/{member_id}   (admins only; their balance must be zero) */
export function removeMember(groupId, memberId) {
  return request((s) => {
    const user = me(s);
    const { group } = requireAdmin(s, groupId, user.id);
    const target = membersOf(s, group.id).find((m) => m.id === memberId);
    if (!target) fail(404, 'That person is not in this group.');
    if (target.user_id === user.id) fail(422, 'Use "Leave group" to remove yourself.');
    if ((groupNet(s, group.id)[target.id] || 0) !== 0) fail(409, 'They need to settle up before they can be removed.');
    // Soft remove: old expenses still show their name.
    target.removed_at = new Date().toISOString();
    logActivity(s, group.id, user.id, 'member_removed', { member_id: target.id });
  }, { write: true });
}

/** DELETE /api/groups/{id}/members/me   (only when your balance is zero) */
export function leaveGroup(groupId) {
  return request((s) => {
    const user = me(s);
    const { group, membership } = requireMember(s, groupId, user.id);
    if ((groupNet(s, group.id)[membership.id] || 0) !== 0) fail(409, 'Settle up first. You can leave once your balance is zero.');
    const othersJoined = membersOf(s, group.id).filter((m) => m.user_id && m.id !== membership.id);
    if (membership.role === 'admin' && othersJoined.length && !othersJoined.some((m) => m.role === 'admin'))
      fail(409, 'Make someone else an admin before you leave.');
    membership.removed_at = new Date().toISOString();
    logActivity(s, group.id, user.id, 'member_left', { member_id: membership.id });
  }, { write: true });
}
