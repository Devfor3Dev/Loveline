/* ═══════════════════════════════════════════════════════════════
   LoveLine — Messages Tab
   Matches ring + conversations list
   ═══════════════════════════════════════════════════════════════ */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './useTheme.jsx';
import { messagesAPI, NotificationSocket } from './api.js';
import { PremiumModal } from './Modals.jsx';
import ChatView from './ChatView.jsx';

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
            fontFamily: "'DM Sans', sans-serif",
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
        fontFamily: "'DM Sans', sans-serif",
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
            fontFamily: "'DM Sans', sans-serif",
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
            fontFamily: "'DM Sans', sans-serif",
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
              fontFamily: "'DM Sans', sans-serif",
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
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12, color: T.textSoft, lineHeight: 1.5, margin: 0,
        }}>
          Avec Gold, échangez sans limite de temps. Ne laissez pas vos matches disparaître.
        </p>
      </div>
      <div style={{
        background: `linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
        color: '#1A0812', borderRadius: 50,
        padding: '8px 14px',
        fontFamily: "'DM Sans', sans-serif",
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
export default function MessagesTab({ isPremium, initialMatchId }) {
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
    notifSocket.current = new NotificationSocket((event) => {
      if (event.type === 'new_message') {
        // Update conversation preview
        setConversations(prev => prev.map(c =>
          c.id === event.match_id
            ? { ...c, last_message: event.message, unread_count: (c.unread_count || 0) + 1 }
            : c
        ).sort((a, b) => new Date(b.last_message?.created_at || 0) - new Date(a.last_message?.created_at || 0)));
      } else if (event.type === 'new_match') {
        setMatches(prev => [event.match, ...prev]);
      }
    });
    return () => notifSocket.current?.close();
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
            fontFamily: "'DM Sans', sans-serif",
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
            fontFamily: "'DM Sans', sans-serif",
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
              fontFamily: "'DM Sans', sans-serif",
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
            fontFamily: "'DM Sans', sans-serif",
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
