<div align="center">

# 🔗 CONEXUS

**A real-time collaborative virtual room platform**

TypeScript • React • Socket.IO • Express • MIT License

Create shared virtual rooms, embed media, collaborate in real-time with cursors, whiteboards, polls, and more.

---

## 🚀 Live Preview

![CONEXUS Hero](./docs/hero.png)

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
![UI](./docs/cursors.png)

### 🧩 Room Setup
![Chat](./docs/controls.png)

### 🖱️ Open canvas
![Cursors](./docs/whiteboard.png)

### 📊 Tools
![Media](./docs/tools.png)

### ⚙️ Settings
![Whiteboard](./docs/settings.png)

### 🎥 Media
![Tools](./docs/media.png)

### 💬 Chat
![Controls](./docs/chat.png)

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

```
bash:
git clone https://github.com/YOUR_USERNAME/conexus.git
cd conexus
npm install
npm run dev
```
---

## 🛡️ Security

```
JWT authentication
bcrypt hashing
Environment-based secrets
Input validation
SQLite WAL safety
```
---

## 🤝 Contributing
```
Fork → Branch → Commit → PR
```
---

## 📝 License
```
MIT License
```
## Trademark & Branding
```
Copyright (c) 2026 Ilyass Benkhayi

The MIT License applies only to the source code contained in this repository.

The CONEXUS name, logo, visual identity, artwork, designs, screenshots, and branding materials are not licensed under the MIT License.

No permission is granted to use, reproduce, modify, or distribute the CONEXUS branding, logo, or visual identity without explicit written permission from the author.
```
<div align="center">

Built with ❤️ as a portfolio project

</div>
