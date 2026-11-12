// Checks the exported chat flows as a graph. Run with `npm run flows:test`.
//
// Rules checked:
//   - every node's key equals its id
//   - every goTo points at a node in the same tree
//   - every articleId exists in the KB index files (filename without .md)
//   - chip keys are unique within a node
//   - scripted flow nodes have at most 3 chips (see SmartNode in smartFlow.ts)
//   - every node is reachable from the tree's entry points
// Warnings (do not fail): terminal nodes and empty bot text.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ChatFlowsSchema, type ChatFlows } from "../src/config/chatFlows.schema";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const flows: ChatFlows = ChatFlowsSchema.parse(
  JSON.parse(readFileSync(resolve(root, "src/config/chatFlows.json"), "utf8")),
);

// The app's KB index files list article filenames. Accept the array form the files
// use today and the { articles: [{ file }] } form that src/utils/kb.ts reads.
const publicDir = resolve(root, "public");
const articleIds = new Set<string>();
for (const name of readdirSync(publicDir).filter((f) => /^kb-index-.*\.json$/.test(f))) {
  const index = JSON.parse(readFileSync(resolve(publicDir, name), "utf8"));
  const entries: unknown[] = Array.isArray(index) ? index : (index.articles ?? []);
  for (const entry of entries) {
    const file = typeof entry === "string" ? entry : (entry as { file: string }).file;
    articleIds.add(file.replace(/\.md$/, ""));
  }
}

const errors: string[] = [];
const warnings: string[] = [];

type Tree = ChatFlows["smartFlow"];

function reachable(tree: Tree, entries: string[]): Set<string> {
  const seen = new Set<string>();
  const stack = [...entries];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (seen.has(id) || !tree[id]) continue;
    seen.add(id);
    for (const chip of tree[id].chips ?? []) {
      if (chip.goTo) stack.push(chip.goTo);
    }
  }
  return seen;
}

function checkTree(name: string, tree: Tree, entries: string[], maxChips?: number) {
  for (const [key, node] of Object.entries(tree)) {
    if (node.id !== key) errors.push(`${name}/${key}: key does not match id "${node.id}"`);
    if (!node.text.trim()) warnings.push(`${name}/${key}: empty bot text`);

    const chips = node.chips ?? [];
    if (chips.length === 0) warnings.push(`${name}/${key}: terminal node (no chips)`);
    if (maxChips !== undefined && chips.length > maxChips) {
      errors.push(`${name}/${key}: ${chips.length} chips, max is ${maxChips}`);
    }

    const keys = new Set<string>();
    for (const chip of chips) {
      if (keys.has(chip.key)) errors.push(`${name}/${key}: duplicate chip key "${chip.key}"`);
      keys.add(chip.key);
      if (chip.goTo !== undefined && !tree[chip.goTo]) {
        errors.push(`${name}/${key}: chip "${chip.label}" goTo "${chip.goTo}" does not exist`);
      }
      if (chip.articleId !== undefined && !articleIds.has(chip.articleId)) {
        errors.push(`${name}/${key}: chip "${chip.label}" articleId "${chip.articleId}" is not in the KB`);
      }
    }
  }

  const missingEntries = entries.filter((e) => !tree[e]);
  for (const e of missingEntries) errors.push(`${name}: entry node "${e}" does not exist`);

  const seen = reachable(tree, entries);
  for (const key of Object.keys(tree)) {
    if (!seen.has(key)) errors.push(`${name}/${key}: not reachable from ${entries.join(", ")}`);
  }
  return seen.size;
}

const smartReached = checkTree("smartFlow", flows.smartFlow, ["wh-menopause"], 3);

// Entry points for the conditions tree are the nodes nothing links to with goTo.
const linkedTo = new Set(
  Object.values(flows.conditions).flatMap((n) => (n.chips ?? []).map((c) => c.goTo).filter((g): g is string => !!g)),
);
const condEntries = Object.keys(flows.conditions).filter((k) => !linkedTo.has(k));
const condReached = checkTree("conditions", flows.conditions, condEntries);

console.log(`smartFlow: ${Object.keys(flows.smartFlow).length} nodes, ${smartReached} reachable from wh-menopause`);
console.log(`conditions: ${Object.keys(flows.conditions).length} nodes, ${condReached} reachable from ${condEntries.length} condition roots`);
console.log(`KB article ids checked against: ${articleIds.size}`);

if (warnings.length > 0) {
  console.log(`\nWarnings (${warnings.length}):`);
  for (const w of warnings) console.log(`  - ${w}`);
}
if (errors.length > 0) {
  console.error(`\nFailed (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("\nAll flow checks passed.");
