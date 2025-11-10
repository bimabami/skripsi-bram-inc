"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useInbox } from "@/contexts/inbox-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";

interface InboxDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InboxDrawer({ open, onOpenChange }: InboxDrawerProps) {
  const { messages, markAsRead } = useInbox();

  const handleMessageClick = (messageId: string) => {
    markAsRead(messageId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-lg font-semibold">Inbox</SheetTitle>
          <p className="text-sm text-muted-foreground">Hari ini</p>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] px-6 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Tidak ada pesan di inbox
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {messages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => handleMessageClick(message.id)}
                  className="w-full px-6 py-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-gray-700 text-white">
                        {message.sender.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">
                            {message.sender}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Berkomentar di
                          </span>
                          <span className="text-xs text-blue-600 font-medium">
                            {message.subject}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {message.timestamp}
                          </span>
                          {!message.isRead && (
                            <Badge
                              variant="secondary"
                              className="h-2 w-2 p-0 rounded-full bg-blue-600"
                            />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {message.preview}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
