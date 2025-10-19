# ProjexHub Backend

A comprehensive backend API for ProjexHub - a platform connecting college students with developers for final-year and mini-projects.

## 🚀 Features

### Authentication & User Management
- Phone/Email + OTP login system
- JWT-based authentication
- Role-based access control (Student, Developer, Admin)
- User profile management

### Project Management
- Create, browse, and manage projects
- Advanced search and filtering
- Technology-based filtering
- Budget range filtering

### Proposal System
- Developers can send proposals
- Students can accept/reject proposals
- Real-time notifications

### Payment System
- Razorpay integration
- Escrow payment system
- 10% commission for platform
- Support for advance, full, and milestone payments

### Real-time Chat
- Socket.IO for real-time messaging
- File sharing in chat
- Read receipts

### Review & Rating System
- Rate developers and students
- View detailed reviews
- Average rating calculation

### AI Features
- AI-powered project idea generator
- Project suggestions and improvements

### Admin Panel
- User verification
- Project management
- Dispute resolution
- Analytics dashboard
- Payment tracking

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher) OR Supabase account
- npm or yarn

**Note:** This project is now configured to use **Supabase** as the database backend. See `SUPABASE_QUICKSTART.md` for setup instructions.

## 🛠️ Installation

### Quick Start with Supabase (Recommended)

1. **Install dependencies**
```bash
npm install
```

2. **Get your Supabase database password**
   - Go to your Supabase Dashboard
   - Navigate to Settings → Database
   - Copy the password from the connection string

3. **Update `.env` file**
```env
# Add your Supabase database password
DB_PASSWORD=your_supabase_password
```

4. **Set up database schema**
   - Go to Supabase SQL Editor
   - Copy and run `src/database/schema.sql`

5. **Start the server**
```bash
npm run dev
```

**See `SUPABASE_QUICKSTART.md` for detailed instructions!**

### Alternative: Local PostgreSQL Setup

1. **Install dependencies**
```bash
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=projexhub
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Twilio Configuration (for OTP)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Email Configuration (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# OpenAI Configuration (for AI Project Ideas)
OPENAI_API_KEY=your_openai_api_key

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# App Configuration
COMMISSION_PERCENTAGE=10
FRONTEND_URL=http://localhost:3001
```

4. **Set up PostgreSQL database**
```bash
# Create database
createdb projexhub

# Run schema
psql -U postgres -d projexhub -f src/database/schema.sql
```

5. **Build the project**
```bash
npm run build
```

6. **Start the server**
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## 📁 Project Structure

```
projexhub-backend/
├── src/
│   ├── controllers/       # Request handlers
│   ├── database/          # Database schema and connection
│   ├── middleware/        # Custom middleware
│   ├── models/            # TypeScript interfaces
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── index.ts           # Entry point
├── uploads/               # Uploaded files
├── .env                   # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `GET /api/auth/profile` - Get user profile

### Projects
- `GET /api/projects` - Get all projects (with filters)
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project (Student)
- `PUT /api/projects/:id` - Update project (Student)
- `DELETE /api/projects/:id` - Delete project (Student)
- `GET /api/projects/my-projects` - Get user's projects

### Proposals
- `GET /api/proposals/project/:projectId` - Get proposals for a project
- `POST /api/proposals/project/:projectId` - Send proposal (Developer)
- `GET /api/proposals/my-proposals` - Get user's proposals
- `POST /api/proposals/:id/accept` - Accept proposal (Student)
- `POST /api/proposals/:id/reject` - Reject proposal (Student)

### Payments
- `POST /api/payments/project/:projectId/order` - Create payment order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/history` - Get payment history
- `GET /api/payments/earnings` - Get earnings (Developer)

### Chat
- `GET /api/chat/conversations` - Get all conversations
- `GET /api/chat/project/:projectId/messages` - Get messages for a project
- `POST /api/chat/project/:projectId/message` - Send message

### Reviews
- `POST /api/reviews/project/:projectId` - Create review
- `GET /api/reviews/user/:userId` - Get reviews for a user
- `GET /api/reviews/project/:projectId/reviews` - Get reviews for a project

### AI Features
- `POST /api/ai/generate-ideas` - Generate project ideas
- `POST /api/ai/project-suggestions` - Get project suggestions

### Admin
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users/:userId/verify` - Verify user
- `POST /api/admin/users/:userId/deactivate` - Deactivate user
- `GET /api/admin/projects` - Get all projects
- `GET /api/admin/disputes` - Get all disputes
- `POST /api/admin/disputes/:disputeId/resolve` - Resolve dispute
- `GET /api/admin/payments` - Get all payments

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## 💳 Payment Integration

The platform uses Razorpay for payments. To test payments:

1. Create a Razorpay account
2. Get test API keys from Razorpay dashboard
3. Add keys to `.env` file
4. Use Razorpay test cards for testing

## 📧 Email & SMS Setup

### Email (Gmail)
1. Enable 2-factor authentication
2. Generate an app-specific password
3. Use the app password in `.env`

### SMS (Twilio)
1. Create a Twilio account
2. Get Account SID and Auth Token
3. Buy a phone number
4. Add credentials to `.env`

## 🤖 AI Features Setup

1. Create an OpenAI account
2. Generate an API key
3. Add the key to `.env`

## 🧪 Testing

```bash
# Run tests (if implemented)
npm test
```

## 📝 Database Schema

The database includes the following tables:
- `users` - User accounts
- `otps` - OTP verification
- `projects` - Project listings
- `proposals` - Developer proposals
- `chat_messages` - Chat messages
- `payments` - Payment records
- `project_files` - Uploaded files
- `reviews` - User reviews
- `withdrawals` - Developer withdrawals
- `disputes` - Dispute records
- `notifications` - User notifications

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure production database
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up file storage (S3, Cloudinary, etc.)
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure backups

## 📄 License

This project is licensed under the ISC License.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support, email support@projexhub.com or create an issue in the repository.

## 🎯 Roadmap

- [ ] Add WebSocket for real-time notifications
- [ ] Implement file storage with S3
- [ ] Add project templates
- [ ] Implement advanced analytics
- [ ] Add multi-language support
- [ ] Implement caching with Redis
- [ ] Add unit and integration tests

# projexhub-backend
