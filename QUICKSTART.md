# ProjexHub Backend - Quick Start Guide

Get up and running in 5 minutes! ⚡

## 🚀 Option 1: Docker (Fastest)

```bash
# 1. Create .env file
cat > .env << 'EOF'
PORT=3000
NODE_ENV=development
DB_HOST=postgres
DB_PORT=5432
DB_NAME=projexhub
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=dev_secret_key_change_in_production
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=xxx
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=xxx
OPENAI_API_KEY=sk-xxx
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
COMMISSION_PERCENTAGE=10
FRONTEND_URL=http://localhost:3001
EOF

# 2. Start everything
docker-compose up -d

# 3. Run migrations
docker-compose exec backend npm run db:migrate

# 4. Test it!
curl http://localhost:3000/health
```

✅ Done! API is running at http://localhost:3000

---

## 🛠️ Option 2: Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up PostgreSQL
createdb projexhub
psql -U postgres -d projexhub -f src/database/schema.sql

# 3. Configure environment
cp ENV_TEMPLATE.txt .env
# Edit .env with your settings

# 4. Build and run
npm run build
npm run dev
```

✅ Done! API is running at http://localhost:3000

---

## 🧪 Quick Test

### 1. Register a Student
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "password123",
    "role": "student",
    "college": "MIT",
    "department": "Computer Science",
    "yearOfStudy": 4
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Copy the `token` from the response!

### 3. Create a Project
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "E-commerce Website",
    "description": "A full-stack e-commerce platform with React, Node.js, and MongoDB",
    "technology": ["React", "Node.js", "MongoDB"],
    "budget": 5000,
    "deadline": "2024-06-30"
  }'
```

---

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `GET /api/auth/profile` - Get profile

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Proposals
- `POST /api/proposals/project/:projectId` - Send proposal
- `GET /api/proposals/project/:projectId` - Get proposals
- `POST /api/proposals/:id/accept` - Accept proposal
- `POST /api/proposals/:id/reject` - Reject proposal

### Payments
- `POST /api/payments/project/:projectId/order` - Create order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/history` - Payment history

### Chat
- `GET /api/chat/conversations` - Get conversations
- `GET /api/chat/project/:projectId/messages` - Get messages
- `POST /api/chat/project/:projectId/message` - Send message

### Reviews
- `POST /api/reviews/project/:projectId` - Create review
- `GET /api/reviews/user/:userId` - Get reviews

### AI
- `POST /api/ai/generate-ideas` - Generate project ideas
- `POST /api/ai/project-suggestions` - Get suggestions

### Admin
- `GET /api/admin/dashboard/stats` - Dashboard stats
- `GET /api/admin/users` - List users
- `POST /api/admin/users/:userId/verify` - Verify user

---

## 🔑 Environment Variables

**Required for basic functionality:**
- `PORT` - Server port (default: 3000)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database config
- `JWT_SECRET` - Secret for JWT tokens

**Required for full functionality:**
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` - Payment gateway
- `TWILIO_*` - SMS/OTP (or use email)
- `EMAIL_*` - Email/OTP
- `OPENAI_API_KEY` - AI features

---

## 📚 Documentation

- **README.md** - Full project documentation
- **SETUP.md** - Detailed setup guide
- **API_DOCUMENTATION.md** - Complete API reference
- **PROJECT_SUMMARY.md** - Project overview

---

## 🐛 Troubleshooting

### Port already in use
```bash
lsof -ti:3000 | xargs kill -9
```

### Database connection error
```bash
# Check if PostgreSQL is running
pg_isready

# Check database exists
psql -U postgres -l | grep projexhub
```

### Permission denied
```bash
# Create uploads directory
mkdir -p uploads
chmod 755 uploads
```

---

## 🎯 What's Next?

1. ✅ Backend is ready!
2. 🔄 Test all endpoints
3. 🔄 Set up third-party services
4. 🔄 Build Flutter frontend
5. 🔄 Deploy to production

---

## 💡 Pro Tips

- Use **Postman** to test APIs easily
- Import `API_DOCUMENTATION.md` into Postman
- Enable **hot reload** with `npm run dev`
- Check **logs** in terminal for debugging
- Use **Docker** for consistent environment

---

## 🆘 Need Help?

- Check documentation files
- Review API documentation
- See SETUP.md for detailed instructions
- Contact: support@projexhub.com

---

**Happy Coding! 🚀**

