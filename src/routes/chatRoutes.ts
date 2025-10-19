import { Router } from 'express';
import { chatController } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';
import { uploadFile } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post(
  '/project/:projectId/message',
  uploadFile,
  chatController.sendMessage
);

router.get('/project/:projectId/messages', chatController.getMessages);
router.get('/conversations', chatController.getConversations);

export default router;

