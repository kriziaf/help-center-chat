import type { Article } from "../app/App"

export interface KBIndex {
  category: string
  articles: { file: string; title: string }[]
}

export function parseFrontmatter(
  raw: string,
): {
  frontmatter: Record<string, string | string[]>
  body: string
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) return { frontmatter: {}, body: raw }

  const fm: Record<string, string | string[]> = {}
  const lines = match[1].split("\n")
  let currentKey = ""
  let inList = false
  const listValues: string[] = []

  for (const line of lines) {
    if (line.startsWith("  - ") && inList) {
      listValues.push(line.slice(4).trim())
    } else if (line.match(/^[a-zA-Z_]+:/)) {
      if (inList && currentKey) {
        fm[currentKey] = [...listValues]
        listValues.length = 0
      }
      const colonIdx = line.indexOf(":")
      const key = line.slice(0, colonIdx).trim()
      const val = line.slice(colonIdx + 1).trim()
      if (val === "") {
        inList = true
        currentKey = key
      } else {
        inList = false
        currentKey = key
        fm[key] = val.replace(/^["']|["']$/g, "")
      }
    }
  }
  if (inList && currentKey) {
    fm[currentKey] = [...listValues]
  }

  return { frontmatter: fm, body: match[2] }
}

export function extractQuestions(body: string): string[] {
  const lines = body.split("\n")
  const qs: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.endsWith("?") && trimmed.length < 200) {
      qs.push(trimmed.replace(/^#+\s*/, ""))
    }
  }
  return qs
}

export async function fetchArticles(categories: string[]): Promise<Article[]> {
  const articles: Article[] = []

  for (const cat of categories) {
    try {
      const indexRes = await fetch(`/kb-index-${cat}.json`)
      if (!indexRes.ok) continue
      const index: KBIndex = await indexRes.json()

      for (const entry of index.articles) {
        try {
          const mdRes = await fetch(`/${cat}/${entry.file}`)
          if (!mdRes.ok) continue
          const raw = await mdRes.text()
          const { frontmatter, body } = parseFrontmatter(raw)

          const tagsRaw = frontmatter.tags
          const tags = Array.isArray(tagsRaw)
            ? tagsRaw
            : typeof tagsRaw === "string"
              ? tagsRaw.split(",").map((t) => t.trim())
              : []

          articles.push({
            id: entry.file.replace(/\.md$/, ""),
            title: frontmatter.title as string || entry.title,
            category: cat,
            tags,
            questions: extractQuestions(body),
            content: body,
          })
        } catch {
          // Skip individual article failures
        }
      }
    } catch {
      // Skip category failures
    }
  }

  return articles
}

export function searchArticles(query: string, articles: Article[]): Article[] {
  if (!query.trim()) return []
  const keywords = query.toLowerCase().split(/\s+/)
  const scored = articles.map((article) => {
    let score = 0
    keywords.forEach((kw) => {
      if (article.title.toLowerCase().includes(kw)) score += 3
      if (article.tags.some((t) => t.toLowerCase().includes(kw))) score += 2
      if (article.questions.some((q) => q.toLowerCase().includes(kw)))
        score += 2
      if (article.content.toLowerCase().includes(kw)) score += 1
    })
    return { article, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.article)
}

export function getCategories(articles: Article[]): string[] {
  return [...new Set(articles.map((a) => a.category))]
}
