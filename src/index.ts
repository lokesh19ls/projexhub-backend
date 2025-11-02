import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { exec } from 'child_process';
import { promisify } from 'util';

// Import routes
import authRoutes from './routes/authRoutes';
import homeRoutes from './routes/homeRoutes';
import projectRoutes from './routes/projectRoutes';
import proposalRoutes from './routes/proposalRoutes';
import paymentRoutes from './routes/paymentRoutes';
import chatRoutes from './routes/chatRoutes';
import reviewRoutes from './routes/reviewRoutes';
import aiRoutes from './routes/aiRoutes';
import adminRoutes from './routes/adminRoutes';
import notificationRoutes from './routes/notificationRoutes';
import devRoutes from './routes/devRoutes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

// Run migrations on startup
async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // First, update phone column to be optional
    try {
      const { stdout: updateStdout, stderr: updateStderr } = await execAsync('node dist/database/update-phone-to-optional.js');
      if (updateStdout) console.log(updateStdout);
      if (updateStderr) console.error(updateStderr);
    } catch (updateError: any) {
      console.log('⚠️  Phone column update skipped (may already be updated)');
    }
    
    // Create progress history table
    try {
      const { stdout: progressStdout, stderr: progressStderr } = await execAsync('node dist/database/migrations/create-progress-history-table.js');
      if (progressStdout) console.log(progressStdout);
      if (progressStderr) console.error(progressStderr);
    } catch (progressError: any) {
      console.log('⚠️  Progress history table creation skipped (may already exist)');
    }
    
    // Then run the main schema migration
    const { stdout, stderr } = await execAsync('node dist/database/migrate.js');
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log('✅ Migrations completed successfully');
  } catch (error: any) {
    console.error('⚠️  Migration error:', error.message);
    console.log('⚠️  Continuing without migrations...');
  }
}

const app: Application = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', message: 'ProjexHub API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dev', devRoutes);

// Socket.IO for real-time chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (projectId: string) => {
    socket.join(`project-${projectId}`);
    console.log(`User ${socket.id} joined project-${projectId}`);
  });

  socket.on('send-message', (data: any) => {
    socket.to(`project-${data.projectId}`).emit('receive-message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server with migrations
(async () => {
  // Run migrations before starting server
  await runMigrations();
  
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });
})();

export { io };

