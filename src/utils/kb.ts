import { readFileSync } from 'fs';
import { join } from 'path';

export interface Article {
  id: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
  fileName: string;
  questions: string[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  articles: number;
}

export interface KBSchema {
  version: string;
  schema: string;
  lastUpdated: string;
  stats: {
    totalArticles: number;
    totalQAPairs: number;
    totalCategories: number;
    totalUniqueTags: number;
  };
  categories: Category[];
  tags: Array<{ name: string; count: number }>;
  articles: Array<{ id: string; title: string; category: string; questions: number; tags: string[] }>;
}

// Parse markdown frontmatter
function parseFrontmatter(content: string): { frontmatter: Record<string, any>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatterStr = match[1];
  const body = match[2];

  const frontmatter: Record<string, any> = {};
  frontmatterStr.split('\n').forEach((line) => {
    const [key, ...value] = line.split(':');
    if (key && value.length > 0) {
      const trimmedKey = key.trim();
      let trimmedValue = value.join(':').trim();

      // Handle YAML arrays
      if (trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) {
        trimmedValue = trimmedValue.slice(1, -1);
        frontmatter[trimmedKey] = trimmedValue
          .split(',')
          .map((v) => v.trim().replace(/^["']|["']$/g, ''));
      } else {
        // Remove quotes if present
        frontmatter[trimmedKey] = trimmedValue.replace(/^["']|["']$/g, '');
      }
    }
  });

  return { frontmatter, body };
}

// Extract questions from markdown (H2 headings)
function extractQuestions(content: string): string[] {
  const questionRegex = /^## (.+)$/gm;
  const questions: string[] = [];
  let match;
  while ((match = questionRegex.exec(content)) !== null) {
    questions.push(match[1].trim());
  }
  return questions;
}

// Load KB from public directory (for client-side bundling)
export async function loadKnowledgeBase(): Promise<Article[]> {
  const articles: Article[] = [];

  // Categories to load
  const categories = [
    'general-info',
    'womens-health',
    'mens-health',
    'dermatology',
    'mental-health',
    'pediatric-care',
    'prescriptions',
    'insurance',
  ];

  // This would be fetched in the browser from /kb/
  // For now, we'll return an empty array and handle it client-side
  return articles;
}

// Client-side KB loading (will fetch markdown files)
export async function fetchArticles(): Promise<Article[]> {
  const articles: Article[] = [];
  const categories = [
    'general-info',
    'womens-health',
    'mens-health',
    'dermatology',
    'mental-health',
    'pediatric-care',
    'prescriptions',
    'insurance',
  ];

  for (const category of categories) {
    try {
      const response = await fetch(`/kb-index-${category}.json`);
      if (response.ok) {
        const files = await response.json();
        for (const fileName of files) {
          const fileResponse = await fetch(`/${category}/${fileName}`);
          if (fileResponse.ok) {
            const content = await fileResponse.text();
            const { frontmatter, body } = parseFrontmatter(content);
            const questions = extractQuestions(body);

            articles.push({
              id: fileName.replace('.md', ''),
              title: frontmatter.title || fileName,
              category: frontmatter.category || category,
              tags: frontmatter.tags || [],
              content: body,
              fileName,
              questions,
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error loading KB for category ${category}:`, error);
    }
  }

  return articles;
}

// Get articles by category
export function getArticlesByCategory(articles: Article[], category: string): Article[] {
  return articles.filter((a) => a.category === category);
}

// Get articles by tag
export function getArticlesByTag(articles: Article[], tag: string): Article[] {
  return articles.filter((a) => a.tags.includes(tag));
}

// Search articles by keyword
export function searchArticles(articles: Article[], query: string): Article[] {
  const keywords = query.toLowerCase().split(/\s+/);
  const scored = articles.map((article) => {
    let score = 0;
    keywords.forEach((kw) => {
      if (article.title.toLowerCase().includes(kw)) score += 3;
      if (article.tags.some((t) => t.includes(kw))) score += 2;
      if (article.content.toLowerCase().includes(kw)) score += 1;
      if (article.questions.some((q) => q.toLowerCase().includes(kw))) score += 2;
    });
    return { article, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.article);
}

// Get all unique tags
export function getAllTags(articles: Article[]): string[] {
  const tagSet = new Set<string>();
  articles.forEach((a) => {
    a.tags.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

// Get categories
export function getCategories(): Category[] {
  return [
    { id: 'general-info', name: 'General Info', description: 'Service overview & setup', articles: 3 },
    { id: 'womens-health', name: "Women's Health", description: 'Women health & wellness', articles: 3 },
    { id: 'mens-health', name: "Men's Health", description: 'Men health & wellness', articles: 3 },
    { id: 'dermatology', name: 'Dermatology', description: 'Skin care services', articles: 4 },
    { id: 'mental-health', name: 'Mental Health', description: 'Therapy & psychiatry', articles: 2 },
    { id: 'pediatric-care', name: 'Pediatric Care', description: 'Children health services', articles: 5 },
    { id: 'prescriptions', name: 'Prescriptions', description: 'Medications & prescriptions', articles: 1 },
    { id: 'insurance', name: 'Insurance', description: 'Coverage & billing', articles: 3 },
  ];
}
