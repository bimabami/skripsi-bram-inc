"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { InboxMessage } from "@/types/inbox";
import { axiosInstance } from "@/lib/axios";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "./socket-context";

interface BackendNotification {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  read: boolean;
  meta: {
    taskId?: string;
    taskTitle?: string;
    type?: string;
    teamId?: string;
    topicId?: string;
    subTopicId?: string;
    teamName?: string;
    topicName?: string;
    subTopicName?: string;
  } | null;
  createdAt: string;
}

interface InboxContextType {
  messages: InboxMessage[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  addMessage: (message: Omit<InboxMessage, "id">) => void;
  markAsRead: (messageId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAllMessages: () => Promise<void>;
}

const InboxContext = createContext<InboxContextType | undefined>(undefined);

// Transform backend notification to frontend InboxMessage
function transformNotification(notification: BackendNotification): InboxMessage {
  return {
    id: notification.id,
    sender: notification.title.split(" menyebut")[0] || "System",
    subject: notification.meta?.taskTitle || "a job",
    preview: notification.body || "",
    timestamp: notification.createdAt,
    isRead: notification.read,
    jobId: notification.meta?.taskId,
    teamId: notification.meta?.teamId,
    topicId: notification.meta?.topicId,
    subTopicId: notification.meta?.subTopicId,
    teamName: notification.meta?.teamName,
    topicName: notification.meta?.topicName,
    subTopicName: notification.meta?.subTopicName,
  };
}

export function InboxProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = messages.filter((msg) => !msg.isRead).length;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/notifications");
      const notifications: BackendNotification[] = response.data.data;
      setMessages(notifications.map(transformNotification));
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch notifications when user logs in
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setMessages([]);
    }
  }, [user, fetchNotifications]);

  // WebSocket listener for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: BackendNotification) => {
      const newMessage = transformNotification(notification);
      setMessages(prev => {
        if (prev.some(m => m.id === newMessage.id)) return prev;
        return [newMessage, ...prev];
      });
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [socket]);

  // Local addMessage for optimistic UI when creating mentions
  const addMessage = useCallback((message: Omit<InboxMessage, "id">) => {
    const newMessage: InboxMessage = {
      ...message,
      id: Date.now().toString(),
    };
    setMessages((prev) => [newMessage, ...prev]);
  }, []);

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await axiosInstance.put(`/notifications/${messageId}/read`);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, isRead: true } : msg))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await axiosInstance.put("/notifications/read-all");
      setMessages((prev) => prev.map((msg) => ({ ...msg, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }, []);

  const clearAllMessages = useCallback(async () => {
    try {
      await axiosInstance.delete("/notifications");
      setMessages([]);
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  }, []);

  return (
    <InboxContext.Provider
      value={{
        messages,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        addMessage,
        markAsRead,
        markAllAsRead,
        clearAllMessages,
      }}
    >
      {children}
    </InboxContext.Provider>
  );
}

export function useInbox() {
  const context = useContext(InboxContext);
  if (context === undefined) {
    throw new Error("useInbox must be used within an InboxProvider");
  }
  return context;
}
