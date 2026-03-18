/* ═══════════════════════════════════════════════════════════════
   LoveLine — Account & Security Tab
   Password, email, logout, delete account
   ═══════════════════════════════════════════════════════════════ */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './useTheme.jsx';
import { authAPI, profileAPI } from './api.js';

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, hint, T, isDark }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700,
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
            fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: T.text,
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
      {hint && <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.textMuted, marginTop: 5, lineHeight: 1.5 }}>{hint}</p>}
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
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: T.textSoft, lineHeight: 1.7, marginBottom: 24 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '13px', borderRadius: 50,
            border: `1px solid ${T.gold}44`, background: 'none',
            color: T.textSoft, fontFamily: "'DM Sans',sans-serif",
            fontSize: 13, cursor: 'pointer',
          }}>Annuler</button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onConfirm} style={{
            flex: 1, padding: '13px', borderRadius: 50, border: 'none',
            background: danger ? '#F44336' : `linear-gradient(135deg,${T.gold},${T.goldDark})`,
            color: danger ? '#fff' : '#1A0812',
            fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>{confirmLabel}</motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ACCOUNT TAB — Main export
// ══════════════════════════════════════════════════════════════════════════════
export default function AccountTab({ onBack, onLogout, T: _T, isDark: _isDark }) {
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
              fontFamily: "'DM Sans',sans-serif", fontSize: 13,
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
              <h3 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.textSoft, marginBottom: 4 }}>
                Sécurité
              </h3>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.textMuted, lineHeight: 1.5, marginBottom: 16 }}>
                Gardez votre compte protégé. Un mot de passe fort est la première barrière de votre intimité.
              </p>

              {/* Change password */}
              <div onClick={() => setSection('password')} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 0', borderBottom: `1px solid ${T.gold}11`, cursor: 'pointer',
              }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${T.gold}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>🔐</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, color: T.text }}>Changer le mot de passe</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.textMuted, marginTop: 2 }}>Dernière modification : récemment</div>
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
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, color: T.text }}>Changer l'adresse email</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.textMuted, marginTop: 2 }}>Votre email est votre clé de connexion</div>
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
              <h3 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.textSoft, marginBottom: 16 }}>
                Priorité UK
              </h3>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.textMuted, lineHeight: 1.6, marginBottom: 16 }}>
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
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: T.text }}>{item.label}</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.textMuted, marginTop: 2 }}>{item.sub}</div>
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
              <h3 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(244,67,54,0.70)', marginBottom: 4 }}>
                Zone sensible
              </h3>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.textMuted, lineHeight: 1.6, marginBottom: 20 }}>
                Ces actions sont irréversibles. Chaque décision mérite réflexion.
              </p>

              {/* Logout */}
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={() => setConfirmDialog('logout')}
                style={{
                  width: '100%', padding: '14px', borderRadius: 50,
                  border: `1.5px solid ${T.gold}55`,
                  background: 'none', color: T.text,
                  fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600,
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
                  fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                <span>💔</span> Supprimer mon compte définitivement
              </motion.button>

              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.textMuted, lineHeight: 1.6, marginTop: 14, textAlign: 'center' }}>
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
                  color: '#1A0812', fontFamily: "'DM Sans',sans-serif",
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
                  color: '#1A0812', fontFamily: "'DM Sans',sans-serif",
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
