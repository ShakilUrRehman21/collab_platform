/**
 * SyncWorld Activity Audit Feed & User Identity Module
 */
import { State, sound, getInitials, escapeHtml } from './state.js';
import { Socket } from './socket.js';
import { showToast } from './toast.js';

export function initActivityAndUser() {
  updateUserDisplay();
  renderActivities();

  // User Profile modal open
  document.getElementById('user-identity-btn')?.addEventListener('click', () => {
    document.getElementById('user-profile-name').value = State.user.name;
    document.getElementById('user-profile-role').value = State.user.role;
    document.getElementById('user-profile-modal')?.classList.add('active');
    sound.playPop();
  });

  // User Profile save
  document.getElementById('user-profile-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const newName = document.getElementById('user-profile-name').value.trim();
    const newRole = document.getElementById('user-profile-role').value;

    if (!newName) return;

    State.setUser(newName, newRole);
    updateUserDisplay();

    Socket.send({
      type: 'IDENTIFY_USER',
      name: State.user.name,
      role: State.user.role,
      color: State.user.color
    });

    document.getElementById('user-profile-modal')?.classList.remove('active');
    showToast(`Logged in as ${State.user.name} (${State.user.role})`, 'success');
  });

  State.on('activity:updated', renderActivities);
  State.on('peers:updated', (info) => {
    const badge = document.getElementById('peer-count-text');
    if (badge) {
      badge.textContent = info.text ? info.text : (info.count === 1 ? '1 tab active' : `Live: ${info.count} tabs synced`);
    }
  });
}

export function updateUserDisplay() {
  const avatar = document.getElementById('user-nav-avatar');
  const nameEl = document.getElementById('user-nav-name');
  const roleEl = document.getElementById('user-nav-role');

  if (avatar) {
    avatar.textContent = getInitials(State.user.name);
    avatar.style.background = State.user.color || '#4f46e5';
  }
  if (nameEl) nameEl.textContent = State.user.name;
  if (roleEl) roleEl.textContent = State.user.role;
}

export function renderActivities() {
  const feed = document.getElementById('activity-feed-list');
  if (!feed) return;

  if (State.activities.length === 0) {
    feed.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-tertiary);">No workspace activities recorded yet.</div>`;
    return;
  }

  feed.innerHTML = State.activities.map(act => {
    const timeStr = act.timestamp ? new Date(act.timestamp).toLocaleTimeString() : 'just now';
    return `
      <div class="activity-card">
        <div class="activity-avatar" style="background:${act.role === 'Staff Engineer' ? '#4f46e5' : '#0284c7'};">
          ${getInitials(act.user)}
        </div>
        <div class="activity-content">
          <div class="activity-user-row">
            <span class="activity-username">${escapeHtml(act.user)}</span>
            <span class="activity-role">&bull; ${escapeHtml(act.role)}</span>
            <span class="activity-time">${timeStr}</span>
          </div>
          <div class="activity-details">${escapeHtml(act.details)}</div>
        </div>
      </div>
    `;
  }).join('');
}
