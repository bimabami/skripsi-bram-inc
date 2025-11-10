export interface InboxMessage {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
  mentions?: string[];
  jobId?: string;
  teamId?: string;
  topicId?: string;
  subTopicId?: string;
  teamName?: string;
  topicName?: string;
  subTopicName?: string;
  subTopicDescription?: string;
}
