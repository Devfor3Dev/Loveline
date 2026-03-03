/* ═══════════════════════════════════════════════════════════════════════════════
   LoveLine — Dashboard.jsx (FICHIER UNIQUE COMPLET)
   Fusion de tous les modules : api, thème, modals, swipe, discover, explore,
   likes, chat, messages, profil, compte, navigation, dashboard principal.
   Backend : Django Ninja JWT  —  Frontend : React + Framer Motion + GSAP
   ═══════════════════════════════════════════════════════════════════════════════ */

import {
    useState, useEffect, useRef, useCallback,
    createContext, useContext, Suspense,
} from 'react';
import {
    Heart, Compass, Sparkles, MessageCircle, User,
    RotateCcw, Zap, X, ChevronLeft, Search,
    Bell, Camera, Lock, Mail, Settings, Eye, EyeOff,
    Shield, Trash2, LogOut, Star, Check, ChevronRight,
    Mic, Send, Phone, Video, MoreVertical, ArrowLeft,
    Image, Plus, Flame, MapPin, GraduationCap, Filter,
    Upload, RefreshCw, Info, Moon, Sun,
} from 'lucide-react';

import {
    motion, AnimatePresence,
    useMotionValue, useTransform, useAnimation,
    useSpring,
} from 'framer-motion';
import { gsap } from 'gsap';


// ══════════════════════════════════════════════════════════════════════════════
// COUCHE API — Django Ninja JWT
// ══════════════════════════════════════════════════════════════════════════════

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

// ─── Base fetch avec auto-refresh JWT (Django Ninja JWT) ──────────────────────
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

// ─── AUTH (Django Ninja JWT) ──────────────────────────────────────────────────
const authAPI = {
    login: (email, password) =>
        apiFetch('/api/auth/token/pair', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (data) =>
        apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    logout: (refresh) =>
        apiFetch('/api/auth/token/blacklist', { method: 'POST', body: JSON.stringify({ refresh }) }),
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
        apiFetch('/api/swipe', { method: 'POST', body: JSON.stringify({ profile_id: profileId, direction }) }),
    rewind: () => apiFetch('/api/swipe/rewind', { method: 'POST' }),
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
    getMatches:         () => apiFetch('/api/matches'),
    getConversations:   () => apiFetch('/api/messages/conversations'),
    getMessages:        (matchId, page = 1) => apiFetch(`/api/messages/${matchId}?page=${page}`),
    sendMessage:        (matchId, content, type = 'text') =>
        apiFetch(`/api/messages/${matchId}`, { method: 'POST', body: JSON.stringify({ content, type }) }),
    sendVoiceMessage:   (matchId, formData) => apiFormData(`/api/messages/${matchId}/voice`, formData, 'POST'),
    markAsRead:         (matchId) => apiFetch(`/api/messages/${matchId}/read`, { method: 'POST' }),
    deleteConversation: (matchId) => apiFetch(`/api/messages/${matchId}`, { method: 'DELETE' }),
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
        if (this.ws) { this.ws.onclose = null; this.ws.close(); }
    }
}


// ══════════════════════════════════════════════════════════════════════════════
// SYSTÈME DE THÈME
// ══════════════════════════════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════════════
   LoveLine — Theme System (Light & Dark)
   ═══════════════════════════════════════════════════════════════ */

// ─── Palette ─────────────────────────────────────────────────────────────────
export const LIGHT = {
    // Backgrounds
    bg:           '#FDF6F0',
    bgDark:       '#F5EDE5',
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
    gold:         '#F2C94C',
    goldDark:     '#D4A017',
    goldLight:    '#FDE68A',
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

    // Status
    online:       '#4CAF50',
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

    gold:         '#F2C94C',
    goldDark:     '#D4A017',
    goldLight:    '#FDE68A',
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
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
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
   LoveLine — Match & Premium Modals
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
        <div ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
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
        price: '3 500',
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
        price: '6 500',
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
            sub: 'Le Rewind te laisse une seconde chance pour les âmes perdues',
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
                        <div style={{ fontSize: 40, marginBottom: 12 }}>💎</div>
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
   LoveLine — Swipe Card
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
        : [{ url: profile.avatar || 'https://via.placeholder.com/400x600' }];

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
function ActionButtons({ onNope, onSuperLike, onLike, onBoost, onRewind,
                           canRewind, canSuperLike, canBoost, T }) {

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 16, padding: '0 24px',
        }}>
            {/* Rewind */}
            <ActionBtn
                onClick={onRewind}
                disabled={!canRewind}
                size={44}
                color={canRewind ? '#F5B800' : '#9E9E9E'}
                shadow={canRewind ? '0 6px 20px rgba(245,184,0,0.35)' : 'none'}
                title="Annuler"
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10a6 6 0 1 1 1.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M4 6v4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </ActionBtn>

            {/* Nope */}
            <ActionBtn
                onClick={onNope}
                size={58}
                color="#F44336"
                shadow="0 8px 24px rgba(244,67,54,0.35)"
                title="Passer"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
            </ActionBtn>

            {/* Super Like */}
            <ActionBtn
                onClick={onSuperLike}
                disabled={!canSuperLike}
                size={50}
                color={canSuperLike ? '#2196F3' : '#9E9E9E'}
                shadow={canSuperLike ? '0 6px 20px rgba(33,150,243,0.35)' : 'none'}
                title="Super Like"
            >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 2l2.4 6.6H20l-5.2 4 2 6.4L11 15l-5.8 4 2-6.4L2 8.6h6.6L11 2z"
                          stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
                          fill={canSuperLike ? 'rgba(33,150,243,0.2)' : 'none'} />
                </svg>
            </ActionBtn>

            {/* Like — with animation */}
            <LikeButton onLike={onLike} />

            {/* Boost */}
            <ActionBtn
                onClick={onBoost}
                size={44}
                color={canBoost ? '#9C27B0' : '#9E9E9E'}
                shadow={canBoost ? '0 6px 20px rgba(156,39,176,0.35)' : 'none'}
                title="Boost"
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2L7 9h5l-2 9 7-10h-5l2-6z" stroke="currentColor" strokeWidth="1.8"
                          fill={canBoost ? 'rgba(156,39,176,0.2)' : 'none'} strokeLinejoin="round" />
                </svg>
            </ActionBtn>
        </div>
    );
}

function ActionBtn({ onClick, size, color, shadow, disabled, children, title }) {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            title={title}
            whileHover={disabled ? {} : { scale: 1.12, y: -3 }}
            whileTap={disabled ? {} : { scale: 0.92 }}
            style={{
                width: size, height: size,
                borderRadius: '50%',
                border: `1.5px solid ${color}44`,
                background: `${color}14`,
                color: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: disabled ? 'not-allowed' : 'pointer',
                boxShadow: shadow,
                transition: 'box-shadow 0.3s',
                flexShrink: 0,
                opacity: disabled ? 0.5 : 1,
            }}
        >
            {children}
        </motion.button>
    );
}

// ─── Like Button — ultra-explosive petal animation ───────────────────────────
const HEART_PARTICLES = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const radius = 42 + Math.random() * 22;
    return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        rotate: Math.random() * 360,
        scale: 0.6 + Math.random() * 0.8,
        delay: Math.random() * 0.12,
        emoji: i % 3 === 0 ? '💕' : i % 3 === 1 ? '❤️' : '✨',
    };
});

function LikeButton({ onLike }) {
    const [bursting, setBursting] = useState(false);
    const [phase, setPhase]       = useState(0); // 0=idle 1=burst 2=settle

    const handleLike = () => {
        if (bursting) return;
        setBursting(true);
        setPhase(1);
        onLike();
        setTimeout(() => setPhase(2), 500);
        setTimeout(() => { setBursting(false); setPhase(0); }, 900);
    };

    return (
        <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>

            {/* ── Flash ring ── */}
            <AnimatePresence>
                {phase === 1 && (
                    <motion.div
                        initial={{ scale:0.5, opacity:0.8 }}
                        animate={{ scale:3.5, opacity:0 }}
                        exit={{ opacity:0 }}
                        transition={{ duration:0.55, ease:'easeOut' }}
                        style={{
                            position:'absolute', inset:0, borderRadius:'50%',
                            background:'radial-gradient(circle, rgba(233,30,99,0.55) 0%, transparent 70%)',
                            pointerEvents:'none', zIndex:1,
                        }}
                    />
                )}
            </AnimatePresence>

            {/* ── Particle burst ── */}
            <AnimatePresence>
                {phase === 1 && HEART_PARTICLES.map((p, i) => (
                    <motion.div key={i}
                                initial={{ x:0, y:0, scale:0, opacity:1, rotate:0 }}
                                animate={{ x:p.x, y:p.y, scale:p.scale, opacity:0, rotate:p.rotate }}
                                exit={{ opacity:0 }}
                                transition={{ duration:0.65, delay:p.delay, ease:[0.22,0.68,0,1.2] }}
                                style={{
                                    position:'absolute', top:'50%', left:'50%',
                                    transform:'translate(-50%,-50%)',
                                    pointerEvents:'none', zIndex:10,
                                    fontSize:14, lineHeight:1,
                                }}
                    >
                        {p.emoji}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* ── Ripple rings ── */}
            <AnimatePresence>
                {phase === 1 && [0,1].map(i => (
                    <motion.div key={i}
                                initial={{ scale:0.8, opacity:0.6 }}
                                animate={{ scale:2.8 + i, opacity:0 }}
                                transition={{ duration:0.5 + i*0.15, delay:i*0.08, ease:'easeOut' }}
                                style={{
                                    position:'absolute', inset:0, borderRadius:'50%',
                                    border:'2px solid rgba(233,30,99,0.5)',
                                    pointerEvents:'none', zIndex:2,
                                }}
                    />
                ))}
            </AnimatePresence>

            {/* ── Main button ── */}
            <motion.button
                onClick={handleLike}
                whileHover={!bursting ? { scale:1.14, y:-3 } : {}}
                whileTap={!bursting ? { scale:0.88 } : {}}
                animate={phase===1 ? {
                    scale:[1, 1.45, 0.88, 1.15, 1],
                    rotate:[0,-18,14,-7,0],
                    boxShadow:[
                        '0 8px 24px rgba(233,30,99,0.30)',
                        '0 0 48px rgba(233,30,99,0.80), 0 0 80px rgba(233,30,99,0.40)',
                        '0 0 24px rgba(233,30,99,0.40)',
                        '0 8px 24px rgba(233,30,99,0.30)',
                    ],
                } : {}}
                transition={{ duration:0.52, ease:[0.22,0.68,0,1.2] }}
                style={{
                    width:62, height:62, borderRadius:'50%',
                    border:`1.5px solid rgba(233,30,99,${phase===1?'0.80':'0.40'})`,
                    background: phase===1
                        ? 'radial-gradient(circle at 40% 35%, rgba(233,30,99,0.45), rgba(233,30,99,0.20))'
                        : 'rgba(233,30,99,0.12)',
                    color:'#E91E63',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    cursor: bursting ? 'default' : 'pointer',
                    boxShadow:'0 8px 24px rgba(233,30,99,0.30)',
                    position:'relative', zIndex:3,
                }}
            >
                {/* Inner glow on burst */}
                {phase===1 && (
                    <motion.div
                        initial={{ opacity:0 }} animate={{ opacity:[0,1,0] }}
                        transition={{ duration:0.4 }}
                        style={{
                            position:'absolute', inset:0, borderRadius:'50%',
                            background:'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.50), transparent 65%)',
                            pointerEvents:'none',
                        }}
                    />
                )}
                <motion.svg
                    width="28" height="28" viewBox="0 0 28 28" fill="none"
                    animate={phase===1 ? { scale:[1,1.35,1] } : {}}
                    transition={{ duration:0.4 }}
                >
                    <path
                        d="M14 24s-11-7.5-11-14A5.5 5.5 0 0 1 14 6a5.5 5.5 0 0 1 11 4c0 6.5-11 14-11 14z"
                        fill={phase===1 ? '#E91E63' : 'rgba(233,30,99,0.25)'}
                        stroke="#E91E63" strokeWidth="1.8"
                    />
                </motion.svg>
            </motion.button>
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
// DISCOVERTAB
// ══════════════════════════════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════════════
   LoveLine — Discover Tab (Swipe Deck)
   The beating heart of the application
   ═══════════════════════════════════════════════════════════════ */

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyDeck({ T, isDark }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: '100%',
                padding: 40, textAlign: 'center',
            }}
        >
            {/* Radar pulse animation */}
            <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 32 }}>
                {[1, 2, 3].map(i => (
                    <motion.div
                        key={i}
                        animate={{
                            scale: [1, 2.2],
                            opacity: [0.4, 0],
                        }}
                        transition={{
                            duration: 2.4,
                            delay: i * 0.7,
                            repeat: Infinity,
                            ease: 'easeOut',
                        }}
                        style={{
                            position: 'absolute', inset: 0,
                            borderRadius: '50%',
                            border: `1.5px solid ${T.gold}`,
                        }}
                    />
                ))}
                <div style={{
                    position: 'absolute', inset: 0,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${T.gold}22, transparent)`,
                    border: `2px solid ${T.gold}66`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                        <path
                            d="M22 38s-16-10.5-16-20A8 8 0 0 1 22 11a8 8 0 0 1 16 7c0 9.5-16 20-16 20z"
                            fill={`${T.gold}22`}
                            stroke={T.gold}
                            strokeWidth="1.8"
                        />
                    </svg>
                </div>
            </div>

            <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 24, fontWeight: 700,
                color: T.text, marginBottom: 12,
                lineHeight: 1.4,
            }}>
                Le campus se repose pour l'instant
            </h2>
            <p style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                fontSize: 15, color: T.textSoft,
                lineHeight: 1.8, maxWidth: 280,
                marginBottom: 32,
            }}>
                "Les plus belles histoires commencent dans l'attente.
                Peaufine ton profil pendant que de nouvelles âmes arrivent."
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 260 }}>
                <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                        background: `linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
                        color: '#1A0812', border: 'none',
                        padding: '16px 32px', borderRadius: 50,
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 14, fontWeight: 700,
                        letterSpacing: '0.06em',
                        cursor: 'pointer',
                        boxShadow: `0 8px 30px ${T.gold}44`,
                    }}
                >
                    ✦ Améliorer mon profil
                </motion.button>

                <button style={{
                    background: 'none', border: `1px solid ${T.gold}44`,
                    color: T.textSoft, borderRadius: 50,
                    padding: '14px 32px',
                    fontFamily: "'Playfair Display', sans-serif",
                    fontSize: 13, cursor: 'pointer',
                }}>
                    Élargir ma zone de recherche
                </button>
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
function DiscoverTab({ myProfile, isPremium, onNavigateMessages }) {
    const { T, isDark } = useTheme();

    const [profiles, setProfiles]         = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [match, setMatch]               = useState(null);
    const [premiumFeature, setPremiumFeature] = useState(null);
    const [boostStatus, setBoostStatus]   = useState(null);
    const [filters, setFilters]           = useState({});
    const [superLikeCount, setSuperLikeCount] = useState(3);
    const [lastSwiped, setLastSwiped]     = useState(null);
    const [canRewind, setCanRewind]       = useState(false);
    const boostTimer = useRef(null);

    // ─ Load profiles
    const loadProfiles = useCallback(async (f = {}) => {
        try {
            setLoading(true);
            setError(null);
            const data = await discoverAPI.getProfiles(f);
            setProfiles(data.profiles || data || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadProfiles(filters); }, [filters]);

    // ─ Load boost status
    useEffect(() => {
        discoverAPI.getBoostStatus().then(data => {
            setBoostStatus(data);
            if (data?.active) startBoostTimer();
        }).catch(() => {});
    }, []);

    // ─ Load super like status
    useEffect(() => {
        discoverAPI.getBoostStatus && // reuse — adapt to real endpoint
        fetch('/api/likes/superlike-status/', { headers: { Authorization: `Bearer ${localStorage.getItem('ll_access')}` } })
            .then(r => r.json())
            .then(d => setSuperLikeCount(d.remaining ?? 3))
            .catch(() => {});
    }, []);

    const startBoostTimer = () => {
        if (boostTimer.current) clearInterval(boostTimer.current);
        boostTimer.current = setInterval(() => {
            setBoostStatus(prev => {
                if (!prev?.remaining_seconds) { clearInterval(boostTimer.current); return null; }
                return { ...prev, remaining_seconds: prev.remaining_seconds - 1 };
            });
        }, 1000);
    };

    // ─ Swipe handler
    const handleSwipe = useCallback(async (profileId, direction) => {
        setLastSwiped({ profileId, direction });
        setCanRewind(true);

        const top = profiles[0];
        setProfiles(prev => prev.slice(1));

        if (profiles.length <= 3) {
            loadProfiles(filters); // preload more
        }

        try {
            const result = await discoverAPI.swipe(profileId, direction);

            if (result?.is_match) {
                setMatch({
                    myAvatar:   myProfile?.photos?.[0]?.url || myProfile?.avatar,
                    theirAvatar: top?.photos?.[0]?.url || top?.avatar,
                    theirName:  top?.first_name,
                    matchId:    result.match_id,
                });
            }

            if (direction === 'superlike') {
                setSuperLikeCount(c => Math.max(0, c - 1));
            }
        } catch (e) {
            console.error('Swipe error:', e);
        }
    }, [profiles, filters, loadProfiles, myProfile]);

    // ─ Rewind
    const handleRewind = async () => {
        if (!canRewind) return;
        if (!isPremium) { setPremiumFeature('rewind'); return; }
        try {
            await discoverAPI.rewind();
            setCanRewind(false);
            loadProfiles(filters);
        } catch (e) {
            console.error('Rewind error:', e);
        }
    };

    // ─ Super like
    const handleSuperLike = () => {
        if (superLikeCount <= 0 && !isPremium) {
            setPremiumFeature('superlike');
            return;
        }
        if (profiles[0]) handleSwipe(profiles[0].id, 'superlike');
    };

    // ─ Boost
    const handleBoost = async () => {
        if (!isPremium && !boostStatus?.free_remaining) {
            setPremiumFeature('boost');
            return;
        }
        try {
            const result = await discoverAPI.activateBoost();
            setBoostStatus({ active: true, remaining_seconds: 1800, free_remaining: result.free_remaining });
            startBoostTimer();
        } catch (e) {
            console.error('Boost error:', e);
        }
    };

    const currentProfile = profiles[0];
    const hasProfiles = profiles.length > 0;

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            height: '100%', background: T.bg,
            position: 'relative',
        }}>
            {/* Boost banner */}
            <BoostBanner boostStatus={boostStatus} onBoostClick={handleBoost} T={T} />

            {/* Top bar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px 8px',
                position: 'relative',
            }}>
                {/* Logo */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <path d="M11 19s-9-6-9-12A5 5 0 0 1 11 4a5 5 0 0 1 9 3c0 6-9 12-9 12z"
                              fill="none" stroke={T.gold} strokeWidth="1.6" />
                    </svg>
                    <span style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 20, fontWeight: 700,
                        color: T.text, letterSpacing: '0.04em',
                    }}>
            LoveLine
          </span>
                </div>

                {/* Filters */}
                <div style={{ position: 'relative' }}>
                    <FilterBar filters={filters} onChange={setFilters} T={T} isDark={isDark} />
                </div>
            </div>

            {/* Swipe area */}
            <div style={{
                flex: 1, position: 'relative',
                margin: '8px 16px 0',
                minHeight: 0,
            }}>
                {loading && profiles.length === 0 ? (
                    <div style={{
                        height: '100%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                            style={{
                                width: 44, height: 44, borderRadius: '50%',
                                border: `3px solid ${T.gold}22`,
                                borderTopColor: T.gold,
                            }}
                        />
                    </div>
                ) : error ? (
                    <div style={{
                        height: '100%', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 16,
                    }}>
                        <p style={{ fontFamily: "'Playfair Display', sans-serif", color: T.textSoft }}>
                            Connexion impossible
                        </p>
                        <button onClick={() => loadProfiles(filters)} style={{
                            padding: '12px 24px', borderRadius: 50,
                            background: T.gold, color: '#1A0812',
                            border: 'none', fontWeight: 700, cursor: 'pointer',
                            fontFamily: "'Playfair Display', sans-serif",
                        }}>
                            Réessayer
                        </button>
                    </div>
                ) : !hasProfiles ? (
                    <EmptyDeck T={T} isDark={isDark} />
                ) : (
                    /* Card stack */
                    <div style={{
                        position: 'relative', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <AnimatePresence>
                            {profiles.slice(0, 3).map((profile, index) => (
                                <SwipeCard
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

            {/* Action buttons */}
            {hasProfiles && !loading && (
                <div style={{ padding: '16px 16px 8px' }}>
                    {/* Super like counter */}
                    <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <span style={{
                fontFamily: "'Playfair Display', sans-serif",
                fontSize: 11, color: T.textMuted,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="#2196F3">
                <path d="M6 1l1.2 3.4H11L8.4 6.5l1 3.3L6 7.9 2.6 9.8l1-3.3L1 4.4h3.8L6 1z" />
              </svg>
                {isPremium ? '∞' : superLikeCount} Super Like{superLikeCount !== 1 ? 's' : ''} restant{superLikeCount !== 1 ? 's' : ''}
            </span>
                    </div>

                    <ActionButtons
                        onNope={() => currentProfile && handleSwipe(currentProfile.id, 'nope')}
                        onLike={() => currentProfile && handleSwipe(currentProfile.id, 'like')}
                        onSuperLike={handleSuperLike}
                        onRewind={handleRewind}
                        onBoost={handleBoost}
                        canRewind={canRewind}
                        canSuperLike={superLikeCount > 0 || isPremium}
                        canBoost={!!boostStatus?.free_remaining || isPremium}
                        T={T}
                    />
                </div>
            )}

            {/* Match Modal */}
            <MatchModal
                match={match}
                onClose={() => setMatch(null)}
                onMessage={() => {
                    setMatch(null);
                    onNavigateMessages?.(match?.matchId);
                }}
            />

            {/* Premium Modal */}
            {premiumFeature && (
                <PremiumModal
                    feature={premiumFeature}
                    onClose={() => setPremiumFeature(null)}
                    onSubscribe={(planId) => {
                        setPremiumFeature(null);
                        // navigate to subscription
                    }}
                />
            )}
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
// EXPLORETAB
// ══════════════════════════════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════════════
   LoveLine — Explore Tab
   Category-based discovery with art-level interface
   ═══════════════════════════════════════════════════════════════ */

// ─── Category definitions (icons & gradients) ─────────────────────────────────
const CATEGORY_STYLES = {
    default: {
        gradient: 'linear-gradient(135deg, #D4AF37, #B8942E)',
        emoji: '✨',
    },
    sciences: {
        gradient: 'linear-gradient(135deg, #2196F3, #0D47A1)',
        emoji: '🔬',
    },
    tech: {
        gradient: 'linear-gradient(135deg, #00BCD4, #006064)',
        emoji: '💻',
    },
    arts: {
        gradient: 'linear-gradient(135deg, #E91E63, #880E4F)',
        emoji: '🎨',
    },
    sport: {
        gradient: 'linear-gradient(135deg, #FF5722, #BF360C)',
        emoji: '⚽',
    },
    musique: {
        gradient: 'linear-gradient(135deg, #9C27B0, #4A148C)',
        emoji: '🎵',
    },
    litterature: {
        gradient: 'linear-gradient(135deg, #795548, #3E2723)',
        emoji: '📚',
    },
    voyage: {
        gradient: 'linear-gradient(135deg, #4CAF50, #1B5E20)',
        emoji: '✈️',
    },
    cuisine: {
        gradient: 'linear-gradient(135deg, #FF9800, #E65100)',
        emoji: '🍜',
    },
    gaming: {
        gradient: 'linear-gradient(135deg, #673AB7, #311B92)',
        emoji: '🎮',
    },
    droit: {
        gradient: 'linear-gradient(135deg, #607D8B, #263238)',
        emoji: '⚖️',
    },
    medecine: {
        gradient: 'linear-gradient(135deg, #F44336, #B71C1C)',
        emoji: '🏥',
    },
};

// ─── Category Card ────────────────────────────────────────────────────────────
function CategoryCard({ category, onClick, T, isDark }) {
    const style = CATEGORY_STYLES[category.slug] || CATEGORY_STYLES.default;
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            onClick={() => onClick(category)}
            style={{
                borderRadius: 24,
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
                aspectRatio: '1',
                boxShadow: hovered
                    ? `0 20px 50px rgba(0,0,0,0.20)`
                    : `0 6px 24px rgba(0,0,0,0.10)`,
                transition: 'box-shadow 0.35s',
            }}
        >
            {/* Background image or gradient */}
            {category.cover_image ? (
                <img
                    src={category.cover_image}
                    alt={category.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            ) : (
                <div style={{
                    width: '100%', height: '100%',
                    background: style.gradient,
                }} />
            )}

            {/* Overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%)',
            }} />

            {/* Content */}
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: 16,
            }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{style.emoji}</div>
                <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 14, fontWeight: 700,
                    color: '#fff', lineHeight: 1.3,
                    marginBottom: 4,
                }}>
                    {category.name}
                </div>
                <div style={{
                    fontFamily: "'Playfair Display', sans-serif",
                    fontSize: 11, color: 'rgba(255,255,255,0.75)',
                    fontWeight: 500,
                }}>
                    {category.count || 0} étudiant{(category.count || 0) !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Shine on hover */}
            <motion.div
                animate={{ x: hovered ? '100%' : '-100%' }}
                transition={{ duration: 0.5 }}
                style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
                    pointerEvents: 'none',
                }}
            />
        </motion.div>
    );
}

// ─── Profile grid item ────────────────────────────────────────────────────────
function ProfileGridItem({ profile, onLike, onView, T, isDark }) {
    const [liked, setLiked] = useState(false);

    const handleLike = async (e) => {
        e.stopPropagation();
        if (liked) return;
        setLiked(true);
        try {
            await discoverAPI.swipe(profile.id, 'like');
            onLike?.(profile.id);
        } catch (e) {
            setLiked(false);
        }
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onView?.(profile)}
            style={{
                borderRadius: 20,
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
                aspectRatio: '3/4',
                boxShadow: T.shadowCard,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.80)'}`,
            }}
        >
            <img
                src={profile.photos?.[0]?.url || profile.avatar}
                alt={profile.first_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* Gradient overlay */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: '55%',
                background: 'linear-gradient(0deg, rgba(0,0,0,0.80) 0%, transparent 100%)',
            }} />

            {/* Info */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '12px 14px',
            }}>
                <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 15, fontWeight: 700, color: '#fff',
                    marginBottom: 2,
                }}>
                    {profile.first_name}, {profile.age}
                </div>
                {profile.faculty && (
                    <div style={{
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 11, color: 'rgba(255,255,255,0.70)',
                    }}>
                        {profile.faculty}
                    </div>
                )}
            </div>

            {/* Like button */}
            <motion.button
                onClick={handleLike}
                whileTap={{ scale: 0.85 }}
                style={{
                    position: 'absolute', top: 10, right: 10,
                    width: 36, height: 36, borderRadius: '50%',
                    background: liked
                        ? 'rgba(233,30,99,0.90)'
                        : 'rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(8px)',
                    border: `1.5px solid ${liked ? '#E91E63' : 'rgba(255,255,255,0.30)'}`,
                    color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                }}
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                        d="M8 13.5S1.5 9 1.5 5.5a3.5 3.5 0 0 1 6.5-1.8 3.5 3.5 0 0 1 6.5 1.8C14.5 9 8 13.5 8 13.5z"
                        fill={liked ? '#fff' : 'none'}
                        stroke="#fff" strokeWidth="1.4"
                    />
                </svg>
            </motion.button>

            {/* Online indicator */}
            {profile.is_online && (
                <div style={{
                    position: 'absolute', top: 10, left: 10,
                    background: '#4CAF50', borderRadius: 10,
                    padding: '3px 8px',
                    display: 'flex', alignItems: 'center', gap: 4,
                }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                    <span style={{
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 9, fontWeight: 700, color: '#fff',
                    }}>
            En ligne
          </span>
                </div>
            )}
        </motion.div>
    );
}

// ─── Search bar ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, T, isDark }) {
    return (
        <div style={{
            position: 'relative',
            marginBottom: 20,
        }}>
            <svg
                style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                width="16" height="16" viewBox="0 0 16 16" fill="none"
            >
                <circle cx="7" cy="7" r="5" stroke={T.textSoft} strokeWidth="1.5" />
                <path d="M11 11l3 3" stroke={T.textSoft} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
                type="text"
                placeholder="Recherche par passion, filière..."
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{
                    width: '100%',
                    padding: '14px 16px 14px 44px',
                    borderRadius: 16,
                    border: `1px solid ${T.gold}33`,
                    background: isDark ? 'rgba(30,16,32,0.80)' : 'rgba(255,255,255,0.80)',
                    backdropFilter: 'blur(12px)',
                    fontFamily: "'Playfair Display', sans-serif",
                    fontSize: 14,
                    color: T.text,
                    outline: 'none',
                    boxSizing: 'border-box',
                }}
            />
        </div>
    );
}

// ─── Profile detail sheet ─────────────────────────────────────────────────────
function ProfileSheet({ profile, onClose, onLike, T, isDark }) {
    if (!profile) return null;

    const photos = profile.photos?.length > 0
        ? profile.photos
        : [{ url: profile.avatar }];

    const [currentPhoto, setCurrentPhoto] = useState(0);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', inset: 0, zIndex: 5000,
                    background: 'rgba(0,0,0,0.70)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex', alignItems: 'flex-end',
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        width: '100%', maxWidth: 480,
                        margin: '0 auto',
                        background: isDark ? '#0F0810' : '#FDF6F0',
                        borderRadius: '28px 28px 0 0',
                        overflow: 'hidden',
                        maxHeight: '92vh',
                    }}
                >
                    {/* Photo carousel */}
                    <div style={{ position: 'relative', height: 400 }}>
                        <img
                            src={photos[currentPhoto]?.url}
                            alt={profile.first_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(0deg, rgba(0,0,0,0.70) 0%, transparent 50%)',
                        }} />

                        {/* Close */}
                        <button onClick={onClose} style={{
                            position: 'absolute', top: 16, right: 16,
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)',
                            border: 'none', color: '#fff', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            ✕
                        </button>

                        {/* Photo dots */}
                        <div style={{
                            position: 'absolute', bottom: 80, left: 0, right: 0,
                            display: 'flex', gap: 5, justifyContent: 'center',
                        }}>
                            {photos.map((_, i) => (
                                <button key={i} onClick={() => setCurrentPhoto(i)} style={{
                                    width: i === currentPhoto ? 20 : 6, height: 6, borderRadius: 3,
                                    background: i === currentPhoto ? '#fff' : 'rgba(255,255,255,0.45)',
                                    border: 'none', cursor: 'pointer', transition: 'width 0.3s',
                                }} />
                            ))}
                        </div>

                        {/* Name */}
                        <div style={{
                            position: 'absolute', bottom: 20, left: 20,
                        }}>
                            <div style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: 28, fontWeight: 700, color: '#fff',
                            }}>
                                {profile.first_name}, {profile.age}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '24px 20px 100px', overflowY: 'auto' }}>
                        {/* University */}
                        {profile.university && (
                            <div style={{
                                display: 'flex', gap: 8, alignItems: 'center',
                                marginBottom: 16,
                                padding: '12px 16px', borderRadius: 14,
                                background: isDark ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.10)',
                                border: `1px solid ${T.gold}22`,
                            }}>
                                <span style={{ fontSize: 18 }}>🎓</span>
                                <div>
                                    <div style={{ fontFamily: "'Playfair Display', sans-serif", fontSize: 13, fontWeight: 600, color: T.text }}>
                                        {profile.university}
                                    </div>
                                    {profile.faculty && (
                                        <div style={{ fontFamily: "'Playfair Display', sans-serif", fontSize: 12, color: T.textSoft }}>
                                            {profile.faculty}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Bio */}
                        {profile.bio && (
                            <p style={{
                                fontFamily: "'Playfair Display', serif",
                                fontStyle: 'italic',
                                fontSize: 15, color: T.textSoft,
                                lineHeight: 1.8, marginBottom: 20,
                            }}>
                                "{profile.bio}"
                            </p>
                        )}

                        {/* Interests */}
                        {profile.interests?.length > 0 && (
                            <div style={{ marginBottom: 24 }}>
                                <h4 style={{
                                    fontFamily: "'Playfair Display', sans-serif",
                                    fontSize: 11, fontWeight: 700,
                                    letterSpacing: '0.12em', textTransform: 'uppercase',
                                    color: T.textSoft, marginBottom: 12,
                                }}>
                                    Passions
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {profile.interests.map(i => (
                                        <span key={i} style={{
                                            padding: '6px 14px', borderRadius: 20,
                                            background: isDark ? 'rgba(212,175,55,0.10)' : 'rgba(212,175,55,0.12)',
                                            border: `1px solid ${T.gold}33`,
                                            color: T.gold,
                                            fontFamily: "'Playfair Display', sans-serif",
                                            fontSize: 12, fontWeight: 500,
                                        }}>
                      {i}
                    </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action bar */}
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        padding: '16px 20px 28px',
                        background: isDark
                            ? 'linear-gradient(0deg, #0F0810 70%, transparent)'
                            : 'linear-gradient(0deg, #FDF6F0 70%, transparent)',
                        display: 'flex', gap: 12,
                    }}>
                        <button onClick={onClose} style={{
                            flex: 1, padding: '16px',
                            borderRadius: 50,
                            border: `1.5px solid ${T.gold}44`,
                            background: 'none', color: T.textSoft,
                            fontFamily: "'Playfair Display', sans-serif",
                            fontSize: 14, cursor: 'pointer',
                        }}>
                            Passer
                        </button>
                        <motion.button
                            onClick={() => onLike(profile.id)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                flex: 2, padding: '16px',
                                borderRadius: 50,
                                background: `linear-gradient(135deg, ${T.rose}, ${T.roseLight})`,
                                color: '#fff', border: 'none',
                                fontFamily: "'Playfair Display', sans-serif",
                                fontSize: 14, fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: `0 8px 24px ${T.rose}44`,
                            }}
                        >
                            ❤ Liker
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPLORE TAB — Main export
// ══════════════════════════════════════════════════════════════════════════════
function ExploreTab() {
    const { T, isDark } = useTheme();

    const [categories, setCategories]   = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [profiles, setProfiles]       = useState([]);
    const [loading, setLoading]         = useState(true);
    const [loadingProfiles, setLoadingProfiles] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching]     = useState(false);
    const [viewProfile, setViewProfile] = useState(null);
    const [page, setPage]               = useState(1);
    const [ageRange, setAgeRange]       = useState([18, 35]);
    const [showAgeFilter, setShowAgeFilter] = useState(false);
    const [hasMore, setHasMore]         = useState(true);

    // Load categories
    useEffect(() => {
        exploreAPI.getCategories()
            .then(data => setCategories(data.categories || data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Load by category
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

    // Search
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
    const displayProfiles = filteredByAge(searchQuery.trim() ? searchResults : profiles);
    const isSearchMode    = searchQuery.trim().length > 0;

    return (
        <div style={{
            height: '100%', overflowY: 'auto',
            background: T.bg,
            padding: '20px 16px 100px',
        }}>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <h1 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 28, fontWeight: 700,
                    color: T.text, marginBottom: 4,
                }}>
                    Explorer
                </h1>
                <p style={{
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: 'italic',
                    fontSize: 14, color: T.textSoft,
                }}>
                    Trouve l'âme qui partage tes passions
                </p>
            </div>

            {/* Search */}
            <SearchBar value={searchQuery} onChange={setSearchQuery} T={T} isDark={isDark} />


            {/* Age filter bar */}
            <div style={{ marginBottom: 14 }}>
                <button
                    onClick={() => setShowAgeFilter(s => !s)}
                    style={{
                        display:'flex', alignItems:'center', gap:8,
                        background:'none', border:`1px solid ${T.gold}33`,
                        borderRadius:20, padding:'7px 14px', cursor:'pointer',
                        fontFamily:"'Playfair Display',sans-serif", fontSize:12, fontWeight:600,
                        color: T.gold,
                    }}
                >
                    🎂 {ageRange[0]}–{ageRange[1]} ans {showAgeFilter ? '▲' : '▼'}
                </button>
                {showAgeFilter && (
                    <div style={{
                        marginTop:10, padding:'16px',
                        background: isDark ? 'rgba(30,16,32,0.80)' : 'rgba(255,255,255,0.90)',
                        backdropFilter:'blur(12px)',
                        border:`1px solid ${T.gold}22`,
                        borderRadius:16,
                    }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                            <span style={{ fontFamily:"'Playfair Display',sans-serif", fontSize:12, color:T.textSoft }}>Âge minimum</span>
                            <span style={{ fontFamily:"'Playfair Display',sans-serif", fontSize:12, fontWeight:700, color:T.gold }}>{ageRange[0]} ans</span>
                        </div>
                        <input type="range" min={18} max={ageRange[1]-1} value={ageRange[0]}
                               onChange={e => setAgeRange([+e.target.value, ageRange[1]])}
                               style={{ width:'100%', accentColor:T.gold, marginBottom:16 }} />
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                            <span style={{ fontFamily:"'Playfair Display',sans-serif", fontSize:12, color:T.textSoft }}>Âge maximum</span>
                            <span style={{ fontFamily:"'Playfair Display',sans-serif", fontSize:12, fontWeight:700, color:T.gold }}>{ageRange[1]} ans</span>
                        </div>
                        <input type="range" min={ageRange[0]+1} max={45} value={ageRange[1]}
                               onChange={e => setAgeRange([ageRange[0], +e.target.value])}
                               style={{ width:'100%', accentColor:T.gold }} />
                    </div>
                )}
            </div>

            {/* Back button when in category */}
            {activeCategory && !isSearchMode && (
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => { setActiveCategory(null); setProfiles([]); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'none', border: 'none',
                        color: T.textSoft, cursor: 'pointer',
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 13, marginBottom: 16,
                        padding: 0,
                    }}
                >
                    ← Toutes les catégories
                </motion.button>
            )}

            {/* Categories grid */}
            {!activeCategory && !isSearchMode && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 14,
                        marginBottom: 32,
                    }}
                >
                    {loading
                        ? Array.from({ length: 8 }).map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{ opacity: [0.4, 0.8, 0.4] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                style={{
                                    aspectRatio: '1', borderRadius: 20,
                                    background: isDark ? '#2A1A2E' : '#F0EAD6',
                                }}
                            />
                        ))
                        : categories.map(cat => (
                            <CategoryCard
                                key={cat.id}
                                category={cat}
                                onClick={loadCategory}
                                T={T}
                                isDark={isDark}
                            />
                        ))
                    }
                </motion.div>
            )}

            {/* Category header */}
            {activeCategory && !isSearchMode && (
                <div style={{ marginBottom: 20 }}>
                    <h2 style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 22, fontWeight: 700, color: T.text,
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        {(CATEGORY_STYLES[activeCategory.slug] || CATEGORY_STYLES.default).emoji}
                        {activeCategory.name}
                    </h2>
                    <p style={{
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 12, color: T.textSoft,
                        marginTop: 4,
                    }}>
                        {activeCategory.count || profiles.length} étudiant{(activeCategory.count || 0) !== 1 ? 's' : ''} dans cette catégorie
                    </p>
                </div>
            )}

            {/* Search results header */}
            {isSearchMode && (
                <div style={{ marginBottom: 16 }}>
                    <p style={{
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 13, color: T.textSoft,
                    }}>
                        {searching ? 'Recherche en cours...'
                            : `${searchResults.length} résultat${searchResults.length !== 1 ? 's' : ''} pour "${searchQuery}"`}
                    </p>
                </div>
            )}

            {/* Profiles grid */}
            {(activeCategory || isSearchMode) && (
                <>
                    {loadingProfiles && profiles.length === 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <motion.div key={i}
                                            animate={{ opacity: [0.4, 0.8, 0.4] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                            style={{
                                                aspectRatio: '3/4', borderRadius: 20,
                                                background: isDark ? '#2A1A2E' : '#F0EAD6',
                                            }}
                                />
                            ))}
                        </div>
                    ) : displayProfiles.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                            <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
                            <p style={{
                                fontFamily: "'Playfair Display', serif",
                                fontStyle: 'italic', fontSize: 16,
                                color: T.textSoft,
                            }}>
                                Aucun profil trouvé pour le moment
                            </p>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                                <AnimatePresence>
                                    {displayProfiles.map((profile, i) => (
                                        <motion.div
                                            key={profile.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <ProfileGridItem
                                                profile={profile}
                                                onLike={(id) => discoverAPI.swipe(id, 'like')}
                                                onView={setViewProfile}
                                                T={T}
                                                isDark={isDark}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {hasMore && !isSearchMode && (
                                <div style={{ textAlign: 'center', marginTop: 24 }}>
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => loadCategory(activeCategory, page + 1)}
                                        disabled={loadingProfiles}
                                        style={{
                                            padding: '14px 32px', borderRadius: 50,
                                            border: `1.5px solid ${T.gold}44`,
                                            background: 'none', color: T.gold,
                                            fontFamily: "'Playfair Display', sans-serif",
                                            fontSize: 13, fontWeight: 600,
                                            cursor: loadingProfiles ? 'wait' : 'pointer',
                                        }}
                                    >
                                        {loadingProfiles ? 'Chargement...' : 'Voir plus'}
                                    </motion.button>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Profile detail sheet */}
            {viewProfile && (
                <ProfileSheet
                    profile={viewProfile}
                    onClose={() => setViewProfile(null)}
                    onLike={async (id) => {
                        await discoverAPI.swipe(id, 'like');
                        setViewProfile(null);
                    }}
                    T={T}
                    isDark={isDark}
                />
            )}
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
// LIKESTAB
// ══════════════════════════════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════════════
   LoveLine — Likes Tab (Coups de Cœur)
   See who liked you + AI Top Picks
   ═══════════════════════════════════════════════════════════════ */

// ─── Blurred card (non-premium) ───────────────────────────────────────────────
function BlurredCard({ T, isDark, index }) {
    return (
        <div style={{
            borderRadius: 20, overflow: 'hidden',
            position: 'relative', aspectRatio: '3/4',
            boxShadow: T.shadowCard,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.80)'}`,
        }}>
            {/* Placeholder gradient */}
            <div style={{
                width: '100%', height: '100%',
                background: index % 3 === 0
                    ? `linear-gradient(135deg, ${T.rose}55, ${T.roseSoft})`
                    : index % 3 === 1
                        ? `linear-gradient(135deg, ${T.gold}44, ${T.beige})`
                        : `linear-gradient(135deg, ${T.lavender}, ${T.lavenderSoft})`,
                filter: 'blur(12px)',
                transform: 'scale(1.1)',
            }} />

            {/* Silhouette */}
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <svg width="60" height="80" viewBox="0 0 60 80" fill="none" opacity="0.3">
                    <circle cx="30" cy="22" r="16" fill={T.text} />
                    <path d="M4 72c0-14.4 11.6-26 26-26s26 11.6 26 26" fill={T.text} />
                </svg>
            </div>

            {/* Lock overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <div style={{
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 14,
                    padding: '8px 14px',
                    display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="2" y="6" width="10" height="8" rx="2" fill="rgba(255,255,255,0.8)" />
                        <path d="M4 6V4.5a3 3 0 0 1 6 0V6" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
                    </svg>
                    <span style={{
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 11, fontWeight: 700, color: '#fff',
                    }}>
            Gold
          </span>
                </div>
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
                src={profile.photos?.[0]?.url || profile.avatar}
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
                src={profile.photos?.[0]?.url || profile.avatar}
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
            background: T.bg, padding: '20px 16px 100px',
        }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 28, fontWeight: 700, color: T.text,
                    marginBottom: 4,
                }}>
                    Coups de cœur
                </h1>
                <p style={{
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: 'italic', fontSize: 14, color: T.textSoft,
                }}>
                    L'admiration qui vous précède
                </p>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex', gap: 8, marginBottom: 24,
                background: isDark ? 'rgba(30,16,32,0.60)' : 'rgba(240,234,214,0.60)',
                borderRadius: 16, padding: 4,
            }}>
                {[
                    { id: 'likes', label: `${isPremium ? likeCount : '?'} Likes` },
                    { id: 'picks', label: 'Top Picks IA' },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{
                        flex: 1, padding: '10px',
                        borderRadius: 12,
                        border: 'none',
                        background: activeSection === tab.id
                            ? (isDark ? '#2D1020' : '#fff')
                            : 'transparent',
                        color: activeSection === tab.id ? T.gold : T.textSoft,
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 13, fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: activeSection === tab.id ? T.shadowCard : 'none',
                        transition: 'all 0.25s',
                    }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ─── LIKES section ─── */}
            {activeSection === 'likes' && (
                <div>
                    {!isPremium && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => setShowPremium(true)}
                            style={{
                                background: `linear-gradient(135deg, ${T.gold}18, ${T.rose}12)`,
                                border: `1.5px solid ${T.gold}44`,
                                borderRadius: 20,
                                padding: '20px',
                                marginBottom: 24,
                                cursor: 'pointer',
                                display: 'flex', gap: 16, alignItems: 'center',
                            }}
                        >
                            <div style={{ fontSize: 36 }}>💎</div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontFamily: "'Playfair Display', serif",
                                    fontSize: 17, fontWeight: 700, color: T.text,
                                    marginBottom: 4,
                                }}>
                                    {likeCount} personnes ont liké votre profil
                                </div>
                                <p style={{
                                    fontFamily: "'Playfair Display', sans-serif",
                                    fontSize: 13, color: T.textSoft, lineHeight: 1.5,
                                }}>
                                    Passez à Gold pour révéler toutes ces âmes qui vous attendent
                                </p>
                            </div>
                            <div style={{
                                background: `linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
                                color: '#1A0812', borderRadius: 50,
                                padding: '8px 16px',
                                fontFamily: "'Playfair Display', sans-serif",
                                fontSize: 12, fontWeight: 700,
                                whiteSpace: 'nowrap',
                            }}>
                                Voir tout
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
            {activeSection === 'picks' && (
                <div>
                    {/* Refresh countdown */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: 20,
                        padding: '14px 16px',
                        background: isDark ? 'rgba(30,16,32,0.60)' : 'rgba(255,255,255,0.70)',
                        borderRadius: 16,
                        border: `1px solid ${T.gold}22`,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>✦</span>
                            <div>
                                <div style={{ fontFamily: "'Playfair Display', sans-serif", fontSize: 12, fontWeight: 700, color: T.text }}>
                                    Sélection IA du jour
                                </div>
                                <div style={{ fontFamily: "'Playfair Display', sans-serif", fontSize: 11, color: T.textSoft }}>
                                    Renouvellement dans
                                </div>
                            </div>
                        </div>
                        <div style={{
                            fontFamily: "'Playfair Display', sans-serif",
                            fontSize: 16, fontWeight: 700,
                            color: T.gold,
                        }}>
                            <PicksCountdown />
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <motion.div key={i}
                                            animate={{ opacity: [0.4, 0.8, 0.4] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                            style={{ width: 160, height: 200, borderRadius: 20, flexShrink: 0, background: isDark ? '#2A1A2E' : '#F0EAD6' }}
                                />
                            ))}
                        </div>
                    ) : topPicks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                            <div style={{ fontSize: 40, marginBottom: 16 }}>🔮</div>
                            <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 16, color: T.textSoft }}>
                                L'IA affine ses suggestions pour vous
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Horizontal scroll */}
                            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, marginBottom: 24 }}>
                                {topPicks.map(profile => (
                                    <TopPickCard key={profile.id} profile={profile}
                                                 onLike={(id) => discoverAPI.swipe(id, 'like')}
                                                 T={T} isDark={isDark}
                                    />
                                ))}
                            </div>

                            {/* Full list */}
                            <h3 style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: 18, fontWeight: 700, color: T.text,
                                marginBottom: 16,
                            }}>
                                Tous vos Top Picks
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                                {topPicks.map((profile, i) => (
                                    <motion.div key={profile.id}
                                                initial={{ opacity: 0, y: 16 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.06 }}
                                    >
                                        <LikeCard
                                            profile={profile}
                                            onLikeBack={(id) => {}}
                                            onNope={() => {}}
                                            T={T}
                                            isDark={isDark}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Premium modal */}
            {showPremium && (
                <PremiumModal
                    feature="likes"
                    onClose={() => setShowPremium(false)}
                    onSubscribe={(planId) => setShowPremium(false)}
                />
            )}
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
// CHATVIEW
// ══════════════════════════════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════════════
   LoveLine — Chat View
   Real-time conversation with WebSocket + voice messages
   ═══════════════════════════════════════════════════════════════ */

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message, isMe, showAvatar, avatar, T, isDark }) {
    const isVoice = message.type === 'voice';
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (playing) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setPlaying(!playing);
    };

    // Format time
    const time = new Date(message.created_at).toLocaleTimeString('fr-FR', {
        hour: '2-digit', minute: '2-digit',
    });

    const formatDuration = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${String(sec).padStart(2, '0')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
                display: 'flex',
                flexDirection: isMe ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                gap: 8,
                marginBottom: 4,
                paddingLeft: isMe ? 40 : 0,
                paddingRight: isMe ? 0 : 40,
            }}
        >
            {/* Avatar */}
            {!isMe && (
                <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    overflow: 'hidden', flexShrink: 0,
                    opacity: showAvatar ? 1 : 0,
                    border: `1.5px solid ${T.gold}44`,
                }}>
                    <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 2 }}>
                {/* Bubble */}
                {isVoice ? (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 16px', borderRadius: 20,
                        borderBottomRightRadius: isMe ? 6 : 20,
                        borderBottomLeftRadius: isMe ? 20 : 6,
                        background: isMe
                            ? `linear-gradient(135deg, ${T.rose}, ${T.roseLight})`
                            : isDark ? 'rgba(45,16,32,0.90)' : 'rgba(255,255,255,0.95)',
                        boxShadow: isMe ? `0 4px 16px ${T.rose}44` : T.shadowCard,
                        minWidth: 160,
                    }}>
                        {message.audio_url && (
                            <audio ref={audioRef} src={message.audio_url}
                                   onEnded={() => setPlaying(false)} style={{ display: 'none' }} />
                        )}
                        <button onClick={togglePlay} style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: isMe ? 'rgba(255,255,255,0.25)' : `${T.gold}22`,
                            border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isMe ? '#fff' : T.gold,
                            flexShrink: 0,
                        }}>
                            {playing ? (
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                    <rect x="2" y="1" width="3" height="10" rx="1" />
                                    <rect x="7" y="1" width="3" height="10" rx="1" />
                                </svg>
                            ) : (
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                    <path d="M3 1.5l8 4.5-8 4.5V1.5z" />
                                </svg>
                            )}
                        </button>
                        {/* Waveform visualization */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                            {Array.from({ length: 18 }).map((_, i) => (
                                <div key={i} style={{
                                    width: 2, borderRadius: 1,
                                    height: 4 + Math.sin(i * 0.8) * 8 + Math.random() * 6,
                                    background: isMe ? 'rgba(255,255,255,0.70)' : `${T.gold}88`,
                                    transition: 'height 0.1s',
                                    animation: playing ? `pulse-${i % 3} 0.5s infinite` : 'none',
                                }} />
                            ))}
                        </div>
                        <span style={{
                            fontFamily: "'Playfair Display', sans-serif",
                            fontSize: 11, color: isMe ? 'rgba(255,255,255,0.80)' : T.textSoft,
                            flexShrink: 0,
                        }}>
              {formatDuration(message.duration || 0)}
            </span>
                    </div>
                ) : (
                    <div style={{
                        padding: '10px 16px',
                        borderRadius: 20,
                        borderBottomRightRadius: isMe ? 6 : 20,
                        borderBottomLeftRadius: isMe ? 20 : 6,
                        background: isMe
                            ? `linear-gradient(135deg, ${T.rose}, ${T.roseLight})`
                            : isDark ? 'rgba(45,16,32,0.90)' : 'rgba(255,255,255,0.95)',
                        boxShadow: isMe ? `0 4px 16px ${T.rose}44` : T.shadowCard,
                        maxWidth: '100%',
                    }}>
                        <p style={{
                            fontFamily: "'Playfair Display', sans-serif",
                            fontSize: 14, lineHeight: 1.6,
                            color: isMe ? '#fff' : T.text,
                            margin: 0, wordBreak: 'break-word',
                        }}>
                            {message.content}
                        </p>
                    </div>
                )}

                {/* Meta */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                }}>
          <span style={{
              fontFamily: "'Playfair Display', sans-serif",
              fontSize: 10, color: T.textMuted,
          }}>
            {time}
          </span>
                    {isMe && (
                        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                            {message.is_read ? (
                                <>
                                    <path d="M1 5l3 3 6-6" stroke={T.gold} strokeWidth="1.3" strokeLinecap="round" />
                                    <path d="M5 5l3 3 6-6" stroke={T.gold} strokeWidth="1.3" strokeLinecap="round" />
                                </>
                            ) : (
                                <path d="M1 5l3 3 6-6" stroke={T.textMuted} strokeWidth="1.3" strokeLinecap="round" />
                            )}
                        </svg>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ─── Date separator ───────────────────────────────────────────────────────────
function DateSeparator({ date, T, isDark }) {
    const label = (() => {
        const d = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
        if (d.toDateString() === yesterday.toDateString()) return 'Hier';
        return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    })();

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '16px 0 8px',
        }}>
            <div style={{ flex: 1, height: 1, background: `${T.gold}22` }} />
            <span style={{
                fontFamily: "'Playfair Display', sans-serif",
                fontSize: 11, color: T.textMuted,
                whiteSpace: 'nowrap',
                padding: '3px 10px',
                background: (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'rgba(30,16,32,0.6)' : 'rgba(240,234,214,0.6)',
                borderRadius: 20,
            }}>
        {label}
      </span>
            <div style={{ flex: 1, height: 1, background: `${T.gold}22` }} />
        </div>
    );
}


// ─── Voice recorder ───────────────────────────────────────────────────────────
function VoiceRecorder({ onSend, onCancel, T }) {
    const [duration, setDuration]   = useState(0);
    const [recording, setRecording] = useState(false);
    const mediaRecorder = useRef(null);
    const chunks        = useRef([]);
    const timer         = useRef(null);

    useEffect(() => {
        startRecording();
        return () => {
            if (timer.current) clearInterval(timer.current);
            if (mediaRecorder.current?.state === 'recording') {
                mediaRecorder.current.stop();
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            chunks.current = [];
            mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data);
            mediaRecorder.current.onstop = () => {
                const blob = new Blob(chunks.current, { type: 'audio/webm' });
                stream.getTracks().forEach(t => t.stop());
                onSend(blob, duration);
            };
            mediaRecorder.current.start();
            setRecording(true);
            timer.current = setInterval(() => setDuration(d => d + 1), 1000);
        } catch (e) {
            onCancel();
        }
    };

    const stopAndSend = () => {
        clearInterval(timer.current);
        setRecording(false);
        mediaRecorder.current?.stop();
    };

    const cancel = () => {
        clearInterval(timer.current);
        if (mediaRecorder.current?.state === 'recording') {
            mediaRecorder.current.stop();
        }
        onCancel();
    };

    const m = Math.floor(duration / 60);
    const s = duration % 60;

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: `${T.rose}18`,
            border: `1px solid ${T.rose}33`,
            borderRadius: 28, padding: '8px 16px',
            flex: 1,
        }}>
            {/* Pulsing mic */}
            <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: T.rose,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
                    <rect x="4" y="1" width="6" height="10" rx="3" fill="#fff" />
                    <path d="M1 8c0 3.3 2.7 6 6 6s6-2.7 6-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M7 14v3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </motion.div>

            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: T.rose, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>
        {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </span>

            {/* Waveform */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                {Array.from({ length: 24 }).map((_, i) => (
                    <motion.div key={i}
                                animate={{ height: [4, 4 + Math.random() * 16, 4] }}
                                transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.04 }}
                                style={{ width: 2, background: `${T.rose}88`, borderRadius: 1 }}
                    />
                ))}
            </div>

            {/* Cancel */}
            <button onClick={cancel} style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(0,0,0,0.15)', border: 'none',
                color: T.textSoft, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                ✕
            </button>

            {/* Send */}
            <motion.button
                onClick={stopAndSend}
                whileTap={{ scale: 0.9 }}
                style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: T.rose, border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: `0 4px 16px ${T.rose}44`,
                }}
            >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M2 16L16 9 2 2v5l9 2-9 2v5z" fill="#fff" />
                </svg>
            </motion.button>
        </div>
    );
}

// ─── Input bar ────────────────────────────────────────────────────────────────
function MessageInput({ onSend, onVoice, T, isDark }) {
    const [text, setText]           = useState('');
    const [recording, setRecording] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const textRef = useRef(null);

    const QUICK_EMOJIS = ['❤️', '😍', '😂', '🙈', '🔥', '✨', '💕', '😊'];

    const handleSend = () => {
        if (!text.trim()) return;
        onSend(text.trim());
        setText('');
        textRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleVoiceSend = async (blob, duration) => {
        setRecording(false);
        const fd = new FormData();
        fd.append('audio', blob, 'voice.webm');
        fd.append('duration', duration);
        await onVoice(fd);
    };

    if (recording) {
        return (
            <div style={{ padding: '8px 16px 16px', display: 'flex' }}>
                <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setRecording(false)} T={T} />
            </div>
        );
    }

    return (
        <div style={{ padding: '8px 16px 16px' }}>
            {/* Quick emojis */}
            <AnimatePresence>
                {showEmoji && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 10, height: 0 }}
                        style={{
                            display: 'flex', gap: 8, marginBottom: 8,
                            overflowX: 'auto', paddingBottom: 4,
                        }}
                    >
                        {QUICK_EMOJIS.map(e => (
                            <button key={e} onClick={() => setText(t => t + e)} style={{
                                fontSize: 22, background: 'none', border: 'none',
                                cursor: 'pointer', flexShrink: 0,
                            }}>
                                {e}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 10,
            }}>
                {/* Emoji toggle */}
                <button onClick={() => setShowEmoji(e => !e)} style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: showEmoji ? `${T.gold}22` : 'none',
                    border: `1px solid ${T.gold}33`,
                    color: T.gold, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: 18,
                    transition: 'background 0.25s',
                }}>
                    😊
                </button>

                {/* Text area */}
                <div style={{
                    flex: 1, position: 'relative',
                    background: isDark ? 'rgba(45,16,32,0.80)' : 'rgba(255,255,255,0.90)',
                    borderRadius: 24,
                    border: `1px solid ${T.gold}33`,
                    backdropFilter: 'blur(12px)',
                    display: 'flex', alignItems: 'flex-end',
                }}>
          <textarea
              ref={textRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Un message doux..."
              rows={1}
              style={{
                  flex: 1, padding: '12px 16px',
                  background: 'none', border: 'none', outline: 'none',
                  fontFamily: "'Playfair Display', sans-serif",
                  fontSize: 14, color: T.text,
                  resize: 'none', maxHeight: 120,
                  lineHeight: 1.5,
              }}
          />
                </div>

                {/* Voice / Send */}
                {text.trim() ? (
                    <motion.button
                        onClick={handleSend}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        style={{
                            width: 46, height: 46, borderRadius: '50%',
                            background: `linear-gradient(135deg, ${T.rose}, ${T.roseLight})`,
                            border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', flexShrink: 0,
                            boxShadow: `0 4px 16px ${T.rose}44`,
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M2 16L16 9 2 2v5l9 2-9 2v5z" fill="#fff" />
                        </svg>
                    </motion.button>
                ) : (
                    <motion.button
                        onMouseDown={() => setRecording(true)}
                        whileTap={{ scale: 0.92 }}
                        style={{
                            width: 46, height: 46, borderRadius: '50%',
                            background: isDark ? 'rgba(45,16,32,0.80)' : 'rgba(255,255,255,0.90)',
                            border: `1px solid ${T.gold}44`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', flexShrink: 0,
                            color: T.textSoft,
                        }}
                    >
                        <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                            <rect x="5" y="1" width="6" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                            <path d="M1 10c0 3.9 3.1 7 7 7s7-3.1 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            <path d="M8 17v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </motion.button>
                )}
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// CHAT VIEW — Main export
// ══════════════════════════════════════════════════════════════════════════════
function ChatView({ match, onBack, isPremium, onShowPremium }) {
    const { T, isDark } = useTheme();

    const [messages, setMessages]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [page, setPage]           = useState(1);
    const [hasMore, setHasMore]     = useState(true);
    const [typing, setTyping]       = useState(false);
    const [isOnline, setIsOnline]   = useState(match?.is_online || false);
    const [showOptions, setShowOptions] = useState(false);

    const socketRef   = useRef(null);
    const messagesEnd = useRef(null);
    const typingTimer = useRef(null);
    const loadingRef  = useRef(false);

    // Load messages
    const loadMessages = useCallback(async (p = 1) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        try {
            const data = await messagesAPI.getMessages(match.id, p);
            const newMsgs = (data.messages || data.results || []).reverse();
            if (p === 1) {
                setMessages(newMsgs);
                messagesAPI.markAsRead(match.id).catch(() => {});
            } else {
                setMessages(prev => [...newMsgs, ...prev]);
            }
            setHasMore(!!data.previous || newMsgs.length === 30);
            setPage(p);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [match.id]);

    useEffect(() => { loadMessages(1); }, [loadMessages]);

    // Scroll to bottom on new message
    useEffect(() => {
        if (page === 1) {
            messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, page]);

    // WebSocket
    useEffect(() => {
        socketRef.current = new ChatSocket(
            match.id,
            (data) => {
                if (data.type === 'message') {
                    setMessages(prev => [...prev, data.message]);
                    setTyping(false);
                } else if (data.type === 'typing') {
                    setTyping(true);
                    clearTimeout(typingTimer.current);
                    typingTimer.current = setTimeout(() => setTyping(false), 3000);
                } else if (data.type === 'read') {
                    setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
                } else if (data.type === 'online_status') {
                    setIsOnline(data.is_online);
                }
            },
            () => {}
        );
        return () => socketRef.current?.close();
    }, [match.id]);

    // Send text message
    const handleSend = async (content) => {
        const tempMsg = {
            id: `temp-${Date.now()}`,
            content, type: 'text',
            is_me: true, is_read: false,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            const sent = await messagesAPI.sendMessage(match.id, content);
            setMessages(prev => prev.map(m => m.id === tempMsg.id ? sent : m));
        } catch (e) {
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        }
    };

    // Send voice message
    const handleVoice = async (formData) => {
        if (!isPremium) { onShowPremium?.('video_call'); return; }
        try {
            const sent = await messagesAPI.sendVoiceMessage(match.id, formData);
            setMessages(prev => [...prev, sent]);
        } catch (e) {
            console.error(e);
        }
    };

    // Typing indicator emit
    const handleTyping = () => {
        socketRef.current?.send({ type: 'typing' });
    };

    // Group messages by date
    const grouped = [];
    let lastDate = null;
    messages.forEach((msg, i) => {
        const msgDate = new Date(msg.created_at).toDateString();
        if (msgDate !== lastDate) {
            grouped.push({ type: 'separator', date: msg.created_at });
            lastDate = msgDate;
        }
        const prev = messages[i - 1];
        const showAvatar = !msg.is_me && (!prev || prev.is_me || new Date(msg.created_at) - new Date(prev.created_at) > 120000);
        grouped.push({ type: 'message', msg, showAvatar });
    });

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            height: '100%',
            background: isDark
                ? 'linear-gradient(180deg, #0F0810 0%, #160B18 100%)'
                : 'linear-gradient(180deg, #FDF6F0 0%, #F5EDE5 100%)',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 16px',
                background: isDark ? 'rgba(15,8,16,0.90)' : 'rgba(253,246,240,0.90)',
                backdropFilter: 'blur(20px)',
                borderBottom: `1px solid ${T.gold}22`,
                flexShrink: 0,
            }}>
                {/* Back */}
                <button onClick={onBack} style={{
                    background: 'none', border: 'none',
                    cursor: 'pointer', padding: 4,
                    color: T.textSoft,
                }}>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <path d="M14 4l-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                </button>

                {/* Avatar */}
                <div style={{ position: 'relative' }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        overflow: 'hidden',
                        border: `2px solid ${T.gold}55`,
                    }}>
                        <img
                            src={match.their_avatar || match.avatar}
                            alt={match.their_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                    {/* Online dot */}
                    <div style={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: 12, height: 12, borderRadius: '50%',
                        background: isOnline ? '#4CAF50' : T.textMuted + '66',
                        border: `2px solid ${isDark ? '#0F0810' : '#FDF6F0'}`,
                    }} />
                </div>

                {/* Name & status */}
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 17, fontWeight: 700, color: T.text,
                    }}>
                        {match.their_name || match.name}
                    </div>
                    <div style={{
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 11, color: isOnline ? '#4CAF50' : T.textMuted,
                    }}>
                        {typing ? (
                            <span style={{ fontStyle: 'italic' }}>est en train d'écrire...</span>
                        ) : isOnline ? 'En ligne maintenant' : 'Hors ligne'}
                    </div>
                </div>

                {/* Options */}
                <div style={{ position: 'relative' }}>
                    <button onClick={() => setShowOptions(o => !o)} style={{
                        background: 'none', border: 'none',
                        cursor: 'pointer', padding: 4, color: T.textSoft,
                    }}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="4" r="1.5" fill="currentColor" />
                            <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                            <circle cx="10" cy="16" r="1.5" fill="currentColor" />
                        </svg>
                    </button>

                    <AnimatePresence>
                        {showOptions && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: -8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                style={{
                                    position: 'absolute', right: 0, top: 32,
                                    background: isDark ? 'rgba(30,16,32,0.96)' : 'rgba(253,246,240,0.98)',
                                    backdropFilter: 'blur(16px)',
                                    border: `1px solid ${T.gold}22`,
                                    borderRadius: 16, overflow: 'hidden',
                                    boxShadow: T.shadowDeep, zIndex: 100, width: 200,
                                }}
                            >
                                {[
                                    { icon: '🚫', label: 'Bloquer', action: () => {} },
                                    { icon: '⚠️', label: 'Signaler', action: () => {} },
                                    { icon: '💔', label: 'Dématcher', action: () => messagesAPI.unmatch(match.id) },
                                    { icon: '🗑️', label: 'Supprimer la conv.', action: () => messagesAPI.deleteConversation(match.id) },
                                ].map(opt => (
                                    <button key={opt.label} onClick={() => { opt.action(); setShowOptions(false); }} style={{
                                        width: '100%', padding: '12px 16px',
                                        background: 'none', border: 'none',
                                        display: 'flex', gap: 10, alignItems: 'center',
                                        fontFamily: "'Playfair Display', sans-serif",
                                        fontSize: 14, color: opt.label === 'Dématcher' ? T.rose : T.text,
                                        cursor: 'pointer', textAlign: 'left',
                                        borderBottom: `1px solid ${T.gold}11`,
                                        transition: 'background 0.2s',
                                    }}
                                            onMouseEnter={e => e.currentTarget.style.background = `${T.gold}11`}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    >
                                        <span>{opt.icon}</span>
                                        {opt.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1, overflowY: 'auto',
                padding: '12px 16px',
                display: 'flex', flexDirection: 'column',
            }}>
                {/* Load more */}
                {hasMore && !loading && (
                    <button onClick={() => loadMessages(page + 1)} style={{
                        alignSelf: 'center',
                        background: 'none',
                        border: `1px solid ${T.gold}33`,
                        color: T.textSoft,
                        padding: '6px 16px', borderRadius: 20,
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 11, cursor: 'pointer', marginBottom: 8,
                    }}>
                        Voir les messages précédents
                    </button>
                )}

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                            style={{ width: 32, height: 32, borderRadius: '50%', border: `2.5px solid ${T.gold}22`, borderTopColor: T.gold }}
                        />
                    </div>
                ) : (
                    grouped.map((item, i) => (
                        item.type === 'separator'
                            ? <DateSeparator key={`sep-${i}`} date={item.date} T={T} isDark={isDark} />
                            : <MessageBubble
                                key={item.msg.id}
                                message={item.msg}
                                isMe={item.msg.is_me}
                                showAvatar={item.showAvatar}
                                avatar={match.their_avatar || match.avatar}
                                T={T}
                                isDark={isDark}
                            />
                    ))
                )}

                {/* Typing indicator */}
                <AnimatePresence>
                    {typing && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                marginBottom: 8,
                            }}
                        >
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                overflow: 'hidden', border: `1.5px solid ${T.gold}44`,
                            }}>
                                <img src={match.their_avatar || match.avatar} alt=""
                                     style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{
                                background: isDark ? 'rgba(45,16,32,0.90)' : 'rgba(255,255,255,0.95)',
                                borderRadius: '16px 16px 16px 4px',
                                padding: '10px 16px',
                                display: 'flex', gap: 4, alignItems: 'center',
                            }}>
                                {[0, 1, 2].map(i => (
                                    <motion.div key={i}
                                                animate={{ y: [0, -4, 0] }}
                                                transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                                                style={{ width: 6, height: 6, borderRadius: '50%', background: T.textMuted }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={messagesEnd} />
            </div>

            {/* Input */}
            <div style={{
                background: isDark ? 'rgba(15,8,16,0.90)' : 'rgba(253,246,240,0.90)',
                backdropFilter: 'blur(20px)',
                borderTop: `1px solid ${T.gold}22`,
                flexShrink: 0,
            }}>
                <MessageInput onSend={handleSend} onVoice={handleVoice} T={T} isDark={isDark} />
            </div>
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
// MESSAGESTAB
// ══════════════════════════════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════════════
   LoveLine — Messages Tab
   Matches ring + conversations list
   ═══════════════════════════════════════════════════════════════ */

// ─── Match bubble (new match, not yet messaged) ───────────────────────────────
function MatchBubble({ match, isNew, onClick, T }) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.93 }}
            onClick={onClick}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}
        >
            <div style={{ position: 'relative' }}>
                {/* Gold ring */}
                <div style={{
                    width: 66, height: 66, borderRadius: '50%',
                    padding: 2.5,
                    background: isNew
                        ? `conic-gradient(${T.gold}, #fff, ${T.gold})`
                        : `${T.gold}44`,
                    animation: isNew ? 'spin-slow 4s linear infinite' : 'none',
                }}>
                    <div style={{
                        width: '100%', height: '100%', borderRadius: '50%',
                        overflow: 'hidden',
                        border: `2px solid ${T.bg}`,
                    }}>
                        <img src={match.their_avatar || match.avatar}
                             alt={match.their_name || match.name}
                             style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                </div>

                {/* Online dot */}
                {match.is_online && (
                    <div style={{
                        position: 'absolute', bottom: 2, right: 2,
                        width: 13, height: 13, borderRadius: '50%',
                        background: '#4CAF50',
                        border: `2px solid ${T.bg}`,
                    }} />
                )}

                {/* New badge */}
                {isNew && (
                    <div style={{
                        position: 'absolute', top: -3, right: -3,
                        background: T.rose, color: '#fff',
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 8, fontWeight: 800,
                        padding: '2px 5px', borderRadius: 6,
                        border: `1.5px solid ${T.bg}`,
                        letterSpacing: '0.05em',
                    }}>
                        NEW
                    </div>
                )}
            </div>

            <span style={{
                fontFamily: "'Playfair Display', sans-serif",
                fontSize: 11, fontWeight: 500,
                color: T.textSoft, maxWidth: 64,
                textAlign: 'center', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
        {match.their_name || match.name}
      </span>
        </motion.div>
    );
}

// ─── Conversation row ─────────────────────────────────────────────────────────
function ConversationRow({ conversation, onClick, T, isDark }) {
    const hasUnread = conversation.unread_count > 0;
    const lastMsg   = conversation.last_message;

    const timeStr = (() => {
        if (!lastMsg) return '';
        const d = new Date(lastMsg.created_at);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return 'maintenant';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        if (diff < 604800000) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    })();

    return (
        <motion.div
            whileHover={{ backgroundColor: isDark ? 'rgba(45,16,32,0.60)' : 'rgba(240,234,214,0.60)' }}
            whileTap={{ scale: 0.99 }}
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px',
                borderRadius: 20, cursor: 'pointer',
                transition: 'background 0.2s',
            }}
        >
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    overflow: 'hidden',
                    border: `2px solid ${hasUnread ? T.gold : T.gold + '33'}`,
                    boxShadow: hasUnread ? `0 0 12px ${T.gold}44` : 'none',
                    transition: 'all 0.3s',
                }}>
                    <img
                        src={conversation.their_avatar || conversation.avatar}
                        alt={conversation.their_name || conversation.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
                {conversation.is_online && (
                    <div style={{
                        position: 'absolute', bottom: 1, right: 1,
                        width: 12, height: 12, borderRadius: '50%',
                        background: '#4CAF50',
                        border: `2px solid ${isDark ? '#0F0810' : '#FDF6F0'}`,
                    }} />
                )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'baseline', marginBottom: 3,
                }}>
          <span style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 16, fontWeight: hasUnread ? 700 : 500,
              color: hasUnread ? T.text : T.textMid,
          }}>
            {conversation.their_name || conversation.name}
          </span>
                    <span style={{
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 11,
                        color: hasUnread ? T.gold : T.textMuted,
                        fontWeight: hasUnread ? 600 : 400,
                        flexShrink: 0, marginLeft: 8,
                    }}>
            {timeStr}
          </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 13,
                        color: hasUnread ? T.textSoft : T.textMuted,
                        fontWeight: hasUnread ? 500 : 400,
                        margin: 0, whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        flex: 1,
                    }}>
                        {lastMsg?.is_me && '→ '}
                        {lastMsg?.type === 'voice' ? '🎤 Message vocal' : (lastMsg?.content || "Dites bonjour 👋")}
                    </p>

                    {hasUnread && (
                        <div style={{
                            background: T.rose, color: '#fff',
                            borderRadius: 10,
                            minWidth: 20, height: 20,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: "'Playfair Display', sans-serif",
                            fontSize: 10, fontWeight: 800,
                            padding: '0 5px', marginLeft: 8, flexShrink: 0,
                        }}>
                            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ─── Free plan gate ────────────────────────────────────────────────────────────
function FreeGate({ matchCount, T, isDark, onUpgrade }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onUpgrade}
            style={{
                margin: '16px 16px 0',
                background: `linear-gradient(135deg, ${T.gold}18, ${T.rose}10)`,
                border: `1.5px solid ${T.gold}44`,
                borderRadius: 20, padding: 20,
                cursor: 'pointer',
                display: 'flex', gap: 14, alignItems: 'center',
            }}
        >
            <div style={{ fontSize: 32 }}>⏳</div>
            <div style={{ flex: 1 }}>
                <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4,
                }}>
                    24h pour briser la glace
                </div>
                <p style={{
                    fontFamily: "'Playfair Display', sans-serif",
                    fontSize: 12, color: T.textSoft, lineHeight: 1.5, margin: 0,
                }}>
                    Avec Gold, échangez sans limite de temps. Ne laissez pas vos matches disparaître.
                </p>
            </div>
            <div style={{
                background: `linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
                color: '#1A0812', borderRadius: 50,
                padding: '8px 14px',
                fontFamily: "'Playfair Display', sans-serif",
                fontSize: 11, fontWeight: 700,
                flexShrink: 0,
            }}>
                Gold
            </div>
        </motion.div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// MESSAGES TAB — Main export
// ══════════════════════════════════════════════════════════════════════════════
function MessagesTab({ isPremium, initialMatchId }) {
    const { T, isDark } = useTheme();

    const [matches, setMatches]               = useState([]);
    const [conversations, setConversations]   = useState([]);
    const [loading, setLoading]               = useState(true);
    const [activeChat, setActiveChat]         = useState(null);
    const [showPremium, setShowPremium]       = useState(false);
    const [search, setSearch]                 = useState('');
    const notifSocket = useRef(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [matchData, convData] = await Promise.all([
                messagesAPI.getMatches(),
                messagesAPI.getConversations(),
            ]);
            setMatches(matchData.matches || matchData || []);
            setConversations(convData.conversations || convData || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // Open initial chat if passed
    useEffect(() => {
        if (initialMatchId && !loading) {
            const conv = conversations.find(c => c.id === initialMatchId)
                || matches.find(m => m.id === initialMatchId);
            if (conv) setActiveChat(conv);
        }
    }, [initialMatchId, loading, conversations, matches]);

    // Global notification WS
    useEffect(() => {
        notifSocket.current = new NotificationSocket({
            onNotification: (event) => {
                if (event.type === 'new_message') {
                    setConversations(prev => prev.map(c =>
                        c.id === event.match_id
                            ? { ...c, last_message: event.message, unread_count: (c.unread_count || 0) + 1 }
                            : c
                    ).sort((a, b) => new Date(b.last_message?.created_at || 0) - new Date(a.last_message?.created_at || 0)));
                } else if (event.type === 'new_match') {
                    setMatches(prev => [event.match, ...prev]);
                }
            },
            onBadgeUpdate: () => {},
        });
        notifSocket.current.connect();
        return () => notifSocket.current?.disconnect();
    }, []);

    // If in active chat, show chat view
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
            (c.their_name || c.name || '').toLowerCase().includes(search.toLowerCase())
        )
        : conversations;

    const newMatches = matches.filter(m => !m.has_conversation);

    return (
        <div style={{
            height: '100%', overflowY: 'auto',
            background: T.bg,
        }}>
            {/* Header */}
            <div style={{ padding: '20px 16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <h1 style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 28, fontWeight: 700, color: T.text,
                    }}>
                        Messages
                    </h1>
                    <div style={{
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 11, color: T.textMuted,
                    }}>
                        {conversations.filter(c => c.unread_count > 0).length > 0 &&
                            `${conversations.filter(c => c.unread_count > 0).length} non lu${conversations.filter(c => c.unread_count > 0).length > 1 ? 's' : ''}`
                        }
                    </div>
                </div>
            </div>

            {/* Free gate */}
            {!isPremium && <FreeGate matchCount={matches.length} T={T} isDark={isDark} onUpgrade={() => setShowPremium('video_call')} />}

            {/* New matches strip */}
            {newMatches.length > 0 && (
                <div style={{ padding: '20px 16px 8px' }}>
                    <h3 style={{
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 11, fontWeight: 700,
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: T.textMuted, marginBottom: 16,
                    }}>
                        Nouveaux Matchs
                    </h3>
                    <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
                        {loading
                            ? Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} style={{ flexShrink: 0 }}>
                                    <motion.div
                                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                        style={{ width: 66, height: 66, borderRadius: '50%', background: isDark ? '#2A1A2E' : '#F0EAD6' }}
                                    />
                                    <div style={{ width: 50, height: 8, borderRadius: 4, background: isDark ? '#2A1A2E' : '#F0EAD6', marginTop: 8, marginLeft: 8 }} />
                                </div>
                            ))
                            : newMatches.map((match, i) => (
                                <motion.div
                                    key={match.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                >
                                    <MatchBubble
                                        match={match}
                                        isNew={match.is_new}
                                        onClick={() => setActiveChat(match)}
                                        T={T}
                                    />
                                </motion.div>
                            ))
                        }
                    </div>
                </div>
            )}

            {/* Search */}
            <div style={{ padding: '12px 16px 8px' }}>
                <div style={{
                    position: 'relative',
                }}>
                    <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                         width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <circle cx="6.5" cy="6.5" r="5" stroke={T.textSoft} strokeWidth="1.5" />
                        <path d="M10 10l3.5 3.5" stroke={T.textSoft} strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input
                        type="text" value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher une conversation..."
                        style={{
                            width: '100%', padding: '12px 14px 12px 40px',
                            borderRadius: 14,
                            border: `1px solid ${T.gold}33`,
                            background: isDark ? 'rgba(30,16,32,0.80)' : 'rgba(255,255,255,0.80)',
                            fontFamily: "'Playfair Display', sans-serif",
                            fontSize: 13, color: T.text, outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>
            </div>

            {/* Conversations */}
            <div style={{ padding: '8px 8px 100px' }}>
                <div style={{ padding: '0 8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{
                        fontFamily: "'Playfair Display', sans-serif",
                        fontSize: 11, fontWeight: 700,
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: T.textMuted, margin: 0,
                    }}>
                        Conversations
                    </h3>
                </div>

                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 16px', alignItems: 'center' }}>
                            <motion.div
                                animate={{ opacity: [0.4, 0.8, 0.4] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                style={{ width: 56, height: 56, borderRadius: '50%', background: isDark ? '#2A1A2E' : '#F0EAD6', flexShrink: 0 }}
                            />
                            <div style={{ flex: 1 }}>
                                <motion.div
                                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 + 0.1 }}
                                    style={{ height: 14, width: '60%', borderRadius: 4, background: isDark ? '#2A1A2E' : '#F0EAD6', marginBottom: 8 }}
                                />
                                <motion.div
                                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 + 0.2 }}
                                    style={{ height: 10, width: '85%', borderRadius: 4, background: isDark ? '#2A1A2E' : '#F0EAD6' }}
                                />
                            </div>
                        </div>
                    ))
                ) : filteredConvs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
                        <p style={{
                            fontFamily: "'Playfair Display', serif",
                            fontStyle: 'italic', fontSize: 16,
                            color: T.textSoft, lineHeight: 1.7,
                        }}>
                            {search.trim()
                                ? 'Aucune conversation trouvée'
                                : "Vos premières conversations naîtront de vos premiers matchs"
                            }
                        </p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {filteredConvs.map((conv, i) => (
                            <motion.div
                                key={conv.id}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                            >
                                <ConversationRow
                                    conversation={conv}
                                    onClick={() => setActiveChat(conv)}
                                    T={T}
                                    isDark={isDark}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Premium modal */}
            {showPremium && (
                <PremiumModal
                    feature={showPremium}
                    onClose={() => setShowPremium(false)}
                    onSubscribe={(planId) => setShowPremium(false)}
                />
            )}

            <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
// PROFILETAB
// ══════════════════════════════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════════════
   LoveLine — Profile Tab (COMPLETE)
   Profile editing, photos, verification, settings, notifications
   ═══════════════════════════════════════════════════════════════ */

// ─── All interests pool ───────────────────────────────────────────────────────
const ALL_INTERESTS = [
    '🎵 Musique', '📚 Littérature', '🎨 Art', '💻 Tech', '⚽ Sport',
    '✈️ Voyage', '🍜 Cuisine', '🎮 Gaming', '🌿 Nature', '📸 Photo',
    '🎭 Théâtre', '💃 Danse', '🏋️ Fitness', '🎬 Cinéma', '🔬 Sciences',
    '⚖️ Droit', '🏥 Médecine', '📐 Architecture', '🎸 Guitare', '🎹 Piano',
    '🌍 Langues', '🤿 Plongée', '🧩 Échecs', '🦋 Mode', '🏄 Surf',
    '✍️ Écriture', '🎤 Chant', '📊 Économie', '🌱 Écologie', '🐾 Animaux',
];

const UK_FACULTIES = [
    'FAST (Sciences & Tech)', 'FLASH (Lettres & Sciences Humaines)',
    'FDE (Droit & Économie)', 'FSSE (Sciences Sociales & Éducation)',
    'FMéd (Médecine & Sciences de la Santé)',
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
    const inputRef = useRef(null);
    const MAX = 10;
    const slots = Array.from({ length: MAX });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textSoft }}>
                    Photos ({photos.length}/{MAX})
                </div>
                <button onClick={() => inputRef.current?.click()} style={{
                    background: `${T.gold}22`, border: `1px solid ${T.gold}55`,
                    color: T.gold, borderRadius: 10, padding: '5px 12px',
                    fontFamily: "'Playfair Display',sans-serif", fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}>+ Ajouter</button>
            </div>
            <input ref={inputRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
                   onChange={e => {
                       const fd = new FormData();
                       Array.from(e.target.files).forEach(f => fd.append('photos', f));
                       onUpload(fd);
                   }} />
            <p style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 12, color: T.textMuted, lineHeight: 1.6, marginBottom: 14 }}>
                ✦ Les profils avec 6+ photos reçoivent 4× plus de matchs. Ta photo principale est ton premier regard sur le monde.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {slots.map((_, i) => {
                    const p = photos[i];
                    return (
                        <motion.div key={i} whileHover={p ? { scale: 1.03 } : {}}
                                    style={{
                                        aspectRatio: '3/4', borderRadius: 16, overflow: 'hidden',
                                        position: 'relative',
                                        background: isDark ? '#2A1A2E' : '#F0EAD6',
                                        border: `1.5px dashed ${p ? 'transparent' : T.gold + '44'}`,
                                        cursor: 'pointer',
                                    }}
                                    onClick={!p ? () => inputRef.current?.click() : undefined}
                        >
                            {p ? (
                                <>
                                    <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    {p.is_main && (
                                        <div style={{
                                            position: 'absolute', top: 6, left: 6,
                                            background: T.gold, color: '#1A0812',
                                            borderRadius: 8, padding: '2px 8px',
                                            fontFamily: "'Playfair Display',sans-serif", fontSize: 8, fontWeight: 800,
                                        }}>PRINCIPALE</div>
                                    )}
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                        background: 'linear-gradient(0deg,rgba(0,0,0,0.75) 0%,transparent)',
                                        padding: '20px 6px 6px',
                                        display: 'flex', gap: 4, justifyContent: 'flex-end',
                                    }}>
                                        {!p.is_main && (
                                            <button onClick={e => { e.stopPropagation(); onSetMain(p.id); }} style={{
                                                background: 'rgba(212,175,55,0.85)', border: 'none', borderRadius: 7,
                                                padding: '3px 7px', cursor: 'pointer',
                                                fontFamily: "'Playfair Display',sans-serif", fontSize: 9, color: '#1A0812', fontWeight: 700,
                                            }}>★</button>
                                        )}
                                        <button onClick={e => { e.stopPropagation(); onDelete(p.id); }} style={{
                                            background: 'rgba(244,67,54,0.85)', border: 'none', borderRadius: 7,
                                            padding: '3px 7px', cursor: 'pointer', color: '#fff',
                                            fontFamily: "'Playfair Display',sans-serif", fontSize: 9,
                                        }}>✕</button>
                                    </div>
                                </>
                            ) : (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                    <span style={{ fontSize: 20, opacity: 0.3 }}>+</span>
                                    <span style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 9, color: T.textMuted }}>Ajouter</span>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
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
    { id: 'profile',       label: 'Mon Profil',     emoji: '✨' },
    { id: 'settings',      label: 'Découverte',     emoji: '🔍' },
    { id: 'notifications', label: 'Notifications',  emoji: '🔔' },
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
    const [showPremium, setShowPremium] = useState(false);
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
            subscriptionAPI.getStatus(),
        ]).then(([p, v, s]) => {
            setProfile(p);
            setBio(p.bio || '');
            setInterests(p.interests || []);
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
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                        style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${T.gold}22`, borderTopColor: T.gold }} />
        </div>
    );

    return (
        <div style={{ height: '100%', overflowY: 'auto', background: T.bg }}>
            {/* ─── HEADER ─── */}
            <div style={{
                padding: '20px 16px 0',
                background: isDark
                    ? 'linear-gradient(180deg,rgba(30,16,32,0.8) 0%,transparent)'
                    : 'linear-gradient(180deg,rgba(253,246,240,0.9) 0%,transparent)',
            }}>
                {/* Avatar + progress */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: '50%',
                            overflow: 'hidden', border: `2.5px solid ${T.gold}`,
                            boxShadow: `0 0 20px ${T.gold}44`,
                        }}>
                            <img src={profile?.photos?.find(p => p.is_main)?.url || profile?.avatar || 'https://via.placeholder.com/72'}
                                 alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        {verifyStatus?.is_verified && (
                            <div style={{
                                position: 'absolute', bottom: -2, right: -2,
                                width: 20, height: 20, borderRadius: '50%',
                                background: '#1565C0',
                                border: `2px solid ${isDark ? '#0F0810' : '#FDF6F0'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M2 5l2.5 2.5L8 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{
                            fontFamily: "'Playfair Display',serif",
                            fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 2,
                        }}>
                            {profile?.first_name || 'Mon Profil'}
                            {profile?.age && <span style={{ fontWeight: 300, color: T.textSoft }}>, {profile.age}</span>}
                        </h2>
                        <div style={{
                            fontFamily: "'Playfair Display',sans-serif", fontSize: 12, color: T.textSoft,
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            {profile?.university && <span>🎓 {profile.university}</span>}
                        </div>
                    </div>
                    <ProfileProgress percent={calcProgress()} T={T} />
                </div>

                {/* Subscription badge */}
                {subscription && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', borderRadius: 14,
                        background: subscription.plan === 'eternite'
                            ? 'linear-gradient(135deg,rgba(233,30,99,0.12),rgba(136,14,79,0.08))'
                            : 'linear-gradient(135deg,rgba(212,175,55,0.12),rgba(184,148,46,0.08))',
                        border: `1px solid ${subscription.plan === 'eternite' ? T.rose : T.gold}33`,
                        marginBottom: 16,
                        cursor: 'pointer',
                    }} onClick={() => setShowPremium(true)}>
                        <span style={{ fontSize: 18 }}>{subscription.plan === 'eternite' ? '♾' : '✦'}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontFamily: "'Playfair Display',sans-serif", fontSize: 12, fontWeight: 700,
                                color: subscription.plan === 'eternite' ? T.rose : T.gold,
                            }}>
                                LoveLine {subscription.plan === 'eternite' ? 'Éternité' : 'Gold'}
                            </div>
                            <div style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 11, color: T.textMuted }}>
                                Expire le {new Date(subscription.expires_at).toLocaleDateString('fr-FR')}
                            </div>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M5 2l5 5-5 5" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>
                )}

                {!subscription && (
                    <motion.div whileHover={{ scale: 1.01 }} onClick={() => setShowPremium(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px 16px', borderRadius: 16,
                                    background: `linear-gradient(135deg, ${T.gold}18, ${T.rose}10)`,
                                    border: `1.5px solid ${T.gold}44`,
                                    marginBottom: 16, cursor: 'pointer',
                                }}>
                        <span style={{ fontSize: 22 }}>💎</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 13, fontWeight: 700, color: T.text }}>
                                Élevez votre expérience
                            </div>
                            <div style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 12, color: T.textSoft }}>
                                Voir qui vous a liké, Super Likes illimités...
                            </div>
                        </div>
                        <div style={{
                            background: `linear-gradient(135deg,${T.gold},${T.goldDark})`,
                            color: '#1A0812', padding: '6px 14px', borderRadius: 20,
                            fontFamily: "'Playfair Display',sans-serif", fontSize: 11, fontWeight: 800,
                        }}>Gold ✦</div>
                    </motion.div>
                )}

                {/* Sub-tabs */}
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 0 }}>
                    {SUB_TABS.map(tab => (
                        <button key={tab.id} onClick={() => setSubTab(tab.id)} style={{
                            flexShrink: 0, padding: '8px 14px',
                            borderRadius: 20, border: 'none',
                            background: subTab === tab.id
                                ? `linear-gradient(135deg,${T.gold},${T.goldDark})`
                                : isDark ? 'rgba(45,16,32,0.70)' : 'rgba(240,234,214,0.70)',
                            color: subTab === tab.id ? '#1A0812' : T.textSoft,
                            fontFamily: "'Playfair Display',sans-serif",
                            fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            transition: 'all 0.25s',
                        }}>
                            {tab.emoji} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── CONTENT ─── */}
            <div style={{ padding: '16px 16px 100px' }}>

                {/* ─── MON PROFIL ─── */}
                {subTab === 'profile' && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

                        {/* Photos */}
                        <SectionCard title="Mes photos" T={T} isDark={isDark}>
                            <PhotoGrid
                                photos={profile?.photos || []}
                                onUpload={async (fd) => {
                                    const updated = await profileAPI.uploadPhotos(fd);
                                    setProfile(updated);
                                }}
                                onDelete={async (id) => {
                                    await profileAPI.deletePhoto(id);
                                    setProfile(p => ({ ...p, photos: p.photos.filter(ph => ph.id !== id) }));
                                }}
                                onSetMain={async (id) => {
                                    await profileAPI.setMainPhoto(id);
                                    setProfile(p => ({ ...p, photos: p.photos.map(ph => ({ ...ph, is_main: ph.id === id })) }));
                                }}
                                T={T} isDark={isDark}
                            />
                        </SectionCard>

                        {/* Bio */}
                        <SectionCard title="Ma biographie" hint="Une phrase qui vous définit au-delà des mots. Ce que vous êtes, ce que vous cherchez." T={T} isDark={isDark}>
              <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 500))}
                  onBlur={() => { if (bio !== (profile?.bio || '')) save({ bio }); }}
                  placeholder={`"Je cours après les couchers de soleil sur le campus et les discussions qui durent jusqu'à l'aube..."`}
                  maxLength={500}
                  style={{
                      width: '100%', minHeight: 100, padding: '12px 14px',
                      borderRadius: 14, border: `1px solid ${T.gold}33`,
                      background: isDark ? 'rgba(45,16,32,0.60)' : 'rgba(255,255,255,0.80)',
                      fontFamily: "'Playfair Display',serif",
                      fontStyle: 'italic', fontSize: 14, color: T.text,
                      lineHeight: 1.7, resize: 'none', outline: 'none',
                      boxSizing: 'border-box',
                  }}
              />
                            <div style={{ textAlign: 'right', fontFamily: "'Playfair Display',sans-serif", fontSize: 10, color: T.textMuted, marginTop: 4 }}>
                                {bio.length}/500
                            </div>
                        </SectionCard>

                        {/* Interests */}
                        <SectionCard title="Mes passions" hint="Choisis jusqu'à 10 passions. Elles guident ton algorithme vers les âmes qui te ressemblent." T={T} isDark={isDark}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                                {(showAllInterests ? ALL_INTERESTS : ALL_INTERESTS.slice(0, 15)).map(interest => {
                                    const active = interests.includes(interest);
                                    return (
                                        <motion.button key={interest} onClick={() => toggleInterest(interest)}
                                                       whileTap={{ scale: 0.92 }}
                                                       style={{
                                                           padding: '7px 14px', borderRadius: 20, border: 'none',
                                                           background: active
                                                               ? `linear-gradient(135deg,${T.gold},${T.goldDark})`
                                                               : isDark ? 'rgba(212,175,55,0.10)' : 'rgba(212,175,55,0.08)',
                                                           color: active ? '#1A0812' : T.textSoft,
                                                           fontFamily: "'Playfair Display',sans-serif", fontSize: 12, fontWeight: 600,
                                                           cursor: 'pointer',
                                                           border: active ? 'none' : `1px solid ${T.gold}33`,
                                                           transition: 'all 0.2s',
                                                       }}>
                                            {interest}
                                        </motion.button>
                                    );
                                })}
                            </div>
                            <button onClick={() => setShowAllInterests(s => !s)} style={{
                                background: 'none', border: `1px solid ${T.gold}33`,
                                borderRadius: 20, padding: '6px 14px',
                                fontFamily: "'Playfair Display',sans-serif", fontSize: 12, color: T.gold,
                                cursor: 'pointer',
                            }}>
                                {showAllInterests ? 'Voir moins' : `Voir tout (${ALL_INTERESTS.length})`}
                            </button>
                            <p style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 11, color: T.textMuted, marginTop: 8 }}>
                                {interests.length}/10 passions sélectionnées
                            </p>
                        </SectionCard>

                        {/* Verification */}
                        <SectionCard title="Vérification Étudiante UK" hint="Obtiens le badge bleu réservé aux vrais étudiants de l'Université de Kara." T={T} isDark={isDark}>
                            <VerificationSection status={verifyStatus} T={T} isDark={isDark} />
                        </SectionCard>

                        {/* Account nav */}
                        <SectionCard title="Compte & Sécurité" T={T} isDark={isDark}>
                            <SettingRow icon="🔐" label="Mot de passe & Email"
                                        sub="Gérer vos identifiants de connexion"
                                        onClick={onNavigateAccount} T={T} isDark={isDark} />
                            <SettingRow icon="🌙" label="Apparence"
                                        sub={isDark ? 'Mode sombre activé' : 'Mode clair activé'}
                                        right={<Toggle value={isDark} onChange={onToggleTheme} T={T} />}
                                        T={T} isDark={isDark} />
                        </SectionCard>

                    </motion.div>
                )}

                {/* ─── DÉCOUVERTE SETTINGS ─── */}
                {subTab === 'settings' && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

                        <SectionCard title="Préférences de découverte"
                                     hint="Ces réglages influencent les profils qui vous sont présentés et ceux qui vous verront."
                                     T={T} isDark={isDark}>

                            {/* Age range */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <label style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 12, fontWeight: 600, color: T.textSoft }}>
                                        Âge recherché
                                    </label>
                                    <span style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 12, color: T.gold, fontWeight: 700 }}>
                    {discovery.min_age || 18} – {discovery.max_age || 30} ans
                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <input type="range" min="18" max="40" value={discovery.min_age || 18}
                                           onChange={e => setDiscovery(d => ({ ...d, min_age: +e.target.value }))}
                                           onMouseUp={() => profileAPI.updateDiscoverySettings(discovery)}
                                           style={{ flex: 1, accentColor: T.gold }} />
                                    <input type="range" min="18" max="40" value={discovery.max_age || 30}
                                           onChange={e => setDiscovery(d => ({ ...d, max_age: +e.target.value }))}
                                           onMouseUp={() => profileAPI.updateDiscoverySettings(discovery)}
                                           style={{ flex: 1, accentColor: T.gold }} />
                                </div>
                            </div>

                            {/* Distance */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <label style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 12, fontWeight: 600, color: T.textSoft }}>
                                        Distance maximale
                                    </label>
                                    <span style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 12, color: T.gold, fontWeight: 700 }}>
                    {discovery.max_distance || 50} km
                  </span>
                                </div>
                                <input type="range" min="1" max="100" value={discovery.max_distance || 50}
                                       onChange={e => setDiscovery(d => ({ ...d, max_distance: +e.target.value }))}
                                       onMouseUp={() => profileAPI.updateDiscoverySettings(discovery)}
                                       style={{ width: '100%', accentColor: T.gold }} />
                            </div>

                            {/* Gender preference */}
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 12, fontWeight: 600, color: T.textSoft, display: 'block', marginBottom: 10 }}>
                                    Je cherche
                                </label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {['Femmes', 'Hommes', 'Tout le monde'].map(g => (
                                        <button key={g} onClick={() => {
                                            const next = { ...discovery, gender_preference: g.toLowerCase() };
                                            setDiscovery(next);
                                            profileAPI.updateDiscoverySettings(next);
                                        }} style={{
                                            flex: 1, padding: '9px 4px', borderRadius: 12, border: 'none',
                                            background: discovery.gender_preference === g.toLowerCase()
                                                ? `${T.gold}22` : isDark ? 'rgba(45,16,32,0.70)' : 'rgba(240,234,214,0.70)',
                                            color: discovery.gender_preference === g.toLowerCase() ? T.gold : T.textSoft,
                                            fontFamily: "'Playfair Display',sans-serif", fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                            border: `1px solid ${discovery.gender_preference === g.toLowerCase() ? T.gold + '55' : 'transparent'}`,
                                        }}>
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Show me on campus toggle */}
                            <SettingRow icon="👁" label="Être visible sur la plateforme"
                                        sub="Désactiver pour naviguer en mode fantôme"
                                        right={<Toggle value={discovery.show_profile !== false}
                                                       onChange={v => { const next = { ...discovery, show_profile: v }; setDiscovery(next); profileAPI.updateDiscoverySettings(next); }}
                                                       T={T} />}
                                        T={T} isDark={isDark} />

                            <SettingRow icon="📍" label="Utiliser ma localisation"
                                        sub="Améliore la pertinence des profils à proximité"
                                        right={<Toggle value={discovery.use_location !== false}
                                                       onChange={v => { const next = { ...discovery, use_location: v }; setDiscovery(next); profileAPI.updateDiscoverySettings(next); }}
                                                       T={T} />}
                                        T={T} isDark={isDark} />
                        </SectionCard>

                        {/* Hidden from faculties */}
                        <SectionCard title="Confidentialité par faculté"
                                     hint="Choisissez les facultés dont vous ne souhaitez pas que les étudiants voient votre profil. Votre discrétion, votre liberté."
                                     T={T} isDark={isDark}>
                            {UK_FACULTIES.map(faculty => (
                                <div key={faculty} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 0', borderBottom: `1px solid ${T.gold}11`,
                                }}>
                  <span style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 13, color: T.text }}>
                    {faculty}
                  </span>
                                    <Toggle
                                        value={hiddenFaculties.includes(faculty)}
                                        onChange={() => toggleHiddenFaculty(faculty)}
                                        T={T}
                                    />
                                </div>
                            ))}
                            <p style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 11, color: T.textMuted, marginTop: 10, lineHeight: 1.6 }}>
                                ℹ️ Cette option cache uniquement votre profil des étudiants de ces facultés. Vous pouvez toujours voir leurs profils.
                            </p>
                        </SectionCard>

                    </motion.div>
                )}

                {/* ─── NOTIFICATIONS ─── */}
                {subTab === 'notifications' && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

                        <SectionCard title="Préférences de notifications"
                                     hint="Choisissez comment LoveLine vous tient informé(e) des moments qui comptent."
                                     T={T} isDark={isDark}>

                            {[
                                { key: 'new_match', icon: '💕', label: 'Nouveau Match', sub: 'Soyez le premier à briser la glace' },
                                { key: 'new_message', icon: '💬', label: 'Nouveau Message', sub: 'Ne laissez aucun mot sans réponse' },
                                { key: 'super_like', icon: '⭐', label: 'Super Like reçu', sub: 'Quelqu\'un vous admire particulièrement' },
                                { key: 'nearby_activity', icon: '📍', label: 'Activité à proximité', sub: '"De nouvelles âmes errent près de vous..."' },
                                { key: 'profile_views', icon: '👁', label: 'Vues du profil', sub: 'Votre profil attire des regards curieux' },
                                { key: 'weekly_digest', icon: '📊', label: 'Rapport hebdomadaire', sub: 'Votre semaine sur LoveLine en un coup d\'œil' },
                            ].map(item => (
                                <SettingRow key={item.key}
                                            icon={item.icon} label={item.label} sub={item.sub}
                                            right={
                                                <Toggle
                                                    value={notifications[item.key] !== false}
                                                    onChange={v => {
                                                        const next = { ...notifications, [item.key]: v };
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

                        <p style={{
                            fontFamily: "'Playfair Display',serif", fontStyle: 'italic',
                            fontSize: 13, color: T.textMuted, lineHeight: 1.7,
                            textAlign: 'center', padding: '0 20px',
                        }}>
                            "Les notifications sont les messagers de vos histoires à venir.
                            Choisissez celles qui méritent d'être entendues."
                        </p>

                    </motion.div>
                )}

            </div>

            {/* Saving indicator */}
            <AnimatePresence>
                {saving && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                                style={{
                                    position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
                                    background: isDark ? 'rgba(30,16,32,0.95)' : 'rgba(253,246,240,0.95)',
                                    backdropFilter: 'blur(12px)',
                                    border: `1px solid ${T.gold}44`,
                                    borderRadius: 50, padding: '10px 20px',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    boxShadow: T.shadowDeep, zIndex: 100,
                                }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${T.gold}44`, borderTopColor: T.gold }} />
                        <span style={{ fontFamily: "'Playfair Display',sans-serif", fontSize: 12, color: T.text }}>Sauvegarde...</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {showPremium && (
                <PremiumModal feature="default" onClose={() => setShowPremium(false)} onSubscribe={() => setShowPremium(false)} />
            )}
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
// ACCOUNTTAB
// ══════════════════════════════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════════════
   LoveLine — Account & Security Tab
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
   LoveLine — Liquid Glass Navigation
   Ultra-realistic Apple liquid glass — transparent as a water drop
   Water-stretch morphing between tabs + text distortion
   ═══════════════════════════════════════════════════════════════ */

// ══════════════════════════════════════════════════════════════════════════════
// LIQUID GLASS NAV — SVG Displacement Filter (vrai effet verre)
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
                        // Le vrai effet verre : backdrop-filter avec le SVG filter
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
                                                style={{
                                                    position: 'absolute', top: -4, right: -5,
                                                    minWidth: 16, height: 16, borderRadius: 8,
                                                    background: tab.id === 'likes' ? '#E91E63' : T.gold,
                                                    color: tab.id === 'likes' ? '#fff' : '#1A0812',
                                                    fontSize: 8, fontWeight: 800,
                                                    fontFamily: "'Inter', sans-serif",
                                                    display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', padding: '0 3px',
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
// DASHBOARD PRINCIPAL (orchestrateur)
// ══════════════════════════════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════════════════════════════
   LoveLine — Dashboard.jsx
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
function ToastNotif({ notif, onDismiss, T, isDark }) {
    useEffect(() => {
        const t = setTimeout(onDismiss, 4500);
        return () => clearTimeout(t);
    }, [onDismiss]);

    const icons = {
        match:    '💕',
        message:  '💬',
        super_like: '⭐',
        like:     '❤️',
        boost:    '⚡',
        default:  '🔔',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={onDismiss}
            style={{
                position: 'fixed', top: 'max(16px, env(safe-area-inset-top))',
                left: 16, right: 16, zIndex: 9500,
                background: isDark
                    ? 'rgba(22, 11, 24, 0.95)'
                    : 'rgba(253, 246, 240, 0.97)',
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                border: `1px solid ${T.gold}33`,
                borderRadius: 20,
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: `0 8px 40px rgba(0,0,0,0.18), 0 0 0 0.5px ${T.gold}22`,
                cursor: 'pointer',
            }}
        >
            {/* Avatar or icon */}
            {notif.avatar ? (
                <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${T.gold}`,
                    overflow: 'hidden',
                }}>
                    <img src={notif.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            ) : (
                <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    background: `${T.gold}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                }}>
                    {icons[notif.type] || icons.default}
                </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontFamily: "'Playfair Display', sans-serif",
                    fontSize: 13, fontWeight: 700, color: T.text,
                    marginBottom: 2,
                }}>
                    {notif.title || 'Nouvelle notification'}
                </div>
                <div style={{
                    fontFamily: "'Playfair Display', sans-serif",
                    fontSize: 12, color: T.textSoft,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {notif.body}
                </div>
            </div>

            {/* Progress bar */}
            <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 4.5, ease: 'linear' }}
                style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, ${T.gold}, ${T.rose})`,
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

    // ────────────────────────────────────────────────────────────────────────────
    // Init: load light profile + connect notification WS
    // ────────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        // Load minimal user data
        profileAPI.getMe().then(p => {
            setUserAvatar(p?.photos?.find(ph => ph.is_main)?.url || p?.avatar || '');
            setIsPremium(p?.subscription?.plan !== 'free');
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
    const handleIncomingNotification = useCallback((notif) => {
        // Update badges
        if (notif.type === 'new_message' && activeTab !== 'messages') {
            setBadges(prev => ({ ...prev, messages: prev.messages + 1 }));
        }
        if (notif.type === 'like' || notif.type === 'super_like') {
            setBadges(prev => ({ ...prev, likes: prev.likes + 1 }));
        }

        // Show toast only if not on relevant tab
        const suppressOn = {
            new_message: 'messages',
            match: null, // always show
            super_like: null,
            like: 'likes',
        };
        const suppress = suppressOn[notif.type];
        if (!suppress || activeTab !== suppress) {
            addToast({
                type:   notif.type,
                title:  notif.title,
                body:   notif.body || notif.message,
                avatar: notif.actor_avatar,
                id:     notif.id,
                tab:    notif.type === 'new_message' ? 'messages' : 'likes',
            });
        }
    }, [activeTab]);

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
            background: T.bg,
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
                                    onMatch={(match) => {
                                        addToast({
                                            type: 'match',
                                            title: `Nouveau Match ! 💕`,
                                            body: `Tu as matché avec ${match.first_name} !`,
                                            avatar: match.main_photo,
                                        });
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