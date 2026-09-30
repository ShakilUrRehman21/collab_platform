/**
 * SyncWorld Master Modular Application Orchestrator
 */
import { State, sound } from './state.js';
import { API } from './api.js';
import { Socket } from './socket.js';
import { initWhiteboard, resizeCanvas } from './whiteboard.js';
import { initCodeboard, renderCodeboard } from './codeboard.js';
import { initActivityAndUser } from './activity.js';

function switchView(viewName) {
  if (State.activeView === viewName) return;
  State.activeView = viewName;
  sound.playPop();

  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `view-${viewName}`);
  });

  if (viewName === 'whiteboard') {
    setTimeout(resizeCanvas, 50);
  }
}

async function init() {
  console.log('[SyncWorld] Initializing focused collaborative workspace...');

  // Setup view routing
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Modal close buttons
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sound.playPop();
      const modal = btn.closest('.modal-backdrop');
      if (modal) modal.classList.remove('active');
    });
  });

  // Codeboard: Create New File Modal
  document.getElementById('btn-create-file')?.addEventListener('click', () => {
    sound.playPop();
    const input = document.getElementById('new-file-name');
    if (input) input.value = '';
    document.getElementById('new-file-modal')?.classList.add('active');
  });

  document.getElementById('new-file-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fname = document.getElementById('new-file-name').value.trim();
    if (fname) {
      document.getElementById('new-file-modal')?.classList.remove('active');
      const res = await API.createFile(fname);
      if (res && res.file) {
        const existingIdx = State.files.findIndex(f => f.name === res.file.name);
        if (existingIdx >= 0) {
          State.activeFileIndex = existingIdx;
        } else {
          State.files.push(res.file);
          State.activeFileIndex = State.files.length - 1;
        }
        renderCodeboard();
      }
    }
  });

  // Number key shortcuts (1..3) for rapid view switching
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (e.key === '1') switchView('whiteboard');
    if (e.key === '2') switchView('codeboard');
    if (e.key === '3') switchView('activity');
  });

  // Initialize core modular components
  initWhiteboard();
  initCodeboard();
  initActivityAndUser();

  // Load backend data
  const [files, acts, wbs] = await Promise.all([
    API.getFiles(),
    API.getActivity(),
    API.getWhiteboard()
  ]);

  if (files.length) State.files = files;
  if (acts.length) State.activities = acts;
  if (wbs.length) State.wbElements = wbs;

  State.emit('files:updated');
  State.emit('activity:updated');
  State.emit('whiteboard:redraw');

  // Connect WebSocket
  Socket.init();

  // Default to Whiteboard view
  switchView('whiteboard');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
