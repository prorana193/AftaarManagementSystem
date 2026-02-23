# Aftaar Manager - Expense Tracking System

## Overview
A production-ready Aftaar expense tracking system with participant management, daily expense splitting, deposits, profiles, and PDF reporting. Built with role-based access (admin/viewer).

## Tech Stack
- **Frontend**: Next.js 14 (JavaScript, App Router) on port 5000
- **Styling**: Tailwind CSS + DaisyUI (custom "aftaar" theme)
- **Backend**: Express.js on port 3001
- **Database**: MongoDB with Mongoose ODM
- **Auth**: JWT-based role system (admin/user)

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
  /middleware          - Auth, error handling
  server.js           - Entry point
```

## Environment Variables
- `MONGODB_URI` - MongoDB connection string (secret)
- `ADMIN_PASSWORD` - Admin login password
- `USER_PASSWORD` - Viewer login password
- `PORT` - Backend port (3001)
- `SESSION_SECRET` - JWT secret

## Workflows
- **Frontend**: `cd frontend && npm run dev` (port 5000, webview)
- **Backend Server**: `cd server && node server.js` (port 3001, console)

## API Proxy
Next.js rewrites `/api/*` requests to `http://localhost:3001/api/*`

## Recent Changes
- 2026-02-23: Initial build with App Router structure
