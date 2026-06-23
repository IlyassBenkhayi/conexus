# Contributing to CONEXUS

Thank you for your interest in contributing! This guide will help you get started.

## 📋 Code of Conduct

Please be respectful and constructive in all interactions. We're building something cool together.

## 🚀 Quick Start

1. **Fork** the repository and clone your fork
2. **Install** dependencies: `npm install`
3. **Create a branch**: `git checkout -b feat/your-feature`
4. **Make your changes** and test locally
5. **Commit** with a clear message (see conventions below)
6. **Push** and open a **Pull Request**

## 🏗️ Development Setup

```bash
# Install dependencies
npm install

# Copy environment files
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env

# Start dev servers
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:3001`.

## 📁 Project Structure

| Directory | Description |
|---|---|
| `apps/server/` | Express + Socket.IO backend |
| `apps/web/` | React + Vite frontend |
| `packages/shared-types/` | Shared TypeScript interfaces |

## 📝 Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add poll widget to room objects
fix: prevent cursor jitter on rapid movement
docs: update environment variable table
refactor: extract timer logic into dedicated widget
chore: update dependencies
```

## 🔀 Pull Request Guidelines

- **One feature per PR** — keep changes focused and reviewable
- **Update types** — if you change data shapes, update `packages/shared-types`
- **No `as any`** — use proper TypeScript types (see `apps/server/src/types/database.ts`)
- **Test locally** — ensure both `dev:web` and `dev:server` work before submitting

## 🐛 Reporting Bugs

Use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) issue template and include:

- Steps to reproduce
- Expected vs. actual behavior
- Browser/Node version
- Screenshots if applicable

## 💡 Feature Requests

Use the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) issue template and describe:

- The problem you're solving
- Your proposed solution
- Any alternatives you've considered

## 📐 Code Style

- **TypeScript** strict mode — no implicit `any`
- **Meaningful names** — prefer `userAvatarRow` over `row`
- **Small functions** — extract complex logic into well-named helpers
- **Comments** — explain *why*, not *what*

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
