import { z } from "zod";

// Actions the app understands. "blog-placeholder" is used by the generated conditions tree.
export const CHIP_ACTIONS = [
  "reset",
  "learn-more",
  "category:pediatric-care",
  "blog-placeholder",
] as const;

// A chip is the user's next message. Exactly one of goTo / articleId / action must be set.
export const ChipSchema = z
  .object({
    key: z.string().min(1).describe("Unique within its node."),
    label: z.string().min(1).describe("Text the user sees and effectively sends."),
    goTo: z.string().min(1).optional().describe("Id of another node in the same tree."),
    articleId: z
      .string()
      .min(1)
      .optional()
      .describe("KB article id: the filename without .md."),
    action: z.enum(CHIP_ACTIONS).optional().describe("App-level escape hatch."),
  })
  .strict()
  .refine(
    (c) => [c.goTo, c.articleId, c.action].filter((v) => v !== undefined).length === 1,
    { message: "A chip needs exactly one of goTo, articleId, or action." },
  );

// A bot turn. Chips are the user's options; omitted or empty means a terminal node.
export const NodeSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().describe("What the bot says."),
    chips: z.array(ChipSchema).optional(),
  })
  .strict();

export const TreeSchema = z.record(z.string(), NodeSchema);

export const ChatFlowsSchema = z.object({
  smartFlow: TreeSchema.describe("Hand-written scripted flow (Ask MD Live, Women's Health)."),
  conditions: TreeSchema.describe("Generated flow for 'Ask about conditions'."),
});

export type ChatFlows = z.infer<typeof ChatFlowsSchema>;
