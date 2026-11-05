// The mock database: one JSON object saved in localStorage, shaped like the future Postgres tables
// (users, groups, members, expenses + splits, settlements, invites, activity).
import { createSeed } from './seed';
import { notifyChange } from '../api/events';

const KEY = 'hisaab.mockdb.v2'; // v2: people in a group are members (joined or added by name)

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.version === 2) return saved;
  } catch {
    /* corrupted or blocked storage: start fresh */
  }
  return null;
}

export const db = {
  state: load() || createSeed(),
  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch {
      /* private mode: data lives in memory only */
    }
  },
  reset() {
    this.state = createSeed();
    this.save();
  },
};
db.save();

// Keep two open tabs in sync.
window.addEventListener('storage', (e) => {
  if (e.key !== KEY) return;
  const fresh = load();
  if (fresh) {
    db.state = fresh;
    notifyChange();
  }
});
