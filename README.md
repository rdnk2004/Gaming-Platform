# 🕹️ CYBERARCADE

> **Retro Reimagined.** A high-performance, retro-futuristic arcade platform built with React 19, TypeScript, Vite, FastAPI, PostgreSQL, and native Web Audio synthesis.

---

## 🌟 Overview

**CyberArcade** brings classic retro games to life with modern cyberpunk visuals, vector-based movement, particle physics, synthesized audio effects, global hall-of-fame leaderboards, and leveling systems.

### 🎮 Featured Arenas

- **🐍 Hyper Snake**: Vector-based snake movement, food orbs, big pop bubbles, speed/ghost powerups, and achievement unlocks. Supports 1-Player and 2-Player co-op/versus modes.
- **🧱 Cyber Tetris**: Classic (10x20) and Ultra (12x24) modes featuring SRS wall kicks, combo multipliers, screen shake, glitch effects, hard drop impact, and hold piece functionality.
- **🏓 Cyber Pong**: High-speed neon paddle battles against an adaptive CPU AI engine or 2-Player local multiplayer.

---

## ✨ Features

- 🎨 **Cyberpunk Visual Design**: Neon glow, particle physics, glassmorphism UI, interactive canvas mesh backdrop, and smooth framer-motion animations.
- 🔊 **Native Web Audio FX**: Built-in sound synthesizer generated entirely with browser Web Audio API oscillators (no external MP3/WAV files required).
- 🏆 **Global Hall of Fame**: Real-time leaderboard tracking top scores, player ranks, and level progressions per game with live search filtering.
- ⚡ **User XP & Leveling System**: Earn XP for high scores, level up your arena profile, and track progress on the user HUD.
- 📱 **Responsive Layout**: Full mobile support with collapsible navigation menu and touch-friendly controls.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite 6
- **Language**: TypeScript 5.6
- **State Management**: Zustand 5
- **Animations**: Framer Motion 11
- **Styling**: Vanilla CSS (Custom Design System with HSL tokens & Glassmorphism)
- **Audio**: Web Audio API

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL (SQLAlchemy 2.0 Async + AsyncPG)
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing
- **Settings**: Pydantic Settings

---

## 📁 Project Structure

```text
CyberArcade/
├── backend/
│   ├── app/
│   │   ├── models/        # SQLAlchemy Database Models (User, Game, Score)
│   │   ├── routers/       # FastAPI Routers (auth, games, leaderboard)
│   │   ├── config.py      # Environment & JWT Configuration
│   │   ├── database.py    # Async SQLAlchemy Engine & Seeding
│   │   └── main.py        # FastAPI Application Entrypoint
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # Layout & Navigation Bar
│   │   ├── games/         # Snake, Tetris, Pong Engines
│   │   ├── pages/         # Home, Leaderboard, Login, Register
│   │   ├── services/      # Web Audio FX Synthesizer
│   │   ├── store/         # Zustand Auth & Persistent Storage
│   │   └── styles/        # Global Design Tokens & Index CSS
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+) & **npm**
- **Python** (v3.11+)
- **PostgreSQL** (v14+) *(optional; backend can run with default connection settings)*

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI backend server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Swagger API docs are available at `http://localhost:8000/docs`.

---

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## ⌨️ Arcade Key Bindings

### General Controls
- **Toggle Audio**: Click the `🔊 Sound ON / 🔇 Mute` button in the navbar.
- **Pause Game**: Press `P` or `ESC`.

### Snake
- **Player 1**: `Arrow Keys` (Move) + `Shift` (Sprint)
- **Player 2**: `W` / `A` / `S` / `D` (Move) + `Space` (Sprint)

### Tetris
- **Move**: `←` / `→` (or `A` / `D`)
- **Soft Drop**: `↓` (or `S`)
- **Hard Drop**: `Space`
- **Rotate Clockwise**: `↑` (or `W` / `X`)
- **Rotate Counter-Clockwise**: `Z` / `Ctrl`
- **Hold Piece**: `C` / `Shift`

### Pong
- **Player 1**: `W` / `S` (or `Arrow Up` / `Arrow Down` in 1P mode)
- **Player 2**: `Arrow Up` / `Arrow Down`

---

## 📄 License

MIT License. Designed and engineered for CyberArcade.
