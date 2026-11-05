// Shared pieces for the mock API. Errors look like FastAPI errors: { status, detail }.
import { db } from '../mock/db';
import { notifyChange } from './events';

export class ApiError extends Error {
  constructor(status, detail) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}
export const fail = (status, detail) => {
  throw new ApiError(status, detail);
};

const TOKEN_KEY = 'hisaab.token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event('hisaab:logged-out'));
}

/** Fake network delay so loading states are visible (the Doherty threshold is ~400 ms). */
export const wait = () => new Promise((r) => setTimeout(r, 140 + Math.random() * 240));

/** Runs a mock handler like a request: delay, then a deep copy of the result (like JSON over the wire). */
export async function request(handler, { write = false } = {}) {
  await wait();
  const result = handler(db.state);
  if (write) {
    db.save();
    notifyChange();
  }
  return result === undefined ? null : structuredClone(result);
}

/** The logged-in user's id from the token, or a 401 (the real backend decodes a JWT here). */
export function me(state) {
  const token = getToken();
  const id = Number(token?.startsWith('mock.') && token.slice(5));
  const user = state.users.find((u) => u.id === id);
  if (!user) {
    clearToken();
    fail(401, 'Please log in again.');
  }
  return user;
}

export const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, upi_id: u.upi_id });
export const nextId = (state, key) => ++state.seq[key];

export function logActivity(state, group_id, actor_id, type, data = {}) {
  state.activity.push({ id: nextId(state, 'activity'), group_id, actor_id, type, data, created_at: new Date().toISOString() });
}

/** The logged-in user's member row in a group (active, not removed), or undefined. */
export const findMember = (state, groupId, userId) =>
  state.members.find((m) => m.group_id === groupId && m.user_id === userId && !m.removed_at);

/** Permission check used by every group endpoint: you must be a member. Returns your member row too. */
export function requireMember(state, groupId, userId) {
  const group = state.groups.find((g) => g.id === Number(groupId));
  if (!group) fail(404, 'This group does not exist.');
  const membership = findMember(state, group.id, userId);
  if (!membership) fail(403, 'You are not a member of this group.');
  return { group, membership };
}

export function requireAdmin(state, groupId, userId) {
  const r = requireMember(state, groupId, userId);
  if (r.membership.role !== 'admin') fail(403, 'Only group admins can do this.');
  return r;
}
