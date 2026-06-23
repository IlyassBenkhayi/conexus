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

---

## 🚀 Live Preview

![CONEXUS Hero](./Screenshot%202026-06-22%20235958.png)

</div>

---

## ✨ Features

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

---

## 🖼️ Product Showcase

### 🧠 Main Interface
![UI](./Screenshot%202026-06-22%20235958.png)

### 💬 Real-time Chat & Activity
![Chat](./Screenshot%202026-06-23%20000117.png)

### 🖱️ Live Cursor Synchronization
![Cursors](./Screenshot%202026-06-23%20000200.png)

### 🎥 Media Embedding System
![Media](./Screenshot%202026-06-23%20000225.png)

### 🎨 Collaborative Whiteboard
![Whiteboard](./Screenshot%202026-06-23%20000749.png)

### 📊 Interactive Tools (Polls / Tasks / Timers)
![Tools](./Screenshot%202026-06-23%20000816.png)

### 🧩 Room Controls & Permissions
![Controls](./Screenshot%202026-06-23%20000959.png)

### ⚙️ Settings & Configuration
![Settings](./Screenshot%202026-06-23%20001132.png)

---

## 🏗️ Architecture


conexus/
├── apps/
│ ├── server/ # Express 5 + Socket.IO backend
│ │ ├── src/
│ │ │ ├── auth/
│ │ │ ├── middleware/
│ │ │ ├── rooms/
│ │ │ ├── routes/
│ │ │ ├── socket/
│ │ │ ├── types/
│ │ │ ├── db.ts
│ │ │ └── index.ts
│ │ └── uploads/
│ │
│ └── web/ # React 19 + Vite frontend
│ └── src/
│ ├── components/
│ ├── hooks/
│ ├── lib/
│ ├── pages/
│ └── store/
│
├── packages/
│ └── shared-types/
│
├── .env.example
├── tsconfig.base.json
└── package.json


---

## 🚀 Tech Stack

- **Frontend:** React 19, Vite, Zustand, React Router
- **Backend:** Express 5, Socket.IO
- **Database:** SQLite (WAL mode)
- **Realtime:** WebSockets + WebRTC (simple-peer)
- **Language:** TypeScript (strict mode)
- **Monorepo:** npm workspaces

---

## 🧠 Design Philosophy

- Real-time first architecture
- Minimal latency socket updates (20Hz state sync)
- Shared type system between client & server
- In-memory ephemeral room state
- Persistent storage only where needed (SQLite)

---

## ⚙️ Getting Started

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/conexus.git
cd conexus

# Install dependencies
npm install

# Setup environment
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env

# Run development servers
npm run dev
🛡️ Security
JWT authentication with bcrypt hashing
Environment-based secret management
No hardcoded credentials
Input validation on socket events
SQLite WAL safe concurrency
🤝 Contributing
Fork repo
Create branch
Commit changes
Push branch
Open PR
📝 License

MIT License

<div align="center">
Built with ❤️ as a portfolio project
</div> ``
