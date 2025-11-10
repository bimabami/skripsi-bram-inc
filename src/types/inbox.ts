export interface InboxMessage {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
  mentions?: string[];
}
