// Exports the scripted chat flows as JSON and a JSON Schema describing them.
//
//   npm run flows:generate   writes src/config/chatFlows.json and chatFlows.schema.json
//   npm run flows:check      exits non-zero if the committed files are out of date

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { SMART_FLOW } from "../src/config/smartFlow";
import { CONDITION_NODES } from "../src/config/conditionsFlow";
import { ChatFlowsSchema } from "../src/config/chatFlows.schema";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = resolve(root, "src/config/chatFlows.json");
const schemaPath = resolve(root, "src/config/chatFlows.schema.json");
const checkOnly = process.argv.includes("--check");

// Throws with field-level detail if any node or chip breaks the schema.
const validated = ChatFlowsSchema.parse({
  smartFlow: SMART_FLOW,
  conditions: CONDITION_NODES,
});

const dataText = JSON.stringify(validated, null, 2) + "\n";
const schemaText = JSON.stringify(z.toJSONSchema(ChatFlowsSchema), null, 2) + "\n";

const counts = `${Object.keys(validated.smartFlow).length} scripted nodes, ${Object.keys(validated.conditions).length} condition nodes`;

if (checkOnly) {
  const stale = [dataPath, schemaPath].filter((path, i) => {
    const expected = i === 0 ? dataText : schemaText;
    return !existsSync(path) || readFileSync(path, "utf8") !== expected;
  });
  if (stale.length > 0) {
    console.error(`Out of date: ${stale.map((p) => p.replace(root + "/", "")).join(", ")}`);
    console.error("Run `npm run flows:generate` and commit the result.");
    process.exit(1);
  }
  console.log(`Chat flow JSON is up to date (${counts}).`);
} else {
  writeFileSync(dataPath, dataText);
  writeFileSync(schemaPath, schemaText);
  console.log(`Wrote chat flows to src/config/chatFlows.json (${counts})`);
  console.log("Wrote src/config/chatFlows.schema.json");
}
