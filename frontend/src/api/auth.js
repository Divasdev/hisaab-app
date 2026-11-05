import { request, fail, me, publicUser, nextId, setToken, clearToken } from './client';
import { UPI_ID_PATTERN } from '../lib/upi';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST /api/auth/signup  { name, email, password } -> { access_token, user } */
export function signup({ name, email, password }) {
  return request((s) => {
    name = name.trim();
    email = email.trim().toLowerCase();
    if (!name || name.length > 40) fail(422, 'Enter your name (up to 40 characters).');
    if (!EMAIL.test(email)) fail(422, 'Enter a valid email address.');
    if (password.length < 8) fail(422, 'Password must be at least 8 characters.');
    if (s.users.some((u) => u.email === email)) fail(409, 'An account with this email already exists. Try logging in.');
    // The real backend stores a bcrypt hash, never the password.
    const user = { id: nextId(s, 'user'), name, email, password, upi_id: null, created_at: new Date().toISOString() };
    s.users.push(user);
    const access_token = `mock.${user.id}`;
    setToken(access_token);
    return { access_token, user: publicUser(user) };
  }, { write: true });
}

/** POST /api/auth/login  { email, password } -> { access_token, user } */
export function login({ email, password }) {
  return request((s) => {
    const user = s.users.find((u) => u.email === email.trim().toLowerCase());
    if (!user || user.password !== password) fail(401, 'Wrong email or password.');
    const access_token = `mock.${user.id}`;
    setToken(access_token);
    return { access_token, user: publicUser(user) };
  });
}

/** GET /api/users/me -> user */
export function getMe() {
  return request((s) => publicUser(me(s)));
}

/** PATCH /api/users/me  { name?, upi_id? } -> user */
export function updateMe(changes) {
  return request((s) => {
    const user = me(s);
    if ('name' in changes) {
      const name = changes.name.trim();
      if (!name || name.length > 40) fail(422, 'Enter your name (up to 40 characters).');
      user.name = name;
    }
    if ('upi_id' in changes) {
      const upi = (changes.upi_id || '').trim();
      if (upi && !UPI_ID_PATTERN.test(upi)) fail(422, 'That UPI ID looks wrong. It should look like name@bank.');
      user.upi_id = upi || null;
    }
    return publicUser(user);
  }, { write: true });
}

export function logout() {
  clearToken();
}
