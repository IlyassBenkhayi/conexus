<<<<<<< HEAD
<div align="center">

# 🔗 CONEXUS

**A real-time collaborative virtual room platform**

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socketdotio)](https://socket.io/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg)](./LICENSE)

Create shared virtual rooms, embed media from YouTube/Twitch/Spotify, collaborate with whiteboards, polls, timers, and more — all in real-time with live cursors and video chat.

[Getting Started](#-getting-started) · [Features](#-features) · [Architecture](#-architecture) · [Contributing](#-contributing)

</div>
=======
# CONEXUS

## 🌐 Overview

CONEXUS is a real-time virtual collaboration platform designed to make online interaction more immersive, engaging, and human-centered.

It enables users to connect in shared digital spaces, communicate in real time, and interact through media, messaging, and synchronized experiences.

The goal is to move beyond traditional chat applications and create a more dynamic and community-driven online environment.

---

## 💡 Motivation

Modern communication platforms often feel fragmented, overly optimized, and disconnected from real human interaction.

CONEXUS was created to explore a different approach — one where digital spaces feel more natural, interactive, and alive.

The project focuses on rebuilding the sense of presence and collaboration in online environments.
>>>>>>> a7f28f69feab89174f69c57dba5ff1f23fc79c7b

---

## ✨ Features

<<<<<<< HEAD
| Feature | Description |
|---|---|
| 🎥 **Live Media Embedding** | Embed YouTube, Twitch, Vimeo, Dailymotion, Spotify, and SoundCloud content directly into rooms |
| 🖱️ **Real-time Cursors** | See collaborators move in the room with live avatar cursors via WebSocket |
| 📹 **Screen Sharing** | Share your screen with room participants via WebRTC peer-to-peer connections |
| 🎨 **Whiteboard** | Freeform collaborative drawing canvas embedded as a room object |
| 📊 **Polls** | Create and vote on polls within the room in real-time |
| ✅ **Todo Lists** | Shared, interactive checklists synced across all participants |
| ⏱️ **Timers** | Synchronized countdown timers visible to all room members |
| 💬 **Live Chat** | Persistent room chat with message history, GIF support, and customizable styling |
| 🗺️ **Minimap** | Navigate large room canvases with a real-time minimap overlay |
| 🔐 **Auth & Profiles** | JWT-based authentication with customizable user profiles (avatar, banner, bio) |
| ⚙️ **Room Settings** | Granular permission controls — toggle camera, mic, content adding, and public access |

## 🏗️ Architecture

```
conexus/
├── apps/
│   ├── server/          # Express 5 + Socket.IO backend
│   │   ├── src/
│   │   │   ├── auth/        # JWT utilities (sign, verify, hash)
│   │   │   ├── middleware/  # Express middleware (auth guard)
│   │   │   ├── rooms/      # In-memory room state & cleanup
│   │   │   ├── routes/     # REST API (auth, users, rooms, chat, media, upload)
│   │   │   ├── socket/     # WebSocket event handlers
│   │   │   ├── types/      # Database row types & Express augmentations
│   │   │   ├── db.ts       # SQLite schema & connection
│   │   │   └── index.ts    # Server entry point
│   │   └── uploads/        # User-uploaded files (gitignored)
│   │
│   └── web/             # React 19 + Vite frontend
│       └── src/
│           ├── components/room/    # Room UI (chat, toolbar, media, widgets)
│           ├── hooks/              # Custom React hooks
│           ├── lib/                # API client & utilities
│           ├── pages/              # Auth, Dashboard, Room views
│           └── store/              # Zustand state management
│
├── packages/
│   └── shared-types/    # Shared TypeScript interfaces (events, state)
│
├── .env.example         # Root environment template
├── tsconfig.base.json   # Shared TypeScript configuration
└── package.json         # Workspace root (npm workspaces)
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Zustand 5, React Router 7, Lucide Icons |
| **Backend** | Express 5, Socket.IO 4, better-sqlite3, bcryptjs, jsonwebtoken |
| **Real-time** | Socket.IO (WebSocket) for state sync, WebRTC (simple-peer) for screen sharing |
| **Database** | SQLite with WAL mode — zero-config, file-based persistence |
| **Shared** | `@conexus/shared-types` — typed Socket.IO events & room state |
| **Language** | TypeScript 6 end-to-end (strict mode, no `any` casts) |
| **Monorepo** | npm workspaces |

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/conexus.git
cd conexus

# 2. Install all dependencies (workspaces)
npm install

# 3. Set up environment variables
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env

# 4. (Optional) Generate a secure JWT secret for production
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Paste the output into apps/server/.env as JWT_SECRET=<value>
```

### Development

```bash
# Start both frontend and backend concurrently
npm run dev

# Or start individually:
npm run dev:web      # Vite dev server (default: http://localhost:5173)
npm run dev:server   # Express server  (default: http://localhost:3001)
```

The SQLite database is created automatically on first run at `apps/server/conexus.db`.

### Environment Variables

#### Server (`apps/server/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3001` | HTTP server port |
| `JWT_SECRET` | **Production** | dev fallback | JWT signing secret — **must be set in production** |
| `SERVER_URL` | No | `http://localhost:3001` | Base URL for uploaded file URLs |
| `TWITCH_CLIENT_ID` | No | — | Twitch API Client-ID for stream search |

#### Web (`apps/web/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_WEBSOCKET_URL` | No | `http://localhost:3001` | URL of the CONEXUS server |

## 🛡️ Security

- **JWT Authentication** — Stateless, expiring tokens (7-day TTL) with bcrypt password hashing (cost factor 12)
- **Environment-aware secrets** — The server refuses to start in production without a proper `JWT_SECRET`
- **No hardcoded credentials** — All sensitive values are loaded from environment variables
- **Input sanitization** — User positions are clamped to world bounds; auth checks on every socket event
- **SQLite WAL mode** — Safe concurrent reads without locking

## 📐 Design Decisions

| Decision | Rationale |
|---|---|
| **SQLite over Postgres** | Zero-config setup for local dev and portfolio demos; WAL mode handles concurrent access well |
| **In-memory room state** | User positions update at 20Hz — too fast for disk; ephemeral state lives in memory, persistent data goes to SQLite |
| **Shared types package** | Single source of truth for Socket.IO event signatures prevents client/server drift |
| **Modular route files** | Each domain (auth, rooms, chat, media) lives in its own file for clear ownership |
| **Zustand over Redux** | Minimal boilerplate, excellent TypeScript support, and built-in subscriptions for React 19 |

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ as a portfolio project</sub>
</div>
=======
* Real-time messaging system
* Virtual rooms / shared spaces
* Media sharing capabilities
* Synchronized media playback
* Screen sharing functionality
* User presence and interaction system
* Modern responsive UI/UX design
* Scalable real-time architecture (Socket-based communication)

---

## 🧠 Tech Stack

* React
* TypeScript
* Vite
* Node.js
* Socket.IO
* Supabase
* Zustand
* Modern CSS / UI design system

---

## ⚙️ Architecture Overview

CONEXUS is built as a real-time system where the frontend communicates with a backend service using WebSockets.

Key design principles:

* Low-latency communication
* State synchronization between users
* Modular frontend architecture
* Scalable real-time event handling

---

## 🚧 Key Challenges

* Managing real-time synchronization between multiple users
* Handling authentication and session stability
* Ensuring smooth media playback alongside live interactions
* Preventing state desynchronization in shared rooms
* Optimizing performance for real-time updates

---

## 📸 Screenshots

> Add project screenshots here

* Home UI
* Chat / Room interface
* Media player modal
* Screen sharing feature

---

## 📌 Project Status

🚧 Early-stage development (actively evolving)

---

## 👤 Author

**Ilyass Benkhayi**
Software Development Student at OFPPT
Aspiring Software Engineer & Technology Entrepreneur
>>>>>>> a7f28f69feab89174f69c57dba5ff1f23fc79c7b
