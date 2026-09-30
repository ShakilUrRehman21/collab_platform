const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3456;
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to load or initialize persistent JSON files
function loadJsonFile(filename, defaultData) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.error(`[Server] Error reading ${filename}, initializing default:`, e.message);
  }
  fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
  return defaultData;
}

function saveJsonFile(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error(`[Server] Error writing ${filename}:`, e.message);
  }
}

// Initial Data Sets
const INITIAL_PACKAGES = [
  {
    id: "pkg-crdt-canvas",
    name: "@syncworld/crdt-canvas",
    title: "Real-Time CRDT Blackboard Engine",
    category: "collaboration",
    version: "2.4.1",
    author: "SyncWorld Labs",
    description: "Zero-latency delta replication engine for multi-tenant collaborative whiteboards and canvas sync.",
    price: 0,
    priceLabel: "Free",
    downloads: "18.4k",
    rating: 4.94,
    tags: ["CRDT", "WebSockets", "Canvas", "TypeScript"],
    installed: true,
    publishedAt: "2026-09-28T10:00:00Z"
  },
  {
    id: "pkg-monaco-collab",
    name: "@syncworld/monaco-collab",
    title: "Distributed Multi-Cursor Sync Protocol",
    category: "collaboration",
    version: "3.1.0",
    author: "Vance Systems",
    description: "Seamless multi-caret presence, remote selection indicators, and optimistic diff reconciliation.",
    price: 49,
    priceLabel: "$49 / org",
    downloads: "12.8k",
    rating: 4.91,
    tags: ["Monaco", "Multi-Cursor", "Presence"],
    installed: false,
    publishedAt: "2026-09-29T14:30:00Z"
  },
  {
    id: "pkg-kanban-streamer",
    name: "@syncworld/kanban-streamer",
    title: "High-Velocity Sprint Task Streamer",
    category: "workflow",
    version: "1.8.4",
    author: "SyncWorld Core",
    description: "Reactive Kanban state engine with WebSocket delta streams and Linear-compatible webhooks.",
    price: 0,
    priceLabel: "Free",
    downloads: "24.1k",
    rating: 4.96,
    tags: ["Kanban", "Sprint", "Workflow"],
    installed: true,
    publishedAt: "2026-09-27T08:15:00Z"
  },
  {
    id: "pkg-auth-rbac",
    name: "@syncworld/auth-rbac",
    title: "Enterprise SSO & Role-Based Access Gate",
    category: "security",
    version: "2.0.2",
    author: "CyberSphere",
    description: "SAML 2.0, OpenID Connect, and fine-grained resource permission matrix with audit logging.",
    price: 129,
    priceLabel: "$129 / perpetual",
    downloads: "6.2k",
    rating: 4.88,
    tags: ["SAML", "SSO", "RBAC", "Security"],
    installed: false,
    publishedAt: "2026-09-25T12:00:00Z"
  },
  {
    id: "pkg-canary-deployer",
    name: "@syncworld/canary-deployer",
    title: "Zero-Downtime Blue/Green Deploy Controller",
    category: "devops",
    version: "1.5.0",
    author: "CloudScale Eng",
    description: "Kubernetes and serverless canary rollout pipeline that tracks Prometheus latency metrics.",
    price: 89,
    priceLabel: "$89 / seat",
    downloads: "8.9k",
    rating: 4.85,
    tags: ["DevOps", "Canary", "Kubernetes"],
    installed: false,
    publishedAt: "2026-09-26T16:45:00Z"
  },
  {
    id: "pkg-bright-tokens",
    name: "@syncworld/bright-tokens",
    title: "Accessible Radiant Light Design Tokens",
    category: "ui-kits",
    version: "1.2.0",
    author: "Design Systems Guild",
    description: "High-density bright design tokens. WCAG AAA compliance, clean micro-interactions, zero emojis.",
    price: 29,
    priceLabel: "$29",
    downloads: "14.2k",
    rating: 4.92,
    tags: ["Design System", "CSS", "Accessible"],
    installed: true,
    publishedAt: "2026-09-24T09:20:00Z"
  }
];

const INITIAL_FILES = [
  {
    name: "sync-engine.ts",
    language: "typescript",
    content: `// SyncWorld Core Real-Time Delta Engine
export class DistributedSyncEngine {
  private peers: Map<string, number> = new Map();

  constructor(private readonly roomId: string) {
    console.info(\`[SyncWorld] Room initialized: \${this.roomId}\`);
  }

  public registerPeer(peerId: string): void {
    this.peers.set(peerId, Date.now());
    console.log(\`[SyncEngine] Peer connected: \${peerId} | Active peers: \${this.peers.size}\`);
  }

  public getTelemetry(): { activePeers: number; latencyMs: number } {
    return { activePeers: this.peers.size, latencyMs: 11.4 };
  }
}

const engine = new DistributedSyncEngine("workspace-alpha");
engine.registerPeer("node-local-01");
`
  },
  {
    name: "pipeline-worker.js",
    language: "javascript",
    content: `// Background Task Event Loop
class EventPipelineWorker {
  constructor() {
    this.queue = [];
  }
  enqueue(event) {
    this.queue.push({ event, timestamp: Date.now() });
    console.log('Enqueued event. Queue depth: ' + this.queue.length);
  }
}
const worker = new EventPipelineWorker();
worker.enqueue({ type: 'SYNCWORLD_CORE_INIT' });
`
  }
];

const INITIAL_ACTIVITIES = [
  {
    id: "act-1",
    user: "Marcus Vance",
    role: "Staff Engineer",
    action: "SYSTEM_INITIALIZED",
    details: "Initialized SyncWorld cluster and verified WebSocket mesh",
    timestamp: new Date().toISOString()
  }
];

const INITIAL_TASKS = [
  { id: "SW-201", title: "Refactor CRDT state vector garbage collection", desc: "Prune tombstones after all client peers acknowledge vector clock snapshot.", column: "backlog", priority: "high", assignee: "Marcus Vance" },
  { id: "SW-202", title: "Implement WebRTC DataChannel signaling mesh", desc: "Establish direct P2P mesh for peer clients to reduce relay latency to <5ms.", column: "inprogress", priority: "critical", assignee: "Elena Rostova" },
  { id: "SW-203", title: "Construct Marketplace manifest validator", desc: "Verify semantic versioning and package integrity signatures on publication.", column: "review", priority: "medium", assignee: "Alex Rivera" },
  { id: "SW-204", title: "Integrate WCAG AAA bright tokens into UI kit", desc: "Standardize button focus rings and table border contrasts across all viewports.", column: "done", priority: "low", assignee: "Sarah Lin" }
];

function detectLanguage(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  switch (ext) {
    case '.java': return 'java';
    case '.py': return 'python';
    case '.cpp':
    case '.c':
    case '.cc':
    case '.h':
    case '.hpp': return 'cpp';
    case '.ts': return 'typescript';
    case '.js':
    case '.mjs':
    case '.cjs': return 'javascript';
    case '.json': return 'json';
    case '.css': return 'css';
    case '.html':
    case '.htm': return 'html';
    case '.md': return 'markdown';
    case '.rs': return 'rust';
    case '.go': return 'go';
    case '.sql': return 'sql';
    default: return 'javascript';
  }
}

function getDefaultFileContent(filename, lang) {
  const baseName = path.basename(filename, path.extname(filename));
  switch (lang) {
    case 'java': {
      const className = baseName.replace(/[^a-zA-Z0-9_]/g, '') || 'Main';
      return `// ${filename}\npublic class ${className} {\n  public static void main(String[] args) {\n    System.out.println("Hello from ${filename}!");\n  }\n}\n`;
    }
    case 'python':
      return `# ${filename}\nprint("Hello from ${filename}!")\n`;
    case 'cpp':
      return `// ${filename}\n#include <iostream>\n\nint main() {\n  std::cout << "Hello from ${filename}!" << std::endl;\n  return 0;\n}\n`;
    case 'rust':
      return `// ${filename}\nfn main() {\n  println!("Hello from ${filename}!");\n}\n`;
    case 'go':
      return `package main\n\nimport "fmt"\n\nfunc main() {\n  fmt.Println("Hello from ${filename}!")\n}\n`;
    case 'typescript':
      return `// ${filename}\nconst greeting: string = "Hello from ${filename}!";\nconsole.log(greeting);\n`;
    case 'json':
      return `{\n  "name": "${filename}",\n  "status": "ready",\n  "synced": true\n}\n`;
    case 'html':
      return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>${filename}</title>\n</head>\n<body>\n  <h1>Hello from ${filename}</h1>\n</body>\n</html>\n`;
    case 'css':
      return `/* ${filename} */\nbody {\n  margin: 0;\n  font-family: sans-serif;\n}\n`;
    case 'sql':
      return `-- ${filename}\nSELECT 'Hello from ${filename}' AS message;\n`;
    case 'markdown':
      return `# ${filename}\n\nDocumentation for ${filename}.\n`;
    case 'javascript':
    default:
      return `// ${filename}\nconsole.log("Hello from ${filename}!");\n`;
  }
}

// Persistent Stores
let marketplaceData = loadJsonFile('marketplace.json', INITIAL_PACKAGES);
let filesData = loadJsonFile('files.json', INITIAL_FILES);
filesData.forEach(f => {
  if (f.name) f.language = detectLanguage(f.name);
});
saveJsonFile('files.json', filesData);
let whiteboardData = loadJsonFile('whiteboard.json', []);
let activityData = loadJsonFile('activity.json', INITIAL_ACTIVITIES);
let tasksData = loadJsonFile('tasks.json', INITIAL_TASKS);

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

// Helper to log and persist activity
function logActivity(user, role, action, details) {
  const item = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user: user || 'Anonymous Engineer',
    role: role || 'Contributor',
    action: action,
    details: details,
    timestamp: new Date().toISOString()
  };
  activityData.unshift(item);
  if (activityData.length > 300) activityData.pop();
  saveJsonFile('activity.json', activityData);
  broadcast({ type: 'ACTIVITY_LOGGED', activity: item });
  return item;
}

// HTTP Request Body Reader
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // ----------------------------------------------------
  // REST API Endpoints
  // ----------------------------------------------------

  // 1. Status API
  if (pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'operational',
      uptimeSec: Math.floor(process.uptime()),
      connectedPeers: wss ? wss.clients.size : 0,
      totalExtensions: marketplaceData.length,
      totalFiles: filesData.length,
      whiteboardStrokes: whiteboardData.length
    }));
    return;
  }

  // 2. Marketplace API: List & Publish
  if (pathname === '/api/marketplace') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ packages: marketplaceData }));
      return;
    }

    if (req.method === 'POST') {
      try {
        const body = await readBody(req);
        if (!body.title || !body.name) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Title and package name required' }));
          return;
        }

        const newPkg = {
          id: `pkg-${Date.now()}`,
          name: body.name.startsWith('@') ? body.name : `@community/${body.name}`,
          title: body.title,
          category: body.category || 'collaboration',
          version: body.version || '1.0.0',
          author: body.author || 'Senior Contributor',
          description: body.description || 'Community marketplace module.',
          price: parseFloat(body.price) || 0,
          priceLabel: parseFloat(body.price) > 0 ? `$${parseFloat(body.price)}` : 'Free',
          downloads: '1',
          rating: 5.0,
          tags: Array.isArray(body.tags) ? body.tags : ['Community', 'Extension'],
          installed: true,
          publishedAt: new Date().toISOString()
        };

        marketplaceData.unshift(newPkg);
        saveJsonFile('marketplace.json', marketplaceData);

        // Record audit
        logActivity(
          body.author || 'Marcus Vance',
          body.role || 'Staff Engineer',
          'PUBLISHED_EXTENSION',
          `Published extension "${newPkg.name}" (${newPkg.title}) to Marketplace`
        );

        // Broadcast to all connected WebSockets!
        broadcast({
          type: 'EXTENSION_PUBLISHED',
          package: newPkg
        });

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, package: newPkg }));
        return;
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
        return;
      }
    }
  }

  // 3. Codeboard Files API: List, Create, Update, Delete
  if (pathname === '/api/files') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ files: filesData }));
      return;
    }

    if (req.method === 'POST') {
      try {
        const body = await readBody(req);
        let filename = (body.name || '').trim();
        if (!filename) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Filename is required' }));
          return;
        }

        const lang = detectLanguage(filename);
        const existingIdx = filesData.findIndex(f => f.name.toLowerCase() === filename.toLowerCase());
        const newFile = {
          name: filename,
          language: lang,
          content: body.content !== undefined ? body.content : getDefaultFileContent(filename, lang)
        };

        if (existingIdx >= 0) {
          filesData[existingIdx] = newFile;
        } else {
          filesData.push(newFile);
        }

        saveJsonFile('files.json', filesData);

        logActivity(
          body.author || 'Marcus Vance',
          body.role || 'Staff Engineer',
          'CREATED_FILE',
          `Created workspace file "${filename}"`
        );

        broadcast({
          type: 'FILE_CREATED',
          file: newFile
        });

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, file: newFile }));
        return;
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
        return;
      }
    }
  }

  // Handle file update or delete via /api/files/:filename
  if (pathname.startsWith('/api/files/')) {
    const filename = decodeURIComponent(pathname.replace('/api/files/', ''));

    if (req.method === 'PUT') {
      try {
        const body = await readBody(req);
        const idx = filesData.findIndex(f => f.name === filename);
        if (idx >= 0) {
          filesData[idx].content = body.content || '';
          saveJsonFile('files.json', filesData);

          broadcast({
            type: 'CODE_CHANGE',
            fileName: filename,
            content: body.content,
            author: body.author || 'Remote Peer'
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, file: filesData[idx] }));
          return;
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'File not found' }));
          return;
        }
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
        return;
      }
    }

    if (req.method === 'DELETE') {
      const idx = filesData.findIndex(f => f.name === filename);
      if (idx >= 0) {
        filesData.splice(idx, 1);
        saveJsonFile('files.json', filesData);

        logActivity(
          req.headers['x-user-name'] || 'Marcus Vance',
          req.headers['x-user-role'] || 'Staff Engineer',
          'DELETED_FILE',
          `Deleted workspace file "${filename}"`
        );

        broadcast({
          type: 'FILE_DELETED',
          fileName: filename
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'File not found' }));
        return;
      }
    }
  }

  // 4. Activity Audit Trail API
  if (pathname === '/api/activity') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ activities: activityData }));
      return;
    }

    if (req.method === 'POST') {
      try {
        const body = await readBody(req);
        const item = logActivity(body.user, body.role, body.action, body.details);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, activity: item }));
        return;
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
        return;
      }
    }
  }

  // 5. Whiteboard State API
  if (pathname === '/api/whiteboard') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ elements: whiteboardData }));
      return;
    }
  }

  // 6. Sprint Tasks API
  if (pathname === '/api/tasks') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ tasks: tasksData }));
      return;
    }
  }

  // ----------------------------------------------------
  // Static File Serving
  // ----------------------------------------------------
  let filePath = pathname;
  if (filePath === '/' || filePath === '') filePath = '/index.html';

  const fullPath = path.join(__dirname, filePath);

  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    fs.createReadStream(fullPath).pipe(res);
  });
});

// ----------------------------------------------------
// WebSocket Real-Time Synchronization Engine
// ----------------------------------------------------
const wss = new WebSocket.Server({ server });

function broadcast(msgObj, excludeWs = null) {
  const payload = JSON.stringify(msgObj);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN && client !== excludeWs) {
      client.send(payload);
    }
  }
}

const PEER_COLORS = ['#4f46e5', '#0284c7', '#059669', '#d97706', '#e11d48', '#8b5cf6'];
let nextPeerNum = 1;

wss.on('connection', (ws) => {
  const peerNum = nextPeerNum++;
  ws.peerId = `Peer #${peerNum}`;
  ws.peerColor = PEER_COLORS[(peerNum - 1) % PEER_COLORS.length];
  ws.userName = ws.peerId;
  ws.userRole = 'Contributor';

  console.log(`[WebSocket] Connected: ${ws.peerId} (${ws.peerColor}). Total peers: ${wss.clients.size}`);

  // Send handshake with persisted whiteboard, files, and marketplace snapshot
  ws.send(JSON.stringify({
    type: 'HANDSHAKE',
    peerId: ws.peerId,
    peerColor: ws.peerColor,
    totalPeers: wss.clients.size,
    whiteboardSnapshot: whiteboardData,
    filesSnapshot: filesData,
    marketplaceSnapshot: marketplaceData,
    activitySnapshot: activityData.slice(0, 50)
  }));

  broadcast({
    type: 'PEER_COUNT_UPDATE',
    totalPeers: wss.clients.size,
    message: `${ws.peerId} connected to workspace`
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        // User profile identification
        case 'IDENTIFY_USER':
          ws.userName = msg.name || ws.peerId;
          ws.userRole = msg.role || 'Contributor';
          if (msg.color) ws.peerColor = msg.color;
          logActivity(ws.userName, ws.userRole, 'USER_JOINED', `${ws.userName} joined the collaborative workspace`);
          break;

        // Whiteboard live stroke stream
        case 'DRAW_STROKE_LIVE':
          broadcast({
            type: 'DRAW_STROKE_LIVE',
            peerId: ws.userName || ws.peerId,
            peerColor: ws.peerColor,
            stroke: msg.stroke
          }, ws);
          break;

        // Whiteboard commit stroke
        case 'DRAW_COMMIT':
          if (msg.element) {
            whiteboardData.push(msg.element);
            if (whiteboardData.length > 2500) whiteboardData.shift();
            saveJsonFile('whiteboard.json', whiteboardData);

            broadcast({
              type: 'DRAW_COMMIT',
              peerId: ws.userName || ws.peerId,
              element: msg.element
            }, ws);
          }
          break;

        // Clear whiteboard across tabs
        case 'CLEAR_CANVAS':
          whiteboardData = [];
          saveJsonFile('whiteboard.json', whiteboardData);
          logActivity(ws.userName, ws.userRole, 'CLEARED_WHITEBOARD', `${ws.userName} cleared the whiteboard`);
          broadcast({
            type: 'CANVAS_CLEARED',
            peerId: ws.userName || ws.peerId
          });
          break;

        // Undo whiteboard stroke
        case 'UNDO_CANVAS':
          if (whiteboardData.length > 0) {
            whiteboardData.pop();
            saveJsonFile('whiteboard.json', whiteboardData);
            broadcast({
              type: 'CANVAS_RESTORED',
              whiteboardSnapshot: whiteboardData,
              peerId: ws.userName || ws.peerId
            });
          }
          break;

        // Cursor movement tracking
        case 'CURSOR_MOVE':
          broadcast({
            type: 'REMOTE_CURSOR',
            peerId: ws.userName || ws.peerId,
            peerColor: ws.peerColor,
            x: msg.x,
            y: msg.y
          }, ws);
          break;

        // Real-time code editing
        case 'CODE_CHANGE':
          const file = filesData.find(f => f.name === msg.fileName);
          if (file) {
            file.content = msg.content;
            saveJsonFile('files.json', filesData);
          }
          broadcast({
            type: 'CODE_CHANGE',
            fileName: msg.fileName,
            content: msg.content,
            author: ws.userName || ws.peerId
          }, ws);
          break;

        // Task column moves
        case 'TASK_MOVED':
          const targetTask = tasksData.find(t => t.id === msg.taskId);
          if (targetTask) {
            targetTask.column = msg.newColumn;
            saveJsonFile('tasks.json', tasksData);
          }
          logActivity(ws.userName, ws.userRole, 'MOVED_TASK', `${ws.userName} moved ${msg.taskId} to ${msg.newColumn.toUpperCase()}`);
          broadcast({
            type: 'TASK_MOVED',
            taskId: msg.taskId,
            newColumn: msg.newColumn,
            author: ws.userName || ws.peerId
          }, ws);
          break;

        default:
          break;
      }
    } catch (e) {
      console.error('[WebSocket] Error handling message:', e);
    }
  });

  ws.on('close', () => {
    broadcast({
      type: 'PEER_COUNT_UPDATE',
      totalPeers: wss.clients.size,
      message: `${ws.userName || ws.peerId} left the workspace`
    });
    broadcast({
      type: 'REMOTE_CURSOR_REMOVE',
      peerId: ws.userName || ws.peerId
    });
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`SyncWorld Backend running with Real-time APIs and WebSockets`);
  console.log(`App URL: http://localhost:${PORT}/index.html`);
  console.log(`Data stored at: ${DATA_DIR}`);
  console.log(`====================================================`);
});
