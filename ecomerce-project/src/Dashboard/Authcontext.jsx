/* ═══════════════════════════════════════════════════════════════════════
   LoveLine — AuthContext.jsx
   Gestion de l'authentification JWT (compatible Ninja JWT Django)

   Ninja JWT renvoie : { access: "...", refresh: "..." }
   On stocke dans localStorage : access_token, refresh_token
   ═══════════════════════════════════════════════════════════════════════ */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── Helpers localStorage ─────────────────────────────────────────────────────
const TOKEN_KEY   = 'access_token';
const REFRESH_KEY = 'refresh_token';

export const getAccessToken  = () => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

export const saveTokens = (access, refresh) => {
    localStorage.setItem(TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
};

export const clearTokens = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
};

// ─── Décoder le payload JWT (sans lib externe) ────────────────────────────────
function decodeJWT(token) {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
        return null;
    }
}

function isTokenValid(token) {
    if (!token) return false;
    const payload = decodeJWT(token);
    if (!payload?.exp) return false;
    // Valide si expire dans + de 30 secondes
    return payload.exp * 1000 > Date.now() + 30_000;
}

// ─── Contexte ─────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser]       = useState(null);   // { id, email, ... } extrait du JWT
    const [ready, setReady]     = useState(false);  // true quand on a fini de vérifier le token

    // Charger le user depuis le token stocké au démarrage
    useEffect(() => {
        const init = async () => {
            const access = getAccessToken();

            if (isTokenValid(access)) {
                // Token encore valide → extraire le user du payload
                const payload = decodeJWT(access);
                setUser({ id: payload.user_id, email: payload.email, ...payload });
            } else {
                // Token expiré → tenter le refresh
                const refreshed = await tryRefresh();
                if (!refreshed) {
                    clearTokens();
                    setUser(null);
                }
            }
            setReady(true);
        };
        init();
    }, []);

    // Rafraîchir le token access via ninja JWT
    const tryRefresh = useCallback(async () => {
        const refresh = getRefreshToken();
        if (!refresh) return false;
        try {
            const res = await fetch(`${BASE_URL}/api/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh }),
            });
            if (!res.ok) return false;
            const data = await res.json();
            const newAccess = data.access;
            localStorage.setItem(TOKEN_KEY, newAccess);
            const payload = decodeJWT(newAccess);
            setUser({ id: payload.user_id, email: payload.email, ...payload });
            return true;
        } catch {
            return false;
        }
    }, []);

    // Login : appelle ton endpoint ninja JWT
    const login = useCallback(async (email, password) => {
        const res = await fetch(`${BASE_URL}/api/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Identifiants incorrects');
        }

        const { access, refresh } = await res.json();
        saveTokens(access, refresh);
        const payload = decodeJWT(access);
        setUser({ id: payload.user_id, email: payload.email, ...payload });
        return { access, refresh };
    }, []);

    // Logout
    const logout = useCallback(async () => {
        const refresh = getRefreshToken();
        // Appel optionnel au backend pour blacklister le token
        if (refresh) {
            try {
                await fetch(`${BASE_URL}/api/token/blacklist/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh }),
                });
            } catch { /* silencieux */ }
        }
        clearTokens();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, ready, login, logout, tryRefresh }}>
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
    return ctx;
}