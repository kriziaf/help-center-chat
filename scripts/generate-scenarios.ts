// Exports the test scenarios as JSON and a JSON Schema describing them.
//
//   npm run scenarios:generate   writes src/config/scenarios.json and scenarios.schema.json
//   npm run scenarios:check      exits non-zero if the committed files are out of date

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { SCENARIOS } from "../src/config/scenarios";
import { ScenariosSchema } from "../src/config/scenarios.schema";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = resolve(root, "src/config/scenarios.json");
const schemaPath = resolve(root, "src/config/scenarios.schema.json");
const checkOnly = process.argv.includes("--check");

// Each key in SCENARIOS must equal its id, so the dropdown value and the lookup agree.
const scenarios = Object.entries(SCENARIOS).map(([key, scenario]) => {
  if (scenario.id !== key) {
    throw new Error(`SCENARIOS key "${key}" does not match id "${scenario.id}"`);
  }
  return scenario;
});

// Throws with field-level detail if any scenario breaks the schema.
const validated = ScenariosSchema.parse(scenarios);

const dataText = JSON.stringify(validated, null, 2) + "\n";
const schemaText = JSON.stringify(z.toJSONSchema(ScenariosSchema), null, 2) + "\n";

if (checkOnly) {
  const stale = [dataPath, schemaPath].filter((path, i) => {
    const expected = i === 0 ? dataText : schemaText;
    return !existsSync(path) || readFileSync(path, "utf8") !== expected;
  });
  if (stale.length > 0) {
    console.error(`Out of date: ${stale.map((p) => p.replace(root + "/", "")).join(", ")}`);
    console.error("Run `npm run scenarios:generate` and commit the result.");
    process.exit(1);
  }
  console.log(`Scenario JSON is up to date (${validated.length} scenarios).`);
} else {
  writeFileSync(dataPath, dataText);
  writeFileSync(schemaPath, schemaText);
  console.log(`Wrote ${validated.length} scenarios to src/config/scenarios.json`);
  console.log("Wrote src/config/scenarios.schema.json");
}
