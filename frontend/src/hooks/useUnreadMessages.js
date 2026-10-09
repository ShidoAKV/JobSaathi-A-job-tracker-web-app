import { useEffect, useState } from "react";
import { getConversations } from "../services/conversationService";
import { onSocket } from "../services/socket";

const POLL_MS = 60000;

/** Total unread chat messages across all conversations (live via socket, polled as a fallback). */
export default function useUnreadMessages() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const conversations = await getConversations();
        if (!active) return;
        setUnread(conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0));
      } catch {
        /* ignore */
      }
    };

    load();
    const id = setInterval(load, POLL_MS);
    const onRefresh = () => load();
    window.addEventListener("jobsaathi:messages", onRefresh);
    const offUpdated = onSocket("conversation:updated", onRefresh);
    const offRead = onSocket("messages:read", onRefresh);

    return () => {
      active = false;
      clearInterval(id);
      window.removeEventListener("jobsaathi:messages", onRefresh);
      offUpdated();
      offRead();
    };
  }, []);

  return unread;
}
