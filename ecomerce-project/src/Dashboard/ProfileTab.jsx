
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './useTheme.jsx';
import { profileAPI, subscriptionAPI } from './api.js';
import { PremiumModal } from './Modals.jsx';

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
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 17, fontWeight: 800, color: T.gold }}>{percent}%</span>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 7, color: T.textSoft, letterSpacing: '0.1em', textTransform: 'uppercase' }}>complet</span>
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
        fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: T.textSoft, marginBottom: hint ? 6 : 16,
      }}>{title}</h3>
      {hint && <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.textMuted, lineHeight: 1.6, marginBottom: 16 }}>{hint}</p>}
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
          fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600,
          color: danger ? '#F44336' : T.text,
        }}>{label}</div>
        {sub && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.textMuted, marginTop: 2, lineHeight: 1.5 }}>{sub}</div>}
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
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textSoft }}>
          Photos ({photos.length}/{MAX})
        </div>
        <button onClick={() => inputRef.current?.click()} style={{
          background: `${T.gold}22`, border: `1px solid ${T.gold}55`,
          color: T.gold, borderRadius: 10, padding: '5px 12px',
          fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, cursor: 'pointer',
        }}>+ Ajouter</button>
      </div>
      <input ref={inputRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
        onChange={e => {
          const fd = new FormData();
          Array.from(e.target.files).forEach(f => fd.append('photo', f));
          onUpload(fd);
        }} />
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.textMuted, lineHeight: 1.6, marginBottom: 14 }}>
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
                      fontFamily: "'DM Sans',sans-serif", fontSize: 8, fontWeight: 800,
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
                        fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: '#1A0812', fontWeight: 700,
                      }}>★</button>
                    )}
                    <button onClick={e => { e.stopPropagation(); onDelete(p.id); }} style={{
                      background: 'rgba(244,67,54,0.85)', border: 'none', borderRadius: 7,
                      padding: '3px 7px', cursor: 'pointer', color: '#fff',
                      fontFamily: "'DM Sans',sans-serif", fontSize: 9,
                    }}>✕</button>
                  </div>
                </>
              ) : (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <span style={{ fontSize: 20, opacity: 0.3 }}>+</span>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: T.textMuted }}>Ajouter</span>
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
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, color: '#1565C0' }}>
          Profil Vérifié ✓
        </div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.textSoft }}>
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
      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, color: '#E65100', marginBottom: 4 }}>
        ⏳ Vérification en cours
      </div>
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.textSoft, lineHeight: 1.6 }}>
        Ton dossier est entre les mains de notre équipe. La vérification prend généralement 24 à 48h.
        Un badge bleu ornera bientôt ton profil — la marque des âmes authentiques.
      </p>
    </div>
  );

  return (
    <div>
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.textSoft, lineHeight: 1.6, marginBottom: 16 }}>
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
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
          fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.textSoft,
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
            fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700,
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
export default function ProfileTab({ onNavigateAccount, isPremium, onToggleTheme, isDark: _isDark }) {
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
              fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.textSoft,
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
                fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700,
                color: subscription.plan === 'eternite' ? T.rose : T.gold,
              }}>
                LoveLine {subscription.plan === 'eternite' ? 'Éternité' : 'Gold'}
              </div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.textMuted }}>
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
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: T.text }}>
                Élevez votre expérience
              </div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.textSoft }}>
                Voir qui vous a liké, Super Likes illimités...
              </div>
            </div>
            <div style={{
              background: `linear-gradient(135deg,${T.gold},${T.goldDark})`,
              color: '#1A0812', padding: '6px 14px', borderRadius: 20,
              fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 800,
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
              fontFamily: "'DM Sans',sans-serif",
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
              <div style={{ textAlign: 'right', fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: T.textMuted, marginTop: 4 }}>
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
                        fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600,
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
                fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gold,
                cursor: 'pointer',
              }}>
                {showAllInterests ? 'Voir moins' : `Voir tout (${ALL_INTERESTS.length})`}
              </button>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.textMuted, marginTop: 8 }}>
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
                  <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: T.textSoft }}>
                    Âge recherché
                  </label>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gold, fontWeight: 700 }}>
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
                  <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: T.textSoft }}>
                    Distance maximale
                  </label>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gold, fontWeight: 700 }}>
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
                <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: T.textSoft, display: 'block', marginBottom: 10 }}>
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
                      fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, cursor: 'pointer',
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
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.text }}>
                    {faculty}
                  </span>
                  <Toggle
                    value={hiddenFaculties.includes(faculty)}
                    onChange={() => toggleHiddenFaculty(faculty)}
                    T={T}
                  />
                </div>
              ))}
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.textMuted, marginTop: 10, lineHeight: 1.6 }}>
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
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.text }}>Sauvegarde...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {showPremium && (
        <PremiumModal feature="default" onClose={() => setShowPremium(false)} onSubscribe={() => setShowPremium(false)} />
      )}
    </div>
  );
}
