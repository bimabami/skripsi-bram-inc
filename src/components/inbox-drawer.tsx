"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useInbox } from "@/contexts/inbox-context";
import { useTeams } from "@/contexts/teams-context";
import { useJobs } from "@/contexts/jobs-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inbox as InboxIcon } from "lucide-react";

interface InboxDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InboxDrawer({ open, onOpenChange }: InboxDrawerProps) {
  const { messages, markAsRead } = useInbox();
  const { setSelectedSubTopic } = useTeams();
  const { jobs } = useJobs();

  const handleMessageClick = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    markAsRead(messageId);
    
    // Navigate to the job if it has linking information
    if (message && message.teamId && message.topicId && message.subTopicId) {
      // Try to find the actual job by matching the subject name
      const job = jobs.find((j) => 
        j.name === message.subject &&
        j.teamId === message.teamId &&
        j.topicId === message.topicId &&
        j.subTopicId === message.subTopicId
      );
      
      setSelectedSubTopic({
        teamId: message.teamId,
        topicId: message.topicId,
        subTopicId: message.subTopicId,
        subTopicName: message.subTopicName!,
        subTopicDescription: message.subTopicDescription!,
        teamName: message.teamName!,
        topicName: message.topicName!,
        selectedJobId: job?.id, // Use the actual job ID if found
      });
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-md p-0 bg-white">
        <SheetHeader className="px-6 py-5 border-b bg-white">
          <SheetTitle className="text-xl font-semibold text-gray-900">
            Inbox
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-73px)] bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <InboxIcon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                No messages yet
              </p>
              <p className="text-sm text-gray-500">
                When you get notifications, they&apos;ll show up here
              </p>
            </div>
          ) : (
            <div className="py-2">
              {messages.map((message) => {
                const hasJobLink = message.teamId && message.topicId && message.subTopicId;
                return (
                  <button
                    key={message.id}
                    onClick={() => handleMessageClick(message.id)}
                    className={`w-full px-6 py-4 hover:bg-white transition-all text-left relative group ${
                      !message.isRead ? "bg-blue-50" : "bg-gray-50"
                    } ${hasJobLink ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <div className="flex gap-3">
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarFallback className="bg-gray-800 text-white text-sm font-medium">
                          {message.sender.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <span className="font-semibold text-sm text-gray-900">
                            {message.sender}
                          </span>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {message.timestamp}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-xs text-gray-600">
                            commented on
                          </span>
                          <span className={`text-xs font-medium truncate ${hasJobLink ? "text-blue-600 group-hover:underline" : "text-gray-600"}`}>
                            {message.subject}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {message.preview}
                        </p>
                      </div>
                      {!message.isRead && (
                        <div className="absolute top-1/2 -translate-y-1/2 right-4">
                          <div className="h-2 w-2 rounded-full bg-blue-600" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
