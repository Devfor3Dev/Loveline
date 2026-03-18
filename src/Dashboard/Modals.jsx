/* ═══════════════════════════════════════════════════════════════
   LoveLine — Match & Premium Modals
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { useTheme } from './useTheme.jsx';

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
export function MatchModal({ match, onClose, onMessage }) {
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
                fontFamily: "'DM Sans', sans-serif",
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
                fontFamily: "'DM Sans', sans-serif",
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

export function PremiumModal({ feature, onClose, onSubscribe }) {
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
              fontFamily: "'DM Sans', sans-serif",
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
                    fontFamily: "'DM Sans', sans-serif",
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
                      fontFamily: "'DM Sans', sans-serif",
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
                      fontFamily: "'DM Sans', sans-serif",
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
                  fontFamily: "'DM Sans', sans-serif",
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
            fontFamily: "'DM Sans', sans-serif",
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
