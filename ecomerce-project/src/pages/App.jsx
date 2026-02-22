import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';

import { AuthProvider } from '../AuthPages/AuthContext';
import { ProtectedRoute, GuestRoute } from '../AuthPages/ProtectedRoute';
import AuthPage from '../AuthPages/Auth-inscription-connexion.jsx';

// Landing components
import IntroAnimation from './IntroAnimation';
import Navbar         from './nav_bar.jsx';
import Hero           from './hero';
import PhotoStrip     from './PhotoStrip';
import Features       from './Features';
import RopeGallery    from './RopeGalerry';
import Testimonials   from './temoignage.jsx';
import Pricing        from './prix.jsx';
import Footer         from './Footer';

/* ─── Wrapper reveal au scroll ─────────────────────────────────────────── */
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

/* ─── Landing Page ─────────────────────────────────────────────────────── */
function LandingPage() {
    const [introComplete, setIntroComplete] = useState(false);

    return (
        <>
            <AnimatePresence>
                {!introComplete && (
                    <IntroAnimation onComplete={() => setIntroComplete(true)} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {introComplete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                        style={{ minHeight: '100vh', background: 'var(--bg)' }}
                    >
                        <Navbar />
                        <motion.div
                            initial={{ opacity: 0, y: 56 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.1, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
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

/* ─── Placeholder /complete-profile ───────────────────────────────────── */
function ProfileCompletionPlaceholder() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg)',
            fontFamily: 'var(--font-display)',
            fontSize: '32px', fontStyle: 'italic',
            color: 'var(--primary)',
        }}>
            Complétion de profil — bientôt 🌸
        </div>
    );
}

/* ─── Placeholder /app ─────────────────────────────────────────────────── */
function AppPlaceholder() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg)',
            fontFamily: 'var(--font-display)',
            fontSize: '32px', fontStyle: 'italic',
            color: 'var(--primary)',
        }}>
            App LoveLine — bientôt 💕
        </div>
    );
}

/* ─── Root App ─────────────────────────────────────────────────────────── */
export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Landing — publique */}
                    <Route path="/" element={<LandingPage />} />

                    {/* Auth — redirige vers /app si déjà connecté */}
                    <Route
                        path="/auth"
                        element={
                            <GuestRoute>
                                <AuthPage />
                            </GuestRoute>
                        }
                    />

                    {/* Complétion de profil — requiert auth */}
                    <Route
                        path="/complete-profile"
                        element={
                            <ProtectedRoute>
                                <ProfileCompletionPlaceholder />
                            </ProtectedRoute>
                        }
                    />

                    {/* App principale — requiert auth */}
                    <Route
                        path="/app/*"
                        element={
                            <ProtectedRoute>
                                <AppPlaceholder />
                            </ProtectedRoute>
                        }
                    />

                    {/* Toute autre URL → landing */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}