# Skribbl.io Full-Stack Multiplayer Clone

A high-fidelity recreation of the classic multiplayer drawing and guessing browser game [skribbl.io](https://skribbl.io/), built from scratch with modern web technologies: React, TypeScript, Vite, Tailwind CSS, HTML5 Canvas, Node.js, Express, and Socket.IO.

---

## 🎨 Visual Identity & Reverse Engineering Highlights

This application was engineered by reverse-engineering the DOM structure, CSS variables, and layout mechanics directly from the original skribbl.io:

- **Exact Color Palette**: Authentic 26-color dual-row palette matching Skribbl's native color array.
- **Classic Sizing & Grid**: Built on Skribbl's `--UNIT: 48px`, `--BORDER_GAP: 6px`, `--BORDER_RADIUS: 3px` rhythm and desktop grid layout (`#game-wrapper`).
- **Playful Character Avatars**: Layered SVG avatars with customizable colors, eyes, mouths, and an animated golden host crown.
- **True Skribbl Visual Elements**:
  - Top Game Bar with circular countdown clock and word blanks (`_ _ _ _ _`).
  - Left Player List with ranking numbers (`#1`, `#2`), score tally, animated pen indicator, green turn-guess backgrounds, and speech bubble popups.
  - White 800×600 Canvas with 4 interactive overlays (Lobby Settings, Word Choice, Turn Reveal, and 3-Tier Podium Ceremony with confetti).
  - Bottom Toolbar with dual color preview, 5 brush sizes (`[4, 10, 20, 32, 40]`), brush, eraser, bucket flood fill, undo, and clear.
  - Right Guessing Chat with color-coded system announcements and hidden chat for players who have already guessed.
- **Pure Web Audio Synthesizer**: 100% reliable sound effects generated on-the-fly (correct chime, clock ticks, fanfare) with zero external audio assets required.

---

## 🚀 Quick Start Instructions

### Prerequisites
- Node.js (v18+)
- npm

### 1. Installation
From the project root:
```bash
cd "C:\Users\girik\.gemini\antigravity\scratch\skribbl-clone"
npm install
npm install --prefix client
```

### 2. Run in Development Mode
Run both the Socket.IO backend and the Vite frontend simultaneously:
```bash
npm run dev
```
- Frontend UI: `http://localhost:5173`
- Backend API / WebSocket: `http://localhost:3001`

### 3. Run in Production Mode
Build the client and serve everything from the Express backend:
```bash
npm run build:client
npm start
```
- Open `http://localhost:3001` in your browser.

---

## 🧪 Automated Testing
Run the included end-to-end multi-client simulation test to verify room creation, socket synchronization, drawing strokes, bucket fill, close guesses, and scoring:
```bash
node server/test-multiplayer.js
```

---

## 🏗️ Architecture

```
skribbl-clone/
├── client/                     # Frontend (React 18, Vite, TypeScript, Tailwind)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Avatar.tsx          # Multi-part SVG avatar renderer
│   │   │   ├── Canvas.tsx          # 800x600 drawing engine + 4 game overlays
│   │   │   ├── ChatPanel.tsx       # Real-time guessing chat & secret guesser chat
│   │   │   ├── DrawingToolbar.tsx  # 26-color palette, 5 brush sizes, tools, hotkeys
│   │   │   ├── GameBar.tsx         # Timer, round info, word blanks / drawer prompt
│   │   │   ├── MainMenu.tsx        # Authentic landing screen & avatar customizer
│   │   │   ├── PlayerList.tsx      # Scores, ranks, speech bubbles, drawing icons
│   │   │   └── SkribblLogo.tsx     # Bubbly 3D cartoon game logo
│   │   ├── constants.ts        # Palette hex codes, brush sizes, avatar options
│   │   ├── sounds.ts           # Web Audio API sound generator
│   │   ├── types.ts            # Shared TypeScript interfaces
│   │   ├── App.tsx             # Master orchestrator & Socket.IO client
│   │   └── index.css           # Authentic Skribbl CSS variables & theme
│   ├── index.html
│   └── vite.config.ts
├── server/                     # Backend (Node.js, Express, Socket.IO)
│   ├── gameManager.js          # Room state machine, hint generator, scoring logic
│   ├── words.js                # 500+ curated pictionary words & Levenshtein distance
│   ├── test-multiplayer.js     # Automated multi-client test suite
│   └── index.js                # Express & Socket.IO server entrypoint
└── package.json
```

---

## ⌨️ Keyboard Shortcuts
- `B`: Brush tool
- `F`: Bucket fill
- `E`: Eraser
- `U` or `Ctrl+Z`: Undo stroke
- `C`: Clear canvas
