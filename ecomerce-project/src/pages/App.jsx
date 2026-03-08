/* ═══════════════════════════════════════════════════════════════
   ───────────────────────────────────────────────────────────────
   MODE ACTUEL : développement (pas de barrière d'authentification)
   Pour activer l'auth en production → voir section "DÉPLOIEMENT"
   en bas de ce fichier.
   ═══════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Auth ─────────────────────────────────────────────────────────────────────
import { AuthProvider } from '../AuthPages/AuthContext';
import { ProtectedRoute, GuestRoute } from '../AuthPages/Protectedroute';
import AuthPage from '../AuthPages/Auth-inscription-connexion.jsx';
import CompleteProfile from '../AuthPages/Completeprofile.jsx';

// ─── Dashboard ────────────────────────────────────────────────────────────────
import Dashboard from '../Dashboard/Loveline.jsx';

// ─── Landing page ─────────────────────────────────────────────────────────────
import IntroAnimation from './IntroAnimation';
import Navbar         from './nav_bar.jsx';
import Hero           from './hero';
import PhotoStrip     from './photostrip.jsx';
import Features       from './Features';
import RopeGallery    from './RopeGalerry';
import Testimonials   from './temoignage.jsx';
import Pricing        from './prix.jsx';
import Footer         from './footer.jsx';

// ─── Reveal animation ─────────────────────────────────────────────────────────
function RevealSection({ children, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            {children}
        </motion.div>
    );
}

// ─── Landing page ─────────────────────────────────────────────────────────────
function LandingPage() {
    const [introComplete, setIntroComplete] = useState(false);
    return (
        <>
            <AnimatePresence>
                {!introComplete && <IntroAnimation onComplete={() => setIntroComplete(true)} />}
            </AnimatePresence>
            <AnimatePresence>
                {introComplete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.9 }}
                        style={{ minHeight: '100vh', background: 'var(--bg)' }}
                    >
                        <Navbar />
                        <motion.div
                            initial={{ opacity: 0, y: 56 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.1, delay: 0.2 }}
                        >
                            <Hero />
                        </motion.div>
                        <RevealSection delay={0.05}><PhotoStrip /></RevealSection>
                        <RevealSection delay={0.08}><Features /></RevealSection>
                        <RevealSection delay={0.05}><RopeGallery /></RevealSection>
                        <RevealSection delay={0.05}><Testimonials /></RevealSection>
                        <RevealSection delay={0.05}><Pricing /></RevealSection>
                        <RevealSection><Footer /></RevealSection>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// APP — MODE DÉVELOPPEMENT (pas de barrière d'auth)
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Landing */}
                    <Route path="/" element={<LandingPage />} />

                    {/* Auth */}
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/complete-profile" element={<CompleteProfile />} />

                    {/* ─────────────────────────────────────────────────────────
                        MODE DEV : /app accessible sans connexion
                        Pour protéger en production → voir section DÉPLOIEMENT
                    ───────────────────────────────────────────────────────── */}
                    <Route
                        path="/app/*"
                        element={<Dashboard onLogout={() => window.location.href = '/'} />}
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}


/* ═══════════════════════════════════════════════════════════════
   DÉPLOIEMENT — Comment réactiver la protection des routes
   ───────────────────────────────────────────────────────────────
   Quand tu veux mettre en production, remplace simplement
   la route /app et /auth par les versions protégées ci-dessous.

   ÉTAPE 1 — Protéger /app (accès réservé aux connectés) :

        <Route
            path="/app/*"
            element={
                <ProtectedRoute>
                    <Dashboard onLogout={() => window.location.href = '/'} />
                </ProtectedRoute>
            }
        />

   ÉTAPE 2 — Protéger /auth (redirige si déjà connecté) :

        <Route
            path="/auth"
            element={
                <GuestRoute>
                    <AuthPage />
                </GuestRoute>
            }
        />

   ÉTAPE 3 — Protéger /complete-profile :

        <Route
            path="/complete-profile"
            element={
                <ProtectedRoute>
                    <CompleteProfile />
                </ProtectedRoute>
            }
        />

   C'est tout. Les composants ProtectedRoute et GuestRoute
   dans Protectedroute.jsx gèrent déjà toute la logique.
   ═══════════════════════════════════════════════════════════════ */