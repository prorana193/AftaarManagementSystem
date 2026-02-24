# Aftaar Manager - Expense Tracking System

## Overview
A production-ready Aftaar expense tracking system with participant management, daily expense splitting, deposits, profiles, and PDF reporting. Built with role-based access (admin/viewer).

## Tech Stack
- **Frontend**: Next.js 14 (JavaScript, App Router) on port 5000
- **Styling**: Tailwind CSS + DaisyUI (custom "aftaar" theme)
- **Backend**: Express.js on port 3001
- **Database**: MongoDB with Mongoose ODM
- **Auth**: JWT-based role system (admin/user), signed with SESSION_SECRET

## Project Structure
```
/frontend (Next.js App Router)
  /app
    /layout.js        - Root layout
    /page.js          - Dashboard
    /login/page.js    - Login page
    /participants/page.js     - Participant list
    /participants/[id]/page.js - Participant profile
    /aftaar/page.js   - Daily Aftaar entries
    /deposits/page.js - Deposit management
    /reports/page.js  - Reports & PDF export
  /components
    Layout.js, StatCard.js, LoadingSpinner.js
  /utils
    api.js, formatters.js

/server (Express.js MVC)
  /config/db.js       - MongoDB connection
  /models             - Mongoose schemas (Participant, Deposit, AftaarEntry)
  /controllers        - Business logic
  /routes             - API endpoints
  /middleware          - Auth (JWT), error handling
  server.js           - Entry point
```

## Environment Variables
- `MONGODB_URI` - MongoDB connection string (secret)
- `SESSION_SECRET` - JWT signing secret (secret)
- `ADMIN_PASSWORD` - Admin login password (default: admin123)
- `USER_PASSWORD` - Viewer login password (default: user123)
- `PORT` - Backend port (default: 3001)

## Workflows
- **Frontend**: `cd frontend && npm run dev` (port 5000, webview)
- **Backend Server**: `cd server && node server.js` (port 3001, console)

## API Proxy
Next.js rewrites `/api/*` requests to `http://localhost:3001/api/*`

## Key Features
- Role-based access: Admin (full CRUD), User (read-only)
- Participant management with safe deletion (deactivate if has history)
- Daily Aftaar entries with automatic per-person expense splitting
- Deposit tracking per participant
- Detailed participant profile pages with transaction history
- PDF report generation with jsPDF
- Responsive design with mobile sidebar

## Recent Changes
- 2026-02-23: Initial build with full-stack architecture
- 2026-02-23: Fixed participant profile page (use useParams instead of use(params))
- 2026-02-23: Improved security - JWT secret uses SESSION_SECRET env var, removed hardcoded fallback
- 2026-02-23: Added participant validation in Aftaar entry creation (checks active status)
- 2026-02-23: Enhanced MongoDB connection error handling
