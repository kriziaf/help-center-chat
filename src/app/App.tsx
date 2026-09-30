import { useState, useRef, useEffect, useCallback } from "react";
import {
  User,
  ArrowDown,
  Sparkle,
  ArrowUp,
  MagnifyingGlass,
  IdentificationBadge,
  Key,
  Lock,
  ChatCircle,
  PencilSimple,
  ClockCounterClockwise,
  ArrowsOut,
  ArrowsIn,
  X,
  ArrowLeft,
  PaperPlaneTilt,
  Headset,
  FileText,
  Stethoscope,
} from "@phosphor-icons/react";
import "../styles/helpcenter.css";
import { SCENARIOS, type ScenarioType } from "../config/scenarios";
import { SMART_FLOW, CONDITIONS, type SmartChip, type ConditionOption } from "../config/smartFlow";

export interface Article {
  id: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
  fileName: string;
  questions: string[];
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface SavedConversation {
  id: string;
  title: string;
  subtitle: string;
  timestamp: number;
  articleId: string;
}

type ChipOption = { key: string; label: string; onClick: () => void };

type Message = {
  who: "user" | "bot" | "typing";
  text: string;
  id: number;
  article?: Article;
  chips?: ChipOption[];
};

let msgId = 0;

const CATEGORIES: Category[] = [
  { id: "general-info", name: "General Info", description: "Service overview & setup" },
  { id: "womens-health", name: "Women's Health", description: "Women health & wellness" },
  { id: "mens-health", name: "Men's Health", description: "Men health & wellness" },
  { id: "dermatology", name: "Dermatology", description: "Skin care services" },
  { id: "mental-health", name: "Mental Health", description: "Therapy & psychiatry" },
  { id: "pediatric-care", name: "Pediatric Care", description: "Children health services" },
  { id: "prescriptions", name: "Prescriptions", description: "Medications & prescriptions" },
  { id: "insurance", name: "Insurance", description: "Coverage & billing" },
];

const RECENT_SEARCHES_KEY = "hc_recent_searches";
const SAVED_CONVERSATIONS_KEY = "hc_saved_conversations";

function setRoute(name: "home" | "conversation", fullscreen: boolean) {
  if (!fullscreen) return;
  const target = "#/" + name;
  if (window.location.hash === target) return;
  window.location.hash = target;
}

function clearRoute() {
  if (!window.location.hash) return;
  history.replaceState(null, "", window.location.pathname + window.location.search);
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Short preview of article content for card previews
function excerpt(content: string, len = 100): string {
  const clean = content
    .replace(/^#.+$/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > len ? clean.slice(0, len).trim() + "…" : clean;
}

function readTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Parse frontmatter from markdown
function parseFrontmatter(content: string): { frontmatter: Record<string, any>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatterStr = match[1];
  const body = match[2];
  const frontmatter: Record<string, any> = {};

  frontmatterStr.split("\n").forEach((line) => {
    const [key, ...value] = line.split(":");
    if (key && value.length > 0) {
      const trimmedKey = key.trim();
      let trimmedValue = value.join(":").trim();

      if (trimmedValue.startsWith("[") && trimmedValue.endsWith("]")) {
        trimmedValue = trimmedValue.slice(1, -1);
        frontmatter[trimmedKey] = trimmedValue
          .split(",")
          .map((v) => v.trim().replace(/^["']|["']$/g, ""));
      } else {
        frontmatter[trimmedKey] = trimmedValue.replace(/^["']|["']$/g, "");
      }
    }
  });

  return { frontmatter, body };
}

// Extract questions from markdown headings
function extractQuestions(content: string): string[] {
  const questionRegex = /^## (.+)$/gm;
  const questions: string[] = [];
  let match;
  while ((match = questionRegex.exec(content)) !== null) {
    questions.push(match[1].trim());
  }
  return questions;
}

// Load articles from public KB
async function loadArticles(): Promise<Article[]> {
  const articles: Article[] = [];

  for (const category of CATEGORIES) {
    try {
      const indexResponse = await fetch(`/kb-index-${category.id}.json`);
      if (!indexResponse.ok) continue;

      const fileNames: string[] = await indexResponse.json();

      for (const fileName of fileNames) {
        const fileResponse = await fetch(`/${category.id}/${fileName}`);
        if (!fileResponse.ok) continue;

        const content = await fileResponse.text();
        const { frontmatter, body } = parseFrontmatter(content);
        const questions = extractQuestions(body);

        articles.push({
          id: fileName.replace(".md", ""),
          title: frontmatter.title || fileName,
          category: category.id,
          tags: frontmatter.tags || [],
          content: body,
          fileName,
          questions,
        });
      }
    } catch (error) {
      console.error(`Error loading articles for ${category.id}:`, error);
    }
  }

  return articles;
}

// Search articles by keyword
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

export default function App() {
  const [popupOpen, setPopupOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [threadActive, setThreadActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeTab, setActiveTab] = useState<"conversation" | "articles">("conversation");
  const [isLoading, setIsLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    loadFromStorage(RECENT_SEARCHES_KEY, [])
  );
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>(() =>
    loadFromStorage(SAVED_CONVERSATIONS_KEY, [])
  );
  const [canvasMode, setCanvasMode] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<ScenarioType | null>(null);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  const composerRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  const isFullscreenRef = useRef(isFullscreen);
  const messagesRef = useRef(messages);
  isFullscreenRef.current = isFullscreen;
  messagesRef.current = messages;

  // Load KB on mount
  useEffect(() => {
    document.title = "MDLIVE Help Center — Powered by Ask MD Live";
    loadArticles()
      .then((loadedArticles) => {
        setArticles(loadedArticles);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error loading KB:", error);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (popupOpen) composerRef.current?.focus();
  }, [popupOpen]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!popupOpen) {
      clearRoute();
      return;
    }
    if (isFullscreen) {
      setRoute(threadActive ? "conversation" : "home", true);
    } else {
      clearRoute();
    }
  }, [popupOpen, isFullscreen, threadActive]);

  const handleHashChange = useCallback(() => {
    if (!isFullscreenRef.current) return;
    const route = window.location.hash;
    if (route === "#/conversation" && messagesRef.current.length > 0) {
      setThreadActive(true);
    } else {
      setThreadActive(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [handleHashChange]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#/home" || hash === "#/conversation") {
      setPopupOpen(true);
      setIsFullscreen(true);
      if (hash === "#/conversation") setThreadActive(true);
    }
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && popupOpen) {
        setPopupOpen(false);
        setIsFullscreen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [popupOpen]);

  useEffect(() => {
    if (!shareMenuOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShareMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [shareMenuOpen]);

  function toggleFullscreen() {
    setIsFullscreen((f) => !f);
  }

  function recordSearch(q: string) {
    setRecentSearches((prev) => {
      const next = [q, ...prev.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, 8);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  }

  function recordSavedConversation(article: Article) {
    const categoryName = CATEGORIES.find((c) => c.id === article.category)?.name ?? article.category;
    setSavedConversations((prev) => {
      const next = [
        {
          id: `${Date.now()}-${article.id}`,
          title: article.title,
          subtitle: `${categoryName} · MDLIVE`,
          timestamp: Date.now(),
          articleId: article.id,
        },
        ...prev.filter((c) => c.articleId !== article.id),
      ].slice(0, 8);
      localStorage.setItem(SAVED_CONVERSATIONS_KEY, JSON.stringify(next));
      return next;
    });
  }

  // Show a category's articles as chips, continuing the current thread
  function showCategoryArticles(categoryId: string, userLabel: string) {
    setThreadActive(true);
    setActiveTab("conversation");
    const userMsg: Message = { who: "user", text: userLabel, id: msgId++ };
    const typingMsg: Message = { who: "typing", text: "...", id: msgId++ };
    setMessages((prev) => [...prev, userMsg, typingMsg]);

    setTimeout(() => {
      const categoryArticles = articles.filter((a) => a.category === categoryId);
      const categoryName = CATEGORIES.find((c) => c.id === categoryId)?.name ?? categoryId;
      const botMsg: Message = {
        who: "bot",
        text: `Here are our ${categoryName} topics. Which one fits best?`,
        id: msgId++,
        chips: categoryArticles.map((a) => ({
          key: a.id,
          label: a.title,
          onClick: () => selectSubtopic(a),
        })),
      };
      setMessages((prev) => prev.filter((m) => m.who !== "typing").concat(botMsg));
    }, 500);
  }

  function selectCategoryChip(categoryId: string) {
    const categoryName = CATEGORIES.find((c) => c.id === categoryId)?.name ?? categoryId;
    showCategoryArticles(categoryId, categoryName);
  }

  // User picked a specific article chip — confirm, then show the article as a rich card
  function selectSubtopic(article: Article) {
    const userMsg: Message = { who: "user", text: article.title, id: msgId++ };
    const typingMsg: Message = { who: "typing", text: "...", id: msgId++ };
    setMessages((prev) => [...prev, userMsg, typingMsg]);

    setTimeout(() => {
      const introMsg: Message = { who: "bot", text: "Ok, I think this article might help.", id: msgId++ };
      const sourceMsg: Message = {
        who: "bot",
        text: "Here's a relevant article from MDLIVE.",
        id: msgId++,
      };
      const cardMsg: Message = { who: "bot", text: "", id: msgId++, article };
      const nextStepsMsg: Message = {
        who: "bot",
        text: "What would you like to do next?",
        id: msgId++,
        chips: [
          { key: "learn-more", label: "Learn about other services", onClick: handleLearnMore },
          { key: "reset", label: "Back to main menu", onClick: handleReset },
        ],
      };
      setMessages((prev) =>
        prev.filter((m) => m.who !== "typing").concat(introMsg, sourceMsg, cardMsg, nextStepsMsg)
      );
      recordSavedConversation(article);
    }, 600);
  }

  // Render any node in the SMART_FLOW tree. If userEchoLabel is provided, first post a user
  // bubble + typing indicator (chip-driven entry); if omitted, post the bot turn directly
  // with no preceding user bubble (the very first, unprompted "Ask MD Live" turn).
  function goToSmartNode(nodeId: string, userEchoLabel?: string) {
    const node = SMART_FLOW[nodeId];
    if (!node) return;

    setThreadActive(true);
    setActiveTab("conversation");

    const render = () => {
      const chips: ChipOption[] | undefined = node.chips?.map((c) => ({
        key: c.key,
        label: c.label,
        onClick: () => resolveSmartChip(c),
      }));
      const botMsg: Message = { who: "bot", text: node.text, id: msgId++, chips };
      setMessages((prev) => prev.filter((m) => m.who !== "typing").concat(botMsg));
    };

    if (userEchoLabel) {
      const userMsg: Message = { who: "user", text: userEchoLabel, id: msgId++ };
      const typingMsg: Message = { who: "typing", text: "...", id: msgId++ };
      setMessages((prev) => [...prev, userMsg, typingMsg]);
    } else {
      const typingMsg: Message = { who: "typing", text: "...", id: msgId++ };
      setMessages((prev) => [...prev, typingMsg]);
    }
    setTimeout(render, 500);
  }

  // Dispatch a single chip's action: navigate within the tree, escape to an existing flow,
  // or resolve+open a real Article by id (explicit "Read the full article" request).
  function resolveSmartChip(chip: SmartChip) {
    if (chip.articleId) {
      const article = articles.find((a) => a.id === chip.articleId);
      if (article) selectSubtopic(article);
      return;
    }
    if (chip.action === "reset") return handleReset();
    if (chip.action === "learn-more") return handleLearnMore();
    if (chip.action === "category:pediatric-care") {
      return showCategoryArticles("pediatric-care", "Show Pediatric Care topics");
    }
    if (chip.goTo) return goToSmartNode(chip.goTo, chip.label);
  }

  function showConditionsMenu() {
    setThreadActive(true);
    setActiveTab("conversation");
    const userMsg: Message = { who: "user", text: "Ask about conditions", id: msgId++ };
    const typingMsg: Message = { who: "typing", text: "...", id: msgId++ };
    setMessages((prev) => [...prev, userMsg, typingMsg]);

    setTimeout(() => {
      const botMsg: Message = {
        who: "bot",
        text: "Sure — which condition would you like to talk about?",
        id: msgId++,
        chips: CONDITIONS.map((c) => ({
          key: c.key,
          label: c.label,
          onClick: () => selectCondition(c),
        })),
      };
      setMessages((prev) => prev.filter((m) => m.who !== "typing").concat(botMsg));
    }, 500);
  }

  function selectCondition(condition: ConditionOption) {
    if (condition.smartNodeId) {
      goToSmartNode(condition.smartNodeId, condition.label);
      return;
    }
    askUnscriptedCondition(condition);
  }

  function askUnscriptedCondition(condition: ConditionOption) {
    const userMsg: Message = { who: "user", text: condition.label, id: msgId++ };
    const typingMsg: Message = { who: "typing", text: "...", id: msgId++ };
    setMessages((prev) => [...prev, userMsg, typingMsg]);

    setTimeout(() => {
      const results = searchArticles(articles, condition.label);
      let botMsg: Message;
      if (results.length > 0) {
        const top = results[0];
        botMsg = {
          who: "bot",
          text: `Here's something that might help with ${condition.label.toLowerCase()}. Did you want more information?`,
          id: msgId++,
          chips: [
            { key: "article", label: "Read the full article", onClick: () => selectSubtopic(top) },
            { key: "reset", label: "Back to main menu", onClick: handleReset },
          ],
        };
      } else {
        botMsg = {
          who: "bot",
          text: `I don't have a scripted answer for ${condition.label} yet, but our care team can help directly — give us a call at 1-800-400-6354.`,
          id: msgId++,
          chips: [{ key: "reset", label: "Back to main menu", onClick: handleReset }],
        };
      }
      setMessages((prev) => prev.filter((m) => m.who !== "typing").concat(botMsg));
    }, 700);
  }

  function handleLearnMore() {
    const userMsg: Message = { who: "user", text: "Learn about other services", id: msgId++ };
    const typingMsg: Message = { who: "typing", text: "...", id: msgId++ };
    setMessages((prev) => [...prev, userMsg, typingMsg]);

    setTimeout(() => {
      const botMsg: Message = {
        who: "bot",
        text: "Sure — which area would you like to explore?",
        id: msgId++,
        chips: CATEGORIES.map((c) => ({
          key: c.id,
          label: c.name,
          onClick: () => selectCategoryChip(c.id),
        })),
      };
      setMessages((prev) => prev.filter((m) => m.who !== "typing").concat(botMsg));
    }, 500);
  }

  function enterCanvasMode() {
    setCanvasMode(true);
    setPopupOpen(true);
    setMessages([]);
    setThreadActive(false);
    setSelectedArticle(null);
    setCurrentScenario("default");
  }

  function exitCanvasMode() {
    setCanvasMode(false);
    setPopupOpen(false);
    setCurrentScenario(null);
    setMessages([]);
    setThreadActive(false);
    setSelectedArticle(null);
    setShareMenuOpen(false);
  }

  function handleScenarioChange(scenarioId: string) {
    setCurrentScenario(scenarioId as ScenarioType);
    setMessages([]);
    setThreadActive(false);
    setSelectedArticle(null);
  }

  function selectScenario(scenarioId: ScenarioType) {
    handleScenarioChange(scenarioId);
    setShareMenuOpen(false);
  }

  function ask(q: string) {
    if (!q || !q.trim()) return;

    // If in canvas mode, reset thread for fresh scenario testing
    if (canvasMode) {
      setMessages([]);
    }

    setThreadActive(true);
    setActiveTab("conversation");
    recordSearch(q.trim());
    const userMsg: Message = { who: "user", text: q, id: msgId++ };
    const typingMsg: Message = { who: "typing", text: "...", id: msgId++ };
    setMessages((prev) => [...prev, userMsg, typingMsg]);

    // Determine delay and search function based on scenario
    let delay = 700;
    let results: Article[] = [];
    let kbAvailable = true;

    if (canvasMode && currentScenario) {
      const scenario = SCENARIOS[currentScenario];
      delay = scenario.delay;
      kbAvailable = scenario.kbAvailable;

      if (!kbAvailable) {
        results = [];
      } else {
        results = scenario.searchMock(q, articles);
      }
    } else {
      results = searchArticles(articles, q);
    }

    setTimeout(() => {
      let botMsg: Message;

      if (results.length > 0) {
        const categoryScores = new Map<string, number>();
        results.forEach((a, i) => {
          categoryScores.set(a.category, (categoryScores.get(a.category) ?? 0) + (results.length - i));
        });
        const relevantCategories = Array.from(categoryScores.keys()).sort(
          (a, b) => (categoryScores.get(b) ?? 0) - (categoryScores.get(a) ?? 0)
        );

        // For multiple results scenario, show all 5 results
        const displayArticles = canvasMode && currentScenario === "multiple" ? results : [results[0]];
        const topArticle = displayArticles[0];
        const suffix = displayArticles.length > 1 ? ` (and ${displayArticles.length - 1} more)` : "";

        botMsg = {
          who: "bot",
          text: `I found "${topArticle.title}" which might help.${suffix} Would you like to read more?`,
          id: msgId++,
          chips: relevantCategories.map((catId) => ({
            key: catId,
            label: CATEGORIES.find((c) => c.id === catId)?.name ?? catId,
            onClick: () => selectCategoryChip(catId),
          })),
        };
      } else if (!kbAvailable) {
        botMsg = {
          who: "bot",
          text: "⚠️ System Error: Knowledge base is currently unavailable. Please try again later.",
          id: msgId++,
        };
      } else {
        botMsg = {
          who: "bot",
          text: "I didn't find a match in our knowledge base. Please try another question or browse our categories.",
          id: msgId++,
        };
      }

      setMessages((prev) => prev.filter((m) => m.who !== "typing").concat(botMsg));
    }, delay);
  }

  function handleSend() {
    ask(input);
    setInput("");
  }

  function handleComposerKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      ask(input);
      setInput("");
    }
  }

  function handleBack() {
    setThreadActive(false);
    setSelectedArticle(null);
    setActiveTab("conversation");
  }

  function handleReset() {
    setMessages([]);
    setThreadActive(false);
    setSelectedArticle(null);
    setActiveTab("conversation");
  }

  function handleClose() {
    setPopupOpen(false);
    setIsFullscreen(false);
  }

  function openArticle(article: Article) {
    setSelectedArticle(article);
    setActiveTab("articles");
  }

  function askMDLive() {
    goToSmartNode("wh-menopause");
  }

  function openCategoryChat(categoryId: string, label: string) {
    setPopupOpen(true);
    showCategoryArticles(categoryId, label);
  }

  return (
    <div className={`hc-root${canvasMode ? " is-canvas-mode" : ""}`} style={{ width: "100%", minHeight: "100dvh" }}>
      <div className="canvas-topbar">
        <div className="canvas-topbar__toggle">
          <button
            className={`canvas-topbar__toggle-btn${canvasMode ? " is-active" : ""}`}
            onClick={() => { if (!canvasMode) enterCanvasMode(); }}
          >
            Edit
          </button>
          <button
            className={`canvas-topbar__toggle-btn${!canvasMode ? " is-active" : ""}`}
            onClick={() => { if (canvasMode) exitCanvasMode(); }}
          >
            Prototype
          </button>
        </div>
        <div className="canvas-topbar__share" ref={shareMenuRef}>
          <button
            className="canvas-topbar__share-btn"
            disabled={!canvasMode}
            aria-expanded={shareMenuOpen}
            onClick={() => setShareMenuOpen((v) => !v)}
          >
            {currentScenario ? SCENARIOS[currentScenario].name : "Share"}
            <ArrowDown size={12} aria-hidden="true" />
          </button>
          {shareMenuOpen && canvasMode && (
            <div className="canvas-topbar__menu">
              {Object.entries(SCENARIOS).map(([key, scenario]) => (
                <button
                  key={key}
                  className={`canvas-topbar__menu-item${currentScenario === key ? " is-selected" : ""}`}
                  onClick={() => selectScenario(key as ScenarioType)}
                >
                  {scenario.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="page">
        <header className="header">
          <div className="avatar" aria-hidden="true">
            <User size={16} />
          </div>
          <button className="lang-select">
            English (US) <ArrowDown size={14} aria-hidden="true" />
          </button>
        </header>

        {!popupOpen && !selectedArticle && (
          <>
            <section className="hero">
              <div className="logo-placeholder" aria-hidden="true">
                <Sparkle size={22} />
              </div>
              <h2>Ask MDLIVE</h2>
              <p className="hero-description">Help Center Chat</p>

              <div className="search-bar">
                <input
                  className="search-bar__input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  aria-label="Search help topics"
                />
                <button className="btn-circle" aria-label="Search">
                  <ArrowUp size={16} />
                </button>
              </div>

              {searchQuery && (
                <div className="autocomplete">
                  <MagnifyingGlass size={16} aria-hidden="true" />
                  <span>{searchQuery}</span>
                </div>
              )}

              <p className="legal">
                Browse our <span className="link">health topics</span> below or ask a question.
              </p>
            </section>

            <section className="topics">
              <h3>Categories</h3>
              <div className="topics__grid">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    className="topic-card"
                    onClick={() => openCategoryChat(cat.id, cat.name)}
                  >
                    <div className="topic-card__image" aria-hidden="true">
                      {cat.id === "general-info" && <IdentificationBadge size={28} />}
                      {cat.id === "womens-health" && <Key size={28} />}
                      {cat.id === "mens-health" && <Lock size={28} />}
                      {cat.id === "dermatology" && <MagnifyingGlass size={28} />}
                      {cat.id === "mental-health" && <ChatCircle size={28} />}
                      {cat.id === "pediatric-care" && <User size={28} />}
                      {cat.id === "prescriptions" && <PencilSimple size={28} />}
                      {cat.id === "insurance" && <ClockCounterClockwise size={28} />}
                    </div>
                    <p className="topic-card__title">{cat.name}</p>
                    <p className="topic-card__desc">{cat.description}</p>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {!popupOpen && (
        <button
          className="fab"
          aria-label="Open support chat"
          aria-expanded={false}
          aria-controls="chat-popup"
          onClick={() => setPopupOpen(true)}
        >
          <ChatCircle size={24} aria-hidden="true" />
        </button>
      )}

      {popupOpen && (
        <div className={`chat-popup${isFullscreen ? " is-fullscreen" : ""}${canvasMode ? " is-canvas-mode" : ""}`} id="chat-popup" role="dialog" aria-label="Support assistant">
          <div className="chat-popup__toolbar">
            {threadActive && (
              <button className="chat-popup__back" aria-label="Back to main menu" onClick={handleBack}>
                <ArrowLeft size={16} aria-hidden="true" />
              </button>
            )}
            <div className="chat-popup__toolbar-actions">
              <button aria-label="New chat" onClick={handleReset}>
                <PencilSimple size={16} />
              </button>
              <button
                aria-label="History"
                onClick={() => {
                  setActiveTab("articles");
                  setSelectedArticle(null);
                }}
              >
                <ClockCounterClockwise size={16} />
              </button>
              <button
                aria-label={isFullscreen ? "Exit full screen" : "Expand to full screen"}
                aria-pressed={isFullscreen}
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <ArrowsIn size={16} /> : <ArrowsOut size={16} />}
              </button>
              <button aria-label="Close chat" onClick={handleClose}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="chat-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === "conversation"}
              className={`chat-tab ${activeTab === "conversation" ? "active" : ""}`}
              onClick={() => setActiveTab("conversation")}
            >
              Conversation
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "articles"}
              className={`chat-tab ${activeTab === "articles" ? "active" : ""}`}
              onClick={() => setActiveTab("articles")}
            >
              Articles
            </button>
          </div>

          {activeTab === "conversation" && !threadActive && (
            <div className="chat-popup__greeting">
              <div className="logo-placeholder logo-placeholder--sm" aria-hidden="true">
                <Sparkle size={18} />
              </div>
              <p className="chat-popup__greeting-title">Hi, How Can I Help?</p>
              <p className="chat-popup__legal">By using this service, you agree to the AI terms.</p>

              {isLoading ? (
                <p style={{ textAlign: "center", color: "#9a9a9a" }}>Loading knowledge base...</p>
              ) : (
                <div className="entry-menu">
                  <button className="entry-menu-btn" onClick={askMDLive}>
                    <Headset size={16} aria-hidden="true" />
                    <span>Ask MD Live</span>
                  </button>
                  <button
                    className="entry-menu-btn"
                    onClick={() => showCategoryArticles("general-info", "Popular Topics")}
                  >
                    <Sparkle size={16} aria-hidden="true" />
                    <span>Popular Topics</span>
                  </button>
                  <button className="entry-menu-btn" onClick={showConditionsMenu}>
                    <Stethoscope size={16} aria-hidden="true" />
                    <span>Ask about conditions</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "conversation" && threadActive && (
            <div className="thread" ref={threadRef} aria-live="polite">
              {messages.map((msg) => {
                if (msg.who === "user")
                  return (
                    <div key={msg.id} className="msg-row msg-row--user">
                      <div className="msg-bubble msg-bubble--user">{msg.text}</div>
                    </div>
                  );
                if (msg.who === "typing")
                  return (
                    <div key={msg.id} className="msg-row msg-row--bot">
                      <div className="msg-avatar" aria-hidden="true">
                        <Sparkle size={12} />
                      </div>
                      <div className="msg-bubble msg-bubble--bot msg-bubble--typing">...</div>
                    </div>
                  );
                return (
                  <div key={msg.id} className="msg-row msg-row--bot">
                    <div className="msg-avatar" aria-hidden="true">
                      <Sparkle size={12} />
                    </div>
                    <div className="msg-content">
                      {msg.text && <div className="msg-bubble msg-bubble--bot">{msg.text}</div>}
                      {msg.article && (
                        <div className="article-card">
                          <div className="article-card__breadcrumb">
                            <span>MDLIVE</span>
                            <span aria-hidden="true">·</span>
                            <span>Articles</span>
                          </div>
                          <div className="article-card__thumb" aria-hidden="true">
                            <FileText size={26} />
                          </div>
                          <div className="article-card__body">
                            <p className="article-card__title">{msg.article.title}</p>
                            <p className="article-card__desc">{excerpt(msg.article.content)}</p>
                            <div className="article-card__byline">
                              <span>MDLIVE Care Team</span>
                              <span aria-hidden="true">·</span>
                              <span>{readTime(msg.article.content)} min read</span>
                            </div>
                            <button
                              className="article-card__cta"
                              onClick={() => openArticle(msg.article!)}
                            >
                              View article
                            </button>
                          </div>
                        </div>
                      )}
                      {msg.chips && msg.chips.length > 0 && (
                        <div className="chip-row">
                          {msg.chips.map((c) => (
                            <button key={c.key} className="chip-btn" onClick={c.onClick}>
                              {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "articles" && (
            <div className="chat-popup__greeting articles-panel">
              {selectedArticle ? (
                <div className="article-viewer">
                  <button className="back-link" onClick={() => setSelectedArticle(null)}>
                    <ArrowLeft size={12} aria-hidden="true" />
                    All articles
                  </button>
                  <h3>{selectedArticle.title}</h3>
                  <div className="article-content">
                    {selectedArticle.content.split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="history-panel">
                  <div className="history-section">
                    <p className="history-section__label">Saved Conversations</p>
                    {savedConversations.length === 0 ? (
                      <p className="history-empty">No saved conversations yet.</p>
                    ) : (
                      savedConversations.map((c) => (
                        <button
                          key={c.id}
                          className="history-item"
                          onClick={() => {
                            const a = articles.find((x) => x.id === c.articleId);
                            if (a) setSelectedArticle(a);
                          }}
                        >
                          <ChatCircle size={16} aria-hidden="true" />
                          <span className="history-item__body">
                            <span className="history-item__title">{c.title}</span>
                            <span className="history-item__meta">{formatTimestamp(c.timestamp)}</span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="history-section">
                    <p className="history-section__label">Recent Search</p>
                    {recentSearches.length === 0 ? (
                      <p className="history-empty">No recent searches yet.</p>
                    ) : (
                      recentSearches.map((q) => (
                        <button
                          key={q}
                          className="history-item history-item--search"
                          onClick={() => ask(q)}
                        >
                          <MagnifyingGlass size={14} aria-hidden="true" />
                          <span>{q}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "conversation" && (
            <div className="composer">
              <input
                className="composer__input"
                ref={composerRef}
                type="text"
                placeholder="Ask a question..."
                aria-label="Ask a question"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleComposerKey}
              />
              <button className="btn-circle btn-circle--sm" aria-label="Send" onClick={handleSend}>
                <PaperPlaneTilt size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
