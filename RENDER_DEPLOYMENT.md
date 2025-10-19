# 🚀 Render Deployment Guide for ProjexHub Backend

## ✅ What's Been Set Up

- ✅ Auto-migration script (`src/database/migrate.js`)
- ✅ `postinstall` script runs migrations on deployment
- ✅ Connection string support for Render PostgreSQL
- ✅ All code pushed to GitHub

---

## 📋 Step-by-Step Deployment

### Step 1: Update Render Environment Variables

Go to your **projexhub-backend** web service → **Environment** tab

#### Remove These Variables:
- ❌ `DB_HOST`
- ❌ `DB_PORT`
- ❌ `DB_NAME`
- ❌ `DB_USER`
- ❌ `DB_PASSWORD`

#### Add This Variable:
```
NAME: DATABASE_URL
VALUE: postgresql://projexhubdb_user:eR0n9ucmq5A4xfip0wyIizsbHwqfPv8x@dpg-d3q54f56ubrc73fljd0g-a:5432/projexhubdb
```

#### Keep These Variables:
```
PORT = 10000
NODE_ENV = production
JWT_SECRET = 42b3b056b2264cfbd85b6358c76ab740
JWT_EXPIRES_IN = 7d
SUPABASE_URL = https://mntifzttnnhbyqsvotnb.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
COMMISSION_PERCENTAGE = 10
FRONTEND_URL = https://your-frontend-url.com
UPLOAD_DIR = ./uploads
MAX_FILE_SIZE = 10485760
```

---

### Step 2: Link Database to Web Service

1. Go to your **projexhub-backend** web service
2. Click **"Settings"** tab
3. Scroll to **"Environment"** section
4. Find **"Add Environment Variable"**
5. Click **"Link Database"**
6. Select **"projexhubdb"**
7. This will automatically add the `DATABASE_URL` variable

---

### Step 3: Manual Deploy

1. Go to **"Events"** tab
2. Click **"Manual Deploy"** button
3. Select **"Deploy latest commit"**
4. Wait for deployment

---

## 🔄 What Happens During Deployment

1. **Install dependencies** (`npm install`)
2. **Build TypeScript** (`npm run build`)
3. **Run migrations** (`npm run db:migrate`) - Creates all tables
4. **Start server** (`npm start`)

---

## ✅ Expected Deployment Output

```
==> Building...
npm install
npm run build
npm run db:migrate
🔄 Starting database migration...
✅ Database migration completed successfully!
📊 All tables created
✅ Database connection verified
==> Deploying...
🚀 Server is running on port 10000
📱 Environment: production
✅ Database connected successfully
✅ Database connection verified
==> Your service is live 🎉
```

---

## 🧪 Test Your Deployed API

### Health Check
```bash
curl https://projexhub-backend.onrender.com/health
```

Expected response:
```json
{"status":"OK","message":"ProjexHub API is running"}
```

### Register a User
```bash
curl -X POST https://projexhub-backend.onrender.com/api/auth/register \
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

---

## 📊 View Your Database

1. Go to Render Dashboard
2. Click on **"projexhubdb"**
3. Click **"Connect"** → **"External Database URL"**
4. Use any PostgreSQL client to connect

Or use the Shell:
1. Go to **"projexhubdb"** → **"Shell"** tab
2. Run: `psql $DATABASE_URL`
3. Run: `\dt` to see all tables

---

## 🎯 Database Tables Created

After successful deployment, you'll have:
- ✅ users
- ✅ otps
- ✅ projects
- ✅ proposals
- ✅ chat_messages
- ✅ payments
- ✅ project_files
- ✅ reviews
- ✅ withdrawals
- ✅ disputes
- ✅ notifications

---

## 🔧 Troubleshooting

### Migration Fails

**Error:** "relation already exists"

**Solution:** This is normal if tables already exist. The migration will skip existing tables.

### Connection Timeout

**Error:** "Connection timeout"

**Solution:** 
- Check if `DATABASE_URL` is set correctly
- Verify database is running in Render
- Wait a few minutes and try again

### Build Fails

**Error:** "Build failed"

**Solution:**
- Check build logs in Render
- Verify all dependencies are in `package.json`
- Check TypeScript compilation errors

---

## 🎉 Success Indicators

You'll know it's working when you see:

```
✅ Database migration completed successfully!
✅ Database connected successfully
✅ Database connection verified
🚀 Server is running on port 10000
```

And the health check returns:
```json
{"status":"OK","message":"ProjexHub API is running"}
```

---

## 📝 Summary

**Local Development:**
- Uses Supabase (configured in `.env`)
- Database: Supabase PostgreSQL
- Run: `npm run dev`

**Production (Render):**
- Uses Render PostgreSQL
- Database: projexhubdb
- Auto-migration on deployment
- URL: https://projexhub-backend.onrender.com

---

## 🚀 Your API is Ready!

Once deployed successfully, your ProjexHub backend will be:
- ✅ Live at https://projexhub-backend.onrender.com
- ✅ Connected to Render PostgreSQL
- ✅ All tables created automatically
- ✅ Ready for Flutter frontend integration

---

**Happy Deploying! 🎉**

