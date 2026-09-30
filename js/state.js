/**
 * SyncWorld Central Reactive State Store & Audio Feedback Engine
 * Architecture: Senior Frontend Engineer Modular Architecture
 */

const DEFAULT_IDENTITIES = [
  { name: 'Marcus Vance', role: 'Staff Engineer', color: '#4f46e5' },
  { name: 'Elena Rostova', role: 'Senior Contributor', color: '#0284c7' },
  { name: 'Sarah Lin', role: 'Design Systems Lead', color: '#059669' },
  { name: 'Alex Rivera', role: 'Platform Architect', color: '#d97706' }
];

let savedUser = null;
try {
  savedUser = JSON.parse(localStorage.getItem('sw_user_identity'));
} catch (e) {}

if (!savedUser || !savedUser.name) {
  const chosen = DEFAULT_IDENTITIES[Math.floor(Math.random() * DEFAULT_IDENTITIES.length)];
  savedUser = { ...chosen };
  localStorage.setItem('sw_user_identity', JSON.stringify(savedUser));
}

export const State = {
  user: savedUser,
  connectedPeers: 1,
  activeView: 'whiteboard', // Default view is Whiteboard
  soundEnabled: true,

  // Whiteboard
  wbTool: 'pen',
  wbColor: '#4f46e5',
  wbSize: 4,
  wbElements: [],
  isDrawing: false,
  currentStroke: null,

  // Codeboard
  files: [],
  activeFileIndex: 0,

  // Activities
  activities: [],

  // Event Listeners
  listeners: {},

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  },

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  },

  setUser(name, role, color) {
    this.user.name = name;
    this.user.role = role;
    if (color) this.user.color = color;
    localStorage.setItem('sw_user_identity', JSON.stringify(this.user));
    this.emit('user:changed', this.user);
  }
};

// Modern Web Audio Tactile Feedback Engine
class TactileAudio {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  playPop() {
    if (!State.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  playSuccess() {
    if (!State.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.setValueAtTime(659.25, now + 0.08);
      osc2.frequency.setValueAtTime(783.99, now + 0.16);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc1.stop(now + 0.16);
      osc2.start(now + 0.16);
      osc2.stop(now + 0.35);
    } catch (e) {}
  }

  playError() {
    if (!State.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.15);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }
}

export const sound = new TactileAudio();

export function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
}

export function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
