
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './useTheme.jsx';
import { exploreAPI, discoverAPI } from './api.js';

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
          fontFamily: "'DM Sans', sans-serif",
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
            fontFamily: "'DM Sans', sans-serif",
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
            fontFamily: "'DM Sans', sans-serif",
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
          fontFamily: "'DM Sans', sans-serif",
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
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: T.text }}>
                    {profile.university}
                  </div>
                  {profile.faculty && (
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: T.textSoft }}>
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
                  fontFamily: "'DM Sans', sans-serif",
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
                      fontFamily: "'DM Sans', sans-serif",
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
              fontFamily: "'DM Sans', sans-serif",
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
                fontFamily: "'DM Sans', sans-serif",
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
export default function ExploreTab() {
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
            fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
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
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.textSoft }}>Âge minimum</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, color:T.gold }}>{ageRange[0]} ans</span>
            </div>
            <input type="range" min={18} max={ageRange[1]-1} value={ageRange[0]}
              onChange={e => setAgeRange([+e.target.value, ageRange[1]])}
              style={{ width:'100%', accentColor:T.gold, marginBottom:16 }} />
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.textSoft }}>Âge maximum</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, color:T.gold }}>{ageRange[1]} ans</span>
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
            fontFamily: "'DM Sans', sans-serif",
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
            fontFamily: "'DM Sans', sans-serif",
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
            fontFamily: "'DM Sans', sans-serif",
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
                      fontFamily: "'DM Sans', sans-serif",
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
