---
name: chat-journey
description: Build the Figma file for the MDLive help-center chat's entry journeys (A Popular Topics, B Ask MD Live, C Ask about conditions) from the help-center-chat GitHub repo, in the user's own Figma account. Generates a new Figma file with three pages (Frontmatter, User Journey lowfi, User Journeys - UI) using the repo's real content, design tokens and icons. Use when asked to create, rebuild, update, or sync the chat journey screens, low-fi flow, or frontmatter in Figma. Needs the Figma connector with edit rights; nothing in it depends on a specific Figma user or file.
---

# chat-journey

Generates a Figma file from this repo. The repo is the single source of truth: content, tokens
and icons are read from it, and the Figma scripts are stored in this folder. It works for any
Figma user because it always creates a **new file in the user's own plan**.

## What you get

A new Figma design file with three pages:

| Page | Contents |
|---|---|
| Frontmatter | Explainer cards: summary, knowledgebase facts, Journey A/B/C, edge cases, how to read, open items |
| User Journey lowfi | The flow with no screens (v1 schematic look), one node per step, arrows with "tap …" labels |
| User Journeys - UI | Real-UI popups per step (colors, radii, Montserrat, Phosphor icons), same steps and column positions as lowfi, plus a `Components` frame and a "Repo tokens" variable collection |

Journeys: **A** Popular Topics (4 steps), **B** Ask MD Live (7 steps + peds-bridge and dead-end
branches), **C** Ask about conditions (5 steps, Headache example).

## Requirements

- The repo `https://github.com/kriziaf/help-center-chat` (clone it if you are not already in it)
  and Node 18+.
- The Figma connector with **edit access** to the file you create (a new file always qualifies).
- Nothing else. No reference Figma file, no team id, no running browser.

## Procedure

Run from the repo root.

1. **Get the repo and build the data**
   ```bash
   git clone https://github.com/kriziaf/help-center-chat   # skip if already in the repo
   cd help-center-chat && npm ci
   node skills/chat-journey/scripts/build-data.mjs
   ```
   This reads `src/config/smartFlow.ts`, `src/config/conditionsFlow.ts`, `public/**/*.md` and
   `public/KB_SCHEMA.json`, and writes `skills/chat-journey/build/` (gitignored):
   `journeys.json`, `frontmatter.json`, `stats.json` and four ready-to-paste scripts in
   `build/figma/`. It prints the character count of each script (limit 50,000 for `use_figma`).
   If it reports an unknown flow node or unresolved `{{placeholder}}`, the repo changed;
   fix `assets/journeys.template.json` (see "Changing content").

2. **Create the Figma file in the user's account**
   - Call `whoami`. One plan: use its `key`. Several plans: ask which team to use.
   - Optionally ask for a Figma project (folder) URL and pass its id as `projectId`.
   - Call `create_new_file` with `editorType: "design"`, a name such as
     `MDLive Chat — Entry Flows (Journeys A, B, C)`, the `planKey` and optional `projectId`.
   - Call `create_session` with the returned file key. Pass the `sessionId` to every call below.

3. **Run the four scripts in order.** For each file in `skills/chat-journey/build/figma/`, read
   the whole file and pass its exact content as the `code` argument of `use_figma`, with
   `skillNames: "figma-use,figma-generate-design"`. Load the `figma-use` skill first if it
   exists. Each script returns node ids and counts; check them.

   | Order | Script | Result |
   |---|---|---|
   | 1 | `01-setup.js` | The three pages, "Repo tokens" variables (11), 14 components. Expect `components: 14, variables: 11`. |
   | 2 | `02-ui.js` | UI page: 3 journey sections, 16 screens + 2 branch screens |
   | 3 | `03-lowfi.js` | Lowfi page: 3 sections, same columns |
   | 4 | `04-frontmatter.js` | Frontmatter page: 2 left cards + 6 grid cards |

   Scripts 02 to 04 are independent of each other once 01 has run, and every script is safe to
   re-run (it clears what it owns first).

4. **Verify.** Call `get_screenshot` with `enableBase64Response: true` on each section (the
   image is returned inline). Check for clipped or collapsed text, overlapping screens, and
   that the section sizes match the script report. Expected section sizes: UI and lowfi A
   1820 wide, B 3200, C 2280.
   Optional visual comparison against the real app:
   ```bash
   npm run dev &                      # http://localhost:5173
   npm i --no-save playwright-core
   CHROMIUM_PATH=/path/to/chrome node skills/chat-journey/scripts/capture-app.mjs
   ```
   This saves one screenshot per step to `build/captures/`.

5. **Hand over.** Give the user the file URL. Mention the "Frontmatter" cards were generated
   from repo counts and can be edited as plain text.

## Updating an existing file

When the repo changes (copy, chips, new article), re-run step 1 and then scripts 02, 03 and 04
in the same file (`01-setup.js` only if the design tokens or components changed; it resets the
UI page). The scripts clear and rebuild their pages, so manual edits on those pages are lost.

## Changing content

- **Repo-derived text** (bot replies, chips, article titles, card excerpts, conditions) comes
  from the repo automatically via references in `assets/journeys.template.json`:
  `{"$node": id}`, `{"$conditions": true}`, `{"$articleTitles": category}`,
  `{"$article": key}`, and `{{path}}` placeholders.
- **Editorial text** is the condensed lowfi copy (`low` items), the Frontmatter card copy
  (`assets/frontmatter.template.json`) and the journey order/taps. Edit those two JSON files.
- **Design tokens and icons**: `assets/tokens.json` (from `src/styles/helpcenter.css`) and
  `assets/icons.json` (Phosphor paths taken from the app's DOM).
- To add a step, add it to the journey's `steps` (or `branches` with a `col`) with `ui` and
  `low` items, then re-run the procedure. A step whose `tap` is not a real button label will
  break `capture-app.mjs`.

## Not included

- The **Knowledgebase tables page** is not built by this skill. The plan is parked in
  `KNOWLEDGEBASE_SPEC.md` (it needs the original blog source to be confirmed first).
- The "Read more on our blog" chip is shown as in the app. It is a placeholder (no blog URLs
  in the repo) and is noted as an open item on the Frontmatter page.
- The jump from the peds-bridge branch into Journey A is a note, not an arrow.

## Figma Plugin API traps (already handled in the scripts)

- Variable `scopes` use `ALL_FILLS` (not `ALL_FILL`) and `STROKE_COLOR`.
- `page.clone()` makes instances point back at the original components; the scripts build
  components once on the UI page instead of cloning pages.
- Auto layout: call `resize()` before setting sizing modes, set `HUG`/`FILL` only after
  `appendChild`, and re-set `primaryAxisSizingMode = 'AUTO'` after a resize if height should hug.
- A chip wider than the 226 px row is given a fixed width with wrapping text so it takes its own row.
- Fonts: load every style used (Montserrat Regular/Medium/SemiBold, Inter Regular/Medium/
  SemiBold/Bold/Italic) before setting text.
- Page names: match with `name.trim()`; some files end up with a trailing space.
- Native tables cannot be created from scratch (`figma.createTable` is unavailable); clone an
  existing table, then use `insertRow` and `cell.text` (relevant for the parked Knowledgebase work).
- `use_figma` code is limited to 50,000 characters and cannot read local files; always paste the
  generated script text.
