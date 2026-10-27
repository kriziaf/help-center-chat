# Knowledgebase in Figma — Specification

**Status**: 🅿️ Parked (planned, not built)
**Date**: October 27, 2026
**Version**: 0.1 (draft)

---

## Overview

The chat's content comes from **two different knowledge sources**. This spec describes how to
show both in the Figma file (page **Knowledgebase**) as tables generated from the repo data,
instead of hand-typed copy. It is parked until the blog source format is confirmed (see
Open Questions).

Figma file: https://www.figma.com/design/jDdzID3rZsXqPIE3Vfek7x

---

## The two sources

### 1. Q&A knowledge base (internal articles)

- **Where**: `public/<category>/*.md`, plus `public/KB_SCHEMA.json` (stats and category list).
- **Used by**: Popular Topics (Journey A) and Ask MD Live (Journey B, paraphrased).
- **Shape**: one markdown file per article. Frontmatter holds `title`, `category`, `tags`,
  `source`. Each `## ` heading is a question; the text under it is the answer.
- **Size**: 24 articles in 8 categories.

| Category | Articles | `##` headings in files |
|---|---|---|
| Dermatology | 4 | 23 |
| General Info | 3 | 12 |
| Insurance | 3 | 18 |
| Men's Health | 3 | 16 |
| Mental Health | 2 | 10 |
| Pediatric Care | 5 | 30 |
| Prescriptions | 1 | 6 |
| Women's Health | 3 | 17 |

### 2. Blog conditions (external source of truth)

- **Where**: `src/config/conditionsFlow.ts` (`RAW_CONDITIONS`). Per its header, this was parsed
  from `skills/chat-repo-condition/SKILL.md`, which is **not in the repo**.
- **Used by**: Ask about conditions (Journey C).
- **Shape**: condition → snippets (title + one or two sentences of text). Cough / Respiratory
  and Headache add one nested level (group → sub-snippets).
- **Size**: 15 conditions, about 150 titled entries.
- **Fields present**: `key`, `label`, snippet `title`, snippet `text`.
- **Fields absent in the repo**: blog URL, tags, category, author, dates. The original blog
  source very likely has more data points than the repo keeps.

### Why they differ

| | Q&A markdown | Blog conditions |
|---|---|---|
| Unit | Question and answer | Condition, snippet, sub-snippet |
| Metadata | Title, category, tags, source file | Key and label only |
| Answer length | Full paragraphs | One or two sentences |

---

## Findings

- The existing Figma Knowledgebase page has 7 FAQ sets (Mental Health and General merged),
  about 110 rows. Its per-set counts do not match the repo, and Prescriptions is missing.
- `KB_SCHEMA.json` says 105 Q&A pairs, but the `.md` files contain 132 `##` headings. Either
  some headings are not questions or the schema is stale. To be counted from the files and
  reported, not hidden.
- The Frontmatter page's Knowledgebase card currently says "seven FAQ sets" and "over 100".
  Both should be replaced with the repo's real numbers.

---

## Planned approach

### Table styling (matches the existing Figma tables)

- Native Figma table, 2 columns (Question | Answer), 360 px each.
- Header row: fill `#c2e5ff`, Inter Bold 16.
- Body rows: white, Inter Medium 16, line height 150%.
- Section titles Inter Medium 40; table subheadings 24.
- A script cannot create a table from scratch (`figma.createTable` is unavailable), but it can
  **clone an existing table, insert rows, and edit cell text**. This was tested on a throwaway
  clone. So the build is "JSON to table" by cloning the styled template.

### Steps

1. Duplicate the current Knowledgebase page as "Knowledgebase (original)" before changing it.
2. Parse every `public/*/*.md` into JSON (title, category, tags, source, Q&A) and print counts
   per category and per article.
3. Rebuild the page: an overview section (repo stats, category list), then one section per
   category (8, including Prescriptions), one table per article with title, tags and source
   file above it. Full questions and answers.
4. Add a **Blog conditions** section: one table per condition (Snippet | Text), extended with
   any extra fields once confirmed.
5. Check: Figma row counts equal repo counts per article; confirm row heights fit the text
   (existing rows are about 400 px tall and may be fixed); screenshot a few sections.
6. Update the Frontmatter Knowledgebase card with the real counts and sources.

### Effort

Medium: about 20 to 25 tool calls in one session (roughly 30 to 45 minutes). One Figma call
per category because of script size limits (about 39 KB of answer text in total). Main risks
are row heights and the open questions below.

---

## Open Questions

1. **Blog source**: share `skills/chat-repo-condition/SKILL.md` or a sample of the blog data.
   Which fields does it have (URL, title, date, author, tags, category)?
2. **Blog presentation**: separate "Blog conditions" tables (suggested) or merged with the Q&A
   sections?
3. **Count mismatch**: build from the `.md` files (132 headings) and flag the 105 in
   `KB_SCHEMA.json`, or settle which is correct first?
4. **Prescriptions**: confirm it should be included (the repo has the category; the current
   Figma page does not).

---

## Out of Scope

- Changes to the repo's knowledge base content or the chat app code.
- Wiring the "Read more on our blog" chip to real URLs (tracked separately in
  `ENTRY_FLOWS_SPEC.md`).
