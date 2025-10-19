import { query } from '../database/connection';
import { SendMessageDTO } from '../models/Chat';
import { AppError } from '../middleware/errorHandler';

export class ChatService {
  async sendMessage(projectId: number, senderId: number, data: SendMessageDTO, fileUrl?: string) {
    // Verify project access
    const projectResult = await query(
      `SELECT student_id, accepted_proposal_id, 
              (SELECT developer_id FROM proposals WHERE id = accepted_proposal_id) as developer_id
       FROM projects WHERE id = $1`,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    const project = projectResult.rows[0];

    // Determine receiver
    const receiverId = senderId === project.student_id ? project.developer_id : project.student_id;

    if (!receiverId) {
      throw new AppError('No active developer for this project', 400);
    }

    // Create message
    const result = await query(
      `INSERT INTO chat_messages (project_id, sender_id, receiver_id, message, file_url, file_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        projectId,
        senderId,
        receiverId,
        data.message || null,
        fileUrl || null,
        data.file?.name || null
      ]
    );

    // Create notification for receiver
    await query(
      `INSERT INTO notifications (user_id, title, message, type, related_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        receiverId,
        'New Message',
        `You have a new message for project`,
        'message',
        projectId
      ]
    );

    return result.rows[0];
  }

  async getMessages(projectId: number, userId: number) {
    // Verify project access
    const projectResult = await query(
      `SELECT student_id, accepted_proposal_id,
              (SELECT developer_id FROM proposals WHERE id = accepted_proposal_id) as developer_id
       FROM projects WHERE id = $1`,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    const project = projectResult.rows[0];

    if (userId !== project.student_id && userId !== project.developer_id) {
      throw new AppError('Unauthorized to view messages', 403);
    }

    // Get messages
    const result = await query(
      `SELECT cm.*, 
              s.id as sender_id, s.name as sender_name, s.profile_photo as sender_photo
       FROM chat_messages cm
       LEFT JOIN users s ON cm.sender_id = s.id
       WHERE cm.project_id = $1
       ORDER BY cm.created_at ASC`,
      [projectId]
    );

    // Mark messages as read
    await query(
      `UPDATE chat_messages SET is_read = true 
       WHERE project_id = $1 AND receiver_id = $2 AND is_read = false`,
      [projectId, userId]
    );

    return result.rows;
  }

  async getConversations(userId: number) {
    const result = await query(
      `SELECT DISTINCT p.id, p.title, p.status,
              CASE 
                WHEN p.student_id = $1 THEN d.id
                ELSE s.id
              END as other_user_id,
              CASE 
                WHEN p.student_id = $1 THEN d.name
                ELSE s.name
              END as other_user_name,
              CASE 
                WHEN p.student_id = $1 THEN d.profile_photo
                ELSE s.profile_photo
              END as other_user_photo,
              (SELECT message FROM chat_messages 
               WHERE project_id = p.id 
               ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT created_at FROM chat_messages 
               WHERE project_id = p.id 
               ORDER BY created_at DESC LIMIT 1) as last_message_time
       FROM projects p
       LEFT JOIN users s ON p.student_id = s.id
       LEFT JOIN proposals ap ON p.accepted_proposal_id = ap.id
       LEFT JOIN users d ON ap.developer_id = d.id
       WHERE (p.student_id = $1 OR ap.developer_id = $1)
       AND p.accepted_proposal_id IS NOT NULL
       ORDER BY last_message_time DESC`,
      [userId]
    );

    return result.rows;
  }
}

