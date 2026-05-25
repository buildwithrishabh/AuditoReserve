# AudiBook System - Frontend

React + TypeScript + Vite frontend for the Auditorium Booking System.

## Prerequisites

- Node.js 18+
- Backend API running (see `backend/README.md`)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend API URL (default: `http://localhost:5000/api`) |
| `VITE_UNIVERSITY_DOMAIN` | Yes | Email domain allowed for registration |

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Build for Production

```bash
npm run build
```

Output is in the `dist/` directory. Serve with any static file server or the backend.

## Project Structure

```
src/
├── api/          # API client functions
├── components/   # Reusable UI components
├── hooks/        # React hooks (auth, toast)
├── pages/        # Page components
│   ├── admin/    # Admin dashboard pages
│   ├── auth/     # Login, register, etc.
│   ├── public/   # Public pages (home, catalog)
│   └── student/  # Student pages
├── App.tsx       # Root component with routing
├── App.css       # Global styles
└── main.tsx      # Entry point
```
