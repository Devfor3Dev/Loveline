/* ═══════════════════════════════════════════════════════════════════════
   LoveLine — ProtectedRoute.jsx
   ProtectedRoute : redirige vers /auth si pas connecté
   GuestRoute     : redirige vers /app si déjà connecté
   ═══════════════════════════════════════════════════════════════════════ */

import { Navigate } from 'react-router-dom';
import { useAuth } from './Authcontext.jsx';

// ─── Spinner pendant la vérification du token ─────────────────────────────────
function AuthLoader() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg, #FDF6F0)',
        }}>
            <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '3px solid rgba(212,175,55,0.2)',
                borderTopColor: '#D4AF37',
                animation: 'spin 0.9s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ─── ProtectedRoute : accès réservé aux utilisateurs connectés ────────────────
export function ProtectedRoute({ children }) {
    const { user, ready } = useAuth();

    // Attendre que l'auth soit initialisée (vérif token au démarrage)
    if (!ready) return <AuthLoader />;

    // Pas connecté → rediriger vers /auth
    if (!user) return <Navigate to="/auth" replace />;

    return children;
}

// ─── GuestRoute : redirige vers /app si déjà connecté ────────────────────────
export function GuestRoute({ children }) {
    const { user, ready } = useAuth();

    if (!ready) return <AuthLoader />;

    // Déjà connecté → rediriger vers le dashboard
    if (user) return <Navigate to="/app" replace />;

    return children;
}