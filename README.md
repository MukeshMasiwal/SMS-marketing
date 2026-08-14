# SMS Marketing Platform

A production-grade bulk SMS marketing platform built with:
- **Frontend**: React + Vite + TypeScript (`client/`)
- **Backend**: Node.js + Express + TypeScript + Mongoose (`server/`)
- **Database**: MongoDB
- **Authentication**: JWT Access (15m) & Refresh Tokens (7d) in HTTP-only cookies, Session DB Hashing & Token Rotation
- **Email Infrastructure**: Nodemailer SMTP Client with 6-digit OTP verification and password reset

---

## 📧 SMTP Email Infrastructure

Nodemailer acts as the **SMTP Client** connecting to an external or local SMTP server.

```
React (client)  ──>  Express (server)  ──>  Nodemailer  ──>  SMTP Server/Provider  ──>  User Inbox
```

> **Security Note**: SMTP credentials exist exclusively on the server (`server/.env.local`). They are never exposed to the Vite React frontend.

---

## 🛠️ Local Development Setup with Mailpit

For local testing without sending real emails, run Mailpit via Docker:

```bash
docker run -d \
  --name mailpit \
  -p 8025:8025 \
  -p 1025:1025 \
  axllent/mailpit
```

Configure your `server/.env.local` for Mailpit:
```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM="SMS Marketing" <no-reply@localhost>
SMTP_SECURE=false
```

Open the Mailpit Web UI at [http://localhost:8025](http://localhost:8025) to view all received signup and password reset OTP emails locally.

---

## 🌐 Production SMTP Provider Configuration

The application is provider-independent and connects to any standards-compliant SMTP server by configuring server environment variables.

### 1. SendGrid SMTP
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
SMTP_FROM="SMS Marketing" <no-reply@yourdomain.com>
SMTP_SECURE=false
```

### 2. Amazon SES SMTP
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_ses_smtp_username
SMTP_PASSWORD=your_ses_smtp_password
SMTP_FROM="SMS Marketing" <no-reply@yourdomain.com>
SMTP_SECURE=false
```

### 3. Brevo (Sendinblue) SMTP
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_login
SMTP_PASSWORD=your_brevo_smtp_key
SMTP_FROM="SMS Marketing" <no-reply@yourdomain.com>
SMTP_SECURE=false
```

---

## 🔒 Security & OTP Rules
- **OTP Generation**: Cryptographically secure 6-digit integer (`crypto.randomInt`).
- **OTP Storage**: Stored only as SHA-256 hash in MongoDB (`Otp` collection) with a 10-minute TTL index.
- **Verification Attempts**: Maximum 5 attempts before code invalidation.
- **Failure Handling**: If SMTP delivery fails during signup, the newly created unverified account and OTP record are cleaned up, returning a controlled HTTP 500 error (`"Unable to send verification email. Please try again later."`).

---

## 🚀 Running the Project

1. **Install Dependencies**:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

2. **Seed Demo Data**:
   ```bash
   npm run seed
   ```

3. **Run Backend Server**:
   ```bash
   cd server && npm run dev
   ```

4. **Run Frontend Client**:
   ```bash
   cd client && npm run dev
   ```
