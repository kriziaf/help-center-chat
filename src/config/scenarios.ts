/**
 * Test scenarios for canvas mode
 * Each scenario defines how the chat should behave for testing different flows
 */

import type { Article } from "../app/App";

export interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  delay: number; // milliseconds
  kbAvailable: boolean;
  searchMock: (query: string, articles: Article[]) => Article[];
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

export const SCENARIOS: Record<string, ScenarioConfig> = {
  default: {
    id: "default",
    name: "Scenario A: Default",
    description: "Normal KB search, real articles",
    delay: 700,
    kbAvailable: true,
    searchMock: (query, articles) => searchArticles(articles, query),
  },

  error: {
    id: "error",
    name: "Scenario B: Error Path",
    description: "No results found",
    delay: 700,
    kbAvailable: true,
    searchMock: () => [],
  },

  slow: {
    id: "slow",
    name: "Scenario C: Slow Response",
    description: "Slow network, test loading state",
    delay: 2500,
    kbAvailable: true,
    searchMock: (query, articles) => searchArticles(articles, query),
  },

  kbFailure: {
    id: "kb-failure",
    name: "Scenario D: KB Load Failure",
    description: "KB unavailable, system error",
    delay: 1000,
    kbAvailable: false,
    searchMock: () => [],
  },

  multiple: {
    id: "multiple",
    name: "Scenario E: Multiple Results",
    description: "Show 5 articles, test ranking",
    delay: 700,
    kbAvailable: true,
    searchMock: (query, articles) => {
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
        .slice(0, 5) // Return all 5 results
        .map((s) => s.article);
    },
  },

  malformed: {
    id: "malformed",
    name: "Scenario F: Partial/Malformed",
    description: "Articles with missing data",
    delay: 700,
    kbAvailable: true,
    searchMock: (query, articles) => {
      const results = searchArticles(articles, query);
      // Return articles but with some data removed/corrupted to test error handling
      return results.map((a, i) => ({
        ...a,
        title: i === 0 ? "[Missing Title]" : a.title,
        content: i === 1 ? "[ERROR: Could not load content]" : a.content,
        tags: i === 2 ? [] : a.tags,
      }));
    },
  },
};

export type ScenarioType = keyof typeof SCENARIOS;
