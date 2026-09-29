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
} from "@phosphor-icons/react";
import "../styles/helpcenter.css";

interface Article {
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

type Message = { who: "user" | "bot" | "typing"; text: string; id: number; article?: Article };

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

// Get unique tags
function getAllTags(articles: Article[]): string[] {
  const tagSet = new Set<string>();
  articles.forEach((a) => {
    a.tags.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

export default function App() {
  const [popupOpen, setPopupOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [threadActive, setThreadActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [allTags, setAllTags] = useState<string[]>([]);
  const [displayedArticles, setDisplayedArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const composerRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

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
        setAllTags(getAllTags(loadedArticles));
        setDisplayedArticles(loadedArticles.slice(0, 6)); // Show first 6
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error loading KB:", error);
        setIsLoading(false);
      });
  }, []);

  // Filter articles when category or tags change
  useEffect(() => {
    let filtered = articles;

    if (selectedCategory) {
      filtered = filtered.filter((a) => a.category === selectedCategory);
    }

    if (selectedTags.size > 0) {
      filtered = filtered.filter((a) => a.tags.some((t) => selectedTags.has(t)));
    }

    setDisplayedArticles(filtered);
  }, [selectedCategory, selectedTags, articles]);

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

  function toggleFullscreen() {
    setIsFullscreen((f) => !f);
  }

  function toggleTag(tag: string) {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  }

  function ask(q: string) {
    if (!q || !q.trim()) return;
    setThreadActive(true);
    const userMsg: Message = { who: "user", text: q, id: msgId++ };
    const typingMsg: Message = { who: "typing", text: "...", id: msgId++ };
    setMessages((prev) => [...prev, userMsg, typingMsg]);

    setTimeout(() => {
      const results = searchArticles(articles, q);
      let botMsg: Message;

      if (results.length > 0) {
        const topArticle = results[0];
        botMsg = {
          who: "bot",
          text: `I found "${topArticle.title}" which might help. Would you like to read more?`,
          id: msgId++,
          article: topArticle,
        };
      } else {
        botMsg = {
          who: "bot",
          text: "I didn't find a match in our knowledge base. Please try another question or browse our categories.",
          id: msgId++,
        };
      }

      setMessages((prev) => prev.filter((m) => m.who !== "typing").concat(botMsg));
    }, 700);
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
  }

  function handleReset() {
    setMessages([]);
    setThreadActive(false);
    setSelectedArticle(null);
  }

  function handleClose() {
    setPopupOpen(false);
    setIsFullscreen(false);
  }

  function selectArticleFromMessage(article: Article) {
    setSelectedArticle(article);
  }

  // Popular topics for suggestions (first 3 articles)
  const suggestedArticles = articles.slice(0, 3);

  return (
    <div className="hc-root" style={{ width: "100%", minHeight: "100dvh" }}>
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
                    onClick={() => {
                      setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
                      setPopupOpen(true);
                    }}
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
        <div className={`chat-popup${isFullscreen ? " is-fullscreen" : ""}`} id="chat-popup" role="dialog" aria-label="Support assistant">
          <div className="chat-popup__toolbar">
            {(threadActive || selectedArticle) && (
              <button className="chat-popup__back" aria-label="Back to main menu" onClick={handleBack}>
                <ArrowLeft size={16} aria-hidden="true" />
              </button>
            )}
            <div className="chat-popup__toolbar-actions">
              <button aria-label="New chat" onClick={handleReset}>
                <PencilSimple size={16} />
              </button>
              <button aria-label="History">
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

          {selectedArticle && (
            <div className="chat-popup__greeting">
              <div className="article-viewer">
                <h3>{selectedArticle.title}</h3>
                <div className="article-content">
                  {selectedArticle.content.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!threadActive && !selectedArticle && (
            <div className="chat-popup__greeting">
              <div className="logo-placeholder logo-placeholder--sm" aria-hidden="true">
                <Sparkle size={18} />
              </div>
              <p className="chat-popup__greeting-title">How can we help?</p>
              <p className="chat-popup__legal">Ask a question or browse topics below.</p>

              {isLoading ? (
                <p style={{ textAlign: "center", color: "#9a9a9a" }}>Loading knowledge base...</p>
              ) : (
                <>
                  <div className="category-buttons">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        className={`category-btn ${selectedCategory === cat.id ? "active" : ""}`}
                        onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  {allTags.length > 0 && (
                    <div className="tags-section">
                      <p style={{ fontSize: "12px", color: "#5f5f5f", marginBottom: "8px" }}>Filter by tags:</p>
                      <div className="tag-buttons">
                        {allTags.slice(0, 6).map((tag) => (
                          <button
                            key={tag}
                            className={`tag-btn ${selectedTags.has(tag) ? "active" : ""}`}
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="suggestions">
                    {displayedArticles.slice(0, 3).map((article) => (
                      <button
                        key={article.id}
                        className="suggestion-pill"
                        onClick={() => selectArticleFromMessage(article)}
                      >
                        <ChatCircle size={14} aria-hidden="true" />
                        {article.title}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {threadActive && (
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
                    <div className="msg-bubble msg-bubble--bot">
                      {msg.text}
                      {msg.article && (
                        <button
                          onClick={() => selectArticleFromMessage(msg.article!)}
                          style={{
                            display: "block",
                            marginTop: "8px",
                            padding: "6px 10px",
                            fontSize: "12px",
                            background: "rgba(255,255,255,0.2)",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            color: "inherit",
                          }}
                        >
                          Read Article →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

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
        </div>
      )}
    </div>
  );
}
