/**
 * SyncWorld Real-Time WebSocket Synchronization Client
 */
import { State } from './state.js';
import { showToast } from './toast.js';

let ws = null;

export const Socket = {
  init() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket] Connection open.');
        this.send({
          type: 'IDENTIFY_USER',
          name: State.user.name,
          role: State.user.role,
          color: State.user.color
        });
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (e) {
          console.error('[WebSocket] Message error:', e);
        }
      };

      ws.onclose = () => {
        State.connectedPeers = 1;
        State.emit('peers:updated', { count: 1, text: 'Reconnecting...' });
        setTimeout(() => this.init(), 2000);
      };
    } catch (e) {
      setTimeout(() => this.init(), 3000);
    }
  },

  send(payload) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  },

  handleMessage(msg) {
    switch (msg.type) {
      case 'HANDSHAKE':
        State.connectedPeers = msg.totalPeers;
        State.emit('peers:updated', { count: msg.totalPeers });
        if (msg.whiteboardSnapshot) {
          State.wbElements = msg.whiteboardSnapshot;
          State.emit('whiteboard:redraw');
        }
        if (msg.filesSnapshot) {
          State.files = msg.filesSnapshot;
          State.emit('files:updated');
        }
        if (msg.marketplaceSnapshot) {
          State.packages = msg.marketplaceSnapshot;
          State.emit('marketplace:updated');
        }
        if (msg.activitySnapshot) {
          State.activities = msg.activitySnapshot;
          State.emit('activity:updated');
        }
        break;

      case 'PEER_COUNT_UPDATE':
        State.connectedPeers = msg.totalPeers;
        State.emit('peers:updated', { count: msg.totalPeers });
        if (msg.message) showToast(msg.message, 'info');
        break;

      case 'EXTENSION_PUBLISHED':
        State.packages.unshift(msg.package);
        State.emit('marketplace:updated');
        showToast(`Extension Published: ${msg.package.name}`, 'success');
        break;

      case 'FILE_CREATED':
        const exists = State.files.find(f => f.name === msg.file.name);
        if (!exists) {
          State.files.push(msg.file);
          State.emit('files:updated');
          showToast(`File created: ${msg.file.name}`);
        }
        break;

      case 'FILE_DELETED':
        const idx = State.files.findIndex(f => f.name === msg.fileName);
        if (idx >= 0) {
          State.files.splice(idx, 1);
          State.activeFileIndex = Math.max(0, State.files.length - 1);
          State.emit('files:updated');
          showToast(`File deleted: ${msg.fileName}`);
        }
        break;

      case 'CODE_CHANGE':
        const curFile = State.files[State.activeFileIndex];
        if (curFile && curFile.name === msg.fileName) {
          curFile.content = msg.content;
          State.emit('code:remote_change', msg);
        }
        break;

      case 'ACTIVITY_LOGGED':
        State.activities.unshift(msg.activity);
        State.emit('activity:updated');
        break;

      case 'DRAW_STROKE_LIVE':
        State.emit('whiteboard:remote_stroke', msg.stroke);
        break;

      case 'DRAW_COMMIT':
        State.wbElements.push(msg.element);
        State.emit('whiteboard:redraw');
        break;

      case 'CANVAS_CLEARED':
        State.wbElements = [];
        State.emit('whiteboard:redraw');
        showToast(`${msg.peerId} cleared the canvas`);
        break;

      case 'CANVAS_RESTORED':
        State.wbElements = msg.whiteboardSnapshot || [];
        State.emit('whiteboard:redraw');
        break;

      case 'REMOTE_CURSOR':
        State.emit('whiteboard:remote_cursor', msg);
        break;

      case 'REMOTE_CURSOR_REMOVE':
        State.emit('whiteboard:remote_cursor_remove', msg.peerId);
        break;

      case 'TASK_MOVED':
        const task = State.tasks.find(t => t.id === msg.taskId);
        if (task) {
          task.column = msg.newColumn;
          State.emit('tasks:updated');
          showToast(`${task.id} moved to ${msg.newColumn.toUpperCase()}`);
        }
        break;

      default:
        break;
    }
  }
};
