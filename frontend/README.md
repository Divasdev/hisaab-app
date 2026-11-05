# Hisaab frontend

React + Vite + react-router + Tailwind CSS, in JavaScript. It runs on mock data for now.

**Two APIs, on purpose:** screens **read** with **GraphQL** (one query per screen, `src/api/queries.js`),
buttons **write** with **REST** (`src/api/*.js`). Log in and sign up are REST. Open the browser console in dev
to see each call labelled REST or GraphQL.

## Run it

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

On the login screen, press **Try the demo account** (divas@hisaab.demo / demo1234).

Useful links while the dev server runs:

- `/join/join-demo`: a working invite link to a group you are not in yet
- `/join/expired-demo`: an expired invite link
- `/design`: every colour, text style and component on one page
- Account → **Reset demo data**: puts the sample data back

## Where things live

| Folder | What it holds |
| --- | --- |
| `src/pages/` | One file per screen. `pages/group/` holds the group screen and its tabs. |
| `src/components/` | Shared pieces. `components/ui/` holds buttons, cards, sheets, fields and bars. |
| `src/api/` | Every call the screens make. `graphql.js` + `queries.js` + `schema.graphql` for reads, the other files for REST writes. Today they use the mock database; later they call FastAPI. |
| `src/mock/` | The sample data (`seed.js`), the localStorage database (`db.js`), and mock GraphQL resolvers (`resolvers.js`). |
| `src/lib/` | Plain helpers: money, splitting, balances, dates, UPI links, springs. |
| `src/hooks/` | `useApi` (load data, reload after any change), scroll and title hooks. |
| `src/context/` | Logged-in user, light/dark theme, and toasts with Undo. |

## Connecting the real backend later

Only `src/api/` changes.

- REST: each function has a comment with its real endpoint, for example `/** POST /api/groups/{id}/expenses */`.
  Replace the body with a `fetch` call to that endpoint and keep calling `notifyChange()` after writes.
- GraphQL: in `src/api/graphql.js`, swap `mockTransport` for the `fetch` version written in the comment there
  (`POST /api/graphql` with `{ query, variables }`). The backend must match `src/api/schema.graphql`.
- Then delete `src/mock/` and uninstall the `graphql` package.
