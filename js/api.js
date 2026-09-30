/**
 * SyncWorld REST API Client
 */
import { State } from './state.js';

export const API = {
  async getStatus() {
    const res = await fetch('/api/status');
    return res.ok ? await res.json() : null;
  },

  async getMarketplace() {
    const res = await fetch('/api/marketplace');
    if (res.ok) {
      const data = await res.json();
      return data.packages || [];
    }
    return [];
  },

  async publishExtension(payload) {
    const res = await fetch('/api/marketplace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        author: State.user.name,
        role: State.user.role
      })
    });
    return res.ok ? await res.json() : null;
  },

  async getFiles() {
    const res = await fetch('/api/files');
    if (res.ok) {
      const data = await res.json();
      return data.files || [];
    }
    return [];
  },

  async createFile(filename) {
    const res = await fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: filename,
        author: State.user.name,
        role: State.user.role
      })
    });
    return res.ok ? await res.json() : null;
  },

  async saveFile(filename, content) {
    const res = await fetch(`/api/files/${encodeURIComponent(filename)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: content,
        author: State.user.name
      })
    });
    return res.ok;
  },

  async deleteFile(filename) {
    const res = await fetch(`/api/files/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: {
        'x-user-name': State.user.name,
        'x-user-role': State.user.role
      }
    });
    return res.ok;
  },

  async getTasks() {
    const res = await fetch('/api/tasks');
    if (res.ok) {
      const data = await res.json();
      return data.tasks || [];
    }
    return [];
  },

  async getActivity() {
    const res = await fetch('/api/activity');
    if (res.ok) {
      const data = await res.json();
      return data.activities || [];
    }
    return [];
  },

  async getWhiteboard() {
    const res = await fetch('/api/whiteboard');
    if (res.ok) {
      const data = await res.json();
      return data.elements || [];
    }
    return [];
  }
};
