/* ═══════════════════════════════════════════════════════════════
   LoveLine — Swipe Card
   Individual draggable profile card with physics & animations
   ═══════════════════════════════════════════════════════════════ */
import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { useTheme } from './useTheme.jsx';

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
        fontFamily: "'DM Sans', sans-serif",
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
          fontFamily: "'DM Sans', sans-serif",
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
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, color: 'rgba(255,255,255,0.75)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            🎓 {profile.university}
          </span>
        )}
        {profile.faculty && (
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, color: 'rgba(255,255,255,0.65)',
          }}>
            · {profile.faculty}
          </span>
        )}
        {profile.distance_km !== undefined && (
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
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
                fontFamily: "'DM Sans', sans-serif",
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
export default function SwipeCard({
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
export function ActionButtons({ onNope, onSuperLike, onLike, onBoost, onRewind,
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
