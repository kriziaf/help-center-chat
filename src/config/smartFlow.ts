/**
 * Scripted "smart" conversation flow — a warm, bridging conversational tree modeled on the
 * Women's Health voice & tone example (menopause -> prescriptions -> GLP-1s -> cost -> insurance).
 * Powers "Ask MD Live" and the Menopause entry under "Ask about conditions".
 */

/** A chip inside a scripted flow node. Exactly one of `goTo` / `articleId` / `action` applies. */
export interface SmartChip {
  key: string;
  label: string;
  /** Navigate to another node in this same tree */
  goTo?: string;
  /** Explicit article request — resolved against the live `articles` array by id (fileName minus .md) */
  articleId?: string;
  /** Escape hatches into existing, already-built flows */
  action?: "reset" | "learn-more" | "category:pediatric-care";
}

export interface SmartNode {
  id: string;
  /** Bot's short warm/concise answer, paraphrased from real KB content */
  text: string;
  /** Up to 3 follow-up chips. Omitted/empty = terminal node (e.g. closing). */
  chips?: SmartChip[];
}

export const SMART_FLOW: Record<string, SmartNode> = {
  // --- Main 5-turn Women's Health script ---
  "wh-menopause": {
    id: "wh-menopause",
    text:
      "For perimenopause and menopause symptoms, an MDLIVE Primary Care doctor can build a plan around what you're feeling — that might include hormone replacement therapy, weight management support, mental health care, or help with sleep issues and hot flashes. Did you want more information on prescription options?",
    chips: [
      { key: "rx", label: "Prescription options", goTo: "wh-prescriptions" },
      { key: "peds", label: "Ask about my child's care", goTo: "peds-bridge" },
      { key: "no", label: "Not right now", goTo: "dead-end" },
    ],
  },
  "wh-prescriptions": {
    id: "wh-prescriptions",
    text:
      "Your MDLIVE doctor can send prescriptions to your preferred pharmacy, including birth control (pill, patch, or ring) at their discretion. Did you also want to know about medication options for weight management, like GLP-1s?",
    chips: [
      { key: "glp1", label: "GLP-1s for weight management", goTo: "wh-glp1" },
      { key: "article", label: "Read the full article", articleId: "womens-health-prescriptions" },
      { key: "reset", label: "Back to main menu", action: "reset" },
    ],
  },
  "wh-glp1": {
    id: "wh-glp1",
    text:
      "Yes — MDLIVE can prescribe GLP-1s and anti-obesity medications like Wegovy or Zepbound as part of a weight management plan, at your doctor's discretion. These require a Routine Care visit and aren't available in every state. Did you want more information on the cost of these treatments?",
    chips: [
      { key: "cost", label: "Cost & coverage", goTo: "wh-cost" },
      { key: "article", label: "Read the full article", articleId: "womens-health-prescriptions" },
      { key: "no", label: "Something else", goTo: "dead-end" },
    ],
  },
  "wh-cost": {
    id: "wh-cost",
    text:
      "Costs vary by plan — MDLIVE accepts most major insurance, and copays for covered visits can be as low as $0. Without insurance, visits typically run $59-$99, and pricing is always shown upfront before you book. Did you want more detail on insurance coverage, like HSA/FSA or Medicaid/Medicare?",
    chips: [
      { key: "insurance", label: "Insurance coverage details", goTo: "wh-insurance" },
      { key: "article", label: "Read the full article", articleId: "insurance-coverage-basics" },
      { key: "reset", label: "Back to main menu", action: "reset" },
    ],
  },
  "wh-insurance": {
    id: "wh-insurance",
    text:
      "Most HSA and FSA accounts cover MDLIVE visits and prescriptions as eligible medical expenses, and MDLIVE also accepts Medicaid and Medicare in participating states/plans — coverage details vary, so it's worth checking your specific plan. Is there anything else I can help with?",
    chips: [
      { key: "article", label: "Read the full article", articleId: "insurance-hsa-fsa" },
      { key: "more", label: "Ask about something else", action: "learn-more" },
      { key: "done", label: "That's all, thanks", goTo: "closing" },
    ],
  },

  // --- Edge case 1: category bridging (Women's Health -> Pediatric Care) ---
  "peds-bridge": {
    id: "peds-bridge",
    text:
      "MDLIVE also sees children and dependents — board-certified pediatricians and family medicine doctors are available 24/7, with a parent or guardian present for anyone under 18. Would you like to see our Pediatric Care topics?",
    chips: [
      { key: "peds-topics", label: "Show Pediatric Care topics", action: "category:pediatric-care" },
      { key: "back", label: "Back to Women's Health", goTo: "wh-menopause" },
      { key: "article", label: "Read the full article", articleId: "womens-health-overview" },
    ],
  },

  // --- Edge case 2: dead-end recovery (terminal, reachable from multiple nodes) ---
  "dead-end": {
    id: "dead-end",
    text:
      "I don't want to guess on that one — for anything I can't fully answer here, our care team can help directly. Give us a call at 1-800-400-6354 and we'll get you sorted.",
    chips: [{ key: "reset", label: "Back to main menu", action: "reset" }],
  },

  // --- Edge case 3: conversation closing (terminal, intentionally no chips) ---
  closing: {
    id: "closing",
    text: "Glad I could help today — take care, and reach out anytime you have more questions!",
  },
};
