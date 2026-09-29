# Canvas Mode Testing Feature — Specification

**Status**: ✅ Complete & Deployed  
**Date**: September 29, 2026  
**Version**: 1.0

---

## Overview

Canvas Mode is a **testing & QA interface** for the MDLIVE Help Center Chat that enables simulating different conversation flows without modifying production KB data. It provides an isolated environment for testing search behavior, error states, loading delays, and edge cases.

### Key Capabilities

- 🎯 **6 Predefined Scenarios** — Default, Error, Slow, KB Failure, Multiple Results, Malformed Data
- 📊 **Full-Width Canvas** — 768px centered chat with 120px grey margins
- 🔄 **Thread Reset** — Fresh chat for each scenario selection
- ⏱️ **Custom Delays** — 700ms to 2500ms per scenario
- 🎮 **Easy Toggle** — Note button in toolbar to enter/exit edit mode

---

## Feature Architecture

### 1. User Interface

#### Edit Mode Entry
- **Button**: Note icon in chat toolbar
- **Visibility**: Only shown when NOT in canvas mode
- **Action**: Clicking enters canvas mode with default scenario

#### Edit Navbar
- **Position**: Above chat popup when canvasMode = true
- **Components**:
  - Label: "Edit Mode" (uppercase, secondary color)
  - Dropdown: Scenario selector (768px width, flex: 1)
  - Button: "Exit Canvas" (right-aligned via margin-left: auto)
- **Styling**: White background, subtle border, soft shadow

#### Canvas View Layout
```
┌─────────────────────────────────────────────────────┐
│  Grey Margin (120px)                                │
│  ┌──────────────────────────────────────────────┐   │
│  │ Edit Navbar                                  │   │
│  │ [Edit Mode] [Scenario Dropdown] [Exit]       │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │ Chat Popup (768px width)                     │   │
│  │ ┌────────────────────────────────────────┐   │   │
│  │ │ Toolbar (back, reset, fullscreen, exit)│   │   │
│  │ ├────────────────────────────────────────┤   │   │
│  │ │ Conversation Thread (scrollable)        │   │   │
│  │ ├────────────────────────────────────────┤   │   │
│  │ │ Composer (input + send)                 │   │   │
│  │ └────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────┘   │
│  Grey Margin (120px)                                │
└─────────────────────────────────────────────────────┘
```

### 2. State Management

**App State**:
```typescript
const [canvasMode, setCanvasMode] = useState(false);
const [currentScenario, setCurrentScenario] = useState<ScenarioType | null>(null);

type ScenarioType = 'default' | 'error' | 'slow' | 'kb-failure' | 'multiple' | 'malformed';
```

**Handler Functions**:
- `enterCanvasMode()` — Set canvasMode=true, reset messages, default to "default" scenario
- `exitCanvasMode()` — Set canvasMode=false, clear scenario, reset chat
- `handleScenarioChange(scenarioId)` — Update currentScenario, reset messages

### 3. Scenario Configuration

Each scenario is defined in `src/config/scenarios.ts` with:

```typescript
interface ScenarioConfig {
  id: string;                                    // 'default', 'error', etc.
  name: string;                                  // 'Scenario A: Default'
  description: string;                           // 'Normal KB search, real articles'
  delay: number;                                 // milliseconds (700-2500)
  kbAvailable: boolean;                          // true/false for KB error testing
  searchMock: (query: string, articles: Article[]) => Article[];  // Mock search function
}
```

---

## 6 Scenarios Explained

| # | Scenario | ID | Purpose | Behavior | Delay |
|---|----------|-----|---------|----------|-------|
| A | Default | `default` | Baseline test | Real KB search, normal response | 700ms |
| B | Error Path | `error` | "No match" flow | Search returns empty results | 700ms |
| C | Slow Response | `slow` | Loading state | Real search but delayed network | 2500ms |
| D | KB Failure | `kb-failure` | Error handling | KB unavailable, system error message | 1000ms |
| E | Multiple Results | `multiple` | Ranking test | Returns all 5 top results instead of 1 | 700ms |
| F | Malformed | `malformed` | Edge cases | Articles with missing/corrupt data | 700ms |

### Scenario Details

#### Scenario A: Default
```
Purpose: Verify normal KB search works
Query: "How to reset my password?"
Result: Bot finds matching article, shows "Read Article" button
Message: "I found '[article title]' which might help. Would you like to read more?"
Delay: 700ms
```

#### Scenario B: Error Path
```
Purpose: Test "no match" fallback message
Query: "xyz123random"
Result: Search returns empty array
Message: "I didn't find a match in our knowledge base. Please try another question or browse our categories."
Delay: 700ms
```

#### Scenario C: Slow Response
```
Purpose: Verify loading indicator doesn't break with long delays
Query: "Any question"
Result: Real search but 2500ms delay
Behavior: Typing indicator shows "...", then bot responds
Message: Normal successful message
Delay: 2500ms
Testing Goal: Ensure UI doesn't timeout or crash, spinner works
```

#### Scenario D: KB Failure
```
Purpose: Test error state when KB is unavailable
Query: Any question (ignored, KB check happens first)
Result: kbAvailable=false triggers error path
Message: "⚠️ System Error: Knowledge base is currently unavailable. Please try again later."
Delay: 1000ms
Testing Goal: Verify error messaging, graceful degradation
```

#### Scenario E: Multiple Results
```
Purpose: Test ranking display with multiple articles
Query: "health"
Result: Returns all 5 top-scored articles (instead of top 1)
Message: "I found '[first article]' which might help. (and 4 more) Would you like to read more?"
Delay: 700ms
Testing Goal: Verify ranking is correct (best result should be first)
```

#### Scenario F: Malformed
```
Purpose: Test UI robustness with broken/incomplete data
Query: Any question
Result: Search returns articles with:
  - First result: title = "[Missing Title]"
  - Second result: content = "[ERROR: Could not load content]"
  - Third result: tags = []
Delay: 700ms
Testing Goal: Ensure UI doesn't crash, handles missing fields gracefully
```

---

## How to Use

### For QA Testing

**1. Enter Canvas Mode**
- Open chat (click FAB button)
- Click Note icon in toolbar → canvas mode activates
- Edit navbar appears above chat

**2. Select Scenario**
- Click scenario dropdown
- Choose Scenario A–F from list
- Chat thread resets automatically

**3. Test the Flow**
- Type a question in composer
- Observe bot response behavior for that scenario
- Check for delays, error messages, multiple results, etc.

**4. Switch Scenarios**
- Select new scenario from dropdown
- Chat thread resets (fresh start)
- Repeat test with new behavior

**5. Exit Canvas Mode**
- Click "Exit Canvas" button
- Return to normal chat view (popup mode)

### For Developers

**Running Locally**:
```bash
npm install           # Install dependencies
npm run dev          # Start Vite dev server (localhost:5173)
```

**Building**:
```bash
npm run build        # Create production bundle in dist/
```

**File Locations**:
- Scenarios config: `src/config/scenarios.ts`
- Canvas state/handlers: `src/app/App.tsx` (lines 188–319)
- Canvas CSS styling: `src/styles/helpcenter.css` (lines 128–235)
- Edit button: `src/app/App.tsx` (lines 542–546)
- Edit navbar: `src/app/App.tsx` (lines 423–437)

---

## Technical Implementation

### Modified Files

**src/app/App.tsx** (Changes)
- Added imports: `Note` icon, `SCENARIOS` + `ScenarioType`
- Added state: `canvasMode`, `currentScenario`
- Added handlers: `enterCanvasMode()`, `exitCanvasMode()`, `handleScenarioChange()`
- Modified `ask()` function: Check canvas mode → use scenario mock + custom delay
- Updated JSX: Edit button, edit navbar, canvas class bindings

**src/styles/helpcenter.css** (Added ~90 lines)
- `.is-canvas-mode` root class: Gradient background, flex layout, centered content
- `.edit-navbar` + sub-components: Styling for navbar, dropdown, buttons
- `.chat-popup.is-canvas-mode` + sub-elements: Canvas-specific chat layout

### New Files

**src/config/scenarios.ts** (126 lines)
```typescript
interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  delay: number;
  kbAvailable: boolean;
  searchMock: (query: string, articles: Article[]) => Article[];
}

export const SCENARIOS: Record<string, ScenarioConfig> = {
  default: { ... },
  error: { ... },
  slow: { ... },
  kbFailure: { ... },
  multiple: { ... },
  malformed: { ... },
};

export type ScenarioType = keyof typeof SCENARIOS;
```

**src/main.tsx** (11 lines)
- React app entry point
- Renders App component into #root element

**index.html** (22 lines)
- HTML document root
- Imports main.tsx

---

## CSS Classes Reference

### Root-level
- `.hc-root.is-canvas-mode` — Activates canvas background gradient + flex layout

### Navbar
- `.edit-navbar` — Main navbar container (768px, white background, flex)
- `.edit-navbar__label` — "Edit Mode" label styling
- `.edit-navbar__select` — Scenario dropdown (flex: 1, min-width: 200px)
- `.edit-navbar__button` — Exit button (margin-left: auto for right alignment)

### Chat in Canvas
- `.chat-popup.is-canvas-mode` — Canvas-specific chat styling (768px, static position)
- `.chat-popup.is-canvas-mode .thread` — Scrollable thread (max-height: 500px)
- `.chat-popup.is-canvas-mode .chat-popup__greeting` — Centered greeting in canvas

---

## Testing Checklist

- [ ] **Enter Canvas Mode**: Click Note button → navbar appears, chat moves to canvas
- [ ] **Scenario A (Default)**: Search finds article, shows "Read Article" button
- [ ] **Scenario B (Error)**: Search returns no results, shows fallback message
- [ ] **Scenario C (Slow)**: 2500ms delay, typing indicator shows, then responds
- [ ] **Scenario D (KB Failure)**: Shows system error message "KB unavailable"
- [ ] **Scenario E (Multiple)**: Shows "(and 4 more)" suffix for 5 results
- [ ] **Scenario F (Malformed)**: UI doesn't crash, missing data handled gracefully
- [ ] **Thread Reset**: Chat clears when switching scenarios
- [ ] **Exit Canvas Mode**: Returns to normal popup view
- [ ] **Mobile Responsive**: Canvas layout adapts to smaller screens
- [ ] **Build Succeeds**: `npm run build` produces dist/ with all KB articles

---

## Deployment

### Build Output
- Main JS: ~61KB gzipped
- CSS: ~2.5KB gzipped
- All KB articles included in dist/
- Ready for static hosting (Vercel, Netlify, GitHub Pages)

### Environment
- Node.js: 18+
- Package Manager: npm
- Framework: React 18 + TypeScript + Vite

---

## Future Enhancements

- [ ] Add scenario parameters (adjustable delay per scenario)
- [ ] Save/replay conversation flows
- [ ] Export test results as JSON
- [ ] A/B testing with two scenarios side-by-side
- [ ] Analytics tracking per scenario
- [ ] Custom scenario builder (drag-and-drop)

---

## Support & Questions

For issues or questions about canvas mode:
1. Check the dev console for errors
2. Verify all scenarios are defined in `src/config/scenarios.ts`
3. Ensure CSS classes are applied (check browser DevTools)
4. Run `npm run build` to verify production build succeeds

---

## References

- **Implementation Guide**: See MDLIVE_INTEGRATION.md for KB setup
- **Project Roadmap**: See IMPLEMENTATION_SPEC.md in Claude Projects
- **GitHub Repository**: https://github.com/kriziaf/help-center-chat
- **Commit**: `6fa2738` — Canvas mode feature merged and deployed

