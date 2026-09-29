# MDLIVE KB Integration — help-center-chat

**Status**: ✅ KB integrated and ready to test  
**Date**: 2026-09-29

---

## What's Been Integrated

### 1. Knowledge Base Files
- ✅ All 24 MDLIVE KB articles copied to `/public/` (8 categories)
- ✅ KB_SCHEMA.json copied for reference
- ✅ Article index JSON files generated (kb-index-{category}.json) for fast loading

### 2. App Component Updates
- ✅ KB loading on component mount (fetches articles from public directory)
- ✅ Keyword-based search (ranks by title, tags, questions, content)
- ✅ Category filtering buttons
- ✅ Tag-based filtering system
- ✅ Article viewer for reading full content
- ✅ Smart chat suggestions (displays top search results)
- ✅ Message threads with article links

### 3. UI Components
- ✅ **Category Buttons** - 8 buttons to filter by health topic
- ✅ **Tag Buttons** - Dynamic tag filtering (first 6 tags shown)
- ✅ **Article Suggestions** - Quick access pills showing popular articles
- ✅ **Article Viewer** - Full-screen article display with content
- ✅ **Chat Integration** - Search results appear as bot responses with "Read Article" button

### 4. Styling
- ✅ Category button styles (inactive/active states)
- ✅ Tag button styles (inactive/active states)
- ✅ Article viewer scrollable container
- ✅ Responsive design for mobile (category/tag buttons adapt)

---

## Directory Structure

```
help-center-chat/
├── public/
│   ├── KB_SCHEMA.json                  # KB metadata
│   ├── kb-index-general-info.json      # Article listings by category
│   ├── kb-index-womens-health.json
│   ├── kb-index-mens-health.json
│   ├── kb-index-dermatology.json
│   ├── kb-index-mental-health.json
│   ├── kb-index-pediatric-care.json
│   ├── kb-index-prescriptions.json
│   ├── kb-index-insurance.json
│   ├── general-info/                   # KB articles (24 total)
│   ├── womens-health/
│   ├── mens-health/
│   ├── dermatology/
│   ├── mental-health/
│   ├── pediatric-care/
│   ├── prescriptions/
│   └── insurance/
├── src/
│   ├── app/
│   │   └── App.tsx                     # Updated with KB integration
│   ├── utils/
│   │   └── kb.ts                       # KB utility functions (reference)
│   └── styles/
│       └── helpcenter.css              # Updated with new component styles
└── MDLIVE_INTEGRATION.md               # This file
```

---

## How It Works

### 1. Load Articles on Mount
When the app starts, it fetches all articles from the `/public/` directory:
- Loads article index files (kb-index-*.json)
- Fetches markdown content for each article
- Parses YAML frontmatter (title, category, tags)
- Extracts questions from markdown headings
- Stores in state for searching/filtering

### 2. Category & Tag Filtering
- **Categories**: 8 buttons representing health topics
- **Tags**: Dynamic tags extracted from all articles
- Clicking a category or tag filters the displayed articles
- Multiple tags can be selected (OR logic)

### 3. Search & Retrieval
When user asks a question:
1. Search algorithm ranks articles by:
   - Title matches (+3 points)
   - Tag matches (+2 points)
   - Question matches (+2 points)
   - Content matches (+1 point)
2. Top 5 results returned
3. If match found, bot suggests top article with "Read Article" button
4. If no match, user is prompted to browse categories

### 4. Article Viewing
Clicking "Read Article" displays the full article content:
- Shows title and formatted markdown content
- Full-height scrollable viewer
- Back button returns to chat
- Responsive on all screen sizes

---

## Testing Locally

### Start Development Server
```bash
npm install              # Install dependencies
npm run dev             # Start Vite dev server (usually localhost:5173)
```

### Test Scenarios

**1. Browse Categories**
- Open chat (click FAB button)
- Click category buttons (General Info, Women's Health, etc.)
- Suggestion pills update to show articles in that category
- Click a suggestion to view full article

**2. Search by Question**
- Type "How to reset my password?" in composer
- Bot should find "mdlive-account-security" article
- Click "Read Article →" to view

**3. Filter by Tags**
- Click a category to see articles
- Tags appear in the "Filter by tags:" section
- Click tags to filter further
- Multiple tags work together

**4. Mobile Responsiveness**
- Fullscreen expand/collapse (arrow button)
- Test on mobile breakpoints (480px, 768px)
- Category/tag buttons should reflow

---

## Technical Notes

### Frontmatter Parsing
Articles use YAML frontmatter:
```markdown
---
title: "Article Title"
category: "general-info"
tags: ["tag-one-two", "tag-three-four"]
source: "mock-blog-article-guide.md"
---
```

### Question Extraction
Questions are extracted from H2 headings in markdown:
```markdown
## How do I reset my password?
Answer content here...
```

### Search Algorithm
- Keywords split by whitespace
- Each article scored based on where keywords appear
- Results sorted by score (descending)
- Top 5 returned for display

### Responsive Design
- Chat popup is 320px wide (default)
- Fullscreen mode on mobile (480px and below)
- Category/tag buttons wrap on smaller screens
- Touch-friendly button sizes

---

## Next Steps (Optional Enhancements)

1. **Add MDLIVE Branding**
   - Update color scheme from grayscale to MDLIVE colors
   - Add MDLIVE logo to help center header
   - Customize Sparkle icon to MDLIVE mascot

2. **Improve Search**
   - Add fuzzy matching for typos
   - Implement AND/OR logic for multiple keywords
   - Add search history/suggestions

3. **Advanced Filtering**
   - Show all tags (currently limited to 6)
   - Add category + tag combination presets
   - Save user preferences (favorite categories)

4. **Analytics**
   - Track popular searches
   - Track which articles are viewed most
   - Track user feedback (helpful/not helpful)

5. **Performance**
   - Cache articles in localStorage
   - Lazy-load article content on demand
   - Implement infinite scroll for article lists

---

## Known Limitations

1. **Static Knowledge Base** - Articles are served from `/public/`
   - To add new articles, add .md files to category folders
   - Run `npm run generate-indexes` to regenerate kb-index-*.json files

2. **No Backend** - Pure frontend implementation
   - No database or API calls
   - All search happens in browser memory
   - Good for static content, limited for large KBs (>1000 articles)

3. **Basic Search** - Simple keyword matching
   - No semantic/AI-powered search
   - No typo tolerance
   - No multi-language support

4. **Markdown Rendering** - Basic plaintext display
   - No HTML/bold/italic formatting from markdown
   - Code blocks displayed as plain text
   - Links not clickable

---

## Troubleshooting

### Articles Not Loading
- Check `/public/` folder has category subfolders
- Verify kb-index-*.json files exist
- Check browser console for fetch errors
- Ensure Vite dev server is running

### Search Not Working
- Type full words (partial matches are case-sensitive)
- Check article titles match your search
- Open article directly to verify content exists

### Styling Issues
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check that helpcenter.css is loading

---

**Repository**: https://github.com/kriziaf/help-center-chat  
**MDLIVE KB**: https://github.com/kriziaf/mdlive-kb  
**Contact**: kriziafernando@gmail.com
