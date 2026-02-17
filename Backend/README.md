# DQMS Backend - Setup & Deployment Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Redis Configuration](#redis-configuration)
5. [Third-Party Services](#third-party-services)
6. [Installation Steps](#installation-steps)
7. [Running the Application](#running-the-application)
8. [API Documentation](#api-documentation)
9. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** >= 18.x
- **npm** or **yarn**
- **PostgreSQL** >= 14.x
- **Redis** >= 7.x
- **Git**

---

## 2. Environment Setup

### Step 1: Clone and Navigate
```bash
cd backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Create Environment File
Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
```

### Step 4: Configure Environment Variables
Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/dqms?schema=public"

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration (Generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-CHANGE-THIS
JWT_REFRESH_SECRET=your-super-secret-refresh-key-CHANGE-THIS
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Twilio Configuration (for SMS OTP)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid Configuration (for Email)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME="Digital Queue System"

# Application Configuration
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

---

## 3. Database Configuration

### Option A: Local PostgreSQL Installation

#### Windows:
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer
3. Set password for `postgres` user (remember this!)
4. Default port: 5432

#### Mac (using Homebrew):
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Ubuntu/Linux:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE dqms;

# Exit
\q
```

### Update DATABASE_URL
Replace in your `.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/dqms?schema=public"
```

### Option B: Using Docker for PostgreSQL
```bash
docker run --name dqms-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=dqms \
  -p 5432:5432 \
  -d postgres:15
```

---

## 4. Redis Configuration

### Option A: Local Redis Installation

#### Windows:
1. Download Redis from https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`
3. Default port: 6379

#### Mac (using Homebrew):
```bash
brew install redis
brew services start redis
```

#### Ubuntu/Linux:
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Test Redis Connection
```bash
redis-cli ping
# Should return: PONG
```

### Option B: Using Docker for Redis
```bash
docker run --name dqms-redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

---

## 5. Third-Party Services Configuration



#### Update .env:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

#### Free Trial Limitations:
- Free accounts can only send to verified phone numbers
- Add your phone number to verified list in Twilio console

### B. SendGrid (Email Service)

#### Setup Steps:
1. Go to https://sendgrid.com/
2. Sign up for a free account (100 emails/day free)
3. Create an API Key:
   - Settings → API Keys → Create API Key
   - Give it "Full Access" or "Mail Send" permission
4. Verify a sender email address:
   - Settings → Sender Authentication → Verify Single Sender

#### Update .env:
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=your-verified-email@domain.com
SENDGRID_FROM_NAME="Digital Queue System"
```

### C. AI Assistant (LLM)

The admin AI assistant uses **Google Gemini** via the Generative Language API.

Add the following environment variables to your `.env` (do not commit real values):

```env
# AI Assistant / LLM configuration (Gemini)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL_NAME=gemini-2.5-pro
```

> The `AiModule` only sends minimal, non-PII context to the model and never logs prompts or responses.

---

## 6. Installation Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Generate Prisma Client
```bash
npm run prisma:generate
```

### Step 3: Run Database Migrations
```bash
npm run prisma:migrate
```

This will:
- Create all database tables
- Set up relationships
- Apply indexes

### Step 4: (Optional) Seed Initial Data
```bash
npx ts-node prisma/seed.ts
```

### Step 5: Verify Setup
Check if all tables were created:
```bash
npx prisma studio
```
This opens a web UI at http://localhost:5555 to view your database.

---

## 7. Running the Application

### Development Mode (with hot reload)
```bash
npm run start:dev
```

### Production Build
```bash
npm run build
npm run start:prod
```

### Expected Output
```
🚀 DQMS Backend Server Started
📍 Server: http://localhost:4000
🔗 API: http://localhost:4000/api
🌐 Environment: development
📊 Database: Connected
🔴 Redis: Connected
```

---

## 8. API Documentation

### Base URL
```
http://localhost:4000/api
```

### Key Endpoints

#### Authentication
```
POST /api/auth/email/send-otp
POST /api/auth/email/verify-otp
POST /api/auth/phone/send-otp
POST /api/auth/phone/verify-otp
POST /api/auth/refresh
GET  /api/auth/me
```

#### Services
```
GET  /api/services
GET  /api/services/:id
POST /api/services (Auth required)
PUT  /api/services/:id (Auth required)
```

#### Tokens
```
POST /api/tokens (Auth required)
GET  /api/tokens/my-tokens (Auth required)
GET  /api/tokens/:id
GET  /api/tokens/:id/position
DELETE /api/tokens/:id (Auth required)
```

#### Presence
```
POST /api/presence/check (Auth required)
GET  /api/presence/:tokenId/history (Auth required)
```

#### Admin
```
GET  /api/admin/dashboard/stats (Auth required)
```

### Testing API Endpoints

#### Using cURL:
```bash
# Health check
curl http://localhost:4000/api/health

# Get all services
curl http://localhost:4000/api/services

# Send email OTP
curl -X POST http://localhost:4000/api/auth/email/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

#### Using Postman:
1. Import the API collection (if provided)
2. Set base URL: `http://localhost:4000/api`
3. For protected routes, add header:
   ```
   Authorization: Bearer <your_jwt_token>
   ```

---

## 9. Troubleshooting

### Database Connection Issues

**Error: `Can't reach database server`**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list  # Mac
# Or check Task Manager on Windows

# Test connection
psql -U postgres -h localhost -p 5432
```

**Solution:**
- Ensure PostgreSQL is running
- Verify DATABASE_URL in .env
- Check firewall settings

### Redis Connection Issues

**Error: `Redis connection refused`**
```bash
# Check if Redis is running
redis-cli ping

# Restart Redis
sudo systemctl restart redis-server  # Linux
brew services restart redis  # Mac
```

### Prisma Migration Issues

**Error: `Migration failed to apply`**
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or create a new migration
npx prisma migrate dev --name fix_issue
```

### Port Already in Use

**Error: `Port 4000 is already in use`**
```bash
# Find process using port 4000
lsof -i :4000  # Mac/Linux
netstat -ano | findstr :4000  # Windows

# Kill the process or change PORT in .env
```

### SendGrid/Twilio Issues

**Email not sending:**
- Verify SendGrid API key is correct
- Check sender email is verified in SendGrid
- Look for errors in console logs
- Ensure you haven't exceeded free tier limits (100/day)

**SMS not sending:**
- For Twilio trial accounts, verify recipient phone numbers
- Check Twilio console for error logs
- Ensure phone number format is E.164 (+1234567890)

---

## 10. Development Tips

### View Database
```bash
npx prisma studio
```

### Check Logs
The application logs are displayed in the console. For production, consider:
- PM2 for process management
- Winston or Pino for structured logging
- ELK stack for log aggregation

### Database Queries
```bash
# Open Prisma Client in REPL
npx ts-node
> const { PrismaClient } = require('@prisma/client')
> const prisma = new PrismaClient()
> await prisma.user.findMany()
```

### Redis Commands
```bash
redis-cli

# View all keys
KEYS *

# Get specific key
GET token:some-id

# Clear all data (BE CAREFUL!)
FLUSHALL
```

---

## 11. Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use strong JWT secrets (32+ characters)
3. Enable HTTPS
4. Use managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
5. Use managed Redis (AWS ElastiCache, Redis Cloud, etc.)

### Using PM2
```bash
npm install -g pm2

# Start application
pm2 start dist/main.js --name dqms-backend

# View logs
pm2 logs dqms-backend

# Restart
pm2 restart dqms-backend
```

### Using Docker
```bash
# Build image
docker build -t dqms-backend .

# Run container
docker run -p 4000:4000 --env-file .env dqms-backend
```

---

## 12. Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── auth/                  # Authentication module
│   ├── users/                 # User management
│   ├── services/              # Service management
│   ├── tokens/                # Token & Queue logic
│   │   ├── tokens.service.ts
│   │   ├── tokens.gateway.ts  # WebSocket gateway
│   │   └── tokens.controller.ts
│   ├── queue/                 # CRON jobs & queue processing
│   ├── presence/              # Geolocation verification
│   ├── notifications/         # Notification service
│   ├── abuse/                 # Abuse detection & logging
│   ├── admin/                 # Admin panel APIs
│   ├── prisma/                # Prisma service
│   ├── app.module.ts          # Main app module
│   └── main.ts                # Application entry point
├── .env                       # Environment variables
├── package.json
└── tsconfig.json
```

---

## 13. Security Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (generate with `openssl rand -base64 32`)
- [ ] Enable HTTPS
- [ ] Set up CORS properly
- [ ] Use helmet for security headers
- [ ] Enable rate limiting
- [ ] Set up database backups
- [ ] Use environment-specific .env files
- [ ] Never commit .env to Git
- [ ] Enable Redis authentication
- [ ] Use connection pooling for database
- [ ] Set up monitoring (Sentry, DataDog, etc.)

---

## 14. Support

For issues or questions:
1. Check the troubleshooting section
2. Review Prisma documentation: https://www.prisma.io/docs
3. Check NestJS docs: https://docs.nestjs.com
4. Open an issue on the project repository

---

## 15. Next Steps

After backend is running:
1. Test all API endpoints
2. Set up the frontend application
3. Test WebSocket connections
4. Create initial service entries via Prisma Studio
5. Test complete user flow (signup → token issuance → queue → completion)

---

**You're now ready to run the DQMS backend! 🚀**
