# 🚀 Supabase Quick Start

## Your Supabase Project Details

```
Project URL: https://mntifzttnnhbyqsvotnb.supabase.co
Dashboard: https://supabase.com/dashboard/project/mntifzttnnhbyqsvotnb
Database Host: db.mntifzttnnhbyqsvotnb.supabase.co
```

## ⚡ Quick Setup (3 Steps)

### 1️⃣ Get Database Password

1. Go to: https://supabase.com/dashboard/project/mntifzttnnhbyqsvotnb/settings/database
2. Scroll to **Connection string** → **URI**
3. Copy the password from the connection string
4. Update `.env`:
   ```env
   DB_PASSWORD=your_password_here
   ```

### 2️⃣ Create Database Tables

1. Go to: https://supabase.com/dashboard/project/mntifzttnnhbyqsvotnb/sql/new
2. Click **SQL Editor** in sidebar
3. Copy contents from `src/database/schema.sql`
4. Paste and click **Run** (Ctrl/Cmd + Enter)

### 3️⃣ Restart Server

```bash
# Server should auto-restart with nodemon
# Or manually:
npm run dev
```

## 🧪 Test It

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "9876543210",
    "password": "password123",
    "role": "student"
  }'
```

## 📊 View Data

Go to: https://supabase.com/dashboard/project/mntifzttnnhbyqsvotnb/editor

## 🔑 Important Files

- `.env` - Environment variables (add your DB password!)
- `src/database/schema.sql` - Database schema
- `SUPABASE_SETUP.md` - Detailed setup guide
- `API_DOCUMENTATION.md` - API reference

## ✅ Success Indicators

You'll know it's working when you see:

```
✅ Database connected successfully
✅ Database connection verified
🚀 Server is running on port 3000
📱 Environment: development
🔗 Health check: http://localhost:3000/health
```

## 🆘 Need Help?

See `SUPABASE_SETUP.md` for detailed instructions and troubleshooting.

---

**That's it! Your backend is ready! 🎉**

