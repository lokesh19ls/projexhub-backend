import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ChatService } from '../services/chatService';
import { asyncHandler } from '../middleware/errorHandler';

const chatService = new ChatService();

export const chatController = {
  sendMessage: asyncHandler(async (req: AuthRequest, res: Response) => {
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const message = await chatService.sendMessage(
      parseInt(req.params.projectId),
      req.user!.id,
      req.body,
      fileUrl
    );
    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  }),

  getMessages: asyncHandler(async (req: AuthRequest, res: Response) => {
    const messages = await chatService.getMessages(
      parseInt(req.params.projectId),
      req.user!.id
    );
    res.json(messages);
  }),

  getConversations: asyncHandler(async (req: AuthRequest, res: Response) => {
    const conversations = await chatService.getConversations(req.user!.id);
    res.json(conversations);
  })
};

