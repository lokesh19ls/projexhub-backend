# Supabase Integration Guide for ProjexHub

## 🎉 Welcome to Supabase!

Your ProjexHub backend is now configured to use Supabase as the database backend.

---

## 📋 Prerequisites

✅ Supabase project created  
✅ API URL: `https://mntifzttnnhbyqsvotnb.supabase.co`  
✅ API Key configured in `.env`

---

## 🔑 Step 1: Get Your Database Password

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **projexhub**
3. Go to **Settings** → **Database**
4. Scroll down to **Connection string** section
5. Copy the **Connection string** (URI format)
6. Extract the password from the connection string

**Example connection string:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.mntifzttnnhbyqsvotnb.supabase.co:5432/postgres
```

7. Update your `.env` file with the password:

```env
DB_PASSWORD=your_actual_password_here
```

---

## 🗄️ Step 2: Set Up Database Schema

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire schema from `src/database/schema.sql`
5. Click **Run** (or press Ctrl/Cmd + Enter)

### Option B: Using psql Command Line

```bash
# Install PostgreSQL client if needed
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql-client

# Connect to Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.mntifzttnnhbyqsvotnb.supabase.co:5432/postgres"

# Run the schema
\i src/database/schema.sql

# Or paste the schema directly
```

---

## 🔧 Step 3: Update Environment Variables

Your `.env` file is already configured with Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://mntifzttnnhbyqsvotnb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Configuration (Direct PostgreSQL connection)
DB_HOST=db.mntifzttnnhbyqsvotnb.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_actual_password_here  # ← Update this!
```

**Important:** Don't forget to add your actual database password!

---

## 🚀 Step 4: Start the Server

```bash
# The server should automatically restart with nodemon
# If not, restart it manually:
npm run dev
```

You should see:
```
✅ Database connected successfully
✅ Database connection verified
🚀 Server is running on port 3000
```

---

## 🧪 Step 5: Test the API

### Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"OK","message":"ProjexHub API is running"}
```

### Register a User
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

Expected response:
```json
{
  "message": "User registered successfully",
  "user": { ... },
  "token": "eyJhbGci..."
}
```

---

## 📊 Step 6: View Your Data in Supabase

1. Go to your Supabase Dashboard
2. Click on **Table Editor** in the left sidebar
3. You should see all your tables:
   - users
   - projects
   - proposals
   - chat_messages
   - payments
   - project_files
   - reviews
   - withdrawals
   - disputes
   - notifications
   - otps

4. Click on any table to view and edit data

---

## 🔐 Security Best Practices

### Row Level Security (RLS)

Supabase uses Row Level Security to secure your data. You should enable RLS on all tables:

1. Go to **Authentication** → **Policies**
2. For each table, create policies based on your requirements

**Example RLS Policy for Users table:**
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (auth.uid() = id);
```

### API Keys

- **Anon Key**: Safe to use in frontend (with RLS enabled)
- **Service Role Key**: Only use in backend (bypasses RLS)

Your current setup uses the Anon Key, which is correct for the backend.

---

## 🎯 Next Steps

### 1. Set Up Authentication (Optional)

Supabase provides built-in authentication. You can:
- Use Supabase Auth instead of custom JWT
- Enable email/password authentication
- Add social login (Google, GitHub, etc.)

### 2. Enable Real-time Features

Supabase provides real-time subscriptions. Update your chat system:

```typescript
// Subscribe to new messages
supabase
  .channel('messages')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'chat_messages' },
    (payload) => {
      console.log('New message:', payload.new);
    }
  )
  .subscribe();
```

### 3. Set Up Storage

Use Supabase Storage for file uploads:

```typescript
// Upload a file
const { data, error } = await supabase.storage
  .from('project-files')
  .upload('path/to/file.pdf', file);
```

---

## 🆘 Troubleshooting

### Connection Error

**Error:** `connection refused` or `timeout`

**Solution:**
1. Check your database password in `.env`
2. Verify your Supabase project is active
3. Check if your IP is allowed in Supabase settings

### SSL Error

**Error:** `SSL connection required`

**Solution:**
The connection is already configured with SSL. If you still get this error, check your Supabase project settings.

### Table Not Found

**Error:** `relation "users" does not exist`

**Solution:**
Run the schema.sql file in Supabase SQL Editor.

### Authentication Error

**Error:** `Invalid API key`

**Solution:**
1. Check your `SUPABASE_ANON_KEY` in `.env`
2. Verify the key in Supabase Dashboard → Settings → API

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase SQL Editor](https://supabase.com/docs/guides/database/tables)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✅ Checklist

- [ ] Database password added to `.env`
- [ ] Schema.sql executed in Supabase
- [ ] Server running successfully
- [ ] Health check passing
- [ ] User registration working
- [ ] Data visible in Supabase Table Editor

---

## 🎉 You're All Set!

Your ProjexHub backend is now powered by Supabase! You can now:

1. ✅ Use the REST API
2. ✅ Query data via Supabase client
3. ✅ View data in Supabase Dashboard
4. ✅ Build the Flutter frontend
5. ✅ Deploy to production

**Happy coding! 🚀**

