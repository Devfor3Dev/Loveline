

import { useState, useEffect, useCallback, useRef } from 'react';
import { ProfileAPI, SubscriptionAPI, createPresenceSocket, TokenService } from './api';
import { useDarkMode, FONTS } from './theme';
import LiquidGlassNav from './LiquidGlassNav';
import DiscoverTab from './DiscoverTab';
import ExploreTab from './ExploreTab';
import LikesTab from './LikesTab';
import MessagesTab from './MessagesTab';
import ProfileTab from './ProfileTab';

// ─── Google Fonts import ───────────────────────────────────────────────────────

const FONT_LINK = document.createElement('link');
FONT_LINK.rel = 'stylesheet';
FONT_LINK.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap';
if (!document.head.querySelector('[href*="Playfair"]')) document.head.appendChild(FONT_LINK);

// ─── Global CSS ───────────────────────────────────────────────────────────────

function injectGlobalCSS(theme) {
  const id = 'll-global-css';
  let el = document.getElementById(id);
  if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
  el.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; overflow: hidden; -webkit-font-smoothing: antialiased; }
    body { background: ${theme.bg}; color: ${theme.textPrimary}; font-family: '${FONTS.body}', sans-serif; }
    ::-webkit-scrollbar { width: 0; height: 0; }
    * { scrollbar-width: none; }
    button { font-family: inherit; }
    input, textarea { font-family: inherit; }
    a { text-decoration: none; color: inherit; }
    @keyframes ll-spin { to { transform: rotate(360deg); } }
    @keyframes ll-fade-in { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes ll-pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
  `;
}

// ─── Loading Screen ───────────────────────────────────────────────────────────

function LoadingScreen({ theme }) {
  return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: theme.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 20,
      }}>
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
          <path
              d="M26 46s-19-12-19-27A11.5 11.5 0 0 1 26 10a11.5 11.5 0 0 1 19 9C45 34 26 46 26 46z"
              stroke={theme.gold} strokeWidth="1.5" fill={`${theme.gold}20`}
          />
        </svg>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: `2.5px solid ${theme.borderSoft}`,
          borderTop: `2.5px solid ${theme.gold}`,
          animation: 'll-spin 0.9s linear infinite',
        }} />
        <p style={{ fontFamily: FONTS.display, fontSize: 14, fontStyle: 'italic', color: theme.textMuted }}>
          Chargement de vos connexions...
        </p>
      </div>
  );
}

// ─── Tab Transition Wrapper ───────────────────────────────────────────────────

function TabView({ activeTab, tabId, children }) {
  const [mounted, setMounted] = useState(activeTab === tabId);
  const [visible, setVisible] = useState(activeTab === tabId);

  useEffect(() => {
    if (activeTab === tabId) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 250);
      return () => clearTimeout(t);
    }
  }, [activeTab, tabId]);

  if (!mounted) return null;

  return (
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(12px) scale(0.99)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        pointerEvents: visible ? 'auto' : 'none',
        overflow: 'hidden',
      }}>
        {children}
      </div>
  );
}

// ─── Push-style Notification Toast ───────────────────────────────────────────

function Toast({ msg, theme, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
      <div style={{
        position: 'fixed', top: 16, left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 5000, maxWidth: 360, width: '90%',
        background: theme.bgCard,
        border: `1px solid ${theme.borderSoft}`,
        borderRadius: 20,
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: theme.shadowCard,
        animation: 'll-fade-in 0.35s ease',
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: `${msg.color || theme.gold}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {msg.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONTS.body, fontSize: 14, fontWeight: 700, color: theme.textPrimary }}>{msg.title}</div>
          <div style={{ fontFamily: FONTS.body, fontSize: 12, color: theme.textSoft, marginTop: 2 }}>{msg.body}</div>
        </div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={theme.textMuted}>
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard({ onLogout }) {
  const { dark, toggle: toggleDark, theme } = useDarkMode();
  const [activeTab, setActiveTab] = useState('discover');
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [toasts, setToasts] = useState([]);
  const presenceRef = useRef(null);
  const presencePingRef = useRef(null);

  // Inject global styles
  useEffect(() => { injectGlobalCSS(theme); }, [theme]);

  // Load user & subscription
  useEffect(() => {
    (async () => {
      try {
        const [userData, subData] = await Promise.all([
          ProfileAPI.getMe(),
          SubscriptionAPI.getCurrent().catch(() => ({ plan: 'free' })),
        ]);
        setUser(userData);
        setSubscription(subData);
      } catch (e) {
        console.error('Dashboard init error:', e);
        // If 401, logout
        if (e.status === 401) { onLogout?.(); }
      } finally {
        setLoading(false);
      }
    })();

    // Listen for forced logout
    const handleLogout = () => onLogout?.();
    window.addEventListener('ll:logout', handleLogout);
    return () => window.removeEventListener('ll:logout', handleLogout);
  }, [onLogout]);

  // Presence (online status)
  useEffect(() => {
    if (!user) return;
    presenceRef.current = createPresenceSocket({
      onPresence: (data) => {
        // Handle presence updates for other users if needed
      },
      onClose: () => {
        // Reconnect after 5s
        setTimeout(() => {
          if (user) {
            presenceRef.current = createPresenceSocket({});
          }
        }, 5000);
      },
    });

    // Ping every 30s to stay "online"
    presencePingRef.current = setInterval(() => {
      presenceRef.current?.ping();
    }, 30000);

    return () => {
      presenceRef.current?.close();
      clearInterval(presencePingRef.current);
    };
  }, [user?.id]);

  // Simulated push notification (new student nearby) every ~5min
  useEffect(() => {
    const msgs = [
      { icon: '💫', title: 'Quelqu\'un de nouveau', body: 'Un(e) étudiant(e) proche de vous vient de rejoindre LoveLine.' },
      { icon: '✨', title: 'Le moment est propice', body: 'Des profils frais vous attendent dans la file de découverte.' },
      { icon: '🌸', title: 'Votre campus s\'éveille', body: 'De nouvelles histoires se dessinent autour de vous.' },
    ];
    const t = setTimeout(() => {
      const msg = msgs[Math.floor(Math.random() * msgs.length)];
      addToast(msg);
    }, 5 * 60 * 1000);
    return () => clearTimeout(t);
  }, []);

  const addToast = useCallback((msg) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...msg, id }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter(t => t.id !== id));
  }, []);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    // Refresh discover if clicking logo on discover tab
    if (tabId === 'discover' && activeTab === 'discover') {
      window.dispatchEvent(new CustomEvent('ll:refresh-discover'));
    }
  }, [activeTab]);

  if (loading) return <LoadingScreen theme={theme} />;

  return (
      <div style={{
        position: 'fixed', inset: 0,
        background: theme.bg,
        display: 'flex', flexDirection: 'column',
        maxWidth: 480, // Mobile-first
        margin: '0 auto',
        overflow: 'hidden',
      }}>
        {/* Safe area top */}
        <div style={{ height: 'env(safe-area-inset-top)', background: theme.bg, flexShrink: 0 }} />

        {/* Tab views */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <TabView activeTab={activeTab} tabId="discover">
            <DiscoverTab theme={theme} user={user} subscription={subscription} />
          </TabView>
          <TabView activeTab={activeTab} tabId="explore">
            <ExploreTab theme={theme} user={user} subscription={subscription} />
          </TabView>
          <TabView activeTab={activeTab} tabId="likes">
            <LikesTab theme={theme} user={user} subscription={subscription} />
          </TabView>
          <TabView activeTab={activeTab} tabId="messages">
            <MessagesTab
                theme={theme}
                user={user}
                subscription={subscription}
                onUnreadChange={setUnreadMessages}
            />
          </TabView>
          <TabView activeTab={activeTab} tabId="profile">
            <ProfileTab
                theme={theme}
                user={user}
                subscription={subscription}
                onLogout={onLogout}
                darkMode={dark}
                onToggleDark={toggleDark}
            />
          </TabView>
        </div>

        {/* Bottom Navigation */}
        <LiquidGlassNav
            activeTab={activeTab}
            onTabChange={handleTabChange}
            theme={theme}
            unreadMessages={unreadMessages}
            userAvatar={user?.photo_url || user?.avatar}
        />

        {/* Toast notifications */}
        {toasts.map((toast) => (
            <Toast
                key={toast.id}
                msg={toast}
                theme={theme}
                onDismiss={() => removeToast(toast.id)}
            />
        ))}
      </div>
  );
}