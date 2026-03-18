/* ═══════════════════════════════════════════════════════════════
   LoveLine — Chat View
   Real-time conversation with WebSocket + voice messages
   ═══════════════════════════════════════════════════════════════ */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './useTheme.jsx';
import { messagesAPI, ChatSocket } from './api.js';

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
              fontFamily: "'DM Sans', sans-serif",
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
              fontFamily: "'DM Sans', sans-serif",
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
            fontFamily: "'DM Sans', sans-serif",
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
function DateSeparator({ date, T }) {
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
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 11, color: T.textMuted,
        whiteSpace: 'nowrap',
        padding: '3px 10px',
        background: isDarkHelper ? 'rgba(30,16,32,0.6)' : 'rgba(240,234,214,0.6)',
        borderRadius: 20,
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: `${T.gold}22` }} />
    </div>
  );
}
const isDarkHelper = window.matchMedia('(prefers-color-scheme: dark)').matches;

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

      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: T.rose, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>
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
              fontFamily: "'DM Sans', sans-serif",
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
export default function ChatView({ match, onBack, isPremium, onShowPremium }) {
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
            fontFamily: "'DM Sans', sans-serif",
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
                    fontFamily: "'DM Sans', sans-serif",
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
            fontFamily: "'DM Sans', sans-serif",
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
              ? <DateSeparator key={`sep-${i}`} date={item.date} T={T} />
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
