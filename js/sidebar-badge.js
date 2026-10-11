/**
 * Sidebar Badge Updater
 * آپدیت خودکار Badge پیام‌ها و سفارشات در سایدبار
 */

(function() {
    'use strict';
    
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
            const response = await fetch(API_BASE + '/messages/stats', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });
            
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
            const response = await fetch(API_BASE + '/orders/stats', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });
            
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
            
            const role = user.role;
            if (role !== 'employee' && role !== 'Employee') return;

            const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
            sidebarLinks.forEach(link => {
                const href = link.getAttribute('href') || '';
                if (href.includes('website-settings.html')) {
                    const parentLi = link.closest('li');
                    if (parentLi) parentLi.style.display = 'none';
                }
            });
        } catch (e) {}
    }

    function hidePermissionsManagerForNonSuperAdmin() {
        try {
            const user = getUser();
            if (!user || !user.role) return;
            
            const role = user.role;
            if (role === 'super_admin' || role === 'Super Administrator') return;
            
            const permManager = document.querySelector('.ws-permissions-grid > .form-section:first-child');
            if (permManager) permManager.style.display = 'none';
        } catch (e) {}
    }

    function hideSuperAdminForNonSuperAdmin() {
        try {
            const user = getUser();
            if (!user || !user.role) return;
            
            const role = user.role;
            if (role === 'super_admin' || role === 'Super Administrator') return;
            
            const roleSelects = document.querySelectorAll('#userRole, #userRoleFilter, #permRoleSelect');
            roleSelects.forEach(select => {
                const options = select.querySelectorAll('option');
                options.forEach(opt => {
                    if (opt.value === 'Super Administrator' || opt.value === 'super_admin') {
                        opt.style.display = 'none';
                    }
                });
            });
        } catch (e) {}
    }

    /**
     * اجرای اصلی — با retry
     */
    function init(retryCount = 0) {
        const token = getToken();
        
        // ⚠️ اگه توکن نبود، 5 بار تلاش کن
        if (!token) {
            if (retryCount < 5) {
                setTimeout(() => init(retryCount + 1), 400);
            }
            return;
        }
        
        console.log('✅ Sidebar Badge init — token found');
        
        updateMessagesBadge();
        updateOrdersBadge();
        
        hideWebsiteSettingsForEmployee();
        hidePermissionsManagerForNonSuperAdmin();
        hideSuperAdminForNonSuperAdmin();
        
        // آپدیت هر 30 ثانیه
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