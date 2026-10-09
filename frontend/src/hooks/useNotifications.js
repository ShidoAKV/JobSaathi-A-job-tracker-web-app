import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService";
import { onSocket } from "../services/socket";

const POLL_MS = 60000;

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getNotifications();
      if (!mounted.current) return;
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      /* keep stale data; network hiccups are non-fatal here */
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    const id = setInterval(refresh, POLL_MS);

    // Live push from the server when a listing is announced or a request is reviewed.
    const off = onSocket("notification:new", (n) => {
      if (!mounted.current || !n?._id) return;
      setNotifications((prev) => (prev.some((x) => x._id === n._id) ? prev : [n, ...prev].slice(0, 50)));
      setUnreadCount((c) => c + 1);
      toast(n.title || "New notification", { icon: n.type === "system" ? "🔔" : "💼" });
    });

    return () => {
      mounted.current = false;
      clearInterval(id);
      off();
    };
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      refresh();
    }
  }, [refresh]);

  const markRead = useCallback(
    async (id) => {
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await markNotificationRead(id);
      } catch {
        refresh();
      }
    },
    [refresh]
  );

  return { notifications, unreadCount, loading, refresh, markAllRead, markRead };
}
