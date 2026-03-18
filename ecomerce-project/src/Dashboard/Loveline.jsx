/* ═══════════════════════════════════════════════════════════════════════════════
   LoveLine — Dashboard.jsx
   api, thème, modals, swipe, discover, explore,
   likes, chat, messages, profil, compte, navigation, dashboard principal.
   Backend   —  Frontend : React + Framer Motion + GSAP
   ═══════════════════════════════════════════════════════════════════════════════ */
import EmojiPicker from 'emoji-picker-react';
import {
    useState, useEffect, useRef, useCallback,
    createContext, useContext, Suspense,
} from 'react';
import {
    Clock, Cake, Navigation,
    Heart, BarChart2, BellRing, PenLine,
    ShieldCheck, Compass, Sparkles, MessageCircle, User,
    RotateCcw, Zap, X, ChevronLeft, Search,
    Bell, Camera, Lock, Mail, Settings, Eye, EyeOff,
    Shield, Trash2, LogOut, Star, Check, ChevronRight,
    Mic, Send, Phone, Video, MoreVertical, ArrowLeft,
    Image, Plus, Users, BadgeCheck, Flame, MapPin,
    GraduationCap, Filter, Upload, RefreshCw, Info,
    Moon, Sun, CheckCheck, HeartCrack, AlertTriangle,
    Smile, Pause, Play, Ban, ChevronDown, MicOff,
} from 'lucide-react';
import {
    motion, AnimatePresence,
    useMotionValue, useTransform, useAnimation,
    useSpring,
} from 'framer-motion';
import { gsap } from 'gsap';


// ══════════════════════════════════════════════════════════════════════════════
// COUCHE API
// ══════════════════════════════════════════════════════════════════════════════
//URL des photo

// ── Helper URL photo ─────────────────────────────────────────────────────────
const getMainPhoto = (profile) => {
    if (!profile) return null;
    const main = profile.photos?.find(p => p.is_main) || profile.photos?.[0];
    const url = main?.url || profile.photo || profile.avatar || null;
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return getBaseUrl() + url;
};

const photoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
   return getBaseUrl() + url;
};

//calcul de l'âge de l'utilisateur

const calcAge = (birthday) => {
    if (!birthday) return null;
    const today = new Date();
    const birth = new Date(birthday);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
};

const getBaseUrl = () => {
    try { return import.meta.env?.VITE_API_URL || 'http://localhost:8000'; }
    catch(_) { return 'http://localhost:8000'; }
};

// ─── Token helpers ─────────────────────────────────────────────────────────────
const getToken    = () => localStorage.getItem('ll_access');
const setTokens   = (access, refresh) => {
    localStorage.setItem('ll_access',  access);
    localStorage.setItem('ll_refresh', refresh);
};
const clearTokens = () => {
    localStorage.removeItem('ll_access');
    localStorage.removeItem('ll_refresh');
};

// ─── Base fetch avec auto-refresh JWT ──────────────────────
async function apiFetch(path, options = {}) {
    const base    = getBaseUrl();
    const token   = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    let res = await fetch(`${base}${path}`, { ...options, headers });

    if (res.status === 401) {
        const refresh = localStorage.getItem('ll_refresh');
        if (refresh) {
            const refreshRes = await fetch(`${base}/api/auth/token/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh }),
            });
            if (refreshRes.ok) {
                const data = await refreshRes.json();
                const newAccess = data.access;
                localStorage.setItem('ll_access', newAccess);
                res = await fetch(`${base}${path}`, {
                    ...options,
                    headers: { ...headers, Authorization: `Bearer ${newAccess}` },
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

async function apiFormData(path, formData, method = 'PATCH') {
    const base  = getBaseUrl();
    const token = getToken();
    const res   = await fetch(`${base}${path}`, {
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

// ─── AUTH JWT ──────────────────────────────────────────────────
const authAPI = {
    login: (email, password) =>
        apiFetch('/api/auth/token/pair', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        }),

    register: (data) =>
        apiFetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    logout: (refresh) =>
        apiFetch('/api/auth/token/blacklist', {
            method: 'POST',
            body: JSON.stringify({ refresh })
        }),

    changePassword: (data) =>
        apiFetch('/api/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
    deleteAccount: () =>
        apiFetch('/api/auth/delete-account', { method: 'DELETE' }),
};

const profileAPI = {
    getMe: () => apiFetch('/api/profile/me'),
    update: (data) => apiFetch('/api/profile/me', { method: 'PATCH', body: JSON.stringify(data) }),
    uploadPhotos: (formData) => apiFormData('/api/profile/photos', formData, 'POST'),
    deletePhoto: (photoId) => apiFetch(`/api/profile/photos/${photoId}`, { method: 'DELETE' }),
    setMainPhoto: (photoId) => apiFetch(`/api/profile/photos/${photoId}/set-main`, { method: 'POST' }),
    updateInterests: (interests) =>
        apiFetch('/api/profile/interests', { method: 'PUT', body: JSON.stringify({ interests }) }),
    requestVerification: (formData) => apiFormData('/api/profile/verify', formData, 'POST'),
    getVerificationStatus: () => apiFetch('/api/profile/verify/status'),
    updatePrivacy: (data) =>
        apiFetch('/api/profile/privacy', { method: 'PATCH', body: JSON.stringify(data) }),
    updateNotifications: (data) =>
        apiFetch('/api/profile/notifications', { method: 'PATCH', body: JSON.stringify(data) }),
    updateDiscoverySettings: (data) =>
        apiFetch('/api/profile/discovery-settings', { method: 'PATCH', body: JSON.stringify(data) }),
    updateEmail: (data) =>
        apiFetch('/api/profile/email', { method: 'PATCH', body: JSON.stringify(data) }),
};

const discoverAPI = {
    getProfiles: (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        return apiFetch(`/api/discover${params ? '?' + params : ''}`);
    },
    swipe: (profileId, direction) =>
        apiFetch('/api/discover/swipe', {           // ← était /api/swipe
            method: 'POST',
            body: JSON.stringify({
                target_profile_id: profileId,       // ← était profile_id
                action: direction,                  // ← était direction
            })
        }),
    rewind: () => apiFetch('/api/discover/rewind', { method: 'POST' }), // ← était /api/swipe/rewind
    activateBoost: () => apiFetch('/api/boost/activate', { method: 'POST' }),
    getBoostStatus: () => apiFetch('/api/boost/status'),
};

const exploreAPI = {
    getCategories: () => apiFetch('/api/explore/categories'),
    getByCategory: (categoryId, page = 1) =>
        apiFetch(`/api/explore/categories/${categoryId}/profiles?page=${page}`),
    search: (query) => apiFetch(`/api/explore/search?q=${encodeURIComponent(query)}`),
};

const likesAPI = {
    getReceivedLikes:   () => apiFetch('/api/likes/received'),
    getTopPicks:        () => apiFetch('/api/likes/top-picks'),
    getSuperLikeStatus: () => apiFetch('/api/likes/superlike-status'),
};

const messagesAPI = {
    getMatches:         () => apiFetch('/api/matches/'),
    getConversations:   () => apiFetch('/api/conversations/'),
    getMessages:        (convId, page = 1) => apiFetch(`/api/conversations/${convId}/messages?page=${page}`),
    sendMessage:        (convId, content) =>
        apiFetch(`/api/conversations/${convId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
    sendVoiceMessage:   (convId, formData) => apiFormData(`/api/conversations/${convId}/voice`, formData, 'POST'),
    markAsRead:         (convId) => apiFetch(`/api/conversations/${convId}/read`, { method: 'POST' }),
    deleteConversation: (convId) => apiFetch(`/api/conversations/${convId}`, { method: 'DELETE' }),
    unmatch:            (matchId) => apiFetch(`/api/matches/${matchId}/unmatch`, { method: 'POST' }),
    report:             (userId, reason) =>
        apiFetch('/api/report', { method: 'POST', body: JSON.stringify({ user_id: userId, reason }) }),
};

const subscriptionAPI = {
    getStatus: () => apiFetch('/api/subscription'),
    getPlans:  () => apiFetch('/api/subscription/plans'),
    subscribe: (planId, paymentMethod) =>
        apiFetch('/api/subscription/subscribe', {
            method: 'POST',
            body: JSON.stringify({ plan_id: planId, payment_method: paymentMethod }),
        }),
    cancel: () => apiFetch('/api/subscription/cancel', { method: 'POST' }),
};

const notificationAPI = {
    getUnreadCounts: () => apiFetch('/api/notifications/unread-counts'),
    getAll:          (page = 1) => apiFetch(`/api/notifications?page=${page}`),
    markRead:        (id) => apiFetch(`/api/notifications/${id}/read`, { method: 'POST' }),
    markAllRead:     () => apiFetch('/api/notifications/mark-all-read', { method: 'POST' }),
};

class ChatSocket {
    constructor(matchId, onMessage, onClose) {
        const token  = getToken();
        const wsBase = getBaseUrl().replace(/^http/, 'ws');
        this.ws = new WebSocket(`${wsBase}/ws/chat/${matchId}/?token=${token}`);
        this.ws.onmessage = (e) => onMessage(JSON.parse(e.data));
        this.ws.onclose   = onClose || (() => {});
        this.ws.onerror   = (e) => console.warn('WS chat error', e);
    }
    send(payload) {
        if (this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(payload));
    }
    close() { this.ws.close(); }
}

class NotificationSocket {
    constructor({ onNotification, onBadgeUpdate } = {}) {
        this.onNotification  = onNotification || (() => {});
        this.onBadgeUpdate   = onBadgeUpdate  || (() => {});
        this.ws              = null;
        this._reconnectTimer = null;
        this._dead           = false;
    }
    connect() {
        if (this._dead) return;
        const token = getToken();
        if (!token) return;
        const wsBase = getBaseUrl().replace(/^http/, 'ws');
        this.ws = new WebSocket(`${wsBase}/ws/notifications/?token=${token}`);
        this.ws.onopen    = () => clearTimeout(this._reconnectTimer);
        this.ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.type === 'badge_update') this.onBadgeUpdate(data.counts || {});
                else                              this.onNotification(data);
            } catch (_) {}
        };
        this.ws.onerror = () => {};
        this.ws.onclose = () => {
            if (!this._dead) this._reconnectTimer = setTimeout(() => this.connect(), 5000);
        };
    }
    disconnect() {
        this._dead = true;
        clearTimeout(this._reconnectTimer);
        if (this.ws) {
            this.ws.onclose = null;
            this.ws.onerror = null;
            if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                this.ws.close();
            }
        }
    }
}


// ══════════════════════════════════════════════════════════════════════════════
// SYSTÈME DE THÈME
// ══════════════════════════════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════════════
   Theme System
   ═══════════════════════════════════════════════════════════════ */

// ─── Palette ─────────────────────────────────────────────────────────────────
export const LIGHT = {
    // Backgrounds
    bg:           '#F9FAFB',
    bgDark:       '#F9FAFB',
    bgCard:       '#FFFFFF',
    beige:        '#F0EAD6',
    lavender:     '#E6E6FA',
    lavenderSoft: '#F3F3FF',

    // Text
    text:         '#1A0812',
    textMid:      '#2D1020',
    textSoft:     '#7B4D5E',
    textMuted:    '#B08A9A',

    // Accents
    gold:         '#BE185D',
    goldDark:     '#C2185B',
    goldLight:    '#F472B6',
    rose:         '#880E4F',
    roseLight:    '#C2185B',
    roseSoft:     '#FCE4EC',

    // Action colors
    like:         '#E91E63',
    nope:         '#607D8B',
    superlike:    '#2196F3',
    boost:        '#9C27B0',

    // Glass
    glassBg:      'rgba(255, 255, 255, 0.55)',
    glassBorder:  'rgba(255, 255, 255, 0.80)',
    glassBlur:    '24px',
    navGlass:     'rgba(253, 246, 240, 0.70)',
    navBorder:    'rgba(212, 175, 55, 0.15)',

    // Shadows
    shadowCard:   '0 8px 40px rgba(136, 14, 79, 0.08)',
    shadowGold:   '0 4px 24px rgba(212, 175, 55, 0.20)',
    shadowDeep:   '0 24px 80px rgba(26, 8, 18, 0.12)',

    // Statuonline:       '#4CAF50',
    offline:      '#9E9E9E',
};

export const DARK = {
    bg:           '#0F0810',
    bgDark:       '#160B18',
    bgCard:       '#1E1020',
    beige:        '#2A1A2E',
    lavender:     '#2D2040',
    lavenderSoft: '#251830',

    text:         '#F8EDF5',
    textMid:      '#E8D5E0',
    textSoft:     '#B890A8',
    textMuted:    '#7A5570',

    gold:         '#E11D74',
    goldDark:     '#BE185D',
    goldLight:    '#F9A8D4',
    rose:         '#C2185B',
    roseLight:    '#E91E63',
    roseSoft:     '#3D0A20',

    like:         '#E91E63',
    nope:         '#546E7A',
    superlike:    '#1565C0',
    boost:        '#7B1FA2',

    glassBg:      'rgba(30, 16, 32, 0.65)',
    glassBorder:  'rgba(212, 175, 55, 0.12)',
    glassBlur:    '24px',
    navGlass:     'rgba(15, 8, 16, 0.75)',
    navBorder:    'rgba(212, 175, 55, 0.12)',

    shadowCard:   '0 8px 40px rgba(0, 0, 0, 0.40)',
    shadowGold:   '0 4px 24px rgba(212, 175, 55, 0.15)',
    shadowDeep:   '0 24px 80px rgba(0, 0, 0, 0.50)',

    online:       '#66BB6A',
    offline:      '#616161',
};

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('ll_theme');
        if (saved) return saved === 'dark';
        return false;
    });

    const toggle = () => setIsDark(d => {
        localStorage.setItem('ll_theme', !d ? 'dark' : 'light');
        return !d;
    });

    const T = isDark ? DARK : LIGHT;

    // Apply CSS vars to :root
    useEffect(() => {
        const r = document.documentElement.style;
        Object.entries(T).forEach(([k, v]) => {
            r.setProperty(`--ll-${k}`, v);
        });
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }, [isDark, T]);

    return (
        <ThemeCtx.Provider value={{ T, isDark, toggle }}>
            {children}
        </ThemeCtx.Provider>
    );
}

export const useTheme = () => {
    const ctx = useContext(ThemeCtx);
    if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
    return ctx;
};

// ══════════════════════════════════════════════════════════════════════════════
// MODALS
// ══════════════════════════════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════════════
   Match & Premium Modals
   ═══════════════════════════════════════════════════════════════ */

// ─── Particle burst ───────────────────────────────────────────────────────────
function Particles() {
    const ref = useRef(null);
    useEffect(() => {
        if (!ref.current) return;
        const ctx = gsap.context(() => {
            const particles = ref.current.querySelectorAll('.particle');
            particles.forEach((p, i) => {
                const angle = (i / particles.length) * Math.PI * 2;
                const dist  = 80 + Math.random() * 120;
                gsap.fromTo(p,
                    { x: 0, y: 0, opacity: 1, scale: 0 },
                    {
                        x: Math.cos(angle) * dist,
                        y: Math.sin(angle) * dist,
                        opacity: 0,
                        scale: 1,
                        duration: 1.2 + Math.random() * 0.4,
                        delay: Math.random() * 0.3,
                        ease: 'power3.out',
                    }
                );
            });
        }, ref);
        return () => ctx.revert();
    }, []);

    const colors = ['#D4AF37', '#E91E63', '#fff', '#FFD700', '#FF69B4', '#B8942E'];

    return (
        <div ref={ref}
             style={
            {
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 10
            }
        }>
            {Array.from({ length: 28 }).map((_, i) => (
                <div key={i} className="particle" style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    width: 6 + Math.random() * 8,
                    height: 6 + Math.random() * 8,
                    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                    background: colors[i % colors.length],
                    transform: 'translate(-50%,-50%)',
                }} />
            ))}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// MATCH MODAL
// ══════════════════════════════════════════════════════════════════════════════
function MatchModal({ match, onClose, onMessage }) {
    const { T, isDark } = useTheme();
    if (!match) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', inset: 0, zIndex: 9000,
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column',
                }}
                onClick={onClose}
            >
                <Particles />

                <motion.div
                    initial={{ scale: 0.7, y: 60, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.8, y: 40, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        textAlign: 'center',
                        padding: '48px 40px',
                        maxWidth: 420,
                        width: '90%',
                    }}
                >
                    {/* MATCH text */}
                    <motion.div
                        initial={{ y: -30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 'clamp(42px, 10vw, 72px)',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            background: `linear-gradient(135deg, ${T.gold}, #FF69B4, ${T.gold})`,
                            backgroundSize: '200% 200%',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: 8,
                            animation: 'shimmer 2s infinite linear',
                        }}
                    >
                        MATCH !
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        style={{
                            fontFamily: "'Playfair Display', serif",
                            fontStyle: 'italic',
                            fontSize: 18,
                            color: 'rgba(255,255,255,0.75)',
                            marginBottom: 40,
                        }}
                    >
                        Les étoiles vous ont guidés l'un vers l'autre
                    </motion.p>

                    {/* Avatar pair */}
                    <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 250, damping: 20 }}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 24, marginBottom: 48,
                        }}
                    >
                        {/* My avatar */}
                        <div style={{
                            width: 100, height: 100, borderRadius: '50%',
                            border: `3px solid ${T.gold}`,
                            overflow: 'hidden',
                            boxShadow: `0 0 30px ${T.gold}55`,
                        }}>
                            <img src={match.myAvatar} alt="Moi"
                                 style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>

                        {/* Heart */}
                        <motion.div
                            animate={{ scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1 }}
                        >
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <path d="M16 28s-13-9-13-18A6 6 0 0 1 16 7a6 6 0 0 1 13 3c0 9-13 18-13 18z"
                                      fill={T.gold} />
                            </svg>
                        </motion.div>

                        {/* Their avatar */}
                        <div style={{
                            width: 100, height: 100, borderRadius: '50%',
                            border: `3px solid ${T.gold}`,
                            overflow: 'hidden',
                            boxShadow: `0 0 30px ${T.gold}55`,
                        }}>
                            <img src={match.theirAvatar} alt={match.theirName}
                                 style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </motion.div>

                    {/* Name */}
                    <p style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 22, color: '#fff',
                        marginBottom: 40,
                    }}>
                        Toi & <strong style={{ color: T.gold }}>{match.theirName}</strong>
                    </p>

                    {/* CTAs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <motion.button
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={onMessage}
                            style={{
                                background: `linear-gradient(135deg, ${T.gold}, #B8942E)`,
                                color: '#1A0812', border: 'none',
                                padding: '18px 40px', borderRadius: 50,
                                fontFamily: "'Playfair Display', sans-serif",
                                fontSize: 15, fontWeight: 700,
                                letterSpacing: '0.06em', cursor: 'pointer',
                                boxShadow: `0 8px 30px ${T.gold}44`,
                            }}
                        >
                            ✦ Envoyer un message
                        </motion.button>

                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.10)',
                                color: 'rgba(255,255,255,0.6)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                padding: '16px 40px', borderRadius: 50,
                                fontFamily: "'Playfair Display', sans-serif",
                                fontSize: 14, cursor: 'pointer',
                            }}
                        >
                            Continuer à découvrir
                        </button>
                    </div>
                </motion.div>

                <style>{`
          @keyframes shimmer {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
            </motion.div>
        </AnimatePresence>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// PREMIUM MODAL
// ══════════════════════════════════════════════════════════════════════════════
const PLANS = [
    {
        id: 'gold',
        name: 'LoveLine Gold',
        emoji: '✦',
        color: '#D4AF37',
        price: '2 500',
        currency: 'FCFA/mois',
        features: [
            'Voir qui vous a liké',
            'Top Picks quotidiens',
            '5 Super Likes par mois',
            'Rewind illimité',
            '1 Boost par mois',
            'Messagerie en priorité',
        ],
    },
    {
        id: 'eternite',
        name: 'LoveLine Éternité',
        emoji: '♾',
        color: '#E91E63',
        badge: 'Le plus populaire',
        price: '5000',
        currency: 'FCFA/mois',
        features: [
            'Tout Gold, plus :',
            'Super Likes illimités',
            'Boosts illimités',
            'Appels vidéo & vocaux',
            'Messagerie dès 24h',
            'Profil en vedette',
            'Priorité campus UK',
        ],
    },
];

function PremiumModal({ feature, onClose, onSubscribe }) {
    const { T, isDark } = useTheme();

    const featureMessages = {
        superlike: {
            title: 'Un intérêt particulier mérite l\'extraordinaire',
            sub: 'Les Super Likes augmentent tes chances de match de 300%',
        },
        rewind: {
            title: 'Chaque swipe compte',
            sub: 'Le Rewind te laisse une seconde chance pour les personnes perdues',
        },
        likes: {
            title: 'L\'admiration qui t\'attend',
            sub: 'Découvre ceux qui ont déjà craqué pour toi',
        },
        video_call: {
            title: 'Rapprochez-vous vraiment',
            sub: 'Les appels vidéo créent des connexions profondes',
        },
        boost: {
            title: 'Sois le profil qu\'on remarque',
            sub: 'Le Boost multiplie ta visibilité par 10 pendant 30 minutes',
        },
        default: {
            title: 'Élève ton expérience',
            sub: 'Débloque tout ce que LoveLine peut t\'offrir',
        },
    };

    const msg = featureMessages[feature] || featureMessages.default;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', inset: 0, zIndex: 8000,
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(16px)',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 32 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        width: '100%', maxWidth: 520,
                        background: isDark
                            ? 'linear-gradient(160deg, #1A0820 0%, #0F0810 100%)'
                            : 'linear-gradient(160deg, #FDF6F0 0%, #F5EDE5 100%)',
                        borderRadius: '28px 28px 0 0',
                        padding: '32px 24px 40px',
                        border: `1px solid ${T.gold}22`,
                        boxShadow: `0 -20px 80px rgba(0,0,0,0.40)`,
                        maxHeight: '92vh',
                        overflowY: 'auto',
                    }}
                >
                    {/* Handle */}
                    <div style={{
                        width: 40, height: 4, borderRadius: 2,
                        background: T.textMuted + '44',
                        margin: '0 auto 28px',
                    }} />

                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{ marginBottom: 12 }}>
                            <Sparkles size={40} color={T.gold} strokeWidth={1.4} />
                        </div>
                        <h2 style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 26, fontWeight: 700,
                            color: T.text, marginBottom: 8,
                            lineHeight: 1.3,
                        }}>
                            {msg.title}
                        </h2>
                        <p style={{
                            fontFamily: "'Playfair Display', sans-serif",
                            fontSize: 14, color: T.textSoft,
                            lineHeight: 1.6,
                        }}>
                            {msg.sub}
                        </p>
                    </div>

                    {/* Plans */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                        {PLANS.map((plan) => (
                            <motion.div
                                key={plan.id}
                                whileHover={{ y: -3 }}
                                onClick={() => onSubscribe(plan.id)}
                                style={{
                                    position: 'relative',
                                    border: `1.5px solid ${plan.color}55`,
                                    borderRadius: 20,
                                    padding: '22px 24px',
                                    cursor: 'pointer',
                                    background: isDark
                                        ? `${plan.color}0A`
                                        : `${plan.color}08`,
                                    transition: 'all 0.25s',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Shimmer border */}
                                <div style={{
                                    position: 'absolute', inset: 0, borderRadius: 20,
                                    background: `linear-gradient(135deg, ${plan.color}22, transparent 60%)`,
                                    pointerEvents: 'none',
                                }} />

                                {plan.badge && (
                                    <div style={{
                                        position: 'absolute', top: 14, right: 16,
                                        background: plan.color, color: '#fff',
                                        fontSize: 10, fontWeight: 700,
                                        padding: '3px 10px', borderRadius: 20,
                                        fontFamily: "'Playfair Display', sans-serif",
                                        letterSpacing: '0.05em',
                                    }}>
                                        {plan.badge}
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                                    <div>
                                        <div style={{
                                            fontFamily: "'Playfair Display', serif",
                                            fontSize: 20, fontWeight: 700,
                                            color: plan.color, marginBottom: 2,
                                        }}>
                                            {plan.emoji} {plan.name}
                                        </div>
                                        <div style={{
                                            fontFamily: "'Playfair Display', sans-serif",
                                            fontSize: 24, fontWeight: 800,
                                            color: T.text,
                                        }}>
                                            {plan.price}
                                            <span style={{ fontSize: 12, fontWeight: 400, color: T.textSoft }}> {plan.currency}</span>
                                        </div>
                                    </div>
                                </div>

                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {plan.features.map(f => (
                                        <li key={f} style={{
                                            fontFamily: "'Playfair Display', sans-serif",
                                            fontSize: 13, color: T.textSoft,
                                            display: 'flex', gap: 8, alignItems: 'center',
                                        }}>
                                            <span style={{ color: plan.color, fontSize: 14 }}>✓</span> {f}
                                        </li>
                                    ))}
                                </ul>

                                <button style={{
                                    marginTop: 18, width: '100%',
                                    background: `linear-gradient(135deg, ${plan.color}, ${plan.color}BB)`,
                                    color: plan.id === 'gold' ? '#1A0812' : '#fff',
                                    border: 'none', borderRadius: 50,
                                    padding: '14px 0',
                                    fontFamily: "'Playfair Display', sans-serif",
                                    fontSize: 14, fontWeight: 700,
                                    cursor: 'pointer',
                                    letterSpacing: '0.05em',
                                }}>
                                    Choisir {plan.name}
                                </button>
                            </motion.div>
                        ))}
                    </div>

                    <p style={{
                        textAlign: 'center',
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 11, color: T.textMuted,
                        lineHeight: 1.6,
                    }}>
                        Paiement sécurisé · Mobile Money & carte bancaire<br />
                        Annulable à tout moment · Aucun engagement
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
// SWIPECARD
// ══════════════════════════════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════════════
    Swipe Card
   Individual draggable profile card with physics & animations
   ═══════════════════════════════════════════════════════════════ */

const SWIPE_THRESHOLD   = 120;   // px to trigger swipe
const SUPERLIKE_THRESHOLD = -80; // upward px
const ROTATION_FACTOR   = 0.08;

// ─── Photo dots ───────────────────────────────────────────────────────────────
function PhotoDots({ total, current }) {
    return (
        <div style={{
            display: 'flex', gap: 5, justifyContent: 'center',
            padding: '0 16px',
        }}>
            {Array.from({ length: total }).map((_, i) => (
                <div key={i} style={{
                    flex: i === current ? 2 : 1,
                    height: 3, borderRadius: 2,
                    background: i === current ? '#fff' : 'rgba(255,255,255,0.40)',
                    transition: 'all 0.3s ease',
                }} />
            ))}
        </div>
    );
}

// ─── Swipe indicator overlays ─────────────────────────────────────────────────
function SwipeOverlay({ direction }) {
    if (!direction) return null;

    const config = {
        right: {
            label: 'LIKE', color: '#4CAF50',
            emoji: '💚',
            style: { top: 40, left: 28, border: '3px solid #4CAF50', color: '#4CAF50' },
        },
        left: {
            label: 'NOPE', color: '#F44336',
            emoji: '✕',
            style: { top: 40, right: 28, border: '3px solid #F44336', color: '#F44336', left: 'auto' },
        },
        up: {
            label: 'SUPER LIKE', color: '#2196F3',
            emoji: '⭐',
            style: { top: 40, left: '50%', transform: 'translateX(-50%)', border: '3px solid #2196F3', color: '#2196F3' },
        },
    };

    const c = config[direction];
    if (!c) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                position: 'absolute',
                ...c.style,
                background: `${c.color}22`,
                backdropFilter: 'blur(4px)',
                padding: '8px 18px',
                borderRadius: 10,
                fontFamily: "'Playfair Display', sans-serif",
                fontSize: 22, fontWeight: 900,
                letterSpacing: '0.12em',
                zIndex: 10,
                userSelect: 'none',
            }}
        >
            {c.label}
        </motion.div>
    );
}

// ─── Detail Drawer (swipe up to reveal full profile) ─────────────────────────
function ProfileDrawer({ profile, T, isDark }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(_, info) => {
                if (info.offset.y < -30) setExpanded(true);
                if (info.offset.y > 30)  setExpanded(false);
            }}
            animate={{ y: expanded ? '-55%' : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: isDark
                    ? 'linear-gradient(0deg, rgba(15,8,16,0.97) 0%, rgba(15,8,16,0.85) 60%, transparent 100%)'
                    : 'linear-gradient(0deg, rgba(26,8,18,0.94) 0%, rgba(26,8,18,0.75) 60%, transparent 100%)',
                padding: '60px 24px 28px',
                borderRadius: '0 0 28px 28px',
                cursor: 'pointer',
            }}
        >
            {/* Handle */}
            <div style={{
                width: 32, height: 3, borderRadius: 2,
                background: 'rgba(255,255,255,0.35)',
                margin: '0 auto 16px',
            }} />

            {/* Name & age */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                <h2 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 30, fontWeight: 700,
                    color: '#fff', margin: 0,
                }}>
                    {profile.first_name}
                </h2>
                <span style={{
                    fontFamily: "'Playfair Display', sans-serif",
                    fontSize: 26, fontWeight: 300, color: 'rgba(255,255,255,0.80)',
                }}>
          {profile.age}
        </span>
                {profile.is_verified && (
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <circle cx="11" cy="11" r="11" fill="#1565C0" />
                        <path d="M6 11l3.5 3.5 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </div>

            {/* University + distance */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                {profile.university && (
                    <span style={{
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 13, color: 'rgba(255,255,255,0.75)',
                        display: 'flex', alignItems: 'center', gap: 5,
                    }}>
            🎓 {profile.university}
          </span>
                )}
                {profile.faculty && (
                    <span style={{
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 13, color: 'rgba(255,255,255,0.65)',
                    }}>
            · {profile.faculty}
          </span>
                )}
                {profile.distance_km !== undefined && (
                    <span style={{
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 13, color: 'rgba(255,255,255,0.55)',
                        display: 'flex', alignItems: 'center', gap: 4,
                    }}>
            📍 {profile.distance_km < 1 ? 'Tout près' : `${profile.distance_km} km`}
          </span>
                )}
            </div>

            {/* Expanded content */}
            <motion.div
                animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
                style={{ overflow: 'hidden' }}
            >
                {/* Bio */}
                {profile.bio && (
                    <p style={{
                        fontFamily: "'Playfair Display', serif",
                        fontStyle: 'italic',
                        fontSize: 15, color: 'rgba(255,255,255,0.80)',
                        lineHeight: 1.7, marginBottom: 16,
                    }}>
                        "{profile.bio}"
                    </p>
                )}

                {/* Interests */}
                {profile.interests?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                        {profile.interests.slice(0, 8).map(interest => (
                            <span key={interest} style={{
                                background: 'rgba(212,175,55,0.15)',
                                border: '1px solid rgba(212,175,55,0.35)',
                                color: '#D4AF37',
                                padding: '5px 12px', borderRadius: 20,
                                fontFamily: "'Playfair Display', sans-serif",
                                fontSize: 12, fontWeight: 500,
                            }}>
                {interest}
              </span>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Collapse/expand cue */}
            <div style={{ textAlign: 'center', marginTop: 6 }}>
                <svg width="20" height="12" viewBox="0 0 20 12" fill="none"
                     style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.3s' }}>
                    <path d="M2 2l8 8 8-8" stroke="rgba(255,255,255,0.40)" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>
        </motion.div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// SWIPE CARD — Main export
// ══════════════════════════════════════════════════════════════════════════════
function SwipeCard({
                       profile,
                       onSwipe,          // fn(profileId, direction: 'like'|'nope'|'superlike')
                       onSuperLike,
                       isTop,            // only top card is interactive
                       stackIndex,       // 0 = top, 1 = second, 2 = third
                   }) {
    const { T, isDark } = useTheme();
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const controls = useAnimation();

    const [photoIndex, setPhotoIndex] = useState(0);
    const [swipeDir, setSwipeDir] = useState(null);
    const dragStartX = useRef(0);

    const photos = profile.photos?.length > 0
        ? profile.photos
        : [{ url: profile.photo
                ? getBaseUrl() + profile.photo
                : (profile.avatar || 'https://via.placeholder.com/400x600') }];

    // Track direction for overlay
    const rotate = useTransform(x, [-300, 0, 300], [-25, 0, 25]);
    const rightOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
    const leftOpacity  = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
    const upOpacity    = useTransform(y, [-80, SUPERLIKE_THRESHOLD], [1, 0]);
    const cardScale    = useTransform(x, [-300, 0, 300], [0.95, 1, 0.95]);

    const handleDragEnd = useCallback(async (_, info) => {
        const { offset, velocity } = info;

        // Super like (swipe up)
        if (offset.y < SUPERLIKE_THRESHOLD || velocity.y < -600) {
            setSwipeDir('up');
            await controls.start({ y: -800, opacity: 0, transition: { duration: 0.4 } });
            onSwipe(profile.id, 'superlike');
            return;
        }

        // Like (swipe right)
        if (offset.x > SWIPE_THRESHOLD || velocity.x > 600) {
            setSwipeDir('right');
            await controls.start({ x: 800, rotate: 20, opacity: 0, transition: { duration: 0.35 } });
            onSwipe(profile.id, 'like');
            return;
        }

        // Nope (swipe left)
        if (offset.x < -SWIPE_THRESHOLD || velocity.x < -600) {
            setSwipeDir('left');
            await controls.start({ x: -800, rotate: -20, opacity: 0, transition: { duration: 0.35 } });
            onSwipe(profile.id, 'nope');
            return;
        }

        // Snap back
        setSwipeDir(null);
        controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } });
    }, [controls, onSwipe, profile.id]);

    // Tap left/right to change photo
    const handleTap = useCallback((e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const tapX  = e.clientX - rect.left;
        if (tapX < rect.width * 0.35) {
            setPhotoIndex(i => Math.max(0, i - 1));
        } else if (tapX > rect.width * 0.65) {
            setPhotoIndex(i => Math.min(photos.length - 1, i + 1));
        }
    }, [photos.length]);

    // Button swipe triggers (for action buttons below)
    const triggerSwipe = useCallback(async (direction) => {
        setSwipeDir(direction);
        if (direction === 'like') {
            await controls.start({ x: 800, rotate: 20, opacity: 0, transition: { duration: 0.4 } });
        } else if (direction === 'nope') {
            await controls.start({ x: -800, rotate: -20, opacity: 0, transition: { duration: 0.4 } });
        } else if (direction === 'superlike') {
            await controls.start({ y: -800, opacity: 0, transition: { duration: 0.4 } });
        }
        onSwipe(profile.id, direction);
    }, [controls, onSwipe, profile.id]);

    // Stack visual offset
    const stackScale  = 1 - stackIndex * 0.04;
    const stackY      = stackIndex * 14;
    const stackBrightness = 1 - stackIndex * 0.08;

    return (
        <motion.div
            style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                x: isTop ? x : 0,
                y: isTop ? y : stackY,
                rotate: isTop ? rotate : 0,
                scale: isTop ? cardScale : stackScale,
                zIndex: 10 - stackIndex,
                filter: `brightness(${stackBrightness})`,
                transformOrigin: 'center 110%',
                cursor: isTop ? 'grab' : 'default',
            }}
            animate={isTop ? controls : { scale: stackScale, y: stackY }}
            drag={isTop ? true : false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.8}
            onDragStart={() => { dragStartX.current = x.get(); }}
            onDrag={(_, info) => {
                if (info.offset.x > 20) setSwipeDir('right');
                else if (info.offset.x < -20) setSwipeDir('left');
                else if (info.offset.y < -20) setSwipeDir('up');
                else setSwipeDir(null);
            }}
            onDragEnd={handleDragEnd}
            whileDrag={{ cursor: 'grabbing' }}
        >
            <div
                onClick={isTop ? handleTap : undefined}
                style={{
                    width: '100%', height: '100%',
                    borderRadius: 28,
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: isTop
                        ? '0 30px 80px rgba(0,0,0,0.30), 0 8px 20px rgba(0,0,0,0.15)'
                        : 'none',
                    userSelect: 'none',
                }}
            >
                {/* Photo */}
                <img
                    src={photos[photoIndex]?.url}
                    alt={profile.first_name}
                    draggable={false}
                    style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        userSelect: 'none',
                        pointerEvents: 'none',
                    }}
                />

                {/* Photo tap zones gradient */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, transparent 30%, transparent 50%, rgba(0,0,0,0.04) 100%)',
                    pointerEvents: 'none',
                }} />

                {/* Photo dots */}
                {photos.length > 1 && (
                    <div style={{ position: 'absolute', top: 16, left: 0, right: 0 }}>
                        <PhotoDots total={photos.length} current={photoIndex} />
                    </div>
                )}

                {/* Like overlay */}
                <motion.div
                    style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(76,175,80,0.25)',
                        opacity: rightOpacity,
                        pointerEvents: 'none',
                    }}
                />
                {/* Nope overlay */}
                <motion.div
                    style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(244,67,54,0.25)',
                        opacity: leftOpacity,
                        pointerEvents: 'none',
                    }}
                />
                {/* Super like overlay */}
                <motion.div
                    style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(33,150,243,0.25)',
                        opacity: upOpacity,
                        pointerEvents: 'none',
                    }}
                />

                {/* Swipe labels */}
                {isTop && <SwipeOverlay direction={swipeDir} />}

                {/* Profile info drawer */}
                {isTop && <ProfileDrawer profile={profile} T={T} isDark={isDark} />}
            </div>

            {/* Action buttons — only for top card, render outside card */}
        </motion.div>
    );
}

// ─── Action Buttons row ───────────────────────────────────────────────────────
// ─── UNDO — "Le temps suspendu" (Premium) ────────────────────────────────────
function UndoButton({ onClick, enabled, isPremium }) {
    const [phase, setPhase] = useState(0); // 0 idle | 1 spin | 2 premium shimmer

    const handleClick = () => {
        if (!enabled) return;
        if (!isPremium) {
            setPhase(2);
            setTimeout(() => { setPhase(0); onClick(); }, 600);
            return;
        }
        if (phase !== 0) return;
        setPhase(1);
        onClick();
        setTimeout(() => setPhase(0), 750);
    };

    const active = enabled;
    const color  = active ? '#F2C94C' : '#555';

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Golden spiral particles */}
            <AnimatePresence>
                {phase === 1 && Array.from({ length: 7 }, (_, i) => {
                    const a = (i / 7) * Math.PI * 2;
                    return (
                        <motion.div key={i}
                                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                    animate={{ x: Math.cos(a) * 28, y: Math.sin(a) * 28, opacity: 0, scale: 0 }}
                                    transition={{ duration: 0.55, delay: i * 0.04, ease: [0.22, 0.68, 0, 1.2] }}
                                    style={{
                                        position: 'absolute', width: 5, height: 5, borderRadius: '50%',
                                        background: '#F2C94C', pointerEvents: 'none', zIndex: 10,
                                    }}
                        />
                    );
                })}
            </AnimatePresence>

            {/* Premium gold shimmer */}
            <AnimatePresence>
                {phase === 2 && (
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0.85 }}
                        animate={{ scale: 2.8, opacity: 0 }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                        style={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(242,201,76,0.85), transparent 70%)',
                            pointerEvents: 'none', zIndex: 1,
                        }}
                    />
                )}
            </AnimatePresence>

            <motion.button
                onClick={handleClick}
                animate={
                    phase === 1 ? { rotate: [0, -360], scale: [1, 1.2, 0.88, 1] } :
                        phase === 2 ? { scale: [1, 1.3, 1] } : {}
                }
                transition={{ duration: 0.65, ease: 'easeInOut' }}
                whileHover={active ? { scale: 1.13, y: -3 } : {}}
                whileTap={active ? { scale: 0.88 } : {}}
                title="Annuler le dernier swipe"
                style={{
                    width: 46, height: 46, borderRadius: '50%',
                    border: `1.5px solid ${active ? `${color}55` : 'rgba(255,255,255,0.10)'}`,
                    background: active
                        ? `radial-gradient(circle at 35% 32%, ${color}1E, ${color}08)`
                        : 'rgba(255,255,255,0.04)',
                    color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: active ? 'pointer' : 'not-allowed',
                    boxShadow: active ? `0 4px 18px ${color}2E` : 'none',
                    position: 'relative', zIndex: 3,
                    opacity: active ? 1 : 0.35,
                }}
            >
                {!isPremium && active && (
                    <span style={{ position: 'absolute', top: -3, right: -3, fontSize: 9, lineHeight: 1 }}>👑</span>
                )}
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10a6 6 0 1 1 1.5 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                    <path d="M4 6v4h4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </motion.button>
        </div>
    );
}

// ─── NOPE —  ────────────────────────────────────────────
const NOPE_SHARDS = Array.from({ length: 12 }, (_, i) => ({
    angle: (i / 12) * 360 + (Math.random() - 0.5) * 25,
    dist:  26 + Math.random() * 20,
    delay: i * 0.022,
    w: 3 + Math.random() * 5,
    h: 2 + Math.random() * 3,
}));

function NopeButton({ onClick }) {
    const [phase, setPhase] = useState(0);

    const handleClick = () => {
        if (phase !== 0) return;
        setPhase(1);
        onClick();
        setTimeout(() => setPhase(0), 750);
    };

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AnimatePresence>
                {phase === 1 && NOPE_SHARDS.map((s, i) => (
                    <motion.div key={i}
                                initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                                animate={{
                                    x: Math.cos(s.angle * Math.PI / 180) * s.dist,
                                    y: Math.sin(s.angle * Math.PI / 180) * s.dist,
                                    opacity: 0, scale: 0, rotate: s.angle * 0.8,
                                }}
                                transition={{ duration: 0.52, delay: s.delay, ease: 'easeOut' }}
                                style={{
                                    position: 'absolute', width: s.w, height: s.h,
                                    borderRadius: 1.5, background: '#EF5350',
                                    pointerEvents: 'none', zIndex: 10,
                                }}
                    />
                ))}
            </AnimatePresence>

            <AnimatePresence>
                {phase === 1 && (
                    <motion.div
                        initial={{ scale: 0.7, opacity: 0.7 }}
                        animate={{ scale: 3, opacity: 0 }}
                        transition={{ duration: 0.42, ease: 'easeOut' }}
                        style={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            border: '2px solid rgba(239,83,80,0.75)',
                            pointerEvents: 'none', zIndex: 2,
                        }}
                    />
                )}
            </AnimatePresence>

            <motion.button
                onClick={handleClick}
                animate={phase === 1 ? {
                    x: [-7, 7, -5, 5, -2, 2, 0],
                    scale: [1, 1.18, 0.84, 1.08, 1],
                    boxShadow: [
                        '0 6px 20px rgba(239,83,80,0.25)',
                        '0 0 40px rgba(239,83,80,0.75), 0 0 70px rgba(239,83,80,0.35)',
                        '0 6px 20px rgba(239,83,80,0.25)',
                    ],
                } : {}}
                transition={{ duration: 0.38, ease: 'easeInOut' }}
                whileHover={{ scale: 1.11, y: -3 }}
                whileTap={{ scale: 0.88 }}
                title="Passer"
                style={{
                    width: 60, height: 60, borderRadius: '50%',
                    border: `2px solid rgba(239,83,80,${phase === 1 ? '0.75' : '0.28'})`,
                    background: phase === 1
                        ? 'radial-gradient(circle at 38% 32%, rgba(239,83,80,0.38), rgba(239,83,80,0.14))'
                        : 'rgba(239,83,80,0.08)',
                    color: '#EF5350',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(239,83,80,0.22)',
                    position: 'relative', zIndex: 3,
                }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M18 6L6 18" stroke="#EF5350" strokeWidth="2.6" strokeLinecap="round"/>
                </svg>
            </motion.button>
        </div>
    );
}

// ─── LIKE —  ──────────────────────────────────────────
const LIKE_PETALS = Array.from({ length: 15 }, (_, i) => {
    const angle  = (i / 15) * Math.PI * 2 - Math.PI / 2;
    const radius = 46 + Math.random() * 26;
    return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        rotate: Math.random() * 360,
        scale:  0.55 + Math.random() * 0.95,
        delay:  Math.random() * 0.10,
        shape: ['🌹','💗','✨','💖','🌸'][i % 5],
    };
});

function LikeButton({ onLike }) {
    const [phase, setPhase] = useState(0); // 0 idle | 1 burst | 2 settle

    const handleLike = () => {
        if (phase !== 0) return;
        setPhase(1);
        onLike();
        setTimeout(() => setPhase(2), 490);
        setTimeout(() => setPhase(0), 920);
    };

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AnimatePresence>
                {phase === 1 && (
                    <motion.div
                        initial={{ scale: 0.4, opacity: 0.9 }}
                        animate={{ scale: 4.2, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.62, ease: 'easeOut' }}
                        style={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(233,30,99,0.65) 0%, transparent 68%)',
                            pointerEvents: 'none', zIndex: 1,
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {phase === 1 && LIKE_PETALS.map((p, i) => (
                    <motion.div key={i}
                                initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                                animate={{ x: p.x, y: p.y, scale: p.scale, opacity: 0, rotate: p.rotate }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.72, delay: p.delay, ease: [0.22, 0.68, 0, 1.2] }}
                                style={{
                                    position: 'absolute', top: '50%', left: '50%',
                                    transform: 'translate(-50%,-50%)',
                                    pointerEvents: 'none', zIndex: 10,
                                    fontSize: 14, lineHeight: 1,
                                }}
                    >
                        {p.shape}
                    </motion.div>
                ))}
            </AnimatePresence>

            <AnimatePresence>
                {phase === 1 && [0, 1, 2].map(i => (
                    <motion.div key={i}
                                initial={{ scale: 0.7, opacity: 0.75 }}
                                animate={{ scale: 2.6 + i * 0.9, opacity: 0 }}
                                transition={{ duration: 0.50 + i * 0.13, delay: i * 0.07, ease: 'easeOut' }}
                                style={{
                                    position: 'absolute', inset: 0, borderRadius: '50%',
                                    border: `${2.2 - i * 0.5}px solid rgba(233,30,99,0.58)`,
                                    pointerEvents: 'none', zIndex: 2,
                                }}
                    />
                ))}
            </AnimatePresence>

            <motion.button
                onClick={handleLike}
                animate={phase === 1 ? {
                    scale: [1, 1.52, 0.84, 1.22, 1],
                    rotate: [0, -16, 13, -7, 0],
                    boxShadow: [
                        '0 8px 30px rgba(233,30,99,0.30)',
                        '0 0 60px rgba(233,30,99,0.88), 0 0 100px rgba(233,30,99,0.45)',
                        '0 0 28px rgba(233,30,99,0.45)',
                        '0 8px 30px rgba(233,30,99,0.30)',
                    ],
                } : {}}
                transition={{ duration: 0.56, ease: [0.22, 0.68, 0, 1.2] }}
                whileHover={!phase ? { scale: 1.16, y: -5 } : {}}
                whileTap={!phase ? { scale: 0.87 } : {}}
                title="J'aime"
                style={{
                    width: 68, height: 68, borderRadius: '50%',
                    border: `2px solid rgba(233,30,99,${phase === 1 ? '0.88' : '0.32'})`,
                    background: phase === 1
                        ? 'radial-gradient(circle at 38% 30%, rgba(233,30,99,0.52), rgba(233,30,99,0.22))'
                        : 'rgba(233,30,99,0.09)',
                    color: '#E91E63',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: phase ? 'default' : 'pointer',
                    boxShadow: '0 8px 30px rgba(233,30,99,0.28)',
                    position: 'relative', zIndex: 3,
                }}
            >
                {phase === 1 && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.42 }}
                        style={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            background: 'radial-gradient(circle at 38% 30%, rgba(255,255,255,0.58), transparent 65%)',
                            pointerEvents: 'none',
                        }}
                    />
                )}
                <motion.svg
                    width="32" height="32" viewBox="0 0 28 28" fill="none"
                    animate={phase === 1 ? { scale: [1, 1.45, 1] } : {}}
                    transition={{ duration: 0.44 }}
                >
                    <path
                        d="M14 24s-11-7.5-11-14A5.5 5.5 0 0 1 14 6a5.5 5.5 0 0 1 11 4c0 6.5-11 14-11 14z"
                        fill={phase === 1 ? '#E91E63' : 'rgba(233,30,99,0.22)'}
                        stroke="#E91E63" strokeWidth="1.8"
                    />
                </motion.svg>
            </motion.button>
        </div>
    );
}

// ─── SUPERLIKE —  ────────────────────────────────
const STAR_RAYS = Array.from({ length: 8 }, (_, i) => ({
    angle: (i / 8) * 360,
    dist:  30 + Math.random() * 18,
    delay: i * 0.038,
}));

function SuperLikeButton({ onClick, enabled, isPremium }) {
    const [phase, setPhase] = useState(0);

    const handleClick = () => {
        if (!isPremium && !enabled) {
            setPhase(2);
            setTimeout(() => { setPhase(0); onClick(); }, 600);
            return;
        }
        if (phase !== 0) return;
        setPhase(1);
        onClick();
        setTimeout(() => setPhase(0), 820);
    };

    const active = enabled || isPremium;
    const color  = active ? '#42A5F5' : '#555';

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AnimatePresence>
                {phase === 1 && STAR_RAYS.map((r, i) => (
                    <motion.div key={i}
                                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                animate={{
                                    x: Math.cos(r.angle * Math.PI / 180) * r.dist,
                                    y: Math.sin(r.angle * Math.PI / 180) * r.dist,
                                    opacity: 0, scale: 0,
                                }}
                                transition={{ duration: 0.58, delay: r.delay, ease: 'easeOut' }}
                                style={{
                                    position: 'absolute', width: 3, height: 10, borderRadius: 2,
                                    background: 'linear-gradient(to bottom, rgba(66,165,245,0.95), transparent)',
                                    pointerEvents: 'none', zIndex: 10,
                                    transform: `rotate(${r.angle}deg)`, transformOrigin: 'center bottom',
                                }}
                    />
                ))}
            </AnimatePresence>

            <AnimatePresence>
                {phase === 1 && [0,1,2,3,4].map(i => (
                    <motion.div key={`s${i}`}
                                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                                animate={{
                                    x: Math.cos((i/5)*Math.PI*2) * 35,
                                    y: Math.sin((i/5)*Math.PI*2) * 35,
                                    opacity: [1,1,0], scale: [0,1.3,0],
                                }}
                                transition={{ duration: 0.65, delay: 0.08 + i * 0.06 }}
                                style={{ position: 'absolute', pointerEvents: 'none', zIndex: 10, fontSize: 11 }}
                    >⭐</motion.div>
                ))}
            </AnimatePresence>

            <AnimatePresence>
                {phase === 2 && (
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0.85 }}
                        animate={{ scale: 2.8, opacity: 0 }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                        style={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(242,201,76,0.88), transparent 70%)',
                            pointerEvents: 'none', zIndex: 1,
                        }}
                    />
                )}
            </AnimatePresence>

            <motion.button
                onClick={handleClick}
                animate={
                    phase === 1 ? {
                        scale: [1, 1.38, 0.86, 1.14, 1],
                        rotate: [0, 20, -13, 7, 0],
                        boxShadow: [
                            '0 6px 22px rgba(66,165,245,0.28)',
                            '0 0 48px rgba(66,165,245,0.85)',
                            '0 6px 22px rgba(66,165,245,0.28)',
                        ],
                    } : phase === 2 ? { scale: [1, 1.28, 1] } : {}
                }
                transition={{ duration: 0.56, ease: [0.22, 0.68, 0, 1.2] }}
                whileHover={{ scale: 1.12, y: -3 }}
                whileTap={{ scale: 0.88 }}
                title="Super Like"
                style={{
                    width: 54, height: 54, borderRadius: '50%',
                    border: `1.5px solid rgba(66,165,245,${phase === 1 ? '0.82' : active ? '0.28' : '0.12'})`,
                    background: phase === 1
                        ? 'radial-gradient(circle at 38% 32%, rgba(66,165,245,0.48), rgba(66,165,245,0.16))'
                        : active ? 'rgba(66,165,245,0.08)' : 'rgba(255,255,255,0.04)',
                    color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: active ? '0 6px 22px rgba(66,165,245,0.22)' : 'none',
                    position: 'relative', zIndex: 3,
                    opacity: active ? 1 : 0.42,
                }}
            >
                {!isPremium && (
                    <span style={{ position: 'absolute', top: -3, right: -3, fontSize: 9, lineHeight: 1 }}>👑</span>
                )}
                <motion.svg
                    width="22" height="22" viewBox="0 0 22 22" fill="none"
                    animate={phase === 1 ? { scale: [1, 1.5, 1], rotate: [0, 18, 0] } : {}}
                    transition={{ duration: 0.46 }}
                >
                    <path
                        d="M11 2l2.4 6.6H20l-5.2 4 2 6.4L11 15l-5.8 4 2-6.4L2 8.6h6.6L11 2z"
                        stroke={color} strokeWidth="1.8" strokeLinejoin="round"
                        fill={phase === 1 ? 'rgba(66,165,245,0.52)' : 'rgba(66,165,245,0.12)'}
                    />
                </motion.svg>
            </motion.button>
        </div>
    );
}

// ─── BOOST —  ────────────────────────────────
const BOLT_POSITIONS = Array.from({ length: 6 }, (_, i) => ({
    angle: i * 60 + 30,
    dist:  26 + Math.random() * 12,
    delay: i * 0.048,
}));

function BoostButton({ onClick, enabled, isPremium }) {
    const [phase, setPhase] = useState(0);

    const handleClick = () => {
        if (!isPremium && !enabled) {
            setPhase(2);
            setTimeout(() => { setPhase(0); onClick(); }, 600);
            return;
        }
        setPhase(1);
        onClick();
        setTimeout(() => setPhase(0), 800);
    };

    const active = enabled || isPremium;
    const color  = active ? '#AB47BC' : '#555';

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AnimatePresence>
                {phase === 1 && BOLT_POSITIONS.map((b, i) => (
                    <motion.div key={i}
                                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                animate={{
                                    x: Math.cos(b.angle * Math.PI / 180) * b.dist,
                                    y: Math.sin(b.angle * Math.PI / 180) * b.dist,
                                    opacity: 0, scale: 0,
                                }}
                                transition={{ duration: 0.5, delay: b.delay, ease: 'easeOut' }}
                                style={{ position: 'absolute', fontSize: 13, pointerEvents: 'none', zIndex: 10 }}
                    >⚡</motion.div>
                ))}
            </AnimatePresence>

            <AnimatePresence>
                {phase === 1 && [0,1].map(i => (
                    <motion.div key={i}
                                initial={{ scale: 0.75, opacity: 0.75 }}
                                animate={{ scale: 2.6 + i * 0.9, opacity: 0 }}
                                transition={{ duration: 0.46 + i * 0.1, delay: i * 0.08 }}
                                style={{
                                    position: 'absolute', inset: 0, borderRadius: '50%',
                                    border: '2px solid rgba(171,71,188,0.72)',
                                    pointerEvents: 'none', zIndex: 2,
                                }}
                    />
                ))}
            </AnimatePresence>

            <AnimatePresence>
                {phase === 2 && (
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0.85 }}
                        animate={{ scale: 2.8, opacity: 0 }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                        style={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(242,201,76,0.88), transparent 70%)',
                            pointerEvents: 'none', zIndex: 1,
                        }}
                    />
                )}
            </AnimatePresence>

            <motion.button
                onClick={handleClick}
                animate={
                    phase === 1 ? {
                        scale: [1, 1.32, 0.88, 1.16, 1],
                        boxShadow: [
                            '0 4px 18px rgba(171,71,188,0.28)',
                            '0 0 50px rgba(171,71,188,0.88), 0 0 90px rgba(171,71,188,0.42)',
                            '0 4px 18px rgba(171,71,188,0.28)',
                        ],
                    } : phase === 2 ? { scale: [1, 1.28, 1] } : {}
                }
                transition={{ duration: 0.52, ease: [0.22, 0.68, 0, 1.2] }}
                whileHover={{ scale: 1.11, y: -3 }}
                whileTap={{ scale: 0.88 }}
                title="Booster mon profil"
                style={{
                    width: 46, height: 46, borderRadius: '50%',
                    border: `1.5px solid rgba(171,71,188,${phase === 1 ? '0.82' : active ? '0.28' : '0.10'})`,
                    background: phase === 1
                        ? 'radial-gradient(circle at 38% 32%, rgba(171,71,188,0.45), rgba(171,71,188,0.16))'
                        : active ? 'rgba(171,71,188,0.08)' : 'rgba(255,255,255,0.04)',
                    color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: active ? '0 4px 18px rgba(171,71,188,0.24)' : 'none',
                    position: 'relative', zIndex: 3,
                    opacity: active ? 1 : 0.40,
                }}
            >
                {!isPremium && (
                    <span style={{ position: 'absolute', top: -3, right: -3, fontSize: 9, lineHeight: 1 }}>👑</span>
                )}
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2L7 9h5l-2 9 7-10h-5l2-6z"
                          stroke={color} strokeWidth="1.9"
                          fill={phase === 1 ? 'rgba(171,71,188,0.42)' : 'rgba(171,71,188,0.14)'}
                          strokeLinejoin="round"/>
                </svg>
            </motion.button>
        </div>
    );
}

// ─── Barre d'action — pill glassmorphism flottant ─────────────────────────────
function ActionButtons({ onNope, onSuperLike, onLike, onBoost, onRewind,
                           canRewind, canSuperLike, canBoost, isPremium, T }) {
    const { isDark } = useTheme();

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10,
            background: isDark
                ? 'rgba(12,6,14,0.88)'
                : 'rgba(255,248,252,0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 60,
            padding: '13px 22px',
            border: `1px solid rgba(233,30,99,${isDark ? '0.14' : '0.10'})`,
            boxShadow: isDark
                ? '0 10px 48px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.04)'
                : '0 10px 48px rgba(233,30,99,0.10), inset 0 1px 0 rgba(255,255,255,0.85)',
        }}>
            <UndoButton      onClick={onRewind}    enabled={canRewind}    isPremium={isPremium} />
            <NopeButton      onClick={onNope} />
            <LikeButton      onLike={onLike} />
            <SuperLikeButton onClick={onSuperLike} enabled={canSuperLike} isPremium={isPremium} />
            <BoostButton     onClick={onBoost}     enabled={canBoost}     isPremium={isPremium} />
        </div>
    );
}

// ─── ActionBtn conservé pour compatibilité ────────────────────────────────────
function ActionBtn({ onClick, size, color, shadow, disabled, children, title }) {
    return (
        <motion.button
            onClick={onClick} disabled={disabled} title={title}
            whileHover={disabled ? {} : { scale: 1.12, y: -3 }}
            whileTap={disabled ? {} : { scale: 0.92 }}
            style={{
                width: size, height: size, borderRadius: '50%',
                border: `1.5px solid ${color}44`,
                background: `${color}14`, color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: disabled ? 'not-allowed' : 'pointer',
                boxShadow: shadow, flexShrink: 0,
                opacity: disabled ? 0.45 : 1,
            }}
        >
            {children}
        </motion.button>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
// EMPTY DECK —
// ══════════════════════════════════════════════════════════════════════════════
const POEM_LINES = [
    "Tu as fait glisser des regards, des sourires, des silences.",
    "Peut-être que l'amour ne frappe pas à la porte —",
    "il surgit, un mardi ordinaire,",
    "là où on ne l'attendait plus.",
    "Reviens demain. Il sera peut-être là.",
];

function EmptyDeck({ T, isDark }) {
    const [lineIndex, setLineIndex] = useState(0);

    useEffect(() => {
        const t = setInterval(() => {
            setLineIndex(i => (i + 1) % POEM_LINES.length);
        }, 3200);
        return () => clearInterval(t);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: '100%', padding: '40px 32px', textAlign: 'center',
                position: 'relative', overflow: 'hidden',
            }}
        >
            {/* Ambient glow */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: isDark
                    ? 'radial-gradient(ellipse at 50% 40%, rgba(233,30,99,0.06) 0%, transparent 70%)'
                    : 'radial-gradient(ellipse at 50% 40%, rgba(233,30,99,0.05) 0%, transparent 70%)',
            }} />

            {/* Pulsing heart emblem */}
            <div style={{ position: 'relative', width: 110, height: 110, marginBottom: 36 }}>
                {[1, 2, 3].map(i => (
                    <motion.div key={i}
                                animate={{ scale: [1, 2.4], opacity: [0.35, 0] }}
                                transition={{ duration: 2.8, delay: i * 0.75, repeat: Infinity, ease: 'easeOut' }}
                                style={{
                                    position: 'absolute', inset: 0, borderRadius: '50%',
                                    border: `1.5px solid ${T.gold}`,
                                }}
                    />
                ))}
                <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: `radial-gradient(circle at 40% 35%, ${T.gold}22, transparent 70%)`,
                    border: `1.5px solid ${T.gold}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <motion.svg
                        width="46" height="46" viewBox="0 0 46 46" fill="none"
                        animate={{ scale: [1, 1.10, 1] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <path
                            d="M23 40s-17-11-17-22A9 9 0 0 1 23 11a9 9 0 0 1 17 7c0 11-17 22-17 22z"
                            fill={`${T.gold}22`} stroke={T.gold} strokeWidth="1.8"
                        />
                    </motion.svg>
                </div>
            </div>

            {/* Title */}
            <h2 style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                fontSize: 26, fontWeight: 700,
                color: T.text, marginBottom: 20, lineHeight: 1.35,
                letterSpacing: '0.02em',
            }}>
                Le campus se repose
            </h2>

            {/* Rotating poem */}
            <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
                <AnimatePresence mode="wait">
                    <motion.p key={lineIndex}
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -14 }}
                              transition={{ duration: 0.55, ease: 'easeInOut' }}
                              style={{
                                  fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                                  fontStyle: 'italic',
                                  fontSize: 17, color: T.textSoft,
                                  lineHeight: 1.75, maxWidth: 290,
                                  margin: 0,
                              }}
                    >
                        "{POEM_LINES[lineIndex]}"
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* Poem progress dots */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 36 }}>
                {POEM_LINES.map((_, i) => (
                    <motion.div key={i}
                                animate={{ scale: i === lineIndex ? 1.5 : 1, opacity: i === lineIndex ? 1 : 0.28 }}
                                transition={{ duration: 0.35 }}
                                style={{ width: 5, height: 5, borderRadius: '50%', background: T.gold }}
                    />
                ))}
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 270 }}>
                <motion.button
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                        background: `linear-gradient(135deg, ${T.gold}, ${T.goldDark || '#B8860B'})`,
                        color: '#1A0812', border: 'none',
                        padding: '16px 32px', borderRadius: 50,
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 14, fontWeight: 700,
                        letterSpacing: '0.06em', cursor: 'pointer',
                        boxShadow: `0 8px 32px ${T.gold}44`,
                    }}
                >
                    ✦ Améliorer mon profil
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                        background: 'none', border: `1px solid ${T.gold}44`,
                        color: T.textSoft, borderRadius: 50,
                        padding: '14px 32px',
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 13, cursor: 'pointer',
                    }}
                >
                    Élargir ma zone de recherche
                </motion.button>
            </div>
        </motion.div>
    );
}


// ─── Boost banner ──────────────────────────────────────────────────────────────
function BoostBanner({ boostStatus, onBoostClick, T }) {
    if (!boostStatus?.active) return null;
    const remaining = Math.max(0, boostStatus.remaining_seconds);
    const minutes   = Math.floor(remaining / 60);
    const seconds   = remaining % 60;

    return (
        <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{
                background: 'linear-gradient(135deg, #9C27B0, #673AB7)',
                padding: '10px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 4px 20px rgba(156,39,176,0.35)',
            }}
        >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L5.5 7H9l-1.5 8L14 6H10L12 1z" fill="#fff" />
            </svg>
            <span style={{
                fontFamily: "'Playfair Display', sans-serif",
                fontSize: 13, fontWeight: 600, color: '#fff',
            }}>
        Boost actif — {minutes}:{String(seconds).padStart(2, '0')} restantes
      </span>
        </motion.div>
    );
}

// ─── Filter bar ────────────────────────────────────────────────────────────────
function FilterBar({ filters, onChange, T, isDark }) {
    const [open, setOpen] = useState(false);
    const [local, setLocal] = useState(filters);

    return (
        <>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: isDark ? 'rgba(30,16,32,0.80)' : 'rgba(255,255,255,0.80)',
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${T.gold}33`,
                    borderRadius: 50, padding: '8px 16px',
                    cursor: 'pointer',
                    fontFamily: "'Playfair Display', sans-serif",
                    fontSize: 12, fontWeight: 600,
                    color: T.text,
                }}
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4h12M4 8h8M6 12h4" stroke={T.gold} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Filtres
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.97 }}
                        style={{
                            position: 'absolute', top: 52, right: 0,
                            width: 280,
                            background: isDark
                                ? 'rgba(20,10,22,0.96)'
                                : 'rgba(253,246,240,0.98)',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${T.gold}22`,
                            borderRadius: 20,
                            padding: 24,
                            boxShadow: T.shadowDeep,
                            zIndex: 100,
                        }}
                    >
                        <h4 style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 16, color: T.text,
                            marginBottom: 20,
                        }}>
                            Affiner la découverte
                        </h4>

                        {/* Age range */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{
                                fontFamily: "'Playfair Display', sans-serif",
                                fontSize: 11, fontWeight: 600,
                                letterSpacing: '0.1em', textTransform: 'uppercase',
                                color: T.textSoft, display: 'block', marginBottom: 10,
                            }}>
                                Tranche d'âge : {local.min_age || 18} – {local.max_age || 30} ans
                            </label>
                            <input type="range" min="18" max="40"
                                   value={local.max_age || 30}
                                   onChange={e => setLocal(l => ({ ...l, max_age: +e.target.value }))}
                                   style={{ width: '100%', accentColor: T.gold }}
                            />
                        </div>

                        {/* Distance */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{
                                fontFamily: "'Playfair Display', sans-serif",
                                fontSize: 11, fontWeight: 600,
                                letterSpacing: '0.1em', textTransform: 'uppercase',
                                color: T.textSoft, display: 'block', marginBottom: 10,
                            }}>
                                Distance max : {local.max_distance || 50} km
                            </label>
                            <input type="range" min="1" max="100"
                                   value={local.max_distance || 50}
                                   onChange={e => setLocal(l => ({ ...l, max_distance: +e.target.value }))}
                                   style={{ width: '100%', accentColor: T.gold }}
                            />
                        </div>

                        {/* Gender */}
                        <div style={{ marginBottom: 24 }}>
                            <label style={{
                                fontFamily: "'Playfair Display', sans-serif",
                                fontSize: 11, fontWeight: 600,
                                letterSpacing: '0.1em', textTransform: 'uppercase',
                                color: T.textSoft, display: 'block', marginBottom: 10,
                            }}>
                                Je cherche
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {['Femme', 'Homme', 'Tout'].map(g => (
                                    <button key={g}
                                            onClick={() => setLocal(l => ({ ...l, gender: g.toLowerCase() }))}
                                            style={{
                                                flex: 1, padding: '8px',
                                                borderRadius: 12,
                                                border: `1px solid ${local.gender === g.toLowerCase() ? T.gold : T.gold + '33'}`,
                                                background: local.gender === g.toLowerCase()
                                                    ? `${T.gold}22` : 'none',
                                                color: local.gender === g.toLowerCase() ? T.gold : T.textSoft,
                                                fontFamily: "'Playfair Display', sans-serif",
                                                fontSize: 12, fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => { onChange(local); setOpen(false); }}
                            style={{
                                width: '100%',
                                background: `linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
                                color: '#1A0812', border: 'none',
                                padding: '14px', borderRadius: 50,
                                fontFamily: "'Playfair Display', sans-serif",
                                fontSize: 13, fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            Appliquer les filtres
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// DISCOVER TAB — Main export
// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

//       // EXPLORE TAB — Main export
//
//
// ══════════════════════════════════════════════════════════════════════════════

const FREE_SWIPES_PER_DAY = 7;

function useDailySwipes(isPremium) {
    const KEY = 'll_swipes_today';
    const today = new Date().toDateString();

    const getState = () => {
        try {
            const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
            if (raw.date !== today) return { date: today, count: 0 };
            return raw;
        } catch { return { date: today, count: 0 }; }
    };

    const [state, setState] = useState(getState);
    const remaining = isPremium ? Infinity : Math.max(0, FREE_SWIPES_PER_DAY - state.count);
    const canSwipe  = isPremium || remaining > 0;

    const consume = () => {
        if (isPremium) return;
        const next = { date: today, count: state.count + 1 };
        localStorage.setItem(KEY, JSON.stringify(next));
        setState(next);
    };

    return { remaining, canSwipe, consume };
}

// ─── Card info overlay ────────────────────────────────────────────────────────
function CardInfo({ profile, expanded, onToggle }) {
    const { T } = useTheme();
    const age = profile.age ?? (profile.birthday ? calcAge(profile.birthday) : null);
    const interests = profile.interests?.map(i => typeof i === 'object' ? i.name : i) || [];

    const DEPT_LABELS = {
        SCIENCES: 'Sciences', TECH: 'Informatique', ARTS: 'Arts & Lettres',
        DROIT: 'Droit', MEDECINE: 'Médecine', ECONOMIE: 'Économie',
        EDUCATION: 'Éducation', OTHER: 'Autre',
    };
    const DEGREE_LABELS = {
        LICENCE1: 'L1', LICENCE2: 'L2', LICENCE3: 'L3',
        MASTER1: 'M1', MASTER2: 'M2', DOCTORAT: 'Doctorat', OTHER: '',
    };

    const dept   = DEPT_LABELS[profile.department] || profile.department || '';
    const degree = DEGREE_LABELS[profile.degree]   || profile.degree || '';

    return (
        <motion.div
            onClick={onToggle}
            animate={{ y: expanded ? 0 : '0%' }}
            style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.60) 55%, transparent 100%)',
                padding: expanded ? '100px 22px 28px' : '80px 22px 22px',
                borderRadius: '0 0 26px 26px',
                cursor: 'pointer',
                transition: 'padding 0.35s ease',
            }}
        >
            {/* Drag handle */}
            <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.30)', margin: '0 auto 14px' }} />

            {/* Name + age + verified */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{
                    fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                    fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1,
                }}>
                    {profile.first_name}
                </span>
                {age && (
                    <span style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 28, fontWeight: 300, color: 'rgba(255,255,255,0.75)',
                    }}>{age}</span>
                )}
                {profile.is_verified && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="10" fill="#1565C0"/>
                        <path d="M5 10l3.5 3.5L15 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                )}
            </div>

            {/* Dept + degree */}
            {(dept || degree) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F2C94C" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 600, color: '#F2C94C', letterSpacing: '0.02em' }}>
                        {dept}
                    </span>
                    {degree && (
                        <span style={{
                            fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 700,
                            background: 'rgba(242,201,76,0.20)', border: '1px solid rgba(242,201,76,0.40)',
                            color: '#F2C94C', padding: '2px 8px', borderRadius: 20,
                        }}>{degree}</span>
                    )}
                </div>
            )}

            {/* Interests */}
            {interests.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: expanded ? 14 : 0 }}>
                    {interests.slice(0, expanded ? 8 : 4).map((interest, i) => {
                        const COLORS = [
                            { bg: 'rgba(233,30,99,0.22)',  border: 'rgba(233,30,99,0.50)',  text: '#F48FB1' },
                            { bg: 'rgba(66,165,245,0.22)', border: 'rgba(66,165,245,0.50)', text: '#90CAF9' },
                            { bg: 'rgba(76,175,80,0.22)',  border: 'rgba(76,175,80,0.50)',  text: '#A5D6A7' },
                            { bg: 'rgba(171,71,188,0.22)', border: 'rgba(171,71,188,0.50)', text: '#CE93D8' },
                            { bg: 'rgba(255,152,0,0.22)',  border: 'rgba(255,152,0,0.50)',  text: '#FFCC80' },
                        ];
                        const c = COLORS[i % COLORS.length];
                        return (
                            <span key={interest} style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: 11, fontWeight: 600,
                                background: c.bg, border: `1px solid ${c.border}`,
                                color: c.text,
                                padding: '4px 11px', borderRadius: 20,
                                backdropFilter: 'blur(8px)',
                                letterSpacing: '0.02em',
                            }}>{interest}</span>
                        );
                    })}
                </div>
            )}
            {/* Bio — only when expanded */}
            <AnimatePresence>
                {expanded && profile.bio && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontStyle: 'italic', fontSize: 15,
                            color: 'rgba(255,255,255,0.78)', lineHeight: 1.65,
                            margin: '10px 0 0', overflow: 'hidden',
                        }}
                    >
                        "{profile.bio}"
                    </motion.p>
                )}
            </AnimatePresence>

            {/* Expand cue */}
            <motion.div
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}
            >
                <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
                    <path d="M2 2l7 6 7-6" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            </motion.div>
        </motion.div>
    );
}

// ─── Swipe overlay labels ─────────────────────────────────────────────────────
function SwipeLabel({ direction }) {
    const configs = {
        right: { label: 'J\'AIME', color: '#4CAF50', border: '#4CAF50', rotate: -22, top: 36, left: 24 },
        left:  { label: 'NOPE',   color: '#EF5350', border: '#EF5350', rotate: 22,  top: 36, right: 24 },
        up:    { label: 'SUPER',  color: '#42A5F5', border: '#42A5F5', rotate: 0,   top: 80, left: '50%' },
    };
    if (!direction || !configs[direction]) return null;
    const c = configs[direction];
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                position: 'absolute',
                top: c.top, left: c.left, right: c.right,
                transform: direction === 'up' ? 'translateX(-50%)' : `rotate(${c.rotate}deg)`,
                border: `3px solid ${c.border}`,
                borderRadius: 8,
                padding: '6px 14px',
                pointerEvents: 'none', zIndex: 20,
            }}
        >
            <span style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 26, fontWeight: 900,
                color: c.color, letterSpacing: '0.12em',
                textShadow: `0 0 20px ${c.color}88`,
            }}>{c.label}</span>
        </motion.div>
    );
}

// ─── THE CARD ─────────────────────────────────────────────────────────────────
function DiscoverCard({ profile, onSwipe, isTop, stackIndex }) {
    const { T, isDark } = useTheme();
    const x        = useMotionValue(0);
    const y        = useMotionValue(0);
    const controls = useAnimation();
    const [photoIdx,  setPhotoIdx]  = useState(0);
    const [swipeDir,  setSwipeDir]  = useState(null);
    const [expanded,  setExpanded]  = useState(true);
    const dragStartX = useRef(0);

    const photos = profile.photos?.length > 0
        ? profile.photos.map(p => photoUrl(p.url || p))
        : [photoUrl(profile.photo) || profile.avatar || 'https://via.placeholder.com/400x700/1a0820/d4af37?text=?'];

    const rotate      = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
    const rightAlpha  = useTransform(x, [30, SWIPE_THRESHOLD], [0, 1]);
    const leftAlpha   = useTransform(x, [-SWIPE_THRESHOLD, -30], [1, 0]);
    const upAlpha     = useTransform(y, [-100, SUPERLIKE_THRESHOLD], [1, 0]);

    const handleDragEnd = useCallback(async (_, info) => {
        const { offset, velocity } = info;
        if (offset.y < SUPERLIKE_THRESHOLD || velocity.y < -600) {
            setSwipeDir('up');
            await controls.start({ y: -900, opacity: 0, transition: { duration: 0.38 } });
            onSwipe(profile.id, 'superlike'); return;
        }
        if (offset.x > SWIPE_THRESHOLD || velocity.x > 600) {
            setSwipeDir('right');
            await controls.start({ x: 900, rotate: 22, opacity: 0, transition: { duration: 0.32 } });
            onSwipe(profile.id, 'like'); return;
        }
        if (offset.x < -SWIPE_THRESHOLD || velocity.x < -600) {
            setSwipeDir('left');
            await controls.start({ x: -900, rotate: -22, opacity: 0, transition: { duration: 0.32 } });
            onSwipe(profile.id, 'nope'); return;
        }
        setSwipeDir(null);
        controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } });
    }, [controls, onSwipe, profile.id]);

    const handleTap = useCallback((e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const tx = e.clientX - rect.left;
        if (tx < rect.width * 0.33) setPhotoIdx(i => Math.max(0, i - 1));
        else if (tx > rect.width * 0.67) setPhotoIdx(i => Math.min(photos.length - 1, i + 1));
    }, [photos.length]);

    const stackScale = 1 - stackIndex * 0.045;
    const stackY     = stackIndex * 16;

    return (
        <motion.div
            style={{
                position: 'absolute', width: '100%', height: '100%',
                x: isTop ? x : 0, y: isTop ? y : stackY,
                rotate: isTop ? rotate : 0,
                scale: isTop ? 1 : stackScale,
                zIndex: 10 - stackIndex,
                transformOrigin: 'center 110%',
                cursor: isTop ? 'grab' : 'default',
            }}
            animate={isTop ? controls : { scale: stackScale, y: stackY }}
            drag={isTop}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.85}
            onDragStart={() => { dragStartX.current = x.get(); }}
            onDrag={(_, info) => {
                if      (info.offset.x >  25) setSwipeDir('right');
                else if (info.offset.x < -25) setSwipeDir('left');
                else if (info.offset.y < -25) setSwipeDir('up');
                else setSwipeDir(null);
            }}
            onDragEnd={handleDragEnd}
            whileDrag={{ cursor: 'grabbing' }}
        >
            <div
                onClick={isTop ? handleTap : undefined}
                style={{
                    width: '100%', height: '100%',
                    borderRadius: 26,
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: isTop
                        ? `0 32px 80px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.06)`
                        : 'none',
                    userSelect: 'none',
                    background: '#0F0810',
                }}
            >
                {/* Photo */}
                <img
                    src={photos[photoIdx]}
                    alt={profile.first_name}
                    draggable={false}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', userSelect: 'none' }}
                />

                {/* Vignette top */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '35%',
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 100%)',
                    pointerEvents: 'none',
                }} />

                {/* Photo indicator dots */}
                {photos.length > 1 && (
                    <div style={{
                        position: 'absolute', top: 14, left: 16, right: 16,
                        display: 'flex', gap: 4,
                    }}>
                        {photos.map((_, i) => (
                            <div key={i} style={{
                                flex: 1, height: 2.5, borderRadius: 2,
                                background: i === photoIdx ? '#fff' : 'rgba(255,255,255,0.30)',
                                transition: 'background 0.2s',
                            }} />
                        ))}
                    </div>
                )}

                {/* Swipe colour overlays */}
                <motion.div style={{ position: 'absolute', inset: 0, background: 'rgba(76,175,80,0.28)', opacity: rightAlpha, pointerEvents: 'none' }} />
                <motion.div style={{ position: 'absolute', inset: 0, background: 'rgba(239,83,80,0.28)', opacity: leftAlpha,  pointerEvents: 'none' }} />
                <motion.div style={{ position: 'absolute', inset: 0, background: 'rgba(66,165,245,0.28)', opacity: upAlpha,   pointerEvents: 'none' }} />

                {/* Swipe labels */}
                {isTop && <SwipeLabel direction={swipeDir} />}

                {/* Profile info */}
                {isTop && (
                    <CardInfo
                        profile={profile}
                        expanded={expanded}
                        onToggle={() => setExpanded(v => !v)}
                    />
                )}

                {/* Stack blur for non-top */}
                {!isTop && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: `rgba(${isDark ? '10,6,14' : '250,245,250'},${stackIndex * 0.18})`,
                        borderRadius: 26,
                    }} />
                )}
            </div>
        </motion.div>
    );
}

// ─── Action button row ────────────────────────────────────────────────────────
const BTN_NOPE  = { color: '#EF5350', shadow: 'rgba(239,83,80,0.45)',  label: 'Nope'       };
const BTN_UNDO  = { color: '#F2C94C', shadow: 'rgba(242,201,76,0.40)', label: 'Annuler'    };
const BTN_LIKE  = { color: '#E91E63', shadow: 'rgba(233,30,99,0.50)',  label: 'J\'aime'    };
const BTN_SUPER = { color: '#42A5F5', shadow: 'rgba(66,165,245,0.45)', label: 'Super Like' };
const BTN_BOOST = { color: '#AB47BC', shadow: 'rgba(171,71,188,0.45)', label: 'Boost'      };

function DiscoverActionBtn({ cfg, size = 56, children, onClick, disabled, crown }) {
    const [burst, setBurst] = useState(false);
    const handle = () => {
        if (disabled) return;
        setBurst(true);
        setTimeout(() => setBurst(false), 600);
        onClick?.();
    };
    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AnimatePresence>
                {burst && (
                    <motion.div
                        key="ring"
                        initial={{ scale: 0.6, opacity: 0.85 }}
                        animate={{ scale: 2.8, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        style={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            background: `radial-gradient(circle, ${cfg.color}55, transparent 68%)`,
                            pointerEvents: 'none', zIndex: 0,
                        }}
                    />
                )}
            </AnimatePresence>
            <motion.button
                onClick={handle}
                whileHover={disabled ? {} : { scale: 1.12, y: -4 }}
                whileTap={disabled ? {} : { scale: 0.85 }}
                animate={burst ? {
                    scale: [1, 1.42, 0.85, 1.15, 1],
                    boxShadow: [`0 6px 22px ${cfg.shadow}`, `0 0 55px ${cfg.shadow}`, `0 6px 22px ${cfg.shadow}`],
                } : {}}
                transition={{ duration: 0.48, ease: [0.22, 0.68, 0, 1.2] }}
                title={cfg.label}
                style={{
                    width: size, height: size, borderRadius: '50%',
                    border: `1.5px solid ${disabled ? 'rgba(255,255,255,0.10)' : cfg.color + '44'}`,
                    background: disabled ? 'rgba(255,255,255,0.04)' : `${cfg.color}12`,
                    color: disabled ? '#555' : cfg.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    boxShadow: disabled ? 'none' : `0 6px 22px ${cfg.shadow}`,
                    opacity: disabled ? 0.38 : 1,
                    position: 'relative', zIndex: 1,
                    flexShrink: 0,
                }}
            >
                {!disabled && crown && (
                    <span style={{ position: 'absolute', top: -4, right: -4, fontSize: 10 }}>👑</span>
                )}
                {children}
            </motion.button>
        </div>
    );
}

// ─── Counter badge ────────────────────────────────────────────────────────────
function SwipeCounter({ remaining, isPremium, isDark }) {
    if (isPremium) return null;
    const pct = remaining / FREE_SWIPES_PER_DAY;
    const color = pct > 0.5 ? '#4CAF50' : pct > 0.25 ? '#F2C94C' : '#EF5350';
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            marginBottom: 10,
        }}>
            <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: FREE_SWIPES_PER_DAY }).map((_, i) => (
                    <motion.div key={i}
                                animate={{ scale: i === remaining ? [1, 1.3, 1] : 1 }}
                                transition={{ duration: 0.4 }}
                                style={{
                                    width: i < remaining ? 8 : 6,
                                    height: i < remaining ? 8 : 6,
                                    borderRadius: '50%',
                                    background: i < remaining ? color : 'rgba(255,255,255,0.15)',
                                    transition: 'all 0.3s',
                                }}
                    />
                ))}
            </div>
            <span style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 11, fontWeight: 600,
                color: color,
                letterSpacing: '0.04em',
            }}>
                {remaining}/{FREE_SWIPES_PER_DAY} swipes
            </span>
        </div>
    );
}

// ─── Empty deck poem ─────────────────────────────────────────────────────────
const POEMS = [
    { line: "Tu as traversé tous les visages du campus.", sub: "Reviens demain — de nouvelles histoires t'attendent." },
    { line: "Le cœur qui cherche finit toujours par trouver.", sub: "Patience. L'amour ne se commande pas." },
    { line: "Entre deux swipes, une vie entière peut basculer.", sub: "La tienne commence peut-être demain." },
];

function EmptyDiscover({ T, isDark, exhausted }) {
    const [idx, setIdx] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setIdx(i => (i + 1) % POEMS.length), 3500);
        return () => clearInterval(t);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: '100%', padding: '32px 28px', textAlign: 'center',
            }}
        >
            {/* Pulsing orb */}
            <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 32 }}>
                {[1, 2, 3].map(i => (
                    <motion.div key={i}
                                animate={{ scale: [1, 2.2], opacity: [0.3, 0] }}
                                transition={{ duration: 2.6, delay: i * 0.7, repeat: Infinity, ease: 'easeOut' }}
                                style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${T.gold}` }}
                    />
                ))}
                <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: `radial-gradient(circle, ${T.gold}18, transparent)`,
                    border: `1px solid ${T.gold}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <motion.span
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ fontSize: 36 }}
                    >
                        {exhausted ? '⏳' : '🌹'}
                    </motion.span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={idx}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.5 }}
                >
                    <p style={{
                        fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                        fontSize: 20, fontWeight: 600, fontStyle: 'italic',
                        color: T.text, lineHeight: 1.55, marginBottom: 8,
                    }}>
                        "{POEMS[idx].line}"
                    </p>
                    <p style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: 13, color: T.textSoft, lineHeight: 1.6,
                    }}>
                        {exhausted ? "Tes 7 swipes du jour sont épuisés." : POEMS[idx].sub}
                    </p>
                </motion.div>
            </AnimatePresence>

            <div style={{ display: 'flex', gap: 5, marginTop: 22 }}>
                {POEMS.map((_, i) => (
                    <motion.div key={i}
                                animate={{ scale: i === idx ? 1.5 : 1, opacity: i === idx ? 1 : 0.25 }}
                                style={{ width: 5, height: 5, borderRadius: '50%', background: T.gold }}
                    />
                ))}
            </div>
        </motion.div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN — DiscoverTab
// ══════════════════════════════════════════════════════════════════════════════
function DiscoverTab({ myProfile, isPremium, onNavigateMessages }) {
    const { T, isDark } = useTheme();
    const { remaining, canSwipe, consume } = useDailySwipes(isPremium);

    const [profiles,     setProfiles]     = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState(null);
    const [match,        setMatch]        = useState(null);
    const [premiumFeature, setPremiumFeature] = useState(null);
    const [canRewind,    setCanRewind]    = useState(false);
    const [superCount,   setSuperCount]   = useState(3);
    const [boostStatus,  setBoostStatus]  = useState(null);
    const [filters,      setFilters]      = useState({});
    const boostTimer = useRef(null);


    const normalise = p => ({
        ...p,
        age: p.age ?? calcAge(p.birthday),
        interests: p.interests?.map(i => typeof i === 'object' ? i.name : i) || [],
    });

    const loadProfiles = useCallback(async (f = {}) => {
        try {
            setLoading(true); setError(null);
            const data = await discoverAPI.getProfiles(f);
            const raw  = data.profiles || data || [];
            setProfiles(raw.map(normalise));
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadProfiles(filters); }, [filters]);

    const startBoostTimer = () => {
        if (boostTimer.current) clearInterval(boostTimer.current);
        boostTimer.current = setInterval(() => {
            setBoostStatus(p => {
                if (!p?.remaining_seconds) { clearInterval(boostTimer.current); return null; }
                return { ...p, remaining_seconds: p.remaining_seconds - 1 };
            });
        }, 1000);
    };

    const handleSwipe = useCallback(async (profileId, direction) => {
        if (!canSwipe && direction !== 'superlike') {
            setPremiumFeature('swipes');
            return;
        }
        const top = profiles[0];
        setCanRewind(true);
        setProfiles(prev => prev.slice(1));
        if (profiles.length <= 3) loadProfiles(filters);

        if (direction !== 'superlike') consume();

        try {
            const result = await discoverAPI.swipe(profileId, direction);
            if (result?.matched) {
                setMatch({
                    myAvatar:    myProfile?.photos?.[0]?.url || myProfile?.avatar,
                    theirAvatar: top?.photos?.[0]?.url || photoUrl(top?.photo) || top?.avatar,
                    theirName:   top?.first_name,
                    matchId:     result.match_id,
                });
            }
            if (direction === 'superlike') setSuperCount(c => Math.max(0, c - 1));
        } catch (e) { console.error('Swipe error:', e); }
    }, [profiles, filters, loadProfiles, canSwipe, consume, myProfile]);

    const handleRewind = async () => {
        if (!canRewind) return;
        if (!isPremium) { setPremiumFeature('rewind'); return; }
        try { await discoverAPI.rewind(); setCanRewind(false); loadProfiles(filters); }
        catch (e) { console.error(e); }
    };

    const handleSuperLike = () => {
        if (superCount <= 0 && !isPremium) { setPremiumFeature('superlike'); return; }
        if (profiles[0]) handleSwipe(profiles[0].id, 'superlike');
    };

    const handleBoost = async () => {
        if (!isPremium && !boostStatus?.free_remaining) { setPremiumFeature('boost'); return; }
        try {
            const r = await discoverAPI.activateBoost();
            setBoostStatus({ active: true, remaining_seconds: 1800, free_remaining: r.free_remaining });
            startBoostTimer();
        } catch (e) { console.error(e); }
    };

    const current    = profiles[0];
    const hasProfiles = profiles.length > 0;
    const exhausted  = !canSwipe && !isPremium;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            height: '100%', position: 'relative',
            background: isDark
                ? 'linear-gradient(160deg, #1A0820 0%, #0C0610 100%)'
                : 'linear-gradient(160deg, #FDF6F0 0%, #F5E8F5 100%)',
        }}>

            {/* ── Boost banner ── */}
            {boostStatus?.active && (() => {
                const rem = Math.max(0, boostStatus.remaining_seconds);
                const m = Math.floor(rem / 60), s = rem % 60;
                return (
                    <motion.div
                        initial={{ y: -48, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        style={{
                            background: 'linear-gradient(90deg, #7B1FA2, #AB47BC)',
                            padding: '9px 20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            boxShadow: '0 4px 20px rgba(171,71,188,0.40)',
                        }}
                    >
                        <span style={{ fontSize: 14 }}>⚡</span>
                        <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 600, color: '#fff' }}>
                            Boost actif — {m}:{String(s).padStart(2, '0')}
                        </span>
                    </motion.div>
                );
            })()}

            {/* ── Top bar ── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px 6px', flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                        <path d="M11 19s-9-6-9-12A5 5 0 0 1 11 4a5 5 0 0 1 9 3c0 6-9 12-9 12z"
                              fill="none" stroke={T.gold} strokeWidth="1.6"/>
                    </svg>
                    <span style={{
                        fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                        fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '0.03em',
                    }}>LoveLine</span>
                </div>
                <FilterBar filters={filters} onChange={setFilters} T={T} isDark={isDark} />
            </div>

            {/* ── Card area ── */}
            <div style={{ flex: 1, position: 'relative', margin: '6px 16px 0', minHeight: 0 }}>
                {loading && profiles.length === 0 ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            style={{
                                width: 42, height: 42, borderRadius: '50%',
                                border: `3px solid ${T.gold}22`, borderTopColor: T.gold,
                            }}
                        />
                    </div>
                ) : error ? (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, color: T.textSoft }}>Connexion impossible</p>
                        <motion.button
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                            onClick={() => loadProfiles(filters)}
                            style={{ padding: '12px 28px', borderRadius: 50, background: T.gold, color: '#1A0812', border: 'none', fontFamily: "'Poppins', sans-serif", fontWeight: 700, cursor: 'pointer' }}
                        >Réessayer</motion.button>
                    </div>
                ) : exhausted ? (
                    <EmptyDiscover T={T} isDark={isDark} exhausted={true} />
                ) : !hasProfiles ? (
                    <EmptyDiscover T={T} isDark={isDark} exhausted={false} />
                ) : (
                    <div style={{ position: 'relative', height: '100%' }}>
                        <AnimatePresence>
                            {profiles.slice(0, 3).map((profile, index) => (
                                <DiscoverCard
                                    key={profile.id}
                                    profile={profile}
                                    onSwipe={handleSwipe}
                                    isTop={index === 0}
                                    stackIndex={index}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* ── Action buttons area ── */}
            {!loading && (
                <div style={{
                    flexShrink: 0,
                    paddingBottom: 'calc(max(12px, env(safe-area-inset-bottom)) + 82px)',
                    paddingTop: 10,
                    paddingLeft: 16,
                    paddingRight: 16,
                }}>
                    <SwipeCounter remaining={remaining} isPremium={isPremium} isDark={isDark} />

                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 12,
                        background: isDark ? 'rgba(10,6,14,0.82)' : 'rgba(255,250,253,0.88)',
                        backdropFilter: 'blur(28px)',
                        WebkitBackdropFilter: 'blur(28px)',
                        borderRadius: 60,
                        padding: '14px 26px',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(233,30,99,0.10)'}`,
                        boxShadow: isDark
                            ? '0 12px 50px rgba(0,0,0,0.55)'
                            : '0 12px 50px rgba(233,30,99,0.10)',
                    }}>
                        {/* UNDO */}
                        <DiscoverActionBtn cfg={BTN_UNDO} size={46} disabled={!canRewind} onClick={handleRewind} crown={!isPremium}>
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                <path d="M4 10a6 6 0 1 1 1.5 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                                <path d="M4 6v4h4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </DiscoverActionBtn>

                        {/* NOPE */}
                        <DiscoverActionBtn cfg={BTN_NOPE} size={60} disabled={exhausted || !hasProfiles} onClick={() => current && handleSwipe(current.id, 'nope')}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"/>
                            </svg>
                        </DiscoverActionBtn>

                        {/* LIKE */}
                        <DiscoverActionBtn cfg={BTN_LIKE} size={68} disabled={exhausted || !hasProfiles} onClick={() => current && handleSwipe(current.id, 'like')}>
                            <svg width="30" height="30" viewBox="0 0 28 28" fill="none">
                                <path d="M14 24s-11-7.5-11-14A5.5 5.5 0 0 1 14 6a5.5 5.5 0 0 1 11 4c0 6.5-11 14-11 14z"
                                      fill="rgba(233,30,99,0.22)" stroke="#E91E63" strokeWidth="1.8"/>
                            </svg>
                        </DiscoverActionBtn>

                        {/* SUPERLIKE */}
                        <DiscoverActionBtn cfg={BTN_SUPER} size={54} disabled={superCount <= 0 && !isPremium} onClick={handleSuperLike} crown={!isPremium}>
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                                <path d="M11 2l2.4 6.6H20l-5.2 4 2 6.4L11 15l-5.8 4 2-6.4L2 8.6h6.6L11 2z"
                                      stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
                                      fill="rgba(66,165,245,0.14)"/>
                            </svg>
                        </DiscoverActionBtn>

                        {/* BOOST */}
                        <DiscoverActionBtn cfg={BTN_BOOST} size={46} disabled={!isPremium && !boostStatus?.free_remaining} onClick={handleBoost} crown={!isPremium}>
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                <path d="M10 2L7 9h5l-2 9 7-10h-5l2-6z"
                                      stroke="currentColor" strokeWidth="1.9"
                                      fill="rgba(171,71,188,0.14)" strokeLinejoin="round"/>
                            </svg>
                        </DiscoverActionBtn>
                    </div>
                </div>
            )}

            {/* Match modal */}
            <MatchModal
                match={match}
                onClose={() => setMatch(null)}
                onMessage={() => {
                    setMatch(null);
                    onNavigateMessages?.(match?.matchId);
                }}
            />

            {/* Premium modal */}
            {premiumFeature && (
                <PremiumModal
                    feature={premiumFeature}
                    onClose={() => setPremiumFeature(null)}
                    onSubscribe={() => setPremiumFeature(null)}
                />
            )}
        </div>
    );
}
// ══════════════════════════════════════════════════════════════════════════════
// EXPLORE TAB — Main export
// ══════════════════════════════════════════════════════════════════════════════
function ExploreTab() {
    const { T, isDark } = useTheme();

    const [categories, setCategories]         = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [profiles, setProfiles]             = useState([]);
    const [loading, setLoading]               = useState(true);
    const [loadingProfiles, setLoadingProfiles] = useState(false);
    const [searchQuery, setSearchQuery]       = useState('');
    const [searchResults, setSearchResults]   = useState([]);
    const [searching, setSearching]           = useState(false);
    const [viewProfile, setViewProfile]       = useState(null);
    const [page, setPage]                     = useState(1);
    const [ageRange, setAgeRange]             = useState([18, 35]);
    const [showAgeFilter, setShowAgeFilter]   = useState(false);
    const [hasMore, setHasMore]               = useState(true);

    useEffect(() => {
        exploreAPI.getCategories()
            .then(data => setCategories(data.categories || data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const loadCategory = useCallback(async (cat, p = 1) => {
        try {
            setLoadingProfiles(true);
            setActiveCategory(cat);
            setPage(p);
            const data = await exploreAPI.getByCategory(cat.id, p);
            const newProfiles = data.profiles || data.results || [];
            if (p === 1) setProfiles(newProfiles);
            else setProfiles(prev => [...prev, ...newProfiles]);
            setHasMore(!!data.next || newProfiles.length === 20);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingProfiles(false);
        }
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) { setSearchResults([]); setSearching(false); return; }
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const data = await exploreAPI.search(searchQuery);
                setSearchResults(data.profiles || data.results || []);
            } catch (e) {}
            setSearching(false);
        }, 450);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const filteredByAge = (arr) => arr.filter(p => {
        if (!p.age) return true;
        return p.age >= ageRange[0] && p.age <= ageRange[1];
    });

    const isSearchMode    = searchQuery.trim().length > 0;
    const displayProfiles = filteredByAge(isSearchMode ? searchResults : profiles);

    const skeletonStyle = {
        background: isDark
            ? 'linear-gradient(90deg,#201A35 25%,#2D1A40 50%,#201A35 75%)'
            : 'linear-gradient(90deg,#EDE8FF 25%,#F5F0FF 50%,#EDE8FF 75%)',
        borderRadius: 24,
    };

    return (
        <div style={{ height: '100%', overflowY: 'auto', background: T.bg, paddingBottom: 100 }}>

            {/* ── WAVE HEADER avec search intégré ── */}
            <div style={{ position: 'relative', flexShrink: 0  }}>
                <div style={{
                    background: 'linear-gradient(145deg, #F2C94C 0%, #FDE68A 50%, #880E4F 100%)',
                    padding: 'max(54px, env(safe-area-inset-top)) 20px 44px',
                    position: 'relative', overflow: 'hidden',

                }}>
                    {/* Blobs décoratifs */}
                    <div style={{ position:'absolute', top:-50, right:-50, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }} />
                    <div style={{ position:'absolute', bottom:0, left:-40, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />

                    <h1 style={{ fontFamily:"'Poppins',sans-serif", fontSize:28, fontWeight:700, color:'#fff', margin:'0 0 4px', letterSpacing:'-0.01em', position:'relative', zIndex:1 }}>
                        Explorer
                    </h1>
                    <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:'rgba(255,255,255,0.75)', margin:'0 0 18px', position:'relative', zIndex:1 }}>
                        Connecte-toi par affinités
                    </p>

                    {/* Search pill dans le header */}
                    <div style={{ position:'relative', zIndex:1 }}>
                        <div style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
                            <Search size={15} color="rgba(255,255,255,0.65)" strokeWidth={2} />
                        </div>
                        <input
                            type="text"
                            placeholder="Passion, filière, prénom..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                width:'100%', padding:'13px 44px 13px 44px',
                                borderRadius:50, border:'1.5px solid rgba(255,255,255,0.30)',
                                background:'rgba(255,255,255,0.15)', backdropFilter:'blur(20px)',
                                fontFamily:"'Poppins',sans-serif", fontSize:13, color:'#fff',
                                outline:'none', boxSizing:'border-box',
                            }}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} style={{
                                position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                                background:'rgba(255,255,255,0.22)', border:'none',
                                width:26, height:26, borderRadius:'50%',
                                display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                            }}>
                                <X size={12} color="#fff" strokeWidth={2.5} />
                            </button>
                        )}
                    </div>
                    {/* Vague — DANS le gradient */}
                    <svg viewBox="0 0 390 48" preserveAspectRatio="none"
                         style={{ position:'absolute', bottom:0, left:0, width:'100%', height:70, display:'block' }}>
                        <path d="M0,24 C60,48 120,8 195,28 C270,48 330,12 390,24 L390,48 L0,48 Z"
                              fill={ T.bg} />
                    </svg>
                </div>

            </div>

            <div style={{ padding: '0 16px' }}>

                {/* ── FILTRE ÂGE ── */}
                <div style={{ marginBottom: 24, marginTop: 20 }}>
                    <button onClick={() => setShowAgeFilter(s => !s)} style={{
                        display:'flex', alignItems:'center', gap:8,
                        background: isDark
                            ? 'rgba(242,201,76,0.10)'
                            : 'rgba(190,24,93,0.07)',
                        border:`1.5px solid rgba(190,24,93,0.20)`,
                        borderRadius:50, padding:'10px 18px', cursor:'pointer',
                        fontFamily:"'Poppins',sans-serif", fontSize:12, fontWeight:700,
                        color: '#BE185D',
                        boxShadow:'0 2px 12px rgba(190,24,93,0.10)',
                    }}>
                        <Filter size={13} strokeWidth={2.5} color="#BE185D" />
                        {ageRange[0]}–{ageRange[1]} ans
                        <ChevronRight size={13} color="#BE185D"
                                      style={{ transform: showAgeFilter ? 'rotate(90deg)' : 'rotate(0deg)', transition:'transform 0.25s' }} />
                    </button>

                    <AnimatePresence>
                        {showAgeFilter && (
                            <motion.div
                                initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                                exit={{ opacity:0, height:0 }} style={{ overflow:'hidden' }}
                            >
                                <div style={{
                                    marginTop:12, padding:'20px',
                                    background: isDark ? 'rgba(26,10,20,0.95)' : '#fff',
                                    border:'1px solid rgba(190,24,93,0.15)',
                                    borderRadius:24,
                                    boxShadow:'0 8px 32px rgba(190,24,93,0.12)',
                                }}>
                                    {[
                                        { label:'Âge min', val:ageRange[0], min:18, max:ageRange[1]-1, idx:0 },
                                        { label:'Âge max', val:ageRange[1], min:ageRange[0]+1, max:45, idx:1 },
                                    ].map(r => (
                                        <div key={r.label} style={{ marginBottom: r.idx === 0 ? 18 : 0 }}>
                                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                                                <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:T.textSoft, fontWeight:500 }}>{r.label}</span>
                                                <span style={{
                                                    fontFamily:"'Poppins',sans-serif", fontSize:12, fontWeight:800,
                                                    background:'linear-gradient(135deg,#F2C94C,#BE185D)',
                                                    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                                                }}>{r.val} ans</span>
                                            </div>
                                            <input type="range" min={r.min} max={r.max} value={r.val}
                                                   onChange={e => setAgeRange(prev => { const n=[...prev]; n[r.idx]=+e.target.value; return n; })}
                                                   style={{ width:'100%', accentColor:'#BE185D' }} />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── MODE RECHERCHE ── */}
                {isSearchMode && (
                    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
                        <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:T.textMuted, marginBottom:16 }}>
                            {searching ? 'Recherche...' : `${searchResults.length} résultat${searchResults.length !== 1 ? 's' : ''} pour "${searchQuery}"`}
                        </p>
                        {searchResults.length === 0 && !searching ? (
                            <div style={{ textAlign:'center', padding:'60px 20px' }}>
                                <Search size={44} color="#BE185D" strokeWidth={1.4} style={{ marginBottom:16, opacity:0.4 }} />
                                <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:16, color:T.textSoft }}>
                                    Aucun résultat
                                </p>
                            </div>
                        ) : (
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
                                {searchResults.map((profile, i) => (
                                    <motion.div key={profile.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}>
                                        <ProfileGridItem profile={profile} onLike={(id) => discoverAPI.swipe(id,'like')} onView={setViewProfile} T={T} isDark={isDark} />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── GRILLE CATÉGORIES ── */}
                {!isSearchMode && !activeCategory && (
                    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>

                        {/* Carte vedette */}
                        {!loading && categories.length > 0 && (
                            <div style={{ marginBottom:28 }}>
                                <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:14 }}>
                                    <div>
                                        <h2 style={{ fontFamily:"'Poppins',sans-serif", fontSize:18, fontWeight:800, color:T.text, margin:0, letterSpacing:'-0.02em' }}>À la une</h2>
                                        <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:T.textMuted, margin:'3px 0 0' }}>La communauté la plus active</p>
                                    </div>
                                </div>
                                <motion.div whileTap={{ scale:0.97 }} onClick={() => loadCategory(categories[0])}
                                            style={{
                                                borderRadius:28, overflow:'hidden', cursor:'pointer',
                                                position:'relative', height:200,
                                                background: (CATEGORY_STYLES[categories[0]?.slug] || CATEGORY_STYLES.default).gradient,
                                                boxShadow:'0 16px 48px rgba(190,24,93,0.22)',
                                            }}
                                >
                                    {categories[0]?.cover_image && (
                                        <img src={categories[0].cover_image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0 }} />
                                    )}
                                    <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }} />
                                    <div style={{ position:'absolute', bottom:-20, left:-20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
                                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,rgba(0,0,0,0.02),rgba(0,0,0,0.62))' }} />
                                    <div style={{ position:'absolute', inset:0, padding:'20px 22px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                                        <div style={{ alignSelf:'flex-start', background:'rgba(255,255,255,0.20)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.30)', borderRadius:20, padding:'5px 14px' }}>
                                            <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:10, fontWeight:800, color:'#fff', letterSpacing:'0.08em' }}>✦ TENDANCE</span>
                                        </div>
                                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                                            <div>
                                                <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:24, fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>{categories[0]?.name}</div>
                                                <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:'rgba(255,255,255,0.72)', marginTop:4 }}>{categories[0]?.count || 0} membres</div>
                                            </div>
                                            <div style={{ width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,0.20)', backdropFilter:'blur(10px)', border:'1.5px solid rgba(255,255,255,0.35)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                <ChevronRight size={20} color="#fff" strokeWidth={2.5} />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* Section titre */}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                            <div>
                                <h2 style={{ fontFamily:"'Poppins',sans-serif", fontSize:18, fontWeight:800, color:T.text, margin:0, letterSpacing:'-0.02em' }}>
                                    Toutes les catégories
                                </h2>
                                <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:T.textMuted, margin:'3px 0 0' }}>
                                    {categories.length} univers à explorer
                                </p>
                            </div>
                            <div style={{
                                background:'linear-gradient(135deg,#F2C94C,#BE185D)',
                                borderRadius:20, padding:'5px 14px',
                                boxShadow:'0 4px 16px rgba(190,24,93,0.25)',
                            }}>
                                <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:700, color:'#fff' }}>
                                    {categories.length}
                                </span>
                            </div>
                        </div>

                        {loading ? (
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 }}>
                                {Array.from({ length:6 }).map((_,i) => (
                                    <motion.div key={i} animate={{ opacity:[0.4,0.8,0.4] }} transition={{ duration:1.5, repeat:Infinity, delay:i*0.1 }}
                                                style={{ aspectRatio:'4/3', borderRadius:24, background: isDark ? '#2A1020' : '#FCE7F3' }} />
                                ))}
                            </div>
                        ) : (
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 }}>
                                {categories.slice(1).map((cat, i) => (
                                    <motion.div key={cat.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
                                        <CategoryCard category={cat} onClick={loadCategory} T={T} isDark={isDark} />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── INTÉRIEUR CATÉGORIE ── */}
                {!isSearchMode && activeCategory && (
                    <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                            <motion.button whileTap={{ scale:0.90 }}
                                           onClick={() => { setActiveCategory(null); setProfiles([]); }}
                                           style={{
                                               width:40, height:40, borderRadius:'50%',
                                               background:'linear-gradient(135deg,rgba(242,201,76,0.15),rgba(190,24,93,0.10))',
                                               border:'1.5px solid rgba(190,24,93,0.20)',
                                               display:'flex', alignItems:'center', justifyContent:'center',
                                               cursor:'pointer', flexShrink:0,
                                               boxShadow:'0 4px 16px rgba(190,24,93,0.12)',
                                           }}
                            >
                                <ArrowLeft size={17} color="#BE185D" strokeWidth={2.2} />
                            </motion.button>
                            <div>
                                <h2 style={{ fontFamily:"'Poppins',sans-serif", fontSize:18, fontWeight:800, color:T.text, margin:0, letterSpacing:'-0.01em' }}>
                                    {activeCategory.name}
                                </h2>
                                <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:T.textMuted, margin:'2px 0 0' }}>
                                    {activeCategory.count || profiles.length} profil{(activeCategory.count||0)!==1?'s':''}
                                </p>
                            </div>
                        </div>

                        {loadingProfiles && profiles.length === 0 ? (
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
                                {Array.from({ length:6 }).map((_,i) => (
                                    <motion.div key={i} animate={{ opacity:[0.4,0.8,0.4] }} transition={{ duration:1.5, repeat:Infinity, delay:i*0.1 }}
                                                style={{ aspectRatio:'3/4', borderRadius:24, background: isDark ? '#2A1020' : '#FCE7F3' }} />
                                ))}
                            </div>
                        ) : displayProfiles.length === 0 ? (
                            <div style={{ textAlign:'center', padding:'60px 20px' }}>
                                <Search size={44} color="#BE185D" strokeWidth={1.4} style={{ marginBottom:16, opacity:0.4 }} />
                                <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:16, color:T.textSoft }}>Aucun profil pour le moment</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
                                    {displayProfiles.map((profile, i) => (
                                        <motion.div key={profile.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, scale:0.9 }} transition={{ delay:i*0.04 }}>
                                            <ProfileGridItem profile={profile} onLike={(id) => discoverAPI.swipe(id,'like')} onView={setViewProfile} T={T} isDark={isDark} />
                                        </motion.div>
                                    ))}
                                </div>
                                {hasMore && (
                                    <div style={{ textAlign:'center', marginTop:28 }}>
                                        <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                                                       onClick={() => loadCategory(activeCategory, page+1)}
                                                       disabled={loadingProfiles}
                                                       style={{
                                                           padding:'14px 36px', borderRadius:50,
                                                           background:'linear-gradient(135deg,#F2C94C,#BE185D)',
                                                           color:'#fff', border:'none',
                                                           fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:700,
                                                           cursor: loadingProfiles ? 'wait' : 'pointer',
                                                           boxShadow:'0 8px 24px rgba(190,24,93,0.30)',
                                                           opacity: loadingProfiles ? 0.7 : 1,
                                                       }}
                                        >
                                            {loadingProfiles ? 'Chargement...' : 'Voir plus'}
                                        </motion.button>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                )}

            </div>

            {/* Profile sheet */}
            {viewProfile && (
                <ProfileSheet profile={viewProfile} onClose={() => setViewProfile(null)}
                              onLike={async (id) => { await discoverAPI.swipe(id,'like'); setViewProfile(null); }}
                              T={T} isDark={isDark} />
            )}

        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// LIKESTAB
// ══════════════════════════════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════════════
   Likes Tab (Coups de Cœur)
   See who liked you + AI Top Picks
   ═══════════════════════════════════════════════════════════════ */

// ─── Blurred card (non-premium) ───────────────────────────────────────────────
function BlurredCard({ T, isDark, index }) {
    const gradients = [
        'linear-gradient(160deg, #F472B6 0%, #BE185D 100%)',
        'linear-gradient(160deg, #FBBF24 0%, #F472B6 100%)',
        'linear-gradient(160deg, #BE185D 0%, #9D174D 100%)',
    ];
    return (
        <div style={{
            borderRadius: 24, overflow: 'hidden',
            position: 'relative', aspectRatio: '3/4',
            boxShadow: '0 12px 40px rgba(190,24,93,0.18)',
        }}>
            {/* Fond flou */}
            <div style={{
                width: '100%', height: '100%',
                background: gradients[index % 3],
                filter: 'blur(0px)',
            }} />

            {/* Silhouette floue */}
            <div style={{
                position: 'absolute', inset: 0,
                backdropFilter: 'blur(18px)',
                background: 'rgba(0,0,0,0.15)',
            }} />

            {/* Silhouette SVG */}
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                paddingBottom: 40,
            }}>
                <svg width="64" height="84" viewBox="0 0 64 84" fill="none" opacity="0.25">
                    <circle cx="32" cy="24" r="18" fill="#fff" />
                    <path d="M2 80c0-16.6 13.4-30 30-30s30 13.4 30 30" fill="#fff" />
                </svg>
            </div>

            {/* Badge numéro */}
            <div style={{
                position: 'absolute', top: 12, left: 12,
                background: 'rgba(255,255,255,0.20)',
                backdropFilter: 'blur(10px)',
                borderRadius: 20, padding: '4px 10px',
                border: '1px solid rgba(255,255,255,0.30)',
            }}>
                <span style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 10, fontWeight: 800, color: '#fff',
                }}>#{index + 1}</span>
            </div>

            {/* Cadenas central */}
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
                <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.22)',
                    backdropFilter: 'blur(12px)',
                    border: '1.5px solid rgba(255,255,255,0.40)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.20)',
                }}>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <rect x="3" y="10" width="16" height="11" rx="3" fill="rgba(255,255,255,0.90)" />
                        <path d="M7 10V7.5a4 4 0 0 1 8 0V10" stroke="rgba(255,255,255,0.90)" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div>
                <span style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.90)',
                    letterSpacing: '0.06em',
                }}>Premium</span>
            </div>

            {/* Bas de carte */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '20px 12px 12px',
                background: 'linear-gradient(0deg, rgba(0,0,0,0.50) 0%, transparent 100%)',
            }}>
                <div style={{
                    height: 10, borderRadius: 5,
                    background: 'rgba(255,255,255,0.25)',
                    marginBottom: 6, width: '70%',
                }} />
                <div style={{
                    height: 8, borderRadius: 4,
                    background: 'rgba(255,255,255,0.15)',
                    width: '50%',
                }} />
            </div>
        </div>
    );
}

// ─── Like card ─────────────────────────────────────────────────────────────────
function LikeCard({ profile, onLikeBack, onNope, T, isDark }) {
    const [decided, setDecided] = useState(false);

    const handleLike = async () => {
        if (decided) return;
        setDecided(true);
        try {
            await discoverAPI.swipe(profile.id, 'like');
            onLikeBack?.(profile.id);
        } catch (e) {
            setDecided(false);
        }
    };

    const handleNope = async () => {
        if (decided) return;
        setDecided(true);
        await discoverAPI.swipe(profile.id, 'nope').catch(() => {});
        onNope?.(profile.id);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
                borderRadius: 20, overflow: 'hidden',
                position: 'relative', aspectRatio: '3/4',
                boxShadow: T.shadowCard,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.80)'}`,
            }}
        >
            <img
                src={profile.photos?.[0]?.url || (profile.photo ?  getBaseUrl() + profile.photo : null) || profile.avatar}
                alt={profile.first_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* Gradient */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(0deg, rgba(0,0,0,0.75) 0%, transparent 55%)',
            }} />

            {/* Super like badge */}
            {profile.is_super_like && (
                <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'rgba(33,150,243,0.90)',
                    borderRadius: 10, padding: '4px 10px',
                    display: 'flex', alignItems: 'center', gap: 4,
                }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="#fff">
                        <path d="M6 1l1.2 3.4H11L8.4 6.5l1 3.3L6 7.9 2.6 9.8l1-3.3L1 4.4h3.8L6 1z" />
                    </svg>
                    <span style={{ fontFamily: "'Playfair Display', sans-serif", fontSize: 10, color: '#fff', fontWeight: 700 }}>
            Super Like
          </span>
                </div>
            )}

            {/* Online */}
            {profile.is_online && (
                <div style={{
                    position: 'absolute', top: 10, left: 10,
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#4CAF50',
                    border: '2px solid rgba(255,255,255,0.8)',
                }} />
            )}

            {/* Info */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 12px 4px' }}>
                <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2,
                }}>
                    {profile.first_name}, {profile.age}
                </div>
                {profile.faculty && (
                    <div style={{ fontFamily: "'Playfair Display', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.70)', marginBottom: 8 }}>
                        {profile.faculty}
                    </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleNope} style={{
                        flex: 1, padding: '9px',
                        borderRadius: 14,
                        background: 'rgba(0,0,0,0.50)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.20)',
                        color: '#fff', cursor: 'pointer',
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 11, fontWeight: 600,
                    }}>
                        Passer
                    </button>
                    <motion.button
                        onClick={handleLike}
                        whileTap={{ scale: 0.92 }}
                        style={{
                            flex: 1, padding: '9px',
                            borderRadius: 14,
                            background: 'rgba(212,175,55,0.85)',
                            backdropFilter: 'blur(8px)',
                            border: 'none', cursor: 'pointer',
                            color: '#1A0812',
                            fontFamily: "'Playfair Display', sans-serif",
                            fontSize: 11, fontWeight: 700,
                        }}
                    >
                        ❤ Liker
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Top Pick card ─────────────────────────────────────────────────────────────
function TopPickCard({ profile, onLike, T, isDark }) {
    const [liked, setLiked] = useState(false);

    return (
        <motion.div
            whileHover={{ y: -6 }}
            style={{
                borderRadius: 24, overflow: 'hidden',
                position: 'relative', height: 200,
                boxShadow: T.shadowDeep,
                flexShrink: 0, width: 160,
                cursor: 'pointer',
            }}
        >
            <img
                src={profile.photos?.[0]?.url || (profile.photo ? getBaseUrl() + profile.photo : null) || profile.avatar}
                alt={profile.first_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* AI badge */}
            <div style={{
                position: 'absolute', top: 10, left: 10,
                background: `linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
                borderRadius: 10, padding: '3px 8px',
                display: 'flex', alignItems: 'center', gap: 4,
            }}>
                <span style={{ fontSize: 8 }}>✦</span>
                <span style={{ fontFamily: "'Playfair Display', sans-serif", fontSize: 9, color: '#1A0812', fontWeight: 800 }}>
          TOP PICK
        </span>
            </div>

            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(0deg, rgba(0,0,0,0.80) 0%, transparent 50%)',
            }} />

            <div style={{ position: 'absolute', bottom: 8, left: 12, right: 12 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: '#fff' }}>
                    {profile.first_name}, {profile.age}
                </div>
                <div style={{ fontFamily: "'Playfair Display', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.70)' }}>
                    {profile.compatibility_score}% compatibles
                </div>
            </div>

            {/* Like button */}
            <motion.button
                onClick={(e) => { e.stopPropagation(); setLiked(true); onLike?.(profile.id); }}
                whileTap={{ scale: 0.88 }}
                style={{
                    position: 'absolute', top: 10, right: 10,
                    width: 32, height: 32, borderRadius: '50%',
                    background: liked ? 'rgba(233,30,99,0.90)' : 'rgba(0,0,0,0.50)',
                    backdropFilter: 'blur(8px)',
                    border: 'none', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'background 0.3s',
                }}
            >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 12S1 7.5 1 4.5a3 3 0 0 1 6-1.2 3 3 0 0 1 6 1.2C13 7.5 7 12 7 12z"
                          fill={liked ? '#fff' : 'none'} stroke="#fff" strokeWidth="1.4" />
                </svg>
            </motion.button>
        </motion.div>
    );
}

// ─── Countdown timer for daily picks refresh ──────────────────────────────────
function PicksCountdown() {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const getNext = () => {
            const now = new Date();
            const next = new Date(now);
            next.setHours(24, 0, 0, 0);
            return Math.floor((next - now) / 1000);
        };
        setTimeLeft(getNext());
        const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
        return () => clearInterval(id);
    }, []);

    const h = Math.floor(timeLeft / 3600);
    const m = Math.floor((timeLeft % 3600) / 60);
    const s = timeLeft % 60;

    return (
        <span style={{ fontFamily: "'Playfair Display', sans-serif", fontFeatureSettings: '"tnum"' }}>
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// LIKES TAB — Main export
// ══════════════════════════════════════════════════════════════════════════════
function LikesTab({ isPremium }) {
    const { T, isDark } = useTheme();

    const [receivedLikes, setReceivedLikes]   = useState([]);
    const [topPicks, setTopPicks]             = useState([]);
    const [loading, setLoading]               = useState(true);
    const [showPremium, setShowPremium]       = useState(false);
    const [activeSection, setActiveSection]   = useState('likes'); // 'likes' | 'picks'
    const [likeCount, setLikeCount]           = useState(0);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [likesData, picksData] = await Promise.all([
                    likesAPI.getReceivedLikes(),
                    likesAPI.getTopPicks(),
                ]);
                setReceivedLikes(likesData.profiles || likesData || []);
                setLikeCount(likesData.count || (likesData.profiles || likesData || []).length);
                setTopPicks(picksData.profiles || picksData || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleRemove = (id) => {
        setReceivedLikes(prev => prev.filter(p => p.id !== id));
    };

    return (
        <div style={{
            height: '100%', overflowY: 'auto',
            background: T.bg, paddingBottom: 100,
        }}>
            {/* ── HEADER gradient rose → jaune ── */}
            <div style={{
                background: 'linear-gradient(135deg, #BE185D 0%, #F472B6 50%, #F2C94C 100%)',
                paddingTop: 'max(54px, env(safe-area-inset-top))',
                paddingLeft: 22, paddingRight: 22, paddingBottom: 60,
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Blobs décoratifs */}
                <div style={{ position:'absolute', top:-60, left:-40, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }} />
                <div style={{ position:'absolute', bottom:-20, right:-30, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
                <div style={{ position:'absolute', top:'35%', right:'15%', width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />

                {/* Compteur likes en haut */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(255,255,255,0.20)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 20, padding: '5px 14px',
                    border: '1px solid rgba(255,255,255,0.30)',
                    marginBottom: 16, position: 'relative', zIndex: 1,
                }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="#fff">
                        <path d="M6 10.5S1 7 1 3.8a2.8 2.8 0 0 1 5-1.7 2.8 2.8 0 0 1 5 1.7C11 7 6 10.5 6 10.5z" />
                    </svg>
                    <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:700, color:'#fff' }}>
                        {isPremium ? likeCount : '?'} personnes vous ont liké
                    </span>
                </div>

                <h1 style={{ fontFamily:"'Poppins',sans-serif", fontSize:28, fontWeight:800, color:'#fff', margin:'0 0 6px', letterSpacing:'-0.02em', position:'relative', zIndex:1 }}>
                    Coups de cœur
                </h1>
                <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:'rgba(255,255,255,0.78)', margin:0, position:'relative', zIndex:1 }}>
                    Des personnes qui n'attendent que toi
                </p>

                {/* Vague en bas du header — inversée */}
                <svg viewBox="0 0 390 50" preserveAspectRatio="none"
                     style={{ position:'absolute', bottom:-1, left:0, width:'100%', height:50, display:'block' }}>
                    <path d="M0,50 L0,20 C50,40 100,5 195,25 C290,45 340,10 390,20 L390,50 Z"
                          fill={T.bg} />
                </svg>
            </div>

            <div style={{ padding: '0 16px' }}>

                {/* ── TABS switcher ── */}
                <div style={{
                    display: 'flex', gap: 0, marginBottom: 24,
                    background: isDark ? 'rgba(30,10,20,0.60)' : 'rgba(255,255,255,0.80)',
                    borderRadius: 20, padding: 5,
                    boxShadow: '0 4px 20px rgba(190,24,93,0.08)',
                    border: `1px solid rgba(190,24,93,0.10)`,
                    marginTop: 20,
                }}>
                    {[
                        { id: 'likes', label: `${isPremium ? likeCount : '?'} Likes`, icon: '❤' },
                        { id: 'picks', label: 'Top Picks IA', icon: '✦' },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{
                            flex: 1, padding: '11px 8px',
                            borderRadius: 15, border: 'none',
                            background: activeSection === tab.id
                                ? 'linear-gradient(135deg, #BE185D, #F472B6)'
                                : 'transparent',
                            color: activeSection === tab.id ? '#fff' : T.textSoft,
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: 12, fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: activeSection === tab.id ? '0 4px 16px rgba(190,24,93,0.30)' : 'none',
                            transition: 'all 0.25s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                            <span style={{ fontSize: 11 }}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>


                {/* ─── LIKES section ─── */}
            {activeSection === 'likes' && (
                <div>
                    {!isPremium && (
                        <motion.div
                            initial={{ opacity:0, y:-10 }}
                            animate={{ opacity:1, y:0 }}
                            onClick={() => setShowPremium(true)}
                            style={{
                                background: 'linear-gradient(135deg, #BE185D 0%, #F472B6 60%, #F2C94C 100%)',
                                borderRadius: 24, padding: '20px', marginBottom: 24,
                                cursor: 'pointer', position: 'relative', overflow: 'hidden',
                                boxShadow: '0 12px 40px rgba(190,24,93,0.30)',
                            }}
                        >
                            {/* Blobs déco */}
                            <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.10)', pointerEvents:'none' }} />
                            <div style={{ position:'absolute', bottom:-20, left:-20, width:90, height:90, borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }} />

                            {/* Contenu */}
                            <div style={{ position:'relative', zIndex:1 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                                    <div style={{
                                        width:44, height:44, borderRadius:'50%',
                                        background:'rgba(255,255,255,0.22)',
                                        backdropFilter:'blur(10px)',
                                        border:'1.5px solid rgba(255,255,255,0.35)',
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                        fontSize: 22,
                                    }}>
                                        💎
                                    </div>
                                    <div>
                                        <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.80)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
                                            Premium
                                        </div>
                                        <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:18, fontWeight:800, color:'#fff', letterSpacing:'-0.01em' }}>
                                            {likeCount} likes reçus
                                        </div>
                                    </div>
                                </div>

                                <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:'rgba(255,255,255,0.85)', lineHeight:1.6, margin:'0 0 16px' }}>
                                    Découvre qui s'intéresse à toi — débloque tous les profils
                                </p>

                                <div style={{
                                    display:'inline-flex', alignItems:'center', gap:8,
                                    background:'rgba(255,255,255,0.22)',
                                    backdropFilter:'blur(10px)',
                                    borderRadius:50, padding:'10px 20px',
                                    border:'1.5px solid rgba(255,255,255,0.35)',
                                }}>
                <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:700, color:'#fff' }}>
                    Voir tout
                </span>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path d="M3 7h8M8 4l3 3-3 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <motion.div key={i}
                                            animate={{ opacity: [0.4, 0.8, 0.4] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                            style={{ aspectRatio: '3/4', borderRadius: 20, background: isDark ? '#2A1A2E' : '#F0EAD6' }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                            <AnimatePresence>
                                {/* Show real profiles for premium, blurred for free */}
                                {isPremium
                                    ? receivedLikes.map((profile, i) => (
                                        <motion.div
                                            key={profile.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <LikeCard
                                                profile={profile}
                                                onLikeBack={(id) => handleRemove(id)}
                                                onNope={(id) => handleRemove(id)}
                                                T={T}
                                                isDark={isDark}
                                            />
                                        </motion.div>
                                    ))
                                    : Array.from({ length: Math.max(6, likeCount) }).map((_, i) => (
                                        <BlurredCard key={i} T={T} isDark={isDark} index={i} />
                                    ))
                                }
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            )}

            {/* ─── TOP PICKS section ─── */}
                {/* ── SECTION TOP PICKS ── */}
                {activeSection === 'picks' && (
                    <div>

                        {/* Bannière premium si pas abonné */}
                        {!isPremium && (
                            <motion.div
                                initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
                                onClick={() => setShowPremium(true)}
                                style={{
                                    background:'linear-gradient(135deg,#BE185D,#F472B6,#F2C94C)',
                                    borderRadius:24, padding:'20px', marginBottom:24,
                                    cursor:'pointer', position:'relative', overflow:'hidden',
                                    boxShadow:'0 12px 40px rgba(190,24,93,0.30)',
                                }}
                            >
                                <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.10)', pointerEvents:'none' }} />
                                <div style={{ position:'relative', zIndex:1 }}>
                                    <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:18, fontWeight:800, color:'#fff', marginBottom:6 }}>
                                        🔒 Fonctionnalité Premium
                                    </div>
                                    <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:'rgba(255,255,255,0.85)', lineHeight:1.6, margin:'0 0 14px' }}>
                                        L'IA sélectionne chaque jour les profils les plus compatibles pour toi
                                    </p>
                                    <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.22)', backdropFilter:'blur(10px)', borderRadius:50, padding:'10px 20px', border:'1.5px solid rgba(255,255,255,0.35)' }}>
                                        <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:700, color:'#fff' }}>Débloquer</span>
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                            <path d="M3 7h8M8 4l3 3-3 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Bannière IA + countdown — visible seulement si premium */}
                        {isPremium && (
                            <motion.div
                                initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
                                style={{
                                    background:'linear-gradient(135deg,#BE185D 0%,#F472B6 55%,#F2C94C 100%)',
                                    borderRadius:24, padding:'20px', marginBottom:24,
                                    position:'relative', overflow:'hidden',
                                    boxShadow:'0 12px 40px rgba(190,24,93,0.25)',
                                }}
                            >
                                <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }} />
                                <div style={{ position:'absolute', bottom:-20, left:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
                                <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                                    <div>
                                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                                            <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.22)', backdropFilter:'blur(10px)', border:'1.5px solid rgba(255,255,255,0.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>✦</div>
                                            <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.85)', letterSpacing:'0.08em', textTransform:'uppercase' }}>IA Selection</span>
                                        </div>
                                        <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:18, fontWeight:800, color:'#fff', letterSpacing:'-0.01em' }}>Sélection du jour</div>
                                        <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:'rgba(255,255,255,0.75)', marginTop:3 }}>Profils choisis rien que pour toi</div>
                                    </div>
                                    <div style={{ background:'rgba(255,255,255,0.18)', backdropFilter:'blur(10px)', border:'1.5px solid rgba(255,255,255,0.30)', borderRadius:16, padding:'10px 14px', textAlign:'center' }}>
                                        <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.75)', letterSpacing:'0.06em', marginBottom:3 }}>RENOUVELLEMENT</div>
                                        <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:18, fontWeight:800, color:'#fff', letterSpacing:'0.02em' }}><PicksCountdown /></div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Contenu — cartes floutées si pas premium, vraies cartes si premium */}
                        {!isPremium ? (
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
                                {Array.from({ length:6 }).map((_,i) => (
                                    <BlurredCard key={i} T={T} isDark={isDark} index={i} />
                                ))}
                            </div>
                        ) : loading ? (
                            <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:8, marginBottom:24 }}>
                                {Array.from({ length:4 }).map((_,i) => (
                                    <motion.div key={i}
                                                animate={{ opacity:[0.4,0.8,0.4] }}
                                                transition={{ duration:1.5, repeat:Infinity, delay:i*0.1 }}
                                                style={{ width:160, height:220, borderRadius:24, flexShrink:0, background: isDark ? '#2A1020' : '#FCE7F3' }}
                                    />
                                ))}
                            </div>
                        ) : topPicks.length === 0 ? (
                            <motion.div
                                initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                                style={{
                                    textAlign:'center', padding:'48px 20px',
                                    background: isDark ? 'rgba(30,10,20,0.60)' : 'rgba(255,255,255,0.80)',
                                    borderRadius:24, border:'1px solid rgba(190,24,93,0.10)',
                                    boxShadow:'0 8px 32px rgba(190,24,93,0.08)',
                                }}
                            >
                                <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,rgba(242,201,76,0.15),rgba(190,24,93,0.10))', border:'1.5px solid rgba(190,24,93,0.20)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:36 }}>🔮</div>
                                <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:16, fontWeight:700, color:T.text, marginBottom:8 }}>Bientôt disponible</div>
                                <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:T.textSoft, lineHeight:1.6 }}>L'IA analyse tes préférences pour affiner ses suggestions</p>
                            </motion.div>
                        ) : (
                            <>
                                <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:12, marginBottom:28, scrollbarWidth:'none' }}>
                                    {topPicks.map((profile, i) => (
                                        <motion.div key={profile.id} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.08 }}>
                                            <TopPickCard profile={profile} onLike={(id) => discoverAPI.swipe(id,'like')} T={T} isDark={isDark} />
                                        </motion.div>
                                    ))}
                                </div>
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                                    <div>
                                        <h3 style={{ fontFamily:"'Poppins',sans-serif", fontSize:18, fontWeight:800, color:T.text, margin:0, letterSpacing:'-0.02em' }}>Tous vos Top Picks</h3>
                                        <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:T.textMuted, margin:'3px 0 0' }}>{topPicks.length} profil{topPicks.length!==1?'s':''} sélectionné{topPicks.length!==1?'s':''}</p>
                                    </div>
                                    <div style={{ background:'linear-gradient(135deg,#F2C94C,#BE185D)', borderRadius:20, padding:'5px 14px', boxShadow:'0 4px 16px rgba(190,24,93,0.25)' }}>
                                        <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:700, color:'#fff' }}>{topPicks.length}</span>
                                    </div>
                                </div>
                                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
                                    {topPicks.map((profile, i) => (
                                        <motion.div key={profile.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
                                            <LikeCard profile={profile} onLikeBack={() => {}} onNope={() => {}} T={T} isDark={isDark} />
                                        </motion.div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

            {/* Premium modal */}
                {showPremium && (
                    <PremiumModal feature="default" onClose={() => setShowPremium(false)} onSubscribe={() => setShowPremium(false)} />
                )}

            </div>
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
// CHATVIEW



// ══════════════════════════════════════════════════════════════════════════════
//  CONSTANTES DESIGN
// ══════════════════════════════════════════════════════════════════════════════

var CHAT_ROSE_GRADIENT = 'linear-gradient(145deg, #AD1457 0%, #E91E63 60%, #F06292 100%)';
var CHAT_ROSE_SHADOW   = '0 6px 24px rgba(173,20,87,0.32), 0 2px 8px rgba(173,20,87,0.18)';
var CHAT_FONT          = "'Poppins', 'SF Pro Text', -apple-system, sans-serif";

var SPRING_SNAPPY  = { type: 'spring', stiffness: 480, damping: 36 };
var SPRING_GENTLE  = { type: 'spring', stiffness: 280, damping: 30 };
var SPRING_MORPHING = { type: 'spring', stiffness: 360, damping: 32, mass: 0.9 };

function chatSurface(isDark) {
    return isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF';
}
function chatBorder(isDark) {
    return isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.07)';
}
function chatBorderColor(isDark) {
    return isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
}
function chatBg(isDark) {
    return isDark ? '#0D0812' : '#F0EBF6';
}
function chatHeaderBg(isDark) {
    return isDark ? 'rgba(13,8,18,0.98)' : 'rgba(255,255,255,0.98)';
}
function chatInputBg(isDark) {
    return isDark ? 'rgba(13,8,18,0.97)' : 'rgba(250,248,253,0.97)';
}


// ══════════════════════════════════════════════════════════════════════════════
//  MESSAGE BUBBLE
// ══════════════════════════════════════════════════════════════════════════════
function MessageBubble({ message, isMe, showAvatar, avatar, T, isDark }) {
    var isVoice   = message.type === 'voice';
    var isDeleted = !!(message.deleted_at);

    // Détecte si le message est un emoji seul (1 à 3 emojis)
    var EMOJI_REGEX = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})[\u{1F3FB}-\u{1F3FF}\u{FE0F}\u{20E3}]?(\u{200D}(\p{Emoji_Presentation}|\p{Extended_Pictographic})[\u{1F3FB}-\u{1F3FF}\u{FE0F}\u{20E3}]?){0,5}(\s*(\p{Emoji_Presentation}|\p{Extended_Pictographic})[\u{1F3FB}-\u{1F3FF}\u{FE0F}\u{20E3}]?(\u{200D}(\p{Emoji_Presentation}|\p{Extended_Pictographic})[\u{1F3FB}-\u{1F3FF}\u{FE0F}\u{20E3}]?){0,5}){0,2}$/u;
    var isSingleEmoji = !isVoice && !isDeleted && message.content && EMOJI_REGEX.test(message.content.trim());

    var playing    = useState(false);
    var setPlaying = playing[1];
    playing        = playing[0];

    var audioRef = useRef(null);

    var time = new Date(message.created_at).toLocaleTimeString('fr-FR', {
        hour: '2-digit', minute: '2-digit',
    });

    function togglePlay() {
        if (!audioRef.current) return;
        if (playing) { audioRef.current.pause(); } else { audioRef.current.play(); }
        setPlaying(!playing);
    }

    function formatDuration(s) {
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }

    // ── Couleurs ──────────────────────────────────────────────────────────────
    var myRadius    = '20px 4px 20px 20px';
    var theirRadius = '4px 20px 20px 20px';
    var myBg        = CHAT_ROSE_GRADIENT;
    var theirBg     = chatSurface(isDark);
    var theirBord   = chatBorder(isDark);
    var myShadow    = CHAT_ROSE_SHADOW;
    var theirShadow = isDark
        ? '0 2px 12px rgba(0,0,0,0.35)'
        : '0 1px 8px rgba(0,0,0,0.07)';

    // ── Rendu message supprimé ────────────────────────────────────────────────
    if (isDeleted) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: isMe ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 3,
                paddingLeft: isMe ? 56 : 0,
                paddingRight: isMe ? 0 : 56,
                opacity: 0.55,
            }}>
                <div style={{
                    padding: '9px 14px',
                    borderRadius: '20px',
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    border: '1px dashed ' + chatBorderColor(isDark),
                }}>
                    <span style={{ fontFamily: CHAT_FONT, fontSize: 13, color: T.textMuted, fontStyle: 'italic' }}>
                        Message supprimé
                    </span>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
                display: 'flex',
                flexDirection: isMe ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                gap: 8,
                marginBottom: 3,
                paddingLeft: isMe ? 56 : 0,
                paddingRight: isMe ? 0 : 56,
            }}
        >
            {/* Avatar partenaire */}
            <div style={{
                width: 28, height: 28, borderRadius: '50%',
                overflow: 'hidden', flexShrink: 0,
                opacity: (!isMe && showAvatar) ? 1 : 0,
                border: '1.5px solid rgba(173,20,87,0.25)',
                background: CHAT_ROSE_GRADIENT,
                transition: 'opacity 0.2s',
            }}>
                {avatar
                    ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : null
                }
            </div>

            <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start',
                gap: 4, maxWidth: '80%',
            }}>
                {/* ── Bulle vocale ─────────────────────────────────────── */}
                {isVoice ? (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '11px 16px',
                        borderRadius: isMe ? myRadius : theirRadius,
                        background: isMe ? myBg : theirBg,
                        border: isMe ? 'none' : theirBord,
                        boxShadow: isMe ? myShadow : theirShadow,
                        minWidth: 180,
                    }}>
                        {message.audio_url
                            ? <audio
                                ref={audioRef}
                                src={message.audio_url}
                                onEnded={function() { setPlaying(false); }}
                                style={{ display: 'none' }}
                            />
                            : null
                        }
                        {/* Bouton play/pause */}
                        <button onClick={togglePlay} style={{
                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                            background: isMe ? 'rgba(255,255,255,0.22)' : 'rgba(173,20,87,0.10)',
                            border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isMe ? '#fff' : '#AD1457',
                            transition: 'transform 0.12s, background 0.2s',
                        }}
                                onMouseDown={function(e) { e.currentTarget.style.transform = 'scale(0.88)'; }}
                                onMouseUp={function(e)   { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            {playing
                                ? <Pause size={15} strokeWidth={2.5} />
                                : <Play  size={15} strokeWidth={2.5} />
                            }
                        </button>

                        {/* Waveform visuelle */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                            {Array.from({ length: 22 }).map(function(_, i) {
                                return (
                                    <motion.div
                                        key={i}
                                        animate={playing
                                            ? { height: [4, 4 + Math.abs(Math.sin(i * 0.7)) * 14, 4] }
                                            : { height: 4 + Math.abs(Math.sin(i * 0.9)) * 10 }
                                        }
                                        transition={playing
                                            ? { duration: 0.6, delay: i * 0.04, repeat: Infinity, ease: 'easeInOut' }
                                            : { duration: 0 }
                                        }
                                        style={{
                                            width: 2, borderRadius: 2,
                                            background: isMe
                                                ? 'rgba(255,255,255,0.65)'
                                                : 'rgba(173,20,87,0.55)',
                                        }}
                                    />
                                );
                            })}
                        </div>

                        {/* Durée */}
                        <span style={{
                            fontFamily: CHAT_FONT,
                            fontSize: 11,
                            color: isMe ? 'rgba(255,255,255,0.72)' : T.textMuted,
                            flexShrink: 0, minWidth: 30,
                        }}>
                            {formatDuration(message.duration || 0)}
                        </span>
                    </div>

                ) : isSingleEmoji ? (
                    /* ── Emoji seul — grand, sans bulle ─────────────────── */
                    <div style={{ padding: '2px 4px' }}>
                        <p style={{
                            fontSize: 52,
                            lineHeight: 1.1,
                            margin: 0,
                            userSelect: 'none',
                        }}>
                            {message.content}
                        </p>
                    </div>
                ) : (
                    /* ── Bulle texte normale ─────────────────────────────── */
                    <div style={{
                        padding: '11px 16px',
                        borderRadius: isMe ? myRadius : theirRadius,
                        background: isMe ? myBg : theirBg,
                        border: isMe ? 'none' : theirBord,
                        boxShadow: isMe ? myShadow : theirShadow,
                    }}>
                        {message.reaction
                            ? <div style={{
                                position: 'absolute',
                                bottom: -10,
                                right: isMe ? 8 : 'auto',
                                left: isMe ? 'auto' : 8,
                                fontSize: 16,
                                lineHeight: 1,
                            }}>
                                {message.reaction}
                            </div>
                            : null
                        }
                        <p style={{
                            fontFamily: CHAT_FONT,
                            fontSize: 14,
                            lineHeight: 1.58,
                            color: isMe ? '#fff' : T.text,
                            margin: 0,
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                        }}>
                            {message.content}
                        </p>
                    </div>
                )}

                {/* ── Heure + statut lu ───────────────────────────────────── */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    paddingLeft: isMe ? 0 : 2,
                    paddingRight: isMe ? 2 : 0,
                }}>
                    <span style={{
                        fontFamily: CHAT_FONT,
                        fontSize: 10,
                        color: T.textMuted,
                    }}>
                        {time}
                    </span>
                    {isMe ? (
                        message.is_read
                            ? <CheckCheck size={13} color="#E91E63" strokeWidth={2.5} />
                            : <Check      size={13} color={T.textMuted} strokeWidth={2.5} />
                    ) : null}
                </div>
            </div>
        </motion.div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
//  DATE SEPARATOR
// ══════════════════════════════════════════════════════════════════════════════
function DateSeparator({ date, T, isDark }) {
    var d         = new Date(date);
    var today     = new Date();
    var yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    var label;
    if (d.toDateString() === today.toDateString()) {
        label = "Aujourd'hui";
    } else if (d.toDateString() === yesterday.toDateString()) {
        label = 'Hier';
    } else {
        label = d.toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long',
        });
        // Capitalize first letter
        label = label.charAt(0).toUpperCase() + label.slice(1);
    }

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '22px 0 14px',
        }}>
            <div style={{
                flex: 1, height: 1,
                background: 'linear-gradient(90deg, transparent, ' + chatBorderColor(isDark) + ')',
            }} />
            <div style={{
                padding: '5px 16px',
                borderRadius: 50,
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                border: '1px solid ' + chatBorderColor(isDark),
            }}>
                <span style={{
                    fontFamily: CHAT_FONT,
                    fontSize: 11, fontWeight: 500,
                    color: T.textMuted,
                    whiteSpace: 'nowrap',
                }}>
                    {label}
                </span>
            </div>
            <div style={{
                flex: 1, height: 1,
                background: 'linear-gradient(90deg, ' + chatBorderColor(isDark) + ', transparent)',
            }} />
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
//  TYPING INDICATOR
// ══════════════════════════════════════════════════════════════════════════════
function TypingIndicator({ avatar, isDark, T }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.94 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{
                display: 'flex', alignItems: 'flex-end', gap: 8,
                marginTop: 4, marginBottom: 8,
            }}
        >
            {/* Mini avatar */}
            <div style={{
                width: 28, height: 28, borderRadius: '50%',
                overflow: 'hidden', flexShrink: 0,
                border: '1.5px solid rgba(233,30,99,0.28)',
                background: CHAT_ROSE_GRADIENT,
            }}>
                {avatar
                    ? <img src={avatar} alt=""
                           style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : null
                }
            </div>

            {/* Bulles animées */}
            <div style={{
                background: chatSurface(isDark),
                border: chatBorder(isDark),
                borderRadius: '4px 20px 20px 20px',
                padding: '12px 18px',
                display: 'flex', gap: 6, alignItems: 'center',
                boxShadow: isDark
                    ? '0 2px 12px rgba(0,0,0,0.35)'
                    : '0 2px 10px rgba(0,0,0,0.07)',
            }}>
                {[0, 1, 2].map(function(i) {
                    return (
                        <motion.div
                            key={i}
                            animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                            transition={{
                                duration: 0.7,
                                delay: i * 0.18,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                            style={{
                                width: 7, height: 7,
                                borderRadius: '50%',
                                background: '#E91E63',
                            }}
                        />
                    );
                })}
            </div>
        </motion.div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
//  CHAT EMPTY STATE
// ══════════════════════════════════════════════════════════════════════════════
function ChatEmptyState({ name, avatar, isDark, T }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '32px 24px', gap: 16, textAlign: 'center',
            }}
        >
            {/* Avatar grand */}
            <div style={{
                width: 90, height: 90, borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid rgba(233,30,99,0.30)',
                boxShadow: '0 8px 32px rgba(173,20,87,0.20)',
                background: CHAT_ROSE_GRADIENT,
                position: 'relative',
            }}>
                {avatar
                    ? <img src={avatar} alt={name}
                           style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: CHAT_FONT, fontSize: 36, fontWeight: 700, color: '#fff',
                    }}>
                        {name.length > 0 ? name[0].toUpperCase() : '?'}
                    </div>
                }
                {/* Ring animé */}
                <motion.div
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute', inset: -4,
                        borderRadius: '50%',
                        border: '2px solid rgba(233,30,99,0.40)',
                        pointerEvents: 'none',
                    }}
                />
            </div>

            <div>
                <p style={{
                    fontFamily: CHAT_FONT,
                    fontSize: 18, fontWeight: 600,
                    color: T.text, margin: '0 0 8px',
                }}>
                    Tu as matché avec {name}
                </p>
                <p style={{
                    fontFamily: CHAT_FONT,
                    fontSize: 14, color: T.textMuted,
                    margin: 0, lineHeight: 1.6,
                }}>
                    Envoie le premier message et brise la glace
                </p>
            </div>

            {/* Suggestions de messages */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                {['Salut !', 'Hey, comment tu vas ?', 'Tu fais quelle filière ?'].map(function(suggestion) {
                    return (
                        <div key={suggestion} style={{
                            padding: '8px 16px',
                            borderRadius: 50,
                            background: isDark
                                ? 'rgba(233,30,99,0.10)'
                                : 'rgba(233,30,99,0.07)',
                            border: '1px solid rgba(233,30,99,0.22)',
                            fontFamily: CHAT_FONT,
                            fontSize: 13, color: '#E91E63',
                            cursor: 'default',
                        }}>
                            {suggestion}
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
//  MESSAGE SKELETON (loading)
// ══════════════════════════════════════════════════════════════════════════════
function MessageSkeleton({ isMe, isDark }) {
    var shimmerBg = isDark
        ? 'linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.10),rgba(255,255,255,0.04))'
        : 'linear-gradient(90deg,rgba(0,0,0,0.05),rgba(0,0,0,0.10),rgba(0,0,0,0.05))';
    var widths = [140, 200, 110, 175, 90];
    var w = widths[Math.floor(Math.random() * widths.length)];

    return (
        <div style={{
            display: 'flex',
            flexDirection: isMe ? 'row-reverse' : 'row',
            alignItems: 'flex-end',
            gap: 8,
            marginBottom: 6,
            paddingLeft: isMe ? 56 : 0,
            paddingRight: isMe ? 0 : 56,
        }}>
            {!isMe && (
                <motion.div
                    animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                    style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: shimmerBg, backgroundSize: '200%',
                        flexShrink: 0,
                    }}
                />
            )}
            <motion.div
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                style={{
                    width: w, height: 40, borderRadius: 16,
                    background: isMe
                        ? 'linear-gradient(90deg,rgba(173,20,87,0.15),rgba(233,30,99,0.25),rgba(173,20,87,0.15))'
                        : shimmerBg,
                    backgroundSize: '200%',
                }}
            />
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
//  CHAT OPTIONS MENU
// ══════════════════════════════════════════════════════════════════════════════
function ChatOptionsMenu({ matchId, onClose, onUnmatch, onDelete, isDark, T }) {
    var borderClr = chatBorderColor(isDark);
    var bg = isDark ? 'rgba(18,10,24,0.99)' : '#FFFFFF';

    var options = [
        {
            Icon: Ban,
            label: 'Bloquer',
            sub: 'Cet utilisateur ne pourra plus te contacter',
            danger: false,
            fn: function() { onClose(); },
        },
        {
            Icon: AlertTriangle,
            label: 'Signaler',
            sub: 'Signaler un comportement inapproprié',
            danger: false,
            fn: function() { onClose(); },
        },
        {
            Icon: HeartCrack,
            label: 'Dématcher',
            sub: 'La conversation sera supprimée',
            danger: true,
            fn: function() {
                if (onUnmatch) { onUnmatch(); }
                onClose();
            },
        },
        {
            Icon: Trash2,
            label: 'Supprimer la conversation',
            sub: 'Tous les messages seront effacés',
            danger: true,
            fn: function() {
                if (onDelete) { onDelete(); }
                onClose();
            },
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.88, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -10 }}
            transition={SPRING_SNAPPY}
            style={{
                position: 'absolute', right: 0, top: 48,
                zIndex: 600,
                background: bg,
                border: '1px solid ' + borderClr,
                borderRadius: 20,
                overflow: 'hidden',
                width: 250,
                boxShadow: isDark
                    ? '0 16px 56px rgba(0,0,0,0.70)'
                    : '0 16px 48px rgba(0,0,0,0.16)',
            }}
        >
            {options.map(function(opt, i) {
                return (
                    <button
                        key={opt.label}
                        onClick={opt.fn}
                        style={{
                            width: '100%',
                            padding: '14px 18px',
                            background: 'none',
                            border: 'none',
                            borderBottom: i < options.length - 1
                                ? '1px solid ' + borderClr
                                : 'none',
                            display: 'flex',
                            gap: 14,
                            alignItems: 'center',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={function(e) {
                            e.currentTarget.style.background = isDark
                                ? 'rgba(255,255,255,0.04)'
                                : 'rgba(0,0,0,0.03)';
                        }}
                        onMouseLeave={function(e) {
                            e.currentTarget.style.background = 'none';
                        }}
                    >
                        {/* Icône dans un cercle */}
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: opt.danger
                                ? 'rgba(233,30,99,0.10)'
                                : isDark
                                    ? 'rgba(255,255,255,0.07)'
                                    : 'rgba(0,0,0,0.05)',
                        }}>
                            <opt.Icon
                                size={17} strokeWidth={1.9}
                                color={opt.danger ? '#E91E63' : T.textSoft}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontFamily: CHAT_FONT,
                                fontSize: 14, fontWeight: 500,
                                color: opt.danger ? '#E91E63' : T.text,
                            }}>
                                {opt.label}
                            </div>
                            <div style={{
                                fontFamily: CHAT_FONT,
                                fontSize: 11, color: T.textMuted,
                                marginTop: 2, lineHeight: 1.4,
                            }}>
                                {opt.sub}
                            </div>
                        </div>
                    </button>
                );
            })}
        </motion.div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
//  EMOJI PICKER WRAPPER
// ══════════════════════════════════════════════════════════════════════════════
function ChatEmojiPicker({ onSelect, isDark }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            style={{
                position: 'absolute', bottom: '100%',
                left: 0, right: 0, zIndex: 500,
                padding: '0 10px 6px',
            }}
        >
            <EmojiPicker
                onEmojiClick={function(data) { onSelect(data.emoji); }}
                theme={isDark ? 'dark' : 'light'}
                emojiStyle="google"
                searchPlaceholder="Rechercher..."
                lazyLoadEmojis={true}
                height={340}
                width="100%"
                previewConfig={{ showPreview: false }}
                skinTonePickerLocation="PREVIEW"
            />
        </motion.div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
//  MORPHING INPUT BAR
//  la barre se contracte en pill puis s'élargit
// ══════════════════════════════════════════════════════════════════════════════
function MorphingInputBar({ onSend, onVoice, onTyping, T, isDark, isInitializing }) {
    var textState   = useState('');
    var text        = textState[0];
    var setText     = textState[1];

    var recordingState = useState(false);
    var recording      = recordingState[0];
    var setRecording   = recordingState[1];

    var emojiState = useState(false);
    var showEmoji  = emojiState[0];
    var setShowEmoji = emojiState[1];

    var focusedState = useState(false);
    var focused      = focusedState[0];
    var setFocused   = focusedState[1];

    var textRef    = useRef(null);
    var wrapperRef = useRef(null);

    // Auto-resize du textarea à chaque frappe
    useEffect(function() {
        var el = textRef.current;
        if (!el) return;
        el.style.height = 'auto';
        var maxH = 120;
        var newH = Math.min(el.scrollHeight, maxH);
        el.style.height = newH + 'px';
        el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden';
    }, [text]);
    // Fermer emoji si clic dehors
    useEffect(function() {
        function handler(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowEmoji(false);
            }
        }
        if (showEmoji) { document.addEventListener('mousedown', handler); }
        return function() { document.removeEventListener('mousedown', handler); };
    }, [showEmoji]);

    function handleSend() {
        var t = text.trim();
        if (!t) return;
        onSend(t);
        setText('');
        setShowEmoji(false);
        if (textRef.current) { textRef.current.focus(); }
    }

    function handleKey(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    function handleChange(e) {
        setText(e.target.value);
        if (onTyping) { onTyping(); }
    }

    async function handleVoiceSend(blob, duration) {
        setRecording(false);
        var fd = new FormData();
        fd.append('audio', blob, 'voice.webm');
        fd.append('duration', duration);
        await onVoice(fd);
    }

    var inputBg = isDark ? 'rgba(255,255,255,0.07)' : '#FFFFFF';
    var inputBorder = focused
        ? '1.5px solid #E91E63'
        : isDark
            ? '1.5px solid rgba(255,255,255,0.10)'
            : '1.5px solid rgba(0,0,0,0.09)';
    var inputGlow = focused ? '0 0 0 3px rgba(233,30,99,0.13)' : 'none';

    if (recording) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                    background: chatInputBg(isDark),
                    borderTop: '1px solid ' + chatBorderColor(isDark),
                    padding: '12px 16px 20px',
                }}
            >
                {/* Voice recorder placeholder */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '10px 16px',
                    background: isDark ? 'rgba(233,30,99,0.08)' : 'rgba(233,30,99,0.05)',
                    borderRadius: 16,
                    border: '1px solid rgba(233,30,99,0.18)',
                }}>
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        style={{
                            width: 12, height: 12, borderRadius: '50%',
                            background: '#E91E63', flexShrink: 0,
                        }}
                    />
                    <span style={{
                        fontFamily: CHAT_FONT, fontSize: 13,
                        color: '#E91E63', flex: 1,
                    }}>
                        Enregistrement en cours...
                    </span>
                    <button
                        onClick={function() { setRecording(false); }}
                        style={{
                            padding: '6px 14px', borderRadius: 20,
                            background: 'none',
                            border: '1px solid rgba(233,30,99,0.30)',
                            color: '#E91E63',
                            fontFamily: CHAT_FONT, fontSize: 12,
                            cursor: 'pointer',
                        }}
                    >
                        Annuler
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <div ref={wrapperRef} style={{ position: 'relative', flexShrink: 0 }}>
            {/* Emoji Picker */}
            <AnimatePresence>
                {showEmoji && (
                    <ChatEmojiPicker
                        onSelect={function(emoji) {
                            setText(function(prev) { return prev + emoji; });
                            if (textRef.current) { textRef.current.focus(); }
                        }}
                        isDark={isDark}
                    />
                )}
            </AnimatePresence>

            {/* Barre principale */}
            <motion.div
                // ── L'animation morphing ───────────────────────────────────
                //  isInitializing: la barre part d'une petite pill et s'élargit
                initial={{ scaleX: 0.14, scaleY: 0.80, y: 20, opacity: 0 }}
                animate={{ scaleX: 1, scaleY: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 24, mass: 1.0 }}
                style={{ transformOrigin: 'center bottom' }}
                style={{
                    background: chatInputBg(isDark),
                    borderTop: '1px solid ' + chatBorderColor(isDark),
                    padding: '10px 12px 16px',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>

                    {/* ── Bouton Emoji ─────────────────────────────────────── */}
                    <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={function() { setShowEmoji(function(v) { return !v; }); }}
                        style={{
                            width: 42, height: 42,
                            borderRadius: '50%', flexShrink: 0,
                            background: showEmoji
                                ? (isDark
                                    ? 'rgba(233,30,99,0.20)'
                                    : 'rgba(233,30,99,0.12)')
                                : (isDark
                                    ? 'rgba(255,255,255,0.07)'
                                    : 'rgba(0,0,0,0.05)'),
                            border: isDark
                                ? '1.5px solid rgba(255,255,255,0.10)'
                                : '1.5px solid rgba(0,0,0,0.09)',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: showEmoji ? '#E91E63' : T.textMuted,
                            transition: 'background 0.2s, color 0.2s',
                        }}
                    >
                        <Smile size={20} strokeWidth={1.8} />
                    </motion.button>

                    {/* ── Zone de texte ────────────────────────────────────── */}
                    <div style={{
                        flex: 1,
                        background: inputBg,
                        borderRadius: 24,
                        border: inputBorder,
                        boxShadow: inputGlow,
                        transition: 'border 0.2s, box-shadow 0.2s',
                        display: 'flex', alignItems: 'flex-end',
                    }}>
                        <textarea
                            ref={textRef}
                            value={text}
                            onChange={handleChange}
                            onKeyDown={handleKey}
                            onFocus={function() { setFocused(true); }}
                            onBlur={function() { setFocused(false); }}
                            placeholder="Message..."
                            rows={1}
                            style={{
                                flex: 1,
                                padding: '11px 16px',
                                background: 'none',
                                border: 'none', outline: 'none',
                                fontFamily: CHAT_FONT,
                                fontSize: 14, color: T.text,
                                resize: 'none', maxHeight: 130,
                                lineHeight: 1.5, boxSizing: 'border-box',
                                overflowY: 'auto',
                            }}
                        />
                    </div>

                    {/* ── Envoyer / Micro ──────────────────────────────────── */}
                    <AnimatePresence mode="popLayout" initial={false}>
                        {text.trim().length > 0 ? (
                            <motion.button
                                key="send"
                                initial={{ scale: 0.5, opacity: 0, rotate: -30 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                exit={{ scale: 0.5, opacity: 0, rotate: 30 }}
                                transition={SPRING_SNAPPY}
                                whileTap={{ scale: 0.85 }}
                                onClick={handleSend}
                                style={{
                                    width: 46, height: 46,
                                    borderRadius: '50%', flexShrink: 0,
                                    background: CHAT_ROSE_GRADIENT,
                                    border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: CHAT_ROSE_SHADOW,
                                }}
                            >
                                <Send size={18} color="#fff" strokeWidth={2.3} />
                            </motion.button>
                        ) : (
                            <motion.button
                                key="mic"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={SPRING_SNAPPY}
                                whileTap={{ scale: 0.85 }}
                                onClick={function() { setRecording(true); }}
                                style={{
                                    width: 46, height: 46,
                                    borderRadius: '50%', flexShrink: 0,
                                    background: isDark
                                        ? 'rgba(255,255,255,0.07)'
                                        : 'rgba(0,0,0,0.05)',
                                    border: isDark
                                        ? '1.5px solid rgba(255,255,255,0.10)'
                                        : '1.5px solid rgba(0,0,0,0.09)',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center',
                                    color: T.textMuted,
                                }}
                            >
                                <Mic size={18} strokeWidth={1.8} />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
//  SCROLL TO BOTTOM BUTTON
// ══════════════════════════════════════════════════════════════════════════════
function ScrollToBottomBtn({ onClick, isDark, count }) {
    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 20 }}
            transition={SPRING_SNAPPY}
            onClick={onClick}
            style={{
                position: 'absolute',
                bottom: 80, right: 16,
                zIndex: 200,
                width: 42, height: 42,
                borderRadius: '50%',
                background: isDark ? '#1A0D22' : '#FFFFFF',
                border: '1px solid rgba(233,30,99,0.25)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.20)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#E91E63',
            }}
        >
            <ChevronDown size={20} strokeWidth={2} />
            {count > 0 && (
                <div style={{
                    position: 'absolute', top: -6, right: -4,
                    minWidth: 18, height: 18, borderRadius: 10,
                    background: '#E91E63',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px',
                    fontFamily: CHAT_FONT, fontSize: 10,
                    color: '#fff', fontWeight: 600,
                }}>
                    {count > 99 ? '99+' : count}
                </div>
            )}
        </motion.button>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
//  CHAT HEADER
// ══════════════════════════════════════════════════════════════════════════════
function ChatHeader({ theirName, theirAvatar, isOnline, typing, onBack, onShowOptions, showOptions, isDark, T }) {
    var borderClr = chatBorderColor(isDark);
    var headerBg  = chatHeaderBg(isDark);

    return (
        <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 12px',
                paddingTop: 'max(12px, env(safe-area-inset-top))',
                background: headerBg,
                borderBottom: '1px solid ' + borderClr,
                flexShrink: 0,
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: isDark
                    ? '0 2px 24px rgba(0,0,0,0.45)'
                    : '0 2px 16px rgba(0,0,0,0.07)',
                position: 'relative', zIndex: 100,
            }}
        >
            {/* ── Retour ──────────────────────────────────────────────── */}
            <motion.button
                whileTap={{ scale: 0.88, x: -3 }}
                onClick={onBack}
                style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: T.text, transition: 'background 0.2s',
                }}
                onMouseEnter={function(e) {
                    e.currentTarget.style.background = isDark
                        ? 'rgba(255,255,255,0.13)'
                        : 'rgba(0,0,0,0.09)';
                }}
                onMouseLeave={function(e) {
                    e.currentTarget.style.background = isDark
                        ? 'rgba(255,255,255,0.07)'
                        : 'rgba(0,0,0,0.05)';
                }}
            >
                <ArrowLeft size={20} strokeWidth={2} />
            </motion.button>

            {/* ── Avatar ──────────────────────────────────────────────── */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
                <motion.div
                    whileTap={{ scale: 0.93 }}
                    style={{
                        width: 46, height: 46, borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid rgba(233,30,99,0.32)',
                        background: CHAT_ROSE_GRADIENT,
                        cursor: 'pointer',
                    }}
                >
                    {theirAvatar
                        ? <img src={theirAvatar} alt={theirName}
                               style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{
                            width: '100%', height: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: CHAT_FONT,
                            fontSize: 19, fontWeight: 700, color: '#fff',
                        }}>
                            {theirName.length > 0 ? theirName[0].toUpperCase() : '?'}
                        </div>
                    }
                </motion.div>

                {/* Point statut en ligne */}
                <motion.div
                    animate={{
                        background: isOnline ? '#4CAF50' : (isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)'),
                    }}
                    transition={{ duration: 0.5 }}
                    style={{
                        position: 'absolute', bottom: 1, right: 1,
                        width: 12, height: 12, borderRadius: '50%',
                        border: '2px solid ' + (isDark ? '#0D0812' : '#F0EBF6'),
                    }}
                />
            </div>

            {/* ── Nom + statut ─────────────────────────────────────────── */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontFamily: CHAT_FONT,
                    fontSize: 15, fontWeight: 600,
                    color: T.text,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {theirName}
                </div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={typing ? 'typing' : (isOnline ? 'online' : 'offline')}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            fontFamily: CHAT_FONT,
                            fontSize: 11,
                            color: typing
                                ? '#E91E63'
                                : (isOnline ? '#4CAF50' : T.textMuted),
                        }}
                    >
                        {typing
                            ? 'est en train d\'écrire...'
                            : (isOnline ? 'En ligne' : 'Hors ligne')
                        }
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ── Menu 3 points ────────────────────────────────────────── */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
                <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={onShowOptions}
                    style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: showOptions
                            ? (isDark ? 'rgba(233,30,99,0.15)' : 'rgba(233,30,99,0.09)')
                            : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'),
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: showOptions ? '#E91E63' : T.textSoft,
                        transition: 'background 0.2s, color 0.2s',
                    }}
                >
                    <MoreVertical size={20} strokeWidth={1.8} />
                </motion.button>
            </div>
        </motion.div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
//  ANIMATION INTRO : PHANTOM NAVBAR → MORPHING INPUT
//  La navbar se contracte en pill et descend hors écran
//  pendant que la barre de saisie s'élargit
// ══════════════════════════════════════════════════════════════════════════════
function NavBarMorphIntro({ isDark, onDone }) {
    var phaseState = useState(0); // 0=shrink, 1=fall, 2=done
    var phase      = phaseState[0];
    var setPhase   = phaseState[1];

    useEffect(function() {
        // Phase 0→1 : rétrécissement (400ms)
        var t1 = setTimeout(function() { setPhase(1); }, 480);
        // Phase 1→2 : chute (280ms) puis done
        var t2 = setTimeout(function() { setPhase(2); onDone(); }, 740);
        return function() { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    if (phase >= 2) { return null; }

    return (
        <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            zIndex: 2000,
            display: 'flex', justifyContent: 'center',
            alignItems: 'flex-end',
            padding: '0 12px 16px',
            pointerEvents: 'none',
        }}>
            <motion.div
                animate={phase === 0
                    ? {
                        // Phase 0 : rétrécissement de la navbar → pill
                        width: ['100%', '64px'],
                        height: [62, 62],
                        borderRadius: [36, 32],
                        opacity: [1, 1],
                        y: [0, 0],
                    }
                    : {
                        // Phase 1 : chute + disparition
                        y: [0, 80],
                        opacity: [1, 0],
                        scale: [1, 0.7],
                    }
                }
                transition={phase === 0
                    ? { duration: 0.38, ease: [0.4, 0, 0.2, 1] }
                    : { duration: 0.3, ease: [0.4, 0, 1, 1] }
                }
                style={{
                    background: isDark
                        ? 'rgba(10,6,12,0.80)'
                        : 'rgba(255,252,248,0.80)',
                    backdropFilter: 'blur(24px)',
                    border: isDark
                        ? '1px solid rgba(255,255,255,0.10)'
                        : '1px solid rgba(255,255,255,0.85)',
                    boxShadow: isDark
                        ? '0 8px 40px rgba(0,0,0,0.55)'
                        : '0 8px 32px rgba(26,8,18,0.14)',
                    overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                {/* Petit coeur qui reste visible pendant le rétrécissement */}
                {phase === 0 && (
                    <motion.div
                        animate={{ scale: [1, 0.5], opacity: [1, 0] }}
                        transition={{ duration: 0.35 }}
                    >
                        <Heart size={20} color="#E91E63" fill="#E91E63" />
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
//  CHAT VIEW
// ══════════════════════════════════════════════════════════════════════════════
function ChatView({ match, onBack, isPremium, onShowPremium }) {
    var themeCtx = useTheme();
    var T        = themeCtx.T;
    var isDark   = themeCtx.isDark;

    // ── State ─────────────────────────────────────────────────────────────────
    var messagesState    = useState([]);
    var messages         = messagesState[0];
    var setMessages      = messagesState[1];

    var loadingState     = useState(true);
    var loading          = loadingState[0];
    var setLoading       = loadingState[1];

    var pageState        = useState(1);
    var page             = pageState[0];
    var setPage          = pageState[1];

    var hasMoreState     = useState(false);
    var hasMore          = hasMoreState[0];
    var setHasMore       = hasMoreState[1];

    var typingState      = useState(false);
    var typing           = typingState[0];
    var setTyping        = typingState[1];

    var isOnlineState    = useState(match && match.is_online ? true : false);
    var isOnline         = isOnlineState[0];
    var setIsOnline      = isOnlineState[1];

    var showOptionsState = useState(false);
    var showOptions      = showOptionsState[0];
    var setShowOptions   = showOptionsState[1];

    // Animation states
    var slideInState     = useState(false);
    var slideIn          = slideInState[0];
    var setSlideIn       = slideInState[1];

    var navMorphDoneState = useState(false);
    var navMorphDone      = navMorphDoneState[0];
    var setNavMorphDone   = navMorphDoneState[1];

    var showScrollBtnState = useState(false);
    var showScrollBtn      = showScrollBtnState[0];
    var setShowScrollBtn   = showScrollBtnState[1];

    var newMsgCountState = useState(0);
    var newMsgCount      = newMsgCountState[0];
    var setNewMsgCount   = newMsgCountState[1];

    // ── Refs ──────────────────────────────────────────────────────────────────
    var socketRef    = useRef(null);
    var messagesEnd  = useRef(null);
    var messagesArea = useRef(null);
    var typingTimer  = useRef(null);
    var loadingRef   = useRef(false);
    var atBottomRef  = useRef(true);

    var convId      = match.conversation_id || match.id;
    var theirAvatar = match.their_avatar || match.avatar || '';
    var theirName   = match.their_name   || match.name  || '';

    // ── Animation d'entrée ────────────────────────────────────────────────────
    useEffect(function() {
        var t = setTimeout(function() { setSlideIn(true); }, 16);
        return function() { clearTimeout(t); };
    }, []);

    // ── Chargement des messages ───────────────────────────────────────────────
    var loadMessages = useCallback(async function(p) {
        if (loadingRef.current) return;
        loadingRef.current = true;
        try {
            var data    = await messagesAPI.getMessages(convId, p);
            messagesAPI.markAsRead(convId).catch(function() {});
            var newMsgs = (data.messages || data.results || []).reverse();
            if (p === 1) {
                setMessages(newMsgs);
            } else {
                setMessages(function(prev) { return newMsgs.concat(prev); });
            }
            setHasMore(!!(data.previous) || newMsgs.length === 30);
            setPage(p);
        } catch (e) {
            console.error('[ChatView] loadMessages error:', e);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [convId]);

    useEffect(function() { loadMessages(1); }, [loadMessages]);

    // ── Scroll vers le bas au premier chargement ──────────────────────────────
    useEffect(function() {
        if (page === 1 && messagesEnd.current) {
            messagesEnd.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, page]);

    // ── Détection du scroll (bouton "scroll to bottom") ───────────────────────
    function handleScroll(e) {
        var el = e.currentTarget;
        var distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        atBottomRef.current = distFromBottom < 80;
        setShowScrollBtn(distFromBottom > 200);
        if (atBottomRef.current) { setNewMsgCount(0); }
    }

    function scrollToBottom() {
        if (messagesEnd.current) {
            messagesEnd.current.scrollIntoView({ behavior: 'smooth' });
        }
        setNewMsgCount(0);
    }

    // ── WebSocket ─────────────────────────────────────────────────────────────
    useEffect(function() {
        socketRef.current = new ChatSocket(convId, function(data) {
            if (data.type === 'message') {
                if (!data.message || !data.message.id) { return; }
                setMessages(function(prev) { return prev.concat([data.message]); });
                setTyping(false);
                if (!atBottomRef.current) {
                    setNewMsgCount(function(n) { return n + 1; });
                } else {
                    setTimeout(function() {
                        if (messagesEnd.current) {
                            messagesEnd.current.scrollIntoView({ behavior: 'smooth' });
                        }
                    }, 50);
                }
            } else if (data.type === 'typing') {
                setTyping(true);
                clearTimeout(typingTimer.current);
                typingTimer.current = setTimeout(function() { setTyping(false); }, 3000);
            } else if (data.type === 'read') {
                setMessages(function(prev) {
                    return prev.filter(function(m) { return m && m.id; }).map(function(m) {
                        return Object.assign({}, m, { is_read: true });
                    });
                });
            } else if (data.type === 'online_status') {
                setIsOnline(data.is_online);
            }
        }, function() {});

        return function() {
            if (socketRef.current) { socketRef.current.close(); }
            clearTimeout(typingTimer.current);
        };
    }, [convId]);

    // ── Envoi de message texte ─────────────────────────────────────────────────
    async function handleSend(content) {
        var tempMsg = {
            id: 'temp-' + Date.now(),
            content: content,
            type: 'text',
            is_me: true,
            is_read: false,
            created_at: new Date().toISOString(),
        };
        setMessages(function(prev) { return prev.concat([tempMsg]); });
        setTimeout(function() {
            if (messagesEnd.current) {
                messagesEnd.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, 30);
        try {
            var sent = await messagesAPI.sendMessage(convId, content);
            if (sent && sent.id) {
                setMessages(function(prev) {
                    return prev.map(function(m) {
                        return m.id === tempMsg.id ? sent : m;
                    });
                });
            }
        } catch (e) {
            console.error('[ChatView] sendMessage error:', e);
            setMessages(function(prev) {
                return prev.filter(function(m) { return m.id !== tempMsg.id; });
            });
        }
    }

    // ── Envoi message vocal ────────────────────────────────────────────────────
    async function handleVoice(formData) {
        if (!isPremium) {
            if (onShowPremium) { onShowPremium('voice'); }
            return;
        }
        try {
            var sent = await messagesAPI.sendVoiceMessage(match.id, formData);
            setMessages(function(prev) { return prev.concat([sent]); });
        } catch (e) {
            console.error('[ChatView] sendVoiceMessage error:', e);
        }
    }

    // ── Indicateur de frappe ───────────────────────────────────────────────────
    function handleTyping() {
        if (socketRef.current) { socketRef.current.send({ type: 'typing' }); }
    }

    // ── Retour avec animation ──────────────────────────────────────────────────
    function handleBack() {
        setSlideIn(false);
        setTimeout(function() { onBack(); }, 330);
    }

    // ── Grouper les messages par date ──────────────────────────────────────────
    var grouped  = [];
    let lastDate = null;
    const safeMessages = messages.filter(function (m) {
        return m && m.created_at;
    });
    safeMessages.forEach(function(msg, i) {
        const msgDate = new Date(msg.created_at).toDateString();
        if (msgDate !== lastDate) {
            grouped.push({ type: 'separator', date: msg.created_at, key: 'sep-' + i });
            lastDate = msgDate;
        }
        var prev       = safeMessages[i - 1];
        var showAvatar = !msg.is_me && (
            !prev ||
            prev.is_me ||
            (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) > 120000
        );
        grouped.push({ type: 'message', msg: msg, showAvatar: showAvatar, key: 'msg-' + msg.id });
    });

    var isEmpty = !loading && messages.length === 0;

    return (
        <div style={{
            // ── COUVRE TOUT — y compris la navbar (z-index 1000) ──
            position: 'fixed',
            inset: 0,
            zIndex: 1050,
            display: 'flex',
            flexDirection: 'column',
            background: chatBg(isDark),
            // ── Slide depuis la droite ──
            transform: slideIn ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
            willChange: 'transform',
            overflow: 'hidden',
        }}>

            {/* ── Animation intro : navbar → pill → disparition ────────── */}
            <AnimatePresence>
                {!navMorphDone && (
                    <NavBarMorphIntro
                        isDark={isDark}
                        onDone={function() { setNavMorphDone(true); }}
                    />
                )}
            </AnimatePresence>

            {/* ── HEADER ───────────────────────────────────────────────── */}
            <div style={{ position: 'relative', zIndex: 200 }}>
                <ChatHeader
                    theirName={theirName}
                    theirAvatar={theirAvatar}
                    isOnline={isOnline}
                    typing={typing}
                    onBack={handleBack}
                    onShowOptions={function() {
                        setShowOptions(function(v) { return !v; });
                    }}
                    showOptions={showOptions}
                    isDark={isDark}
                    T={T}
                />

                {/* Menu Options */}
                <div style={{ position: 'absolute', top: 0, right: 0, padding: '0 12px' }}>
                    <AnimatePresence>
                        {showOptions && (
                            <ChatOptionsMenu
                                matchId={match.id}
                                onClose={function() { setShowOptions(false); }}
                                onUnmatch={function() { messagesAPI.unmatch(match.id); }}
                                onDelete={function() { messagesAPI.deleteConversation(match.id); }}
                                isDark={isDark}
                                T={T}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── MESSAGES ─────────────────────────────────────────────── */}
            <div
                ref={messagesArea}
                onScroll={handleScroll}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: '12px 14px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    WebkitOverflowScrolling: 'touch',
                    position: 'relative',
                }}
            >
                {/* Voir plus de messages */}
                {hasMore && !loading && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={function() { loadMessages(page + 1); }}
                        style={{
                            alignSelf: 'center', marginBottom: 14,
                            background: 'none',
                            border: '1px solid ' + chatBorderColor(isDark),
                            color: T.textSoft,
                            padding: '6px 22px', borderRadius: 50,
                            fontFamily: CHAT_FONT,
                            fontSize: 12, cursor: 'pointer',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={function(e) {
                            e.currentTarget.style.background = isDark
                                ? 'rgba(255,255,255,0.05)'
                                : 'rgba(0,0,0,0.04)';
                        }}
                        onMouseLeave={function(e) {
                            e.currentTarget.style.background = 'none';
                        }}
                    >
                        Voir les messages précédents
                    </motion.button>
                )}

                {/* Skeleton loading */}
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}
                    >
                        {[false, true, false, false, true, false, true].map(function(isMe, i) {
                            return <MessageSkeleton key={i} isMe={isMe} isDark={isDark} />;
                        })}
                    </motion.div>
                )}

                {/* État vide */}
                {isEmpty && (
                    <ChatEmptyState
                        name={theirName}
                        avatar={theirAvatar}
                        isDark={isDark}
                        T={T}
                    />
                )}

                {/* Messages */}
                {!loading && (
                    <AnimatePresence initial={false}>
                        {grouped.map(function(item) {
                            if (item.type === 'separator') {
                                return (
                                    <DateSeparator
                                        key={item.key}
                                        date={item.date}
                                        T={T}
                                        isDark={isDark}
                                    />
                                );
                            }
                            return (
                                <MessageBubble
                                    key={item.key}
                                    message={item.msg}
                                    isMe={item.msg.is_me}
                                    showAvatar={item.showAvatar}
                                    avatar={theirAvatar}
                                    T={T}
                                    isDark={isDark}
                                />
                            );
                        })}
                    </AnimatePresence>
                )}

                {/* Indicateur de frappe */}
                <AnimatePresence>
                    {typing && (
                        <TypingIndicator
                            avatar={theirAvatar}
                            isDark={isDark}
                            T={T}
                        />
                    )}
                </AnimatePresence>

                <div ref={messagesEnd} style={{ height: 8 }} />
            </div>

            {/* Bouton scroll to bottom */}
            <AnimatePresence>
                {showScrollBtn && (
                    <div style={{ position: 'absolute', bottom: 80, right: 16, zIndex: 300 }}>
                        <ScrollToBottomBtn
                            onClick={scrollToBottom}
                            isDark={isDark}
                            count={newMsgCount}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* ── INPUT BAR avec animation morphing ────────────────────── */}
            {navMorphDone && (
                <MorphingInputBar
                    onSend={handleSend}
                    onVoice={handleVoice}
                    onTyping={handleTyping}
                    T={T}
                    isDark={isDark}
                />
            )}
            {!navMorphDone && <div style={{ height: 82, flexShrink: 0 }} />}


            {/* Fermer les options si clic ailleurs */}
            {showOptions && (
                <div
                    onClick={function() { setShowOptions(false); }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 150,
                    }}
                />
            )}

            <style>{`
                @keyframes llspin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// MESSAGESTAB
// ══════════════════════════════════════════════════════════════════════════════

function MatchBubble({ match, isNew, onClick, T, isDark }) {
    return (
        <motion.div
            whileTap={{ scale: 0.93 }}
            onClick={onClick}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, cursor:'pointer', flexShrink:0 }}
        >
            <div style={{ position:'relative' }}>
                {/* Ring gradient */}
                <div style={{
                    width: 68, height: 68, borderRadius: '50%', padding: 2.5,
                    background: isNew
                        ? 'linear-gradient(135deg, #F2C94C, #BE185D, #F472B6)'
                        : 'rgba(190,24,93,0.20)',
                    boxShadow: isNew ? '0 4px 20px rgba(190,24,93,0.30)' : 'none',
                }}>
                    <div style={{
                        width:'100%', height:'100%', borderRadius:'50%',
                        overflow:'hidden', border:`2px solid ${T.bg}`,
                    }}>
                        <img src={match.their_avatar || match.avatar}
                             alt={match.their_name || match.name}
                             style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    </div>
                </div>
                {match.is_online && (
                    <div style={{
                        position:'absolute', bottom:2, right:2,
                        width:13, height:13, borderRadius:'50%',
                        background:'#10B981', border:`2px solid ${T.bg}`,
                    }} />
                )}
                {isNew && (
                    <div style={{
                        position:'absolute', top:-3, right:-3,
                        background:'linear-gradient(135deg,#F2C94C,#BE185D)',
                        color:'#fff', fontFamily:"'Poppins',sans-serif",
                        fontSize:8, fontWeight:800,
                        padding:'2px 5px', borderRadius:6,
                        border:`1.5px solid ${T.bg}`,
                        letterSpacing:'0.05em',
                    }}>NEW</div>
                )}
            </div>
            <span style={{
                fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:500,
                color:T.textSoft, maxWidth:64, textAlign:'center',
                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>
                {match.their_name || match.name}
            </span>
        </motion.div>
    );
}

function ConversationRow({ conversation, onClick, T, isDark }) {
    const hasUnread = conversation.unread_count > 0;
    const lastMsg   = conversation.last_message;

    const timeStr = (() => {
        if (!lastMsg) return '';
        const d = new Date(lastMsg.created_at);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return 'maintenant';
        if (diff < 3600000) return `${Math.floor(diff/60000)}m`;
        if (diff < 86400000) return d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
        if (diff < 604800000) return d.toLocaleDateString('fr-FR',{weekday:'short'});
        return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'});
    })();

    return (
        <motion.div
            whileTap={{ scale: 0.99 }}
            onClick={onClick}
            style={{
                display:'flex', alignItems:'center', gap:14,
                padding:'12px 16px', borderRadius:20, cursor:'pointer',
                background: hasUnread
                    ? (isDark ? 'rgba(190,24,93,0.08)' : 'rgba(190,24,93,0.05)')
                    : 'transparent',
                marginBottom:4,
                transition:'background 0.2s',
            }}
        >
            {/* Avatar */}
            <div style={{ position:'relative', flexShrink:0 }}>
                <div style={{
                    width:56, height:56, borderRadius:'50%', overflow:'hidden',
                    border: hasUnread ? '2.5px solid #BE185D' : '2px solid rgba(190,24,93,0.20)',
                    boxShadow: hasUnread ? '0 0 16px rgba(190,24,93,0.25)' : 'none',
                    transition:'all 0.3s',
                }}>
                    <img src={conversation.their_avatar || conversation.avatar}
                         alt={conversation.their_name || conversation.name}
                         style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
                {conversation.is_online && (
                    <div style={{
                        position:'absolute', bottom:1, right:1,
                        width:12, height:12, borderRadius:'50%',
                        background:'#10B981', border:`2px solid ${T.bg}`,
                    }} />
                )}
            </div>

            {/* Content */}
            <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:3 }}>
                    <span style={{
                        fontFamily:"'Poppins',sans-serif",
                        fontSize:15, fontWeight: hasUnread ? 700 : 500,
                        color: hasUnread ? T.text : T.textMid,
                    }}>
                        {conversation.their_name || conversation.name}
                    </span>
                    <span style={{
                        fontFamily:"'Poppins',sans-serif", fontSize:11,
                        color: hasUnread ? '#BE185D' : T.textMuted,
                        fontWeight: hasUnread ? 700 : 400,
                        flexShrink:0, marginLeft:8,
                    }}>
                        {timeStr}
                    </span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <p style={{
                        fontFamily:"'Poppins',sans-serif", fontSize:12,
                        color: hasUnread ? T.textSoft : T.textMuted,
                        fontWeight: hasUnread ? 500 : 400,
                        margin:0, whiteSpace:'nowrap',
                        overflow:'hidden', textOverflow:'ellipsis', flex:1,
                    }}>
                        {lastMsg?.is_me && '→ '}
                        {lastMsg?.type === 'voice' ? '🎤 Message vocal' : (lastMsg?.content || 'Dites bonjour 👋')}
                    </p>
                    {hasUnread && (
                        <div style={{
                            background:'linear-gradient(135deg,#F2C94C,#BE185D)',
                            color:'#fff', borderRadius:10,
                            minWidth:20, height:20,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontFamily:"'Poppins',sans-serif",
                            fontSize:10, fontWeight:800,
                            padding:'0 5px', marginLeft:8, flexShrink:0,
                            boxShadow:'0 2px 8px rgba(190,24,93,0.30)',
                        }}>
                            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function MessagesTab({ isPremium, initialMatchId }) {
    const { T, isDark } = useTheme();
    const [matches, setMatches]             = useState([]);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading]             = useState(true);
    const [activeChat, setActiveChat]       = useState(null);
    const [showPremium, setShowPremium]     = useState(false);
    const [search, setSearch]               = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const notifSocketRef  = useRef(null);



    const loadData = async () => {
        setLoading(true);
        try {
            const [matchData, convData] = await Promise.all([
                messagesAPI.getMatches(),
                messagesAPI.getConversations(),
            ]);
            const normaliseMatch = (m) => ({
                ...m,
                their_name:   m.other_first_name || m.their_name || '',
                their_avatar: m.other_photo
                   ? (m.other_photo.startsWith('http') ? m.other_photo : getBaseUrl() + m.other_photo)
                    : null,
                has_conversation: m.conversation_id != null,
            });

            setMatches((matchData.matches || matchData || []).map(normaliseMatch));
            setConversations((convData.conversations || convData || []).map(normaliseMatch));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        if (initialMatchId && !loading) {
            const conv = conversations.find(c => c.id === initialMatchId)
                || matches.find(m => m.id === initialMatchId);
            if (conv) setActiveChat(conv);
        }
    }, [initialMatchId, loading, conversations, matches]);

    useEffect(() => {
        notifSocketRef.current = new NotificationSocket({
            onNotification: (event) => {
                if (event.type === 'new_message') {
                    setConversations(prev => prev.map(c =>
                        c.id === event.match_id
                            ? { ...c, last_message: event.message, unread_count: (c.unread_count || 0) + 1 }
                            : c
                    ).sort((a, b) => {
                        var aTime = a.last_message && a.last_message.created_at ? new Date(a.last_message.created_at) : 0;
                        var bTime = b.last_message && b.last_message.created_at ? new Date(b.last_message.created_at) : 0;
                        return bTime - aTime;
                    }));
                } else if (event.type === 'new_match') {
                    setMatches(prev => [event.match, ...prev]);
                }
            },
            onBadgeUpdate: () => {},
        });
        notifSocketRef.current.connect();
        return () => {
            if (notifSocketRef.current) { notifSocketRef.current.disconnect(); }
        };
    }, []);
    if (activeChat) {
        return (
            <ChatView
                match={activeChat}
                onBack={() => { setActiveChat(null); loadData(); }}
                isPremium={isPremium}
                onShowPremium={(f) => setShowPremium(f)}
            />
        );
    }

    const filteredConvs = search.trim()
        ? conversations.filter(c =>
            (c.their_name || c.name || '').toLowerCase().includes(search.toLowerCase()))
        : conversations;

    const newMatches = matches.filter(m => !m.has_conversation);
    const unreadCount = conversations.filter(c => c.unread_count > 0).length;

    return (
        <div style={{ height:'100%', overflowY:'auto', background:T.bg, paddingBottom:100 }}>

            {/* ── HEADER ── */}
            <div style={{
                background: 'linear-gradient(135deg, #F2C94C 0%, #F472B6 50%, #BE185D 100%)',
                paddingTop: 'max(54px, env(safe-area-inset-top))',
                paddingLeft: 22, paddingRight: 22, paddingBottom: 56,
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position:'absolute', top:-50, right:-50, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }} />
                <div style={{ position:'absolute', bottom:-30, left:-30, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />
                <div style={{ position:'absolute', top:'30%', right:'20%', width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />

                {/* Top row */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, position:'relative', zIndex:1 }}>
                    <div style={{
                        display:'inline-flex', alignItems:'center', gap:6,
                        background:'rgba(255,255,255,0.20)', backdropFilter:'blur(10px)',
                        borderRadius:20, padding:'5px 14px',
                        border:'1px solid rgba(255,255,255,0.30)',
                    }}>
                        <MessageCircle size={12} color="#fff" strokeWidth={2.5} />
                        <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:700, color:'#fff' }}>
                            {unreadCount > 0 ? `${unreadCount} non lu${unreadCount > 1 ? 's' : ''}` : 'Messages'}
                        </span>
                    </div>
                    {!isPremium && (
                        <motion.div
                            whileTap={{ scale:0.95 }}
                            onClick={() => setShowPremium('messages')}
                            style={{
                                display:'flex', alignItems:'center', gap:6,
                                background:'rgba(255,255,255,0.22)', backdropFilter:'blur(10px)',
                                borderRadius:20, padding:'5px 14px',
                                border:'1px solid rgba(255,255,255,0.35)',
                                cursor:'pointer',
                            }}
                        >
                            <Lock size={11} color="#fff" strokeWidth={2.5} />
                            <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:700, color:'#fff' }}>Premium</span>
                        </motion.div>
                    )}
                </div>

                <h1 style={{ fontFamily:"'Poppins',sans-serif", fontSize:28, fontWeight:800, color:'#fff', margin:'0 0 6px', letterSpacing:'-0.02em', position:'relative', zIndex:1 }}>
                    Messages
                </h1>
                <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:'rgba(255,255,255,0.78)', margin:0, position:'relative', zIndex:1 }}>
                    {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </p>

                {/* Vague */}
                <svg viewBox="0 0 390 50" preserveAspectRatio="none"
                     style={{ position:'absolute', bottom:-1, left:0, width:'100%', height:50, display:'block' }}>
                    <path d="M0,15 C80,45 150,0 240,28 C310,50 360,10 390,22 L390,50 L0,50 Z"
                          fill={T.bg} />
                </svg>
            </div>

            <div style={{ padding:'0 16px' }}>

                {/* ── BANNIÈRE FREE ── */}
                {!isPremium && (
                    <motion.div
                        initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
                        onClick={() => setShowPremium('messages')}
                        style={{
                            background:'linear-gradient(135deg,#BE185D,#F472B6,#F2C94C)',
                            borderRadius:24, padding:'18px 20px', marginTop:20, marginBottom:24,
                            cursor:'pointer', position:'relative', overflow:'hidden',
                            boxShadow:'0 12px 40px rgba(190,24,93,0.25)',
                        }}
                    >
                        <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.10)', pointerEvents:'none' }} />
                        <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:14 }}>
                            <div style={{
                                width:44, height:44, borderRadius:'50%',
                                background:'rgba(255,255,255,0.22)',
                                backdropFilter:'blur(10px)',
                                border:'1.5px solid rgba(255,255,255,0.35)',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                flexShrink:0,
                            }}>
                                <Clock size={20} color="#fff" strokeWidth={2} />
                            </div>
                            <div style={{ flex:1 }}>
                                <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:15, fontWeight:800, color:'#fff', marginBottom:4 }}>
                                    24h pour briser la glace
                                </div>
                                <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:'rgba(255,255,255,0.85)', lineHeight:1.5, margin:0 }}>
                                    Passez Premium — échangez sans limite
                                </p>
                            </div>
                            <div style={{
                                display:'flex', alignItems:'center', gap:6,
                                background:'rgba(255,255,255,0.22)', backdropFilter:'blur(10px)',
                                borderRadius:50, padding:'8px 14px',
                                border:'1.5px solid rgba(255,255,255,0.35)', flexShrink:0,
                            }}>
                                <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, fontWeight:700, color:'#fff' }}>Débloquer</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── NOUVEAUX MATCHS ── */}
                {(loading || newMatches.length > 0) && (
                    <div style={{ marginBottom:24, marginTop: isPremium ? 20 : 0 }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                            <div>
                                <h3 style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:800, color:T.text, margin:0, letterSpacing:'-0.01em' }}>
                                    Nouveaux matchs
                                </h3>
                                <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:T.textMuted, margin:'2px 0 0' }}>
                                    {newMatches.length} en attente
                                </p>
                            </div>
                            <div style={{
                                background:'linear-gradient(135deg,#F2C94C,#BE185D)',
                                borderRadius:20, padding:'4px 12px',
                                boxShadow:'0 4px 12px rgba(190,24,93,0.25)',
                            }}>
                                <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:700, color:'#fff' }}>
                                    {newMatches.length}
                                </span>
                            </div>
                        </div>
                        <div style={{ display:'flex', gap:14, overflowX:'auto', paddingBottom:8, scrollbarWidth:'none' }}>
                            {loading
                                ? Array.from({ length:4 }).map((_,i) => (
                                    <div key={i} style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                                        <motion.div animate={{ opacity:[0.4,0.8,0.4] }} transition={{ duration:1.5, repeat:Infinity, delay:i*0.1 }}
                                                    style={{ width:68, height:68, borderRadius:'50%', background: isDark ? '#2A1020' : '#FCE7F3' }} />
                                        <motion.div animate={{ opacity:[0.4,0.8,0.4] }} transition={{ duration:1.5, repeat:Infinity, delay:i*0.1+0.1 }}
                                                    style={{ width:48, height:8, borderRadius:4, background: isDark ? '#2A1020' : '#FCE7F3' }} />
                                    </div>
                                ))
                                : newMatches.map((match, i) => (
                                    <motion.div key={match.id} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.08 }}>
                                        <MatchBubble match={match} isNew={match.is_new} onClick={() => setActiveChat(match)} T={T} isDark={isDark} />
                                    </motion.div>
                                ))
                            }
                        </div>
                    </div>
                )}

                {/* ── SEARCH ── */}
                <div style={{ marginBottom:20, position:'relative' }}>
                    <div style={{
                        position:'absolute', left:16, top:'50%',
                        transform:'translateY(-50%)', pointerEvents:'none', zIndex:1,
                    }}>
                        <Search size={15} color={searchFocused ? '#BE185D' : T.textSoft} strokeWidth={2} />
                    </div>
                    <input
                        type="text" value={search}
                        onChange={e => setSearch(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        placeholder="Rechercher une conversation..."
                        style={{
                            width:'100%', padding:'13px 16px 13px 44px',
                            borderRadius:50, boxSizing:'border-box',
                            border: searchFocused ? '1.5px solid rgba(190,24,93,0.50)' : '1.5px solid rgba(190,24,93,0.15)',
                            background: isDark ? 'rgba(30,10,20,0.80)' : 'rgba(255,255,255,0.90)',
                            backdropFilter:'blur(12px)',
                            fontFamily:"'Poppins',sans-serif", fontSize:13, color:T.text,
                            outline:'none',
                            boxShadow: searchFocused ? '0 4px 20px rgba(190,24,93,0.12)' : '0 2px 12px rgba(0,0,0,0.05)',
                            transition:'all 0.25s',
                        }}
                    />
                </div>

                {/* ── CONVERSATIONS ── */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <h3 style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:800, color:T.text, margin:0 }}>
                        Conversations
                    </h3>
                    {unreadCount > 0 && (
                        <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:'#BE185D', fontWeight:600 }}>
                            {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {loading ? (
                    Array.from({ length:5 }).map((_,i) => (
                        <div key={i} style={{ display:'flex', gap:14, padding:'12px 0', alignItems:'center' }}>
                            <motion.div animate={{ opacity:[0.4,0.8,0.4] }} transition={{ duration:1.5, repeat:Infinity, delay:i*0.1 }}
                                        style={{ width:56, height:56, borderRadius:'50%', background: isDark ? '#2A1020' : '#FCE7F3', flexShrink:0 }} />
                            <div style={{ flex:1 }}>
                                <motion.div animate={{ opacity:[0.4,0.8,0.4] }} transition={{ duration:1.5, repeat:Infinity, delay:i*0.1+0.1 }}
                                            style={{ height:13, width:'55%', borderRadius:6, background: isDark ? '#2A1020' : '#FCE7F3', marginBottom:8 }} />
                                <motion.div animate={{ opacity:[0.4,0.8,0.4] }} transition={{ duration:1.5, repeat:Infinity, delay:i*0.1+0.2 }}
                                            style={{ height:10, width:'80%', borderRadius:6, background: isDark ? '#2A1020' : '#FCE7F3' }} />
                            </div>
                        </div>
                    ))
                ) : filteredConvs.length === 0 ? (
                    <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                                style={{
                                    textAlign:'center', padding:'48px 20px',
                                    background: isDark ? 'rgba(30,10,20,0.60)' : 'rgba(255,255,255,0.80)',
                                    borderRadius:24, border:'1px solid rgba(190,24,93,0.10)',
                                    boxShadow:'0 8px 32px rgba(190,24,93,0.06)',
                                }}
                    >
                        <div style={{
                            width:72, height:72, borderRadius:'50%',
                            background:'linear-gradient(135deg,rgba(242,201,76,0.15),rgba(190,24,93,0.10))',
                            border:'1.5px solid rgba(190,24,93,0.20)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            margin:'0 auto 16px',
                        }}>
                            <MessageCircle size={32} color="#BE185D" strokeWidth={1.5} />
                        </div>
                        <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:16, fontWeight:700, color:T.text, marginBottom:8 }}>
                            {search.trim() ? 'Aucun résultat' : 'Aucune conversation'}
                        </div>
                        <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:T.textSoft, lineHeight:1.6 }}>
                            {search.trim()
                                ? 'Essaie un autre prénom'
                                : 'Tes premières conversations naîtront de tes premiers matchs'
                            }
                        </p>
                    </motion.div>
                ) : (
                    <AnimatePresence>
                        {filteredConvs.map((conv, i) => (
                            <motion.div key={conv.id}
                                        initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }}
                                        transition={{ delay:i*0.04 }}
                            >
                                <ConversationRow conversation={conv} onClick={() => setActiveChat(conv)} T={T} isDark={isDark} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {showPremium && (
                <PremiumModal
                    feature={showPremium}
                    onClose={() => setShowPremium(false)}
                    onSubscribe={() => setShowPremium(false)}
                />
            )}

            <style>{`
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
// PROFILETAB
// ══════════════════════════════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════════════
   Profile Tab (COMPLETE)
   Profile editing, photos, verification, settings, notifications
   ═══════════════════════════════════════════════════════════════ */

// ─── All interests pool ───────────────────────────────────────────────────────
const ALL_INTERESTS = [
    'Musique', 'Littérature', 'Art', 'Tech', 'Sport',
    'Voyage', 'Cuisine', 'Gaming', 'Nature', 'Photo',
    'Théâtre', 'Danse', 'Fitness', 'Cinéma', 'Sciences',
    'Droit', 'Médecine', 'Architecture', 'Guitare', 'Piano',
    'Langues', 'Plongée', 'Échecs', 'Mode', 'Surf',
    'Écriture', 'Chant', 'Économie', 'Écologie', 'Animaux',
];

const UK_FACULTIES = [
    'FAST (Sciences & Tech)', 'FLESH (Lettres & Sciences Humaines)',
    'FDSP (Droit & Économie)', 'FSSE (Sciences Sociales & Éducation)',
    'FSS(Médecine & Sciences de la Santé)',
    'IUT (Institut Universitaire de Technologie)',
    'ENPV (École Nationale des Paramédicaux)',
    'IFSST (Institut Formation Santé)',
];

// ─── Progress ring ─────────────────────────────────────────────────────────────
function ProfileProgress({ percent, T }) {
    const r = 36;
    const circumference = 2 * Math.PI * r;
    const offset = circumference * (1 - percent / 100);
    return (
        <div style={{ position: 'relative', width: 88, height: 88 }}>
            <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="44" cy="44" r={r} fill="none" stroke={`${T.gold}22`} strokeWidth="5" />
                <circle cx="44" cy="44" r={r} fill="none" stroke={T.gold} strokeWidth="5"
                        strokeDasharray={circumference} strokeDashoffset={offset}
                        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
            </svg>
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
                <span style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 17, fontWeight: 800, color: T.gold }}>{percent}%</span>
                <span style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 7, color: T.textSoft, letterSpacing: '0.1em', textTransform: 'uppercase' }}>complet</span>
            </div>
        </div>
    );
}

// ─── Verification Gate Modal ──────────────────────────────────────────────────
function VerificationGateModal({ onClose, onGoVerify, T, isDark }) {
    return (
        <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{
                position:'fixed', inset:0, zIndex:9000,
                background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)',
                display:'flex', alignItems:'center', justifyContent:'center',
                padding:'20px',
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale:0.85, y:40 }} animate={{ scale:1, y:0 }}
                exit={{ scale:0.85, y:40 }}
                transition={{ type:'spring', stiffness:400, damping:30 }}
                onClick={e => e.stopPropagation()}
                style={{
                    width:'100%', maxWidth:360,
                    background: isDark ? '#1A0812' : '#fff',
                    borderRadius:32,
                    overflow:'hidden',
                    boxShadow:'0 32px 80px rgba(0,0,0,0.40)',
                }}
            >
                {/* Header gradient */}
                <div style={{
                    background:'linear-gradient(135deg,#9D174D,#BE185D,#F472B6)',
                    padding:'32px 24px 40px',
                    position:'relative', overflow:'hidden',
                    textAlign:'center',
                }}>
                    <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
                    <div style={{ position:'absolute', bottom:-20, left:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />

                    <div style={{
                        width:72, height:72, borderRadius:'50%',
                        background:'rgba(255,255,255,0.20)',
                        backdropFilter:'blur(10px)',
                        border:'2px solid rgba(255,255,255,0.35)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        margin:'0 auto 16px',
                        position:'relative', zIndex:1,
                    }}>
                        <ShieldCheck size={34} color="#fff" strokeWidth={1.8} />
                    </div>

                    <h2 style={{
                        fontFamily:"'Poppins',sans-serif", fontSize:20, fontWeight:800,
                        color:'#fff', margin:'0 0 8px', letterSpacing:'-0.02em',
                        position:'relative', zIndex:1,
                    }}>
                        Vérification requise
                    </h2>
                    <p style={{
                        fontFamily:"'Poppins',sans-serif", fontSize:13,
                        color:'rgba(255,255,255,0.82)', margin:0, lineHeight:1.6,
                        position:'relative', zIndex:1,
                    }}>
                        Cette fonctionnalité est réservée aux étudiants vérifiés de l'Université de Kara
                    </p>
                </div>

                {/* Body */}
                <div style={{ padding:'24px' }}>
                    {/* Pourquoi */}
                    {[
                        { icon:<GraduationCap size={18} color="#BE185D" strokeWidth={2}/>, text:'Confirme ton statut d\'étudiant UK' },
                        { icon:<Shield size={18} color="#BE185D" strokeWidth={2}/>, text:'Protège la communauté contre les intrus' },
                        { icon:<Users size={18} color="#BE185D" strokeWidth={2}/>, text:'Accède aux fonctions campus Nord/Sud' },
                    ].map((item, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                            <div style={{
                                width:36, height:36, borderRadius:10, flexShrink:0,
                                background:'linear-gradient(135deg,rgba(242,201,76,0.12),rgba(190,24,93,0.08))',
                                border:'1px solid rgba(190,24,93,0.15)',
                                display:'flex', alignItems:'center', justifyContent:'center',
                            }}>
                                {item.icon}
                            </div>
                            <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:T.text, lineHeight:1.4 }}>
                                {item.text}
                            </span>
                        </div>
                    ))}

                    {/* Boutons */}
                    <motion.button
                        whileTap={{ scale:0.97 }}
                        onClick={onGoVerify}
                        style={{
                            width:'100%', padding:'14px',
                            borderRadius:50, border:'none', cursor:'pointer',
                            background:'linear-gradient(135deg,#BE185D,#F472B6)',
                            color:'#fff', fontFamily:"'Poppins',sans-serif",
                            fontSize:14, fontWeight:700,
                            boxShadow:'0 8px 24px rgba(190,24,93,0.30)',
                            marginBottom:10,
                        }}
                    >
                        Vérifier mon profil
                    </motion.button>

                    <button onClick={onClose} style={{
                        width:'100%', padding:'12px',
                        borderRadius:50, border:'1.5px solid rgba(190,24,93,0.20)',
                        background:'transparent', cursor:'pointer',
                        fontFamily:"'Poppins',sans-serif", fontSize:13,
                        fontWeight:600, color:T.textSoft,
                    }}>
                        Plus tard
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange, T }) {
    return (
        <motion.div onClick={() => onChange(!value)}
                    animate={{ backgroundColor: value ? T.gold : `${T.textMuted}44` }}
                    style={{ width: 44, height: 26, borderRadius: 13, padding: 3, cursor: 'pointer', flexShrink: 0 }}
        >
            <motion.div animate={{ x: value ? 18 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff' }} />
        </motion.div>
    );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function SectionCard({ title, hint, children, T, isDark }) {
    return (
        <div style={{
            background: isDark ? 'rgba(30,16,32,0.65)' : 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${T.gold}22`,
            borderRadius: 24, padding: '20px', marginBottom: 16,
        }}>
            <h3 style={{
                fontFamily: "'Playfair Display',sans-serif", fontSize: 11, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: T.textSoft, marginBottom: hint ? 6 : 16,
            }}>{title}</h3>
            {hint && <p style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 12, color: T.textMuted, lineHeight: 1.6, marginBottom: 16 }}>{hint}</p>}
            {children}
        </div>
    );
}

// ─── Row item (for settings) ──────────────────────────────────────────────────
function SettingRow({ icon, label, sub, right, onClick, danger, T, isDark }) {
    return (
        <motion.div whileTap={{ scale: 0.99 }} onClick={onClick} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 0',
            borderBottom: `1px solid ${T.gold}11`,
            cursor: onClick ? 'pointer' : 'default',
        }}>
            {icon && (
                <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: danger ? 'rgba(244,67,54,0.10)' : `${T.gold}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: 18,
                }}>{icon}</div>
            )}
            <div style={{ flex: 1 }}>
                <div style={{
                    fontFamily: "'Playfair Display',sans-serif", fontSize: 14, fontWeight: 600,
                    color: danger ? '#F44336' : T.text,
                }}>{label}</div>
                {sub && <div style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 12, color: T.textMuted, marginTop: 2, lineHeight: 1.5 }}>{sub}</div>}
            </div>
            {right}
            {onClick && !right && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3l5 5-5 5" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            )}
        </motion.div>
    );
}

// ─── Photo grid ───────────────────────────────────────────────────────────────
function PhotoGrid({ photos, onUpload, onDelete, onSetMain, T, isDark }) {
    const [uploading, setUploading] = useState(false);
    const MAX = 6;

    const handleFile = async (file) => {
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('photo', file); // singulier — correspond au backend Django
            await onUpload(fd);
        } catch (e) {
            console.error('Upload error:', e);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            {/* Compteur */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:T.textMuted }}>
                    {photos.length}/{MAX} photos
                </span>
                {uploading && (
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
                                    style={{ width:12, height:12, borderRadius:'50%', border:'2px solid rgba(190,24,93,0.20)', borderTopColor:'#BE185D' }} />
                        <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:'#BE185D' }}>Envoi...</span>
                    </div>
                )}
            </div>

            {/* Grille */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                {Array.from({ length: MAX }).map((_, i) => {
                    const photo = photos[i];
                    return (
                        <motion.div key={i}
                                    whileHover={photo ? { scale:1.02 } : {}}
                                    style={{
                                        aspectRatio:'3/4', borderRadius:20, overflow:'hidden',
                                        position:'relative',
                                        background: isDark ? 'rgba(190,24,93,0.08)' : 'rgba(190,24,93,0.05)',
                                        border: photo ? 'none' : '2px dashed rgba(190,24,93,0.25)',
                                        boxShadow: photo ? '0 8px 24px rgba(0,0,0,0.15)' : 'none',
                                    }}
                        >
                            {photo ? (
                                <>
                                    <img src={photoUrl(photo.url) || photo.url} alt=""
                                         style={{ width:'100%', height:'100%', objectFit:'cover' }} />

                                    {/* Badge principale */}
                                    {photo.is_main && (
                                        <div style={{
                                            position:'absolute', top:8, left:8,
                                            background:'linear-gradient(135deg,#F2C94C,#BE185D)',
                                            borderRadius:10, padding:'3px 8px',
                                            boxShadow:'0 2px 8px rgba(190,24,93,0.30)',
                                        }}>
                                            <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:8, fontWeight:800, color:'#fff', letterSpacing:'0.05em' }}>
                                                PRINCIPALE
                                            </span>
                                        </div>
                                    )}

                                    {/* Overlay actions */}
                                    <div style={{
                                        position:'absolute', bottom:0, left:0, right:0,
                                        background:'linear-gradient(0deg,rgba(0,0,0,0.80) 0%,transparent 100%)',
                                        padding:'24px 8px 8px',
                                        display:'flex', gap:6, justifyContent:'flex-end',
                                    }}>
                                        {!photo.is_main && (
                                            <motion.button whileTap={{ scale:0.88 }}
                                                           onClick={e => { e.stopPropagation(); onSetMain(photo.id); }}
                                                           style={{
                                                               width:30, height:30, borderRadius:'50%',
                                                               background:'rgba(242,201,76,0.90)',
                                                               border:'none', cursor:'pointer',
                                                               display:'flex', alignItems:'center', justifyContent:'center',
                                                           }}
                                                           title="Définir comme principale"
                                            >
                                                <Star size={13} color="#fff" strokeWidth={2.5} />
                                            </motion.button>
                                        )}
                                        <motion.button whileTap={{ scale:0.88 }}
                                                       onClick={e => { e.stopPropagation(); onDelete(photo.id); }}
                                                       style={{
                                                           width:30, height:30, borderRadius:'50%',
                                                           background:'rgba(239,68,68,0.88)',
                                                           border:'none', cursor:'pointer',
                                                           display:'flex', alignItems:'center', justifyContent:'center',
                                                       }}
                                                       title="Supprimer"
                                        >
                                            <X size={13} color="#fff" strokeWidth={2.5} />
                                        </motion.button>
                                    </div>
                                </>
                            ) : (
                                <label style={{
                                    width:'100%', height:'100%',
                                    display:'flex', flexDirection:'column',
                                    alignItems:'center', justifyContent:'center',
                                    cursor: uploading ? 'wait' : 'pointer',
                                    gap:8,
                                }}>
                                    <div style={{
                                        width:40, height:40, borderRadius:'50%',
                                        background:'rgba(190,24,93,0.10)',
                                        border:'1.5px solid rgba(190,24,93,0.25)',
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                        transition:'all 0.2s',
                                    }}>
                                        {uploading
                                            ? <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
                                                          style={{ width:16, height:16, borderRadius:'50%', border:'2px solid rgba(190,24,93,0.20)', borderTopColor:'#BE185D' }} />
                                            : <Plus size={18} color="#BE185D" strokeWidth={2.5} />
                                        }
                                    </div>
                                    <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:10, fontWeight:600, color:'#BE185D' }}>
                                        Ajouter
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        style={{ display:'none' }}
                                        disabled={uploading}
                                        onChange={e => handleFile(e.target.files?.[0])}
                                    />
                                </label>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:T.textMuted, marginTop:12, textAlign:'center', lineHeight:1.5 }}>
                Appuie sur ★ pour définir ta photo principale · Max {MAX} photos
            </p>
        </div>
    );
}
// ─── Verification section ──────────────────────────────────────────────────────
function VerificationSection({ status, T, isDark }) {
    const inputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const submit = async () => {
        if (!file) return;
        setSubmitting(true);
        const fd = new FormData();
        fd.append('student_card', file);
        try {
            await profileAPI.requestVerification(fd);
            setDone(true);
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    if (status?.is_verified) return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(33,150,243,0.08)', borderRadius: 16,
            border: '1px solid rgba(33,150,243,0.25)', padding: '16px 20px',
        }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="14" fill="#1565C0" />
                <path d="M8 14l4 4 8-8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
                <div style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 14, fontWeight: 700, color: '#1565C0' }}>
                    Profil Vérifié ✓
                </div>
                <div style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 12, color: T.textSoft }}>
                    Tu es reconnu(e) comme étudiant(e) de l'Université de Kara
                </div>
            </div>
        </div>
    );

    if (status?.status === 'pending' || done) return (
        <div style={{
            background: 'rgba(255,152,0,0.08)', borderRadius: 16,
            border: '1px solid rgba(255,152,0,0.25)', padding: '16px 20px',
        }}>
            <div style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 14, fontWeight: 700, color: '#E65100', marginBottom: 4 }}>
                ⏳ Vérification en cours
            </div>
            <p style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 12, color: T.textSoft, lineHeight: 1.6 }}>
                Ton dossier est entre les mains de notre équipe. La vérification prend généralement 24 à 48h.
                Un badge bleu ornera bientôt ton profil — la marque des âmes authentiques.
            </p>
        </div>
    );

    return (
        <div>
            <p style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 13, color: T.textSoft, lineHeight: 1.6, marginBottom: 16 }}>
                Prouve ton appartenance à l'Université de Kara et obtiens le badge bleu.
                Une marque d'authenticité qui multiplie ta crédibilité.
            </p>
            <input ref={inputRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
                   onChange={e => setFile(e.target.files[0])} />
            {file ? (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
                    padding: '10px 14px', borderRadius: 12,
                    background: isDark ? 'rgba(212,175,55,0.10)' : 'rgba(212,175,55,0.08)',
                    border: `1px solid ${T.gold}33`,
                }}>
                    <span style={{ fontSize: 18 }}>📄</span>
                    <span style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 12, color: T.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {file.name}
          </span>
                    <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: T.textSoft, cursor: 'pointer' }}>✕</button>
                </div>
            ) : (
                <button onClick={() => inputRef.current?.click()} style={{
                    width: '100%', padding: '14px',
                    borderRadius: 14, border: `1.5px dashed ${T.gold}55`,
                    background: isDark ? 'rgba(212,175,55,0.05)' : 'rgba(212,175,55,0.04)',
                    cursor: 'pointer', marginBottom: 14,
                    fontFamily: "'Playfair Display',sans-serif", fontSize: 13, color: T.textSoft,
                }}>
                    📎 Glisser ou sélectionner ta carte étudiante / lettre de scolarité
                </button>
            )}
            {file && (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                               onClick={submit} disabled={submitting}
                               style={{
                                   width: '100%', padding: '14px',
                                   borderRadius: 50, border: 'none',
                                   background: `linear-gradient(135deg, #1565C0, #1976D2)`,
                                   color: '#fff', cursor: submitting ? 'wait' : 'pointer',
                                   fontFamily: "'Playfair Display',sans-serif", fontSize: 14, fontWeight: 700,
                               }}>
                    {submitting ? 'Envoi en cours...' : '✓ Soumettre pour vérification'}
                </motion.button>
            )}
        </div>
    );
}

// ─── Sub-tabs ─────────────────────────────────────────────────────────────────
const SUB_TABS = [
    { id: 'profile',       label: 'Mon Profil',     emoji: '' },
    { id: 'settings',      label: 'Découverte',     emoji: '' },
    { id: 'notifications', label: 'Notifications',  emoji: '' },
];

// ══════════════════════════════════════════════════════════════════════════════
// PROFILE TAB — Main export
// ══════════════════════════════════════════════════════════════════════════════
function ProfileTab({ onNavigateAccount, isPremium, onToggleTheme, isDark: _isDark }) {
    const { T, isDark } = useTheme();

    const [profile, setProfile]         = useState(null);
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);
    const [subTab, setSubTab]           = useState('profile');
    const [showPremium, setShowPremium]     = useState(false);
    const [showVerifyGate, setShowVerifyGate] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState(null);
    const [subscription, setSubscription] = useState(null);

    // Edit fields
    const [bio, setBio]               = useState('');
    const [interests, setInterests]   = useState([]);
    const [showAllInterests, setShowAllInterests] = useState(false);
    const [hiddenFaculties, setHiddenFaculties]   = useState([]);
    const [discovery, setDiscovery]   = useState({});
    const [notifications, setNotifications] = useState({});

    useEffect(() => {
        Promise.all([
            profileAPI.getMe(),
            profileAPI.getVerificationStatus(),
            Promise.resolve(null),
        ]).then(([p, v, s]) => {
            setProfile({
            ...p,
            age: calcAge(p.birthday),
            interests: p.interests?.map(i => typeof i === 'object' ? i.name : i) || [],
        });
            setBio(p.bio || '');
            setInterests(p.interests?.map(i => typeof i === 'object' ? i.name : i) || []);
            setHiddenFaculties(p.hidden_faculties || []);
            setDiscovery(p.discovery_settings || {});
            setNotifications(p.notification_preferences || {
                new_match: true, new_message: true,
                nearby_activity: true, weekly_digest: false,
            });
            setVerifyStatus(v);
            setSubscription(s);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const save = useCallback(async (updates) => {
        setSaving(true);
        try {
            const updated = await profileAPI.update(updates);
            setProfile(updated);
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    }, []);

    const toggleInterest = (interest) => {
        setInterests(prev => {
            const next = prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : prev.length < 10 ? [...prev, interest] : prev;
            profileAPI.updateInterests(next).catch(console.error);
            return next;
        });
    };

    const toggleHiddenFaculty = (faculty) => {
        setHiddenFaculties(prev => {
            const next = prev.includes(faculty) ? prev.filter(f => f !== faculty) : [...prev, faculty];
            save({ hidden_faculties: next });
            return next;
        });
    };

    const calcProgress = () => {
        if (!profile) return 0;
        let score = 0;
        if (profile.photos?.length >= 1) score += 20;
        if (profile.photos?.length >= 4) score += 10;
        if (profile.bio) score += 20;
        if (profile.interests?.length >= 3) score += 15;
        if (profile.interests?.length >= 6) score += 10;
        if (verifyStatus?.is_verified) score += 15;
        if (profile.faculty) score += 10;
        return Math.min(100, score);
    };

    if (loading) return (
        <div
            style={
            {
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
            }
        }>
                <motion.div animate={
                    {
                        rotate: 360
                    }} transition={
                    {
                        duration: 1.2,
                        repeat: Infinity,
                        ease: 'linear'
                    }
                }
                        style={
                    {
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: `3px solid ${T.gold}22`,
                        borderTopColor: T.gold
                    }} />
        </div>
    );

    return (
        <div
            style={
            {
                height:'100%',
                overflowY:'auto',
                background:T.bg,
                paddingBottom:100
            }}>

            {/* ── HEADER ── */}
            <div style={{
                background: 'linear-gradient(135deg, #9D174D 0%, #BE185D 40%, #F472B6 80%, #F2C94C 100%)',
                paddingTop: 'max(54px, env(safe-area-inset-top))',
                paddingLeft: 22, paddingRight: 22, paddingBottom: 70,
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Blobs déco */}
                <div style={{ position:'absolute', top:-60, right:-40, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }} />
                <div style={{ position:'absolute', bottom:0, left:-50, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />
                <div style={{ position:'absolute', top:'40%', right:'10%', width:90, height:90, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />

                {/* Top row — settings */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28, position:'relative', zIndex:1 }}>
                    <div style={{
                        display:'inline-flex', alignItems:'center', gap:6,
                        background:'rgba(255,255,255,0.20)', backdropFilter:'blur(10px)',
                        borderRadius:20, padding:'5px 14px',
                        border:'1px solid rgba(255,255,255,0.30)',
                    }}>
                        <User size={12} color="#fff" strokeWidth={2.5} />
                        <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:700, color:'#fff' }}>
                            Mon profil
                        </span>
                    </div>
                    <motion.button
                        whileTap={{ scale:0.90 }}
                        onClick={() => onNavigateAccount?.()}
                        style={{
                            width:36, height:36, borderRadius:'50%',
                            background:'rgba(255,255,255,0.20)', backdropFilter:'blur(10px)',
                            border:'1.5px solid rgba(255,255,255,0.35)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            cursor:'pointer',
                        }}
                    >
                        <Settings size={16} color="#fff" strokeWidth={2} />
                    </motion.button>
                </div>

                {/* Avatar + infos */}
                <div style={{ display:'flex', alignItems:'flex-end', gap:18, position:'relative', zIndex:1 }}>
                    {/* Avatar avec ring */}
                    <div style={{ position:'relative', flexShrink:0 }}>
                        <ProfileProgress percent={calcProgress()} T={T} />
                        <div style={{
                            position:'absolute', inset:6,
                            borderRadius:'50%', overflow:'hidden',
                            border:'2.5px solid #fff',
                            boxShadow:'0 4px 20px rgba(0,0,0,0.25)',
                        }}>
                            <img
                                src={
                                    getMainPhoto(profile)
                                    || profile?.avatar
                                    || 'https://via.placeholder.com/88'
                                }
                                alt="Profile"
                                style={{ width:'100%', height:'100%', objectFit:'cover' }}
                            />
                        </div>
                        {verifyStatus?.is_verified && (
                            <div style={{
                                position:'absolute', bottom:6, right:6,
                                width:22, height:22, borderRadius:'50%',
                                background:'#1565C0',
                                border:'2.5px solid #fff',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                boxShadow:'0 2px 8px rgba(0,0,0,0.20)',
                                zIndex:2,
                            }}>
                                <Check size={11} color="#fff" strokeWidth={3} />
                            </div>
                        )}
                    </div>

                    {/* Nom + infos */}
                    <div style={{ flex:1, paddingBottom:4 }}>
                        <h2 style={{
                            fontFamily:"'Poppins',sans-serif",
                            fontSize:24, fontWeight:800, color:'#fff',
                            margin:'0 0 4px', letterSpacing:'-0.02em',
                            lineHeight:1.1,
                        }}>
                            {profile?.first_name || 'Mon Profil'}
                            {profile?.age && (
                                <span style={{ fontWeight:400, color:'rgba(255,255,255,0.80)', fontSize:20 }}>, {profile.age}</span>
                            )}
                        </h2>
                        {profile?.faculty && (
                            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:6 }}>
                                <GraduationCap size={12} color="rgba(255,255,255,0.80)" strokeWidth={2} />
                                <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:'rgba(255,255,255,0.80)' }}>
                                    {profile.faculty}
                                </span>
                            </div>
                        )}
                        {/* Barre complétion */}
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{
                                flex:1, height:5, borderRadius:10,
                                background:'rgba(255,255,255,0.25)',
                                overflow:'hidden',
                            }}>
                                <motion.div
                                    initial={{ width:0 }}
                                    animate={{ width:`${calcProgress()}%` }}
                                    transition={{ duration:1.2, ease:'easeOut' }}
                                    style={{
                                        height:'100%', borderRadius:10,
                                        background:'#fff',
                                        boxShadow:'0 0 8px rgba(255,255,255,0.60)',
                                    }}
                                />
                            </div>
                            <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.90)', flexShrink:0 }}>
                                {calcProgress()}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Vague */}
                <svg viewBox="0 0 390 55" preserveAspectRatio="none"
                     style={{ position:'absolute', bottom:-1, left:0, width:'100%', height:55, display:'block' }}>
                    <path d="M0,55 L0,25 C70,50 140,8 220,30 C300,52 350,15 390,28 L390,55 Z"
                          fill={T.bg} />
                </svg>
            </div>

            {/* ── BADGE ABONNEMENT ── */}
            <div style={{ padding:'20px 16px 0' }}>
                {subscription ? (
                    <motion.div
                        initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
                        onClick={() => setShowPremium(true)}
                        style={{
                            display:'flex', alignItems:'center', gap:12,
                            padding:'14px 16px', borderRadius:20, cursor:'pointer',
                            background: subscription.plan === 'eternite'
                                ? 'linear-gradient(135deg,rgba(190,24,93,0.12),rgba(157,23,77,0.08))'
                                : 'linear-gradient(135deg,rgba(242,201,76,0.15),rgba(190,24,93,0.08))',
                            border: `1.5px solid ${subscription.plan === 'eternite' ? 'rgba(190,24,93,0.25)' : 'rgba(242,201,76,0.30)'}`,
                            boxShadow:'0 4px 20px rgba(190,24,93,0.08)',
                            marginBottom:20,
                        }}
                    >
                        <div style={{
                            width:40, height:40, borderRadius:'50%',
                            background: subscription.plan === 'eternite'
                                ? 'linear-gradient(135deg,#BE185D,#9D174D)'
                                : 'linear-gradient(135deg,#F2C94C,#BE185D)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            flexShrink:0, fontSize:18,
                            boxShadow:'0 4px 12px rgba(190,24,93,0.25)',
                        }}>
                            {subscription.plan === 'eternite' ? '♾' : '✦'}
                        </div>
                        <div style={{ flex:1 }}>
                            <div style={{
                                fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:700,
                                color: subscription.plan === 'eternite' ? '#BE185D' : '#BE185D',
                            }}>
                                LoveLine {subscription.plan === 'eternite' ? 'Éternité' : 'Gold'}
                            </div>
                            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:T.textMuted }}>
                                Expire le {new Date(subscription.expires_at).toLocaleDateString('fr-FR')}
                            </div>
                        </div>
                        <ChevronRight size={16} color={T.textMuted} strokeWidth={2} />
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
                        whileTap={{ scale:0.98 }}
                        onClick={() => setShowPremium(true)}
                        style={{
                            background:'linear-gradient(135deg,#BE185D,#F472B6,#F2C94C)',
                            borderRadius:24, padding:'18px 20px',
                            cursor:'pointer', position:'relative', overflow:'hidden',
                            boxShadow:'0 12px 40px rgba(190,24,93,0.25)',
                            marginBottom:20,
                        }}
                    >
                        <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.10)', pointerEvents:'none' }} />
                        <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:14 }}>
                            <div style={{
                                width:44, height:44, borderRadius:'50%',
                                background:'rgba(255,255,255,0.22)', backdropFilter:'blur(10px)',
                                border:'1.5px solid rgba(255,255,255,0.35)',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                flexShrink:0, fontSize:20,
                            }}>💎</div>
                            <div style={{ flex:1 }}>
                                <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:15, fontWeight:800, color:'#fff', marginBottom:3 }}>
                                    Passe à Premium
                                </div>
                                <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:'rgba(255,255,255,0.85)', margin:0 }}>
                                    Likes illimités, Top Picks IA, messages sans limite
                                </p>
                            </div>
                            <div style={{
                                background:'rgba(255,255,255,0.22)', backdropFilter:'blur(10px)',
                                border:'1.5px solid rgba(255,255,255,0.35)',
                                borderRadius:50, padding:'8px 14px', flexShrink:0,
                            }}>
                                <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, fontWeight:700, color:'#fff' }}>Voir</span>
                            </div>
                        </div>
                    </motion.div>
                )}
                {/* ── SOUS-ONGLETS ── */}
                <div style={{
                    display:'flex', gap:0, margin:'20px 0 0',
                    background: isDark ? 'rgba(30,10,20,0.60)' : 'rgba(255,255,255,0.80)',
                    borderRadius:20, padding:5,
                    boxShadow:'0 4px 20px rgba(190,24,93,0.08)',
                    border:'1px solid rgba(190,24,93,0.10)',
                }}>
                    {SUB_TABS.map(tab => (
                        <button key={tab.id} onClick={() => setSubTab(tab.id)} style={{
                            flex:1, padding:'11px 6px', borderRadius:15, border:'none',
                            background: subTab === tab.id
                                ? 'linear-gradient(135deg,#BE185D,#F472B6)'
                                : 'transparent',
                            color: subTab === tab.id ? '#fff' : T.textSoft,
                            fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:700,
                            cursor:'pointer',
                            boxShadow: subTab === tab.id ? '0 4px 16px rgba(190,24,93,0.30)' : 'none',
                            transition:'all 0.25s',
                        }}>
                            {tab.emoji} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── CONTENU ── */}
            <div style={{ padding:'16px 16px 100px' }}>

                {/* ── MON PROFIL ── */}
                {subTab === 'profile' && (
                    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>

                        {/* Photos */}
                        <SectionCard
                            title="Mes photos"
                            icon={<Camera size={16} color="#BE185D" strokeWidth={2} />}
                            T={T} isDark={isDark}
                        >
                            <PhotoGrid
                                photos={profile?.photos || []}
                                onUpload={async (fd) => { const updated = await profileAPI.uploadPhotos(fd); setProfile(updated); }}
                                onDelete={async (id) => { await profileAPI.deletePhoto(id); setProfile(p => ({ ...p, photos: p.photos.filter(ph => ph.id !== id) })); }}
                                onSetMain={async (id) => { await profileAPI.setMainPhoto(id); setProfile(p => ({ ...p, photos: p.photos.map(ph => ({ ...ph, is_main: ph.id === id })) })); }}
                                T={T} isDark={isDark}
                            />
                        </SectionCard>

                        {/* Bio */}
                        <SectionCard
                            title="Ma biographie"
                            icon={<PenLine size={16} color="#BE185D" strokeWidth={2} />}
                            hint="Une phrase qui te définit. Ce que tu es, ce que tu cherches."
                            T={T} isDark={isDark}
                        >
            <textarea
                value={bio}
                onChange={e => setBio(e.target.value.slice(0, 500))}
                onBlur={() => { if (bio !== (profile?.bio || '')) save({ bio }); }}
                placeholder={`"Je cours après les couchers de soleil sur le campus..."`}
                maxLength={500}
                style={{
                    width:'100%', minHeight:100, padding:'14px',
                    borderRadius:16, boxSizing:'border-box',
                    border:'1.5px solid rgba(190,24,93,0.15)',
                    background: isDark ? 'rgba(30,10,20,0.60)' : 'rgba(255,255,255,0.80)',
                    fontFamily:"'Poppins',sans-serif",
                    fontSize:14, color:T.text,
                    lineHeight:1.7, resize:'none', outline:'none',
                }}
            />
                            <div style={{ textAlign:'right', fontFamily:"'Poppins',sans-serif", fontSize:11, color:T.textMuted, marginTop:6 }}>
                                {bio.length}/500
                            </div>
                        </SectionCard>

                        {/* Passions */}
                        <SectionCard
                            title="Mes passions"
                            icon={<Heart size={16} color="#BE185D" strokeWidth={2} />}
                            hint={`Choisis jusqu'à 10 passions.`}
                            T={T} isDark={isDark}
                        >
                            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
                                {(showAllInterests ? ALL_INTERESTS : ALL_INTERESTS.slice(0, 15)).map(interest => {
                                    const active = interests.includes(interest);
                                    return (
                                        <motion.button key={interest} onClick={() => toggleInterest(interest)}
                                                       whileTap={{ scale:0.92 }}
                                                       style={{
                                                           padding:'7px 14px', borderRadius:50, cursor:'pointer',
                                                           background: active
                                                               ? 'linear-gradient(135deg,#F2C94C,#BE185D)'
                                                               : isDark ? 'rgba(190,24,93,0.10)' : 'rgba(190,24,93,0.07)',
                                                           color: active ? '#fff' : T.textSoft,
                                                           fontFamily:"'Poppins',sans-serif", fontSize:12, fontWeight:600,
                                                           border: active ? 'none' : '1px solid rgba(190,24,93,0.15)',
                                                           boxShadow: active ? '0 4px 12px rgba(190,24,93,0.25)' : 'none',
                                                           transition:'all 0.2s',
                                                       }}
                                        >
                                            {interest}
                                        </motion.button>
                                    );
                                })}
                            </div>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                                <button onClick={() => setShowAllInterests(s => !s)} style={{
                                    background:'none', border:'1.5px solid rgba(190,24,93,0.20)',
                                    borderRadius:50, padding:'7px 16px',
                                    fontFamily:"'Poppins',sans-serif", fontSize:12, fontWeight:600, color:'#BE185D',
                                    cursor:'pointer',
                                }}>
                                    {showAllInterests ? 'Voir moins' : `Voir tout (${ALL_INTERESTS.length})`}
                                </button>
                                <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:T.textMuted }}>
                    {interests.length}/10
                </span>
                            </div>
                        </SectionCard>

                        {/* ── SECTION UK — vérification requise ── */}
                        <SectionCard
                            title="Fonctions Université de Kara"
                            icon={<GraduationCap size={16} color="#BE185D" strokeWidth={2} />}
                            hint="Ces fonctionnalités sont réservées aux étudiants vérifiés de l'UK."
                            T={T} isDark={isDark}
                        >
                            {!verifyStatus?.is_verified ? (
                                /* Gate — pas encore vérifié */
                                <motion.div
                                    initial={{ opacity:0 }} animate={{ opacity:1 }}
                                    style={{
                                        background:'linear-gradient(135deg,#BE185D,#F472B6,#F2C94C)',
                                        borderRadius:20, padding:'20px',
                                        position:'relative', overflow:'hidden',
                                        boxShadow:'0 8px 32px rgba(190,24,93,0.25)',
                                        cursor:'pointer',
                                    }}
                                    onClick={() => setShowVerifyGate(true)}
                                >
                                    <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.10)' }} />
                                    <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:14 }}>
                                        <div style={{
                                            width:48, height:48, borderRadius:'50%',
                                            background:'rgba(255,255,255,0.22)',
                                            backdropFilter:'blur(10px)',
                                            border:'1.5px solid rgba(255,255,255,0.35)',
                                            display:'flex', alignItems:'center', justifyContent:'center',
                                            flexShrink:0,
                                        }}>
                                            <ShieldCheck size={22} color="#fff" strokeWidth={1.8} />
                                        </div>
                                        <div style={{ flex:1 }}>
                                            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:14, fontWeight:800, color:'#fff', marginBottom:4 }}>
                                                Vérification requise
                                            </div>
                                            <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:'rgba(255,255,255,0.85)', margin:0, lineHeight:1.5 }}>
                                                Vérifie ton statut étudiant pour accéder aux fonctions campus Nord/Sud
                                            </p>
                                        </div>
                                        <ChevronRight size={20} color="rgba(255,255,255,0.80)" strokeWidth={2.5} />
                                    </div>
                                </motion.div>
                            ) : (
                                /* Vérifié — affiche les options UK */
                                <div>
                                    {/* Badge vérifié */}
                                    <div style={{
                                        display:'flex', alignItems:'center', gap:10, marginBottom:20,
                                        padding:'12px 16px', borderRadius:16,
                                        background:'linear-gradient(135deg,rgba(21,101,192,0.12),rgba(21,101,192,0.06))',
                                        border:'1px solid rgba(21,101,192,0.25)',
                                    }}>
                                        <BadgeCheck size={20} color="#1565C0" strokeWidth={2} />
                                        <div>
                                            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:700, color:'#1565C0' }}>
                                                Étudiant vérifié UK
                                            </div>
                                            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:T.textMuted }}>
                                                {profile?.faculty || 'Faculté confirmée'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Campus Nord/Sud */}
                                    <div style={{ marginBottom:20 }}>
                                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                                            <MapPin size={16} color="#BE185D" strokeWidth={2} />
                                            <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:600, color:T.text }}>Mon campus</span>
                                        </div>
                                        <div style={{ display:'flex', gap:10 }}>
                                            {['Campus Nord', 'Campus Sud'].map(campus => {
                                                const active = (profile?.campus || discovery?.campus) === campus;
                                                return (
                                                    <motion.button key={campus}
                                                                   whileTap={{ scale:0.95 }}
                                                                   onClick={async () => {
                                                                       await save({ campus });
                                                                   }}
                                                                   style={{
                                                                       flex:1, padding:'12px 8px', borderRadius:20, cursor:'pointer',
                                                                       background: active
                                                                           ? 'linear-gradient(135deg,#F2C94C,#BE185D)'
                                                                           : isDark ? 'rgba(190,24,93,0.10)' : 'rgba(190,24,93,0.07)',
                                                                       color: active ? '#fff' : T.textSoft,
                                                                       fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:700,
                                                                       border: active ? 'none' : '1px solid rgba(190,24,93,0.15)',
                                                                       boxShadow: active ? '0 6px 16px rgba(190,24,93,0.28)' : 'none',
                                                                       transition:'all 0.2s',
                                                                   }}
                                                    >
                                                        {campus}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Afficher ma faculté */}
                                    <SettingRow
                                        icon={<Eye size={16} color="#BE185D" strokeWidth={2} />}
                                        label="Afficher ma faculté"
                                        sub="Visible sur ton profil public"
                                        right={<Toggle
                                            value={discovery?.show_faculty !== false}
                                            onChange={v => {
                                                const next = { ...discovery, show_faculty:v };
                                                setDiscovery(next);
                                                profileAPI.updateDiscoverySettings(next);
                                            }}
                                            T={T}
                                        />}
                                        T={T} isDark={isDark}
                                    />

                                    {/* Priorité campus */}
                                    <SettingRow
                                        icon={<Users size={16} color="#BE185D" strokeWidth={2} />}
                                        label="Priorité aux profils de mon campus"
                                        sub="Voir d'abord les étudiants de ton campus"
                                        right={<Toggle
                                            value={discovery?.campus_priority !== false}
                                            onChange={v => {
                                                const next = { ...discovery, campus_priority:v };
                                                setDiscovery(next);
                                                profileAPI.updateDiscoverySettings(next);
                                            }}
                                            T={T}
                                        />}
                                        T={T} isDark={isDark}
                                    />
                                </div>
                            )}
                        </SectionCard>

                        {/* Vérification étudiante */}
                        <SectionCard
                            title="Vérification Étudiante UK"
                            icon={<ShieldCheck size={16} color="#BE185D" strokeWidth={2} />}
                            hint="Obtiens le badge bleu réservé aux vrais étudiants de l'Université de Kara."
                            T={T} isDark={isDark}
                        >
                            <VerificationSection status={verifyStatus} T={T} isDark={isDark} />
                        </SectionCard>

                        {/* Compte */}
                        <SectionCard
                            title="Compte & Sécurité"
                            icon={<Shield size={16} color="#BE185D" strokeWidth={2} />}
                            T={T} isDark={isDark}
                        >
                            <SettingRow
                                icon={<Lock size={16} color="#BE185D" strokeWidth={2} />}
                                label="Mot de passe & Email"
                                sub="Gérer vos identifiants de connexion"
                                onClick={onNavigateAccount} T={T} isDark={isDark}
                            />
                            <SettingRow
                                icon={isDark ? <Moon size={16} color="#BE185D" strokeWidth={2} /> : <Sun size={16} color="#BE185D" strokeWidth={2} />}
                                label="Apparence"
                                sub={isDark ? 'Mode sombre activé' : 'Mode clair activé'}
                                right={<Toggle value={isDark} onChange={onToggleTheme} T={T} />}
                                T={T} isDark={isDark}
                            />
                        </SectionCard>

                    </motion.div>
                )}
                {/* ── DÉCOUVERTE ── */}
                {subTab === 'settings' && (
                    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>

                        {/* Préférences de découverte */}
                        <SectionCard
                            title="Préférences de découverte"
                            icon={<span className="material-icons" style={{ fontSize:18, color:'#BE185D' }}>travel_explore</span>}
                            hint="Ces réglages influencent les profils qui te sont présentés."
                            T={T} isDark={isDark}
                        >
                            {/* Âge */}
                            <div style={{ marginBottom:24 }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                        <span className="material-icons" style={{ fontSize:16, color:'#BE185D' }}><Cake size={18} color="#BE185D" /></span>
                                        <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:600, color:T.text }}>Âge recherché</span>
                                    </div>
                                    <div style={{
                                        background:'linear-gradient(135deg,#F2C94C,#BE185D)',
                                        borderRadius:20, padding:'4px 12px',
                                        boxShadow:'0 2px 8px rgba(190,24,93,0.25)',
                                    }}>
                        <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, fontWeight:700, color:'#fff' }}>
                            {discovery.min_age||18} – {discovery.max_age||30} ans
                        </span>
                                    </div>
                                </div>
                                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                                    {[
                                        { label:'Min', key:'min_age', defaultVal:18 },
                                        { label:'Max', key:'max_age', defaultVal:30 },
                                    ].map(r => (
                                        <div key={r.key}>
                                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                                                <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:T.textMuted }}>{r.label}</span>
                                                <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:700, color:'#BE185D' }}>{discovery[r.key]||r.defaultVal} ans</span>
                                            </div>
                                            <input type="range" min="18" max="40"
                                                   value={discovery[r.key]||r.defaultVal}
                                                   onChange={e => setDiscovery(d => ({ ...d, [r.key]:+e.target.value }))}
                                                   onMouseUp={() => profileAPI.updateDiscoverySettings(discovery)}
                                                   style={{ width:'100%', accentColor:'#BE185D' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Distance */}
                            <div style={{ marginBottom:24 }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                        <span className="material-icons" style={{ fontSize:16, color:'#BE185D' }}><Navigation size={18} color="#BE185D" /></span>
                                        <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:600, color:T.text }}>Distance maximale</span>
                                    </div>
                                    <div style={{
                                        background:'linear-gradient(135deg,#F2C94C,#BE185D)',
                                        borderRadius:20, padding:'4px 12px',
                                        boxShadow:'0 2px 8px rgba(190,24,93,0.25)',
                                    }}>
                        <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, fontWeight:700, color:'#fff' }}>
                            {discovery.max_distance||50} km
                        </span>
                                    </div>
                                </div>
                                <input type="range" min="1" max="100"
                                       value={discovery.max_distance||50}
                                       onChange={e => setDiscovery(d => ({ ...d, max_distance:+e.target.value }))}
                                       onMouseUp={() => profileAPI.updateDiscoverySettings(discovery)}
                                       style={{ width:'100%', accentColor:'#BE185D' }}
                                />
                            </div>


                            {/* Toggles visibilité */}
                            <SettingRow
                                icon={<span className="material-icons" style={{ fontSize:18, color:'#BE185D' }}><Eye size={18} color="#BE185D" /></span>}
                                label="Être visible sur la plateforme"
                                sub="Désactiver pour naviguer en mode fantôme"
                                right={<Toggle value={discovery.show_profile !== false}
                                               onChange={v => { const next={...discovery,show_profile:v}; setDiscovery(next); profileAPI.updateDiscoverySettings(next); }}
                                               T={T} />}
                                T={T} isDark={isDark}
                            />
                            <SettingRow
                                icon={<span className="material-icons" style={{ fontSize:18, color:'#BE185D' }}><MapPin size={18} color="#BE185D" /></span>}
                                label="Utiliser ma localisation"
                                sub="Améliore la pertinence des profils à proximité"
                                right={<Toggle value={discovery.use_location !== false}
                                               onChange={v => { const next={...discovery,use_location:v}; setDiscovery(next); profileAPI.updateDiscoverySettings(next); }}
                                               T={T} />}
                                T={T} isDark={isDark}
                            />
                        </SectionCard>

                        {/* Confidentialité par faculté */}
                        <SectionCard
                            title="Confidentialité par faculté"
                            icon={<GraduationCap size={16} color="#BE185D" strokeWidth={2} />}
                            hint="Cache ton profil aux étudiants de certaines facultés. Ta discrétion, ta liberté."
                            T={T} isDark={isDark}
                        >
                            {!verifyStatus?.is_verified ? (
                                <motion.div
                                    whileTap={{ scale:0.98 }}
                                    onClick={() => setShowVerifyGate(true)}
                                    style={{
                                        background:'linear-gradient(135deg,#BE185D,#F472B6,#F2C94C)',
                                        borderRadius:20, padding:'18px 20px', cursor:'pointer',
                                        position:'relative', overflow:'hidden',
                                        boxShadow:'0 8px 24px rgba(190,24,93,0.25)',
                                    }}
                                >
                                    <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.10)', pointerEvents:'none' }} />
                                    <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:12 }}>
                                        <ShieldCheck size={28} color="#fff" strokeWidth={1.8} />
                                        <div style={{ flex:1 }}>
                                            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:800, color:'#fff' }}>Vérification requise</div>
                                            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:'rgba(255,255,255,0.82)', marginTop:2 }}>Vérifie ton profil pour accéder à cette option</div>
                                        </div>
                                        <ChevronRight size={18} color="rgba(255,255,255,0.80)" strokeWidth={2.5} />
                                    </div>
                                </motion.div>
                            ) : (
                                <>
                                {UK_FACULTIES.map((faculty, i) => (
                                <div key={faculty} style={{
                                    display:'flex', justifyContent:'space-between', alignItems:'center',
                                    padding:'12px 0',
                                    borderBottom: i < UK_FACULTIES.length-1 ? '1px solid rgba(190,24,93,0.08)' : 'none',
                                }}>
                    <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:T.text, flex:1, paddingRight:12 }}>
                        {faculty}
                    </span>
                                    <Toggle value={hiddenFaculties.includes(faculty)} onChange={() => toggleHiddenFaculty(faculty)} T={T} />
                                </div>
                            ))}
                            <div style={{
                                display:'flex', alignItems:'flex-start', gap:8, marginTop:14,
                                padding:'12px 14px', borderRadius:14,
                                background:'rgba(190,24,93,0.06)',
                                border:'1px solid rgba(190,24,93,0.12)',
                            }}>
                                <span className="material-icons" style={{ fontSize:16, color:'#BE185D', flexShrink:0, marginTop:1 }}><Info size={18} color="#BE185D" /></span>
                                <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:T.textMuted, margin:0, lineHeight:1.6 }}>
                                    Cette option cache uniquement ton profil aux étudiants de ces facultés. Tu peux toujours voir les leurs.
                                </p>
                            </div>
                                </>
                            )}
                        </SectionCard>

                    </motion.div>
                )}

                {/* ── NOTIFICATIONS ── */}
                {subTab === 'notifications' && (
                    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>

                        <SectionCard
                            title="Mes notifications"
                            icon={<span className="material-icons" style={{ fontSize:18, color:'#BE185D' }}>notifications</span>}
                            hint="Choisis comment LoveLine te tient informé des moments qui comptent."
                            T={T} isDark={isDark}
                        >
                            {[
                                { key:'new_match',        icon:'favorite',        label:'Nouveau Match',          sub:'Sois le premier à briser la glace' },
                                { key:'new_message',      icon:'chat',            label:'Nouveau Message',         sub:'Ne laisse aucun mot sans réponse' },
                                { key:'super_like',       icon:'star',            label:'Super Like reçu',         sub:'Quelqu\'un t\'admire particulièrement' },
                                { key:'nearby_activity',  icon:'location_on',     label:'Activité à proximité',    sub:'De nouvelles âmes près de toi' },
                                { key:'profile_views',    icon:'visibility',      label:'Vues du profil',          sub:'Ton profil attire des regards curieux' },
                                { key:'weekly_digest',    icon:'bar_chart',       label:'Rapport hebdomadaire',    sub:'Ta semaine sur LoveLine en un coup d\'œil' },
                            ].map((item, i) => (
                                <SettingRow key={item.key}
                                            icon={<span className="material-icons" style={{ fontSize:18, color:'#BE185D' }}>{item.icon}</span>}
                                            label={item.label}
                                            sub={item.sub}
                                            right={
                                                <Toggle
                                                    value={notifications[item.key] !== false}
                                                    onChange={v => {
                                                        const next = { ...notifications, [item.key]:v };
                                                        setNotifications(next);
                                                        profileAPI.updateNotifications(next);
                                                    }}
                                                    T={T}
                                                />
                                            }
                                            T={T} isDark={isDark}
                                />
                            ))}
                        </SectionCard>

                        {/* Citation */}
                        <div style={{
                            textAlign:'center', padding:'24px 20px',
                            background: isDark ? 'rgba(30,10,20,0.40)' : 'rgba(255,255,255,0.60)',
                            borderRadius:24, border:'1px solid rgba(190,24,93,0.10)',
                        }}>
            <span className="material-icons" style={{ fontSize:32, color:'#BE185D', opacity:0.5, marginBottom:12, display:'block' }}>
               <BellRing size={32} color="#BE185D" />
            </span>
                            <p style={{ fontFamily:"'Poppins',sans-serif", fontStyle:'italic', fontSize:13, color:T.textMuted, lineHeight:1.7, margin:0 }}>
                                "Les notifications sont les messagers de tes histoires à venir. Choisis celles qui méritent d'être entendues."
                            </p>
                        </div>

                    </motion.div>
                )}


            </div>

            {showPremium && (
                <PremiumModal
                    feature={showPremium}
                    onClose={() => setShowPremium(false)}
                    onSubscribe={() => setShowPremium(false)}
                />
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// ACCOUNTTAB
// ══════════════════════════════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════════════
    Account & Security Tab
   Password, email, logout, delete account
   ═══════════════════════════════════════════════════════════════ */

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, hint, T, isDark }) {
    const [show, setShow] = useState(false);
    const isPassword = type === 'password';
    return (
        <div style={{ marginBottom: 18 }}>
            <label style={{
                fontFamily: "'Playfair Display',sans-serif", fontSize: 11, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: T.textSoft, display: 'block', marginBottom: 8,
            }}>{label}</label>
            <div style={{ position: 'relative' }}>
                <input
                    type={isPassword && !show ? 'password' : 'text'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    style={{
                        width: '100%', padding: `12px ${isPassword ? '44px' : '14px'} 12px 14px`,
                        borderRadius: 14, border: `1px solid ${T.gold}33`,
                        background: isDark ? 'rgba(45,16,32,0.65)' : 'rgba(255,255,255,0.80)',
                        fontFamily: "'Playfair Display',sans-serif", fontSize: 14, color: T.text,
                        outline: 'none', boxSizing: 'border-box',
                    }}
                />
                {isPassword && (
                    <button onClick={() => setShow(s => !s)} style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: T.textSoft, fontSize: 16,
                    }}>
                        {show ? '🙈' : '👁'}
                    </button>
                )}
            </div>
            {hint && <p style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 11, color: T.textMuted, marginTop: 5, lineHeight: 1.5 }}>{hint}</p>}
        </div>
    );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel, T, isDark }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9000,
                        background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
                    }}
                    onClick={onCancel}
        >
            <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: isDark ? '#1E1020' : '#FDF6F0',
                            borderRadius: 24, padding: 28,
                            maxWidth: 360, width: '100%',
                            border: `1px solid ${danger ? 'rgba(244,67,54,0.30)' : T.gold + '33'}`,
                            boxShadow: T.shadowDeep,
                        }}>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 10 }}>
                    {title}
                </h3>
                <p style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 14, color: T.textSoft, lineHeight: 1.7, marginBottom: 24 }}>
                    {message}
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={onCancel} style={{
                        flex: 1, padding: '13px', borderRadius: 50,
                        border: `1px solid ${T.gold}44`, background: 'none',
                        color: T.textSoft, fontFamily: "'Playfair Display',sans-serif",
                        fontSize: 13, cursor: 'pointer',
                    }}>Annuler</button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={onConfirm} style={{
                        flex: 1, padding: '13px', borderRadius: 50, border: 'none',
                        background: danger ? '#F44336' : `linear-gradient(135deg,${T.gold},${T.goldDark})`,
                        color: danger ? '#fff' : '#1A0812',
                        fontFamily: "'Playfair Display',sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}>{confirmLabel}</motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// ACCOUNT TAB — Main export
// ══════════════════════════════════════════════════════════════════════════════
function AccountTab({ onBack, onLogout, T: _T, isDark: _isDark }) {
    const { T, isDark } = useTheme();

    const [section, setSection]         = useState('main'); // main | password | email
    const [loading, setLoading]         = useState(false);
    const [success, setSuccess]         = useState('');
    const [error, setError]             = useState('');
    const [confirmDialog, setConfirmDialog] = useState(null);

    // Password form
    const [currentPw, setCurrentPw]   = useState('');
    const [newPw, setNewPw]           = useState('');
    const [confirmPw, setConfirmPw]   = useState('');

    // Email form
    const [newEmail, setNewEmail]     = useState('');
    const [emailPw, setEmailPw]       = useState('');

    const showMsg = (msg, isErr = false) => {
        if (isErr) setError(msg); else setSuccess(msg);
        setTimeout(() => { setError(''); setSuccess(''); }, 4000);
    };

    const handlePasswordChange = async () => {
        if (!currentPw || !newPw) return showMsg('Veuillez remplir tous les champs.', true);
        if (newPw !== confirmPw) return showMsg('Les mots de passe ne correspondent pas.', true);
        if (newPw.length < 8) return showMsg('Le mot de passe doit faire au moins 8 caractères.', true);
        setLoading(true);
        try {
            await authAPI.changePassword({ current_password: currentPw, new_password: newPw });
            showMsg('Mot de passe mis à jour avec succès ✓');
            setCurrentPw(''); setNewPw(''); setConfirmPw('');
            setSection('main');
        } catch (e) {
            showMsg(e.message || 'Mot de passe actuel incorrect.', true);
        } finally { setLoading(false); }
    };

    const handleEmailChange = async () => {
        if (!newEmail || !emailPw) return showMsg('Veuillez remplir tous les champs.', true);
        setLoading(true);
        try {
            await profileAPI.updateEmail({ new_email: newEmail, password: emailPw });
            showMsg('Email mis à jour. Vérifiez votre boîte de réception. ✓');
            setNewEmail(''); setEmailPw('');
            setSection('main');
        } catch (e) {
            showMsg(e.message || 'Impossible de mettre à jour l\'email.', true);
        } finally { setLoading(false); }
    };

    const handleLogout = async () => {
        const refresh = localStorage.getItem('ll_refresh');
        await authAPI.logout(refresh).catch(() => {});
        localStorage.removeItem('ll_access');
        localStorage.removeItem('ll_refresh');
        onLogout?.();
    };

    const handleDeleteAccount = async () => {
        setLoading(true);
        try {
            await authAPI.deleteAccount();
            localStorage.removeItem('ll_access');
            localStorage.removeItem('ll_refresh');
            onLogout?.();
        } catch (e) {
            showMsg(e.message || 'Impossible de supprimer le compte.', true);
        } finally { setLoading(false); }
    };

    return (
        <div style={{ height: '100%', overflowY: 'auto', background: T.bg }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '20px 16px 16px',
                borderBottom: `1px solid ${T.gold}11`,
            }}>
                <button onClick={() => section === 'main' ? onBack?.() : setSection('main')} style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: T.textSoft, padding: 4,
                }}>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <path d="M14 4l-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                </button>
                <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: T.text }}>
                    {section === 'password' ? 'Mot de passe' : section === 'email' ? 'Adresse email' : 'Compte & Sécurité'}
                </h1>
            </div>

            {/* Feedback */}
            <AnimatePresence>
                {(success || error) && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                style={{
                                    margin: '12px 16px 0',
                                    padding: '12px 16px', borderRadius: 14,
                                    background: error ? 'rgba(244,67,54,0.10)' : 'rgba(76,175,80,0.10)',
                                    border: `1px solid ${error ? 'rgba(244,67,54,0.30)' : 'rgba(76,175,80,0.30)'}`,
                                    fontFamily: "'Playfair Display',sans-serif", fontSize: 13,
                                    color: error ? '#F44336' : '#2E7D32',
                                }}>
                        {success || error}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ padding: '16px 16px 100px' }}>

                {/* ─── MAIN ─── */}
                {section === 'main' && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>

                        {/* Security section */}
                        <div style={{
                            background: isDark ? 'rgba(30,16,32,0.65)' : 'rgba(255,255,255,0.75)',
                            backdropFilter: 'blur(16px)',
                            border: `1px solid ${T.gold}22`,
                            borderRadius: 24, padding: 20, marginBottom: 16,
                        }}>
                            <h3 style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.textSoft, marginBottom: 4 }}>
                                Sécurité
                            </h3>
                            <p style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 12, color: T.textMuted, lineHeight: 1.5, marginBottom: 16 }}>
                                Gardez votre compte protégé. Un mot de passe fort est la première barrière de votre intimité.
                            </p>

                            {/* Change password */}
                            <div onClick={() => setSection('password')} style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '14px 0', borderBottom: `1px solid ${T.gold}11`, cursor: 'pointer',
                            }}>
                                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${T.gold}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>🔐</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 14, fontWeight: 600, color: T.text }}>Changer le mot de passe</div>
                                    <div style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 12, color: T.textMuted, marginTop: 2 }}>Dernière modification : récemment</div>
                                </div>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M6 3l5 5-5 5" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </div>

                            {/* Change email */}
                            <div onClick={() => setSection('email')} style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '14px 0', cursor: 'pointer',
                            }}>
                                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${T.gold}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>📧</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 14, fontWeight: 600, color: T.text }}>Changer l'adresse email</div>
                                    <div style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 12, color: T.textMuted, marginTop: 2 }}>Votre email est votre clé de connexion</div>
                                </div>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M6 3l5 5-5 5" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>

                        {/* UK Priority */}
                        <div style={{
                            background: isDark ? 'rgba(30,16,32,0.65)' : 'rgba(255,255,255,0.75)',
                            backdropFilter: 'blur(16px)',
                            border: `1px solid ${T.gold}22`,
                            borderRadius: 24, padding: 20, marginBottom: 16,
                        }}>
                            <h3 style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.textSoft, marginBottom: 16 }}>
                                Priorité UK
                            </h3>
                            <p style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 12, color: T.textMuted, lineHeight: 1.6, marginBottom: 16 }}>
                                Ces paramètres définissent comment vous vous présentez à la communauté de l'Université de Kara.
                            </p>
                            {[
                                { label: 'Afficher ma faculté sur mon profil', sub: 'Les autres verront votre département', key: 'show_faculty' },
                                { label: 'Priorité aux étudiants UK', sub: 'Voir d\'abord les profils de votre université', key: 'uk_priority' },
                                { label: 'Afficher ma promotion', sub: 'L1, L2, L3, Master...', key: 'show_year' },
                            ].map(item => (
                                <div key={item.key} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '12px 0', borderBottom: `1px solid ${T.gold}11`,
                                }}>
                                    <div>
                                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 13, fontWeight: 600, color: T.text }}>{item.label}</div>
                                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 11, color: T.textMuted, marginTop: 2 }}>{item.sub}</div>
                                    </div>
                                    <div style={{ width: 44, height: 26, borderRadius: 13, padding: 3, background: `${T.gold}55`, cursor: 'pointer', flexShrink: 0 }}>
                                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', marginLeft: 18 }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Danger zone */}
                        <div style={{
                            background: isDark ? 'rgba(244,67,54,0.06)' : 'rgba(244,67,54,0.04)',
                            border: '1px solid rgba(244,67,54,0.20)',
                            borderRadius: 24, padding: 20,
                        }}>
                            <h3 style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(244,67,54,0.70)', marginBottom: 4 }}>
                                Zone sensible
                            </h3>
                            <p style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 12, color: T.textMuted, lineHeight: 1.6, marginBottom: 20 }}>
                                Ces actions sont irréversibles. Chaque décision mérite réflexion.
                            </p>

                            {/* Logout */}
                            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                                           onClick={() => setConfirmDialog('logout')}
                                           style={{
                                               width: '100%', padding: '14px', borderRadius: 50,
                                               border: `1.5px solid ${T.gold}55`,
                                               background: 'none', color: T.text,
                                               fontFamily: "'Playfair Display',sans-serif", fontSize: 14, fontWeight: 600,
                                               cursor: 'pointer', marginBottom: 10,
                                               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                           }}>
                                <span>🚪</span> Se déconnecter
                            </motion.button>

                            {/* Delete */}
                            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                                           onClick={() => setConfirmDialog('delete')}
                                           style={{
                                               width: '100%', padding: '14px', borderRadius: 50,
                                               border: '1.5px solid rgba(244,67,54,0.40)',
                                               background: 'rgba(244,67,54,0.08)', color: '#F44336',
                                               fontFamily: "'Playfair Display',sans-serif", fontSize: 14, fontWeight: 600,
                                               cursor: 'pointer',
                                               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                           }}>
                                <span>💔</span> Supprimer mon compte définitivement
                            </motion.button>

                            <p style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 11, color: T.textMuted, lineHeight: 1.6, marginTop: 14, textAlign: 'center' }}>
                                La suppression du compte effacera définitivement tous vos matchs, conversations et données personnelles. Cette action ne peut pas être annulée.
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* ─── CHANGE PASSWORD ─── */}
                {section === 'password' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <p style={{ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: 14, color: T.textSoft, lineHeight: 1.7, marginBottom: 24 }}>
                            "Un mot de passe robuste est le gardien silencieux de votre intimité numérique."
                        </p>
                        <div style={{
                            background: isDark ? 'rgba(30,16,32,0.65)' : 'rgba(255,255,255,0.75)',
                            backdropFilter: 'blur(16px)', border: `1px solid ${T.gold}22`, borderRadius: 24, padding: 20,
                        }}>
                            <Field label="Mot de passe actuel" type="password" value={currentPw}
                                   onChange={setCurrentPw} placeholder="••••••••" T={T} isDark={isDark} />
                            <Field label="Nouveau mot de passe" type="password" value={newPw}
                                   onChange={setNewPw} placeholder="••••••••"
                                   hint="Au moins 8 caractères, avec une majuscule et un chiffre" T={T} isDark={isDark} />
                            <Field label="Confirmer le nouveau mot de passe" type="password" value={confirmPw}
                                   onChange={setConfirmPw} placeholder="••••••••" T={T} isDark={isDark} />
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                           onClick={handlePasswordChange} disabled={loading}
                                           style={{
                                               width: '100%', padding: '15px', borderRadius: 50, border: 'none',
                                               background: `linear-gradient(135deg,${T.gold},${T.goldDark})`,
                                               color: '#1A0812', fontFamily: "'Playfair Display',sans-serif",
                                               fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                                               marginTop: 8,
                                           }}>
                                {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* ─── CHANGE EMAIL ─── */}
                {section === 'email' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <p style={{ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: 14, color: T.textSoft, lineHeight: 1.7, marginBottom: 24 }}>
                            "Votre email est le fil invisible qui relie LoveLine à votre réalité."
                        </p>
                        <div style={{
                            background: isDark ? 'rgba(30,16,32,0.65)' : 'rgba(255,255,255,0.75)',
                            backdropFilter: 'blur(16px)', border: `1px solid ${T.gold}22`, borderRadius: 24, padding: 20,
                        }}>
                            <Field label="Nouvelle adresse email" value={newEmail}
                                   onChange={setNewEmail} placeholder="votre@email.com"
                                   hint="Un email de confirmation sera envoyé à cette adresse" T={T} isDark={isDark} />
                            <Field label="Confirmer avec votre mot de passe" type="password" value={emailPw}
                                   onChange={setEmailPw} placeholder="••••••••" T={T} isDark={isDark} />
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                           onClick={handleEmailChange} disabled={loading}
                                           style={{
                                               width: '100%', padding: '15px', borderRadius: 50, border: 'none',
                                               background: `linear-gradient(135deg,${T.gold},${T.goldDark})`,
                                               color: '#1A0812', fontFamily: "'Playfair Display',sans-serif",
                                               fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                                               marginTop: 8,
                                           }}>
                                {loading ? 'Mise à jour...' : 'Mettre à jour l\'email'}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Confirm dialogs */}
            <AnimatePresence>
                {confirmDialog === 'logout' && (
                    <ConfirmDialog
                        title="Se déconnecter"
                        message="Vous allez quitter LoveLine. Vos données seront conservées et vous pourrez vous reconnecter à tout moment."
                        confirmLabel="Se déconnecter"
                        onConfirm={handleLogout}
                        onCancel={() => setConfirmDialog(null)}
                        T={T} isDark={isDark}
                    />
                )}
                {confirmDialog === 'delete' && (
                    <ConfirmDialog
                        title="Supprimer le compte"
                        message="Cette action est irréversible. Tous vos matchs, conversations et souvenirs sur LoveLine seront effacés à jamais. Êtes-vous certain(e) ?"
                        confirmLabel="Supprimer définitivement"
                        danger
                        onConfirm={handleDeleteAccount}
                        onCancel={() => setConfirmDialog(null)}
                        T={T} isDark={isDark}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
// LIQUIDGLASSNAV
// ══════════════════════════════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════════════
  Liquid Glass Navigation
   Ultra-realistic Apple liquid glass — transparent as a water drop
   Water-stretch morphing between tabs + text distortion
   ═══════════════════════════════════════════════════════════════ */

// ══════════════════════════════════════════════════════════════════════════════
// LIQUID GLASS NAV — SVG Displacement Filter
// ══════════════════════════════════════════════════════════════════════════════

const TABS = [
    { id: 'discover',  label: 'Découvrir',  Icon: Flame },
    { id: 'explore',   label: 'Explorer',   Icon: Compass },
    { id: 'likes',     label: 'Likes',      Icon: Heart },
    { id: 'messages',  label: 'Messages',   Icon: MessageCircle },
    { id: 'profile',   label: 'Profil',     Icon: User },
];

function LiquidGlassNav({ activeTab, onTabChange, badges = {}, userAvatar }) {
    const { T, isDark } = useTheme();
    const [prevTab, setPrevTab]             = useState(activeTab);
    const [pillStyle, setPillStyle]         = useState({ left: 0, width: 0 });
    const [isTransitioning, setIsTransitioning] = useState(false);
    const navRef  = useRef(null);
    const tabRefs = useRef({});
    const filterId = useRef(`llglass-${Math.random().toString(36).slice(2)}`).current;

    const measurePill = useCallback(() => {
        const navEl = navRef.current;
        const tabEl = tabRefs.current[activeTab];
        if (!navEl || !tabEl) return;
        const navRect = navEl.getBoundingClientRect();
        const tabRect = tabEl.getBoundingClientRect();
        setPillStyle({
            left:  tabRect.left  - navRect.left,
            width: tabRect.width,
        });
    }, [activeTab]);

    useEffect(() => {
        const id = requestAnimationFrame(measurePill);
        window.addEventListener('resize', measurePill);
        return () => { cancelAnimationFrame(id); window.removeEventListener('resize', measurePill); };
    }, [measurePill]);

    const handleClick = useCallback((tabId) => {
        if (tabId === activeTab) { onTabChange(tabId); return; }
        setPrevTab(activeTab);
        setIsTransitioning(true);
        onTabChange(tabId);
        setTimeout(() => setIsTransitioning(false), 350);
    }, [activeTab, onTabChange]);

    return (
        <>
            {/* SVG Filters — verre avec distorsion RGB */}
            <svg style={{ position: 'fixed', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
                <defs>
                    {/* Effet verre avec displacement map */}
                    <filter id={filterId} colorInterpolationFilters="sRGB" x="-10%" y="-30%" width="120%" height="160%">
                        <feImage
                            x="0" y="0" width="100%" height="100%" result="map"
                            href="data:image/svg+xml,%3Csvg viewBox='0 0 300 66' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='r' x1='100%25' y1='0' x2='0' y2='0'%3E%3Cstop offset='0' stop-color='%23000'/%3E%3Cstop offset='100%25' stop-color='red'/%3E%3C/linearGradient%3E%3ClinearGradient id='b' x1='0' y1='0' x2='0' y2='100%25'%3E%3Cstop offset='0' stop-color='%23000'/%3E%3Cstop offset='100%25' stop-color='blue'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='300' height='66' fill='black'/%3E%3Crect width='300' height='66' rx='33' fill='url(%23r)'/%3E%3Crect width='300' height='66' rx='33' fill='url(%23b)' style='mix-blend-mode:difference'/%3E%3Crect x='3' y='3' width='294' height='60' rx='30' fill='hsl(0 0%25 50%25 / 0.93)' style='filter:blur(10px)'/%3E%3C/svg%3E"
                        />
                        <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="G" scale="-90" result="dispRed" />
                        <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
                        <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="G" scale="-95" result="dispGreen" />
                        <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
                        <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="G" scale="-100" result="dispBlue" />
                        <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
                        <feBlend in="red" in2="green" mode="screen" result="rg" />
                        <feBlend in="rg" in2="blue" mode="screen" result="out" />
                        <feGaussianBlur in="out" stdDeviation="0.4" />
                    </filter>
                </defs>
            </svg>

            <nav style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
                padding: '0 12px',
                paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            }}>
                {/* Tray avec filtre de verre */}
                <div
                    ref={navRef}
                    style={{
                        position: 'relative',
                        borderRadius: 36,
                        overflow: 'hidden',
                        // backdrop-filter avec le SVG filter
                        backdropFilter: `url(#${filterId}) saturate(1.4) blur(1px)`,
                        WebkitBackdropFilter: `url(#${filterId}) saturate(1.4)`,
                        // Fond semi-transparent très léger
                        background: isDark
                            ? 'rgba(10, 6, 12, 0.45)'
                            : 'rgba(255, 252, 248, 0.45)',
                        // Bordure verre authentique
                        border: isDark
                            ? '1px solid rgba(255,255,255,0.10)'
                            : '1px solid rgba(255,255,255,0.85)',
                        boxShadow: isDark
                            ? '0 0 0 0.5px rgba(255,255,255,0.06) inset, 0 8px 48px rgba(0,0,0,0.60)'
                            : '0 0 0 0.5px rgba(255,255,255,1) inset, 0 8px 40px rgba(26,8,18,0.12)',
                    }}
                >
                    {/* Highlight supérieur — ligne de lumière */}
                    <div style={{
                        position: 'absolute', top: 0, left: '6%', right: '6%', height: 1,
                        background: isDark
                            ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)'
                            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)',
                        pointerEvents: 'none', zIndex: 5,
                    }} />

                    {/* Pill indicateur animée */}
                    <motion.div
                        animate={{
                            left:  pillStyle.left,
                            width: pillStyle.width,
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                        style={{
                            position: 'absolute',
                            top: '50%', y: '-50%',
                            height: 52,
                            borderRadius: 26,
                            pointerEvents: 'none',
                            zIndex: 0,
                            // Pill verre interne : plus lumineuse que le fond
                            background: isDark
                                ? 'linear-gradient(145deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 100%)'
                                : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.70) 100%)',
                            border: isDark
                                ? '1px solid rgba(255,255,255,0.18)'
                                : '1px solid rgba(255,255,255,1)',
                            boxShadow: isDark
                                ? 'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 24px rgba(0,0,0,0.30)'
                                : 'inset 0 1px 0 rgba(255,255,255,1), 0 4px 20px rgba(0,0,0,0.08)',
                        }}
                    >
                        {/* Specular highlight */}
                        <div style={{
                            position: 'absolute', top: '10%', left: '18%',
                            width: '35%', height: '30%',
                            background: 'radial-gradient(ellipse, rgba(255,255,255,0.90) 0%, transparent 70%)',
                            borderRadius: '50%', filter: 'blur(1px)',
                        }} />
                    </motion.div>

                    {/* Tabs */}
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-around',
                        position: 'relative', zIndex: 2,
                        padding: '7px 4px',
                    }}>
                        {TABS.map(tab => {
                            const isActive = activeTab === tab.id;
                            const badge    = tab.id === 'likes' ? badges.likes : tab.id === 'messages' ? badges.messages : 0;
                            const iconColor = isActive
                                ? T.gold
                                : isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.35)';

                            return (
                                <button
                                    key={tab.id}
                                    ref={el => { tabRefs.current[tab.id] = el; }}
                                    onClick={() => handleClick(tab.id)}
                                    style={{
                                        flex: 1, display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center',
                                        gap: 3, padding: '8px 4px', minHeight: 52,
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        borderRadius: 24, outline: 'none',
                                        WebkitTapHighlightColor: 'transparent',
                                    }}
                                >
                                    <div style={{ position: 'relative' }}>
                                        {/* Icône Lucide */}
                                        {tab.id === 'profile' && userAvatar ? (
                                            <motion.div
                                                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                                                style={{
                                                    width: 26, height: 26, borderRadius: '50%',
                                                    overflow: 'hidden',
                                                    border: `2px solid ${isActive ? T.gold : 'rgba(0,0,0,0.15)'}`,
                                                    transition: 'border-color 0.25s',
                                                }}
                                            >
                                                <img src={userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                animate={isActive
                                                    ? { y: [0, -4, 0], scale: [1, 1.18, 1] }
                                                    : { y: 0, scale: 1 }}
                                                transition={{ duration: 0.28, ease: 'easeOut' }}
                                            >
                                                <tab.Icon
                                                    size={22}
                                                    strokeWidth={isActive ? 2.2 : 1.6}
                                                    color={iconColor}
                                                    fill={isActive && (tab.id === 'likes' || tab.id === 'discover')
                                                        ? `${T.gold}44` : 'none'}
                                                    style={{ transition: 'color 0.2s, stroke 0.2s' }}
                                                />
                                            </motion.div>
                                        )}

                                        {/* Badge */}
                                        {badge > 0 && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                                style={
                                                {
                                                    position: 'absolute',
                                                    top: -4,
                                                    right: -5,
                                                    minWidth: 16,
                                                    height: 16,
                                                    borderRadius: 8,
                                                    background: tab.id === 'likes' ? '#E91E63' : T.gold,
                                                    color: tab.id === 'likes' ? '#fff' : '#1A0812',
                                                    fontSize: 8,
                                                    fontWeight: 800,
                                                    fontFamily: "'Inter', sans-serif",
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: '0 3px',
                                                    boxShadow: `0 2px 6px ${tab.id === 'likes' ? 'rgba(233,30,99,0.55)' : `${T.gold}66`}`,
                                                    border: `1.5px solid ${isDark ? '#0F0810' : '#FDF6F0'}`,
                                                }}
                                            >
                                                {badge > 9 ? '9+' : badge}
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Label animé */}
                                    <motion.span
                                        animate={{
                                            opacity: isActive ? 1 : 0,
                                            height: isActive ? 10 : 0,
                                            y: isActive ? 0 : 3,
                                        }}
                                        transition={{ duration: 0.18 }}
                                        style={{
                                            fontFamily: "'Inter', sans-serif",
                                            fontSize: 8.5, fontWeight: 700,
                                            letterSpacing: '0.08em',
                                            textTransform: 'uppercase',
                                            color: T.gold,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            lineHeight: 1,
                                        }}
                                    >
                                        {tab.label}
                                    </motion.span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* iOS home indicator */}
                <div style={{
                    width: 120, height: 3.5, borderRadius: 2,
                    margin: '7px auto 0',
                    background: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.12)',
                }} />
            </nav>
        </>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════════════════════════════
   Dashboard.jsx
   Master orchestrator: routing, theme, notifications, tab management
   Structure: ThemeProvider > DashboardShell > [Tabs] + LiquidGlassNav

   Routes internes:
     discover   → DiscoverTab
     explore    → ExploreTab
     likes      → LikesTab
     messages   → MessagesTab (+ ChatView)
     profile    → ProfileTab
     account    → AccountTab (modal-style overlay)
   ═══════════════════════════════════════════════════════════════════════════════ */


// ─── Lazy-loaded tabs (code-split pour perf) ─────────────────────────────────
// DiscoverTab, ExploreTab, LikesTab, MessagesTab, ProfileTab, AccountTab sont définis dans ce fichier






// ─── Tab transition variants ──────────────────────────────────────────────────
const SLIDE_DIRS = {
    discover:  0,
    explore:   1,
    likes:     2,
    messages:  3,
    profile:   4,
};

function getDirection(from, to) {
    return SLIDE_DIRS[to] > SLIDE_DIRS[from] ? 1 : -1;
}

const tabVariants = {
    enter:  (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (dir) => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0, scale: 0.96 }),
};

// ─── Splash / tab loading fallback ───────────────────────────────────────────
function TabLoader({ T }) {
    return (
        <div style={{
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: T?.bg || '#FDF6F0',
        }}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: `3px solid ${T?.gold || '#D4AF37'}22`,
                    borderTopColor: T?.gold || '#D4AF37',
                }}
            />
        </div>
    );
}

// ─── In-app toast notifications ───────────────────────────────────────────────
function ToastNotif({ notif, onDismiss, onTap, T, isDark }) {
    useEffect(() => {
        const t = setTimeout(onDismiss, 4500);
        return () => clearTimeout(t);
    }, [onDismiss]);

    const iconMap = {
        match:      { Icon: Heart,          color: '#E91E63', bg: 'rgba(233,30,99,0.12)' },
        new_message:{ Icon: MessageCircle,  color: '#E91E63', bg: 'rgba(233,30,99,0.12)' },
        super_like: { Icon: Star,           color: '#F2C94C', bg: 'rgba(242,201,76,0.12)' },
        like:       { Icon: Heart,          color: '#F2C94C', bg: 'rgba(242,201,76,0.12)' },
        default:    { Icon: Bell,           color: T.textSoft, bg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
    };
    const { Icon, color, bg } = iconMap[notif.type] || iconMap.default;

    return (
        <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{    opacity: 0, y: -40,  scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={onTap || onDismiss}
            style={{
                position: 'fixed',
                top: 'max(16px, env(safe-area-inset-top))',
                left: 16, right: 16,
                zIndex: 9500,
                background: isDark
                    ? 'rgba(22,11,24,0.96)'
                    : 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)'),
                borderRadius: 20,
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: isDark
                    ? '0 8px 40px rgba(0,0,0,0.55)'
                    : '0 8px 32px rgba(0,0,0,0.12)',
                cursor: 'pointer',
                overflow: 'hidden',
            }}
        >
            {/* Avatar ou icône */}
            {notif.avatar ? (
                <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    overflow: 'hidden', flexShrink: 0,
                    border: '2px solid rgba(233,30,99,0.30)',
                }}>
                    <img src={notif.avatar} alt=""
                         style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            ) : (
                <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon size={20} color={color} strokeWidth={1.8} />
                </div>
            )}

            {/* Texte */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 13, fontWeight: 600, color: T.text,
                    marginBottom: 2,
                }}>
                    {notif.title || 'Nouvelle notification'}
                </div>
                <div style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 12, color: T.textSoft,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {notif.body}
                </div>
            </div>

            {/* Bouton fermer */}
            <button
                onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: T.textMuted,
                }}
            >
                <X size={14} strokeWidth={2} />
            </button>

            {/* Barre de progression */}
            <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 4.5, ease: 'linear' }}
                style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                    background: 'linear-gradient(90deg, #AD1457, #E91E63)',
                    borderRadius: '0 0 20px 20px',
                    transformOrigin: 'left',
                }}
            />
        </motion.div>
    );
}
// ─── Connection status indicator ──────────────────────────────────────────────
function ConnectionBanner({ T, isDark }) {
    const [offline, setOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const onOnline  = () => setOffline(false);
        const onOffline = () => setOffline(true);
        window.addEventListener('online',  onOnline);
        window.addEventListener('offline', onOffline);
        return () => {
            window.removeEventListener('online',  onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {offline && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 36, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{
                        overflow: 'hidden',
                        background: isDark ? 'rgba(244,67,54,0.15)' : 'rgba(244,67,54,0.10)',
                        borderBottom: '1px solid rgba(244,67,54,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 12, color: '#F44336', fontWeight: 600,
                        letterSpacing: '0.04em',
                        gap: 6,
                        paddingTop: 'env(safe-area-inset-top)',
                        flexShrink: 0,
                    }}
                >
                    <span>⚠</span> Connexion perdue — certaines fonctionnalités sont limitées
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─── Discover header (logo + top-right actions) ───────────────────────────────
function DiscoverHeader({ onRefresh, T, isDark }) {
    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            zIndex: 10,
            padding: 'max(16px, env(safe-area-inset-top)) 16px 0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: `linear-gradient(180deg, ${isDark ? 'rgba(15,8,16,0.70)' : 'rgba(253,246,240,0.70)'} 0%, transparent)`,
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            pointerEvents: 'none',
        }}>
            {/* Logo — clickable to refresh */}
            <motion.button
                whileTap={{ scale: 0.9, rotate: -10 }}
                onClick={onRefresh}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 7,
                    pointerEvents: 'auto',
                }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M12 21S3 14.5 3 8.5A5.5 5.5 0 0 1 12 4.5a5.5 5.5 0 0 1 9 4C21 14.5 12 21 12 21z"
                        fill="none" stroke={T.gold} strokeWidth="1.5"
                    />
                </svg>
                <span style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 20, fontWeight: 700,
                    background: `linear-gradient(135deg, ${T.gold}, ${T.rose})`,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>LoveLine</span>
            </motion.button>

            {/* Right side: shield + filter */}
            <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
                <button style={{
                    width: 36, height: 36, borderRadius: 12,
                    background: isDark ? 'rgba(30,16,32,0.75)' : 'rgba(255,255,255,0.75)',
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${T.gold}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                }}>
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                        <path d="M8.5 2L3 4.5v4c0 3.5 2.5 6 5.5 7 3-1 5.5-3.5 5.5-7v-4L8.5 2z"
                              stroke={T.textSoft} strokeWidth="1.3" fill="none" />
                        <path d="M6 8.5l1.8 1.8L11 6.5" stroke={T.gold} strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD SHELL — Inner component (inside ThemeProvider)
// ══════════════════════════════════════════════════════════════════════════════
function DashboardShell({ onLogout }) {
    const { T, isDark, toggle: toggleTheme } = useTheme();

    // ─── Navigation state ───────────────────────────────────────────────────────
    const [activeTab, setActiveTab]     = useState('discover');
    const [prevTab,   setPrevTab]       = useState('discover');
    const [direction, setDirection]     = useState(1);
    const [showAccount, setShowAccount] = useState(false);

    // ─── Chat state (messages sub-route) ───────────────────────────────────────
    const [openConversation, setOpenConversation] = useState(null);

    // ─── User profile (lightweight) ────────────────────────────────────────────
    const [userAvatar, setUserAvatar]   = useState('');
    const [isPremium, setIsPremium]     = useState(false);

    // ─── Badges (unread counts) ─────────────────────────────────────────────────
    const [badges, setBadges] = useState({ likes: 0, messages: 0 });

    // ─── Toast notifications ────────────────────────────────────────────────────
    const [toasts, setToasts] = useState([]);
    const toastIdRef = useRef(0);

    // ─── Discover refresh trigger ───────────────────────────────────────────────
    const [discoverKey, setDiscoverKey] = useState(0);

    // ─── WebSocket notification socket ─────────────────────────────────────────
    const notifSocketRef = useRef(null);
    const activeTabRef    = useRef(activeTab);

    // ────────────────────────────────────────────────────────────────────────────
    // Init: load light profile + connect notification WS
    // ────────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        // Load minimal user data
        profileAPI.getMe().then(p => {
            setUserAvatar(p?.photos?.find(ph => ph.is_main)?.url || photoUrl(p?.photo) || p?.avatar,'');
            setIsPremium(false);

            /*À remplacer plus tard par setIsPremium(p?.subscription?.plan !== 'free');
            QUAND il y aura un moyen de payement
             */
        }).catch(console.error);

        // Load unread counts
        notificationAPI.getUnreadCounts?.()?.then(counts => {
            setBadges({
                likes:    counts?.new_likes    || 0,
                messages: counts?.new_messages || 0,
            });
        }).catch(() => {});

        // Connect global notification WebSocket
        notifSocketRef.current = new NotificationSocket({
            onNotification: handleIncomingNotification,
            onBadgeUpdate:  (counts) => setBadges(prev => ({ ...prev, ...counts })),
        });
        notifSocketRef.current.connect();

        return () => {
            notifSocketRef.current?.disconnect();
        };
    }, []);

    // ────────────────────────────────────────────────────────────────────────────
    // Handle real-time push
    // ────────────────────────────────────────────────────────────────────────────
    // Garde activeTabRef à jour à chaque changement d'onglet
    useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

    const handleIncomingNotification = useCallback((notif) => {
        const currentTab = activeTabRef.current;

        if (notif.type === 'new_message' && currentTab !== 'messages') {
            setBadges(prev => ({ ...prev, messages: prev.messages + 1 }));
        }
        if (notif.type === 'like' || notif.type === 'super_like') {
            setBadges(prev => ({ ...prev, likes: prev.likes + 1 }));
        }

        const suppressOn = {
            new_message: 'messages',
            match:       null,
            super_like:  null,
            like:        'likes',
        };
        const suppress = suppressOn[notif.type];
        if (!suppress || currentTab !== suppress) {
            addToast({
                type:   notif.type,
                title:  notif.title  || (notif.type === 'new_message' ? 'Nouveau message' : notif.type === 'match' ? 'Nouveau match !' : 'Notification'),
                body:   notif.body   || notif.message || '',
                avatar: notif.actor_avatar || notif.avatar || null,
                tab:    notif.type === 'new_message' ? 'messages' : 'likes',
            });
        }
    }, []);
    const addToast = useCallback((notif) => {
        const id = ++toastIdRef.current;
        setToasts(prev => [...prev.slice(-2), { ...notif, _id: id }]); // max 3
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t._id !== id));
    }, []);

    // ────────────────────────────────────────────────────────────────────────────
    // Tab navigation
    // ────────────────────────────────────────────────────────────────────────────
    const handleTabChange = useCallback((tabId) => {
        if (tabId === activeTab) {
            // Same tab → refresh action
            if (tabId === 'discover') setDiscoverKey(k => k + 1);
            return;
        }
        const dir = getDirection(activeTab, tabId);
        setDirection(dir);
        setPrevTab(activeTab);
        setActiveTab(tabId);

        // Clear badge on visit
        if (tabId === 'messages') setBadges(prev => ({ ...prev, messages: 0 }));
        if (tabId === 'likes')    setBadges(prev => ({ ...prev, likes: 0 }));
    }, [activeTab]);

    // ────────────────────────────────────────────────────────────────────────────
    // Toast → navigate to relevant tab on tap
    // ────────────────────────────────────────────────────────────────────────────
    const handleToastTap = useCallback((toast) => {
        dismissToast(toast._id);
        if (toast.tab) handleTabChange(toast.tab);
    }, [handleTabChange, dismissToast]);

    // ────────────────────────────────────────────────────────────────────────────
    // Render
    // ────────────────────────────────────────────────────────────────────────────
    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: isDark
                ? 'linear-gradient(160deg, #1A0820 0%, #0F0810 100%)'
                : `linear-gradient(160deg, ${T.bg} 0%, ${T.bgDark} 100%)`,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: "'Playfair Display', sans-serif",
            // Prevent rubber-band scroll on iOS
            overscrollBehavior: 'none',
        }}>
            {/* Connection banner */}
            <ConnectionBanner T={T} isDark={isDark} />

            {/* ─── Main content area ─── */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

                {/* Discover header (always visible on discover) */}
                <AnimatePresence>
                    {activeTab === 'discover' && !showAccount && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}
                        >
                            <DiscoverHeader
                                onRefresh={() => setDiscoverKey(k => k + 1)}
                                T={T} isDark={isDark}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tab panels — animated */}
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div
                        key={activeTab}
                        custom={direction}
                        variants={tabVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: 'spring', stiffness: 300, damping: 32 },
                            opacity: { duration: 0.22 },
                            scale: { duration: 0.22 },
                        }}
                        style={{
                            position: 'absolute', inset: 0,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            WebkitOverflowScrolling: 'touch',
                            // Padding for nav bar at bottom
                            paddingBottom: 0,
                        }}
                    >
                        <>
                            {activeTab === 'discover' && (
                                <DiscoverTab
                                    key={`discover-${discoverKey}`}
                                    isPremium={isPremium}
                                    onNavigateMessages={(convId) => {
                                        setOpenConversation(convId);
                                        handleTabChange('messages');
                                    }}
                                />
                            )}

                            {activeTab === 'explore' && (
                                <ExploreTab
                                    isPremium={isPremium}
                                    onOpenConversation={(conv) => {
                                        setOpenConversation(conv);
                                        handleTabChange('messages');
                                    }}
                                />
                            )}

                            {activeTab === 'likes' && (
                                <LikesTab
                                    isPremium={isPremium}
                                    onGoToMessages={(conv) => {
                                        setOpenConversation(conv);
                                        handleTabChange('messages');
                                    }}
                                />
                            )}

                            {activeTab === 'messages' && (
                                <MessagesTab
                                    initialConversation={openConversation}
                                    onConversationOpen={() => setOpenConversation(null)}
                                    onNewMatch={() => setBadges(prev => ({ ...prev, messages: 0 }))}
                                    isPremium={isPremium}
                                />
                            )}

                            {activeTab === 'profile' && (
                                <ProfileTab
                                    isPremium={isPremium}
                                    onNavigateAccount={() => setShowAccount(true)}
                                    onToggleTheme={toggleTheme}
                                    isDark={isDark}
                                />
                            )}
                        </>
                    </motion.div>
                </AnimatePresence>

                {/* ─── Account overlay (slides from right) ─── */}
                <AnimatePresence>
                    {showAccount && (
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                            style={{
                                position: 'absolute', inset: 0, zIndex: 200,
                                background: T.bg,
                                overflowY: 'auto',
                            }}
                        >
                            <>
                                <AccountTab
                                    onBack={() => setShowAccount(false)}
                                    onLogout={onLogout}
                                />
                            </>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ─── Bottom Navigation ─── */}
            <LiquidGlassNav
                activeTab={activeTab}
                onTabChange={handleTabChange}
                badges={badges}
                userAvatar={userAvatar}
            />

            {/* ─── Toast notifications ─── */}
            <AnimatePresence>
                {toasts.map(toast => (
                    <ToastNotif
                        key={toast._id}
                        notif={toast}
                        onDismiss={() => dismissToast(toast._id)}
                        onTap={() => handleToastTap(toast)}
                        T={T}
                        isDark={isDark}
                    />
                ))}
            </AnimatePresence>

            {/* ─── Global fonts injection ─── */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600;700&display=swap');

        * { -webkit-tap-highlight-color: transparent; }

        html, body, #root {
          height: 100%;
          overflow: hidden;
          overscroll-behavior: none;
        }

        /* Input & textarea focus */
        input:focus, textarea:focus, select:focus {
          outline: none;
          box-shadow: 0 0 0 2px ${T.gold}44 !important;
        }

        /* Range input */
        input[type="range"] {
          -webkit-appearance: none;
          height: 4px;
          border-radius: 2px;
          background: ${T.gold}22;
          cursor: pointer;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: ${T.gold};
          box-shadow: 0 2px 8px ${T.gold}44;
          cursor: pointer;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 0; height: 0; }

        /* Image drag disable */
        img { -webkit-user-drag: none; user-select: none; }

        /* Smooth rendering */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTED: Dashboard — ThemeProvider wrapper
// ══════════════════════════════════════════════════════════════════════════════
export default function Dashboard({ onLogout }) {
    return (
        <ThemeProvider>
            <DashboardShell onLogout={onLogout} />
        </ThemeProvider>
    );
}
