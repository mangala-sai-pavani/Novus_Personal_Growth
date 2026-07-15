# Zenith: Personal Growth System - Architecture & Deployment

## 🏗️ System Architecture

This system is designed using **Clean Architecture** principles, ensuring scalability and maintainability.

### 1. Frontend (Mobile-First Web)
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS (Mobile-First Utility)
- **State Management:** React Hooks + Context API
- **Animations:** Framer Motion (via `motion/react`)
- **Charts:** Recharts

### 2. Backend (Full-Stack API)
- **Framework:** Express.js (Node.js)
- **Validation:** Zod
- **AI Engine:** Google Gemini (via `@google/genai`)
- **Database:** In-memory store (extendable to PostgreSQL/Firebase)

## 🧩 Core Modules

- **Habit Tracker:** CRUD operations with streak calculation logic.
- **Routine Planner:** Time-blocked scheduling system.
- **Journal:** Mood tracking and rich-text entries.
- **AI Advisor:** Personalized growth suggestions based on user data.
- **Analytics:** Visual progress tracking.

## 🚀 Deployment Instructions

### Backend (Production)
1. Set `NODE_ENV=production`.
2. Ensure `GEMINI_API_KEY` is set in environment variables.
3. Run `npm run build` to generate the static frontend.
4. Run `npm start` to launch the Express server.

### Frontend
- The frontend is served statically by the Express server in production.
- For development, use `npm run dev` which runs the Express server with Vite middleware.

## 📱 Mobile (Flutter Reference)
For a native mobile experience, the API endpoints in `server.ts` are RESTful and can be consumed by a Flutter application using the `http` or `dio` packages.
