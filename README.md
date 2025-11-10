# Hospital Management System (HMS)

A production-ready MERN stack application with role-based access, advanced appointment management (rescheduling, confirmations, waiting queue, follow-ups), billing, HR, inventory, and analytics.

## Tech Stack
- Frontend: React (Vite), Tailwind CSS, Redux Toolkit, React Router, Axios
- Backend: Node.js, Express.js, MongoDB (Mongoose), JWT (access + refresh), Joi validation, Swagger
- Optional: Socket.io (real-time), Redis (cache), AWS S3 (file storage)
- Testing: Jest, Supertest, React Testing Library
- DevOps: Docker, docker-compose, Nginx, GitHub Actions CI

## Quick start (Dev)

1) Server env
- Copy `server/.env.example` to `server/.env` and customize as needed. On Windows PowerShell:
```
Copy-Item server/.env.example server/.env
```
- For production, set strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. In development, the API will use fallback secrets if these are missing (a console warning will appear).

2) Seed data
- From `server/` run the seed to create roles and the admin user (`admin@hms.local` / `Admin@123`).

3) Run apps
- Start API from `server/` and the web app from `client/`.

## Monorepo structure
```
.
├─ server/          # Express API, Mongoose models, Swagger docs, tests
├─ client/          # React app, Tailwind, Redux, pages
├─ docker/          # Nginx config, Docker resources
├─ .github/workflows/  # CI/CD pipelines
└─ README.md
```

## Environments
- Copy `.env.example` to `.env` inside `server/` and `client/` and adjust values.

Accepted email formats: development allows local domains like `admin@hms.local` (Joi TLD check disabled). For production, use real domains.

## New Features (Latest Update)

### 🚀 Appointment Enhancements
1. **Rescheduling** - Patients and staff can reschedule appointments with conflict detection and email notifications
2. **Confirmations** - Automatic email confirmations on booking, resend option for staff, patient confirmation tracking
3. **Waiting Queue** - Priority-based waitlist system with auto-scheduling when slots open
4. **Follow-ups** - Doctors can schedule follow-up appointments from completed visits
5. **Doctor Availability** - Manage working hours, breaks, and days off with calendar system

📖 **Full Documentation:** See [APPOINTMENT_ENHANCEMENTS.md](./APPOINTMENT_ENHANCEMENTS.md) for detailed feature descriptions, API endpoints, and setup instructions.

📧 **Email Setup:** See [EMAIL_SETUP.md](./EMAIL_SETUP.md) for SMTP configuration guide (Gmail, SendGrid, AWS SES, etc.)

### API Highlights
```
POST /appointments/:id/reschedule              # Reschedule with conflict check
POST /appointments/:id/follow-up               # Schedule follow-up appointment
POST /appointments/:id/resend-confirmation     # Resend email confirmation
GET  /waiting-queue                            # View patient waitlist
POST /waiting-queue/:id/schedule               # Schedule from queue
GET  /doctors/:doctorId/availability           # Get doctor schedule
POST /doctors/:doctorId/days-off               # Request time off
```

## Security
- Protect secrets with environment variables
- Helmet, rate limiting, input validation, and sanitized queries enabled by default
- Role-based access control on all appointment enhancement endpoints
- Email notifications use secure SMTP with TLS

## License
MIT