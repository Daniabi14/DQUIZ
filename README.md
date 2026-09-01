# DQUIZ — Standalone Real-Time Multiplayer Quiz Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?style=flat&logo=firebase)](https://firebase.google.com/)

**DQUIZ** is an independent, production-ready real-time multiplayer quiz management and participation platform. Built with an original brand identity, modern responsive architecture, and server-authoritative state synchronization.

---

## 🌟 Key Features

### For Hosts & Educators
- **Interactive Quiz Builder**: Single Choice, True/False, Multiple Choice with customizable timers and base points.
- **Bulk Spreadsheet Import**: Pre-formatted Excel (`.xlsx`) and CSV (`.csv`) template downloads with row-by-row validation and diagnostic error reporting.
- **Centralized Question Bank**: Global repository across all quizzes with search, category filtering, and live preview.
- **Real-Time Multiplayer Lobby**: Random 6-digit PIN generation, dynamic QR Code (`qrcode.react`), one-click join link copy, and participant roster with kick controls.
- **Fisher-Yates Randomization**: Unbiased question sequencing and per-participant option shuffling.
- **Live Host Control Room**: Live response counters, option breakdown bar charts, Pause/Resume, manual End Question, and Next Question controls.
- **Host-Only Live Leaderboard**: Top participant scores with animated ranking badges.
- **Multi-Format Reporting**:
  - **Executive Summary PDF**: Complete leaderboard, KPI metric cards, and verification footer (`jspdf` + `jspdf-autotable`).
  - **Excel & CSV Reports**: Participant Report, Question Analytics Report, Granular Response Log, and Attendance Log.

### For Students / Participants
- **Mobile-First Experience**: Zero app installation required. Join with Game PIN, Name, and Roll Number / ID.
- **Strict Privacy Guarantee**: Students never see other participant identities, rankings, scores, or correct answer keys.
- **Instant Answer Locking**: Options lock immediately on submission (`ANSWER SUBMITTED`) to eliminate race conditions.
- **Auto Reconnection**: Robust session persistence and offline/online status monitoring.

### For Super Administrators
- **System Telemetry**: Concurrency throughput, sync latency metrics, and engine health.
- **Multi-Host Management**: User directory, account activation, and role-based access control.

---

## 🏗️ Project Architecture

```text
app/
├── page.tsx                     # Landing Page
├── join/page.tsx                # Mobile-First Student Join
├── login/page.tsx               # Host & Admin Auth Portal
├── game/[id]/page.tsx           # Student Live Quiz Room
├── host/
│   ├── dashboard/page.tsx       # Host Dashboard Hub
│   ├── quizzes/page.tsx         # My Quizzes Library
│   ├── quizzes/new/page.tsx     # New Quiz Metadata Form
│   ├── quizzes/[id]/edit/       # Quiz & Question Builder
│   ├── question-bank/page.tsx   # Global Question Repository
│   ├── upload/page.tsx          # Excel/CSV Bulk Upload
│   ├── games/page.tsx           # Live Games History
│   ├── games/launch/page.tsx    # Live Session Configurator
│   ├── games/[id]/lobby/        # Host Live Lobby (PIN & QR)
│   ├── games/[id]/control/      # Host Live Control Room
│   ├── results/page.tsx         # Final Results Dashboard
│   ├── reports/page.tsx         # Reports Download Center
│   ├── participants/page.tsx    # Historical Student Roster
│   ├── profile/page.tsx         # Host Profile
│   └── settings/page.tsx        # Host Default Settings
└── admin/
    ├── dashboard/page.tsx       # Super Admin Dashboard
    ├── users/page.tsx           # User Directory & Suspension
    ├── analytics/page.tsx       # System Concurrency Telemetry
    └── settings/page.tsx        # Global Platform Policy

components/                      # Reusable UI, Layout, and Quiz Modals
lib/                             # Firebase, Scoring, Shuffling, Upload, and Report Services
hooks/                           # useGame, useTimer, useAuth
types/                           # TypeScript interfaces for all data entities
firestore.rules                  # Strict privacy and multi-host security rules
```

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm run start
```

---

## 📦 Deployment (Hosting Online)

### Deploying to Vercel (Recommended)
1. Push this repository to your **GitHub** account.
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your **`dquiz`** GitHub repository.
4. Click **Deploy**. Vercel will automatically detect Next.js and deploy your live URL.

### Firebase Configuration (Optional)
To connect your own live Firebase project:
1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database** and **Authentication** (Email/Password & Anonymous).
3. Create `.env.local` with your credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## 🔒 License
This project is licensed under the MIT License.
