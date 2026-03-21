// AuthContext.jsx
import React, { createContext, useContext, useState, useEffect  } from 'react';
import { API } from './config_api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('ll_access');
        const firstname = localStorage.getItem('user_firstname');
        if (token) return { firstname };
        return null;
    });
    const [token, setToken] = useState(localStorage.getItem('ll_access') || null);
    const [loading, setLoading] = useState(false); // Ajouté pour tes ProtectedRoutes

    const refreshToken = async () => {
        const refresh = localStorage.getItem('ll_refresh');
        if (!refresh) return;
        try {
            const res = await fetch(`${API.BASE_URL}${API.REFRESH}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh }),
            });
            if (!res.ok) {
                // Refresh token expiré → déconnecter
                logout();
                return;
            }
            const data = await res.json();
            localStorage.setItem('ll_access', data.access);
            setToken(data.access);
        } catch {
            // Pas de connexion internet → on ne déconnecte pas
        }
    };

// Au démarrage de l'app → rafraîchir immédiatement
// Puis toutes les 23h (avant que l'access token expire)
    useEffect(() => {
        refreshToken();
        const interval = setInterval(refreshToken, 23 * 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // ─── INSCRIPTION ───
    const register = async (userData) => {
        try {
            const response = await fetch(`${API.BASE_URL}${API.REGISTER}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userData.email,
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    password: userData.password
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Erreur lors de l'inscription. L'email existe peut-être déjà.");
            }
            const result = await response.json();
            localStorage.setItem('user_firstname', userData.firstName);
            return result;
        } catch (error) {
            console.error("Erreur Inscription:", error);
            throw error;
        }
    };

    // ─── CONNEXION ───
    const login = async (email, password) => {
        try {
            const response = await fetch(`${API.BASE_URL}${API.LOGIN}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Le modèle DelphyUser utilise l'email comme USERNAME_FIELD
                body: JSON.stringify({ email: email, password: password }),
            });

            if (!response.ok) {
                throw new Error("Identifiants incorrects.");
            }

            const data = await response.json();

            // Stockage des tokens renvoyés par Ninja JWT
            localStorage.setItem('ll_access', data.access);
            localStorage.setItem('ll_refresh', data.refresh);
            setToken(data.access);

            // On définit un faux utilisateur en attendant un endpoint /me/
            const profileRes = await fetch(`${API.BASE_URL}/profile/me`, {
                headers: { 'Authorization': `Bearer ${data.access}` }
            });
            let profileComplete = false;
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                profileComplete = profileData.is_complete;
            }
            setUser({ email, profileComplete });

            return data;
        } catch (error) {
            console.error("Erreur Connexion:", error);
            throw error;
        }
    };

    // ─── DÉCONNEXION ───
    const logout = () => {
        localStorage.removeItem('ll_access');
        localStorage.removeItem('ll_refresh');
        localStorage.removeItem('user_firstname');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, register, login, logout, refreshToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
