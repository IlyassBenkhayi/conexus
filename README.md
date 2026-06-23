<div align="center">

# 🔗 CONEXUS

**A real-time collaborative virtual room platform**

TypeScript • React • Socket.IO • Express • MIT License

Create shared virtual rooms, embed media, collaborate in real-time with cursors, whiteboards, polls, and more.

---

## 🚀 Live Preview

![CONEXUS Hero](./Screenshot%202026-06-22%20235958.png)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎥 Media Embedding | YouTube, Twitch, Spotify, SoundCloud support |
| 🖱️ Live Cursors | Real-time user movement |
| 📹 Screen Sharing | WebRTC peer-to-peer streaming |
| 🎨 Whiteboard | Collaborative drawing canvas |
| 📊 Polls | Live voting system |
| ✅ Todo Lists | Shared tasks |
| ⏱️ Timers | Synced countdowns |
| 💬 Chat | Persistent room chat |
| 🗺️ Minimap | Navigation support |
| 🔐 Auth | JWT authentication |
| ⚙️ Settings | Room configuration |

---

## 🖼️ Product Showcase

### 🧠 Main Interface
![UI](<img width="1919" height="992" alt="Screenshot 2026-06-22 235958" src="https://github.com/user-attachments/assets/209292d9-738f-446f-9477-d8736aa82e77" />)

### 💬 Chat
![Chat](<img width="1919" height="989" alt="Screenshot 2026-06-23 000117" src="https://github.com/user-attachments/assets/8d24ed12-ec9d-4964-90ee-6e46f7116560" />)

### 🖱️ Cursors
![Cursors](<img width="1919" height="990" alt="Screenshot 2026-06-23 000200" src="https://github.com/user-attachments/assets/2b6b25de-9280-480e-8c7b-029882587305" />)

### 🎥 Media
![Media](<img width="1919" height="993" alt="Screenshot 2026-06-23 000225" src="https://github.com/user-attachments/assets/452e0e8a-5178-49f3-90a2-6b19f0036070" />)

### 🎨 Whiteboard
![Whiteboard](<img width="1919" height="990" alt="Screenshot 2026-06-23 000749" src="https://github.com/user-attachments/assets/00702a79-1625-421c-9cb1-249a2905c7b4" />)

### 📊 Tools
![Tools](<img width="1919" height="992" alt="Screenshot 2026-06-23 000816" src="https://github.com/user-attachments/assets/0d7facf0-6813-4341-9c93-11e971cc37d3" />)

### 🧩 Controls
![Controls](<img width="1919" height="993" alt="Screenshot 2026-06-23 000959" src="https://github.com/user-attachments/assets/70203ded-5887-4c51-832a-6d93130a8ca3" />)

### ⚙️ Settings
![Settings](<img width="1919" height="991" alt="Screenshot 2026-06-23 001132" src="https://github.com/user-attachments/assets/2b8cbff3-983d-44ea-895a-12316b3968bf" />)

---

## 🏗️ Architecture

<pre>
conexus/
├── apps/
│   ├── server/
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── middleware/
│   │   │   ├── rooms/
│   │   │   ├── routes/
│   │   │   ├── socket/
│   │   │   ├── types/
│   │   │   ├── db.ts
│   │   │   └── index.ts
│   │   └── uploads/
│   │
│   └── web/
│       └── src/
│           ├── components/
│           ├── hooks/
│           ├── lib/
│           ├── pages/
│           └── store/
│
├── packages/
│   └── shared-types/
│
├── tsconfig.base.json
└── package.json
</pre>

---

## 🚀 Getting Started

bash:
git clone https://github.com/YOUR_USERNAME/conexus.git
cd conexus
npm install
npm run dev

🛡️ Security
JWT authentication
bcrypt hashing
Environment-based secrets
Input validation
SQLite WAL safety
🤝 Contributing

Fork → Branch → Commit → PR

📝 License

MIT License

<div align="center">

Built with ❤️ as a portfolio project

</div> 
