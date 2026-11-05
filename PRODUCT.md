# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three groups, weighted equally (confirmed by Divas, 2026-11-05):

- Hostel and college friends in India: shared rooms, mess extras, chai, printouts, small amounts many times a week.
- Flatmates who work: rent, electricity, wifi, groceries, a monthly rhythm with bigger amounts.
- Friends on a trip: a short-lived group with many expenses in a few days, settled at the end.

Most people add an expense on a phone, standing up, right after paying. Laptop use is secondary (checking balances, settling up).

## Product Purpose

Hisaab is an expense splitter. Friends make a group, add expenses ("I paid ₹1,200 for dinner, split between 4"), see who owes whom, and settle up with one tap that opens a UPI payment for the exact amount. Success means a group can stop keeping the hisaab in their heads or in a WhatsApp chat, and nobody feels awkward asking for money back.

It is also a learning project: Divas Sharma writes the FastAPI backend by hand; the frontend runs on mock data until the API is connected.

## Positioning

Confirmed differences from Splitwise:

1. Settle up opens a UPI app (GPay, PhonePe, Paytm) with the exact amount already filled in (`upi://pay?...`).
2. Friends can be added by name and split with before they sign up; they claim their name later from an invite link.
3. Indian-first details: ₹ in Indian grouping (₹1,20,000), exact paise, Indian contexts (hostel, mess, PG, flat, trip).
4. Free with no limits: no daily expense cap, no paywall.

## Operating Context

- Groups: create, invite link that expires in 24 hours, members with an admin role, members by name before they join.
- Expenses: amount, paid by, split equally / by exact amounts / by shares, category, date, note. Delete has undo.
- Balances: per group and overall ("you owe ₹340", "you get back ₹1,200").
- Settle up: the fewest payments that clear the group, a UPI deep link per payment, mark as paid.
- Activity feed per group and across groups.
- Demo account on the login screen (`divas@hisaab.demo`) with seeded groups: Room 204 Godavari, Flat 3B Koramangala, Goa trip, Navratri dandiya night, PG Indiranagar.

## Capabilities and Constraints

- Frontend: React 19 + Vite + react-router 7 + Tailwind CSS 4, JavaScript. No UI library.
- Screens call only `src/api/*.js`; reads go through GraphQL, writes through REST. The mock backend runs in the browser and keeps data per browser.
- Money is integer paise everywhere; leftover paise go one each by ascending member id.
- Light and dark mode both required (follows the phone setting, with a switch in Account).
- Terminology: "group", "expense", "settle up", "you owe", "you get back", "settled".

## Brand Commitments

- Name: Hisaab. Credit "Divas Sharma" as the maker, never the email name.
- Voice: plain English with a few natural Hindi words where they fit (hisaab, barabar for settled). Reads like friends texting, not like a bank.
- Binding bans set by Divas (2026-11-05). None of these may appear anywhere in the product:
  1. Lucide icons (or icon sets drawn in the Lucide style)
  2. Emojis
  3. Liquid glass / frosted glass / backdrop blur
  4. Em dashes in any copy
  5. Inter, Geist, Space Grotesk fonts
  6. Feature cards in a row
  7. Bento grids
  8. Purple and black colour scheme
  9. Radial orbs
  10. Dot grids
  11. Sparkle icons
  12. Animated arrows
  13. Hover animations
  14. Rainbow colouring
  15. Gradients
- The current look (off-white page, identical white bordered cards, indigo accent, pastel icon tiles) was judged "AI-made" by Divas and is an anti-reference.

## Evidence on Hand

- Seed data in `frontend/src/mock/seed.js` (Indian names, real-feeling groups and amounts). It is demo data, not real users.
- No testimonials, user counts, or press. Do not invent any.

## Product Principles

1. Adding an expense is the main job; it must be fast with one hand on a phone.
2. Money direction is never ambiguous: owe and get back always carry a word or sign, never colour alone.
3. Undo instead of "are you sure?" wherever the action is safe to reverse.
4. A friend who has never used the app understands each screen without a tutorial.
5. Exactness is respect: amounts are to the paisa, and the app shows its working when it splits.

## Accessibility & Inclusion

WCAG AA contrast in light and dark mode, visible focus states, tap targets of at least 44px, reduced motion respected. Works on cheap Android phones over slow networks.
