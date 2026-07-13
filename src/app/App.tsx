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

const REPLIES: Record<string, string> = {
  "how to reset my password?":
    "To reset your password, go to Settings > Login and security > Change password. If you're locked out, use the \"Forgot password\" link on the login screen and we'll send a recovery code to your email or phone.",
  "who sees my posts?":
    "Your post audience depends on your privacy setting. Public posts are visible to anyone; Friends-only posts are limited to your connections. You can set the audience per post or change the default in Settings > Privacy.",
  "report abusive content":
    "To report abusive content, tap the three-dot menu on any post or message and choose \"Report.\" You'll pick a reason, and our team will review it. Reports are anonymous — the person won't know who reported them.",
};

const FALLBACK =
  "Thanks for your question. Here's a mock response — in the live product, the assistant would answer or route you to the right help article. Want me to connect you with support?";

type Message = { who: "user" | "bot" | "typing"; text: string; id: number };

let msgId = 0;

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

export default function App() {
  const [popupOpen, setPopupOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [threadActive, setThreadActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("Delete");
  const composerRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const isFullscreenRef = useRef(isFullscreen);
  const messagesRef = useRef(messages);
  isFullscreenRef.current = isFullscreen;
  messagesRef.current = messages;

  useEffect(() => {
    document.title = "Help Center Chat Interface — Wireframe Prototype";
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

  function toggleFullscreen() {
    setIsFullscreen((f) => !f);
  }

  function ask(q: string) {
    if (!q || !q.trim()) return;
    setThreadActive(true);
    const userMsg: Message = { who: "user", text: q, id: msgId++ };
    const typingMsg: Message = { who: "typing", text: "...", id: msgId++ };
    setMessages((prev) => [...prev, userMsg, typingMsg]);
    setTimeout(() => {
      const key = q.trim().toLowerCase();
      const reply = REPLIES[key] || FALLBACK;
      const botMsg: Message = { who: "bot", text: reply, id: msgId++ };
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

  function handleBack() { setThreadActive(false); }
  function handleReset() { setMessages([]); setThreadActive(false); }
  function handleClose() { setPopupOpen(false); setIsFullscreen(false); }

  return (
    <div className="hc-root" style={{ width: "100%", minHeight: "100dvh" }}>
      <div className="page">
        <header className="header">
          <div className="avatar" aria-hidden="true"><User size={16} /></div>
          <button className="lang-select">
            English (US) <ArrowDown size={14} aria-hidden="true" />
          </button>
        </header>

        <section className="hero">
          <div className="logo-placeholder" aria-hidden="true"><Sparkle size={22} /></div>
          <h2>Hey Erika, how can I help?</h2>
          <p className="hero-description">Prototype — Help Center Chat Interface</p>

          <div className="search-bar">
            <input
              className="search-bar__input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search help topics"
            />
            <button className="btn-circle" aria-label="Search"><ArrowUp size={16} /></button>
          </div>

          {searchQuery && (
            <div className="autocomplete">
              <MagnifyingGlass size={16} aria-hidden="true" />
              <span>{searchQuery}</span>
            </div>
          )}

          <p className="legal">
            By using this service, you agree to the{" "}
            <span className="link">AI terms</span>.
          </p>
        </section>

        <section className="topics">
          <h3>Popular topics</h3>
          <div className="topics__grid">
            <div className="topic-card">
              <div className="topic-card__image" aria-hidden="true"><IdentificationBadge size={28} /></div>
              <p className="topic-card__title">Account settings</p>
              <p className="topic-card__desc">Adjust settings, manage notifications, learn about name changes and more</p>
            </div>
            <div className="topic-card">
              <div className="topic-card__image" aria-hidden="true"><Key size={28} /></div>
              <p className="topic-card__title">Login, recovery and security</p>
              <p className="topic-card__desc">Fix login issues and learn how to change or reset your password</p>
            </div>
            <div className="topic-card">
              <div className="topic-card__image" aria-hidden="true"><Lock size={28} /></div>
              <p className="topic-card__title">Privacy and safety</p>
              <p className="topic-card__desc">Control who can see your content and keep your account secure</p>
            </div>
          </div>
        </section>
      </div>

      {!popupOpen && (
        <button className="fab" aria-label="Open support chat" aria-expanded={false} aria-controls="chat-popup" onClick={() => setPopupOpen(true)}>
          <ChatCircle size={24} aria-hidden="true" />
        </button>
      )}

      {popupOpen && (
        <div className={`chat-popup${isFullscreen ? " is-fullscreen" : ""}`} id="chat-popup" role="dialog" aria-label="Support assistant">
          <div className="chat-popup__toolbar">
            {threadActive && (
              <button className="chat-popup__back" aria-label="Back to main menu" onClick={handleBack}>
                <ArrowLeft size={16} aria-hidden="true" />
              </button>
            )}
            <div className="chat-popup__toolbar-actions">
              <button aria-label="New chat" onClick={handleReset}><PencilSimple size={16} /></button>
              <button aria-label="History"><ClockCounterClockwise size={16} /></button>
              <button aria-label={isFullscreen ? "Exit full screen" : "Expand to full screen"} aria-pressed={isFullscreen} onClick={toggleFullscreen}>
                {isFullscreen ? <ArrowsIn size={16} /> : <ArrowsOut size={16} />}
              </button>
              <button aria-label="Close chat" onClick={handleClose}><X size={16} /></button>
            </div>
          </div>

          {!threadActive && (
            <div className="chat-popup__greeting">
              <div className="logo-placeholder logo-placeholder--sm" aria-hidden="true"><Sparkle size={18} /></div>
              <p className="chat-popup__greeting-title">Hey Erika, how can I help?</p>
              <p className="chat-popup__legal">By using this service, you agree to the <span className="link">AI terms</span>.</p>
              <div className="suggestions">
                <button className="suggestion-pill" onClick={() => ask("How to reset my password?")}>
                  <ChatCircle size={14} aria-hidden="true" />How to reset my password?
                </button>
                <button className="suggestion-pill" onClick={() => ask("Who sees my posts?")}>
                  <ChatCircle size={14} aria-hidden="true" />Who sees my posts?
                </button>
                <button className="suggestion-pill" onClick={() => ask("Report abusive content")}>
                  <ChatCircle size={14} aria-hidden="true" />Report abusive content
                </button>
              </div>
            </div>
          )}

          {threadActive && (
            <div className="thread" ref={threadRef} aria-live="polite">
              {messages.map((msg) => {
                if (msg.who === "user") return (
                  <div key={msg.id} className="msg-row msg-row--user">
                    <div className="msg-bubble msg-bubble--user">{msg.text}</div>
                  </div>
                );
                if (msg.who === "typing") return (
                  <div key={msg.id} className="msg-row msg-row--bot">
                    <div className="msg-avatar" aria-hidden="true"><Sparkle size={12} /></div>
                    <div className="msg-bubble msg-bubble--bot msg-bubble--typing">...</div>
                  </div>
                );
                return (
                  <div key={msg.id} className="msg-row msg-row--bot">
                    <div className="msg-avatar" aria-hidden="true"><Sparkle size={12} /></div>
                    <div className="msg-bubble msg-bubble--bot">{msg.text}</div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="composer">
            <input className="composer__input" ref={composerRef} type="text" placeholder="Ask a question..." aria-label="Ask a question" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleComposerKey} />
            <button className="btn-circle btn-circle--sm" aria-label="Send" onClick={handleSend}>
              <PaperPlaneTilt size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
