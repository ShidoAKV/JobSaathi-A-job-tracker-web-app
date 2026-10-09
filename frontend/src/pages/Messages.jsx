import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MessageSquare, Compass } from "lucide-react";
import ConversationList from "../components/messages/ConversationList";
import ChatThread from "../components/messages/ChatThread";
import EmptyState from "../components/ui/EmptyState";
import useAuthUser from "../hooks/useAuthUser";
import { getConversations } from "../services/conversationService";
import { onSocket } from "../services/socket";

const LIST_POLL_MS = 45000;

const Messages = () => {
  const user = useAuthUser();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get("c");

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setConversations(await getConversations());
      window.dispatchEvent(new Event("jobsaathi:messages"));
    } catch {
      /* non-fatal */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, LIST_POLL_MS);
    const off = onSocket("conversation:updated", load);
    return () => {
      clearInterval(id);
      off();
    };
  }, [load]);

  const active = conversations.find((c) => c._id === activeId) || null;

  const select = (c) => setSearchParams({ c: c._id });
  const back = () => setSearchParams({});

  return (
    <div className="card overflow-hidden h-[calc(100vh-13.5rem)] min-h-[520px] grid grid-cols-1 lg:grid-cols-[340px_1fr]">
      <div className={`border-r border-line min-h-0 ${active ? "hidden lg:block" : "block"}`}>
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={select}
          loading={loading}
        />
      </div>

      <div className={`min-h-0 ${active ? "block" : "hidden lg:block"}`}>
        {active ? (
          <ChatThread
            key={active._id}
            conversation={active}
            currentUserId={user?.id}
            onBack={back}
            onActivity={load}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              title="Select a conversation"
              description="Pick a thread on the left, or connect with a company from Explore Jobs."
              action={
                <button onClick={() => navigate("/jobs")} className="btn-secondary">
                  <Compass size={16} /> Explore jobs
                </button>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
