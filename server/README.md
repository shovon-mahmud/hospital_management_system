# HMS Server (Express)

## Scripts
- npm run dev — start in dev with nodemon
- npm start — start production
- npm test — run Jest tests
- npm run seed — seed roles and admin user

## Env
Copy `.env.example` to `.env` and edit.

Required (prod):
- JWT_ACCESS_SECRET, JWT_REFRESH_SECRET — strong random strings

Notes:
- In development, if these are missing, the server will use safe fallback values and print a warning. Do NOT rely on fallbacks in production.

### Email Configuration

Variables (already in `.env`):
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — Outbound SMTP credentials.
- `FRONTEND_URL` — Base URL of the web client used to build verification links (default `http://localhost:5173`).
- `LOGIN_NOTIFY` — Set to `true` to send a security notification email on each successful login.
- `LOGIN_GREETING` — Enable/disable friendly login greeting email (default `true`).
- `APP_NAME` — Application name used in email templates.

Behavior:
- If SMTP credentials are omitted in development, the server will automatically provision an Ethereal test account (in-memory) and log a preview URL after sending. This allows you to inspect emails without delivering them.
- **Signup**: sends a 6-digit verification code via email (HTML + text).
- **Verification**: users enter the code via POST `/api/auth/verify-email` with `{ email, code }`. Code expires in 15 minutes.
- **Resend code**: POST `/api/auth/resend-code` with `{ email }` generates and sends a new code.
- **Login enforcement**: Unverified users are blocked with a 403 error. If their verification code is expired or missing, a fresh code is automatically generated and sent to their email, allowing them to verify before logging in.
- **Frontend flow**: 
  - After signup → redirected to `/verify-email` page with email pre-filled
  - Failed login (403/unverified) → redirected to `/verify-email` with fresh code sent
  - Users can manually request a new code via "Resend Code" button
- After verification: sends a welcome greeting email (HTML + text) with role and dashboard link.
- Login: if `LOGIN_GREETING=true` a branded login summary email (IP, client, previous login delta) is sent; if `LOGIN_NOTIFY=true` you can also enable additional security-oriented messaging (combined now in greeting template).### Recommended Improvements (Security)
- Use a dedicated email verification secret (separate from `JWT_ACCESS_SECRET`).
- Store a hashed one-time verification token in the DB instead of using a signed JWT so it can be invalidated early.
- Enforce HTTPS for `FRONTEND_URL` in production.
- Add rate limiting to verification and login notification endpoints (already general rate-limit applied globally).

Windows (PowerShell):
```
Copy-Item .env.example .env
```

## API
- Base URL: /api
- Swagger: /api/docs
- Health: /api/health

## Notes
- JWT: access + refresh
- Security: helmet, rate-limit, hpp, xss-clean
- Consistent response: { success, message, data }
 - Email templates: centralized in `src/utils/emailTemplates.js`
	- `verifyEmailTemplate`, `welcomeEmailTemplate`, `loginGreetingTemplate`
