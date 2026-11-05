---
name: Hisaab
description: An expense splitter kept the way friends keep it on the last page of a notebook.
colors:
  ballpoint-blue: "#1d3f9e"
  ballpoint-blue-pressed: "#17337f"
  blue-wash: "#e9eefa"
  owe-red: "#c7352b"
  owe-red-wash: "#fbeceb"
  get-back-green: "#1f7a45"
  get-back-green-wash: "#e7f3eb"
  ink: "#1b1c1f"
  ink-muted: "#5d5f66"
  ink-faint: "#686b73"
  hairline: "#d9dbe0"
  rule-strong: "#b4b8c0"
  page: "#ffffff"
  page-tint: "#f6f7f9"
  sunken: "#eef0f3"
  toast-action: "#a9bdf7"
  night-page: "#121316"
  night-surface: "#17181c"
  night-page-tint: "#1c1e22"
  night-sunken: "#24262b"
  night-hairline: "#2c2f35"
  night-rule-strong: "#464a53"
  night-ink: "#eceef1"
  night-ink-muted: "#a6a9b1"
  night-ink-faint: "#9599a2"
  night-blue-fill: "#3c5bc9"
  night-blue-fill-pressed: "#4a68d4"
  night-blue-text: "#9bb2f6"
  night-blue-wash: "#1e2640"
  night-owe-red: "#f28b7f"
  night-owe-red-wash: "#2e1916"
  night-get-back-green: "#6fcf97"
  night-get-back-green-wash: "#15281d"
typography:
  display:
    fontFamily: "Martel, Georgia, Times New Roman, serif"
    fontSize: "52px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Martel, Georgia, Times New Roman, serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: "40px"
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Martel, Georgia, Times New Roman, serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: "32px"
    letterSpacing: "-0.01em"
  section:
    fontFamily: "Hind, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.25
  row-title:
    fontFamily: "Hind, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: "24px"
  row-amount:
    fontFamily: "Hind, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: "26px"
  body:
    fontFamily: "Hind, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "Hind, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  label:
    fontFamily: "Hind, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
  direction-word:
    fontFamily: "Hind, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: "18px"
rounded:
  tag: "5px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  sheet: "16px"
spacing:
  row-x: "4px"
  row-y: "14px"
  gutter: "16px"
  gutter-wide: "24px"
  section-top: "32px"
  section-bottom: "12px"
  sidebar: "300px"
  content-max: "672px"
components:
  button-primary:
    backgroundColor: "{colors.ballpoint-blue}"
    textColor: "{colors.page}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 16px 0"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.ballpoint-blue-pressed}"
  button-primary-lg:
    backgroundColor: "{colors.ballpoint-blue}"
    textColor: "{colors.page}"
    rounded: "{rounded.lg}"
    padding: "2px 20px 0"
    height: "56px"
  button-secondary:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ballpoint-blue}"
    rounded: "{rounded.md}"
    padding: "2px 16px 0"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.blue-wash}"
  button-danger:
    backgroundColor: "{colors.page}"
    textColor: "{colors.owe-red}"
    rounded: "{rounded.md}"
    height: "48px"
  button-quiet:
    textColor: "{colors.ballpoint-blue}"
    rounded: "{rounded.sm}"
    height: "40px"
  input:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "2px 14px 0"
    height: "48px"
  category-choice:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "2px 12px 0"
    height: "40px"
  category-choice-on:
    backgroundColor: "{colors.ballpoint-blue}"
    textColor: "{colors.page}"
  word-tag:
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.tag}"
    padding: "2px 6px 0"
    height: "24px"
  row:
    typography: "{typography.row-title}"
    padding: "14px 4px"
  tab-active:
    textColor: "{colors.ink}"
    height: "48px"
  avatar-me:
    backgroundColor: "{colors.ballpoint-blue}"
    textColor: "{colors.page}"
    rounded: "{rounded.sm}"
    size: "40px"
  avatar:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    size: "40px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.page}"
    rounded: "{rounded.lg}"
  sheet:
    backgroundColor: "{colors.page}"
    rounded: "{rounded.sheet}"
---

# Design System: Hisaab

## Overview

**Creative North Star: "The Last Page"**

Hisaab is kept the way friends already keep it on the last page of a hostel notebook: a white page, dark ink, totals written in ballpoint blue with a double underline, and anything paid struck through with one line. The system replaced an earlier look of rounded white cards, pastel icon tiles and an indigo accent, which the owner judged "AI-made". Nothing in this world is decoration; every mark on the page is something a person would write on paper while doing the hisaab.

Density is that of a page of writing, not a dashboard. Lists are rows on hairline rules with no box around them. Words do the work that icons and colour tiles did before: categories, group kinds and activity types are named, not drawn. One authored icon set exists only where a word cannot fit (back, close, copy, show password). Each screen has one main job and one filled blue button for it, placed at thumb height on phones.

Dark mode is the same notebook at night: a near-black page, light ink, a lighter ballpoint blue for text and lines, and a slightly brighter blue for fills. Motion is short and functional; the one signature movement is a single stroke drawn across a row when it is paid or deleted.

**Key Characteristics:**
- White page, dark ink, ballpoint blue as the only brand colour.
- Red and green appear only for money direction, always with a word beside them.
- Rows on hairlines; blocks ruled off between two hairlines; never rounded cards.
- Martel 800 for titles and totals, Hind for everything read and tapped.
- Notebook marks: double-underlined totals, struck-through settled lines, a drawn strike on paid or deleted rows.
- Flat surfaces; the only shadows belong to things that float (sheet, toast).

## Colors

A paper-and-ballpoint palette: neutral ink greys on white, one blue, and a red and green that only ever carry money direction.

### Primary
- **Ballpoint Blue** (ballpoint-blue): The only brand colour. As a fill it is the primary button, the "me" avatar plate, the brand mark and a chosen category. As text and line it is big totals, their double underline, links, outlined buttons, the active tab underline, focus rings and the text caret. In dark mode fills use Night Blue Fill and text and lines use Night Blue Text, so the blue keeps AA contrast on both jobs.
- **Ballpoint Blue Pressed** (ballpoint-blue-pressed): Hover and press colour of the filled button. The change is instant.
- **Blue Wash** (blue-wash): Hover and press background of outlined and quiet blue buttons; text selection.

### Secondary
- **Owe Red** (owe-red): "You owe", "owes", amounts you have to pay, field errors, the danger button outline and the confirm button of irreversible sheets.
- **Get-back Green** (get-back-green): "You get back", "gets back", amounts coming back to you.
- **Owe Red Wash / Get-back Green Wash** (owe-red-wash, get-back-green-wash): Press backgrounds for red controls; reserved soft tints for money states.

### Neutral
- **Ink** (ink): Body text, row titles, headings; the strike-draw line; the toast background in light mode.
- **Ink Muted** (ink-muted): Meta lines, hints, unselected tabs, "settled" amounts, ghost buttons.
- **Ink Faint** (ink-faint): Placeholders, chevrons, the payment arrow on the settle sheet.
- **Hairline** (hairline): Row rules, the rule above the bottom bar, the scrolled top bar rule, tab baseline. In `prefers-contrast: more` it darkens to #9a9ea6 and Ink Muted to #44464c.
- **Rule Strong** (rule-strong): Input borders, word-tag borders, outlined avatar plates, the sheet grabber, the amount field's underline at rest.
- **Page** (page): Page and surface; the light page is pure white, not off-white.
- **Page Tint** (page-tint): The laptop sidebar and row hover.
- **Sunken** (sunken): Pressed rows, icon-button hover, skeleton blocks.
- **Toast Action** (toast-action): The underlined Undo on the light-mode toast (dark ink toast).

### Named Rules
**The One Pen Rule.** Ballpoint blue is the only brand colour. No second accent, no per-person or per-category colours; people are told apart by initials and names.

**The Money Has Words Rule.** Red and green mean money direction and nothing else, and they never appear without a word ("you owe", "you get back", "owe", "get") or a sign beside them. Settled is Ink Muted, struck through.

**The Two Blues Rule.** Blue as a fill and blue as text are separate tokens because dark mode needs a brighter text blue than fill blue. Never use the fill blue for text on the dark page.

## Typography

**Display Font:** Martel (with Georgia, Times New Roman, serif), weights 700 and 800, self-hosted.
**Body Font:** Hind (with ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif), weights 400 to 700, self-hosted.

**Character:** Both faces are from Indian Type Foundry and cover Latin, the ₹ sign and Devanagari. Martel is the heading written at the top of the page and the total at the bottom; Hind is the plain hand that fills in the lines between.

### Hierarchy
- **Display** (Martel 800, 52px, 44px below 380px wide; 36px small size; line-height 1.15): The big total on home, group and expense detail, in Ballpoint Blue with a double underline. Also the amount being typed on the add-expense and payment screens.
- **Headline** (Martel 800, 32px/40px): The large page title ("Your hisaab", the group name).
- **Title** (Martel 800, 22px/32px): Sheet titles, empty-state headings, the wordmark (22px; 26px in the sidebar).
- **Section** (Hind 700, 20px): Section headers such as "Groups".
- **Row title** (Hind 600, 17px/24px) over **Meta** (Hind 400, 14px/20px, Ink Muted): Every list row.
- **Row amount** (Hind 700, 20px/26px; 19px on settle rows) under the **Direction word** (Hind 600, 13px/18px): The right side of rows.
- **Body** (Hind 400, 16px/1.5): Running text, capped near 42ch in empty states and 60ch in explanations.
- **Label** (Hind 600, 15px): Field labels and button text (buttons are 18px at lg, 16px at md, 15px at sm).

### Named Rules
**The Old-Style Total Rule.** Martel ships only old-style figures (its features are frac, liga and locl; there is no lnum or tnum), so big totals are set in old-style figures and the double underline sits at 0.34em below the text so descending digits clear it. Do not try to force lining figures in Martel.

**The Exact Paise Rule.** Hind has no tabular figures either. Right-aligned money columns line up by always showing paise (₹1,818.00, ₹0.00) in rows, sidebar balances and settle rows. Prose and summary lines may drop ".00". Money is always in Indian grouping (₹1,20,000).

**The Optical Centre Rule.** Hind sits high in its box, so buttons, inputs, tabs, tags and avatars add 2px of top padding to look centred.

## Layout

Mobile-first single column. Content is centred at a maximum of 672px with 16px side gutters (24px from 640px up). A list row has 14px vertical and 4px horizontal padding; sections open with 32px above the header and 12px below it. Page rhythm between blocks is 20px to 32px (big total 28px under the title, its split lines 20px under the total).

The top bar is 56px tall, solid page colour, with the back link left, a centred small title that appears only after the large title scrolls away, and actions right; a hairline appears under it once the page scrolls. The bottom bar is sticky, holds the screen's one main action as a full-width 56px blue button, and sits above a hairline with safe-area padding.

From 1024px (lg) the app shell becomes a 300px sidebar on Page Tint (wordmark, Overview, groups with one-line balances, account at the foot) beside the content column. On home and group screens the bottom bar is hidden at lg and the main action moves into the title or actions row; other screens keep the bottom bar. Sheets are full-width bottom sheets on phones and float 16px above the bottom edge, at most 512px wide, from 640px.

**The One Job Rule.** Each screen has one filled blue button. Everything else is outlined, quiet (underlined text) or a row.

## Elevation & Depth

The page is flat. Depth is shown with hairlines and the Page Tint and Sunken tones, never with shadows on content. Only two things float above the page and only they cast shadows: the bottom sheet (over a scrim of ink at 42% light, black at 60% dark) and the toast. There is no blur anywhere.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 -8px 32px -12px rgb(0 0 0 / 0.22)`): Under the edge of a bottom sheet.
- **Toast** (`box-shadow: 0 10px 28px -10px rgb(0 0 0 / 0.35)`): Under the dark toast that carries Undo.

### Named Rules
**The Paper Is Flat Rule.** Content never lifts. If something needs separating, rule it off with a hairline.

## Shapes

Small, firm corners on controls; no corners on content. Buttons use 8px (sm), 10px (md) and 12px (lg) radii; inputs, form-error boxes and the category choices use 10px or 8px; word tags and the smallest avatar use 5px; the sheet top uses 16px. Nothing is a pill; the only circle is the loading spinner. Outlined controls use a 1.5px stroke; the active tab underline is 2.5px; the amount field underline is 2px. People are square initial plates (8px radius at 40px), filled blue for "me", outlined for members, dashed for people added by name who have not joined. The favicon and brand mark are a blue square with a ₹ drawn in white.

Icons are authored on a 20px grid with 2px strokes, square ends and mitred corners, drawn as outlines only.

**The Ruled Block Rule.** Lists and blocks (invites, notes, empty states, the "Why these payments?" disclosure) are ruled off by a hairline above and below. They are never rounded, bordered boxes.

## Components

### Buttons
Plain and firm; colour changes on press, nothing moves.
- **Shape:** 10px radius at 48px tall (md), 12px at 56px (lg, bottom bar), 8px at 40px (sm).
- **Primary:** Ballpoint Blue fill, white Hind 600 label, optional 16 to 18px icon before the label.
- **Hover / Focus:** Instant change to Ballpoint Blue Pressed; no transition, no lift, no scale. Focus is a 2px blue outline offset 2px. Disabled is 45% opacity.
- **Secondary:** 1.5px blue outline, blue label on the page colour, Blue Wash on hover and press. ("Tinted" is an alias of this.)
- **Danger:** Same shape with an Owe Red outline and label.
- **Quiet:** Blue text with a 1.5px underline offset 4px, for links such as "Members and invite" and "Add note".
- **Ghost / Icon button:** Ink Muted, 44px square, Sunken on hover.
- **Irreversible confirm:** Only in the confirm sheet (leave group, remove member), a 56px Owe Red filled button over a plain Cancel. Reversible actions use Undo in a toast instead.

### Word tags and choices
- **Word tag:** 24px tall, 5px radius, 1px Rule Strong border, Ink Muted Hind 600 at 12px ("Food", "Trip"). Replaces icon tiles; never coloured.
- **Category choice:** 40px, 8px radius, 1.5px Rule Strong outline, Ink label; chosen is filled Ballpoint Blue with white text.

### Cards / Containers
- **Corner Style:** None. A Card is a block between two hairlines with 16px vertical and 4px horizontal padding.
- **Background:** The page colour.
- **Shadow Strategy:** None (see Elevation & Depth).
- **Border:** Hairline top and bottom only.

### Lists and rows
Rows on hairlines, title and meta left, direction word over the amount right, optional chevron in Ink Faint. Tappable rows tint to Page Tint on hover and Sunken on press. Settled rows strike through their title and amount. Date group headers ("Today", "Yesterday") are Hind 600 at 14px in Ink Muted, sentence case.

### Inputs / Fields
- **Style:** 48px tall, 10px radius, 1.5px Rule Strong border on the page colour, Hind 16px; label above in Hind 600 15px, hint or error below at 14px.
- **Focus:** Border turns blue and a 2px blue outline sits 2px outside.
- **Error:** Owe Red border and an Owe Red message under the field. Form-level errors are a 10px-radius Owe Red outlined box with role alert.
- **Amount entry:** The amount is written in Martel in Ballpoint Blue on a 2px underline (Rule Strong at rest, blue when focused); no box.

### Navigation
- **Tabs (Segmented):** Words on a line, equal columns, 48px tall over a hairline. The active tab is Ink, Hind 600, with a 2.5px blue underline; others are Ink Muted. Arrow keys move between tabs.
- **Top bar:** Back link in blue Hind 500 17px with a chevron; the small centred title fades in over 150ms after scrolling.
- **Sidebar (lg):** Page Tint background, hairline on its right. Items are 44px tall; the active item is Ink and Hind 600, others Ink Muted. Each group carries a one-line balance ("owe ₹1,818.00", "get ₹79.25", or "settled").

### Big Total (signature)
A direction line in red, green or Ink Muted ("You owe, overall"), then the figure in Martel 800 at 52px in Ballpoint Blue with a 2px double underline at 0.34em offset, then plain lines splitting it ("₹10,611.34 to pay in 2 groups"). When nothing is owed the figure is replaced by words ("All settled up") with no underline.

### Strike-draw (signature interaction)
When a payment is marked paid or an expense is deleted, one 1.5px Ink line is drawn across the row from left to right in 220ms (ease cubic-bezier(0.22, 1, 0.36, 1)), with Undo offered in the toast. Already-settled lines show a static 1.5px line-through in the current colour.

### Sheet and toast
- **Sheet:** Solid surface, 16px top radius, hairline top edge, 40 by 4px grabber, Martel title at 22px, a close icon button, footer above a hairline. Opens on a critically damped spring with no bounce; drag down or flick to close.
- **Toast:** Ink background with page-coloured text (inverted in dark mode), 12px radius, rises 12px and fades in over 200ms, sits above the bottom bar, carries an underlined Undo.

### Motion
Short and functional: fade 160ms, rise 200ms, strike 220ms, sheet springs. Nothing animates on hover. Under reduced motion every animation and transition is cut to 1ms, so things simply appear.

## Do's and Don'ts

### Do:
- **Do** write every total in Martel 800 Ballpoint Blue with the 2px double underline at 0.34em offset.
- **Do** pair every red or green amount with a word ("you owe", "you get back", "owe", "get") and show "settled" in Ink Muted, struck through.
- **Do** show paise (₹1,818.00) in every right-aligned money column so figures line up without tabular fonts; use Indian grouping everywhere.
- **Do** build lists as rows on hairlines and blocks as a hairline above and below.
- **Do** give each screen one filled blue button, in a sticky bottom bar on phones; at lg on home and group, move it into the title or actions row.
- **Do** name things with words or word tags; use the authored 20px icon set only where a word cannot fit.
- **Do** strike through what is paid or deleted with the single drawn stroke and offer Undo, keeping confirm sheets for irreversible actions only.
- **Do** keep 44px minimum tap targets, the 2px blue focus outline and AA contrast in both themes.

### Don't:
- **Don't** use rounded, bordered or shadowed cards for content, or pastel icon tiles, or an indigo accent (the rejected previous look).
- **Don't** add a second accent colour or colour-code people or categories.
- **Don't** use red or green for anything other than money direction.
- **Don't** add ruled-paper backgrounds, margin lines or handwriting fonts; the notebook lives in the marks, not in a paper texture.
- **Don't** use Lucide icons or icon sets drawn in the Lucide style (rounded caps and joins); icons keep square ends and mitred corners.
- **Don't** use emojis.
- **Don't** use liquid glass, frosted glass or backdrop blur; bars and sheets are solid.
- **Don't** put em dashes in any copy.
- **Don't** use Inter, Geist or Space Grotesk.
- **Don't** lay out feature cards in a row.
- **Don't** use bento grids.
- **Don't** use a purple and black colour scheme.
- **Don't** use radial orbs.
- **Don't** use dot grids.
- **Don't** use sparkle icons.
- **Don't** use animated arrows.
- **Don't** animate anything on hover; hover is an instant colour change only.
- **Don't** use rainbow colouring.
- **Don't** use gradients.
- **Don't** add uppercase eyebrow labels or kickers above titles.
- **Don't** make buttons into pills.
