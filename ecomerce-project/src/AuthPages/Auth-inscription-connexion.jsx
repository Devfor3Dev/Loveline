import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Lock, Eye, EyeOff, ArrowRight,
    CheckCircle, Heart, Sparkles, ChevronLeft
} from 'lucide-react';
import { useAuth } from './AuthContext'; // Assure-toi que ce fichier existe bien
import Navbar from '../pages/nav_bar.jsx';

/* ─── Palette & tokens ───────────────────────────────────────────────────── */
const C = {
    bg:        '#fff0f5',
    primary:   '#9d174d',
    accent:    '#db2777',
    text:      '#500724',
    secondary: '#fce7f3',
    white:     '#ffffff',
    gold:      '#d4af37',
    error:     '#be123c',
    success:   '#059669',
};

/* ─── Particles de célébration ───────────────────────────────────────────── */
const PARTICLE_SHAPES = ['♥', '✦', '✿', '★', '❋', '♡'];
const PARTICLE_COLORS = [C.accent, C.gold, C.primary, '#f472b6', '#fbbf24', '#e879f9'];

function CelebrationParticles({ active }) {
    // Optimisation mobile : moins de particules sur petit écran
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const count = isMobile ? 12 : 28;

    const particles = Array.from({ length: count }, (_, i) => ({
        id: i,
        shape: PARTICLE_SHAPES[i % PARTICLE_SHAPES.length],
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        x:     Math.random() * 100,
        delay: Math.random() * 0.6,
        scale: 0.6 + Math.random() * 1,
        drift: (Math.random() - 0.5) * 160,
        dur:   1.2 + Math.random() * 1,
    }));

    return (
        <AnimatePresence>
            {active && (
                <div style={{
                    position: 'fixed', inset: 0,
                    pointerEvents: 'none', zIndex: 9998,
                    overflow: 'hidden',
                }}>
                    {particles.map((p) => (
                        <motion.div
                            key={p.id}
                            initial={{
                                opacity: 1, y: '100vh', x: `${p.x}vw`,
                                scale: p.scale, rotate: 0,
                            }}
                            animate={{
                                opacity: [1, 1, 0], y: '-20vh',
                                x: `calc(${p.x}vw + ${p.drift}px)`,
                                rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                            }}
                            transition={{ duration: p.dur, delay: p.delay, ease: [0.2, 0, 0.8, 1] }}
                            style={{
                                position: 'absolute', bottom: 0,
                                fontSize: `${14 + p.scale * 10}px`,
                                color: p.color, userSelect: 'none',
                            }}
                        >
                            {p.shape}
                        </motion.div>
                    ))}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.18, 0] }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        style={{
                            position: 'absolute', inset: 0,
                            background: `radial-gradient(ellipse at 50% 60%, ${C.accent}55, transparent 70%)`,
                        }}
                    />
                </div>
            )}
        </AnimatePresence>
    );
}

/* ─── Success overlay ──────────────────────────────────── */
function SuccessOverlay({ visible, firstName }) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9997,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,240,245,0.85)',
                        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <motion.div
                            animate={{ scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] }}
                            transition={{ duration: 0.8, repeat: 2, ease: 'easeInOut' }}
                            style={{ fontSize: '72px', marginBottom: '16px' }}
                        >💕</motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            style={{
                                fontFamily: "'Cormorant Garamond', Georgia, serif",
                                fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 300,
                                color: C.primary, lineHeight: 1.2, marginBottom: '12px',
                            }}
                        >Bienvenue, <em style={{ fontStyle: 'italic', color: C.accent }}>{firstName}</em> !</motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            style={{
                                fontFamily: "'Raleway', sans-serif", fontSize: '15px',
                                fontWeight: 300, color: C.text, opacity: 0.7, marginBottom: '32px',
                            }}
                        >Ton histoire d'amour commence maintenant ✨</motion.p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

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
                    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                    border: `1px solid ${hasError ? C.error + '66' : focused ? C.accent + '55' : 'rgba(255,255,255,0.75)'}`,
                    borderRadius: '14px', overflow: 'hidden', transition: 'background 0.25s',
                }}
            >
                <div style={{
                    paddingLeft: '16px', display: 'flex', alignItems: 'center', flexShrink: 0,
                    color: hasError ? C.error : focused ? C.accent : C.primary,
                    opacity: focused || hasError ? 1 : 0.45, transition: 'color 0.25s, opacity 0.25s',
                }}><Icon size={16} /></div>

                <input
                    name={name} type={actualType} value={value} placeholder={placeholder}
                    onChange={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    style={{
                        flex: 1, padding: '14px 12px', background: 'transparent', border: 'none',
                        outline: 'none', fontFamily: "'Raleway', sans-serif", fontSize: '14px',
                        fontWeight: 400, color: C.text, letterSpacing: '0.02em', width: '100%',
                    }}
                />
                {isPwd && (
                    <button
                        type="button" onClick={() => setShowPwd(!showPwd)}
                        style={{
                            padding: '0 14px', background: 'none', border: 'none', cursor: 'pointer',
                            color: C.primary, opacity: 0.4, display: 'flex', alignItems: 'center',
                            transition: 'opacity 0.2s',
                        }}
                    >
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                )}
            </motion.div>
            <AnimatePresence>
                {hasError && (
                    <motion.p
                        initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -4, height: 0 }}
                        style={{
                            fontFamily: "'Raleway', sans-serif", fontSize: '11px', fontWeight: 500,
                            color: C.error, paddingLeft: '16px', paddingTop: '4px', letterSpacing: '0.03em',
                        }}
                    >{error}</motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Password strength ───────────────────────────────────────── */
function PasswordStrength({ password }) {
    if (!password) return null;
    const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
    const score = checks.filter(Boolean).length;
    const labels = ['Faible', 'Moyen', 'Bien', 'Fort'];
    const colors = [C.error, '#f59e0b', '#3b82f6', C.success];

    return (
        <div style={{ paddingLeft: '4px', marginBottom: '4px' }}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                {[0,1,2,3].map((i) => (
                    <motion.div key={i} animate={{ backgroundColor: i < score ? colors[score - 1] : 'rgba(157,23,77,0.1)' }} transition={{ duration: 0.3 }} style={{ flex: 1, height: '3px', borderRadius: '2px' }} />
                ))}
            </div>
            <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: '11px', fontWeight: 500, color: score > 0 ? colors[score - 1] : C.text, letterSpacing: '0.05em' }}>
                {score > 0 ? `Mot de passe ${labels[score - 1]}` : ''}
            </span>
        </div>
    );
}

/* ─── Main Auth Page ─────────────────────────────────────────────────────── */
export default function AuthPage() {
    const navigate = useNavigate();
    // Sécurité au cas où useAuth n'est pas encore prêt
    const auth = useAuth() || { register: async () => {}, login: async () => {} };
    const { register, login } = auth;

    const [mode, setMode] = useState('login');
    const [sliding, setSliding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [celebrate, setCelebrate] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successName, setSuccessName] = useState('');
    const [apiError, setApiError] = useState('');

    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
    const [errors, setErrors] = useState({});

    const isRegister = mode === 'register';

    const switchMode = (next) => {
        if (sliding || mode === next) return;
        setSliding(true); setErrors({}); setApiError('');
        setTimeout(() => { setMode(next); setSliding(false); }, 400);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
        if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
        if (apiError) setApiError('');
    };

    const validate = () => {
        const e = {};
        if (isRegister) {
            if (!form.firstName.trim()) e.firstName = 'Prénom requis';
            if (!form.lastName.trim()) e.lastName = 'Nom requis';
            if (form.confirm !== form.password) e.confirm = 'Les mots de passe ne correspondent pas';
        }
        if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide';
        if (form.password.length < 8) e.password = 'Minimum 8 caractères';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true); setApiError('');
        try {
            if (isRegister) {
                const user = await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password });
                setSuccessName(user?.firstName || form.firstName);
                setCelebrate(true); setShowSuccess(true);
                setTimeout(() => {
                    setCelebrate(false); setShowSuccess(false); navigate('/complete-profile');
                }, 3200);
            } else {
                const user = await login({ email: form.email, password: form.password });
                navigate(user?.profileComplete ? '/app' : '/complete-profile');
            }
        } catch (err) {
            setApiError(err?.message || 'Une erreur est survenue. Réessaie.');
        } finally {
            setLoading(false);
        }
    };

    const BgBlobs = () => (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <motion.div animate={{ scale: [1, 1.08, 1], x: [0, 20, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', width: '600px', height: '600px', top: '-200px', right: '-150px', borderRadius: '50%', background: `radial-gradient(circle, ${C.accent}22 0%, transparent 70%)` }} />
            <motion.div animate={{ scale: [1, 1.1, 1], y: [0, -30, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 3 }} style={{ position: 'absolute', width: '500px', height: '500px', bottom: '-150px', left: '-100px', borderRadius: '50%', background: `radial-gradient(circle, ${C.gold}18 0%, transparent 70%)` }} />
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: C.bg, position: 'relative' }}>

            {/* 🔴 LE BLOC CSS QUI SAUVE LE RESPONSIVE 🔴 */}
            <style>{`
                @media (max-width: 860px) {
                    .auth-card {
                        flex-direction: column !important;
                        width: 100% !important;
                        height: auto !important;
                        min-height: auto !important;
                        margin-top: 40px !important;
                    }
                    .auth-left-panel {
                        flex: none !important;
                        width: 100% !important;
                        padding: 40px 24px !important;
                        align-items: center !important;
                        text-align: center !important;
                    }
                    .auth-right-panel {
                        padding: 30px 20px 40px 20px !important;
                    }
                    .bottom-quote { display: none !important; }
                    .back-button { align-self: center !important; margin-bottom: 20px !important; }
                }
            `}</style>

            <BgBlobs />
            <Navbar />
            <CelebrationParticles active={celebrate} />
            <SuccessOverlay visible={showSuccess} firstName={successName} />

            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px 60px', position: 'relative', zIndex: 1 }}>

                {/* ── CARTE PRINCIPALE ── */}
                <motion.div
                    className="auth-card"
                    initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
                    style={{
                        width: '100%', maxWidth: '960px', minHeight: '580px', display: 'flex',
                        borderRadius: '32px', overflow: 'hidden',
                        boxShadow: '0 40px 120px rgba(157,23,77,0.14), 0 8px 32px rgba(0,0,0,0.06)',
                        border: '1px solid rgba(255,255,255,0.75)',
                    }}
                >
                    {/* ── PANNEAU GAUCHE ── */}
                    <motion.div
                        className="auth-left-panel"
                        animate={{ flex: isRegister ? '0 0 38%' : '0 0 42%' }}
                        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                        style={{
                            background: `linear-gradient(145deg, ${C.primary} 0%, #6b0f33 60%, #3d0720 100%)`,
                            padding: '56px 44px', display: 'flex', flexDirection: 'column',
                            justifyContent: 'space-between', position: 'relative', overflow: 'hidden', flexShrink: 0,
                        }}
                    >
                        <div style={{ position: 'absolute', width: '320px', height: '320px', borderRadius: '50%', border: '1px solid rgba(212,175,55,0.15)', bottom: '-80px', right: '-80px' }} />

                        <button
                            className="back-button"
                            onClick={() => navigate('/')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer',
                                fontFamily: "'Raleway', sans-serif", fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase',
                                color: 'rgba(255,255,255,0.45)', transition: 'color 0.2s', alignSelf: 'flex-start',
                            }}
                        >
                            <ChevronLeft size={13} /> Accueil
                        </button>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', justifyContent: 'center' }}>
                                <Heart size={22} style={{ color: C.gold }} strokeWidth={1.3} />
                                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '24px', color: C.white }}>LoveLine</span>
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div key={mode} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4 }}>
                                    <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(28px, 3vw, 44px)', fontWeight: 300, color: C.white, lineHeight: 1.2, marginBottom: '16px' }}>
                                        {isRegister ? <><em style={{ color: C.gold, fontStyle: 'italic' }}>Rejoins</em><br />l'aventure.</> : <>Bon retour<br /><em style={{ color: C.gold, fontStyle: 'italic' }}>parmi nous.</em></>}
                                    </h2>
                                    <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, maxWidth: '220px', margin: '0 auto' }}>
                                        {isRegister ? "Des milliers d'étudiants t'attendent déjà. Ta moitié est peut-être à un clic." : 'Reconnecte-toi à ta communauté. Tes matchs t\'ont attendu.'}
                                    </p>
                                </motion.div>
                            </AnimatePresence>

                            <div style={{ marginTop: '40px' }}>
                                <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>
                                    {isRegister ? 'Déjà un compte ?' : 'Pas encore inscrit ?'}
                                </p>
                                <motion.button
                                    onClick={() => switchMode(isRegister ? 'login' : 'register')}
                                    whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)',
                                        backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '40px',
                                        padding: '10px 22px', fontFamily: "'Raleway', sans-serif", fontSize: '12px', fontWeight: 600, color: C.white, cursor: 'pointer',
                                    }}
                                >
                                    {isRegister ? 'Se connecter' : "S'inscrire"} <ArrowRight size={13} />
                                </motion.button>
                            </div>
                        </div>

                        <p className="bottom-quote" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '13px', color: `${C.gold}88`, lineHeight: 1.6 }}>
                            "L'amour commence là<br />où la peur s'arrête."
                        </p>
                    </motion.div>

                    {/* ── PANNEAU DROIT (FORMULAIRE COMPLET) ── */}
                    <div
                        className="auth-right-panel"
                        style={{
                            flex: 1, background: 'rgba(255,240,245,0.7)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                            padding: 'clamp(32px, 5vw, 56px) clamp(24px, 5vw, 56px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto',
                        }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div key={mode} initial={{ opacity: 0, x: sliding ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.4 }}>

                                <div style={{ marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <div style={{ width: '24px', height: '1px', background: `linear-gradient(90deg, ${C.gold}, transparent)` }} />
                                        <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.accent }}>
                                            {isRegister ? 'Inscription' : 'Connexion'}
                                        </span>
                                    </div>
                                    <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 300, color: C.text, lineHeight: 1.2 }}>
                                        {isRegister ? <>Crée ton<br /><em style={{ fontStyle: 'italic', color: C.primary }}>compte</em></> : <>Accède à ton<br /><em style={{ fontStyle: 'italic', color: C.primary }}>espace</em></>}
                                    </h1>
                                </div>

                                {/* Le formulaire reconstitué */}
                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                    {isRegister && (
                                        <div style={{ display: 'flex', gap: '12px', flexDirection: 'row', flexWrap: 'wrap' }}>
                                            <div style={{ flex: '1 1 120px' }}>
                                                <Field icon={User} name="firstName" placeholder="Prénom" value={form.firstName} onChange={handleChange} error={errors.firstName} />
                                            </div>
                                            <div style={{ flex: '1 1 120px' }}>
                                                <Field icon={User} name="lastName" placeholder="Nom" value={form.lastName} onChange={handleChange} error={errors.lastName} />
                                            </div>
                                        </div>
                                    )}

                                    <Field icon={Mail} name="email" type="email" placeholder="Email universitaire" value={form.email} onChange={handleChange} error={errors.email} />
                                    <Field icon={Lock} name="password" type="password" placeholder="Mot de passe" value={form.password} onChange={handleChange} error={errors.password} />

                                    {isRegister && (
                                        <>
                                            <PasswordStrength password={form.password} />
                                            <Field icon={Lock} name="confirm" type="password" placeholder="Confirmer mot de passe" value={form.confirm} onChange={handleChange} error={errors.confirm} />
                                        </>
                                    )}

                                    {apiError && (
                                        <p style={{ color: C.error, fontSize: '12px', textAlign: 'center', fontFamily: "'Raleway', sans-serif" }}>
                                            {apiError}
                                        </p>
                                    )}

                                    <motion.button
                                        type="submit"
                                        disabled={loading}
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        style={{
                                            marginTop: '10px', width: '100%', padding: '16px', borderRadius: '14px',
                                            background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, color: C.white,
                                            border: 'none', fontFamily: "'Raleway', sans-serif", fontSize: '13px', fontWeight: 600,
                                            letterSpacing: '0.1em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
                                            boxShadow: '0 8px 20px rgba(157,23,77,0.2)', opacity: loading ? 0.7 : 1,
                                        }}
                                    >
                                        {loading ? 'Chargement...' : (isRegister ? "S'inscrire" : "Se connecter")}
                                    </motion.button>
                                </form>

                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}