/**
 * SyncWorld Real-Time Collaborative Whiteboard Module
 */
import { State, sound } from './state.js';
import { Socket } from './socket.js';
import { showToast } from './toast.js';

let canvas, ctx;
let lastThrottle = 0;

export function initWhiteboard() {
  canvas = document.getElementById('whiteboard-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Drawing Events
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', drawMove);
  window.addEventListener('mouseup', stopDrawing);

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    startDrawing({ clientX: touch.clientX, clientY: touch.clientY });
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    drawMove({ clientX: touch.clientX, clientY: touch.clientY });
  }, { passive: false });

  window.addEventListener('touchend', stopDrawing);

  // Tool Selectors
  document.querySelectorAll('.wb-tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.wb-tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.wbTool = btn.dataset.tool;
      sound.playPop();
    });
  });

  // Color Pickers
  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      State.wbColor = dot.dataset.color;
      sound.playPop();
    });
  });

  // Stroke Size
  document.getElementById('wb-stroke-size')?.addEventListener('change', (e) => {
    State.wbSize = parseInt(e.target.value, 10) || 4;
    sound.playPop();
  });

  // Clear Canvas
  document.getElementById('btn-clear-canvas')?.addEventListener('click', () => {
    if (confirm('Clear collaborative whiteboard across all connected tabs?')) {
      State.wbElements = [];
      redrawCanvas();
      Socket.send({ type: 'CLEAR_CANVAS' });
      sound.playPop();
    }
  });

  // Undo Canvas
  document.getElementById('btn-undo-canvas')?.addEventListener('click', () => {
    if (State.wbElements.length > 0) {
      State.wbElements.pop();
      redrawCanvas();
      Socket.send({ type: 'UNDO_CANVAS' });
      sound.playPop();
    }
  });

  // Export Canvas
  document.getElementById('btn-export-canvas')?.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `syncworld-whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Exported whiteboard image (PNG).', 'success');
  });

  // Socket Event Subscriptions
  State.on('whiteboard:redraw', redrawCanvas);
  State.on('whiteboard:remote_stroke', drawRemoteStroke);
  State.on('whiteboard:remote_cursor', renderRemoteCursor);
  State.on('whiteboard:remote_cursor_remove', removeRemoteCursor);
}

export function resizeCanvas() {
  if (!canvas) return;
  const parent = canvas.parentElement;
  const width = parent.clientWidth;
  const height = parent.clientHeight;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.scale(dpr, dpr);
  redrawCanvas();
}

function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function startDrawing(e) {
  State.isDrawing = true;
  const coords = getCanvasCoords(e);

  State.currentStroke = {
    tool: State.wbTool,
    color: State.wbTool === 'eraser' ? '#fafbfe' : State.wbColor,
    size: State.wbTool === 'eraser' ? State.wbSize * 3 : State.wbSize,
    points: [coords]
  };
}

function drawMove(e) {
  const coords = getCanvasCoords(e);

  const now = performance.now();
  if (now - lastThrottle > 35) {
    lastThrottle = now;
    Socket.send({
      type: 'CURSOR_MOVE',
      x: coords.x,
      y: coords.y
    });
  }

  if (!State.isDrawing || !State.currentStroke) return;
  State.currentStroke.points.push(coords);

  if (State.currentStroke.tool === 'pen' || State.currentStroke.tool === 'eraser') {
    const pts = State.currentStroke.points;
    if (pts.length > 1) {
      drawSegment(pts[pts.length - 2], pts[pts.length - 1], State.currentStroke.color, State.currentStroke.size);
    }
    Socket.send({
      type: 'DRAW_STROKE_LIVE',
      stroke: {
        color: State.currentStroke.color,
        size: State.currentStroke.size,
        from: pts[pts.length - 2],
        to: pts[pts.length - 1]
      }
    });
  } else {
    redrawCanvas();
    drawShape(State.currentStroke);
  }
}

function stopDrawing() {
  if (!State.isDrawing || !State.currentStroke) return;
  State.isDrawing = false;

  State.wbElements.push(State.currentStroke);
  redrawCanvas();

  Socket.send({
    type: 'DRAW_COMMIT',
    element: State.currentStroke
  });

  State.currentStroke = null;
}

function drawSegment(p1, p2, color, size) {
  if (!ctx || !p1 || !p2) return;
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
}

function drawRemoteStroke(stroke) {
  if (!stroke || !stroke.from || !stroke.to) return;
  drawSegment(stroke.from, stroke.to, stroke.color, stroke.size);
}

function drawShape(element) {
  if (!ctx || !element.points || element.points.length < 2) return;
  const start = element.points[0];
  const end = element.points[element.points.length - 1];

  ctx.beginPath();
  ctx.strokeStyle = element.color;
  ctx.lineWidth = element.size;
  ctx.lineCap = 'round';

  if (element.tool === 'rect') {
    ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
  } else if (element.tool === 'circle') {
    const radius = Math.hypot(end.x - start.x, end.y - start.y);
    ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  } else if (element.tool === 'line') {
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
}

export function redrawCanvas() {
  if (!ctx || !canvas) return;
  const parent = canvas.parentElement;
  ctx.clearRect(0, 0, parent.clientWidth, parent.clientHeight);

  for (const el of State.wbElements) {
    if (el.tool === 'pen' || el.tool === 'eraser') {
      const pts = el.points;
      if (!pts || pts.length === 0) continue;
      if (pts.length === 1) {
        ctx.fillStyle = el.color;
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, el.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        for (let i = 1; i < pts.length; i++) {
          drawSegment(pts[i - 1], pts[i], el.color, el.size);
        }
      }
    } else {
      drawShape(el);
    }
  }
}

function renderRemoteCursor(msg) {
  const container = document.getElementById('canvas-wrapper');
  if (!container) return;

  const id = `cursor-${msg.peerId.replace(/\s+/g, '-')}`;
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.className = 'remote-cursor';
    el.innerHTML = `
      <div class="remote-cursor-pointer" style="border-color: ${msg.peerColor};"></div>
      <div class="remote-cursor-label" style="background: ${msg.peerColor};">${msg.peerId}</div>
    `;
    container.appendChild(el);
  }
  el.style.left = `${msg.x}px`;
  el.style.top = `${msg.y}px`;
}

function removeRemoteCursor(peerId) {
  const el = document.getElementById(`cursor-${peerId.replace(/\s+/g, '-')}`);
  if (el) el.remove();
}
