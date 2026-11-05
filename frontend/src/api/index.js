// Everything the screens are allowed to call.
//
//   Screens READ with GraphQL:   gql(QUERY, variables)   → POST /api/graphql   (see queries.js)
//   Buttons WRITE with REST:     api.createExpense(...)  → POST /api/groups/{id}/expenses
//   Auth stays REST:             api.login, api.signup, api.getMe
//
// Today both run against the mock database in the browser. In step 5 the function bodies become
// fetch() calls to FastAPI with the same inputs and outputs.
import * as auth from './auth';
import * as groups from './groups';
import * as invites from './invites';
import * as expenses from './expenses';
import * as settlements from './settlements';
import { db } from '../mock/db';
import { notifyChange } from './events';
import { logRest } from './devlog';

export { ApiError } from './client';
export { onChange } from './events';
export { gql } from './graphql';

/** The REST endpoints, in one list. {placeholders} are filled from the call's arguments, in order. */
export const REST_ROUTES = {
  signup: 'POST /api/auth/signup',
  login: 'POST /api/auth/login',
  getMe: 'GET /api/users/me',
  updateMe: 'PATCH /api/users/me',
  createGroup: 'POST /api/groups',
  updateGroup: 'PATCH /api/groups/{id}',
  addMember: 'POST /api/groups/{id}/members',
  updateMember: 'PATCH /api/groups/{id}/members/{member_id}',
  removeMember: 'DELETE /api/groups/{id}/members/{member_id}',
  leaveGroup: 'DELETE /api/groups/{id}/members/me',
  getInvite: 'POST /api/groups/{id}/invites',
  resetInvite: 'POST /api/groups/{id}/invites/reset',
  joinInvite: 'POST /api/invites/{token}/join',
  acceptInvite: 'POST /api/members/{member_id}/accept',
  declineInvite: 'POST /api/members/{member_id}/decline',
  createExpense: 'POST /api/groups/{id}/expenses',
  updateExpense: 'PUT /api/expenses/{id}',
  deleteExpense: 'DELETE /api/expenses/{id}',
  restoreExpense: 'POST /api/expenses/{id}/restore',
  createSettlement: 'POST /api/groups/{id}/settlements',
  deleteSettlement: 'DELETE /api/settlements/{id}',
};

function withLog(name, fn) {
  const route = REST_ROUTES[name];
  if (!route) return fn;
  return async (...args) => {
    const ids = args.filter((a) => typeof a !== 'object');
    const path = route.replace(/\{\w+\}/g, () => ids.shift() ?? '?');
    const started = performance.now();
    try {
      const result = await fn(...args);
      logRest(path, performance.now() - started);
      return result;
    } catch (error) {
      logRest(path, performance.now() - started, error);
      throw error;
    }
  };
}

const all = { ...auth, ...groups, ...invites, ...expenses, ...settlements };

export const api = {
  ...Object.fromEntries(Object.entries(all).map(([name, fn]) => [name, withLog(name, fn)])),
  /** Demo only: put the sample data back. */
  resetDemo() {
    db.reset();
    notifyChange();
  },
};
