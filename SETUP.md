# ProjexHub Backend Setup Guide

## Quick Start

### Option 1: Using Docker (Recommended)

1. **Clone and navigate to the project**
```bash
cd projexhub-backend
```

2. **Create environment file**
```bash
cat > .env << 'EOF'
PORT=3000
NODE_ENV=development
DB_HOST=postgres
DB_PORT=5432
DB_NAME=projexhub
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
OPENAI_API_KEY=your_openai_api_key
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
COMMISSION_PERCENTAGE=10
FRONTEND_URL=http://localhost:3001
EOF
```

3. **Start with Docker Compose**
```bash
docker-compose up -d
```

4. **Run database migrations**
```bash
docker-compose exec backend npm run db:migrate
```

5. **Access the API**
```
http://localhost:3000/api
Health Check: http://localhost:3000/health
```

---

### Option 2: Manual Setup

#### Step 1: Install PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from: https://www.postgresql.org/download/windows/

#### Step 2: Create Database

```bash
# Login to PostgreSQL
psql postgres

# Create database
CREATE DATABASE projexhub;

# Create user (optional)
CREATE USER projexhub_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE projexhub TO projexhub_user;

# Exit
\q
```

#### Step 3: Install Node.js Dependencies

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

#### Step 4: Configure Environment Variables

Create a `.env` file in the root directory:

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

# Razorpay Configuration (Get from https://dashboard.razorpay.com/)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Twilio Configuration (Get from https://www.twilio.com/)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# OpenAI Configuration (Get from https://platform.openai.com/)
OPENAI_API_KEY=your_openai_api_key

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# App Configuration
COMMISSION_PERCENTAGE=10
FRONTEND_URL=http://localhost:3001
```

#### Step 5: Run Database Migrations

```bash
# Run the migration
npm run db:migrate

# Or manually:
psql -U postgres -d projexhub -f src/database/schema.sql
```

#### Step 6: Start the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

---

## Setting Up Third-Party Services

### 1. Razorpay (Payment Gateway)

1. Go to https://razorpay.com/
2. Sign up for an account
3. Navigate to Settings > API Keys
4. Generate Test API Keys
5. Add keys to `.env`:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`

**Test Cards:**
- Success: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date

### 2. Twilio (SMS/OTP)

1. Go to https://www.twilio.com/
2. Sign up for a free account
3. Get Account SID and Auth Token from dashboard
4. Buy a phone number
5. Add credentials to `.env`:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`

### 3. Gmail (Email/OTP)

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other"
   - Name it "ProjexHub"
   - Copy the generated password
4. Add to `.env`:
   - `EMAIL_USER`: your Gmail address
   - `EMAIL_PASSWORD`: the app password

### 4. OpenAI (AI Features)

1. Go to https://platform.openai.com/
2. Sign up for an account
3. Navigate to API Keys
4. Create a new API key
5. Add to `.env`:
   - `OPENAI_API_KEY`

---

## Create Admin User

After setting up the database, create an admin user:

```bash
psql -U postgres -d projexhub
```

```sql
-- Insert admin user (password: admin123)
INSERT INTO users (name, email, phone, password, role, is_verified, is_active)
VALUES (
  'Admin User',
  'admin@projexhub.com',
  '9999999999',
  '$2a$10$YourHashedPasswordHere',  -- Use bcrypt to hash 'admin123'
  'admin',
  true,
  true
);

-- Exit
\q
```

Or use the API:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@projexhub.com",
    "phone": "9999999999",
    "password": "admin123",
    "role": "admin"
  }'
```

Then manually verify the user in the database:

```sql
UPDATE users SET is_verified = true WHERE email = 'admin@projexhub.com';
```

---

## Testing the API

### 1. Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "ProjexHub API is running"
}
```

### 2. Register a Student
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

### 3. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 4. Create a Project
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "E-commerce Website",
    "description": "A full-stack e-commerce platform",
    "technology": ["React", "Node.js", "MongoDB"],
    "budget": 5000,
    "deadline": "2024-06-30"
  }'
```

---

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Check if PostgreSQL is running: `pg_isready`
- Verify database credentials in `.env`
- Ensure database exists: `psql -U postgres -l`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
- Change PORT in `.env` file
- Or kill the process using port 3000:
  ```bash
  lsof -ti:3000 | xargs kill -9
  ```

### JWT Token Invalid
```
Error: Invalid or expired token
```

**Solution:**
- Check JWT_SECRET in `.env`
- Ensure token is included in Authorization header
- Token format: `Bearer <token>`

### File Upload Errors
```
Error: ENOENT: no such file or directory, open 'uploads/...'
```

**Solution:**
- Create uploads directory: `mkdir -p uploads`
- Check UPLOAD_DIR in `.env`

---

## Development Tips

### Hot Reload
The server automatically reloads on code changes when using:
```bash
npm run dev
```

### Database Migrations
When you modify the schema:
1. Update `src/database/schema.sql`
2. Run migration: `npm run db:migrate`

### Logs
Check server logs in the terminal for debugging.

### Testing with Postman
1. Import the API documentation
2. Create an environment with variables:
   - `base_url`: http://localhost:3000/api
   - `token`: Your JWT token

---

## Next Steps

1. ✅ Backend is ready!
2. 🔄 Set up Flutter frontend
3. 🔄 Configure production environment
4. 🔄 Set up CI/CD pipeline
5. 🔄 Deploy to cloud (AWS, Heroku, etc.)

---

## Support

For issues or questions:
- Create an issue on GitHub
- Email: support@projexhub.com
- Documentation: See `README.md` and `API_DOCUMENTATION.md`

