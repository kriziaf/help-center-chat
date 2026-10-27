---
name: chat-journey
description: Build and maintain the Figma file for the MDLive help-center chat's entry journeys (A Popular Topics, B Ask MD Live, C Ask about conditions). Use when asked to create, update, or sync the journey screens, the low-fi flow, the frontmatter, or the knowledgebase page in Figma from this repo's real UI and content. Covers reading the specs, capturing the running app, matching the repo's design tokens, keeping the UI and low-fi pages in parity, and the Figma Plugin API traps found along the way.
---

# chat-journey

Turns this repo's chat popup into a Figma file with four pages. The repo is the source of truth;
Figma is generated from it. Never hand-type content that exists in the repo.

## Figma file and pages

File key `jDdzID3rZsXqPIE3Vfek7x` (team "Femmecubator"). Reference/readout file the work was
modeled on: `z05Hd5jFPKUQ3BZczwXE2T`.

| Page | Purpose |
|---|---|
| Frontmatter | Explainer cards: summary, Journey A/B/C, edge cases, how to read, open items, Knowledgebase |
| User Journey lowfi | Flow only, no screens. v1 schematic look (Inter, blue-outline chips, grey connectors) |
| User Journeys - UI | Screens built from the repo's real UI, one popup per step |
| Knowledgebase | Tables generated from repo content (see `KNOWLEDGEBASE_SPEC.md`, parked) |

Page names can contain trailing spaces (e.g. `"Knowledgebase "`). Find pages by id or by
`startsWith`, not exact name.

## Sources to read first

1. `ENTRY_FLOWS_SPEC.md` for the three flows and their rules.
2. `src/config/smartFlow.ts` for Journey B script text (exact wording).
3. `src/config/conditionsFlow.ts` for Journey C (15 conditions; Cough / Respiratory and
   Headache have a nested level).
4. `src/styles/helpcenter.css` for design tokens. `src/app/App.tsx` for structure.
5. `KNOWLEDGEBASE_SPEC.md` for the parked knowledgebase plan.

Journey facts verified in the running app:
- Entry menu order: Ask MD Live, Popular Topics, Ask about conditions (buttons, not chips).
- A: Popular Topics → General Info chips (MDLIVE Access & Setup, Account Security & Privacy,
  MDLIVE Service Basics) → article card → "View article" opens the Articles tab.
- B: menopause → prescriptions → GLP-1s → cost → insurance → closing; branches peds-bridge
  and dead-end (1-800-400-6354). Ask MD Live starts with the bot message, no user bubble.
- C: use the **Headache** example: Headache → Headache Types → Migraine Headache. The conditions
  list in the real app has no Menopause chip.
- The real app shows one growing thread; in Figma each screen shows only the **last turn**.

## Workflow

1. **Run the app.** `npm ci`, then `npx vite --port 5173` (in the background). Drive it with
   `playwright-core` (`/opt/pw-browsers/chromium`, `--no-sandbox`); click the `.fab`, then
   buttons by role/name. Screenshot `.chat-popup` and print `.msg-row` / `.chip-btn` text.
   Google Fonts is blocked by the proxy, so browser captures use a fallback font; Figma should
   use true Montserrat.
2. **Extract icons.** Pull the exact Phosphor SVGs from the DOM (`outerHTML` of the toolbar,
   entry buttons, send, avatar, file icon). Import with `figma.createNodeFromSvg` and set
   `fill` on the root `<svg>` to the token color. Never redraw icons.
3. **Tokens.** Create a variable collection "Repo tokens" from `:root` in `helpcenter.css`
   (surface, text, border, fill) and bind every fill and stroke to it.
4. **Components** (on the UI page, own copies): Chip, Bubble / Bot, Bubble / User, Bot Avatar,
   Entry Button x3, Toolbar (with and without back), Tabs (Conversation / Articles active),
   Composer, Greeting, Article Card. Text via component properties.
5. **Screens.** Popup 320 px wide, padding 14, radius 12, 0.5 px border, popover shadow.
   Message content max width 226 (78%). Chip rows wrap at 226. Arrows between screens carry a
   "tap …" label. Branches sit in a second row under the screen they come from.
6. **Lowfi page.** Same steps, same order, same column positions as the UI page (nodes
   centered in the same 320 px columns). Condensed text, v1 look. Keep step ids identical.
7. **Frontmatter.** Reuse the reference card system: section `#f5fbff`, white cards 800 px,
   stroke `#dce2df`, radius 12, accent rule `#426d60`, Inter 32 / 24 / 21, callout `#f3f6f4`.
8. **Verify.** Screenshot each section with `get_screenshot` and `enableBase64Response: true`
   (the asset host is blocked from the shell, so the inline image is the only way to look).
   Check for clipped text, collapsed text, and overflow past the section.

## Figma Plugin API traps

- Variable `scopes` use `ALL_FILLS` (not `ALL_FILL`) and `STROKE_COLOR`.
- `page.clone()` turns main components into **instances of the originals**. For an
  independent copy, create new components on the new page and `swapComponent` every instance
  (re-apply the text property, its key changes).
- Replacing text by `startsWith` in sequence can hit the wrong node. Set text by position.
- Table nodes: no `figma.createTable`. Clone an existing table, use `insertRow` / `removeRow`,
  and edit `cell.text`. Cells have no `findOne`.
- Auto layout: call `resize()` before setting sizing modes; set `primaryAxisSizingMode =
  'AUTO'` after a resize if the height should hug. `HUG`/`FILL` only after `appendChild`.
- A long chip in a wrap row needs `FIXED` width 226 with its text set to `FILL`, otherwise it
  squeezes onto the row. Hug bubbles with `maxWidth = 226` and text `FILL`.
- Section children keep absolute x/y; resize the section with `resizeWithoutConstraints`
  after placing children.
- `use_figma`: set the current page once per call, return node ids, load every font style
  used (Montserrat Regular / Medium / SemiBold, Inter Regular / Medium / SemiBold / Bold /
  Italic). Always pass `skillNames: "figma-use,figma-generate-design"` and the session id.
- Figma file tools need edit access; a view-only copy fails every call. Duplicate the file
  to your drafts if needed.

## Keeping pages in sync

The UI and lowfi pages are separate. When a step changes (text, chips, order), change it on
both, and update the Frontmatter cards if counts or descriptions change.

## Known open items

- "Read more on our blog" is a placeholder (no per-condition URLs in the source data).
- The peds-bridge hand-off into the Journey A picker is a note, not an arrow.
- Knowledgebase rebuild is parked; the blog source format needs confirming first.
