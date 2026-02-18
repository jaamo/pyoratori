"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

const POLL_INTERVAL = 60_000; // 60 seconds

export function useUnreadCount() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/viestit/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // Silently ignore fetch errors
    }
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setUnreadCount(0);
      return;
    }

    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [session?.user, fetchCount]);

  return unreadCount;
}
