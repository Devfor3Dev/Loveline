
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './useTheme.jsx';
import { likesAPI, discoverAPI } from './api.js';
import { PremiumModal } from './Modals.jsx';

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
            fontFamily: "'DM Sans', sans-serif",
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
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#fff', fontWeight: 700 }}>
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
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.70)', marginBottom: 8 }}>
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
            fontFamily: "'DM Sans', sans-serif",
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
              fontFamily: "'DM Sans', sans-serif",
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
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: '#1A0812', fontWeight: 800 }}>
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
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.70)' }}>
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
    <span style={{ fontFamily: "'DM Sans', sans-serif", fontFeatureSettings: '"tnum"' }}>
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LIKES TAB — Main export
// ══════════════════════════════════════════════════════════════════════════════
export default function LikesTab({ isPremium }) {
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
            fontFamily: "'DM Sans', sans-serif",
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
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13, color: T.textSoft, lineHeight: 1.5,
                }}>
                  Passez à Gold pour révéler toutes ces âmes qui vous attendent
                </p>
              </div>
              <div style={{
                background: `linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
                color: '#1A0812', borderRadius: 50,
                padding: '8px 16px',
                fontFamily: "'DM Sans', sans-serif",
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
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: T.text }}>
                  Sélection IA du jour
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: T.textSoft }}>
                  Renouvellement dans
                </div>
              </div>
            </div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
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
