// Demo data that looks like a real student's Hisaab: a hostel room, a flat, a trip, a settled group,
// and a PG where someone added Divas by email (so the in-app invite can be tried).
// Dates are relative to today so the demo always looks fresh. Money is in paise.
//
// People inside a group are MEMBERS. A member either has an account (user_id set, "joined")
// or is just a name someone typed (user_id null, "not joined yet") until they claim it.
import { computeSplits } from '../lib/split';
import { toISODate } from '../lib/dates';

const rs = (rupees) => Math.round(rupees * 100);

function at(daysAgo, hour = 20, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  // Today's demo entries get a time in the recent past (later hour = more recent), never the future.
  if (d > new Date()) d.setTime(Date.now() - ((24 - hour) * 7 + 5) * 60_000);
  return d;
}

export function createSeed() {
  const s = {
    version: 2,
    seq: { user: 0, group: 0, member: 0, expense: 0, settlement: 0, activity: 0 },
    users: [],
    groups: [],
    members: [],
    expenses: [],
    settlements: [],
    invites: [],
    activity: [],
  };
  const next = (k) => ++s.seq[k];

  const user = (name, email, upi_id, daysAgo = 60) => {
    const u = { id: next('user'), name, email, password: 'demo1234', upi_id, created_at: at(daysAgo).toISOString() };
    s.users.push(u);
    return u.id;
  };
  const log = (group_id, actor_id, type, data, when) =>
    s.activity.push({ id: next('activity'), group_id, actor_id, type, data, created_at: when.toISOString() });

  /** people: user ids (joined) or { name, email } (added by name). Returns { id, ids } with member ids in order. */
  const group = (name, kind, adminId, daysAgo, people) => {
    const id = next('group');
    const created = at(daysAgo, 18);
    s.groups.push({ id, name, kind, created_by: adminId, created_at: created.toISOString() });
    log(id, adminId, 'group_created', { name }, created);
    const ids = people.map((p, i) => {
      const when = new Date(created.getTime() + i * 3600_000).toISOString();
      const mid = next('member');
      if (typeof p === 'number') {
        const u = s.users.find((x) => x.id === p);
        s.members.push({ id: mid, group_id: id, user_id: p, name: u.name, invite_email: null, role: p === adminId ? 'admin' : 'member', added_by: adminId, added_at: when, joined_at: when, removed_at: null });
        if (p !== adminId) log(id, p, 'member_joined', { member_id: mid }, new Date(when));
      } else {
        s.members.push({ id: mid, group_id: id, user_id: null, name: p.name, invite_email: p.email || null, role: 'member', added_by: adminId, added_at: when, joined_at: null, removed_at: null });
        log(id, adminId, 'member_added', { member_id: mid, name: p.name }, new Date(when));
      }
      return mid;
    });
    return { id, ids };
  };

  const memberUser = (mid) => s.members.find((m) => m.id === mid).user_id;

  const expense = (group_id, { description, amount, paidBy, category, daysAgo, hour = 20, split = 'equal', among, exact, shares, note = '' }) => {
    const when = at(daysAgo, hour);
    const amount_paise = rs(amount);
    let input;
    if (split === 'equal') input = among.map((member_id) => ({ member_id }));
    if (split === 'exact') input = Object.entries(exact).map(([id, v]) => ({ member_id: Number(id), amount_paise: rs(v) }));
    if (split === 'shares') input = Object.entries(shares).map(([id, v]) => ({ member_id: Number(id), shares: v }));
    const createdBy = memberUser(paidBy) ?? s.groups.find((g) => g.id === group_id).created_by;
    const e = {
      id: next('expense'),
      group_id,
      description,
      amount_paise,
      paid_by: paidBy,
      split_type: split,
      category,
      date: toISODate(when),
      note,
      created_by: createdBy,
      created_at: when.toISOString(),
      updated_at: when.toISOString(),
      deleted_at: null,
      splits: computeSplits({ amount_paise, split_type: split, splits: input }),
    };
    s.expenses.push(e);
    log(group_id, createdBy, 'expense_added', { expense_id: e.id, description, amount_paise }, when);
    return e;
  };

  const payment = (group_id, from, to, amount, daysAgo, method = 'upi') => {
    const when = at(daysAgo, 13);
    const by = memberUser(from) ?? memberUser(to);
    const p = { id: next('settlement'), group_id, from_member_id: from, to_member_id: to, amount_paise: rs(amount), method, created_by: by, created_at: when.toISOString() };
    s.settlements.push(p);
    log(group_id, by, 'payment_added', { settlement_id: p.id, from_member_id: from, to_member_id: to, amount_paise: p.amount_paise }, when);
  };

  // ── People with accounts ──
  const divas = user('Divas Sharma', 'divas@hisaab.demo', 'divas@demo', 90);
  const aman = user('Aman Verma', 'aman@hisaab.demo', 'aman@demo');
  const karan = user('Karan Mehta', 'karan@hisaab.demo', 'karan@demo');
  const rohit = user('Rohit Nair', 'rohit@hisaab.demo', null);
  const riya = user('Riya Iyer', 'riya@hisaab.demo', 'riya@demo');
  const sneha = user('Sneha Reddy', 'sneha@hisaab.demo', 'sneha@demo');
  const priya = user('Priya Das', 'priya@hisaab.demo', 'priya@demo');
  const arjun = user('Arjun Singh', 'arjun@hisaab.demo', 'arjun@demo');
  const meera = user('Meera Joshi', 'meera@hisaab.demo', 'meera@demo');

  // ── Room 204 (hostel): everyone has joined ──
  const room = group('Room 204, Godavari', 'hostel', divas, 40, [divas, aman, karan, rohit]);
  const [rD, rA, rK, rR] = room.ids;
  const wifi = expense(room.id, { description: 'Wi-Fi recharge', amount: 999, paidBy: rD, category: 'bills', daysAgo: 12, among: room.ids, note: 'Airtel 3 months, 100 Mbps' });
  log(room.id, divas, 'expense_edited', { expense_id: wifi.id, description: 'Wi-Fi recharge', changes: ['amount'] }, at(12, 21));
  expense(room.id, { description: 'Night canteen Maggi', amount: 240, paidBy: rA, category: 'food', daysAgo: 6, hour: 23, among: room.ids });
  expense(room.id, { description: 'Cleaning supplies', amount: 360, paidBy: rK, category: 'household', daysAgo: 4, hour: 11, among: room.ids });
  payment(room.id, rK, rD, 250, 2);
  expense(room.id, { description: 'Midnight Swiggy order', amount: 1140, paidBy: rR, category: 'food', daysAgo: 1, hour: 23, split: 'exact', exact: { [rD]: 320, [rA]: 280, [rK]: 240, [rR]: 300 } });
  expense(room.id, { description: 'Printer paper', amount: 180, paidBy: rD, category: 'household', daysAgo: 0, hour: 10, among: [rD, rK] });
  expense(room.id, { description: 'Chai and samosa', amount: 160, paidBy: rA, category: 'food', daysAgo: 0, hour: 17, among: room.ids });

  // ── Flat 3B (flat) ──
  const flat = group('Flat 3B, Koramangala', 'flat', riya, 75, [riya, divas, sneha]);
  const [fRi, fD, fS] = flat.ids;
  expense(flat.id, { description: 'Gas cylinder', amount: 903, paidBy: fD, category: 'bills', daysAgo: 9, hour: 9, among: flat.ids });
  expense(flat.id, { description: 'BESCOM electricity', amount: 2340, paidBy: fS, category: 'bills', daysAgo: 5, hour: 19, among: flat.ids });
  expense(flat.id, { description: 'November rent', amount: 36000, paidBy: fRi, category: 'rent', daysAgo: 3, hour: 10, split: 'shares', shares: { [fRi]: 2, [fD]: 1, [fS]: 1 }, note: 'Riya has the big room, so 2 shares' });
  expense(flat.id, { description: 'Maid salary', amount: 4500, paidBy: fD, category: 'household', daysAgo: 2, hour: 9, among: flat.ids });
  payment(flat.id, fD, fRi, 5000, 1);
  expense(flat.id, { description: 'Blinkit groceries', amount: 1876, paidBy: fRi, category: 'groceries', daysAgo: 1, hour: 20, split: 'exact', exact: { [fRi]: 712, [fD]: 640, [fS]: 524 } });

  // ── Goa trip: Kabir was added by name and has not joined Hisaab ──
  const goa = group('Goa trip, October', 'trip', arjun, 32, [arjun, divas, aman, riya, priya, { name: 'Kabir' }]);
  const [gAr, gD, gA, gRi, gP] = goa.ids;
  const five = [gAr, gD, gA, gRi, gP];
  expense(goa.id, { description: 'Flights BLR to GOI', amount: 42500, paidBy: gAr, category: 'travel', daysAgo: 30, hour: 15, among: five });
  expense(goa.id, { description: 'Villa in Assagao, 3 nights', amount: 48000, paidBy: gP, category: 'stay', daysAgo: 28, hour: 12, among: five });
  expense(goa.id, { description: 'Scooter rental', amount: 3600, paidBy: gA, category: 'travel', daysAgo: 20, hour: 10, among: five });
  expense(goa.id, { description: 'Dinner at the beach shack', amount: 4820, paidBy: gD, category: 'food', daysAgo: 19, hour: 21, among: goa.ids, note: 'Kabir joined us for dinner' });
  expense(goa.id, { description: 'Parasailing', amount: 6000, paidBy: gRi, category: 'fun', daysAgo: 18, hour: 16, among: [gRi, gP, gD] });
  expense(goa.id, { description: 'Fuel', amount: 1200, paidBy: gA, category: 'travel', daysAgo: 18, hour: 9, among: goa.ids });
  expense(goa.id, { description: 'Cab to the airport', amount: 1450, paidBy: gRi, category: 'travel', daysAgo: 17, hour: 6, among: five });
  payment(goa.id, gD, gAr, 8500, 10);

  // ── Navratri (settled) ──
  const nav = group('Navratri dandiya night', 'other', divas, 26, [divas, aman, sneha]);
  const [nD, nA, nS] = nav.ids;
  expense(nav.id, { description: 'Dandiya passes', amount: 1500, paidBy: nD, category: 'fun', daysAgo: 25, hour: 19, among: nav.ids });
  payment(nav.id, nA, nD, 500, 24);
  payment(nav.id, nS, nD, 500, 23, 'cash');

  // ── PG Indiranagar: Meera added "Divas" by email (in-app invite) and "Tanvi" by name ──
  const pg = group('PG Indiranagar', 'flat', meera, 14, [meera, sneha, { name: 'Divas', email: 'divas@hisaab.demo' }, { name: 'Tanvi' }]);
  const [pM, pS, pD] = pg.ids;
  expense(pg.id, { description: 'Water cans', amount: 480, paidBy: pM, category: 'bills', daysAgo: 3, among: [pM, pS, pD] });
  s.invites.push({ token: 'join-demo', group_id: pg.id, created_by: meera, created_at: at(0, 8).toISOString(), expires_at: new Date(Date.now() + 20 * 3600_000).toISOString(), revoked: false });
  s.invites.push({ token: 'expired-demo', group_id: pg.id, created_by: meera, created_at: at(3).toISOString(), expires_at: at(2).toISOString(), revoked: false });

  return s;
}
