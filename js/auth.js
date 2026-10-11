/**
 * Auth Helper
 * توکن در sessionStorage — با بستن مرورگر پاک میشه
 */

const Auth = (function() {
    const TOKEN_KEY = 'akbari_token';
    const USER_KEY = 'akbari_user';

    function save(token, user) {
        sessionStorage.setItem(TOKEN_KEY, token);
        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    function getToken() {
        return sessionStorage.getItem(TOKEN_KEY);
    }

    function getUser() {
        try {
            const data = sessionStorage.getItem(USER_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    function isLoggedIn() {
        return !!getToken();
    }

    function logout() {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
    }

    function requireLogin() {
        if (!isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    return { save, getToken, getUser, isLoggedIn, logout, requireLogin };
})();

window.Auth = Auth;

// ⚠️ Logout
window.logoutUser = function() {
    if (!confirm('Are you sure you want to logout?')) return;
    
    if (window.Auth && typeof Auth.logout === 'function') Auth.logout();
    
    localStorage.removeItem('akbariCurrentUserId');
    localStorage.removeItem('akbariLoggedIn');
    localStorage.removeItem('akbari_token');
    localStorage.removeItem('akbari_user');
    sessionStorage.removeItem('akbariLoggedIn');
    sessionStorage.removeItem('akbari_token');
    sessionStorage.removeItem('akbari_user');
    
    window.location.href = 'login.html';
};

/**
 * ⚠️ محافظت سختگیرانه
 */
(function guardManagementPages() {
    const MANAGEMENT_PAGES = [
        'dashboard.html', 'products-management.html', 'services-management.html',
        'orders-management.html', 'home-management.html', 'about-management.html',
        'contact-management.html', 'media-library.html', 'messages-management.html',
        'website-settings.html', 'payment-settings.html', 'my-profile.html',
        'account-settings.html', 'add-product.html', 'add-service.html'
    ];
    
    const currentPage = window.location.pathname.split('/').pop() || '';
    const token = sessionStorage.getItem('akbari_token');
    
    // ۱. اگه صفحه Management هست و لاگین نکرده → Login
    if (MANAGEMENT_PAGES.includes(currentPage)) {
        if (!token) {
            console.warn('⛔ Access denied — redirecting to login');
            window.location.replace('login.html');
            return;
        }
        
        // چک انقضا
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            
            if (payload.exp && payload.exp < now) {
                console.warn('⛔ Token expired');
                sessionStorage.removeItem('akbari_token');
                sessionStorage.removeItem('akbari_user');
                window.location.replace('login.html');
                return;
            }
        } catch (e) {
            sessionStorage.removeItem('akbari_token');
            sessionStorage.removeItem('akbari_user');
            window.location.replace('login.html');
            return;
        }
    }
    
    // ۲. اگه login هست و لاگین کرده → Dashboard
    if (currentPage === 'login.html' || currentPage === '') {
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const now = Math.floor(Date.now() / 1000);
                
                if (payload.exp && payload.exp > now) {
                    window.location.replace('dashboard.html');
                    return;
                }
            } catch (e) {
                sessionStorage.removeItem('akbari_token');
                sessionStorage.removeItem('akbari_user');
            }
        }
    }
})();

console.log('✅ Auth Helper loaded (sessionStorage-based)');