import React, { useState, useEffect, useRef, useCallback } from "react"
import {
  ArrowLeft,
  ArrowRight,
  ArrowsIn,
  ArrowsOut,
  Baby,
  Brain,
  BuildingOffice,
  CaretDown,
  ChartBar,
  ChatCircle,
  Check,
  ClipboardText,
  CreditCard,
  GenderMale,
  Heart,
  Headset,
  Info,
  PaperPlaneTilt,
  PencilSimple,
  Pill,
  Play,
  ShieldCheck,
  Sparkle,
  UsersThree,
  X,
  type Icon,
} from "@phosphor-icons/react"
import packageJson from "../../package.json"
import { SCENARIOS, type ScenarioType } from "../config/scenarios"
import { SMART_FLOW, CONDITIONS, type SmartNode } from "../config/smartFlow"
import { fetchArticles, searchArticles } from "../utils/kb"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Article {
  id: string
  title: string
  category: string
  tags: string[]
  questions: string[]
  content: string
}

export interface Message {
  id: string
  role: "user" | "bot"
  text?: string
  articles?: Article[]
  chips?: { key: string; label: string }[]
  loading?: boolean
  error?: boolean
  isGreeting?: boolean
  smartNodeId?: string
}

type HelpCenterView = "patient" | "business"

// ─── KB Categories ───────────────────────────────────────────────────────────

const KB_CATEGORIES = [
  "womens-health",
  "mens-health",
  "mental-health",
  "pediatric-care",
  "prescriptions",
  "dermatology",
  "insurance",
  "general-info",
]

const CATEGORY_LABELS: Record<string, string> = {
  "womens-health": "Women's Health",
  "mens-health": "Men's Health",
  "mental-health": "Mental Health",
  "pediatric-care": "Pediatric Care",
  prescriptions: "Prescriptions",
  dermatology: "Dermatology",
  insurance: "Insurance",
  "general-info": "General Info",
}

const CATEGORY_ICONS: Record<string, Icon> = {
  "womens-health": Heart,
  "mens-health": GenderMale,
  "mental-health": Brain,
  "pediatric-care": Baby,
  prescriptions: Pill,
  dermatology: Sparkle,
  insurance: ClipboardText,
  "general-info": Info,
}

const HELP_CENTER_VIEWS: {
  id: HelpCenterView
  label: string
  description: string
}[] = [
  {
    id: "patient",
    label: "Patient Help Center",
    description: "Care, prescriptions, coverage, and account support",
  },
  {
    id: "business",
    label: "Business Help Center",
    description: "Benefits, implementation, reporting, and partner support",
  },
]

const BUSINESS_TOPICS: {
  id: string
  label: string
  description: string
  icon: Icon
}[] = [
  {
    id: "member-access",
    label: "Member access",
    description: "Enrollment, eligibility, and account access",
    icon: UsersThree,
  },
  {
    id: "implementation",
    label: "Implementation",
    description: "Launch planning and organization setup",
    icon: BuildingOffice,
  },
  {
    id: "reporting",
    label: "Reporting",
    description: "Utilization reports and program insights",
    icon: ChartBar,
  },
  {
    id: "billing",
    label: "Billing",
    description: "Invoices, payments, and contract questions",
    icon: CreditCard,
  },
  {
    id: "security",
    label: "Security and compliance",
    description: "Privacy, security reviews, and compliance",
    icon: ShieldCheck,
  },
  {
    id: "partner-support",
    label: "Partner support",
    description: "Get help from the business support team",
    icon: Headset,
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2)
}

function botMsg(fields: Partial<Message>): Message {
  return { id: uid(), role: "bot", ...fields }
}

function userMsg(text: string): Message {
  return { id: uid(), role: "user", text }
}

function categoryLabel(cat: string): string {
  return (
    CATEGORY_LABELS[cat] ||
    cat.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

function CategoryIcon({
  category,
  size = 20,
}: {
  category: string
  size?: number
}) {
  const CategoryIconComponent = CATEGORY_ICONS[category] || Info
  return (
    <CategoryIconComponent size={size} weight="regular" aria-hidden="true" />
  )
}

// ─── Markdown renderer (simple) ───────────────────────────────────────────────

function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="hc-md-h1">
          {line.slice(2)}
        </h1>,
      )
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="hc-md-h2">
          {line.slice(3)}
        </h2>,
      )
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="hc-md-h3">
          {line.slice(4)}
        </h3>,
      )
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = []
      while (
        i < lines.length &&
        (lines[i].startsWith("- ") || lines[i].startsWith("* "))
      ) {
        items.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="hc-md-ul">
          {items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>,
      )
      continue
    } else if (line.trim() === "") {
      // skip blank lines between blocks
    } else {
      elements.push(
        <p key={i} className="hc-md-p">
          {line}
        </p>,
      )
    }
    i++
  }

  return <div className="hc-md">{elements}</div>
}

// ─── Article Card ─────────────────────────────────────────────────────────────

function ArticleCard({
  article,
  onOpen,
}: {
  article: Article
  onOpen: (a: Article) => void
}) {
  return (
    <div className="hc-article-card" onClick={() => onOpen(article)}>
      <div className="hc-article-card__cat">
        {categoryLabel(article.category)}
      </div>
      <div className="hc-article-card__title">{article.title}</div>
      <div className="hc-article-card__arrow">
        <ArrowRight size={16} aria-hidden="true" />
      </div>
    </div>
  )
}

// ─── Greeting Screen ──────────────────────────────────────────────────────────

function GreetingScreen({
  onCategory,
  onCondition,
  onSmartFlow,
}: {
  onCategory: (cat: string) => void
  onCondition: (key: string, smartNodeId?: string) => void
  onSmartFlow: () => void
}) {
  return (
    <div className="hc-greeting">
      <div className="hc-greeting__hero">
        <div className="hc-greeting__avatar">MD</div>
        <div>
          <div className="hc-greeting__name">MDlive Assistant</div>
          <div className="hc-greeting__tagline">How can I help you today?</div>
        </div>
      </div>

      <div className="hc-greeting__section-label">Browse by topic</div>
      <div className="hc-greeting__chips">
        {KB_CATEGORIES.map((cat) => (
          <button key={cat} className="hc-chip" onClick={() => onCategory(cat)}>
            <span className="hc-chip__icon">
              <CategoryIcon category={cat} size={16} />
            </span>
            {categoryLabel(cat)}
          </button>
        ))}
      </div>

      <div className="hc-greeting__section-label">Ask about conditions</div>
      <div className="hc-greeting__chips">
        {CONDITIONS.map((c) => (
          <button
            key={c.key}
            className="hc-chip"
            onClick={() => onCondition(c.key, c.smartNodeId)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="hc-greeting__cta">
        <button className="hc-btn-primary" onClick={onSmartFlow}>
          Ask MD Live
        </button>
      </div>
    </div>
  )
}

function BusinessGreetingScreen({
  onTopic,
}: {
  onTopic: (topic: (typeof BUSINESS_TOPICS)[number]) => void
}) {
  return (
    <div className="hc-greeting">
      <div className="hc-greeting__hero">
        <div className="hc-greeting__avatar">MD</div>
        <div>
          <div className="hc-greeting__name">MDlive Business Support</div>
          <div className="hc-greeting__tagline">
            How can we support your organization?
          </div>
        </div>
      </div>

      <div className="hc-greeting__section-label">Business support topics</div>
      <div className="hc-greeting__chips">
        {BUSINESS_TOPICS.map((topic) => {
          const TopicIcon = topic.icon
          return (
            <button
              key={topic.id}
              className="hc-chip"
              onClick={() => onTopic(topic)}
            >
              <span className="hc-chip__icon">
                <TopicIcon size={16} aria-hidden="true" />
              </span>
              {topic.label}
            </button>
          )
        })}
      </div>

      <div className="hc-business-notice">
        Business knowledge-base content is being prepared. Choose a topic to
        contact the appropriate support team.
      </div>
    </div>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  onChip,
  onOpenArticle,
}: {
  msg: Message
  onChip: (key: string, label: string, msgId: string) => void
  onOpenArticle: (a: Article) => void
}) {
  if (msg.loading) {
    return (
      <div className="hc-msg hc-msg--bot">
        <div className="hc-msg__avatar">MD</div>
        <div className="hc-msg__bubble hc-msg__bubble--loading">
          <span />
          <span />
          <span />
        </div>
      </div>
    )
  }

  const isBot = msg.role === "bot"
  return (
    <div className={`hc-msg ${isBot ? "hc-msg--bot" : "hc-msg--user"}`}>
      {isBot && <div className="hc-msg__avatar">MD</div>}
      <div className="hc-msg__content">
        {msg.text && (
          <div
            className={`hc-msg__bubble ${
              msg.error ? "hc-msg__bubble--error" : ""
            }`}
          >
            {msg.text}
          </div>
        )}
        {msg.articles && msg.articles.length > 0 && (
          <div className="hc-msg__articles">
            {msg.articles.map((a) => (
              <ArticleCard key={a.id} article={a} onOpen={onOpenArticle} />
            ))}
          </div>
        )}
        {msg.chips && msg.chips.length > 0 && (
          <div className="hc-msg__chips">
            {msg.chips.map((chip) => (
              <button
                key={chip.key}
                className="hc-chip hc-chip--follow"
                onClick={() => onChip(chip.key, chip.label, msg.id)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Article Viewer ───────────────────────────────────────────────────────────

function ArticleViewer({
  article,
  onClose,
}: {
  article: Article
  onClose: () => void
}) {
  return (
    <div className="hc-article-viewer">
      <div className="hc-article-viewer__header">
        <button className="hc-icon-btn" onClick={onClose}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>
        <div className="hc-article-viewer__cat">
          {categoryLabel(article.category)}
        </div>
      </div>
      <div className="hc-article-viewer__body">
        <h1 className="hc-article-viewer__title">{article.title}</h1>
        <SimpleMarkdown content={article.content} />
      </div>
    </div>
  )
}

// ─── History Panel ────────────────────────────────────────────────────────────

function HistoryPanel({
  conversations,
  onSelect,
  onClear,
}: {
  conversations: { id: string; preview: string; ts: number }[]
  onSelect: (id: string) => void
  onClear: () => void
}) {
  return (
    <div className="hc-history">
      <div className="hc-history__header">
        <span>Recent conversations</span>
        {conversations.length > 0 && (
          <button className="hc-text-btn" onClick={onClear}>
            Clear all
          </button>
        )}
      </div>
      {conversations.length === 0 ? (
        <div className="hc-history__empty">No saved conversations yet.</div>
      ) : (
        <div className="hc-history__list">
          {conversations.map((c) => (
            <button
              key={c.id}
              className="hc-history__item"
              onClick={() => onSelect(c.id)}
            >
              <div className="hc-history__item-preview">{c.preview}</div>
              <div className="hc-history__item-ts">
                {new Date(c.ts).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Help Center View Switcher ────────────────────────────────────────────────

function HelpCenterSwitcher({
  currentView,
  onViewChange,
}: {
  currentView: HelpCenterView
  onViewChange: (view: HelpCenterView) => void
}) {
  const [open, setOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)
  const selectedView = HELP_CENTER_VIEWS.find((view) => view.id === currentView)!

  useEffect(() => {
    if (!open) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!switcherRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", closeOnOutsideClick)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [open])

  return (
    <div className="hc-view-switcher" ref={switcherRef}>
      <button
        className="hc-view-switcher__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span>{selectedView.label}</span>
        <CaretDown
          className={`hc-view-switcher__caret ${
            open ? "hc-view-switcher__caret--open" : ""
          }`}
          size={16}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          className="hc-view-switcher__menu"
          role="menu"
          aria-label="Help Center view"
        >
          <div className="hc-view-switcher__eyebrow">Choose your Help Center</div>
          {HELP_CENTER_VIEWS.map((view) => {
            const isSelected = view.id === currentView
            return (
              <button
                key={view.id}
                className={`hc-view-switcher__item ${
                  isSelected ? "hc-view-switcher__item--selected" : ""
                }`}
                onClick={() => {
                  onViewChange(view.id)
                  setOpen(false)
                }}
                role="menuitemradio"
                aria-checked={isSelected}
              >
                <span className="hc-view-switcher__check">
                  {isSelected && (
                    <Check size={16} weight="bold" aria-hidden="true" />
                  )}
                </span>
                <span className="hc-view-switcher__copy">
                  <span className="hc-view-switcher__name">{view.label}</span>
                  <span className="hc-view-switcher__description">
                    {view.description}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Canvas Topbar ────────────────────────────────────────────────────────────

function CanvasTopbar({
  currentScenario,
  onScenarioChange,
  mode,
  onModeChange,
}: {
  currentScenario: ScenarioType
  onScenarioChange: (scenario: ScenarioType) => void
  mode: "edit" | "prototype"
  onModeChange: (mode: "edit" | "prototype") => void
}) {
  const [scenarioMenuOpen, setScenarioMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const isEditMode = mode === "edit"
  const selectedScenario = SCENARIOS[currentScenario]

  useEffect(() => {
    if (!isEditMode) setScenarioMenuOpen(false)
  }, [isEditMode])

  useEffect(() => {
    if (!scenarioMenuOpen) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setScenarioMenuOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setScenarioMenuOpen(false)
    }

    document.addEventListener("mousedown", closeOnOutsideClick)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [scenarioMenuOpen])

  return (
    <div className="hc-canvas-bar">
      <div className="hc-canvas-bar__left">
        <span className="hc-canvas-bar__label">Testing canvas</span>
        <div className="hc-mode-toggle" aria-label="Canvas mode">
          <button
            className={`hc-mode-toggle__option ${
              isEditMode ? "hc-mode-toggle__option--active" : ""
            }`}
            onClick={() => onModeChange("edit")}
            aria-pressed={isEditMode}
          >
            <PencilSimple size={14} aria-hidden="true" />
            Edit
          </button>
          <button
            className={`hc-mode-toggle__option ${
              !isEditMode ? "hc-mode-toggle__option--active" : ""
            }`}
            onClick={() => onModeChange("prototype")}
            aria-pressed={!isEditMode}
          >
            <Play size={14} weight="fill" aria-hidden="true" />
            Prototype
          </button>
        </div>
      </div>
      <div className="hc-canvas-bar__right">
        <span className="hc-canvas-bar__label">Scenario</span>
        <div className="hc-scenario-picker" ref={menuRef}>
          <button
            className="hc-scenario-picker__trigger"
            onClick={() => setScenarioMenuOpen((open) => !open)}
            disabled={!isEditMode}
            aria-haspopup="menu"
            aria-expanded={scenarioMenuOpen}
            title={
              isEditMode
                ? "Choose a test scenario"
                : "Switch to Edit mode to change scenarios"
            }
          >
            <span>{selectedScenario.name}</span>
            <CaretDown
              className={`hc-scenario-picker__caret ${
                scenarioMenuOpen ? "hc-scenario-picker__caret--open" : ""
              }`}
              size={14}
              aria-hidden="true"
            />
          </button>
          {scenarioMenuOpen && (
            <div
              className="hc-scenario-menu"
              role="menu"
              aria-label="Test scenarios"
            >
              {Object.values(SCENARIOS).map((scenario) => {
                const isSelected = scenario.id === currentScenario
                return (
                  <button
                    key={scenario.id}
                    className={`hc-scenario-menu__item ${
                      isSelected ? "hc-scenario-menu__item--selected" : ""
                    }`}
                    onClick={() => {
                      onScenarioChange(scenario.id as ScenarioType)
                      setScenarioMenuOpen(false)
                    }}
                    role="menuitemradio"
                    aria-checked={isSelected}
                  >
                    <span className="hc-scenario-menu__check">
                      {isSelected && (
                        <Check size={15} weight="bold" aria-hidden="true" />
                      )}
                    </span>
                    <span className="hc-scenario-menu__copy">
                      <span className="hc-scenario-menu__name">
                        {scenario.name}
                      </span>
                      <span className="hc-scenario-menu__description">
                        {scenario.description}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  // Canvas
  const [canvasMode, setCanvasMode] = useState<"edit" | "prototype">("edit")
  const [currentScenario, setCurrentScenario] =
    useState<ScenarioType>("default")
  const [helpCenterView, setHelpCenterView] =
    useState<HelpCenterView>("patient")

  // KB
  const [articles, setArticles] = useState<Article[]>([])
  const [kbLoaded, setKbLoaded] = useState(false)

  // Popup
  const [popupOpen, setPopupOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState<"conversation" | "articles">(
    "conversation",
  )

  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [threadActive, setThreadActive] = useState(false)
  const [composerValue, setComposerValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  // Article viewer
  const [viewingArticle, setViewingArticle] = useState<Article | null>(null)

  // History
  const [conversations, setConversations] = useState<{
    id: string
    preview: string
    ts: number
  }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("hc-conversations") || "[]")
    } catch {
      return []
    }
  })

  // Search (articles tab)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Article[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLInputElement>(null)

  // ── Load KB ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const scenario = SCENARIOS[currentScenario]
    if (!scenario.kbAvailable) {
      setArticles([])
      setKbLoaded(true)
      return
    }
    fetchArticles(KB_CATEGORIES)
      .then((arts) => {
        setArticles(arts)
        setKbLoaded(true)
      })
      .catch(() => {
        setArticles([])
        setKbLoaded(true)
      })
  }, [currentScenario])

  // ── Scroll to bottom ───────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ── Save conversations ─────────────────────────────────────────────────────

  useEffect(() => {
    localStorage.setItem("hc-conversations", JSON.stringify(conversations))
  }, [conversations])

  // ── Search ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    if (helpCenterView === "business") {
      setSearchResults([])
      return
    }
    const scenario = SCENARIOS[currentScenario]
    const results = scenario.searchMock(searchQuery, articles)
    setSearchResults(results)
  }, [searchQuery, articles, currentScenario, helpCenterView])

  // ── Bot utilities ──────────────────────────────────────────────────────────

  const addMsg = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg])
  }, [])

  const replaceLoadingMsg = useCallback(
    (msgId: string, fields: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, loading: false, ...fields } : m,
        ),
      )
    },
    [],
  )

  const delay = useCallback(
    (ms: number) => new Promise<void>((r) => setTimeout(r, ms)),
    [],
  )

  // ── Smart flow ─────────────────────────────────────────────────────────────

  const sendSmartNode = useCallback(
    async (nodeId: string) => {
      const node: SmartNode | undefined = SMART_FLOW[nodeId]
      if (!node) return
      const scenario = SCENARIOS[currentScenario]

      const loadingId = uid()
      addMsg({ id: loadingId, role: "bot", loading: true })
      await delay(scenario.delay)

      replaceLoadingMsg(loadingId, {
        text: node.text,
        chips: node.chips?.map((c) => ({ key: c.key, label: c.label })),
        smartNodeId: nodeId,
      })
    },
    [currentScenario, addMsg, delay, replaceLoadingMsg],
  )

  const resolveSmartChip = useCallback(
    async (chipKey: string, chipLabel: string, msgId: string) => {
      // Find the source message to look up the node
      setMessages((prev) => {
        const srcMsg = prev.find((m) => m.id === msgId)
        if (!srcMsg?.smartNodeId) return prev
        const node = SMART_FLOW[srcMsg.smartNodeId]
        if (!node?.chips) return prev
        const chip = node.chips.find((c) => c.key === chipKey)
        if (!chip) return prev
        return prev // actual navigation happens below
      })

      // Add user echo
      addMsg(userMsg(chipLabel))

      // Resolve the chip action
      const srcMsg = messages.find((m) => m.id === msgId)
      if (!srcMsg?.smartNodeId) return
      const node = SMART_FLOW[srcMsg.smartNodeId]
      if (!node?.chips) return
      const chip = node.chips.find((c) => c.key === chipKey)
      if (!chip) return

      if (chip.goTo) {
        await sendSmartNode(chip.goTo)
      } else if (chip.action === "reset") {
        setThreadActive(false)
        setMessages([])
      } else if (chip.action === "learn-more") {
        setActiveTab("articles")
      } else if (chip.action === "category:pediatric-care") {
        await sendCategoryMsg("pediatric-care")
      } else if (chip.articleId) {
        const article = articles.find((a) => a.id === chip.articleId)
        if (article) {
          setViewingArticle(article)
        } else {
          addMsg(
            botMsg({
              text: "I couldn't find that article right now. Try searching for it.",
            }),
          )
        }
      }
    },
    [messages, articles, sendSmartNode, addMsg],
  )

  // ── Category / search flows ────────────────────────────────────────────────

  const sendCategoryMsg = useCallback(
    async (cat: string) => {
      const scenario = SCENARIOS[currentScenario]
      const catArticles = articles.filter((a) => a.category === cat).slice(0, 4)

      const loadingId = uid()
      addMsg({ id: loadingId, role: "bot", loading: true })
      await delay(scenario.delay)

      if (!scenario.kbAvailable || articles.length === 0) {
        replaceLoadingMsg(loadingId, {
          text: "I'm having trouble loading articles right now. Please try again in a moment.",
          error: true,
        })
        return
      }

      if (catArticles.length === 0) {
        replaceLoadingMsg(loadingId, {
          text: `I don't have any articles for ${categoryLabel(cat)} yet. Try a different topic or search above.`,
        })
        return
      }

      replaceLoadingMsg(loadingId, {
        text: `Here are some articles on ${categoryLabel(cat)}:`,
        articles: catArticles,
      })
    },
    [currentScenario, articles, addMsg, delay, replaceLoadingMsg],
  )

  const sendSearchMsg = useCallback(
    async (query: string) => {
      const scenario = SCENARIOS[currentScenario]
      const loadingId = uid()
      addMsg({ id: loadingId, role: "bot", loading: true })
      await delay(scenario.delay)

      if (helpCenterView === "business") {
        replaceLoadingMsg(loadingId, {
          text: "Business Help Center articles are being prepared. Contact your MDlive account team for organization-specific support.",
          chips: [{ key: "reset", label: "Start over" }],
        })
        return
      }

      if (!scenario.kbAvailable) {
        replaceLoadingMsg(loadingId, {
          text: "The knowledge base is unavailable right now. Please try again later.",
          error: true,
        })
        return
      }

      const results = scenario.searchMock(query, articles)

      if (results.length === 0) {
        replaceLoadingMsg(loadingId, {
          text: "I couldn't find any articles matching your question. Try rephrasing, or contact support at 1-800-400-6354.",
          chips: [{ key: "reset", label: "Start over" }],
        })
        return
      }

      replaceLoadingMsg(loadingId, {
        text: `Here's what I found for "${query}":`,
        articles: results,
      })
    },
    [
      currentScenario,
      articles,
      helpCenterView,
      addMsg,
      delay,
      replaceLoadingMsg,
    ],
  )

  // ── Submit message ─────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const q = composerValue.trim()
    if (!q || isTyping) return
    setComposerValue("")
    setIsTyping(true)

    if (!threadActive) setThreadActive(true)
    addMsg(userMsg(q))
    await sendSearchMsg(q)

    setIsTyping(false)
  }, [composerValue, isTyping, threadActive, addMsg, sendSearchMsg])

  // ── Greeting chip handlers ─────────────────────────────────────────────────

  const handleCategory = useCallback(
    async (cat: string) => {
      if (!threadActive) setThreadActive(true)
      addMsg(userMsg(`Tell me about ${categoryLabel(cat)}`))
      await sendCategoryMsg(cat)
    },
    [threadActive, addMsg, sendCategoryMsg],
  )

  const handleBusinessTopic = useCallback(
    async (topic: (typeof BUSINESS_TOPICS)[number]) => {
      if (!threadActive) setThreadActive(true)
      addMsg(userMsg(topic.label))

      const loadingId = uid()
      addMsg({ id: loadingId, role: "bot", loading: true })
      await delay(SCENARIOS[currentScenario].delay)
      replaceLoadingMsg(loadingId, {
        text: `For help with ${topic.label.toLowerCase()}, contact your MDlive account team. Business knowledge-base resources for this topic are coming soon.`,
        chips: [{ key: "reset", label: "Choose another topic" }],
      })
    },
    [
      threadActive,
      currentScenario,
      addMsg,
      delay,
      replaceLoadingMsg,
    ],
  )

  const handleCondition = useCallback(
    async (key: string, smartNodeId?: string) => {
      if (!threadActive) setThreadActive(true)
      addMsg(userMsg(key.charAt(0).toUpperCase() + key.slice(1)))
      if (smartNodeId) {
        await sendSmartNode(smartNodeId)
      } else {
        await sendSearchMsg(key)
      }
    },
    [threadActive, addMsg, sendSmartNode, sendSearchMsg],
  )

  const handleSmartFlow = useCallback(async () => {
    if (!threadActive) setThreadActive(true)
    addMsg(userMsg("Ask MD Live"))
    await sendSmartNode("wh-menopause")
  }, [threadActive, addMsg, sendSmartNode])

  // ── Chip clicked (from message) ────────────────────────────────────────────

  const handleChip = useCallback(
    async (key: string, label: string, msgId: string) => {
      if (key === "reset") {
        setThreadActive(false)
        setMessages([])
        return
      }

      // Check if this is a smart flow chip
      const srcMsg = messages.find((m) => m.id === msgId)
      if (srcMsg?.smartNodeId) {
        await resolveSmartChip(key, label, msgId)
        return
      }

      // Generic chip — treat as search
      addMsg(userMsg(label))
      await sendSearchMsg(label)
    },
    [messages, resolveSmartChip, addMsg, sendSearchMsg],
  )

  // ── Save / restore conversation ────────────────────────────────────────────

  const saveConversation = useCallback(() => {
    if (messages.length === 0) return
    const id = uid()
    const preview =
      messages.find((m) => m.role === "user")?.text?.slice(0, 60) ||
      "Conversation"
    setConversations((prev) => [
      { id, preview, ts: Date.now() },
      ...prev.slice(0, 9),
    ])
  }, [messages])

  const clearConversations = useCallback(() => setConversations([]), [])

  // ── Keyboard ───────────────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  // ── Render popup content ───────────────────────────────────────────────────

  function renderConversationTab() {
    if (viewingArticle) {
      return (
        <ArticleViewer
          article={viewingArticle}
          onClose={() => setViewingArticle(null)}
        />
      )
    }

    if (!threadActive) {
      if (helpCenterView === "business") {
        return <BusinessGreetingScreen onTopic={handleBusinessTopic} />
      }
      return (
        <GreetingScreen
          onCategory={handleCategory}
          onCondition={handleCondition}
          onSmartFlow={handleSmartFlow}
        />
      )
    }

    return (
      <div className="hc-thread">
        <div className="hc-thread__messages">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onChip={handleChip}
              onOpenArticle={setViewingArticle}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="hc-thread__actions">
          <button
            className="hc-text-btn"
            onClick={() => {
              saveConversation()
              setThreadActive(false)
              setMessages([])
            }}
          >
            Save &amp; start over
          </button>
        </div>
      </div>
    )
  }

  function renderArticlesTab() {
    if (helpCenterView === "business") {
      return (
        <div className="hc-articles-tab">
          <div className="hc-articles-tab__search">
            <input
              className="hc-input"
              placeholder="Search business support..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="hc-business-empty">
            <Headset size={28} aria-hidden="true" />
            <div className="hc-business-empty__title">
              Business resources are coming soon
            </div>
            <div className="hc-business-empty__copy">
              Contact your MDlive account team for benefits, implementation,
              reporting, billing, or technical support.
            </div>
            <button
              className="hc-btn-primary"
              onClick={() => {
                setActiveTab("conversation")
                setSearchQuery("")
              }}
            >
              View support topics
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="hc-articles-tab">
        <div className="hc-articles-tab__search">
          <input
            className="hc-input"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {searchQuery && searchResults.length === 0 && (
          <div className="hc-articles-tab__empty">
            No results for "{searchQuery}".
          </div>
        )}
        {searchResults.length > 0 && (
          <div className="hc-articles-tab__results">
            {searchResults.map((a) => (
              <ArticleCard key={a.id} article={a} onOpen={setViewingArticle} />
            ))}
          </div>
        )}
        {!searchQuery && (
          <div className="hc-articles-tab__categories">
            {KB_CATEGORIES.map((cat) => {
              const count = articles.filter((a) => a.category === cat).length
              return (
                <button
                  key={cat}
                  className="hc-category-row"
                  onClick={() => {
                    setActiveTab("conversation")
                    handleCategory(cat)
                  }}
                >
                  <span className="hc-category-row__icon">
                    <CategoryIcon category={cat} size={19} />
                  </span>
                  <span className="hc-category-row__label">
                    {categoryLabel(cat)}
                  </span>
                  <span className="hc-category-row__count">{count}</span>
                  <span className="hc-category-row__arrow">
                    <ArrowRight size={16} aria-hidden="true" />
                  </span>
                </button>
              )
            })}
          </div>
        )}
        {conversations.length > 0 && (
          <div className="hc-articles-tab__history">
            <HistoryPanel
              conversations={conversations}
              onSelect={() => {}}
              onClear={clearConversations}
            />
          </div>
        )}
      </div>
    )
  }

  // ── Public page ────────────────────────────────────────────────────────────

  function handleViewChange(view: HelpCenterView) {
    if (view === helpCenterView) return
    setHelpCenterView(view)
    setPopupOpen(false)
    setActiveTab("conversation")
    setThreadActive(false)
    setMessages([])
    setViewingArticle(null)
    setSearchQuery("")
    setSearchResults([])
  }

  function renderPublicPage() {
    const isBusinessView = helpCenterView === "business"

    return (
      <div className="hc-page">
        <header className="hc-header">
          <div className="hc-header__logo">MDlive</div>
          <nav className="hc-header__nav" aria-label="Help Center audience">
            <HelpCenterSwitcher
              currentView={helpCenterView}
              onViewChange={handleViewChange}
            />
          </nav>
        </header>

        <section className="hc-hero">
          <div className="hc-hero__eyebrow">
            {isBusinessView ? "For organizations" : "For patients"}
          </div>
          <h1 className="hc-hero__title">
            {isBusinessView
              ? "Business support, all in one place"
              : "How can we help you?"}
          </h1>
          <p className="hc-hero__sub">
            {isBusinessView
              ? "Find guidance for benefits, implementation, reporting, and partner support"
              : "Search our Help Center or chat with us"}
          </p>
          <div className="hc-hero__search-wrap">
            <input
              className="hc-hero__search"
              placeholder={
                isBusinessView
                  ? "Search business support..."
                  : "Search for answers..."
              }
              onFocus={() => {
                setPopupOpen(true)
                setActiveTab("articles")
              }}
            />
            <button className="hc-hero__search-btn">Search</button>
          </div>
        </section>

        <section className="hc-categories">
          <h2 className="hc-categories__title">
            {isBusinessView ? "Business support topics" : "Browse by category"}
          </h2>
          <div className="hc-categories__grid">
            {isBusinessView
              ? BUSINESS_TOPICS.map((topic) => {
                  const TopicIcon = topic.icon
                  return (
                    <button
                      key={topic.id}
                      className="hc-topic-card"
                      onClick={() => {
                        setPopupOpen(true)
                        setActiveTab("conversation")
                        handleBusinessTopic(topic)
                      }}
                    >
                      <span className="hc-topic-card__icon">
                        <TopicIcon size={25} aria-hidden="true" />
                      </span>
                      <span className="hc-topic-card__label">{topic.label}</span>
                      <span className="hc-topic-card__description">
                        {topic.description}
                      </span>
                    </button>
                  )
                })
              : KB_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className="hc-topic-card"
                    onClick={() => {
                      setPopupOpen(true)
                      handleCategory(cat)
                    }}
                  >
                    <span className="hc-topic-card__icon">
                      <CategoryIcon category={cat} size={25} />
                    </span>
                    <span className="hc-topic-card__label">
                      {categoryLabel(cat)}
                    </span>
                  </button>
                ))}
          </div>
        </section>
        <footer className="hc-footer">
          <span>
            MDlive {isBusinessView ? "Business" : "Patient"} Help Center
            prototype
          </span>
          <span className="hc-footer__version">Version {packageJson.version}</span>
        </footer>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="hc-root hc-root--canvas">
      <CanvasTopbar
        currentScenario={currentScenario}
        onScenarioChange={(scenario) => {
          setCurrentScenario(scenario)
          setKbLoaded(false)
          setArticles([])
        }}
        mode={canvasMode}
        onModeChange={setCanvasMode}
      />

      {renderPublicPage()}

      {/* FAB */}
      <button
        className={`hc-fab ${popupOpen ? "hc-fab--open" : ""}`}
        onClick={() => setPopupOpen((v) => !v)}
        aria-label="Chat with us"
      >
        {popupOpen ? (
          <X size={21} weight="bold" aria-hidden="true" />
        ) : (
          <ChatCircle size={24} weight="regular" aria-hidden="true" />
        )}
      </button>

      {/* Chat popup */}
      {popupOpen && (
        <div
          className={`hc-popup ${isFullscreen ? "hc-popup--fullscreen" : ""}`}
        >
          {/* Popup toolbar */}
          <div className="hc-popup__toolbar">
            <div className="hc-popup__toolbar-title">
              {helpCenterView === "business"
                ? "MDlive Business Help"
                : "MDlive Help"}
            </div>
            <div className="hc-popup__toolbar-actions">
              <button
                className="hc-icon-btn"
                title={isFullscreen ? "Collapse" : "Expand"}
                onClick={() => setIsFullscreen((v) => !v)}
                aria-label={isFullscreen ? "Collapse chat" : "Expand chat"}
              >
                {isFullscreen ? (
                  <ArrowsIn size={17} aria-hidden="true" />
                ) : (
                  <ArrowsOut size={17} aria-hidden="true" />
                )}
              </button>
              <button
                className="hc-icon-btn"
                onClick={() => setPopupOpen(false)}
                title="Close"
                aria-label="Close chat"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="hc-popup__tabs">
            <button
              className={`hc-tab ${
                activeTab === "conversation" ? "hc-tab--active" : ""
              }`}
              onClick={() => setActiveTab("conversation")}
            >
              Conversation
            </button>
            <button
              className={`hc-tab ${
                activeTab === "articles" ? "hc-tab--active" : ""
              }`}
              onClick={() => setActiveTab("articles")}
            >
              Articles
            </button>
          </div>

          {/* Tab content */}
          <div className="hc-popup__body">
            {activeTab === "conversation"
              ? renderConversationTab()
              : renderArticlesTab()}
          </div>

          {/* Composer (only in conversation tab when thread is active and no article is showing) */}
          {activeTab === "conversation" && threadActive && !viewingArticle && (
            <div className="hc-composer">
              <input
                ref={composerRef}
                className="hc-composer__input"
                placeholder="Type a question..."
                value={composerValue}
                onChange={(e) => setComposerValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
              />
              <button
                className="hc-composer__send"
                onClick={handleSubmit}
                disabled={!composerValue.trim() || isTyping}
                aria-label="Send"
              >
                <PaperPlaneTilt size={18} weight="fill" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
