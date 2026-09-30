# Entry Menu Flows — Specification

**Status**: ✅ Implemented
**Date**: September 30, 2026
**Version**: 1.0

---

## Overview

The chat popup's entry menu ("Hi, How Can I Help?") offers three buttons. Each represents a
deliberately different interaction pattern, not just a different topic — they differ in
*how* the conversation behaves, not only in what content they cover.

| Button | Pattern | Ends in |
|---|---|---|
| **Popular Topics** | Rigid, deterministic FAQ browsing | Internal FAQ article page |
| **Ask MD Live** | Smart, bridging conversation | Nothing, by design — unless explicitly asked for an internal article |
| **Ask about conditions** | Smart, bridging conversation | External MD Live blog article (source of truth) |

---

## 1. Popular Topics (the DIY flow)

The rigid, chip-driven path into the app's internal knowledge base. Every step is
deterministic — the same click always produces the same next step.

**Flow**: category chips → pick one → single `article-card` bubble in the chat → "View
article" → internal single-article viewer (Articles tab).

**Content source**: `public/<category>/*.md`, loaded via `loadArticles()` and matched by
`Article.category`.

**Code**: `showCategoryArticles(categoryId, userLabel)`, `selectCategoryChip`,
`selectSubtopic`, `openArticle` — all in `src/app/App.tsx`.

Never conversational or bridging — there's no "did you want to know about X too?" step.

---

## 2. Ask MD Live (the smart flow — hand-scripted demo)

A warm, bridging conversation modeled on a hand-authored voice-and-tone example: Women's
Health, walking menopause → prescriptions → GLP-1s → cost → insurance. Each turn gives a
short, concise answer and bridges to a related topic with follow-up chips (the "3 tags"
pattern from the original voice & tone brief).

**Defining rule**: this flow **never** auto-surfaces a KB article. An article only appears
if the user explicitly clicks a "Read the full article" chip — and even then, it's an
*internal* article (the existing `Article`/KB viewer), not an external link.

**Edge cases included**: category bridging (hands off into "Popular Topics" for Pediatric
Care), a dead-end recovery message with the phone number 1-800-400-6354, and a friendly,
chip-less closing.

**Content source**: hand-authored, paraphrased from real KB content
(`public/womens-health/*.md`, `public/insurance/*.md`).

**Code**: `src/config/smartFlow.ts` (`SMART_FLOW`), `goToSmartNode` / `resolveSmartChip` in
`src/app/App.tsx`.

---

## 3. Ask about conditions (the smart flow — real blog content)

Structurally the same bridging engine as Ask MD Live (same `goToSmartNode`/
`resolveSmartChip` functions), but built from **real, blog-derived reference content**
rather than a curated demo script, and with an opposite ending: it's designed to always
terminate by pointing back to the **original external blog article** as the source of
truth, since the content itself came from MD Live's blog.

**Key difference from Ask MD Live**: because this is reference content (not a hand-picked
demo), each condition's follow-up chips are **not capped at 3** — every snippet for a
condition is offered as a chip. It's a flat picker (condition → snippet → sibling
snippets), not a curated narrative arc.

**"Read more on our blog" chip**: present at every snippet node. Currently a placeholder —
the source data (`skills/chat-repo-condition/SKILL.md`) has no per-condition URLs yet, so
clicking it shows a bot message noting the link isn't wired up, rather than a dead/missing
link. Swap in real URLs later by adding a `blogUrl` field to the condition data and changing
the `blog-placeholder` action in `resolveSmartChip` to `window.open` it.

**Nested topics**: two conditions (Cough / Respiratory, Headache) have a sub-grouping in
the source content (e.g. "Cough Types" contains 11 further type-specific snippets). These
are represented as one extra picker level — clicking the group chip shows its own
sub-snippet chips, rather than flattening everything into one long list.

**Content source**: `skills/chat-repo-condition/SKILL.md` — 15 real conditions parsed from
MD Live's blog (3 batches), transcribed verbatim (not paraphrased) into
`src/config/conditionsFlow.ts`.

**Code**: `src/config/conditionsFlow.ts` (`CONDITION_NODES`, `CONDITIONS`, and the
`buildConditionNodes()` generator that turns compact raw snippet data into the node graph
— written this way rather than hand-authoring ~100+ node objects, since the source data is
large and mechanical to transform). Reuses `goToSmartNode`/`resolveSmartChip` in
`src/app/App.tsx` — the two smart flows share one engine merged via `ALL_SMART_NODES =
{ ...SMART_FLOW, ...CONDITION_NODES }`.

---

## Why this distinction matters

"Smart" doesn't just mean "has a bot" — both Popular Topics and the two smart flows use the
same underlying chat UI. The real distinction is in the *shape* of the interaction:

- **Popular Topics** picks a destination and stops there (one article).
- **Ask MD Live** keeps the conversation going indefinitely without ever pointing outside
  itself, unless asked.
- **Ask about conditions** keeps the conversation going too, but is explicitly designed to
  end by sending the user to the original source content, because that's what this
  particular data is *for* — it's a browsable front-end over blog content, not a
  self-contained knowledge base the way the internal KB is.
