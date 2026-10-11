/**
 * API Client
 * کلاینت مرکزی — سازگار با همه محیط‌ها
 */

const API = (function() {
    // ⚠️ از config.js میخونه
    const BASE_URL = window.API_BASE || 'http://localhost/Akbari-Solution/api/v1';

    function getAutoToken(token) {
        if (token) return token;
        if (window.Auth && typeof Auth.getToken === 'function') {
            return Auth.getToken();
        }
        return sessionStorage.getItem('akbari_token') || localStorage.getItem('akbari_token');
    }

    function addTokenToUrl(url, token) {
        if (!token) return url;
        const sep = url.includes('?') ? '&' : '?';
        return url + sep + 'token=' + encodeURIComponent(token);
    }

    async function get(endpoint, params = {}) {
        const url = new URL(BASE_URL + endpoint);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                url.searchParams.append(key, params[key]);
            }
        });

        const token = getAutoToken();
        const finalUrl = addTokenToUrl(url.toString(), token);

        try {
            const headers = { 'Accept': 'application/json' };
            if (token) headers['Authorization'] = 'Bearer ' + token;

            const response = await fetch(finalUrl, { method: 'GET', headers });
            return await response.json();
        } catch (err) {
            console.error('API GET error:', err);
            return { success: false, message: 'Network error' };
        }
    }

    async function post(endpoint, data = {}, token = null) {
        const finalToken = getAutoToken(token);
        const finalUrl = addTokenToUrl(BASE_URL + endpoint, finalToken);

        try {
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            if (finalToken) headers['Authorization'] = 'Bearer ' + finalToken;

            const response = await fetch(finalUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (err) {
            console.error('API POST error:', err);
            return { success: false, message: 'Network error' };
        }
    }

    async function put(endpoint, data = {}, token = null) {
        const finalToken = getAutoToken(token);
        const finalUrl = addTokenToUrl(BASE_URL + endpoint, finalToken);

        try {
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            if (finalToken) headers['Authorization'] = 'Bearer ' + finalToken;

            const response = await fetch(finalUrl, {
                method: 'PUT',
                headers,
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (err) {
            console.error('API PUT error:', err);
            return { success: false, message: 'Network error' };
        }
    }

    async function del(endpoint, token = null) {
        const finalToken = getAutoToken(token);
        const finalUrl = addTokenToUrl(BASE_URL + endpoint, finalToken);

        try {
            const headers = { 'Accept': 'application/json' };
            if (finalToken) headers['Authorization'] = 'Bearer ' + finalToken;

            const response = await fetch(finalUrl, { method: 'DELETE', headers });
            return await response.json();
        } catch (err) {
            console.error('API DELETE error:', err);
            return { success: false, message: 'Network error' };
        }
    }

    return { get, post, put, del };
})();

window.API = API;
console.log('✅ API Client loaded (Auto-Environment)');