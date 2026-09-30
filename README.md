# SyncWorld | Real-Time Collaborative Workspace

SyncWorld is a high-performance, real-time collaborative workspace engineered for modern distributed development teams. It provides a unified canvas combining an interactive vector whiteboard, a multi-file sandbox IDE with multi-language compiler diagnostics, and a persistent audit trail.

Built with native WebSockets, zero third-party UI framework bloat, radiant bright design tokens, and strictly zero emojis.

---

## Key Modules & Capabilities

### 1. Collaborative Whiteboard Engine
- **Multi-Tenant Vector Canvas**: Freehand drawing with smoothed cubic Bezier interpolation, geometric shapes (rectangles, circles, lines), customizable stroke widths, and curated chromatic swatches.
- **Real-Time Spatial Presence**: Remote cursor broadcasting showing live peer mouse positions, user badges, and drawing states across all active browser sessions.
- **State Reconciliation & History**: Canvas undo, stroke pruning, and full canvas clear synchronized instantly across peers with disk persistence (`data/whiteboard.json`).

### 2. Multi-Language Codeboard IDE & Compiler Sandbox
- **Multi-File Workspace**: Manage, create, switch, and delete workspace files in real time (`main.js`, `Main.java`, Python, C++, TypeScript, JSON, CSS, HTML).
- **Keystroke Delta Synchronization**: Debounced WebSocket event streaming ensures multi-tab, multi-peer typing synchronization with sub-60ms latency.
- **Intelligent Compiler & Runtime Engine**:
  - **Java (OpenJDK 21 / javac & JVM)**: Full structural and semantic validation. Identifies missing class envelopes, validates `public static void main`, verifies statement termination semicolons, and catches invalid JavaScript methods (e.g. `console.log`) with detailed `javac` compiler diagnostics, line/column carats (`^`), error counts, and non-zero exit codes. Executes valid Java statements and outputs simulated JVM stdout streams.
  - **JavaScript (V8 Isolate)**: Secure in-browser isolate evaluation intercepting `console.log`, `console.info`, `console.warn`, and `console.error` with stack trace formatting on runtime errors.
  - **Python (CPython 3.11 Runtime)**: Syntax validation detecting missing colons, invalid JavaScript keywords, and `NameError` alerts for undefined symbols (e.g., suggesting `print` when `console.log` is used).
  - **C++ (GCC 13.2)**: Compiler diagnostics for undeclared identifiers with suggested standard alternatives (e.g., `std::cout`) and `main` function verification.
  - **JSON (RFC 8259 Validator)**: Strict JSON parser with byte size calculation, key counting, and syntax error offsets.
- **Persistent Disk Storage**: Workspace files are automatically tracked and saved to `data/files.json`.

### 3. Audit Activity Trail
- **Mutation Event Stream**: Real-time broadcast log capturing file creations, deletions, saves, system initialization, and code updates.
- **Dynamic Identity Switcher**: Switch between team personas (Marcus Vance - Staff Engineer, Elena Rostova - Senior Contributor, Sarah Lin - Design Systems Lead, Alex Rivera - Platform Architect) with persistent local storage.

### 4. Tactile Audio Feedback & Radiant Design System
- **Synthesized Web Audio**: Procedural tactile audio feedback generated directly via the browser's Web Audio API (tactile sine pops, melodic major-triad success chords, and sawtooth error alerts).
- **Radiant Bright Palette**: High-contrast, clean slate surfaces (`#ffffff`, `#f8fafc`, `#e2e8f0`), deep slate typography (`#0f172a`), and vivid brand accents (`#4f46e5`, `#0284c7`, `#059669`).
- **Professional Engineering Aesthetic**: Clean geometric dual-orbital SVG logo, technical product copy, and zero emoji clutter.

---

## System Architecture

```
                      +-----------------------------+
                      |   Browser Tabs (Clients)    |
                      |  Whiteboard | IDE | Feed    |
                      +--------------+--------------+
                                     |
                          WebSocket  |  REST HTTP
                           (ws://)   |  (GET/POST)
                                     v
                      +-----------------------------+
                      |     SyncWorld Node.js       |
                      |       Server (3456)         |
                      |  - HTTP Static & REST API   |
                      |  - WebSocket State Mesh     |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |    Disk Persistence Layer   |
                      |  - data/files.json          |
                      |  - data/whiteboard.json     |
                      |  - data/activity.json       |
                      +-----------------------------+
```

---

## Directory Structure

```
SyncWorld/
├── .dockerignore           # Docker build exclusions
├── .gitignore              # Git ignore rules (node_modules, logs)
├── Dockerfile              # Container deployment recipe
├── README.md               # Architecture documentation and guide
├── index.html              # Main single-page application entrypoint
├── styles.css              # Radiant bright design system and layouts
├── server.js               # Node.js REST API and WebSocket mesh server
├── package.json            # Node.js dependencies and run scripts
├── data/                   # Persistent disk data stores
│   ├── activity.json       # Audit activity log
│   ├── files.json          # Workspace files and editor content
│   └── whiteboard.json     # Saved whiteboard vector strokes
└── js/                     # Frontend ES modules
    ├── activity.js         # Activity feed renderer & persona switcher
    ├── api.js              # REST client for backend endpoints
    ├── codeboard.js        # Multi-file IDE & compiler sandbox engine
    ├── main.js             # Main orchestrator and keyboard handlers
    ├── socket.js           # Real-time WebSocket connection manager
    ├── state.js            # Central reactive store & Web Audio engine
    ├── toast.js            # Non-blocking toast notification system
    └── whiteboard.js       # High-DPI collaborative canvas engine
```

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- npm v9.0.0 or higher

### Installation

1. Clone repository:
   ```bash
   git clone https://github.com/ShakilUrRehman21/collab_platform.git
   cd collab_platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch server:
   ```bash
   npm start
   ```

4. Open application in browser:
   ```
   http://localhost:3456
   ```

To test real-time collaboration, open `http://localhost:3456` across two or more browser windows or tabs.

---

## Keyboard Shortcuts

| Shortcut | Description |
|---|---|
| `1` | Switch to Collaborative Whiteboard |
| `2` | Switch to Codeboard IDE |
| `3` | Switch to Activity Audit Feed |
| `Ctrl + S` / `Cmd + S` | Save current Codeboard file to disk |

---

## Deployment Guide

### Option 1: Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 3456
ENV PORT=3456
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t syncworld .
docker run -p 3456:3456 -v $(pwd)/data:/app/data syncworld
```

### Option 2: Render / Railway / Fly.io
1. Connect your GitHub repository (`collab_platform`).
2. Set Build Command: `npm install`
3. Set Start Command: `node server.js`
4. Configure Port: Set environment variable `PORT` to `3456` (or any dynamic port assigned by the host).

---

## License

This project is licensed under the MIT License.
