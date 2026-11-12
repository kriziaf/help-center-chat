# Parked spec: Scenario and chat flow JSON, FigJam table

**Status:** Parked. Work is on branch `claude/scenarios-json`, based on `main`. The code changes are not committed yet.

## Goal

Make the test scenarios and the scripted chat flows available as JSON, so the backend team can read and edit them. Add a FigJam table as a human-readable view of the scenarios.

## What is done (uncommitted, on `claude/scenarios-json`)

### Scenarios

- `src/config/scenarios.ts`: each scenario's `searchMock` function is replaced with a declarative `search` mode: `normal`, `none`, or `malformed`. `runSearch(mode, query, articles)` implements the three modes.
- Scenario ids now match their keys. Scenario D was `id: "kb-failure"` under key `kbFailure`, which made the dropdown lookup return `undefined`. It is now `kbFailure`.
- `src/app/App.tsx`: the two `searchMock` call sites use `runSearch(scenario.search, ...)`.
- `src/config/scenarios.schema.ts`: zod schema, the source of truth for the JSON Schema.
- `src/config/scenarios.json` and `src/config/scenarios.schema.json`: generated.
- Commands: `npm run scenarios:generate`, `npm run scenarios:check`.

### Chat flows

- `src/config/chatFlows.schema.ts`: zod schema for nodes and chips. A chip must have exactly one of `goTo`, `articleId`, or `action`.
- `src/config/chatFlows.json` and `src/config/chatFlows.schema.json`: generated from `SMART_FLOW` (8 nodes) and `CONDITION_NODES` (165 nodes).
- `scripts/test-flows.ts` checks the graph: key matches id, `goTo` targets exist, article ids exist in the KB index, chip keys are unique, scripted nodes have at most 3 chips, and every node is reachable. Current result: all checks pass. A corrupted copy fails as expected.
- Commands: `npm run flows:generate`, `npm run flows:check`, `npm run flows:test`.

### Dependencies

- Added as dev dependencies: `zod` (4.6.7) and `tsx`.

### FigJam table

- Board: https://www.figma.com/board/ylfVz422gVCsGOa2mfExww (file key `ylfVz422gVCsGOa2mfExww`).
- Table node `2:2`, named "Help Center test scenarios": a header row and six scenario rows, one column per field.
- This is a one-time snapshot. Edits in FigJam do not flow back to the repo. Changes have to be copied into `scenarios.json` and regenerated.

## Known issues

1. **KB articles never load in the app.** Every `public/kb-index-*.json` file is a plain array of filenames. `src/utils/kb.ts` reads `index.articles` and expects `{ category, articles: [{ file, title }] }`. The loop throws and is caught, so the app shows 0 articles in every category. Search and `articleId` chips depend on this. Decision needed: change `kb.ts` to accept the array form, or change the index files.
2. **Type error at `src/app/App.tsx:311`.** It reads `smartNodeId` from a `ConditionOption`, but the field is `nodeId`. At runtime that value is probably `undefined`. Not caught by the build, since Vite does not type-check.
3. **Type error at `src/config/conditionsFlow.ts:289`.** The `blog-placeholder` action is used, but `SmartChip` in `smartFlow.ts` does not allow it. The zod enum `CHIP_ACTIONS` includes it, so the generated JSON is valid.
4. **Scenario E is identical to Scenario A.** Both use `search: "normal"`. Decide whether E should differ.
5. **The old Scenario D crash is not reproduced.** The id mismatch was found by reading the code, not by running it. The fixed version selects correctly in the browser.
6. **The flows were not exercised in the browser.** Only the graph was validated.

## Open questions

- Should the uncommitted work be committed and pushed to `claude/scenarios-json`?
- Which format should the KB index use (issue 1)?
- Should the FigJam table be live-linked to the JSON, or stay a snapshot? A live link is not verified as possible.
- Does the backend team need the schema as a separate package or only the committed files?

## Next steps (when resumed)

1. Resolve issue 1, then re-check the article chips and search results in the browser.
2. Fix issues 2 and 3, and add `npm run typecheck` if the team wants type errors to fail.
3. Run the chat flows end to end in the dev server (Ask MD Live and Ask about conditions).
4. Decide Scenario E, then commit and open a PR.

## Commands

```bash
npm install
npm run scenarios:generate
npm run flows:generate
npm run flows:test
npm run dev
```
