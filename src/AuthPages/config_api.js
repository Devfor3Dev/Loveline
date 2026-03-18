// config_api.js (ou l'endroit où tu stockes tes constantes)
export const API = {
    BASE_URL: 'https://loveline-cdfv.onrender.com', // L'URL de base de Django
    REGISTER: '/users/',                   // Défini par UserController dans api.py
    LOGIN: '/token/pair',                  // Défini par NinjaJWTDefaultController
    REFRESH: '/token/refresh',             // Pour rafraîchir le token plus tard
};