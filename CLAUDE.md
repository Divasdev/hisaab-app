# Hisaab — project context

Hisaab is an expense splitter for hostel rooms, flats and trips. Friends make a group, add
expenses ("I paid ₹1,200 for dinner, split between 4"), see who owes whom, and settle up
with one tap that opens a UPI payment (`upi://pay?...`) for the exact amount.

Owner: Divas Sharma (credit this name in the app, never the email name). IIT Madras BS
Data Science student. Built SnipShare (FastAPI + SQLModel + Postgres + Alembic + JWT,
deployed on Render + Vercel). This is the next intermediate project to keep backend skills sharp.

## Who does what (important)

- **Claude builds the frontend** in `frontend/` (React + Vite, JavaScript, react-router — same
  setup as SnipShare's frontend). First with mock data, then connected to the real API.
- **Divas writes the whole FastAPI backend** in `backend/`. Do not write backend features for
  them. Explain the cause before the fix, one step at a time, help when stuck. Drafting
  repetitive code (seed data, test fixtures) for them to read is fine.
- No `Co-Authored-By: Claude` line on git commits.
- They sometimes run the same prompt in Codex in parallel: list the folder again right before
  writing, never overwrite files Claude did not create.

## Order of work

1. **UI** (now): research real expense-splitting apps (Splitwise, Tricount, Settle Up, Splid,
   Google Pay split) and UI/UX principles, then design and build a polished, easy UI in
   `frontend/` with mock data.
2. **API contract**: agree endpoints and JSON shapes from the UI.
3. **Tickets**: a build board for the backend, as a standalone `.html` (progress in
   localStorage), same format as `~/Desktop/Home/SnipShare-Build-Board.html`: stages,
   ticket IDs, steps, "done when", copy-as-prompt.
4. **Backend**: Divas builds ticket by ticket; Claude reviews and unsticks.
5. **Connect** frontend to the real API.

## UI direction (user's taste, from past feedback)

- Must not look AI-made. with glassmorphism, no blurred colour blobs, no gradients for decoration.
- Plain off-white page, white cards with thin borders, one muted accent colour, clear type.
- One job per screen; few elements; mobile-first (people add expenses on their phones).
- Apply UI/UX psychology with reasons: Hick's law (few choices), Fitts's law (big thumb-reach
  primary button), clear money colours (owed to you vs you owe, plus a sign/word, not colour
  alone), recognition over recall, immediate feedback, undo instead of "are you sure?" where safe,
  friendly empty states, rounded but not pill-everything buttons, ₹ formatting in Indian style
  (₹1,20,000).
- Accessible: contrast AA, focus states, works in dark mode too.

## Product scope (v1)

- Sign up / log in.
- Groups: create, invite link that expires in 24 h, members with an admin role.
- Expenses: amount, paid by, split equally / by exact amounts / by shares, category, date, note.
- Balances: per group and overall ("you owe ₹340", "you are owed ₹1,200").
- Settle up: fewest payments to clear the group (greedy + heaps), UPI deep link, mark as paid.
- Activity feed per group.

## Backend skills this project should teach (beyond SnipShare)

Many-to-many with roles (group_members) · transactions (expense + splits saved together) ·
money as integer paise, leftover-paisa rule · SQL SUM/GROUP BY for balances · permission
check on every request (members only) · signed expiring invite tokens · debt simplification
algorithm · fixing N+1 (selectinload) · pytest against a real test Postgres · optional GitHub
Actions CI.

Stack: FastAPI, PostgreSQL, SQLAlchemy/SQLModel, Alembic, JWT. Nothing new to install.

## Schedule constraints

IITM term comes first: Quiz 1 2026-11-15, Quiz 2 2026-12-05, MAD1 project due 2026-12-10,
end term 2027-01-10. Pace about 1 hour a day for Divas; 25-ish tickets, 4–5 weeks.

## Learning style

Plain, literal sentences. One idea at a time, quick check before moving on. No hype words,
no metaphors.

## Skills

Use the `apple-design` skill (installed globally) for motion, sheets, swipe gestures,
typography and feedback. Do not use its translucent/frosted materials: the no-glass rule above wins.
