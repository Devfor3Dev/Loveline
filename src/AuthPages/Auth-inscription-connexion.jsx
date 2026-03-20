import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Lock, Eye, EyeOff, ArrowRight,
    Heart, ChevronLeft
} from 'lucide-react';
import { useAuth } from './AuthContext';
import Navbar from '../pages/nav_bar.jsx';

/* ─── Palette ───────────────────────────────────────────────────────────── */
const C = {
    bg:        '#fff0f5',
    primary:   '#9d174d',
    accent:    '#db2777',
    text:      '#500724',
    white:     '#ffffff',
    gold:      '#d4af37',
    error:     '#be123c',
    success:   '#059669',
};

/* ─── Input field ────────────────────────────────────────────────────────── */
function Field({ icon: Icon, placeholder, type = 'text', value, onChange, error, name }) {
    const [focused, setFocused] = useState(false);
    const [showPwd, setShowPwd]  = useState(false);
    const isPwd = type === 'password';
    const actualType = isPwd ? (showPwd ? 'text' : 'password') : type;
    const hasError = !!error;

    return (
        <div style={{ width: '100%', marginBottom: '4px' }}>
            <motion.div
                animate={{
                    boxShadow: hasError ? `0 0 0 2px ${C.error}55` : focused ? `0 0 0 2px ${C.accent}44, 0 4px 20px rgba(219,39,119,0.1)` : '0 2px 8px rgba(157,23,77,0.06)',
                }}
                transition={{ duration: 0.25 }}
                style={{
                    position: 'relative', display: 'flex', alignItems: 'center',
                    background: focused ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${hasError ? C.error + '66' : focused ? C.accent + '55' : 'rgba(255,255,255,0.75)'}`,
                    borderRadius: '14px', overflow: 'hidden', transition: 'background 0.25s',
                }}
            >
                <div style={{ paddingLeft: '16px', display: 'flex', alignItems: 'center', flexShrink: 0, color: hasError ? C.error : focused ? C.accent : C.primary, opacity: focused || hasError ? 1 : 0.45 }}>
                    <Icon size={16} />
                </div>
                <input
                    name={name} type={actualType} value={value} placeholder={placeholder}
                    onChange={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    style={{ flex: 1, padding: '14px 12px', background: 'transparent', border: 'none', outline: 'none', fontFamily: "'Raleway', sans-serif", fontSize: '14px', color: C.text, width: '100%' }}
                />
                {isPwd && (
                    <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ padding: '0 14px', background: 'none', border: 'none', cursor: 'pointer', color: C.primary, opacity: 0.4 }}>
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                )}
            </motion.div>
            <AnimatePresence>
                {hasError && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ fontFamily: "'Raleway', sans-serif", fontSize: '11px', color: C.error, paddingLeft: '16px', paddingTop: '4px' }}>
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Main Auth Page ─────────────────────────────────────────────────────── */
export default function AuthPage() {
    const navigate = useNavigate();
    const auth = useAuth() || { register: async () => {}, login: async () => {} };
    const { register, login } = auth;

    const [isRegister, setIsRegister] = useState(true); // TRUE = Inscription, FALSE = Connexion
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
    const [errors, setErrors] = useState({});
    const handleLogin = async (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.email)    errs.email    = 'Email requis';
        if (!form.password) errs.password = 'Mot de passe requis';
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        try {
            await login(form.email, form.password);
            navigate('/app');
        } catch (err) {
            setErrors({ password: err.message || 'Identifiants incorrects' });
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.firstName) errs.firstName = 'Prénom requis';
        if (!form.lastName)  errs.lastName  = 'Nom requis';
        if (!form.email)     errs.email     = 'Email requis';
        if (!form.password)  errs.password  = 'Mot de passe requis (min. 8 caractères)';
        if (form.password.length < 8) errs.password = 'Minimum 8 caractères';
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        try {
            await register(form);
            await login(form.email, form.password);  // ← connecte automatiquement
            navigate('/complete-profile');
        } catch (err) {
            setErrors({ email: err.message || "Erreur lors de l'inscription" });
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setErrors({});
        setIsRegister(!isRegister);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
        if (errors[name]) setErrors((err) => ({ ...err, [name]: '' }));
    };

    const BgBlobs = () => (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <motion.div animate={{ scale: [1, 1.08, 1], x: [0, 20, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', width: '600px', height: '600px', top: '-200px', right: '-150px', borderRadius: '50%', background: `radial-gradient(circle, ${C.accent}22 0%, transparent 70%)` }} />
            <motion.div animate={{ scale: [1, 1.1, 1], y: [0, -30, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 3 }} style={{ position: 'absolute', width: '500px', height: '500px', bottom: '-150px', left: '-100px', borderRadius: '50%', background: `radial-gradient(circle, ${C.gold}18 0%, transparent 70%)` }} />
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: C.bg, position: 'relative' }}>

            {/* 🔴 LA MAGIE DU SLIDING DOOR EST ICI (CSS + Media Queries) 🔴 */}
            <style>{`
                /* Conteneur principal */
                .sliding-auth-container {
                    position: relative;
                    width: 100%;
                    max-width: 960px;
                    height: 600px;
                    background: rgba(255,240,245,0.7);
                    backdrop-filter: blur(24px);
                    border-radius: 32px;
                    overflow: hidden;
                    box-shadow: 0 40px 120px rgba(157,23,77,0.14), 0 8px 32px rgba(0,0,0,0.06);
                    border: 1px solid rgba(255,255,255,0.75);
                }

                /* Formulaires (Gauche / Droite) */
                .form-block {
                    position: absolute;
                    top: 0;
                    width: 60%;
                    height: 100%;
                    padding: 50px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    transition: all 0.8s cubic-bezier(0.68, -0.2, 0.265, 1.3);
                }

                /* Panneau coloré par-dessus */
                .overlay-block {
                    position: absolute;
                    top: 0;
                    width: 40%;
                    height: 100%;
                    background: linear-gradient(145deg, #9d174d 0%, #6b0f33 60%, #3d0720 100%);
                    z-index: 10;
                    transition: all 0.8s cubic-bezier(0.68, -0.2, 0.265, 1.3);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 40px;
                }

                /* ======= ETATS DESKTOP (Glisse de gauche à droite) ======= */
                /* Mode CONNEXION (Défaut) */
                .form-login { left: 0; opacity: 1; z-index: 5; pointer-events: auto; }
                .form-register { left: 0%; opacity: 0; z-index: 1; pointer-events: none; }
                .overlay-block { left: 60%; }

                /* Mode INSCRIPTION */
                .sliding-auth-container.is-register .form-login { left: 40%; opacity: 0; z-index: 1; pointer-events: none; }
                .sliding-auth-container.is-register .form-register { left: 40%; opacity: 1; z-index: 5; pointer-events: auto; }
                .sliding-auth-container.is-register .overlay-block { left: 0; }

                /* ======= ETATS MOBILE (Glisse de haut en bas) ======= */
                @media (max-width: 860px) {
                    .sliding-auth-container { height: 780px; }
                    .form-block { width: 100%; height: 65%; left: 0 !important; padding: 40px 24px; }
                    .overlay-block { width: 100%; height: 35%; left: 0 !important; padding: 20px; }

                    /* Mode CONNEXION Mobile */
                    .form-login { top: 0; }
                    .form-register { top: 0; }
                    .overlay-block { top: 65%; } /* Le panneau se cache en bas */

                    /* Mode INSCRIPTION Mobile */
                    .sliding-auth-container.is-register .form-login { top: 35%; }
                    .sliding-auth-container.is-register .form-register { top: 35%; }
                    .sliding-auth-container.is-register .overlay-block { top: 0; } /* Le panneau remonte en haut ! */
                }
            `}</style>

            <BgBlobs />
            <Navbar />

            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px 60px', position: 'relative', zIndex: 1 }}>

                {/* === Le conteneur principal qui gère la classe d'état === */}
                <div className={`sliding-auth-container ${isRegister ? 'is-register' : 'is-login'}`}>

                    {/* 1. BLOC FORMULAIRE : CONNEXION */}
                    <div className="form-block form-login">
                        <div style={{ marginBottom: '32px' }}>
                            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(26px, 3.5vw, 38px)', color: C.text, lineHeight: 1.2 }}>
                                Accède à ton<br /><em style={{ fontStyle: 'italic', color: C.primary }}>espace</em>
                            </h1>
                        </div>
                        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleLogin}>
                            <Field icon={Mail} name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} error={errors.email} />
                            <Field icon={Lock} name="password" type="password" placeholder="Mot de passe" value={form.password} onChange={handleChange} error={errors.password} />
                            <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: 0.98 }} style={{ marginTop: '10px', padding: '16px', borderRadius: '14px', background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, color: C.white, border: 'none', fontFamily: "'Raleway', sans-serif", fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 8px 20px rgba(157,23,77,0.2)' }}>
                                {loading ? 'Connexion…' : 'Se connecter'}
                            </motion.button>
                        </form>
                    </div>

                    {/* 2. BLOC FORMULAIRE : INSCRIPTION */}
                    <div className="form-block form-register">
                        <div style={{ marginBottom: '32px' }}>
                            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(26px, 3.5vw, 38px)', color: C.text, lineHeight: 1.2 }}>
                                Crée ton<br /><em style={{ fontStyle: 'italic', color: C.primary }}>compte</em>
                            </h1>
                        </div>
                        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleRegister}>
                            <div style={{ display: 'flex', gap: '12px' }}>

                            </div>
                            <Field icon={User} name="firstName" placeholder="Prénom" value={form.firstName} onChange={handleChange} error={errors.firstName} />
                            <Field icon={User} name="lastName" placeholder="Nom" value={form.lastName} onChange={handleChange} error={errors.lastName} />
                            <Field icon={Mail} name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} error={errors.email} />
                            <Field icon={Lock} name="password" type="password" placeholder="Mot de passe" value={form.password} onChange={handleChange} error={errors.password} />
                            <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: 0.98 }} style={{ marginTop: '10px', padding: '16px', borderRadius: '14px', background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, color: C.white, border: 'none', fontFamily: "'Raleway', sans-serif", fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 8px 20px rgba(157,23,77,0.2)' }}>
                                {loading ? 'Inscription…' : "S'inscrire"}
                            </motion.button>
                        </form>
                    </div>

                    {/* 3. LE PANNEAU COULISSANT (L'overlay sombre) */}
                    <div className="overlay-block">
                        <div style={{ position: 'absolute', width: '250px', height: '250px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', top: '-40px', left: '-40px' }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <Heart size={22} style={{ color: C.gold }} strokeWidth={1.3} />
                            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', color: C.white }}>LoveLine</span>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div key={isRegister ? 'reg' : 'log'} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
                                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 3vw, 44px)', color: C.white, marginBottom: '16px' }}>
                                    {isRegister ? <><em style={{ color: C.gold, fontStyle: 'italic' }}>Rejoins</em><br />l'aventure.</> : <>Bon retour<br /><em style={{ color: C.gold, fontStyle: 'italic' }}>parmi nous.</em></>}
                                </h2>
                                <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.6)', maxWidth: '200px', margin: '0 auto' }}>
                                    {isRegister ? "Des milliers d'étudiants t'attendent déjà." : "Reconnecte-toi à ta communauté."}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        <div style={{ marginTop: '40px' }}>
                            <motion.button
                                onClick={toggleMode}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '40px', padding: '10px 22px', fontFamily: "'Raleway', sans-serif", fontSize: '12px', fontWeight: 600, color: C.white, cursor: 'pointer', textTransform: 'uppercase'
                                }}
                            >
                                {isRegister ? 'Se connecter' : "S'inscrire"} <ArrowRight size={13} />
                            </motion.button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
