/**
 * Test scenarios for canvas mode
 * Each scenario defines how the chat should behave for testing different flows.
 *
 * Every field is plain data, so the scenarios can be exported as JSON.
 * Run `npm run scenarios:generate` after editing this file to refresh
 * scenarios.json and scenarios.schema.json.
 */

import type { Article } from "../app/App";

export const SEARCH_MODES = ["normal", "none", "malformed"] as const;
export type SearchMode = (typeof SEARCH_MODES)[number];

export interface ScenarioConfig {
  id: string; // must match the key in SCENARIOS
  name: string;
  description: string;
  delay: number; // milliseconds
  kbAvailable: boolean;
  search: SearchMode;
}

// Helper function to implement the search algorithm
function searchArticles(articles: Article[], query: string): Article[] {
  const keywords = query.toLowerCase().split(/\s+/);
  const scored = articles.map((article) => {
    let score = 0;
    keywords.forEach((kw) => {
      if (article.title.toLowerCase().includes(kw)) score += 3;
      if (article.tags.some((t) => t.includes(kw))) score += 2;
      if (article.questions.some((q) => q.toLowerCase().includes(kw))) score += 2;
      if (article.content.toLowerCase().includes(kw)) score += 1;
    });
    return { article, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.article);
}

export function runSearch(mode: SearchMode, query: string, articles: Article[]): Article[] {
  switch (mode) {
    case "none":
      return [];
    case "normal":
      return searchArticles(articles, query);
    case "malformed":
      // Return articles but with some data removed/corrupted to test error handling
      return searchArticles(articles, query).map((a, i) => ({
        ...a,
        title: i === 0 ? "[Missing Title]" : a.title,
        content: i === 1 ? "[ERROR: Could not load content]" : a.content,
        tags: i === 2 ? [] : a.tags,
      }));
  }
}

export const SCENARIOS: Record<string, ScenarioConfig> = {
  default: {
    id: "default",
    name: "Scenario A: Default",
    description: "Normal KB search, real articles",
    delay: 700,
    kbAvailable: true,
    search: "normal",
  },

  error: {
    id: "error",
    name: "Scenario B: Error Path",
    description: "No results found",
    delay: 700,
    kbAvailable: true,
    search: "none",
  },

  slow: {
    id: "slow",
    name: "Scenario C: Slow Response",
    description: "Slow network, test loading state",
    delay: 2500,
    kbAvailable: true,
    search: "normal",
  },

  kbFailure: {
    id: "kbFailure",
    name: "Scenario D: KB Load Failure",
    description: "KB unavailable, system error",
    delay: 1000,
    kbAvailable: false,
    search: "none",
  },

  multiple: {
    id: "multiple",
    name: "Scenario E: Multiple Results",
    description: "Show 5 articles, test ranking",
    delay: 700,
    kbAvailable: true,
    search: "normal", // normal search already returns up to 5 ranked results
  },

  malformed: {
    id: "malformed",
    name: "Scenario F: Partial/Malformed",
    description: "Articles with missing data",
    delay: 700,
    kbAvailable: true,
    search: "malformed",
  },
};

export type ScenarioType = keyof typeof SCENARIOS;
