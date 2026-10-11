/**
 * Permissions Guard
 * - چک کردن دسترسی کاربر برای هر بخش
 * - مخفی کردن لینک‌های غیرمجاز توی سایدبار
 * - مخفی کردن کارت‌های Dashboard
 * - مخفی کردن دکمه‌های Add/Edit/Delete
 * - ریدایرکت اگه کاربر توی صفحه‌ای هست که دسترسی نداره
 */

(function() {
    'use strict';
    
    const API_BASE = window.API_BASE || 'http://localhost/Akbari-Solution/api/v1';
    
    function getToken() {
        return sessionStorage.getItem('akbari_token') || localStorage.getItem('akbari_token') || '';
    }
    
    function getCurrentUser() {
        try {
            const data = sessionStorage.getItem('akbari_user') || localStorage.getItem('akbari_user');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }
    
    function normalizeRole(role) {
        if (!role) return '';
        if (role === 'Super Administrator') return 'super_admin';
        if (role === 'Administrator') return 'admin';
        if (role === 'Employee') return 'employee';
        return role;
    }
    
    /**
     * دریافت permissions کاربر از API
     */
    async function fetchUserPermissions(userId) {
        try {
            const response = await fetch(API_BASE + '/permissions/user/' + userId, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + getToken()
                }
            });
            
            if (!response.ok) return null;
            
            const data = await response.json();
            
            if (data.success && data.data && data.data.permissions) {
                return data.data.permissions;
            }
            return null;
        } catch (err) {
            console.error('Failed to fetch user permissions:', err);
            return null;
        }
    }
    
    /**
     * نقشه‌ی صفحات به بخش‌ها
     */
    const PAGE_TO_SECTION = {
        'dashboard.html': 'dashboard',
        'products-management.html': 'products',
        'add-product.html': 'products',
        'services-management.html': 'services',
        'add-service.html': 'services',
        'home-management.html': 'pages',
        'about-management.html': 'pages',
        'contact-management.html': 'pages',
        'media-library.html': 'media',
        'messages-management.html': 'messages',
        'website-settings.html': 'settings',
        'payment-settings.html': 'settings',
        'orders-management.html': 'orders'
    };
    
    /**
     * مخفی کردن لینک‌های سایدبار که کاربر دسترسی نداره
     */
    function hideSidebarLinks(permissions) {
        // بخش‌های سایدبار و selector مربوطه
        const sidebarSections = [
            { section: 'products', selector: 'a[href="products-management.html"]' },
            { section: 'services', selector: 'a[href="services-management.html"]' },
            { section: 'media', selector: 'a[href="media-library.html"]' },
            { section: 'messages', selector: 'a[href="messages-management.html"]' },
            { section: 'settings', selector: 'a[href="website-settings.html"]' },
            { section: 'orders', selector: 'a[href="orders-management.html"]' }
        ];
        
        sidebarSections.forEach(({ section, selector }) => {
            const link = document.querySelector(selector);
            if (!link) return;
            
            const sectionPerms = permissions[section];
            const canView = sectionPerms && sectionPerms.view;
            
            if (!canView) {
                let target = link.closest('li');
                if (!target) target = link;
                
                target.style.display = 'none';
                console.log('✅ Hidden sidebar link:', section);
            }
        });
        
        // بخش Pages (Home, About, Contact)
        const pagesPerms = permissions['pages'];
        if (!pagesPerms || !pagesPerms.view) {
            const allDropdowns = document.querySelectorAll('.sidebar-nav > ul > li');
            allDropdowns.forEach(li => {
                const link = li.querySelector('a[href="#"]');
                const submenu = li.querySelector('.submenu');
                if (link && submenu) {
                    const text = link.textContent.trim();
                    if (text.includes('Pages')) {
                        li.style.display = 'none';
                        console.log('✅ Hidden Pages dropdown');
                    }
                }
            });
        }
    }

    /**
     * مخفی کردن کارت‌های Stats توی Dashboard
     * (فقط صفحه dashboard.html)
     */
    function hideDashboardCards(permissions) {
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage !== 'dashboard.html' && currentPage !== '') return;
        
        const cards = [
            { section: 'products', href: 'products-management.html' },
            { section: 'services', href: 'services-management.html' },
            { section: 'media', href: 'media-library.html' },
            { section: 'messages', href: 'messages-management.html' },
            { section: 'orders', href: 'orders-management.html' }
        ];
        
        cards.forEach(({ section, href }) => {
            const sectionPerms = permissions[section];
            const canView = sectionPerms && sectionPerms.view;
            
            if (canView) return;
            
            const card = document.querySelector('.stat-card[href="' + href + '"]');
            if (card) {
                card.style.display = 'none';
                console.log('✅ Hidden dashboard card:', section);
            }
        });
    }

    /**
     * مخفی کردن دکمه‌های Add/Edit/Delete بر اساس Permissions
     */
    function applyButtonPermissions(permissions) {
        const currentPage = window.location.pathname.split('/').pop();
        const section = PAGE_TO_SECTION[currentPage];
        
        if (!section) return;
        
        const sectionPerms = permissions[section];
        if (!sectionPerms) return;
        
        // ⚠️ دکمه Add (بالای صفحه)
        if (!sectionPerms.add) {
            const addButtons = document.querySelectorAll('.btn-add-product, .btn-add-user, .btn-upload-files');
            addButtons.forEach(btn => {
                btn.style.display = 'none';
            });
            console.log('✅ Add buttons hidden');
        }
        
        // ⚠️ دکمه‌های Edit/Delete (داینامیک)
        const hideActionButtons = () => {
            if (!sectionPerms.edit) {
                document.querySelectorAll('.action-btn.edit, .user-action-btn.edit, .media-action-btn.edit, .msg-action-btn.reply').forEach(btn => {
                    btn.style.display = 'none';
                });
            }
            if (!sectionPerms.delete) {
                document.querySelectorAll('.action-btn.delete, .user-action-btn.delete, .media-action-btn.delete, .msg-action-btn.delete').forEach(btn => {
                    btn.style.display = 'none';
                });
            }

            // ⚠️ ویژه صفحات Pages (Home/About/Contact) — مخفی کردن دکمه Save
            if (section === 'pages') {
                if (!sectionPerms.edit) {
                    const saveBtns = document.querySelectorAll(
                        '#saveAboutBtn, #saveContactBtn, #saveHomeBtn, .btn-save-changes'
                    );
                    saveBtns.forEach(btn => btn.style.display = 'none');
                    console.log('✅ Pages Save button hidden');
                }
            }
        };
        
        hideActionButtons();
        
        const observer = new MutationObserver(hideActionButtons);
        observer.observe(document.body, { childList: true, subtree: true });
        
        console.log('✅ Button permissions applied for:', section);
    }
    
    /**
     * چک کردن دسترسی به صفحه فعلی
     */
    function checkCurrentPageAccess(permissions) {
        const currentPage = window.location.pathname.split('/').pop();
        const section = PAGE_TO_SECTION[currentPage];
        
        if (!section) return;
        
        const sectionPerms = permissions[section];
        const canView = sectionPerms && sectionPerms.view;
        
        // ⚠️ چک view
        if (!canView) {
            console.warn('⛔ Access denied to:', currentPage);
            alert('⚠️ شما به این بخش دسترسی ندارید');
            window.location.href = 'dashboard.html';
            return;
        }
        
        // ⚠️ چک add
        if (currentPage === 'add-product.html' && !sectionPerms.add) {
            alert('⚠️ شما دسترسی افزودن محصول را ندارید');
            window.location.href = 'products-management.html';
            return;
        }
        if (currentPage === 'add-service.html' && !sectionPerms.add) {
            alert('⚠️ شما دسترسی افزودن خدمت را ندارید');
            window.location.href = 'services-management.html';
            return;
        }
    }
    
    /**
     * اجرا
     */
    async function init() {
        if (!getToken()) return;
        
        const user = getCurrentUser();
        if (!user) return;
        
        // Super Admin → همه چیز رو می‌بینه، چک نکن
        const role = normalizeRole(user.role);
        if (role === 'super_admin') {
            console.log('✅ Super Admin — full access');
            return;
        }
        
        // Permissions رو از API بگیر
        const permissions = await fetchUserPermissions(user.id);
        
        if (!permissions) {
            console.warn('⚠️ No permissions found — skipping guard');
            return;
        }

        // مخفی کردن لینک‌های غیرمجاز
        hideSidebarLinks(permissions);

        // مخفی کردن کارت‌های Dashboard
        hideDashboardCards(permissions);

        // اعمال محدودیت روی دکمه‌ها
        applyButtonPermissions(permissions);
        
        // چک کردن دسترسی به صفحه فعلی
        checkCurrentPageAccess(permissions);
        
        console.log('✅ Permissions Guard applied');
    }
    
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 100);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(init, 100);
        });
    }
    
})();