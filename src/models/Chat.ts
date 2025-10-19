export interface ChatMessage {
  id: number;
  projectId: number;
  senderId: number;
  receiverId: number;
  message?: string;
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface SendMessageDTO {
  message?: string;
  file?: File;
}

export interface ChatMessageWithSender extends ChatMessage {
  sender?: {
    id: number;
    name: string;
    profilePhoto?: string;
  };
}

