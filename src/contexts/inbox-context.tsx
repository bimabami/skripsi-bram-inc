"use client";

import React, { createContext, useContext, useState } from "react";
import { InboxMessage } from "@/types/inbox";

interface InboxContextType {
  messages: InboxMessage[];
  unreadCount: number;
  addMessage: (message: Omit<InboxMessage, "id">) => void;
  markAsRead: (messageId: string) => void;
}

const InboxContext = createContext<InboxContextType | undefined>(undefined);

export function InboxProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<InboxMessage[]>([
    {
      id: "1",
      sender: "Galang",
      subject: "Denah Pembesian Lantai 1",
      preview: "Ini direvisi lagi ya mas @Bima",
      timestamp: "15m",
      isRead: false,
      mentions: ["Bima"],
      teamId: "struktur",
      topicId: "denah-pembalokan",
      subTopicId: "denah-pembesian",
      teamName: "Struktur",
      topicName: "Denah Pembalokan",
      subTopicName: "Denah Pembesian",
      subTopicDescription: "Shopdrawing Denah Pembesian Lantai 1 – Lantai Roof",
    },
    {
      id: "2",
      sender: "Galang",
      subject: "Denah Pembesian Lantai 2",
      preview: "Pembesiannya salah @Bima",
      timestamp: "7m",
      isRead: false,
      mentions: ["Bima"],
      teamId: "struktur",
      topicId: "denah-pembalokan",
      subTopicId: "denah-pembesian",
      teamName: "Struktur",
      topicName: "Denah Pembalokan",
      subTopicName: "Denah Pembesian",
      subTopicDescription: "Shopdrawing Denah Pembesian Lantai 1 – Lantai Roof",
    },
  ]);

  const unreadCount = messages.filter((msg) => !msg.isRead).length;

  const addMessage = (message: Omit<InboxMessage, "id">) => {
    const newMessage: InboxMessage = {
      ...message,
      id: Date.now().toString(),
    };
    setMessages((prev) => [newMessage, ...prev]);
  };

  const markAsRead = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, isRead: true } : msg))
    );
  };

  return (
    <InboxContext.Provider
      value={{ messages, unreadCount, addMessage, markAsRead }}
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
