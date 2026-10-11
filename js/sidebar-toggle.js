/**
 * Sidebar Badge Updater — Auto-Environment
 */

(function() {
    'use strict';
    
    // ⚠️ از config.js میخونه
    const API_BASE = window.API_BASE || 'http://localhost/Akbari-Solution/api/v1';
    function getToken() {
        return sessionStorage.getItem('akbari_token') || 
               localStorage.getItem('akbari_token') || '';
    }
    
    function getUser() {
        try {
            const data = sessionStorage.getItem('akbari_user') || 
                         localStorage.getItem('akbari_user');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }
    
    async function updateMessagesBadge() {
        const badge = document.getElementById('sidebarMsgCount');
        if (!badge) return;
        
        const token = getToken();
        if (!token) return;
        
        try {
            const url = API_BASE + '/messages/stats?token=' + encodeURIComponent(token);
            const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
            if (!response.ok) return;
            
            const data = await response.json();
            if (data.success && data.data) {
                badge.textContent = data.data.unread || 0;
            }
        } catch (err) {}
    }
    
    async function updateOrdersBadge() {
        const badge = document.getElementById('sidebarOrderCount');
        if (!badge) return;
        
        const token = getToken();
        if (!token) return;
        
        try {
            const url = API_BASE + '/orders/stats?token=' + encodeURIComponent(token);
            const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
            if (!response.ok) return;
            
            const data = await response.json();
            if (data.success && data.data) {
                badge.textContent = data.data.new_orders || 0;
            }
        } catch (err) {}
    }

    function hideWebsiteSettingsForEmployee() {
        try {
            const user = getUser();
            if (!user || !user.role) return;
            if (user.role !== 'employee' && user.role !== 'Employee') return;

            document.querySelectorAll('.sidebar-nav a').forEach(link => {
                const href = link.getAttribute('href') || '';
                if (href.includes('website-settings.html')) {
                    const li = link.closest('li');
                    if (li) li.style.display = 'none';
                }
            });
        } catch (e) {}
    }

    function hidePermissionsManagerForNonSuperAdmin() {
        try {
            const user = getUser();
            if (!user || !user.role) return;
            if (user.role === 'super_admin' || user.role === 'Super Administrator') return;
            
            const permManager = document.querySelector('.ws-permissions-grid > .form-section:first-child');
            if (permManager) permManager.style.display = 'none';
        } catch (e) {}
    }

    function hideSuperAdminForNonSuperAdmin() {
        try {
            const user = getUser();
            if (!user || !user.role) return;
            if (user.role === 'super_admin' || user.role === 'Super Administrator') return;
            
            document.querySelectorAll('#userRole, #userRoleFilter, #permRoleSelect').forEach(select => {
                select.querySelectorAll('option').forEach(opt => {
                    if (opt.value === 'Super Administrator' || opt.value === 'super_admin') {
                        opt.style.display = 'none';
                    }
                });
            });
        } catch (e) {}
    }

    function init(retryCount = 0) {
        const token = getToken();
        
        if (!token) {
            if (retryCount < 5) {
                setTimeout(() => init(retryCount + 1), 400);
            }
            return;
        }
        
        updateMessagesBadge();
        updateOrdersBadge();
        
        hideWebsiteSettingsForEmployee();
        hidePermissionsManagerForNonSuperAdmin();
        hideSuperAdminForNonSuperAdmin();
        
        setInterval(() => {
            updateMessagesBadge();
            updateOrdersBadge();
        }, 30000);
    }
    
    function delayedInit() {
        setTimeout(() => init(0), 200);
    }
    
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        delayedInit();
    } else {
        document.addEventListener('DOMContentLoaded', delayedInit);
    }
    
})();