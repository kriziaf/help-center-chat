import { z } from "zod";
import { SEARCH_MODES } from "./scenarios";

// One scenario. `.strict()` rejects unknown keys so typos in scenarios.json fail.
export const ScenarioSchema = z
  .object({
    id: z.string().min(1).describe("Unique scenario id. Matches the key in SCENARIOS."),
    name: z.string().min(1).describe("Label shown in the scenario dropdown."),
    description: z.string().describe("What this scenario tests."),
    delay: z.number().int().nonnegative().describe("Artificial response delay in milliseconds."),
    kbAvailable: z.boolean().describe("Whether the knowledge base loads in this scenario."),
    search: z.enum(SEARCH_MODES).describe("How search behaves: normal, none, or malformed."),
  })
  .strict();

// The exported file is an array of scenarios.
export const ScenariosSchema = z
  .array(ScenarioSchema)
  .describe("Test scenarios for the Help Center chat.");

export type ScenarioJson = z.infer<typeof ScenarioSchema>;
