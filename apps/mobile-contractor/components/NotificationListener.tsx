import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/hooks/useSocket";
import { getAuthToken } from "@/lib/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const NOTIFICATIONS_QUERY_KEY = ["notifications"];

/**
 * Listens for real-time notifications via WebSocket and invalidates
 * the notifications query when a new one arrives.
 */
export default function NotificationListener() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const isAuthenticated = !!currentUser?.id;
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    if (!isAuthenticated) {
      setToken("");
      return;
    }
    getAuthToken().then((t) => setToken(t ?? ""));
  }, [isAuthenticated]);

  const { onNotification, connected } = useSocket({
    token,
    onConnect: () => {},
    onDisconnect: () => {},
  });

  useEffect(() => {
    if (!connected) return;
    const unsubscribe = onNotification(() => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    });
    return unsubscribe;
  }, [connected, onNotification, queryClient]);

  return null;
}
