/**
 * SyncWorld Toast Notification System
 */
import { sound, escapeHtml } from './state.js';

let container = null;

export function showToast(msg, type = 'info') {
  if (!container) {
    container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-body">
      <span>${escapeHtml(msg)}</span>
    </div>
  `;

  container.appendChild(toast);
  if (type === 'success') {
    sound.playSuccess();
  } else {
    sound.playPop();
  }

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px) scale(0.96)';
    toast.style.transition = 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)';
    setTimeout(() => toast.remove(), 200);
  }, 3200);
}
