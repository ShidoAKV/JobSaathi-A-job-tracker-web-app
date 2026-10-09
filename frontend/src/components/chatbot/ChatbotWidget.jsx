import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Trash2, X, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import ChatMessage from "./ChatMessage";
import LottiePlayer from "./LottiePlayer";
import { askChatbot, getAiStatus } from "../../services/chatbotService";
import { getErrorMessage } from "../../services/api";
import useAuthUser from "../../hooks/useAuthUser";
import botAnimation from "./lottie/bot.json";
import typingAnimation from "./lottie/typing.json";

const QUICK_QUESTIONS = [
  { label: "📊 My stats", text: "Show my stats on the platform" },
  { label: "🔥 Top 10 jobs today", text: "What are the top 10 jobs today?" },
  { label: "🗓 Upcoming interviews", text: "What are my upcoming interviews?" },
  { label: "🏢 About Google", text: "Tell me about Google as a company" },
  { label: "💡 Interview tips", text: "Give me 5 tips to convert more applications into interviews" },
];

const STORAGE_KEY = "jobsaathi-chat";

const welcomeFor = (name) => ({
  role: "bot",
  intent: "general",
  text: `Hi ${name ? name.split(" ")[0] : "there"}! 👋 I'm your JobSaathi assistant.\n\nI can show **your stats**, list **today's top jobs**, or tell you about **any company** (even ones not listed here). Pick a quick question or type your own.`,
});

const loadStored = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const ChatbotWidget = () => {
  const user = useAuthUser();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => loadStored() || [welcomeFor(user?.name)]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasUnseen, setHasUnseen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [ai, setAi] = useState({ configured: true, lastError: null });
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setHasUnseen(false);
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [open, messages, loading]);

  // Check whether Gemini is live each time the panel opens.
  useEffect(() => {
    if (!open) return;
    getAiStatus()
      .then((status) => status && setAi(status))
      .catch(() => {});
  }, [open]);

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const history = messages
      .filter((m) => m.role === "user" || m.role === "bot")
      .slice(-8)
      .map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.text }));

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);
    setConfirmClear(false);

    try {
      const data = await askChatbot(trimmed, history);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.reply, intent: data.intent, data: data.data },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          intent: "general",
          text: "Sorry, I couldn't process that right now.",
          error: getErrorMessage(error),
        },
      ]);
    } finally {
      setLoading(false);
      if (!open) setHasUnseen(true);
    }
  };

  const clearChat = () => {
    setMessages([welcomeFor(user?.name)]);
    sessionStorage.removeItem(STORAGE_KEY);
    setConfirmClear(false);
    toast.success("Chat cleared");
  };

  const aiHealthy = ai.configured && !ai.lastError;
  const canClear = messages.length > 1;

  return (
    <>
      {open && (
        <div className="fixed bottom-28 right-4 sm:right-6 z-[65] w-[calc(100vw-2rem)] sm:w-[400px] h-[600px] max-h-[calc(100vh-8.5rem)] card shadow-pop flex flex-col overflow-hidden animate-rise">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-line bg-surface-2/60">
            <div className="w-11 h-11 rounded-2xl bg-primary-soft border border-line overflow-hidden flex items-center justify-center">
              <LottiePlayer animation={botAnimation} className="w-11 h-11" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-fg leading-tight">JobSaathi Assistant</p>
              <p className="text-xs text-fg-muted flex items-center gap-1.5 truncate">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${aiHealthy ? "bg-success" : "bg-warning"}`} />
                {aiHealthy ? "Online · powered by Gemini" : "Online · AI answers limited"}
              </p>
            </div>
            <button
              onClick={() => setConfirmClear((v) => !v)}
              disabled={!canClear}
              className={`icon-btn w-9 h-9 ${confirmClear ? "text-danger border-danger/40" : ""}`}
              title="Clear chat"
              aria-label="Clear chat"
            >
              <Trash2 size={16} />
            </button>
            <button onClick={() => setOpen(false)} className="icon-btn w-9 h-9" title="Close" aria-label="Close assistant panel">
              <X size={16} />
            </button>
          </div>

          {confirmClear && (
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-danger-soft border-b border-line animate-pop">
              <p className="text-xs text-danger font-medium">Clear this conversation? This can't be undone.</p>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setConfirmClear(false)} className="btn-ghost px-2.5 py-1 text-xs">
                  Keep
                </button>
                <button onClick={clearChat} className="btn-danger px-2.5 py-1 text-xs">
                  Clear chat
                </button>
              </div>
            </div>
          )}

          {!aiHealthy && (
            <div className="flex items-start gap-2 px-4 py-2.5 bg-warning-soft border-b border-line text-xs text-warning">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <p>
                {ai.lastError || "Gemini API key is not configured."} Stats, top jobs and platform
                listings still work from the database.
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => (
              <ChatMessage key={i} message={m} />
            ))}

            {loading && (
              <div className="flex items-end gap-2 animate-fade">
                <div className="w-8 h-8 rounded-full bg-primary-soft border border-line overflow-hidden flex items-center justify-center">
                  <LottiePlayer animation={botAnimation} className="w-8 h-8" />
                </div>
                <div className="bg-surface-2 border border-line rounded-2xl rounded-bl-md px-2 py-1">
                  <LottiePlayer animation={typingAnimation} className="w-16 h-6" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-line bg-surface">
            <div className="flex gap-2 overflow-x-auto px-3 pt-3 pb-1 [scrollbar-width:none]">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => send(q.text)}
                  disabled={loading}
                  className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full bg-surface-2 border border-line text-fg-muted hover:text-primary hover:border-primary/50 transition-colors disabled:opacity-50"
                >
                  {q.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 p-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about jobs, companies or your stats…"
                className="input"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="btn-primary w-11 h-11 p-0 rounded-xl shrink-0"
                aria-label="Send"
              >
                <Send size={17} />
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-4 sm:right-6 z-[66] flex items-center gap-3 group">
        {!open && (
          <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-line text-xs font-semibold text-fg shadow-card opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
            <Sparkles size={13} className="text-primary" />
            Ask JobSaathi
          </span>
        )}

        <div className={open ? "" : "animate-float"}>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close assistant" : "Open assistant"}
            className="relative w-16 h-16 rounded-full bg-primary shadow-pop flex items-center justify-center overflow-hidden transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            {!open && (
              <span className="absolute inset-0 rounded-full bg-primary animate-ping-slow pointer-events-none" />
            )}
            <span className="relative w-16 h-16 flex items-center justify-center">
              {open ? (
                <X size={26} className="text-on-primary" />
              ) : (
                <LottiePlayer animation={botAnimation} className="w-14 h-14" />
              )}
            </span>
            {!open && (hasUnseen || messages.length <= 1) && (
              <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-success border-2 border-primary" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatbotWidget;
