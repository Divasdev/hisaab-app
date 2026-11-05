---
version: 1
slug: "frontend"
primary_target: "frontend"
related_targets: []
---

# Hisaab app (all screens)

Scope: every logged-in and logged-out screen of the React app in `frontend/`. Mode: Operate. Audience, job and constraints live in PRODUCT.md. Chosen sketch: `.impeccable/mocks/decision/notebook.html` (home screen, 390 x 844).

## Direction contract

THESIS: Hisaab keeps the hisaab the way friends already keep it on the last page of a notebook: ballpoint-blue totals with a crisp double underline, paid lines struck through. It refuses the category default the old app shipped: rounded white cards, pastel icon tiles, avatar rows and an indigo accent.

OWN-WORLD: White page, ink #1b1c1f, ballpoint blue #1d3f9e as the only brand colour (totals, primary buttons, links, focus), owe red #c7352b, get-back green #1f7a45, muted #5d5f66, hairline rules #d9dbe0. Dark mode is the same notebook at night: near-black page, light ink, a lighter ballpoint blue. Martel 800 for titles and totals, Hind for all UI text, tabular figures for money. Lists are rows on hairline rules, never cards. Words replace icon tiles; a small authored icon set only where a word cannot go. No ruled-paper backgrounds, margin lines or handwriting fonts.

STORY: A friend opens the app, reads what they owe or get back in one look, adds an expense in a few taps with one thumb, and settles up through UPI; anything paid or settled is struck through, the way it would be on paper.

FIRST VIEWPORT: Home on a phone. Top bar: Hisaab wordmark left, account initials square right. "Hi, Divas", then the title "Your hisaab". Direction line in red or green ("You owe, overall"), the overall total in Martel at about 52px in ballpoint blue with a double underline, then two plain lines splitting it. "Groups" heading with an outlined blue "New group" button. Group rows: name and meta left, direction word over amount right; settled groups struck through. Sticky bottom bar with one full-width blue "Add expense" button at thumb height.

FORM: Last Page (a hostel notebook's hisaab page), first on my ordered list in re-roll round 1, chosen as Impeccable's pick. seed:1f9134174f5aef0c. Signature interaction: marking something paid or deleting it draws one strike-through line across the row (a single short stroke), with Undo. Motion is short and functional; nothing animates on hover.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Desktop layout keeps the sidebar of groups; the world must hold at 1280 to 1600px wide.
