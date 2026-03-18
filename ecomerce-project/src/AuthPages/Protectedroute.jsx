import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * ProtectedRoute — redirige vers /auth si pas connecté
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/auth" replace />;

  return children;
}

/**
 * GuestRoute — redirige vers /app si déjà connecté
 */
export function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) {
    // Si profil incomplet → compléter d'abord
    return <Navigate to={user.profileComplete ? '/app' : '/complete-profile'} replace />;
  }

  return children;
}

/* ── Petit écran de chargement cohérent avec la charte ─────────────────── */
function LoadingScreen() {
  return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)',
        zIndex: 9999,
      }}>
        <div style={{ textAlign: 'center' }}>
          {/* Cœur pulsant */}
          <div style={{
            width: '48px', height: '48px',
            margin: '0 auto 16px',
            animation: 'pulse-heart 1.2s ease-in-out infinite',
          }}>
            <svg viewBox="0 0 48 48" fill="none">
              <path
                  d="M24 42s-18-11.5-18-22A10 10 0 0 1 24 12a10 10 0 0 1 18 8c0 10.5-18 22-18 22z"
                  fill="none" stroke="var(--accent)" strokeWidth="1.5"
              />
            </svg>
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '20px', fontStyle: 'italic',
            color: 'var(--primary)',
          }}>
            LoveLine
          </div>
        </div>

        <style>{`
        @keyframes pulse-heart {
          0%, 100% { transform: scale(1);   opacity: 1; }
          50%       { transform: scale(1.2); opacity: 0.7; }
        }
      `}</style>
      </div>
  );
}