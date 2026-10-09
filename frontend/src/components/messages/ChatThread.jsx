import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Briefcase, Send, Wifi, WifiOff } from "lucide-react";
import { format, isSameDay } from "date-fns";
import toast from "react-hot-toast";
import { getMessages, sendMessage } from "../../services/conversationService";
import { getSocket } from "../../services/socket";
import { getErrorMessage } from "../../services/api";
import { getInitials } from "../../utils/auth";
import Spinner from "../ui/Spinner";

const FALLBACK_POLL_MS = 15000;
const TYPING_IDLE_MS = 1800;

const ChatThread = ({ conversation, currentUserId, onBack, onActivity }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const bottomRef = useRef(null);
  const lastSeenRef = useRef(null);
  const typingTimer = useRef(null);
  const typingSent = useRef(false);
  const peerTypingTimer = useRef(null);

  const conversationId = conversation._id;

  const appendMessage = useCallback((msg) => {
    setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
    lastSeenRef.current = msg.createdAt;
  }, []);

  // Initial history load (REST) + socket room subscription + slow polling fallback.
  useEffect(() => {
    let active = true;
    setMessages([]);
    setLoading(true);
    setPeerTyping(false);
    lastSeenRef.current = null;

    const fetchAll = async () => {
      try {
        const data = await getMessages(conversationId);
        if (!active) return;
        setMessages(data);
        lastSeenRef.current = data.length ? data[data.length - 1].createdAt : null;
        onActivity?.();
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to load messages"));
      } finally {
        if (active) setLoading(false);
      }
    };

    const pollNew = async () => {
      try {
        const data = await getMessages(conversationId, lastSeenRef.current || undefined);
        if (!active || data.length === 0) return;
        data.forEach(appendMessage);
        onActivity?.();
      } catch {
        /* transient */
      }
    };

    fetchAll();

    const socket = getSocket();
    const onConnect = () => {
      setConnected(true);
      socket.emit("conversation:join", conversationId, (ack) => {
        if (ack?.error) toast.error(ack.error);
      });
      pollNew(); // catch anything missed while disconnected
    };
    const onDisconnect = () => setConnected(false);
    const onMessage = (msg) => {
      const convId = typeof msg.conversation === "object" ? msg.conversation?._id : msg.conversation;
      if (convId && convId !== conversationId) return;
      appendMessage(msg);
      setPeerTyping(false);
      if (msg.sender?._id !== currentUserId) {
        socket.emit("messages:read", { conversationId });
      }
      onActivity?.();
    };
    const onTyping = ({ conversationId: cid, userId, isTyping }) => {
      if (cid !== conversationId || userId === currentUserId) return;
      clearTimeout(peerTypingTimer.current);
      setPeerTyping(Boolean(isTyping));
      if (isTyping) peerTypingTimer.current = setTimeout(() => setPeerTyping(false), 4000);
    };

    if (socket) {
      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("message:new", onMessage);
      socket.on("typing", onTyping);
      if (socket.connected) onConnect();
    }

    const pollId = setInterval(() => {
      if (!socket || !socket.connected) pollNew();
    }, FALLBACK_POLL_MS);

    return () => {
      active = false;
      clearInterval(pollId);
      clearTimeout(peerTypingTimer.current);
      if (socket) {
        socket.emit("conversation:leave", conversationId);
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("message:new", onMessage);
        socket.off("typing", onTyping);
      }
    };
  }, [conversationId, currentUserId, appendMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, peerTyping]);

  const emitTyping = (isTyping) => {
    const socket = getSocket();
    if (!socket?.connected) return;
    socket.emit("typing", { conversationId, isTyping });
    typingSent.current = isTyping;
  };

  const handleChange = (e) => {
    setText(e.target.value);
    if (!typingSent.current) emitTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), TYPING_IDLE_MS);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    clearTimeout(typingTimer.current);
    if (typingSent.current) emitTyping(false);

    const socket = getSocket();
    const viaSocket = () =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("timeout")), 5000);
        socket.emit("message:send", { conversationId, text: trimmed }, (ack) => {
          clearTimeout(timer);
          if (ack?.ok) resolve(ack.message);
          else reject(new Error(ack?.error || "Failed to send"));
        });
      });

    try {
      let msg;
      if (socket?.connected) {
        try {
          msg = await viaSocket();
        } catch {
          msg = await sendMessage(conversationId, trimmed);
        }
      } else {
        msg = await sendMessage(conversationId, trimmed);
      }
      appendMessage(msg);
      setText("");
      onActivity?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to send"));
    } finally {
      setSending(false);
    }
  };

  const other = conversation.otherUser;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
        <button onClick={onBack} className="icon-btn w-9 h-9 lg:hidden" aria-label="Back">
          <ArrowLeft size={17} />
        </button>
        <div className="w-10 h-10 rounded-full bg-surface-3 text-fg flex items-center justify-center text-sm font-bold">
          {getInitials(other?.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-fg truncate">{other?.name || "Company"}</p>
          <p className="text-xs text-fg-muted truncate flex items-center gap-1">
            <Briefcase size={11} /> {conversation.listing?.role} at {conversation.listing?.company}
          </p>
        </div>
        <span
          className={`hidden sm:flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full border ${
            connected ? "text-success border-success/30 bg-success-soft" : "text-fg-muted border-line bg-surface-2"
          }`}
          title={connected ? "Real-time connection active" : "Reconnecting… messages will sync shortly"}
        >
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {connected ? "Live" : "Offline"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-sm text-fg-muted">
            <p className="font-medium text-fg">Start the conversation</p>
            <p className="mt-1 max-w-xs">
              Introduce yourself and mention why you're a fit for the {conversation.listing?.role} role.
            </p>
          </div>
        ) : (
          messages.map((m, i) => {
            const mine = m.sender?._id === currentUserId;
            const date = new Date(m.createdAt);
            const prev = messages[i - 1];
            const showDay = !prev || !isSameDay(new Date(prev.createdAt), date);

            return (
              <div key={m._id}>
                {showDay && (
                  <div className="flex justify-center my-3">
                    <span className="text-[11px] text-fg-subtle bg-surface-2 border border-line rounded-full px-3 py-0.5">
                      {format(date, "d MMM yyyy")}
                    </span>
                  </div>
                )}
                <div className={`flex ${mine ? "justify-end" : "justify-start"} animate-rise`}>
                  <div
                    className={`max-w-[78%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      mine
                        ? "bg-primary text-on-primary rounded-2xl rounded-br-md"
                        : "bg-surface-2 border border-line text-fg rounded-2xl rounded-bl-md"
                    }`}
                  >
                    {m.text}
                    <p className={`text-[10px] mt-1 text-right ${mine ? "opacity-70" : "text-fg-subtle"}`}>
                      {format(date, "h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {peerTyping && (
          <div className="flex justify-start animate-fade">
            <div className="bg-surface-2 border border-line rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-fg-muted animate-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-fg-muted animate-dot [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-fg-muted animate-dot [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-line flex items-center gap-2">
        <input
          value={text}
          onChange={handleChange}
          placeholder={`Message ${other?.name || "company"}…`}
          className="input"
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="btn-primary w-11 h-11 p-0 shrink-0"
          aria-label="Send"
        >
          {sending ? <Spinner size={16} className="border-white/40 border-t-white" /> : <Send size={17} />}
        </button>
      </form>
    </div>
  );
};

export default ChatThread;
