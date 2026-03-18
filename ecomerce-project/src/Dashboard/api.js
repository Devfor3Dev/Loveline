/* ═══════════════════════════════════════════════════════════════
   LoveLine — API Service Layer
   Connects to Django REST backend (DRF + JWT Auth)
   ═══════════════════════════════════════════════════════════════ */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── Token helpers (compatible Ninja JWT) ────────────────────────────────────
// Ninja JWT stocke les tokens sous les clés : access_token / refresh_token
export const getToken   = () => localStorage.getItem('access_token');
export const setTokens  = (access, refresh) => {
  localStorage.setItem('access_token',  access);
  localStorage.setItem('refresh_token', refresh);
};
export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// ─── Base fetch with JWT auto-refresh ────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Try to refresh if 401
  if (res.status === 401) {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      const refreshRes = await fetch(`${BASE_URL}/api/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (refreshRes.ok) {
        const { access } = await refreshRes.json();
        localStorage.setItem('access_token', access);
        res = await fetch(`${BASE_URL}${path}`, {
          ...options,
          headers: { ...headers, Authorization: `Bearer ${access}` },
        });
      } else {
        clearTokens();
        window.location.href = '/auth';
        return null;
      }
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Erreur réseau' }));
    throw new Error(err.detail || JSON.stringify(err));
  }

  if (res.status === 204) return null;
  return res.json();
}

// ─── Multipart (FormData) fetch ───────────────────────────────────────────────
async function apiFormData(path, formData, method = 'PATCH') {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════════════════
export const authAPI = {
  login:  (email, password) =>
      apiFetch('/api/auth/token/', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (data) =>
      apiFetch('/api/auth/register/', { method: 'POST', body: JSON.stringify(data) }),

  logout: (refresh) =>
      apiFetch('/api/auth/logout/', { method: 'POST', body: JSON.stringify({ refresh }) }),

  changePassword: (data) =>
      apiFetch('/api/auth/change-password/', { method: 'POST', body: JSON.stringify(data) }),

  deleteAccount: () =>
      apiFetch('/api/auth/delete-account/', { method: 'DELETE' }),
};

// ══════════════════════════════════════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════════════════════════════════════
export const profileAPI = {
  getMe: () =>
      apiFetch('/api/profile/me/'),

  update: (data) =>
      apiFetch('/api/profile/me/', { method: 'PATCH', body: JSON.stringify(data) }),

  uploadPhotos: (formData) =>
      apiFormData('/api/profile/photos/', formData, 'POST'),

  deletePhoto: (photoId) =>
      apiFetch(`/api/profile/photos/${photoId}/`, { method: 'DELETE' }),

  setMainPhoto: (photoId) =>
      apiFetch(`/api/profile/photos/${photoId}/set-main/`, { method: 'POST' }),

  updateInterests: (interests) =>
      apiFetch('/api/profile/interests/', { method: 'PUT', body: JSON.stringify({ interests }) }),

  requestVerification: (formData) =>
      apiFormData('/api/profile/verify/', formData, 'POST'),

  getVerificationStatus: () =>
      apiFetch('/api/profile/verify/status/'),

  updatePrivacy: (data) =>
      apiFetch('/api/profile/privacy/', { method: 'PATCH', body: JSON.stringify(data) }),

  updateNotifications: (data) =>
      apiFetch('/api/profile/notifications/', { method: 'PATCH', body: JSON.stringify(data) }),

  updateDiscoverySettings: (data) =>
      apiFetch('/api/profile/discovery-settings/', { method: 'PATCH', body: JSON.stringify(data) }),

  updateEmail: (data) =>
      apiFetch('/api/profile/email/', { method: 'PATCH', body: JSON.stringify(data) }),
};

// ══════════════════════════════════════════════════════════════════════════════
// DISCOVER (Swipe Deck)
// ══════════════════════════════════════════════════════════════════════════════
export const discoverAPI = {
  getProfiles: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiFetch(`/api/discover/${params ? '?' + params : ''}`);
  },

  swipe: (profileId, direction) =>
      apiFetch('/api/swipe/', {
        method: 'POST',
        body: JSON.stringify({ profile_id: profileId, direction }), // 'like' | 'nope' | 'superlike'
      }),

  rewind: () =>
      apiFetch('/api/swipe/rewind/', { method: 'POST' }),

  activateBoost: () =>
      apiFetch('/api/boost/activate/', { method: 'POST' }),

  getBoostStatus: () =>
      apiFetch('/api/boost/status/'),
};

// ══════════════════════════════════════════════════════════════════════════════
// EXPLORE
// ══════════════════════════════════════════════════════════════════════════════
export const exploreAPI = {
  getCategories: () =>
      apiFetch('/api/explore/categories/'),

  getByCategory: (categoryId, page = 1) =>
      apiFetch(`/api/explore/categories/${categoryId}/profiles/?page=${page}`),

  search: (query) =>
      apiFetch(`/api/explore/search/?q=${encodeURIComponent(query)}`),
};

// ══════════════════════════════════════════════════════════════════════════════
// LIKES
// ══════════════════════════════════════════════════════════════════════════════
export const likesAPI = {
  getReceivedLikes: () =>
      apiFetch('/api/likes/received/'),

  getTopPicks: () =>
      apiFetch('/api/likes/top-picks/'),

  getSuperLikeStatus: () =>
      apiFetch('/api/likes/superlike-status/'),
};

// ══════════════════════════════════════════════════════════════════════════════
// MATCHES & MESSAGES
// ══════════════════════════════════════════════════════════════════════════════
export const messagesAPI = {
  getMatches: () =>
      apiFetch('/api/matches/'),

  getConversations: () =>
      apiFetch('/api/messages/conversations/'),

  getMessages: (matchId, page = 1) =>
      apiFetch(`/api/messages/${matchId}/?page=${page}`),

  sendMessage: (matchId, content, type = 'text') =>
      apiFetch(`/api/messages/${matchId}/`, {
        method: 'POST',
        body: JSON.stringify({ content, type }),
      }),

  sendVoiceMessage: (matchId, formData) =>
      apiFormData(`/api/messages/${matchId}/voice/`, formData, 'POST'),

  markAsRead: (matchId) =>
      apiFetch(`/api/messages/${matchId}/read/`, { method: 'POST' }),

  deleteConversation: (matchId) =>
      apiFetch(`/api/messages/${matchId}/`, { method: 'DELETE' }),

  unmatch: (matchId) =>
      apiFetch(`/api/matches/${matchId}/unmatch/`, { method: 'POST' }),

  report: (userId, reason) =>
      apiFetch('/api/report/', { method: 'POST', body: JSON.stringify({ user_id: userId, reason }) }),
};

// ══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTIONS
// ══════════════════════════════════════════════════════════════════════════════
export const subscriptionAPI = {
  getStatus: () =>
      apiFetch('/api/subscription/'),

  getPlans: () =>
      apiFetch('/api/subscription/plans/'),

  subscribe: (planId, paymentMethod) =>
      apiFetch('/api/subscription/subscribe/', {
        method: 'POST',
        body: JSON.stringify({ plan_id: planId, payment_method: paymentMethod }),
      }),

  cancel: () =>
      apiFetch('/api/subscription/cancel/', { method: 'POST' }),
};

// ══════════════════════════════════════════════════════════════════════════════
// WEBSOCKET (Messages en temps réel)
// ══════════════════════════════════════════════════════════════════════════════
export class ChatSocket {
  constructor(matchId, onMessage, onClose) {
    const token = getToken();
    const wsBase = BASE_URL.replace('http', 'ws');
    this.ws = new WebSocket(`${wsBase}/ws/chat/${matchId}/?token=${token}`);
    this.ws.onmessage = (e) => onMessage(JSON.parse(e.data));
    this.ws.onclose   = onClose || (() => {});
    this.ws.onerror   = (e) => console.error('WS error', e);
  }

  send(payload) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  close() { this.ws.close(); }
}

export class NotificationSocket {
  constructor({ onNotification, onBadgeUpdate } = {}) {
    this.onNotification = onNotification || (() => {});
    this.onBadgeUpdate  = onBadgeUpdate  || (() => {});
    this.ws = null;
    this._reconnectTimer = null;
    this._dead = false;
  }

  connect() {
    if (this._dead) return;
    const token = getToken();
    if (!token) return;
    const wsBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/^http/, 'ws');
    this.ws = new WebSocket(`${wsBase}/ws/notifications/?token=${token}`);

    this.ws.onopen    = () => { clearTimeout(this._reconnectTimer); };
    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'badge_update') {
          this.onBadgeUpdate(data.counts || {});
        } else {
          this.onNotification(data);
        }
      } catch {}
    };
    this.ws.onerror = (e) => console.warn('Notification WS error', e);
    this.ws.onclose = () => {
      if (!this._dead) {
        this._reconnectTimer = setTimeout(() => this.connect(), 5000);
      }
    };
  }

  disconnect() {
    this._dead = true;
    clearTimeout(this._reconnectTimer);
    if (this.ws) { this.ws.onclose = null; this.ws.close(); }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════
export const notificationAPI = {
  getUnreadCounts: () => apiFetch('/api/notifications/unread-counts/'),
  getAll:          (page = 1) => apiFetch(`/api/notifications/?page=${page}`),
  markRead:        (id) => apiFetch(`/api/notifications/${id}/read/`, { method: 'POST' }),
  markAllRead:     () => apiFetch('/api/notifications/mark-all-read/', { method: 'POST' }),
};