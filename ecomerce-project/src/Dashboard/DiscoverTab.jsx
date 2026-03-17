
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './useTheme.jsx';
import SwipeCard, { ActionButtons } from './SwipeCard.jsx';
import { MatchModal, PremiumModal } from './Modals.jsx';
import { discoverAPI, profileAPI, subscriptionAPI } from './api.js';

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
            fontFamily: "'DM Sans', sans-serif",
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
          fontFamily: "'DM Sans', sans-serif",
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
        fontFamily: "'DM Sans', sans-serif",
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
          fontFamily: "'DM Sans', sans-serif",
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
                fontFamily: "'DM Sans', sans-serif",
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
                fontFamily: "'DM Sans', sans-serif",
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
                fontFamily: "'DM Sans', sans-serif",
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
                      fontFamily: "'DM Sans', sans-serif",
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
                fontFamily: "'DM Sans', sans-serif",
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
export default function DiscoverTab({ myProfile, isPremium, onNavigateMessages }) {
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
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: T.textSoft }}>
              Connexion impossible
            </p>
            <button onClick={() => loadProfiles(filters)} style={{
              padding: '12px 24px', borderRadius: 50,
              background: T.gold, color: '#1A0812',
              border: 'none', fontWeight: 700, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
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
              fontFamily: "'DM Sans', sans-serif",
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
