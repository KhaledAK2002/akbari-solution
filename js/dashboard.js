/* =========================================
   AKBARI SOLUTION - dashboard.js
   Stage 1/18 - Sections 1-5
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       SECTION 2: SUPER ADMIN PROTECTION SYSTEM
       ========================================= */
    const SUPER_ADMIN_ID = 1;
    const WS_USERS_KEY = 'akbariUsers';
    const WS_PERMISSIONS_KEY = 'akbariPermissions';
    const WS_SETTINGS_KEY = 'akbariWebsiteSettings';
    const MESSAGES_KEY = 'akbariMessages';
    const ACTIVITY_LOG_KEY = 'akbariActivityLog';
    const BACKUP_HISTORY_KEY = 'akbariBackupHistory';
    const PRODUCTS_KEY = 'akbariProducts';
    const SERVICES_KEY = 'akbariServices';
    const MEDIA_KEY = 'akbariMedia';
    const STORAGE_LIMIT_KEY = 'akbariStorageLimit';
    const ABOUT_KEY = 'akbariAbout';
    const CONTACT_KEY = 'akbariContact';
    const HOME_KEY = 'akbariHome';
    const ACTIVITY_LIMIT = 200;
    const DEFAULT_STORAGE_LIMIT = 500;
    const MAX_FILE_SIZE = 1024 * 1024;

    function safeGet(key, fallback = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : fallback;
        } catch (e) { return fallback; }
    }

    function safeSet(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) { return false; }
    }

    function safeRemove(key) {
        try { localStorage.removeItem(key); return true; }
        catch (e) { return false; }
    }

    function getCurrentUser() {
        // ⚠️ اول از Auth بخون
        if (window.Auth && typeof Auth.getUser === 'function') {
            const authUser = Auth.getUser();
            if (authUser && authUser.name) {
                return authUser;
            }
        }
        // Fallback: از LocalStorage
        const users = safeGet(WS_USERS_KEY, []);
        const currentUserId = parseInt(localStorage.getItem('akbariCurrentUserId') || SUPER_ADMIN_ID);
        const user = users.find(u => u.id === currentUserId) || users.find(u => u.id === SUPER_ADMIN_ID);
        
        if (user) {
            // ⚠️ ترجمه نقش توی Fallback
            let role = user.role;
            if (role === 'super_admin') role = 'Super Administrator';
            if (role === 'admin') role = 'Administrator';
            if (role === 'employee') role = 'Employee';
            user.role = role;
        }
        
        return user || null;
    }


    function isSuperAdmin() {
        const user = getCurrentUser();
        return user && (user.role === 'Super Administrator' || user.role === 'super_admin');
    }

    function applyTabLocks() {
        if (isSuperAdmin()) return;
        const lockedTabs = ['appearance', 'system'];
        lockedTabs.forEach(tabName => {
            const tabBtn = document.querySelector(`.ws-tab[data-tab="${tabName}"]`);
            if (tabBtn) tabBtn.style.display = 'none';
            const tabContent = document.getElementById('tab-' + tabName);
            if (tabContent) tabContent.style.display = 'none';
        });
    }

    /* =========================================
       SECTION 3: تاریخ و ساعت
       ========================================= */
    function updateDateTime() {
        const now = new Date();
        let userTimezone = 'Asia/Kabul';
        let userDateLocale = 'en-US';

        try {
            const data = safeGet(WS_SETTINGS_KEY, {});
            if (data.general) {
                if (data.general.siteTimezone) userTimezone = data.general.siteTimezone;
                if (data.general.siteLanguage === 'Dari' || data.general.siteLanguage === 'Pashto') {
                    userDateLocale = 'fa-AF';
                }
            }
        } catch (e) {}

        const dateOptions = { timeZone: userTimezone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions = { timeZone: userTimezone, hour: '2-digit', minute: '2-digit', hour12: true };

        const dateElement = document.getElementById('currentDate');
        const timeElement = document.getElementById('currentTime');

        if (dateElement) dateElement.textContent = new Intl.DateTimeFormat(userDateLocale, dateOptions).format(now);
        if (timeElement) timeElement.textContent = new Intl.DateTimeFormat(userDateLocale, timeOptions).format(now);
    }
    updateDateTime();
    setInterval(updateDateTime, 60000);

    /* =========================================
       SECTION 4: Badge Messages در سایدبار
       ========================================= */
        // ⚠️ حذف شد — Badge توسط sidebar-badge.js مدیریت میشه
        // (API-Based)

    /* =========================================
       SECTION 5: توابع کمکی (formatDate)
       ========================================= */
    function formatDate(date) {
        let dateFormat = 'F j, Y';
        try {
            const settings = safeGet(WS_SETTINGS_KEY, {});
            if (settings.general && settings.general.siteDateFormat) {
                dateFormat = settings.general.siteDateFormat;
            }
        } catch (e) {}

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        switch (dateFormat) {
            case 'Y-m-d': return `${year}-${month}-${day}`;
            case 'd/m/Y': return `${day}/${month}/${year}`;
            case 'm/d/Y': return `${month}/${day}/${year}`;
            case 'F j, Y':
            default: return `${fullMonthNames[date.getMonth()]} ${date.getDate()}, ${year}`;
        }
    }

    function formatDateTimeKabul() {
        return new Date().toLocaleString('en-GB', {
            timeZone: 'Asia/Kabul',
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    window.showToast = function(message, type = 'success') {
        const colors = {
            success: { bg: '#10B981', shadow: 'rgba(16, 185, 129, 0.4)', icon: 'fa-check-circle' },
            error: { bg: '#EF4444', shadow: 'rgba(239, 68, 68, 0.4)', icon: 'fa-exclamation-circle' },
            warning: { bg: '#F59E0B', shadow: 'rgba(245, 158, 11, 0.4)', icon: 'fa-exclamation-triangle' },
            info: { bg: '#00A8FF', shadow: 'rgba(0, 168, 255, 0.4)', icon: 'fa-info-circle' }
        };
        const c = colors[type] || colors.success;
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 30px; right: 30px;
            background-color: ${c.bg}; color: white;
            padding: 16px 24px; border-radius: 12px;
            font-size: 14px; font-weight: 500;
            font-family: 'Poppins', sans-serif;
            display: flex; align-items: center; gap: 10px;
            box-shadow: 0 10px 30px ${c.shadow};
            z-index: 999999; transform: translateX(400px);
            transition: transform 0.4s ease; max-width: 400px;
        `;
        toast.innerHTML = `<i class="fas ${c.icon}" style="font-size:20px;"></i><span>${message}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.transform = 'translateX(0)'; }, 10);
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    };

    window.akbariHelpers = {
        safeGet, safeSet, safeRemove, formatDate, formatDateTimeKabul,
        getCurrentUser, isSuperAdmin, applyTabLocks,
        PRODUCTS_KEY, SERVICES_KEY, MESSAGES_KEY, MEDIA_KEY,
        WS_USERS_KEY, WS_PERMISSIONS_KEY, WS_SETTINGS_KEY,
        ABOUT_KEY, CONTACT_KEY, HOME_KEY,
        ACTIVITY_LOG_KEY, BACKUP_HISTORY_KEY, STORAGE_LIMIT_KEY,
        SUPER_ADMIN_ID, DEFAULT_STORAGE_LIMIT, MAX_FILE_SIZE, ACTIVITY_LIMIT
    };

    console.log('✅ Stage 1/18 — Sections 1-5 loaded');

    /* =========================================
       SECTION 6: ACTIVITY LOG SYSTEM
       ========================================= */
    /**
     * Activity Log - API-Based
     */
    async function addActivity(action, description, type = 'info') {
        try {
            const response = await API.post('/activity-log', {
                action: action,
                description: description,
                type: type
            });

            if (response.success) {
                console.log('✅ Activity logged:', description);
                if (typeof renderActivityLog === 'function') {
                    renderActivityLog();
                }
            } else {
                console.warn('⚠️ Could not log activity:', response.message);
            }
        } catch (e) {
            console.error('❌ Could not log activity:', e);
        }
    }

    window.logActivity = addActivity;

    
    /* =========================================
       SECTION 7: PRODUCTS MANAGEMENT (API-Based — Complete)
       ========================================= */
    
    let productsCache = [];
    let productsLoaded = false;

    async function fetchProductsFromAPI() {
        try {
            const response = await API.get('/products', { per_page: 100 });
            if (response.success && response.data.products) {
                productsCache = response.data.products;
                productsLoaded = true;
                return productsCache;
            }
            return [];
        } catch (e) {
            console.error('Failed to fetch products:', e);
            return [];
        }
    }

    function getProducts() {
        return productsCache || [];
    }

    function getCategoryClass(category) {
        return category === 'Software' ? 'purple' : 'blue';
    }

    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const showEntries = document.getElementById('showEntries');

    let currentPage = 1;
    let entriesPerPage = 10;
    let currentServicePage = 1;

    async function renderProducts() {
        const tableBody = document.getElementById('productsTableBody');
        if (!tableBody) return;

        // نمایش لودینگ
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center; padding:40px; color:#A0AEC0;">
                    <i class="fas fa-spinner fa-spin" style="font-size:30px; margin-bottom:15px; display:block; color:#00A8FF;"></i>
                    Loading products...
                </td>
            </tr>
        `;

        // بارگذاری از API
        await fetchProductsFromAPI();

        const allProducts = getProducts();
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const selectedCategory = categoryFilter ? categoryFilter.value.toLowerCase() : '';
        const selectedStatus = statusFilter ? statusFilter.value.toLowerCase() : '';

        const products = allProducts.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm);
            const matchesCategory = selectedCategory === '' || product.category.toLowerCase() === selectedCategory;
            const matchesStatus = selectedStatus === '' || (product.status || 'Active').toLowerCase() === selectedStatus;
            return matchesSearch && matchesCategory && matchesStatus;
        });

        tableBody.innerHTML = '';

        if (products.length === 0) {
            tableBody.innerHTML = `<tr>
                <td colspan="9" style="text-align:center; padding:60px 20px; color:#A0AEC0;">
                    <i class="fas fa-box-open" style="font-size:50px; margin-bottom:20px; display:block; color:#2D3748;"></i>
                    <h3 style="color:white; margin-bottom:10px;">No products found</h3>
                    <p style="margin-bottom:20px;">Start by adding your first product.</p>
                    <a href="add-product.html" style="background:#00A8FF; color:white; padding:10px 25px; border-radius:8px; text-decoration:none; font-weight:500;">
                        <i class="fas fa-plus"></i> Add New Product
                    </a>
                </td>
            </tr>`;
            renderPagination('pagination', 0, 1, () => {}, 'product');
            updateStats();
            return;
        }

        const totalPages = Math.ceil(products.length / entriesPerPage);
        if (currentPage > totalPages) currentPage = totalPages;

        const startIndex = (currentPage - 1) * entriesPerPage;
        const endIndex = startIndex + entriesPerPage;
        const pageProducts = products.slice(startIndex, endIndex);

        pageProducts.forEach((product, index) => {
            const actualIndex = startIndex + index + 1;
            const row = document.createElement('tr');

            const coverImage = (product.images && product.images.length > 0)
                ? product.images[0].url
                : (product.image || 'assets/images/product-doctor-clinic.png');

            const statusText = product.status || 'Active';

            row.innerHTML = `
                <td><input type="checkbox"></td>
                <td>${actualIndex}</td>
                <td><img src="${coverImage}" class="table-thumb" alt="Product" onerror="this.src='assets/images/product-doctor-clinic.png'"></td>
                <td>
                    <div class="prod-name-cell">
                        <strong>${product.name}</strong>
                        <span>${product.short_desc || ''}</span>
                    </div>
                </td>
                <td><span class="category-tag ${getCategoryClass(product.category)}">${product.category}</span></td>
                <td>$${product.price || 0}</td>
                <td><span class="status ${statusText.toLowerCase()}">${statusText}</span></td>
                <td>${product.created_at ? product.created_at.split(' ')[0] : '-'}</td>
                <td class="action-buttons">
                    <a href="add-product.html?id=${product.id}" class="action-btn edit" title="Edit Product"><i class="fas fa-pencil-alt"></i></a>
                    <a href="#" class="action-btn delete" onclick="deleteProduct(${product.id}); return false;" title="Delete Product"><i class="fas fa-trash"></i></a>
                </td>
            `;
            tableBody.appendChild(row);
        });

        renderPagination('pagination', products.length, totalPages, () => renderProducts(), 'product');
        updateStats();
    }

    function applyFilters() {
        currentPage = 1;
        renderProducts();
    }

    function renderPagination(containerId, totalItems, totalPages, onPageChange, type) {
        const paginationContainer = document.getElementById(containerId);
        if (!paginationContainer) return;

        paginationContainer.innerHTML = '';
        if (totalItems === 0 || totalPages <= 1) return;

        const currentPageRef = type === 'product' ? currentPage : currentServicePage;

        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn' + (currentPageRef === 1 ? ' disabled' : '');
        prevBtn.textContent = 'Previous';
        prevBtn.addEventListener('click', () => {
            if (currentPageRef > 1) {
                if (type === 'product') currentPage--;
                else currentServicePage--;
                onPageChange();
            }
        });
        paginationContainer.appendChild(prevBtn);

        const maxVisible = 5;
        let startPage = Math.max(1, currentPageRef - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);

        if (startPage > 1) {
            const firstBtn = document.createElement('button');
            firstBtn.className = 'page-btn';
            firstBtn.textContent = '1';
            firstBtn.addEventListener('click', () => {
                if (type === 'product') currentPage = 1;
                else currentServicePage = 1;
                onPageChange();
            });
            paginationContainer.appendChild(firstBtn);
            if (startPage > 2) {
                const dots = document.createElement('span');
                dots.textContent = '...';
                dots.style.cssText = 'padding: 0 8px; color: #A0AEC0; display: flex; align-items: center;';
                paginationContainer.appendChild(dots);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'page-btn' + (i === currentPageRef ? ' active' : '');
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                if (type === 'product') currentPage = i;
                else currentServicePage = i;
                onPageChange();
            });
            paginationContainer.appendChild(pageBtn);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const dots = document.createElement('span');
                dots.textContent = '...';
                dots.style.cssText = 'padding: 0 8px; color: #A0AEC0; display: flex; align-items: center;';
                paginationContainer.appendChild(dots);
            }
            const lastBtn = document.createElement('button');
            lastBtn.className = 'page-btn';
            lastBtn.textContent = totalPages;
            lastBtn.addEventListener('click', () => {
                if (type === 'product') currentPage = totalPages;
                else currentServicePage = totalPages;
                onPageChange();
            });
            paginationContainer.appendChild(lastBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn' + (currentPageRef === totalPages ? ' disabled' : '');
        nextBtn.textContent = 'Next';
        nextBtn.addEventListener('click', () => {
            if (currentPageRef < totalPages) {
                if (type === 'product') currentPage++;
                else currentServicePage++;
                onPageChange();
            }
        });
        paginationContainer.appendChild(nextBtn);
    }

    function updateStats() {
        const statCards = document.querySelectorAll('.stats-grid .stat-info h3');
        if (statCards.length < 2) return;

        if (document.getElementById('productsTableBody')) {
            const products = getProducts();
            if (statCards[0]) statCards[0].textContent = products.length;
            if (statCards[1]) statCards[1].textContent = products.filter(p => (p.status || 'Active') === 'Active').length;
        }

        if (document.getElementById('servicesTableBody')) {
            const services = getServices();
            const statTotalServices = document.getElementById('statTotalServices');
            const statActiveServices = document.getElementById('statActiveServices');
            const statInactiveServices = document.getElementById('statInactiveServices');

            if (statTotalServices) statTotalServices.textContent = services.length;
            if (statActiveServices) statActiveServices.textContent = services.filter(s => s.status === 'Active').length;
            if (statInactiveServices) statInactiveServices.textContent = services.filter(s => s.status === 'Inactive').length;
        }
    }

    window.deleteProduct = async function(id) {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const response = await API.del('/products/' + id);

            if (response.success) {
                const deletedProduct = productsCache.find(p => p.id === id);
                window.logActivity('delete', `Deleted product: ${deletedProduct?.name || 'Unknown'}`, 'danger');

                if (searchInput) searchInput.value = '';
                if (categoryFilter) categoryFilter.value = '';
                if (statusFilter) statusFilter.value = '';

                currentPage = 1;
                productsLoaded = false;
                await renderProducts();
                updateStats();

                if (window.showToast) window.showToast('Product deleted successfully!', 'success');
            } else {
                alert('⚠️ ' + (response.message || 'Failed to delete product'));
            }
        } catch (e) {
            console.error('Delete error:', e);
            alert('⚠️ Network error. Please try again.');
        }
    };

    if (document.getElementById('productsTableBody')) {
        if (searchInput && categoryFilter && statusFilter) {
            searchInput.addEventListener('input', () => { currentPage = 1; renderProducts(); });
            categoryFilter.addEventListener('change', () => { currentPage = 1; renderProducts(); });
            statusFilter.addEventListener('change', () => { currentPage = 1; renderProducts(); });
        }

        if (showEntries) {
            showEntries.addEventListener('change', (e) => {
                entriesPerPage = parseInt(e.target.value);
                currentPage = 1;
                renderProducts();
            });
        }

        renderProducts();
    }

    console.log('✅ Stage 2/18 — Sections 6-7 loaded');

    /* =========================================
       SECTION 8: PRODUCT FORM (Handled in add-product.html)
       ========================================= */
    // ✅ Product Form logic is now handled inline in add-product.html
    // (API-Based: Create/Update + Image Upload via FormData)

    console.log('✅ Stage 3/18 — Section 8 (skipped - handled inline)');

    /* =========================================
       SECTION 9: Products Management Page Listeners
       ========================================= */
    // (این بخش داخل SECTION 7 قبلاً اضافه شده - در اینجا فقط برای تکمیل می‌آوریم)
    // در صورتیکه productsTableBody وجود داشته باشد، listener ها اضافه شده‌اند.
    // نیازی به کد اضافی نیست. این بخش فقط نقش مستندسازی دارد.

    /* =========================================
       SECTION 10: SERVICES MANAGEMENT (API-Based)
       ========================================= */
    
    // Cache برای خدمات
    let servicesCache = [];
    let servicesLoaded = false;

    async function fetchServicesFromAPI() {
        try {
            const response = await API.get('/services', { per_page: 100 });
            if (response.success && response.data.services) {
                servicesCache = response.data.services;
                servicesLoaded = true;
                return servicesCache;
            }
            return [];
        } catch (e) {
            console.error('Failed to fetch services:', e);
            return [];
        }
    }

    function getServices() {
        // این تابع sync هست — از cache استفاده میکنه
        // اگه خالی بود، از localStorage قدیمی میخونه (fallback)
        if (servicesLoaded && servicesCache.length > 0) {
            return servicesCache;
        }
        try {
            const data = localStorage.getItem(SERVICES_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    }

    function saveAllServices(services) {
        // فقط cache رو آپدیت میکنه — دیگه توی localStorage ذخیره نمیکنیم
        servicesCache = services;
        servicesLoaded = true;
    }

    const servicesPerPage = 10;
    const servicesTableBody = document.getElementById('servicesTableBody');

    function updateServiceStats() {
        const services = getServices();
        const total = services.length;
        const active = services.filter(s => s.status === 'Active').length;
        const inactive = services.filter(s => s.status === 'Inactive').length;

        const statTotal = document.getElementById('statTotalServices');
        const statActive = document.getElementById('statActiveServices');
        const statInactive = document.getElementById('statInactiveServices');

        if (statTotal) statTotal.textContent = total;
        if (statActive) statActive.textContent = active;
        if (statInactive) statInactive.textContent = inactive;
    }

    function getCategoryIcon(category) {
        const icons = {
            'Software': '<i class="fas fa-code"></i>',
            'Web': '<i class="fas fa-globe"></i>',
            'Database': '<i class="fas fa-database"></i>',
            'Mobile App': '<i class="fas fa-mobile-alt"></i>',
            'Consulting': '<i class="fas fa-comments"></i>',
            'Support': '<i class="fas fa-tools"></i>'
        };
        return icons[category] || '<i class="fas fa-cog"></i>';
    }

    function getCategoryTagClass(category) {
        const classes = {
            'Software': 'blue', 'Web': 'purple', 'Database': 'green',
            'Mobile App': 'orange', 'Consulting': 'blue', 'Support': 'purple'
        };
        return classes[category] || 'blue';
    }

    async function renderServices() {
        if (!servicesTableBody) return;

        // نمایش لودینگ
        servicesTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:40px; color:#A0AEC0;">
                    <i class="fas fa-spinner fa-spin" style="font-size:30px; margin-bottom:15px; display:block; color:#00A8FF;"></i>
                    Loading services...
                </td>
            </tr>
        `;

        // بارگذاری از API
        await fetchServicesFromAPI();

        const services = getServices();
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
        const selectedCategory = document.getElementById('categoryFilter')?.value.toLowerCase() || '';
        const selectedStatus = document.getElementById('statusFilter')?.value.toLowerCase() || '';

        const filteredServices = services.filter(service => {
            const matchesSearch = service.name.toLowerCase().includes(searchTerm);
            const matchesCategory = selectedCategory === '' || service.category.toLowerCase() === selectedCategory;
            const matchesStatus = selectedStatus === '' || service.status.toLowerCase() === selectedStatus;
            return matchesSearch && matchesCategory && matchesStatus;
        });

        const totalPages = Math.ceil(filteredServices.length / servicesPerPage) || 1;
        if (currentServicePage > totalPages) currentServicePage = totalPages;

        const startIndex = (currentServicePage - 1) * servicesPerPage;
        const endIndex = startIndex + servicesPerPage;
        const pageServices = filteredServices.slice(startIndex, endIndex);

        servicesTableBody.innerHTML = '';

        if (filteredServices.length === 0) {
            servicesTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:60px 20px; color:#A0AEC0;">
                        <i class="fas fa-cogs" style="font-size:50px; margin-bottom:20px; display:block; color:#2D3748;"></i>
                        <h3 style="color:white; margin-bottom:10px;">No services yet</h3>
                        <p style="margin-bottom:20px;">Start by adding your first service.</p>
                        <a href="add-service.html" style="background:#00A8FF; color:white; padding:10px 25px; border-radius:8px; text-decoration:none; font-weight:500;">
                            <i class="fas fa-plus"></i> Add New Service
                        </a>
                    </td>
                </tr>
            `;
            const showingText = document.getElementById('showingText');
            if (showingText) showingText.textContent = 'Showing 0 to 0 of 0 services';
            renderPagination('pagination', 0, 1, () => {}, 'service');
            updateServiceStats();
            return;
        }

        pageServices.forEach((service, index) => {
            const actualIndex = startIndex + index + 1;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${actualIndex}</td>
                <td>
                    <div class="service-name-cell">
                        <div class="service-icon-cell">${getCategoryIcon(service.category)}</div>
                        <div class="service-text">
                            <strong>${service.name}</strong>
                            <span>${service.short_desc || ''}</span>
                        </div>
                    </div>
                </td>
                <td><span class="category-tag ${getCategoryTagClass(service.category)}">${service.category}</span></td>
                <td class="service-image-cell">
                    <img src="${service.image || 'assets/images/service-default.png'}" alt="Service" onerror="this.src='assets/images/service-default.png'">
                </td>
                <td><span class="status ${service.status.toLowerCase()}">${service.status}</span></td>
                <td>${service.created_at ? service.created_at.split(' ')[0] : '-'}</td>
                <td class="action-buttons">
                    <a href="add-service.html?id=${service.id}" class="action-btn edit" title="Edit"><i class="fas fa-pencil-alt"></i></a>
                    <a href="#" class="action-btn delete" onclick="deleteService(${service.id}); return false;" title="Delete"><i class="fas fa-trash"></i></a>
                </td>
            `;
            servicesTableBody.appendChild(row);
        });

        const showingText = document.getElementById('showingText');
        if (showingText) {
            showingText.textContent = `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredServices.length)} of ${filteredServices.length} services`;
        }

        renderPagination('pagination', filteredServices.length, totalPages, () => renderServices(), 'service');
        updateServiceStats();
        updateStats();
    }

    window.deleteService = async function(id) {
        if (!confirm('Are you sure you want to delete this service?')) return;

        try {
            const response = await API.del('/services/' + id);

            if (response.success) {
                const deletedService = servicesCache.find(s => s.id === id);
                window.logActivity('delete', `Deleted service: ${deletedService?.name || 'Unknown'}`, 'danger');

                const searchInputService = document.getElementById('searchInput');
                const categoryFilterService = document.getElementById('categoryFilter');
                const statusFilterService = document.getElementById('statusFilter');

                if (searchInputService) searchInputService.value = '';
                if (categoryFilterService) categoryFilterService.value = '';
                if (statusFilterService) statusFilterService.value = '';

                currentServicePage = 1;
                servicesLoaded = false; // مجبور به reload
                await renderServices();
                updateServiceStats();
                updateStats();

                window.showToast('Service deleted successfully!', 'success');
            } else {
                alert('⚠️ ' + (response.message || 'Failed to delete service'));
            }
        } catch (e) {
            console.error('Delete error:', e);
            alert('⚠️ Network error. Please try again.');
        }
    };

    if (servicesTableBody) {
        const searchInputService = document.getElementById('searchInput');
        const categoryFilterService = document.getElementById('categoryFilter');
        const statusFilterService = document.getElementById('statusFilter');

        if (searchInputService) searchInputService.addEventListener('input', () => { currentServicePage = 1; renderServices(); });
        if (categoryFilterService) categoryFilterService.addEventListener('change', () => { currentServicePage = 1; renderServices(); });
        if (statusFilterService) statusFilterService.addEventListener('change', () => { currentServicePage = 1; renderServices(); });

        renderServices();
    }

    console.log('✅ Stage 4/18 — Sections 9-10 loaded');

    /* =========================================
       SECTION 11: SERVICE FORM (Handled in add-service.html)
       ========================================= */
    // ✅ Service Form logic is now handled inline in add-service.html

    console.log('✅ Stage 5/18 — Section 11 (handled in add-service.html)');

    /* =========================================
       SECTION 12: RICH TEXT EDITOR
       ========================================= */
    const editorToolbars = document.querySelectorAll('.rich-editor');

    if (editorToolbars.length > 0) {
        editorToolbars.forEach(editor => {
            const toolbarBtns = editor.querySelectorAll('.toolbar-btn');
            const editorArea = editor.querySelector('.editor-textarea[contenteditable="true"]');
            const formatSelect = editor.querySelector('.editor-dropdown');

            if (!editorArea) return;

            toolbarBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const command = btn.getAttribute('data-command');
                    if (!command) return;

                    editorArea.focus();

                    if (command === 'createLink') {
                        const url = prompt('Enter the URL:', 'https://');
                        if (url) document.execCommand('createLink', false, url);
                    } else if (command === 'undo') {
                        document.execCommand('undo', false, null);
                    } else if (command === 'redo') {
                        document.execCommand('redo', false, null);
                    } else {
                        document.execCommand(command, false, null);
                    }

                    updateToolbarState(editor);
                });
            });

            if (formatSelect) {
                formatSelect.addEventListener('change', (e) => {
                    const format = e.target.value;
                    editorArea.focus();

                    const tagMap = { 'p': '<p>', 'h1': '<h1>', 'h2': '<h2>', 'h3': '<h3>' };
                    if (tagMap[format]) {
                        document.execCommand('formatBlock', false, tagMap[format]);
                    }
                });
            }

            editorArea.addEventListener('keyup', () => updateToolbarState(editor));
            editorArea.addEventListener('mouseup', () => updateToolbarState(editor));

            if (editorArea.textContent.trim() === '') {
                editorArea.setAttribute('data-empty', 'true');
            }

            editorArea.addEventListener('input', () => {
                if (editorArea.textContent.trim() === '') {
                    editorArea.setAttribute('data-empty', 'true');
                } else {
                    editorArea.setAttribute('data-empty', 'false');
                }
            });
        });

        function updateToolbarState(editor) {
            const toolbarBtns = editor.querySelectorAll('.toolbar-btn');
            toolbarBtns.forEach(btn => {
                const command = btn.getAttribute('data-command');
                if (command === 'bold' || command === 'italic' || command === 'underline') {
                    try {
                        if (document.queryCommandState(command)) {
                            btn.classList.add('active');
                        } else {
                            btn.classList.remove('active');
                        }
                    } catch (e) {}
                }
            });
        }
    }

    console.log('✅ Stage 5/18 — Sections 11-12 loaded');

    /* =========================================
       SECTION 13: ABOUT US MANAGEMENT
       ========================================= */
    const aboutForm = document.getElementById('pageTitle');

    if (aboutForm) {

        function getAboutData() {
            try {
                const data = localStorage.getItem(ABOUT_KEY);
                return data ? JSON.parse(data) : null;
            } catch (e) { return null; }
        }

        function saveAboutData(data) {
            localStorage.setItem(ABOUT_KEY, JSON.stringify(data));
        }

        async function loadAboutData() {
            try {
                const resp = await API.get('/pages/about');
                const data = resp.success ? resp.data?.value : null;
                if (!data) return;

                if (data.pageTitle) document.getElementById('pageTitle').value = data.pageTitle;
                if (data.shortIntro) document.getElementById('shortIntro').value = data.shortIntro;
                if (data.ourStory) document.getElementById('ourStory').innerHTML = data.ourStory;
                if (data.ourMission) document.getElementById('ourMission').value = data.ourMission;
                if (data.ourVision) document.getElementById('ourVision').value = data.ourVision;

                if (data.image && document.getElementById('previewImg')) {
                    document.getElementById('previewImg').src = data.image;
                }

                if (data.statProjects !== undefined) document.getElementById('statProjects').value = data.statProjects;
                if (data.statClients !== undefined) document.getElementById('statClients').value = data.statClients;
                if (data.statSatisfaction !== undefined) document.getElementById('statSatisfaction').value = data.statSatisfaction;
                if (data.statExperience !== undefined) document.getElementById('statExperience').value = data.statExperience;

                if (data.contactAddress) document.getElementById('contactAddress').value = data.contactAddress;
                if (data.contactPhone) document.getElementById('contactPhone').value = data.contactPhone;
                if (data.contactEmail) document.getElementById('contactEmail').value = data.contactEmail;
                if (data.contactHours) document.getElementById('contactHours').value = data.contactHours;

                updateCharCounters();
            } catch (e) {
                console.error('loadAboutData error:', e);
            }
        }

        function updateCharCounters() {
            const shortIntro = document.getElementById('shortIntro');
            const ourMission = document.getElementById('ourMission');
            const ourVision = document.getElementById('ourVision');

            if (shortIntro) document.getElementById('shortIntroCount').textContent = shortIntro.value.length;
            if (ourMission) document.getElementById('missionCount').textContent = ourMission.value.length;
            if (ourVision) document.getElementById('visionCount').textContent = ourVision.value.length;
        }

        const shortIntroInput = document.getElementById('shortIntro');
        if (shortIntroInput) shortIntroInput.addEventListener('input', updateCharCounters);

        const ourMissionInput = document.getElementById('ourMission');
        if (ourMissionInput) ourMissionInput.addEventListener('input', updateCharCounters);

        const ourVisionInput = document.getElementById('ourVision');
        if (ourVisionInput) ourVisionInput.addEventListener('input', updateCharCounters);

        const aboutImageInput = document.getElementById('imageInput');
        const aboutPreviewImg = document.getElementById('previewImg');
        const aboutRemoveImageBtn = document.getElementById('removeImageBtn');

        let pendingAboutImage = null;

        if (aboutImageInput) {
            aboutImageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (file.size > 2 * 1024 * 1024) {
                    alert('⚠️ Image is larger than 2MB. It might slow down the page.');
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    aboutPreviewImg.src = event.target.result;
                    pendingAboutImage = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        if (aboutRemoveImageBtn) {
            aboutRemoveImageBtn.addEventListener('click', () => {
                if (!confirm('Are you sure you want to remove this image?')) return;
                aboutPreviewImg.src = 'assets/images/office-dashboard.png';
                pendingAboutImage = null;
            });
        }

        const saveAboutBtn = document.getElementById('saveAboutBtn');

        if (saveAboutBtn) {
            saveAboutBtn.addEventListener('click', async () => {
                const aboutData = {
                    pageTitle: document.getElementById('pageTitle').value.trim(),
                    shortIntro: document.getElementById('shortIntro').value.trim(),
                    ourStory: document.getElementById('ourStory').innerHTML,
                    ourMission: document.getElementById('ourMission').value.trim(),
                    ourVision: document.getElementById('ourVision').value.trim(),
                    image: pendingAboutImage || aboutPreviewImg.src,
                    statProjects: parseInt(document.getElementById('statProjects').value) || 0,
                    statClients: parseInt(document.getElementById('statClients').value) || 0,
                    statSatisfaction: parseInt(document.getElementById('statSatisfaction').value) || 0,
                    statExperience: parseInt(document.getElementById('statExperience').value) || 0,
                    contactAddress: document.getElementById('contactAddress').value.trim(),
                    contactPhone: document.getElementById('contactPhone').value.trim(),
                    contactEmail: document.getElementById('contactEmail').value.trim(),
                    contactHours: document.getElementById('contactHours').value.trim(),
                    lastUpdated: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kabul' })
                };

                if (!aboutData.pageTitle || !aboutData.shortIntro || !aboutData.ourMission || !aboutData.ourVision) {
                    alert('⚠️ Please fill in all required fields (Title, Short Intro, Mission, Vision).');
                    return;
                }

                const resp = await API.post('/pages/about', aboutData);
                if (resp.success) {
                    window.logActivity('update', 'Updated About Us page', 'info');
                    alert('✅ About Us page saved successfully!');
                    pendingAboutImage = null;
                } else {
                    alert('⚠️ ' + (resp.message || 'Failed to save'));
                }
            });
        }

        loadAboutData();
    }

    console.log('✅ Stage 6/18 — Section 13 loaded');

    /* =========================================
       SECTION 14: CONTACT MANAGEMENT
       ========================================= */
    const contactPageTitle = document.getElementById('contactPageTitle');

    if (contactPageTitle) {

        function getContactData() {
            try {
                const data = localStorage.getItem(CONTACT_KEY);
                return data ? JSON.parse(data) : null;
            } catch (e) { return null; }
        }

        function saveContactData(data) {
            localStorage.setItem(CONTACT_KEY, JSON.stringify(data));
        }

        async function loadContactData() {
            try {
                const resp = await API.get('/pages/contact');
                const data = resp.success ? resp.data?.value : null;
                if (!data) return;

                if (data.pageTitle) document.getElementById('contactPageTitle').value = data.pageTitle;
                if (data.shortDesc) document.getElementById('contactShortDesc').value = data.shortDesc;
                if (data.mainContent) document.getElementById('contactMainContent').innerHTML = data.mainContent;
                if (data.image && document.getElementById('previewImg')) {
                    document.getElementById('previewImg').src = data.image;
                }
                if (data.address) document.getElementById('contactAddress').value = data.address;
                if (data.phone) document.getElementById('contactPhone').value = data.phone;
                if (data.email) document.getElementById('contactEmail').value = data.email;
                if (data.whatsapp) document.getElementById('contactWhatsApp').value = data.whatsapp;
                if (data.workingHours) document.getElementById('workingHours').value = data.workingHours;
                if (data.mapEmbed) document.getElementById('mapEmbedCode').value = data.mapEmbed;

                updateContactCharCounters();
            } catch (e) {
                console.error('loadContactData error:', e);
            }
        }

        function updateContactCharCounters() {
            const shortDesc = document.getElementById('contactShortDesc');
            const mainContent = document.getElementById('contactMainContent');

            if (shortDesc) document.getElementById('shortDescCount').textContent = shortDesc.value.length;
            if (mainContent) document.getElementById('mainContentCount').textContent = mainContent.textContent.length;
        }

        const contactShortDescInput = document.getElementById('contactShortDesc');
        if (contactShortDescInput) contactShortDescInput.addEventListener('input', updateContactCharCounters);

        const contactMainContentInput = document.getElementById('contactMainContent');
        if (contactMainContentInput) contactMainContentInput.addEventListener('input', updateContactCharCounters);

        const contactImageInput = document.getElementById('imageInput');
        const contactPreviewImg = document.getElementById('previewImg');
        const contactRemoveImageBtn = document.getElementById('removeImageBtn');

        let pendingContactImage = null;

        if (contactImageInput) {
            contactImageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (file.size > 2 * 1024 * 1024) {
                    alert('⚠️ Image is larger than 2MB. It might slow down the page.');
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    contactPreviewImg.src = event.target.result;
                    pendingContactImage = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        if (contactRemoveImageBtn) {
            contactRemoveImageBtn.addEventListener('click', () => {
                if (!confirm('Are you sure you want to remove this image?')) return;
                contactPreviewImg.src = 'assets/images/office-dashboard.png';
                pendingContactImage = null;
            });
        }

        const saveContactBtn = document.getElementById('saveContactBtn');

        if (saveContactBtn) {
            saveContactBtn.addEventListener('click', async () => {
                const contactData = {
                    pageTitle: document.getElementById('contactPageTitle').value.trim(),
                    shortDesc: document.getElementById('contactShortDesc').value.trim(),
                    mainContent: document.getElementById('contactMainContent').innerHTML,
                    image: pendingContactImage || contactPreviewImg.src,
                    address: document.getElementById('contactAddress').value.trim(),
                    phone: document.getElementById('contactPhone').value.trim(),
                    email: document.getElementById('contactEmail').value.trim(),
                    whatsapp: document.getElementById('contactWhatsApp').value.trim(),
                    workingHours: document.getElementById('workingHours').value.trim(),
                    mapEmbed: document.getElementById('mapEmbedCode').value.trim(),
                    lastUpdated: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kabul' })
                };

                if (!contactData.pageTitle || !contactData.shortDesc) {
                    alert('⚠️ Please fill in required fields (Title, Short Description).');
                    return;
                }

                const resp = await API.post('/pages/contact', contactData);
                if (resp.success) {
                    window.logActivity('update', 'Updated Contact page', 'info');
                    alert('✅ Contact page saved successfully!');
                    pendingContactImage = null;
                } else {
                    alert('⚠️ ' + (resp.message || 'Failed to save'));
                }
            });
        }

        loadContactData();
    }

    console.log('✅ Stage 7/18 — Section 14 loaded');

    /* =========================================
       SECTION 15: HOME MANAGEMENT
       ========================================= */
    const heroSmallTitle = document.getElementById('heroSmallTitle');

    if (heroSmallTitle) {

        function getHomeData() {
            try {
                const data = localStorage.getItem(HOME_KEY);
                return data ? JSON.parse(data) : null;
            } catch (e) { return null; }
        }

        function saveHomeData(data) {
            localStorage.setItem(HOME_KEY, JSON.stringify(data));
        }

        function updateLivePreview() {
            const smallTitle = document.getElementById('heroSmallTitle');
            const mainHeading = document.getElementById('heroMainHeading');
            const description = document.getElementById('heroDescription');

            const previewSmallTitle = document.getElementById('previewSmallTitle');
            const previewMainHeading = document.getElementById('previewMainHeading');
            const previewDescription = document.getElementById('previewDescription');

            if (previewSmallTitle) previewSmallTitle.textContent = smallTitle.value || 'Innovative Solutions for a Better Future';
            if (previewMainHeading) previewMainHeading.textContent = mainHeading.value || 'Premium Databases, Software & Applications';
            if (previewDescription) previewDescription.textContent = description.value || 'We design and provide high-quality ready-to-use databases...';
        }

        const heroMainHeading = document.getElementById('heroMainHeading');
        const heroDescription = document.getElementById('heroDescription');

        if (heroSmallTitle) heroSmallTitle.addEventListener('input', updateLivePreview);
        if (heroMainHeading) heroMainHeading.addEventListener('input', updateLivePreview);
        if (heroDescription) heroDescription.addEventListener('input', updateLivePreview);

        async function loadHomeData() {
            try {
                const resp = await API.get('/pages/home');
                const data = resp.success ? resp.data?.value : null;
                if (!data) return;

                if (data.smallTitle) heroSmallTitle.value = data.smallTitle;
                if (data.mainHeading) heroMainHeading.value = data.mainHeading;
                if (data.description) heroDescription.value = data.description;
                if (data.image && document.getElementById('heroPreviewImg')) {
                    document.getElementById('heroPreviewImg').src = data.image;
                }
                if (data.image && document.getElementById('previewHeroImg')) {
                    document.getElementById('previewHeroImg').src = data.image;
                }

                if (data.features && data.features.length > 0) {
                    const featureItems = document.querySelectorAll('.home-feature-item');
                    data.features.forEach((feature, index) => {
                        if (featureItems[index]) {
                            const titleInput = featureItems[index].querySelector('.feature-title-input');
                            const descInput = featureItems[index].querySelector('.feature-desc-input');
                            if (titleInput) titleInput.value = feature.title || '';
                            if (descInput) descInput.value = feature.desc || '';
                        }
                    });
                }

                updateLivePreview();
            } catch (e) {
                console.error('loadHomeData error:', e);
            }
        }

        const heroImageInput = document.getElementById('heroImageInput');
        const heroPreviewImg = document.getElementById('heroPreviewImg');
        const previewHeroImg = document.getElementById('previewHeroImg');
        const removeHeroImageBtn = document.getElementById('removeHeroImageBtn');

        let pendingHeroImage = null;

        if (heroImageInput) {
            heroImageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (file.size > 2 * 1024 * 1024) {
                    alert('⚠️ Image is larger than 2MB. It might slow down the page.');
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    heroPreviewImg.src = event.target.result;
                    if (previewHeroImg) previewHeroImg.src = event.target.result;
                    pendingHeroImage = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        if (removeHeroImageBtn) {
            removeHeroImageBtn.addEventListener('click', () => {
                if (!confirm('Are you sure you want to remove this image?')) return;
                heroPreviewImg.src = 'assets/images/Developer-Workpace-Mockup.png';
                if (previewHeroImg) previewHeroImg.src = 'assets/images/Developer-Workpace-Mockup.png';
                pendingHeroImage = null;
            });
        }

        window.deleteFeature = function(btn) {
            if (!confirm('Are you sure you want to delete this feature?')) return;
            const featureItem = btn.closest('.home-feature-item');
            if (featureItem) featureItem.remove();
        };

        const saveHomeBtn = document.getElementById('saveHomeBtn');

        if (saveHomeBtn) {
            saveHomeBtn.addEventListener('click', async () => {
                const features = [];
                document.querySelectorAll('.home-feature-item').forEach(item => {
                    const title = item.querySelector('.feature-title-input')?.value.trim() || '';
                    const desc = item.querySelector('.feature-desc-input')?.value.trim() || '';
                    if (title) features.push({ title: title, desc: desc });
                });

                const homeData = {
                    smallTitle: heroSmallTitle.value.trim(),
                    mainHeading: heroMainHeading.value.trim(),
                    description: heroDescription.value.trim(),
                    image: pendingHeroImage || heroPreviewImg.src,
                    features: features,
                    lastUpdated: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kabul' })
                };

                if (!homeData.smallTitle || !homeData.mainHeading || !homeData.description) {
                    alert('⚠️ Please fill in all required fields (Small Title, Main Heading, Description).');
                    return;
                }

                const resp = await API.post('/pages/home', homeData);
                if (resp.success) {
                    window.logActivity('update', 'Updated Home page', 'info');
                    alert('✅ Home page saved successfully!');
                    pendingHeroImage = null;
                } else {
                    alert('⚠️ ' + (resp.message || 'Failed to save'));
                }
            });
        }

        loadHomeData();
    }

    console.log('✅ Stage 8/18 — Section 15 loaded');

    /* =========================================
       SECTION 16: MESSAGES MANAGEMENT (API-Based)
       ========================================= */
    const messagesList = document.getElementById('messagesList');

    if (messagesList) {

        let currentMsgPage = 1;
        const messagesPerPage = 6;
        let messagesCache = [];
        let selectedMessageId = null;
        let currentStatusFilter = '';
        let currentSearchTerm = '';

        // =========================================
        // API: Fetch messages
        // =========================================
        async function fetchMessagesFromAPI() {
            try {
                const params = { per_page: 100 };
                if (currentStatusFilter) params.status = currentStatusFilter;
                if (currentSearchTerm) params.search = currentSearchTerm;

                const response = await API.get('/messages', params);

                if (response.success && response.data.messages) {
                    messagesCache = response.data.messages;
                    return messagesCache;
                }
                return [];
            } catch (e) {
                console.error('Failed to fetch messages:', e);
                return [];
            }
        }

        // =========================================
        // API: Fetch stats
        // =========================================
        async function fetchMsgStatsFromAPI() {
            try {
                const response = await API.get('/messages/stats');
                if (response.success && response.data) {
                    return response.data;
                }
                return { total: 0, unread: 0, replied: 0, archived: 0 };
            } catch (e) {
                console.error('Failed to fetch stats:', e);
                return { total: 0, unread: 0, replied: 0, archived: 0 };
            }
        }

        // =========================================
        // Helpers
        // =========================================
        function getAvatarColor(name) {
            const colors = ['blue', 'purple', 'green', 'orange', 'pink', 'teal'];
            let hash = 0;
            const safeName = name || 'Guest';
            for (let i = 0; i < safeName.length; i++) {
                hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
            }
            return colors[Math.abs(hash) % colors.length];
        }

        function getInitials(name) {
            if (!name) return '?';
            const parts = name.trim().split(' ');
            if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        }

        function formatShortDate(dateStr) {
            if (typeof window.formatDateGlobal === 'function') {
                return window.formatDateGlobal(dateStr);
            }
            
            // Fallback
            if (!dateStr) return 'N/A';
            try {
                const d = new Date(dateStr.replace(' ', 'T'));
                return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            } catch (e) {
                return dateStr.split(' ')[0] || 'N/A';
            }
        }

        function formatShortTime(dateStr) {
            if (!dateStr) return '';
            try {
                const d = new Date(dateStr.replace(' ', 'T'));
                return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            } catch (e) {
                return dateStr.split(' ')[1] || '';
            }
        }

        // =========================================
        // Update stats from API
        // =========================================
        async function updateMsgStats() {
            const stats = await fetchMsgStatsFromAPI();

            const elTotal = document.getElementById('statTotal');
            const elUnread = document.getElementById('statUnread');
            const elReplied = document.getElementById('statReplied');
            const elArchived = document.getElementById('statArchived');

            if (elTotal) elTotal.textContent = stats.total || 0;
            if (elUnread) elUnread.textContent = stats.unread || 0;
            if (elReplied) elReplied.textContent = stats.replied || 0;
            if (elArchived) elArchived.textContent = stats.archived || 0;

            // Badge سایدبار
            const sidebarBadge = document.getElementById('sidebarMsgCount');
            if (sidebarBadge) sidebarBadge.textContent = stats.unread || 0;
        }

        // =========================================
        // Load & Render messages
        // =========================================
        async function loadAndRenderMessages() {
            // لودینگ
            messagesList.innerHTML = `
                <div style="text-align:center; padding:40px; color:#A0AEC0;">
                    <i class="fas fa-spinner fa-spin" style="font-size:30px; margin-bottom:15px; display:block; color:#00A8FF;"></i>
                    Loading messages...
                </div>
            `;

            await fetchMessagesFromAPI();
            renderMessages();
            await updateMsgStats();
        }

        function renderMessages() {
            const totalMessages = messagesCache.length;
            const totalPages = Math.ceil(totalMessages / messagesPerPage) || 1;

            if (currentMsgPage > totalPages) currentMsgPage = totalPages;

            const startIndex = (currentMsgPage - 1) * messagesPerPage;
            const endIndex = startIndex + messagesPerPage;
            const pageMessages = messagesCache.slice(startIndex, endIndex);

            messagesList.innerHTML = '';

            if (totalMessages === 0) {
                messagesList.innerHTML = `
                    <div class="no-messages">
                        <i class="far fa-envelope"></i>
                        <h4>No Messages Found</h4>
                        <p>${currentSearchTerm || currentStatusFilter ? 'Try changing your filters.' : 'Messages from the contact form will appear here.'}</p>
                    </div>
                `;
                renderMessagesPagination(0, 1);
                return;
            }

            pageMessages.forEach(msg => {
                const item = document.createElement('div');
                item.className = 'msg-item' + (msg.status === 'unread' ? ' unread' : '') + (selectedMessageId === msg.id ? ' active' : '');
                item.setAttribute('data-id', msg.id);

                const shortMsg = (msg.message || '').substring(0, 60) + ((msg.message || '').length > 60 ? '...' : '');

                item.innerHTML = `
                    <div class="msg-avatar ${getAvatarColor(msg.name || 'Guest')}">
                        ${getInitials(msg.name)}
                    </div>
                    <div class="msg-info">
                        <div class="msg-info-header">
                            <h4>${msg.name || 'Anonymous'}</h4>
                            <span>${formatShortDate(msg.created_at)}</span>
                        </div>
                        <div class="msg-subject">${msg.subject || 'No Subject'}</div>
                        <div class="msg-preview">${shortMsg}</div>
                    </div>
                `;

                item.addEventListener('click', () => selectMessage(msg.id));
                messagesList.appendChild(item);
            });

            renderMessagesPagination(totalMessages, totalPages);
        }

        function renderMessagesPagination(totalItems, totalPages) {
            const paginationContainer = document.getElementById('messagesPagination');
            if (!paginationContainer) return;

            const startIndex = (currentMsgPage - 1) * messagesPerPage + 1;
            const endIndex = Math.min(currentMsgPage * messagesPerPage, totalItems);

            let paginationHTML = '';
            paginationHTML += `<div class="messages-pagination-info">Showing ${totalItems > 0 ? startIndex : 0} to ${endIndex} of ${totalItems} messages</div>`;
            paginationHTML += '<div class="messages-pagination-controls">';
            paginationHTML += `<button class="msg-page-btn ${currentMsgPage === 1 ? 'disabled' : ''}" data-page="prev"><i class="fas fa-chevron-left"></i></button>`;

            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= currentMsgPage - 1 && i <= currentMsgPage + 1)) {
                    paginationHTML += `<button class="msg-page-btn ${i === currentMsgPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
                } else if (i === currentMsgPage - 2 || i === currentMsgPage + 2) {
                    paginationHTML += '<span style="color: #4A5568; padding: 0 5px; align-self: center;">...</span>';
                }
            }

            paginationHTML += `<button class="msg-page-btn ${currentMsgPage === totalPages ? 'disabled' : ''}" data-page="next"><i class="fas fa-chevron-right"></i></button>`;
            paginationHTML += '</div>';

            paginationContainer.innerHTML = paginationHTML;

            paginationContainer.querySelectorAll('.msg-page-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const page = btn.getAttribute('data-page');
                    if (page === 'prev' && currentMsgPage > 1) { currentMsgPage--; renderMessages(); }
                    else if (page === 'next' && currentMsgPage < totalPages) { currentMsgPage++; renderMessages(); }
                    else if (page !== 'prev' && page !== 'next') { currentMsgPage = parseInt(page); renderMessages(); }
                });
            });
        }

        async function selectMessage(id) {
            selectedMessageId = id;
            messagesList.querySelectorAll('.msg-item').forEach(item => {
                item.classList.remove('active');
                if (parseInt(item.getAttribute('data-id')) === id) item.classList.add('active');
            });

            try {
                const response = await API.get('/messages/' + id);
                if (!response.success) {
                    alert('⚠️ Failed to load message');
                    return;
                }

                const msg = response.data;

                // اگه unread بود، لیست رو رفرش کن (چون API خودش read کرده)
                if (msg.status === 'read') {
                    const cached = messagesCache.find(m => m.id === id);
                    if (cached && cached.status === 'unread') {
                        cached.status = 'read';
                        renderMessages();
                        await updateMsgStats();
                    }
                }

                showMessageDetails(msg);

            } catch (e) {
                console.error(e);
                alert('⚠️ Network error');
            }
        }

        function showMessageDetails(msg) {
            const panel = document.getElementById('messageDetailsPanel');
            if (!panel) return;

            const safeSubject = (msg.subject || '').replace(/'/g, "\\'");
            const safeEmail = (msg.email || '').replace(/'/g, "\\'");

            panel.innerHTML = `
                <div class="msg-details-header">
                    <h3>Message Details</h3>
                    <div class="msg-details-actions">
                        <button class="msg-action-btn reply" onclick="replyToMessage('${safeEmail}', '${safeSubject}')">
                            <i class="fas fa-reply"></i> Reply
                        </button>
                        <button class="msg-action-btn mark-read" onclick="toggleReadStatus(${msg.id}, '${msg.status}')">
                            <i class="fas fa-${msg.status === 'unread' ? 'envelope-open' : 'envelope'}"></i> Mark as ${msg.status === 'unread' ? 'Read' : 'Unread'}
                        </button>
                        <button class="msg-action-btn delete" onclick="deleteMessage(${msg.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="msg-sender-info">
                    <div class="msg-avatar msg-sender-avatar ${getAvatarColor(msg.name || 'Guest')}">${getInitials(msg.name)}</div>
                    <div class="msg-sender-details">
                        <h4>${msg.name || 'Anonymous'}</h4>
                        <p><i class="fas fa-envelope"></i> ${msg.email || 'No email'}</p>
                        ${msg.phone ? `<p><i class="fas fa-phone"></i> ${msg.phone}</p>` : ''}
                    </div>
                    <div class="msg-date-time">
                        <div>${formatShortDate(msg.created_at)}</div>
                        <div>${formatShortTime(msg.created_at)}</div>
                    </div>
                </div>
                <div class="msg-subject-block">
                    <label>Subject</label>
                    <h4>${msg.subject || 'No Subject'}</h4>
                </div>
                <div class="msg-body-block">
                    <label>Message</label>
                    <div class="msg-body-content">${msg.message || 'No message content'}</div>
                </div>
                <div class="msg-details-bottom">
                    <h4>Actions</h4>
                    <div class="msg-bottom-grid">
                        <div>
                            <label style="font-size: 12px; color: #A0AEC0; display: block; margin-bottom: 6px;">Status</label>
                            <select class="msg-status-select" onchange="changeMessageStatus(${msg.id}, this.value)">
                                <option value="unread" ${msg.status === 'unread' ? 'selected' : ''}>Unread</option>
                                <option value="read" ${msg.status === 'read' ? 'selected' : ''}>Read</option>
                                <option value="replied" ${msg.status === 'replied' ? 'selected' : ''}>Replied</option>
                                <option value="archived" ${msg.status === 'archived' ? 'selected' : ''}>Archived</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #A0AEC0; display: block; margin-bottom: 6px;">Add Note (Optional)</label>
                            <textarea class="msg-note-input" id="msgNoteInput" rows="2" placeholder="Add a note...">${msg.note || ''}</textarea>
                        </div>
                        <button class="msg-save-note-btn" onclick="saveMessageNote(${msg.id})">
                            <i class="fas fa-save"></i> Save Note
                        </button>
                    </div>
                </div>
            `;
        }

        // =========================================
        // Window functions (global)
        // =========================================
        window.replyToMessage = function(email, subject) {
            if (!email) { alert('No email address to reply to.'); return; }
            window.location.href = `mailto:${email}?subject=Re: ${encodeURIComponent(subject)}`;
        };

        window.toggleReadStatus = async function(id, currentStatus) {
            const newStatus = currentStatus === 'unread' ? 'read' : 'unread';
            try {
                const response = await API.put('/messages/' + id, { status: newStatus });
                if (response.success) {
                    await loadAndRenderMessages();
                    await selectMessage(id);
                }
            } catch (e) {
                console.error(e);
            }
        };

        window.changeMessageStatus = async function(id, newStatus) {
            try {
                const response = await API.put('/messages/' + id, { status: newStatus });
                if (response.success) {
                    await loadAndRenderMessages();
                }
            } catch (e) {
                console.error(e);
            }
        };

        window.deleteMessage = async function(id) {
            if (!confirm('Are you sure you want to delete this message?')) return;

            try {
                const response = await API.del('/messages/' + id);
                if (response.success) {
                    selectedMessageId = null;

                    const panel = document.getElementById('messageDetailsPanel');
                    if (panel) {
                        panel.innerHTML = `
                            <div class="message-empty-state" id="emptyState">
                                <i class="far fa-envelope"></i>
                                <h3>Select a message</h3>
                                <p>Click on a message from the list to view its details.</p>
                            </div>
                        `;
                    }

                    await loadAndRenderMessages();
                } else {
                    alert('⚠️ ' + (response.message || 'Failed to delete'));
                }
            } catch (e) {
                console.error(e);
                alert('⚠️ Network error');
            }
        };

        window.saveMessageNote = async function(id) {
            const noteInput = document.getElementById('msgNoteInput');
            if (!noteInput) return;

            const note = noteInput.value.trim();

            try {
                const response = await API.put('/messages/' + id, { note: note });
                if (response.success) {
                    alert('✅ Note saved successfully!');
                    await loadAndRenderMessages();
                } else {
                    alert('⚠️ ' + (response.message || 'Failed to save note'));
                }
            } catch (e) {
                console.error(e);
                alert('⚠️ Network error');
            }
        };

        // =========================================
        // Filter listeners
        // =========================================
        const msgSearchInput = document.getElementById('msgSearchInput');
        if (msgSearchInput) {
            let searchTimeout;
            msgSearchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    currentSearchTerm = e.target.value.toLowerCase().trim();
                    currentMsgPage = 1;
                    loadAndRenderMessages();
                }, 400);
            });
        }

        const msgStatusFilter = document.getElementById('msgStatusFilter');
        if (msgStatusFilter) {
            msgStatusFilter.addEventListener('change', (e) => {
                currentStatusFilter = e.target.value;
                currentMsgPage = 1;
                loadAndRenderMessages();
            });
        }

        // =========================================
        // Initial load
        // =========================================
        loadAndRenderMessages();
    }

    console.log('✅ Stage 9/18 — Section 16 loaded');

    /* =========================================
       SECTION 17: MEDIA LIBRARY MANAGEMENT (API-Based)
       ========================================= */
    const mediaGrid = document.getElementById('mediaGrid');

    if (mediaGrid) {

        let currentMediaPage = 1;
        const mediaPerPage = 12;
        let mediaCache = [];
        let currentMediaType = 'all';
        let currentMediaSearch = '';
        let currentView = 'grid';

        // =========================================
        // API: Fetch media
        // =========================================
        async function fetchMediaFromAPI() {
            try {
                const params = { per_page: 100 };
                if (currentMediaType !== 'all') params.type = currentMediaType;
                if (currentMediaSearch) params.search = currentMediaSearch;

                const response = await API.get('/media', params);

                if (response.success && response.data.media) {
                    mediaCache = response.data.media;
                    return mediaCache;
                }
                return [];
            } catch (e) {
                console.error('Failed to fetch media:', e);
                return [];
            }
        }

        // =========================================
        // API: Fetch media stats
        // =========================================
        async function fetchMediaStatsFromAPI() {
            try {
                const response = await API.get('/media/stats');
                if (response.success && response.data) {
                    return response.data;
                }
                return { total: 0, images: 0, documents: 0, others: 0, total_size: 0 };
            } catch (e) {
                console.error('Failed to fetch stats:', e);
                return { total: 0, images: 0, documents: 0, others: 0, total_size: 0 };
            }
        }

        // =========================================
        // Helper Functions
        // =========================================
        function formatFileSize(bytes) {
            if (!bytes) return '0 B';
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        }

        function getFileIcon(fileName) {
            const ext = (fileName || '').split('.').pop().toLowerCase();
            const icons = {
                'pdf': 'fas fa-file-pdf',
                'doc': 'fas fa-file-word',
                'docx': 'fas fa-file-word',
                'txt': 'fas fa-file-alt',
                'xls': 'fas fa-file-excel',
                'xlsx': 'fas fa-file-excel',
                'zip': 'fas fa-file-archive',
                'rar': 'fas fa-file-archive'
            };
            return icons[ext] || 'fas fa-file';
        }

        // =========================================
        // Update counts & storage
        // =========================================
        async function updateCountsAndStorage() {
            const stats = await fetchMediaStatsFromAPI();

            const countAll = document.getElementById('countAll');
            const countImages = document.getElementById('countImages');
            const countDocs = document.getElementById('countDocs');
            const countOthers = document.getElementById('countOthers');

            if (countAll) countAll.textContent = stats.total || 0;
            if (countImages) countImages.textContent = stats.images || 0;
            if (countDocs) countDocs.textContent = stats.documents || 0;
            if (countOthers) countOthers.textContent = stats.others || 0;

            // Storage display
            const storageUsed = document.getElementById('storageUsed');
            const storageLimit = document.getElementById('storageLimit');
            const storagePercent = document.getElementById('storagePercent');
            const progressBar = document.getElementById('storageProgressBar');

            const usedMB = (stats.total_size / (1024 * 1024)).toFixed(2);
            const limitMB = 500;
            const percent = Math.min((usedMB / limitMB) * 100, 100);

            if (storageUsed) storageUsed.textContent = usedMB;
            if (storageLimit) storageLimit.textContent = limitMB;
            if (storagePercent) storagePercent.textContent = percent.toFixed(1) + '%';
            if (progressBar) {
                progressBar.style.width = percent + '%';
                if (percent >= 90) progressBar.style.background = 'linear-gradient(90deg, #EF4444, #DC2626)';
                else if (percent >= 70) progressBar.style.background = 'linear-gradient(90deg, #F59E0B, #D97706)';
                else progressBar.style.background = 'linear-gradient(90deg, #00A8FF, #0084CC)';
            }
        }

        // =========================================
        // Load & Render Media
        // =========================================
        async function loadAndRenderMedia() {
            mediaGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:60px; color:#A0AEC0;">
                    <i class="fas fa-spinner fa-spin" style="font-size:40px; margin-bottom:15px; display:block; color:#00A8FF;"></i>
                    Loading media...
                </div>
            `;

            await fetchMediaFromAPI();
            renderMedia();
            await updateCountsAndStorage();
        }

        function renderMedia() {
            const totalItems = mediaCache.length;
            const totalPages = Math.ceil(totalItems / mediaPerPage) || 1;
            if (currentMediaPage > totalPages) currentMediaPage = totalPages;

            const startIndex = (currentMediaPage - 1) * mediaPerPage;
            const endIndex = startIndex + mediaPerPage;
            const pageItems = mediaCache.slice(startIndex, endIndex);

            mediaGrid.innerHTML = '';

            const emptyState = document.getElementById('mediaEmptyState');

            if (totalItems === 0) {
                mediaGrid.style.display = 'none';
                if (emptyState) emptyState.style.display = 'block';
                renderMediaPagination(0, 1);
                return;
            }

            mediaGrid.style.display = 'grid';
            if (emptyState) emptyState.style.display = 'none';

            if (currentView === 'list') mediaGrid.classList.add('list-view');
            else mediaGrid.classList.remove('list-view');

            pageItems.forEach(item => {
                const mediaItem = document.createElement('div');
                mediaItem.className = 'media-item';

                let thumbnailHTML = '';
                if (item.file_type === 'image') {
                    thumbnailHTML = `<img src="${item.url}" alt="${item.alt_text || item.file_name}" onerror="this.src='assets/images/logo.png'">`;
                } else {
                    thumbnailHTML = `<i class="${getFileIcon(item.file_name)} file-icon"></i>`;
                }

                // فرمت تاریخ
                let dateStr = '';
                if (item.created_at) {
                    try {
                        const d = new Date(item.created_at.replace(' ', 'T'));
                        dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                    } catch (e) {
                        dateStr = item.created_at.split(' ')[0];
                    }
                }

                mediaItem.innerHTML = `
                    <div class="media-thumbnail">${thumbnailHTML}</div>
                    <div class="media-info">
                        <h4 title="${item.file_name}">${item.file_name}</h4>
                        <p>${item.dimensions || ''} ${item.dimensions ? '•' : ''} ${formatFileSize(item.file_size)}</p>
                        <p>${dateStr}</p>
                    </div>
                    <div class="media-actions">
                        <button class="media-action-btn view" onclick="viewMediaItem(${item.id})" title="View"><i class="fas fa-eye"></i></button>
                        <button class="media-action-btn download" onclick="downloadMediaItem(${item.id})" title="Download"><i class="fas fa-download"></i></button>
                        <button class="media-action-btn edit" onclick="renameMediaItem(${item.id})" title="Rename"><i class="fas fa-pencil-alt"></i></button>
                        <button class="media-action-btn delete" onclick="deleteMediaItem(${item.id})" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                `;

                mediaGrid.appendChild(mediaItem);
            });

            renderMediaPagination(totalItems, totalPages);
        }

        function renderMediaPagination(totalItems, totalPages) {
            const paginationContainer = document.getElementById('mediaPagination');
            if (!paginationContainer) return;

            const startIndex = (currentMediaPage - 1) * mediaPerPage + 1;
            const endIndex = Math.min(currentMediaPage * mediaPerPage, totalItems);

            let html = '';
            html += `<div class="media-pagination-info">Showing ${totalItems > 0 ? startIndex : 0} to ${endIndex} of ${totalItems} files</div>`;
            html += '<div class="media-pagination-controls">';
            html += `<button class="media-page-btn ${currentMediaPage === 1 ? 'disabled' : ''}" data-page="prev"><i class="fas fa-chevron-left"></i></button>`;

            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= currentMediaPage - 1 && i <= currentMediaPage + 1)) {
                    html += `<button class="media-page-btn ${i === currentMediaPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
                } else if (i === currentMediaPage - 2 || i === currentMediaPage + 2) {
                    html += '<span style="color: #4A5568; padding: 0 5px; align-self: center;">...</span>';
                }
            }

            html += `<button class="media-page-btn ${currentMediaPage === totalPages ? 'disabled' : ''}" data-page="next"><i class="fas fa-chevron-right"></i></button>`;
            html += '</div>';

            paginationContainer.innerHTML = html;

            paginationContainer.querySelectorAll('.media-page-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const page = btn.getAttribute('data-page');
                    if (page === 'prev' && currentMediaPage > 1) { currentMediaPage--; renderMedia(); }
                    else if (page === 'next' && currentMediaPage < totalPages) { currentMediaPage++; renderMedia(); }
                    else if (page !== 'prev' && page !== 'next') { currentMediaPage = parseInt(page); renderMedia(); }
                });
            });
        }

        // =========================================
        // UPLOAD FILES
        // =========================================
        const mediaFileInput = document.getElementById('mediaFileInput');

        if (mediaFileInput) {
            mediaFileInput.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files);
                if (files.length === 0) return;

                // چک حجم (max 5MB هر فایل)
                const oversizedFiles = files.filter(f => f.size > 5 * 1024 * 1024);
                if (oversizedFiles.length > 0) {
                    const names = oversizedFiles.map(f => `${f.name} (${formatFileSize(f.size)})`).join('\n');
                    alert(`⚠️ Files too large (max 5MB):\n\n${names}`);
                    mediaFileInput.value = '';
                    return;
                }

                // ساخت FormData
                const formData = new FormData();
                files.forEach(file => {
                    formData.append('files[]', file);
                });

                // لودینگ
                const uploadBtn = document.querySelector('.btn-upload-files');
                const originalHTML = uploadBtn ? uploadBtn.innerHTML : '';
                if (uploadBtn) {
                    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
                    uploadBtn.style.pointerEvents = 'none';
                }

                try {
                    const token = Auth.getToken();
                    const response = await fetch((window.API_BASE || 'http://localhost/Akbari-Solution/api/v1') + '/media/upload', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'Accept': 'application/json'
                        },
                        body: formData
                    });

                    const data = await response.json();

                    if (data.success) {
                        window.logActivity('add', `Uploaded ${data.data.count} file(s)`, 'success');
                        alert(`✅ ${data.data.count} file(s) uploaded successfully!`);

                        mediaFileInput.value = '';
                        await loadAndRenderMedia();
                    } else {
                        alert('⚠️ ' + (data.message || 'Upload failed'));
                    }
                } catch (err) {
                    console.error('Upload error:', err);
                    alert('⚠️ Network error. Please try again.');
                } finally {
                    if (uploadBtn) {
                        uploadBtn.innerHTML = originalHTML;
                        uploadBtn.style.pointerEvents = '';
                    }
                }
            });
        }

        // =========================================
        // VIEW
        // =========================================
        window.viewMediaItem = function(id) {
            const item = mediaCache.find(i => i.id === id);
            if (!item) return;

            if (item.file_type === 'image') {
                const modal = document.createElement('div');
                modal.className = 'media-view-modal';
                modal.innerHTML = `
                    <div class="media-view-content" onclick="event.stopPropagation()">
                        <button class="media-view-close" onclick="this.closest('.media-view-modal').remove()"><i class="fas fa-times"></i></button>
                        <img src="${item.url}" alt="${item.alt_text || item.file_name}">
                        <div class="media-view-info">
                            <h3>${item.file_name}</h3>
                            <p>${item.dimensions || ''} • ${formatFileSize(item.file_size)}</p>
                        </div>
                    </div>
                `;
                modal.onclick = () => modal.remove();
                document.body.appendChild(modal);
                setTimeout(() => modal.classList.add('active'), 10);
            } else {
                alert(`File: ${item.file_name}\nType: ${item.file_type}\nSize: ${formatFileSize(item.file_size)}`);
            }
        };

        // =========================================
        // DOWNLOAD
        // =========================================
        window.downloadMediaItem = function(id) {
            const item = mediaCache.find(i => i.id === id);
            if (!item) return;

            const link = document.createElement('a');
            link.href = item.url;
            link.download = item.file_name;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        // =========================================
        // RENAME
        // =========================================
        window.renameMediaItem = async function(id) {
            const item = mediaCache.find(i => i.id === id);
            if (!item) return;

            const newName = prompt('Enter new file name:', item.file_name);

            if (newName && newName.trim() !== '' && newName !== item.file_name) {
                try {
                    const response = await API.put('/media/' + id, { file_name: newName.trim() });
                    if (response.success) {
                        window.logActivity('update', `Renamed: "${item.file_name}" → "${newName}"`, 'info');
                        await loadAndRenderMedia();
                    } else {
                        alert('⚠️ ' + (response.message || 'Failed to rename'));
                    }
                } catch (e) {
                    console.error(e);
                    alert('⚠️ Network error');
                }
            }
        };

        // =========================================
        // DELETE
        // =========================================
        window.deleteMediaItem = async function(id) {
            if (!confirm('Are you sure you want to delete this file?')) return;

            try {
                const response = await API.del('/media/' + id);
                if (response.success) {
                    const deletedItem = mediaCache.find(i => i.id === id);
                    window.logActivity('delete', `Deleted file: ${deletedItem?.file_name || 'Unknown'}`, 'danger');
                    await loadAndRenderMedia();
                } else {
                    alert('⚠️ ' + (response.message || 'Failed to delete'));
                }
            } catch (e) {
                console.error(e);
                alert('⚠️ Network error');
            }
        };

        // =========================================
        // TABS
        // =========================================
        const mediaTabs = document.querySelectorAll('.media-tab');
        mediaTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                mediaTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentMediaType = tab.getAttribute('data-type') || 'all';
                currentMediaPage = 1;
                loadAndRenderMedia();
            });
        });

        const mediaSearchInput = document.getElementById('mediaSearchInput');
        if (mediaSearchInput) {
            let searchTimeout;
            mediaSearchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    currentMediaSearch = e.target.value.toLowerCase().trim();
                    currentMediaPage = 1;
                    loadAndRenderMedia();
                }, 400);
            });
        }

        const mediaTypeFilter = document.getElementById('mediaTypeFilter');
        if (mediaTypeFilter) {
            mediaTypeFilter.addEventListener('change', (e) => {
                currentMediaType = e.target.value || 'all';
                mediaTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-type') === currentMediaType));
                currentMediaPage = 1;
                loadAndRenderMedia();
            });
        }

        const viewBtns = document.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentView = btn.getAttribute('data-view');
                renderMedia();
            });
        });

        // =========================================
        // Initial Load
        // =========================================
        loadAndRenderMedia();
    }

    console.log('✅ Stage 10/18 — Section 17 loaded (API-Based)');

    /* =========================================
       SECTION 18 (PART 1): WEBSITE SETTINGS TABS
       General Settings + Appearance Settings
       ========================================= */
    const wsTabsNav = document.querySelector('.ws-tabs-nav');

    if (wsTabsNav) {

        const wsTabs = document.querySelectorAll('.ws-tab');
        const wsTabContents = document.querySelectorAll('.ws-tab-content');

        wsTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');

                wsTabs.forEach(t => t.classList.remove('active'));
                wsTabContents.forEach(c => c.classList.remove('active'));

                tab.classList.add('active');
                const targetContent = document.getElementById('tab-' + targetTab);
                if (targetContent) targetContent.classList.add('active');
            });
        });

        applyTabLocks();

        // =========================================
        // Settings Cache (API-Based)
        // =========================================
        let wsSettingsCache = {};
        let wsSettingsLoaded = false;

        async function fetchWSSettingsFromAPI() {
            try {
                const response = await API.get('/settings');
                if (response.success && response.data) {
                    wsSettingsCache = response.data;
                    wsSettingsLoaded = true;
                    return wsSettingsCache;
                }
                return {};
            } catch (e) {
                console.error('Failed to fetch settings:', e);
                return {};
            }
        }

        function getWSSettings() {
            // از cache برمیگردونه (sync)
            return wsSettingsCache || {};
        }

        async function saveWSSettingsAsync(settings) {
            // ذخیره توی API
            try {
                const response = await API.post('/settings', settings);
                if (response.success) {
                    wsSettingsCache = response.data.settings || settings;
                    wsSettingsLoaded = true;
                    return true;
                }
                return false;
            } catch (e) {
                console.error('Save settings error:', e);
                return false;
            }
        }

        // =========================================
        // GENERAL SETTINGS
        // =========================================
        async function loadGeneralSettings() {
            if (!wsSettingsLoaded) {
                await fetchWSSettingsFromAPI();
            }

            const settings = getWSSettings();
            const g = settings.general || {};

            const fieldMap = {
                siteTitle: 'siteTitle', siteTagline: 'siteTagline',
                siteDescription: 'siteDescription', siteUrl: 'siteUrl',
                siteLanguage: 'siteLanguage', siteTimezone: 'siteTimezone',
                siteDateFormat: 'siteDateFormat', metaTitle: 'metaTitle',
                metaKeywords: 'metaKeywords', metaDescription: 'metaDescription'
            };

            Object.keys(fieldMap).forEach(id => {
                const el = document.getElementById(id);
                if (el && g[id]) el.value = g[id];
            });

            if (g.logo) {
                const logoPreview = document.getElementById('logoPreview');
                if (logoPreview) {
                    const img = logoPreview.querySelector('img');
                    if (img) img.src = g.logo;
                }
            }

            if (g.favicon) {
                const favPreview = document.getElementById('faviconPreview');
                if (favPreview) {
                    const img = favPreview.querySelector('img');
                    if (img) img.src = g.favicon;
                }
            }
        }

        window.saveGeneralSettings = async function() {
            const g = {
                siteTitle: document.getElementById('siteTitle')?.value.trim() || '',
                siteTagline: document.getElementById('siteTagline')?.value.trim() || '',
                siteDescription: document.getElementById('siteDescription')?.value.trim() || '',
                siteUrl: document.getElementById('siteUrl')?.value.trim() || '',
                siteLanguage: document.getElementById('siteLanguage')?.value || 'English',
                siteTimezone: document.getElementById('siteTimezone')?.value || 'Asia/Kabul',
                siteDateFormat: document.getElementById('siteDateFormat')?.value || 'F j, Y',
                metaTitle: document.getElementById('metaTitle')?.value.trim() || '',
                metaKeywords: document.getElementById('metaKeywords')?.value.trim() || '',
                metaDescription: document.getElementById('metaDescription')?.value.trim() || '',
                logo: document.getElementById('logoPreview')?.querySelector('img')?.src || '',
                favicon: document.getElementById('faviconPreview')?.querySelector('img')?.src || ''
            };

            if (!g.siteTitle) {
                alert('⚠️ Site Title is required!');
                return;
            }

            const success = await saveWSSettingsAsync({ general: g });

            if (success) {
                window.logActivity('update', 'Updated General Settings', 'info');
                alert('✅ General Settings saved successfully!');
            } else {
                alert('⚠️ Failed to save settings. Please try again.');
            }
        };

        window.resetGeneralSettings = async function() {
            if (!confirm('Reset General Settings to default?')) return;
            const success = await saveWSSettingsAsync({ general: {} });
            if (success) {
                if (window.logActivity) window.logActivity('update', 'Reset General Settings', 'warning');
                window.location.reload();
            } else {
                alert('⚠️ Failed to reset');
            }
        };

        // Logo & Favicon Upload
        const logoInput = document.getElementById('logoInput');
        if (logoInput) {
            logoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 1024 * 1024) { alert('⚠️ Logo is too large (max 1MB).'); return; }
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = document.getElementById('logoPreview')?.querySelector('img');
                    if (img) img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        const faviconInput = document.getElementById('faviconInput');
        if (faviconInput) {
            faviconInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 512 * 1024) { alert('⚠️ Favicon is too large (max 512KB).'); return; }
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = document.getElementById('faviconPreview')?.querySelector('img');
                    if (img) img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        window.removeImage = function(type) {
            if (!confirm(`Remove ${type}?`)) return;
            if (type === 'logo') {
                const img = document.getElementById('logoPreview')?.querySelector('img');
                if (img) img.src = 'assets/images/logo.png';
            } else if (type === 'favicon') {
                const img = document.getElementById('faviconPreview')?.querySelector('img');
                if (img) img.src = 'assets/images/logo.png';
            }
        };

        // =========================================
        // APPEARANCE SETTINGS
        // =========================================
        function shadeColor(color, percent) {
            let R = parseInt(color.substring(1, 3), 16);
            let G = parseInt(color.substring(3, 5), 16);
            let B = parseInt(color.substring(5, 7), 16);

            R = parseInt(R * (100 + percent) / 100);
            G = parseInt(G * (100 + percent) / 100);
            B = parseInt(B * (100 + percent) / 100);

            R = (R < 255) ? R : 255;
            G = (G < 255) ? G : 255;
            B = (B < 255) ? B : 255;

            const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
            const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
            const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

            return "#" + RR + GG + BB;
        }

        function updatePreviewColors() {
            const primaryVal = (document.getElementById('primaryColorText')?.value) || (document.getElementById('primaryColor')?.value) || '#0DA4FF';
            const secondaryVal = (document.getElementById('secondaryColorText')?.value) || (document.getElementById('secondaryColor')?.value) || '#6366F1';
            const accentVal = (document.getElementById('accentColorText')?.value) || (document.getElementById('accentColor')?.value) || '#10B981';

            const palettePrimary = document.getElementById('palettePrimary');
            const paletteSecondary = document.getElementById('paletteSecondary');
            const paletteAccent = document.getElementById('paletteAccent');

            if (palettePrimary) palettePrimary.textContent = primaryVal;
            if (paletteSecondary) paletteSecondary.textContent = secondaryVal;
            if (paletteAccent) paletteAccent.textContent = accentVal;

            const paletteItems = document.querySelectorAll('.palette-color');
            if (paletteItems.length >= 3) {
                paletteItems[0].style.background = primaryVal;
                paletteItems[1].style.background = secondaryVal;
                paletteItems[2].style.background = accentVal;
            }

            const previewPrimaryBtn = document.querySelector('.preview-btn-primary');
            const previewBadge = document.querySelector('.preview-badge');
            const previewH4Span = document.querySelector('.preview-hero h4 span');
            const previewHeader = document.querySelector('.preview-header');

            if (previewPrimaryBtn) previewPrimaryBtn.style.backgroundColor = primaryVal;
            if (previewBadge) {
                previewBadge.style.color = primaryVal;
                previewBadge.style.borderColor = primaryVal + '50';
                previewBadge.style.backgroundColor = primaryVal + '15';
            }
            if (previewH4Span) previewH4Span.style.color = primaryVal;
            if (previewHeader) previewHeader.style.borderBottomColor = primaryVal + '30';

            const previewButtons = document.querySelectorAll('.preview-btn-primary, .preview-btn-outline');
            const buttonStyleSelect = document.getElementById('buttonStyle');
            if (buttonStyleSelect && previewButtons.length > 0) {
                const style = buttonStyleSelect.value;
                previewButtons.forEach(btn => {
                    if (style === 'Rounded') btn.style.borderRadius = '8px';
                    else if (style === 'Square') btn.style.borderRadius = '0';
                    else if (style === 'Pill') btn.style.borderRadius = '50px';
                });
            }
        }

        function loadAppearanceSettings() {
            const settings = getWSSettings();
            const a = settings.appearance || {};

            const primaryColor = document.getElementById('primaryColor');
            const primaryColorText = document.getElementById('primaryColorText');
            const secondaryColor = document.getElementById('secondaryColor');
            const secondaryColorText = document.getElementById('secondaryColorText');
            const accentColor = document.getElementById('accentColor');
            const accentColorText = document.getElementById('accentColorText');

            const defaultPrimary = a.primaryColor || '#0DA4FF';
            const defaultSecondary = a.secondaryColor || '#6366F1';
            const defaultAccent = a.accentColor || '#10B981';

            if (primaryColor) primaryColor.value = defaultPrimary;
            if (primaryColorText) primaryColorText.value = defaultPrimary;
            if (secondaryColor) secondaryColor.value = defaultSecondary;
            if (secondaryColorText) secondaryColorText.value = defaultSecondary;
            if (accentColor) accentColor.value = defaultAccent;
            if (accentColorText) accentColorText.value = defaultAccent;

            const fontFamily = document.getElementById('fontFamily');
            const headerStyle = document.getElementById('headerStyle');
            const buttonStyle = document.getElementById('buttonStyle');
            const customCSS = document.getElementById('customCSS');
            const customJS = document.getElementById('customJS');

            if (fontFamily && a.fontFamily) fontFamily.value = a.fontFamily;
            if (headerStyle && a.headerStyle) headerStyle.value = a.headerStyle;
            if (buttonStyle && a.buttonStyle) buttonStyle.value = a.buttonStyle;
            if (customCSS && a.customCSS) customCSS.value = a.customCSS;
            if (customJS && a.customJS) customJS.value = a.customJS;

            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-theme') === (a.themeMode || 'dark'));
            });

            const palettePrimary = document.getElementById('palettePrimary');
            const paletteSecondary = document.getElementById('paletteSecondary');
            const paletteAccent = document.getElementById('paletteAccent');

            if (palettePrimary) palettePrimary.textContent = defaultPrimary;
            if (paletteSecondary) paletteSecondary.textContent = defaultSecondary;
            if (paletteAccent) paletteAccent.textContent = defaultAccent;

            updatePreviewColors();
        }

        function setupColorSync(colorId, textId, paletteId) {
            const colorInput = document.getElementById(colorId);
            const textInput = document.getElementById(textId);
            const palette = document.getElementById(paletteId);

            if (colorInput && textInput) {
                colorInput.addEventListener('input', () => {
                    textInput.value = colorInput.value;
                    if (palette) palette.textContent = colorInput.value;
                    updatePreviewColors();
                });
                textInput.addEventListener('input', () => {
                    if (/^#[0-9A-Fa-f]{6}$/.test(textInput.value)) {
                        colorInput.value = textInput.value;
                        if (palette) palette.textContent = textInput.value;
                        updatePreviewColors();
                    }
                });
            }
        }

        setupColorSync('primaryColor', 'primaryColorText', 'palettePrimary');
        setupColorSync('secondaryColor', 'secondaryColorText', 'paletteSecondary');
        setupColorSync('accentColor', 'accentColorText', 'paletteAccent');

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const theme = btn.getAttribute('data-theme');
                const previewBox = document.querySelector('.appearance-preview');
                if (previewBox) {
                    if (theme === 'light') previewBox.style.filter = 'brightness(1.15)';
                    else previewBox.style.filter = 'brightness(1)';
                }
            });
        });

        const fontFamilySelect = document.getElementById('fontFamily');
        if (fontFamilySelect) {
            fontFamilySelect.addEventListener('change', (e) => {
                const typographyPreview = document.querySelector('.typography-preview h3');
                const typographyPreviewP = document.querySelector('.typography-preview p');
                const fontName = document.getElementById('fontName');

                if (typographyPreview) typographyPreview.style.fontFamily = `'${e.target.value}', 'Poppins', sans-serif`;
                if (typographyPreviewP) typographyPreviewP.style.fontFamily = `'${e.target.value}', 'Poppins', sans-serif`;
                if (fontName) fontName.textContent = 'Font: ' + e.target.value;

                const fontId = 'google-font-' + e.target.value.replace(/\s+/g, '-').toLowerCase();
                if (!document.getElementById(fontId)) {
                    const link = document.createElement('link');
                    link.id = fontId;
                    link.rel = 'stylesheet';
                    link.href = `https://fonts.googleapis.com/css2?family=${e.target.value.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
                    document.head.appendChild(link);
                }
            });
        }

        const buttonStyleSelect = document.getElementById('buttonStyle');
        if (buttonStyleSelect) {
            buttonStyleSelect.addEventListener('change', () => updatePreviewColors());
        }

        function applySettingsInstantly(appearance) {
            if (appearance.primaryColor) {
                document.documentElement.style.setProperty('--primary-blue', appearance.primaryColor);
                document.documentElement.style.setProperty('--primary-blue-hover', shadeColor(appearance.primaryColor, -15));
            }
            if (appearance.secondaryColor) {
                document.documentElement.style.setProperty('--secondary-color', appearance.secondaryColor);
            }
            if (appearance.accentColor) {
                document.documentElement.style.setProperty('--accent-color', appearance.accentColor);
            }

            let actualTheme = appearance.themeMode || 'dark';
            if (appearance.themeMode === 'system') {
                actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            document.documentElement.setAttribute('data-theme', actualTheme);

            if (appearance.fontFamily) {
                document.body.style.fontFamily = `'${appearance.fontFamily}', 'Poppins', sans-serif`;
                let styleTag = document.getElementById('dynamic-font-style');
                if (!styleTag) {
                    styleTag = document.createElement('style');
                    styleTag.id = 'dynamic-font-style';
                    document.head.appendChild(styleTag);
                }
                styleTag.textContent = `
                    body, h1, h2, h3, h4, h5, h6, p, a, button, input, select, textarea, span, div {
                        font-family: '${appearance.fontFamily}', 'Poppins', sans-serif !important;
                    }
                `;
            }

            if (appearance.buttonStyle) {
                document.documentElement.setAttribute('data-button-style', appearance.buttonStyle.toLowerCase());
            }

            if (appearance.headerStyle) {
                let headerStyleValue = 'modern';
                if (appearance.headerStyle.includes('Solid')) headerStyleValue = 'solid';
                else if (appearance.headerStyle.includes('Minimal')) headerStyleValue = 'minimal';
                document.documentElement.setAttribute('data-header-style', headerStyleValue);
            }
        }

        window.saveAppearanceSettings = async function() {
            const activeTheme = document.querySelector('.theme-btn.active');

            const a = {
                primaryColor: (document.getElementById('primaryColorText')?.value || '#0DA4FF').trim(),
                secondaryColor: (document.getElementById('secondaryColorText')?.value || '#6366F1').trim(),
                accentColor: (document.getElementById('accentColorText')?.value || '#10B981').trim(),
                themeMode: activeTheme ? activeTheme.getAttribute('data-theme') : 'dark',
                fontFamily: document.getElementById('fontFamily')?.value || 'Poppins',
                headerStyle: document.getElementById('headerStyle')?.value || 'Modern (Transparent)',
                buttonStyle: document.getElementById('buttonStyle')?.value || 'Rounded',
                customCSS: document.getElementById('customCSS')?.value || '',
                customJS: document.getElementById('customJS')?.value || ''
            };

            const success = await saveWSSettingsAsync({ appearance: a });

            if (success) {
                applySettingsInstantly(a);
                window.logActivity('update', 'Updated Appearance Settings', 'info');
                
                // ⚠️ پاک کردن cache — تا تنظیمات جدید فوراً اعمال بشن
                localStorage.removeItem('akbariSettingsCache');
                
                alert('✅ Appearance Settings saved successfully!\n\nChanges applied to all pages.\n\n💡 تغییرات روی همه صفحات اعمال شدن.');
            } else {
                alert('⚠️ Failed to save settings. Please try again.');
            }
        };
        window.resetAppearanceSettings = async function() {
            if (!confirm('Reset Appearance Settings to default?')) return;
            const success = await saveWSSettingsAsync({ appearance: {} });
            if (success) {
                localStorage.removeItem('akbariSettingsCache');
                if (window.logActivity) window.logActivity('update', 'Reset Appearance Settings', 'warning');
                window.location.reload();
            } else {
                alert('⚠️ Failed to reset');
            }
        };

        // Load initial
        loadGeneralSettings();
        loadAppearanceSettings();
        

        console.log('✅ Stage 11/18 — Section 18 Part 1 loaded');

        /* =========================================
           SECTION 18 (PART 2): CONTACT & SOCIAL SETTINGS
           ========================================= */
            async function loadContactSettings() {
            const settings = getWSSettings();
            const c = settings.contact || {};

            const fieldMap = {
                wsMainEmail: 'mainEmail',
                wsSupportEmail: 'supportEmail',
                wsMainPhone: 'mainPhone',
                wsOfficePhone: 'officePhone',
                wsWhatsApp: 'whatsapp',
                wsFax: 'fax',
                wsAddress: 'address',
                wsMapsLink: 'mapsLink',
                wsWorkingHours: 'workingHours',
                wsContactFormEmail: 'contactFormEmail',
                wsFacebook: 'facebook',
                wsInstagram: 'instagram',
                wsLinkedIn: 'linkedin',
                wsYouTube: 'youtube',
                wsTelegram: 'telegram',
                wsTikTok: 'tiktok'
            };

            Object.keys(fieldMap).forEach(id => {
                const el = document.getElementById(id);
                if (el && c[fieldMap[id]]) el.value = c[fieldMap[id]];
            });
        }

        window.saveContactSettings = async function() {
            const c = {
                mainEmail: document.getElementById('wsMainEmail')?.value.trim() || '',
                supportEmail: document.getElementById('wsSupportEmail')?.value.trim() || '',
                mainPhone: document.getElementById('wsMainPhone')?.value.trim() || '',
                officePhone: document.getElementById('wsOfficePhone')?.value.trim() || '',
                whatsapp: document.getElementById('wsWhatsApp')?.value.trim() || '',
                fax: document.getElementById('wsFax')?.value.trim() || '',
                address: document.getElementById('wsAddress')?.value.trim() || '',
                mapsLink: document.getElementById('wsMapsLink')?.value.trim() || '',
                workingHours: document.getElementById('wsWorkingHours')?.value.trim() || '',
                contactFormEmail: document.getElementById('wsContactFormEmail')?.value.trim() || '',
                facebook: document.getElementById('wsFacebook')?.value.trim() || '',
                instagram: document.getElementById('wsInstagram')?.value.trim() || '',
                linkedin: document.getElementById('wsLinkedIn')?.value.trim() || '',
                youtube: document.getElementById('wsYouTube')?.value.trim() || '',
                telegram: document.getElementById('wsTelegram')?.value.trim() || '',
                tiktok: document.getElementById('wsTikTok')?.value.trim() || ''
            };

            if (!c.mainEmail || !c.mainPhone || !c.address) {
                alert('⚠️ Please fill in required fields (Email, Phone, Address).');
                return;
            }

            const success = await saveWSSettingsAsync({ contact: c });

            if (success) {
                window.logActivity('update', 'Updated Contact & Social Settings', 'info');
                alert('✅ Contact & Social Settings saved successfully!');
            } else {
                alert('⚠️ Failed to save settings. Please try again.');
            }
        };

        window.resetContactSettings = async function() {
            if (!confirm('Reset Contact Settings to default?')) return;
            const success = await saveWSSettingsAsync({ contact: {} });
            if (success) {
                if (window.logActivity) window.logActivity('update', 'Reset Contact Settings', 'warning');
                window.location.reload();
            } else {
                alert('⚠️ Failed to reset');
            }
        };

        /* =========================================
           SECTION 18 (PART 2): E-COMMERCE SETTINGS
           ========================================= */
        async function loadEcommerceSettings() {
            const settings = getWSSettings();
            const e = settings.ecommerce || {};

            const fieldMap = {
                wsCurrency: 'currency',
                wsCurrencySymbol: 'currencySymbol',
                wsTaxRate: 'taxRate',
                wsDecimalPlaces: 'decimalPlaces',
                wsPriceFormat: 'priceFormat',
                wsShipping: 'shipping',
                wsHesabPayNumber: 'hesabPayNumber',
                wsMyMoneyNumber: 'myMoneyNumber',
                wsOrderEmail: 'orderEmail',
                wsAdminEmail: 'adminEmail'
            };

            Object.keys(fieldMap).forEach(id => {
                const el = document.getElementById(id);
                if (el && e[fieldMap[id]] !== undefined && e[fieldMap[id]] !== '') {
                    el.value = e[fieldMap[id]];
                }
            });

            const toggles = {
                wsEnableEcommerce: 'enableEcommerce',
                wsOrderConfirmation: 'orderConfirmation',
                wsStockMgmt: 'stockManagement',
                wsGuestCheckout: 'guestCheckout',
                wsCoupons: 'coupons',
                wsInvoice: 'invoice'
            };

            Object.keys(toggles).forEach(id => {
                const el = document.getElementById(id);
                if (el && e[toggles[id]] !== undefined) {
                    el.checked = e[toggles[id]];
                }
            });

            // =========================================
            // Payment Toggles از API
            // =========================================
            try {
                const response = await API.get('/payment-methods');

                if (response.success && response.data) {
                    const methods = response.data;

                    // ⚠️ راه قطعی: برای هر toggle، از طریق onclick پیدا کن
                    const paymentItems = document.querySelectorAll('.payment-item');
                    
                    paymentItems.forEach(item => {
                        const settingsBtn = item.querySelector('.btn-settings-small');
                        if (!settingsBtn) return;
                        
                        // استخراج method key از onclick
                        const onclick = settingsBtn.getAttribute('onclick') || '';
                        const match = onclick.match(/method=(\w+)/);
                        
                        if (!match) return;
                        
                        const methodKey = match[1];
                        const method = methods.find(m => m.method_key === methodKey);
                        
                        if (!method) return;
                        
                        const toggle = item.querySelector('.switch input[type="checkbox"]');
                        if (toggle) {
                            toggle.checked = method.enabled === 1;
                        }
                    });
                }
            } catch (err) {
                console.error('Failed to load payment methods:', err);
            }
        }

        
        window.saveEcommerceSettings = async function() {
            // =========================================
            // بخش ۱: Payment Toggles
            // =========================================
            const paymentItems = document.querySelectorAll('.payment-item');
            
            let savedCount = 0;
            let errorCount = 0;

            for (const item of paymentItems) {
                const settingsBtn = item.querySelector('.btn-settings-small');
                if (!settingsBtn) continue;
                
                const onclick = settingsBtn.getAttribute('onclick') || '';
                const match = onclick.match(/method=(\w+)/);
                
                if (!match) continue;
                
                const methodKey = match[1];
                const toggle = item.querySelector('.switch input[type="checkbox"]');
                
                if (!toggle) continue;
                
                const enabled = toggle.checked ? 1 : 0;

                try {
                    const methodResp = await API.get('/payment-methods/key/' + methodKey);
                    
                    if (methodResp.success && methodResp.data) {
                        const updateResp = await API.put('/payment-methods/' + methodResp.data.id, {
                            enabled: enabled
                        });
                        
                        if (updateResp.success) {
                            savedCount++;
                        } else {
                            errorCount++;
                        }
                    }
                } catch (err) {
                    console.error('Error saving ' + methodKey + ':', err);
                    errorCount++;
                }
            }

            // =========================================
            // بخش ۲: E-commerce Settings
            // =========================================
            const existingPaymentSettings = wsSettingsCache.ecommerce?.paymentSettings || {};

            const e = {
                currency: document.getElementById('wsCurrency')?.value || 'USD',
                currencySymbol: document.getElementById('wsCurrencySymbol')?.value || '$',
                taxRate: parseFloat(document.getElementById('wsTaxRate')?.value) || 0,
                decimalPlaces: parseInt(document.getElementById('wsDecimalPlaces')?.value) || 2,
                priceFormat: document.getElementById('wsPriceFormat')?.value || '$1,234.56',
                shipping: document.getElementById('wsShipping')?.value || 'disable',
                enableEcommerce: document.getElementById('wsEnableEcommerce')?.checked ?? true,
                orderConfirmation: document.getElementById('wsOrderConfirmation')?.checked ?? true,
                stockManagement: document.getElementById('wsStockMgmt')?.checked ?? true,
                guestCheckout: document.getElementById('wsGuestCheckout')?.checked ?? true,
                coupons: document.getElementById('wsCoupons')?.checked ?? true,
                invoice: document.getElementById('wsInvoice')?.checked ?? true,
                hesabPayNumber: document.getElementById('wsHesabPayNumber')?.value.trim() || '',
                myMoneyNumber: document.getElementById('wsMyMoneyNumber')?.value.trim() || '',
                orderEmail: document.getElementById('wsOrderEmail')?.value.trim() || '',
                adminEmail: document.getElementById('wsAdminEmail')?.value.trim() || '',
                paymentSettings: existingPaymentSettings
            };

            // =========================================
            // ⚠️ ذخیره HesabPay Number & My Money Number توی payment_methods
            // (account_phone = شماره تلفن، نه شماره حساب)
            // =========================================
            try {
                const hesabPayNum = e.hesabPayNumber;
                const myMoneyNum = e.myMoneyNumber;
                
                if (hesabPayNum) {
                    const hesabResp = await API.get('/payment-methods/key/hesabpay');
                    if (hesabResp.success && hesabResp.data) {
                        await API.put('/payment-methods/' + hesabResp.data.id, {
                            account_phone: hesabPayNum
                        });
                        console.log('✅ HesabPay phone updated:', hesabPayNum);
                    }
                }
                    
                if (myMoneyNum) {
                    const myMoneyResp = await API.get('/payment-methods/key/mymoney');
                    if (myMoneyResp.success && myMoneyResp.data) {
                        await API.put('/payment-methods/' + myMoneyResp.data.id, {
                            account_phone: myMoneyNum
                        });
                        console.log('✅ My Money phone updated:', myMoneyNum);
                    }
                }
            } catch (err) {
                console.error('Failed to sync phone numbers:', err);
            }

            try {
                await saveWSSettingsAsync({ ecommerce: e });
            } catch (err) {
                console.error('E-commerce settings save error:', err);
            }

            window.logActivity('update', 'Updated E-commerce Settings', 'info');

            if (errorCount > 0) {
                alert('✅ E-commerce saved. Payment methods: ' + savedCount + ' updated, ' + errorCount + ' failed.');
            } else {
                alert('✅ E-commerce Settings saved successfully! (' + savedCount + ' payment methods updated)');
            }
        };


        window.resetEcommerceSettings = async function() {
            if (!confirm('Reset E-commerce Settings to default?')) return;
            const success = await saveWSSettingsAsync({ ecommerce: {} });
            if (success) {
                if (window.logActivity) window.logActivity('update', 'Reset E-commerce Settings', 'warning');
                window.location.reload();
            } else {
                alert('⚠️ Failed to reset');
            }
        };

        /* =========================================
           SECTION 18 (PART 2): COPY TO CLIPBOARD
           ========================================= */
        window.copyValue = function(inputId) {
            const input = document.getElementById(inputId);
            if (!input) return;

            input.select();
            input.setSelectionRange(0, 99999);

            try {
                navigator.clipboard.writeText(input.value).then(() => {
                    alert('✅ Copied: ' + input.value);
                }).catch(() => {
                    document.execCommand('copy');
                    alert('✅ Copied!');
                });
            } catch (e) {
                document.execCommand('copy');
                alert('✅ Copied!');
            }
        };

        // Load all settings (await because API is async)
        (async () => {
            await fetchWSSettingsFromAPI();
            await loadGeneralSettings();
            loadAppearanceSettings();
            loadContactSettings();
            await loadEcommerceSettings();
            console.log('✅ All settings loaded');
        })();

        console.log('✅ Stage 12/18 — Section 18 Part 2 loaded');
    }  // ← این آکولاد بستن if (wsTabsNav) رو اضافه کن

    /* =========================================
       SECTION 19 (PART 1): USERS MANAGEMENT (API-Based)
       ========================================= */
    const wsUsersTable = document.getElementById('usersTableBody');

    if (wsUsersTable) {

        let usersCurrentPage = 1;
        const usersPerPage = 10;
        let usersCache = [];
        let usersLoaded = false;
        let editingUserId = null;
        let usersSearchTerm = '';
        let usersRoleFilter = '';
        let usersStatusFilter = '';

        // =========================================
        // API: Fetch users
        // =========================================
        async function fetchUsersFromAPI() {
            try {
                const params = { per_page: 100 };
                if (usersRoleFilter) params.role = usersRoleFilter;
                if (usersStatusFilter) params.status = usersStatusFilter;
                if (usersSearchTerm) params.search = usersSearchTerm;

                const response = await API.get('/users', params);

                if (response.success && response.data.users) {
                    usersCache = response.data.users;
                    usersLoaded = true;
                    return usersCache;
                }
                return [];
            } catch (e) {
                console.error('Failed to fetch users:', e);
                return [];
            }
        }

        // =========================================
        // Sync getter (from cache)
        // =========================================
        function getUsers() {
            return usersCache || [];
        }

        function saveUsers(users) {
            usersCache = users;
            usersLoaded = true;
        }

        // =========================================
        // Filter by role (frontend-only for non-super-admin)
        // =========================================
        function filterUsersByRole(users) {
            if (isSuperAdmin()) return users;
            return users.filter(u => u.role !== 'super_admin');
        }

        function getRoleBadgeClass(role) {
            if (role === 'super_admin') return 'super-admin';
            if (role === 'admin') return 'admin';
            return 'employee';
        }

        // =========================================
        // Translate role for display
        // =========================================
        function displayRole(role) {
            if (role === 'super_admin') return 'Super Administrator';
            if (role === 'admin') return 'Administrator';
            if (role === 'employee') return 'Employee';
            return role || 'Employee';
        }

        function displayStatus(status) {
            if (status === 'active') return 'Active';
            if (status === 'inactive') return 'Inactive';
            return status || 'Active';
        }

        // =========================================
        // Load & Render users
        // =========================================
        async function loadAndRenderUsers() {
            // نمایش لودینگ
            wsUsersTable.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align:center; padding:40px; color:#A0AEC0;">
                        <i class="fas fa-spinner fa-spin" style="font-size:30px; margin-bottom:15px; display:block; color:#00A8FF;"></i>
                        Loading users...
                    </td>
                </tr>
            `;

            await fetchUsersFromAPI();
            renderUsers();
        }

        function getRoleBadgeClass(role) {
            if (role === 'Super Administrator') return 'super-admin';
            if (role === 'Administrator') return 'admin';
            return 'employee';
        }

        function filterUsersByRole(users) {
            if (isSuperAdmin()) return users;
            // ⚠️ حذف هر دو حالت: super_admin و Super Administrator
            return users.filter(u => u.role !== 'super_admin' && u.role !== 'Super Administrator');
        }

        function applyUserFilters() {
            let users = getUsers();
            users = filterUsersByRole(users);

            filteredUsers = users.filter(user => {
                const matchesSearch = usersSearchTerm === '' ||
                    (user.name && user.name.toLowerCase().includes(usersSearchTerm)) ||
                    (user.email && user.email.toLowerCase().includes(usersSearchTerm));
                const matchesRole = usersRoleFilter === '' || user.role === usersRoleFilter;
                const matchesStatus = usersStatusFilter === '' || user.status === usersStatusFilter;
                return matchesSearch && matchesRole && matchesStatus;
            });
            usersCurrentPage = 1;
            renderUsers();
        }

        function renderUsers() {
            const tableBody = wsUsersTable;

            let users = getUsers();
            users = filterUsersByRole(users);

            tableBody.innerHTML = '';

            if (users.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:40px; color:#A0AEC0;">No users found</td></tr>`;
                const showingText = document.getElementById('usersShowingText');
                if (showingText) showingText.textContent = 'Showing 0 to 0 of 0 users';
                renderUsersPagination(0, 1);
                return;
            }

            const totalPages = Math.ceil(users.length / usersPerPage);
            if (usersCurrentPage > totalPages) usersCurrentPage = totalPages;

            const startIndex = (usersCurrentPage - 1) * usersPerPage;
            const endIndex = startIndex + usersPerPage;
            const pageUsers = users.slice(startIndex, endIndex);

            const isMeSuperAdmin = isSuperAdmin();
            const currentUser = getCurrentUser();
            const currentUserId = currentUser ? currentUser.id : null;

            pageUsers.forEach((user, index) => {
                const actualIndex = startIndex + index + 1;
                const isSuperAdminUser = user.id === 1; // Super Admin اصلی (ID = 1)
                const isMe = user.id === currentUserId;
                const canModify = !isSuperAdminUser || isMeSuperAdmin;

                // فرمت تاریخ آخرین ورود
                const lastLogin = user.last_login 
                    ? formatDateTimeShort(user.last_login) 
                    : 'Never';
                
                const createdAt = user.created_at
                    ? formatDateShort(user.created_at)
                    : 'N/A';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${actualIndex}</td>
                    <td><img src="${user.avatar || 'assets/images/avatar-ahmad.png'}" class="user-avatar" alt="${user.name}" onerror="this.src='assets/images/avatar-ahmad.png'"></td>
                    <td>${user.name}${isMe ? ' <span style="color:#00A8FF;font-size:11px;">(You)</span>' : ''}</td>
                    <td>${user.email}</td>
                    <td><span class="role-badge ${getRoleBadgeClass(user.role)}">${displayRole(user.role)}</span></td>
                    <td><span class="status ${user.status}">${displayStatus(user.status)}</span></td>
                    <td>${lastLogin}</td>
                    <td>${createdAt}</td>
                    <td>
                        <div class="user-actions">
                            <button class="user-action-btn edit ${!canModify ? 'protected' : ''}"
                                    onclick="${canModify ? `editUser(${user.id})` : 'void(0)'}"
                                    title="${!canModify ? 'Protected' : 'Edit'}"
                                    ${!canModify ? 'disabled' : ''}>
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                            <button class="user-action-btn delete ${isSuperAdminUser ? 'protected' : ''}"
                                    onclick="${isSuperAdminUser ? 'void(0)' : `confirmDeleteUser(${user.id})`}"
                                    title="${isSuperAdminUser ? 'Cannot Delete' : 'Delete'}"
                                    ${isSuperAdminUser ? 'disabled' : ''}>
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            const showingText = document.getElementById('usersShowingText');
            if (showingText) {
                showingText.textContent = `Showing ${startIndex + 1} to ${Math.min(endIndex, users.length)} of ${users.length} users`;
            }

            renderUsersPagination(users.length, totalPages);

            const sysTotalUsers = document.getElementById('sysTotalUsers');
            if (sysTotalUsers) {
                sysTotalUsers.textContent = filterUsersByRole(getUsers()).length;
            }
        }

        // =========================================
        // Date helpers
        // =========================================
        function formatDateShort(dateStr) {
            if (!dateStr) return 'N/A';
            try {
                const d = new Date(dateStr.replace(' ', 'T'));
                return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            } catch (e) {
                return dateStr.split(' ')[0] || 'N/A';
            }
        }

        function formatDateTimeShort(dateStr) {
            if (!dateStr) return 'Never';
            try {
                const d = new Date(dateStr.replace(' ', 'T'));
                return d.toLocaleString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
            } catch (e) {
                return dateStr;
            }
        }

        function renderUsersPagination(totalItems, totalPages) {
            const paginationContainer = document.getElementById('usersPagination');
            if (!paginationContainer) return;

            paginationContainer.innerHTML = '';
            if (totalItems === 0 || totalPages <= 1) return;

            const prevBtn = document.createElement('button');
            prevBtn.className = 'page-btn' + (usersCurrentPage === 1 ? ' disabled' : '');
            prevBtn.textContent = 'Previous';
            prevBtn.addEventListener('click', () => {
                if (usersCurrentPage > 1) { usersCurrentPage--; renderUsers(); }
            });
            paginationContainer.appendChild(prevBtn);

            const maxVisible = 5;
            let startPage = Math.max(1, usersCurrentPage - Math.floor(maxVisible / 2));
            let endPage = Math.min(totalPages, startPage + maxVisible - 1);
            if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);

            if (startPage > 1) {
                const firstBtn = document.createElement('button');
                firstBtn.className = 'page-btn';
                firstBtn.textContent = '1';
                firstBtn.addEventListener('click', () => { usersCurrentPage = 1; renderUsers(); });
                paginationContainer.appendChild(firstBtn);
                if (startPage > 2) {
                    const dots = document.createElement('span');
                    dots.textContent = '...';
                    dots.style.cssText = 'padding: 0 8px; color: #A0AEC0; display: flex; align-items: center;';
                    paginationContainer.appendChild(dots);
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = 'page-btn' + (i === usersCurrentPage ? ' active' : '');
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => { usersCurrentPage = i; renderUsers(); });
                paginationContainer.appendChild(pageBtn);
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    const dots = document.createElement('span');
                    dots.textContent = '...';
                    dots.style.cssText = 'padding: 0 8px; color: #A0AEC0; display: flex; align-items: center;';
                    paginationContainer.appendChild(dots);
                }
                const lastBtn = document.createElement('button');
                lastBtn.className = 'page-btn';
                lastBtn.textContent = totalPages;
                lastBtn.addEventListener('click', () => { usersCurrentPage = totalPages; renderUsers(); });
                paginationContainer.appendChild(lastBtn);
            }

            const nextBtn = document.createElement('button');
            nextBtn.className = 'page-btn' + (usersCurrentPage === totalPages ? ' disabled' : '');
            nextBtn.textContent = 'Next';
            nextBtn.addEventListener('click', () => {
                if (usersCurrentPage < totalPages) { usersCurrentPage++; renderUsers(); }
            });
            paginationContainer.appendChild(nextBtn);
        }

        // =========================================
        // USER FILTER LISTENERS
        // =========================================
        const userSearchInput = document.getElementById('userSearchInput');
        if (userSearchInput) {
            let searchTimeout;
            userSearchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    usersSearchTerm = e.target.value.toLowerCase().trim();
                    usersCurrentPage = 1;
                    loadAndRenderUsers();
                }, 400);
            });
        }

        const userRoleFilterEl = document.getElementById('userRoleFilter');
        if (userRoleFilterEl) {
            userRoleFilterEl.addEventListener('change', (e) => {
                usersRoleFilter = e.target.value;
                usersCurrentPage = 1;
                loadAndRenderUsers();
            });
        }

        const userStatusFilterEl = document.getElementById('userStatusFilter');
        if (userStatusFilterEl) {
            userStatusFilterEl.addEventListener('change', (e) => {
                usersStatusFilter = e.target.value;
                usersCurrentPage = 1;
                loadAndRenderUsers();
            });
        }

        // Initial render
        loadAndRenderUsers();

        console.log('✅ Stage 13/18 — Section 19 Part 1 loaded (API-Based)');

        /* =========================================
           SECTION 19 (PART 2): USER FORM + SAVE + DELETE
           ========================================= */

        window.toggleUserPassword = function() {
            const pwInput = document.getElementById('userPassword');
            const btn = document.getElementById('userPasswordToggle');

            if (!pwInput) return;

            if (pwInput.type === 'password') {
                pwInput.type = 'text';
                if (btn) btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                pwInput.type = 'password';
                if (btn) btn.innerHTML = '<i class="fas fa-eye"></i>';
            }
        };

        window.openUserForm = function() {
            editingUserId = null;
            const titleEl = document.getElementById('userFormTitle');
            if (titleEl) titleEl.textContent = 'Add New User';

            ['userFullName', 'userEmail', 'userPassword'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });

            const roleEl = document.getElementById('userRole');
            const statusEl = document.getElementById('userStatus');
            const previewEl = document.getElementById('userImagePreview');
            const forceEl = document.getElementById('optForcePassword');
            const twoFAEl = document.getElementById('opt2FA');
            const loginNotifEl = document.getElementById('optLoginNotif');
            const deleteBox = document.getElementById('deleteUserBox');
            const pwInput = document.getElementById('userPassword');

            if (roleEl) roleEl.value = 'Employee';
            if (statusEl) statusEl.value = 'Active';
            if (previewEl) previewEl.src = 'assets/images/avatar-ahmad.png';
            if (forceEl) forceEl.checked = false;
            if (twoFAEl) twoFAEl.checked = false;
            if (loginNotifEl) loginNotifEl.checked = true;
            if (deleteBox) deleteBox.style.display = 'none';
            if (pwInput) pwInput.type = 'password';

            const pwBtnEl = document.getElementById('userPasswordToggle');
            if (pwBtnEl) pwBtnEl.innerHTML = '<i class="fas fa-eye"></i>';

            const formBox = document.getElementById('userFormBox');
            if (formBox) {
                formBox.style.display = 'block';
                // ⚠️ اسکرول با تاخیر تا DOM رندر بشه
                setTimeout(() => {
                    formBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        };

        window.editUser = function(id) {
            if (id === SUPER_ADMIN_ID && !isSuperAdmin()) {
                alert('⚠️ Only the Super Administrator can edit their own account.');
                return;
            }

            const users = getUsers();
            const user = users.find(u => u.id === id);
            if (!user) return;

            editingUserId = id;

            const titleEl = document.getElementById('userFormTitle');
            if (titleEl) titleEl.textContent = 'Edit User';

            const nameEl = document.getElementById('userFullName');
            const emailEl = document.getElementById('userEmail');
            const pwEl = document.getElementById('userPassword');
            const roleEl = document.getElementById('userRole');
            const statusEl = document.getElementById('userStatus');
            const previewEl = document.getElementById('userImagePreview');
            const forceEl = document.getElementById('optForcePassword');
            const twoFAEl = document.getElementById('opt2FA');
            const loginNotifEl = document.getElementById('optLoginNotif');
            const deleteBox = document.getElementById('deleteUserBox');

            if (nameEl) nameEl.value = user.name || '';
            if (emailEl) emailEl.value = user.email || '';
            if (pwEl) {
                pwEl.value = user.password || '';
                pwEl.type = 'password';
            }
            if (roleEl) roleEl.value = user.role || 'Employee';
            if (statusEl) statusEl.value = user.status || 'Active';
            if (previewEl) previewEl.src = user.avatar || 'assets/images/avatar-ahmad.png';
            if (forceEl) forceEl.checked = user.forcePasswordChange === true;
            if (twoFAEl) twoFAEl.checked = user.twoFA === true;
            if (loginNotifEl) loginNotifEl.checked = user.loginNotification !== false;

            const pwBtnEl = document.getElementById('userPasswordToggle');
            if (pwBtnEl) pwBtnEl.innerHTML = '<i class="fas fa-eye"></i>';

            if (deleteBox) {
                if (id === SUPER_ADMIN_ID) deleteBox.style.display = 'none';
                else deleteBox.style.display = 'flex';
            }

            const formBox = document.getElementById('userFormBox');
            if (formBox) {
                formBox.style.display = 'block';
                formBox.scrollIntoView({ behavior: 'smooth' });
            }
        };

        window.closeUserForm = function() {
            const formBox = document.getElementById('userFormBox');
            if (formBox) formBox.style.display = 'none';
            editingUserId = null;
        };

        // =========================================
        // Save User (API-Based)
        // =========================================
        window.saveUser = async function() {
            if (editingUserId === 1 && !isSuperAdmin()) {
                alert('⚠️ Only the Super Administrator can modify their own account.');
                return;
            }

            const name = document.getElementById('userFullName')?.value.trim();
            const email = document.getElementById('userEmail')?.value.trim();
            const password = document.getElementById('userPassword')?.value;
            const role = document.getElementById('userRole')?.value;
            const status = document.getElementById('userStatus')?.value;
            const avatar = document.getElementById('userImagePreview')?.src;

            if (!name || !email) {
                alert('⚠️ Please fill in all required fields (Name, Email).');
                return;
            }

            if (!editingUserId && !password) {
                alert('⚠️ Password is required for new users.');
                return;
            }

            if (password && password.length < 6) {
                alert('⚠️ Password must be at least 6 characters.');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('⚠️ Please enter a valid email address.');
                return;
            }

            // تبدیل role برای API
            let apiRole = role;
            if (role === 'Super Administrator') apiRole = 'super_admin';
            if (role === 'Administrator') apiRole = 'admin';
            if (role === 'Employee') apiRole = 'employee';

            const userData = {
                name: name,
                email: email,
                role: apiRole,
                status: status === 'Active' ? 'active' : 'inactive',
                avatar: avatar
            };

            if (password) userData.password = password;

            try {
                let response;

                if (editingUserId) {
                    response = await API.put('/users/' + editingUserId, userData);
                } else {
                    response = await API.post('/users', userData);
                }

                if (response.success) {
                    window.logActivity(
                        editingUserId ? 'update' : 'add',
                        editingUserId ? `Updated user: ${name}` : `Added new user: ${name}`,
                        editingUserId ? 'warning' : 'success'
                    );

                    alert(editingUserId ? '✅ User updated successfully!' : '✅ User added successfully!');
                    closeUserForm();
                    await loadAndRenderUsers();
                    refreshPermUserSelect();
                } else {
                    alert('⚠️ ' + (response.message || 'Failed to save user'));
                }
            } catch (err) {
                console.error('Save user error:', err);
                alert('⚠️ Network error. Please try again.');
            }
        };

        // =========================================
        // Confirm & Delete User (API-Based)
        // =========================================
        window.confirmDeleteUser = async function(id) {
            if (id === 1) {
                alert('⚠️ The Super Administrator account cannot be deleted!');
                return;
            }

            if (!confirm('Are you sure you want to delete this user?')) return;

            try {
                const response = await API.del('/users/' + id);

                if (response.success) {
                    const deletedUser = usersCache.find(u => u.id === id);
                    window.logActivity('delete', `Deleted user: ${deletedUser?.name || 'Unknown'}`, 'danger');
                    
                    alert('✅ User deleted successfully!');
                    await loadAndRenderUsers();
                    refreshPermUserSelect();
                } else {
                    alert('⚠️ ' + (response.message || 'Failed to delete user'));
                }
            } catch (err) {
                console.error('Delete user error:', err);
                alert('⚠️ Network error. Please try again.');
            }
        };

        window.deleteUser = function() {
            if (!editingUserId) return;
            if (editingUserId === 1) {
                alert('⚠️ You cannot delete the Super Administrator!');
                return;
            }
            confirmDeleteUser(editingUserId);
            closeUserForm();
        };

        // User Image Upload
        const userImageInput = document.getElementById('userImageInput');
        if (userImageInput) {
            userImageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) {
                    alert('⚠️ Image is too large (max 2MB).');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                    const preview = document.getElementById('userImagePreview');
                    if (preview) preview.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        /* =========================================
           PERMISSIONS MANAGER (API-Based)
           ========================================= */
        const sections = [
            { id: 'dashboard', name: 'Dashboard', icon: 'fas fa-home' },
            { id: 'products', name: 'Products', icon: 'fas fa-box' },
            { id: 'services', name: 'Services', icon: 'fas fa-th-large' },
            { id: 'pages', name: 'Pages (Home, About, Contact, etc.)', icon: 'fas fa-file-alt' },
            { id: 'media', name: 'Media Library', icon: 'fas fa-images' },
            { id: 'messages', name: 'Messages', icon: 'fas fa-envelope' },
            { id: 'settings', name: 'Website Settings', icon: 'fas fa-cog' }
        ];

        // Cache
        let allPermissionsCache = {};

        // =========================================
        // API: Fetch all permissions
        // =========================================
        async function fetchAllPermissionsFromAPI() {
            try {
                const response = await API.get('/permissions');
                if (response.success && response.data) {
                    allPermissionsCache = response.data;
                    return allPermissionsCache;
                }
                return {};
            } catch (e) {
                console.error('Failed to fetch permissions:', e);
                return {};
            }
        }

        // =========================================
        // Get current perm key (role or user_X)
        // =========================================
        function getCurrentPermKey() {
            const activePermTab = document.querySelector('.perm-tab.active');
            const permType = activePermTab ? activePermTab.getAttribute('data-perm') : 'role';

            if (permType === 'role') {
                const roleSelect = document.getElementById('permRoleSelect');
                return roleSelect ? roleSelect.value : 'employee';
            } else {
                const userSelect = document.getElementById('permUserSelect');
                if (!userSelect || !userSelect.value) return null;
                return 'user_' + userSelect.value;
            }
        }

        // =========================================
        // Refresh user select dropdown
        // =========================================
        function refreshPermUserSelect() {
            const userSelect = document.getElementById('permUserSelect');
            if (!userSelect) return;

            let users = getUsers();
            users = filterUsersByRole(users);

            const currentValue = userSelect.value;
            let optionsHTML = '<option value="">-- Select a User --</option>';
            users.forEach(user => {
                optionsHTML += `<option value="${user.id}">${user.name} (${displayRole(user.role)})</option>`;
            });
            userSelect.innerHTML = optionsHTML;

            if (currentValue) {
                userSelect.value = currentValue;
            }
        }

        // =========================================
        // Load & Render Permissions Matrix
        // =========================================
        window.loadPermissions = async function() {
            const tbody = document.getElementById('permMatrixBody');
            if (!tbody) return;

            const currentKey = getCurrentPermKey();

            if (!currentKey) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px; color:#A0AEC0;">Please select a user first</td></tr>`;
                return;
            }

            // لودینگ
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px; color:#A0AEC0;">
                <i class="fas fa-spinner fa-spin" style="font-size:24px;"></i>
            </td></tr>`;

            // از API بگیر
            await fetchAllPermissionsFromAPI();

            const currentPerms = allPermissionsCache[currentKey] || {};

            const activePermTab = document.querySelector('.perm-tab.active');
            const isRoleTab = activePermTab && activePermTab.getAttribute('data-perm') === 'role';
            const roleSelect = document.getElementById('permRoleSelect');
            const isSuperAdminRole = isRoleTab && roleSelect && roleSelect.value === 'super_admin';
            const shouldLock = isSuperAdminRole && !isSuperAdmin();

            tbody.innerHTML = '';

            sections.forEach(section => {
                const perms = currentPerms[section.id] || { view: false, add: false, edit: false, delete: false };

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><i class="${section.icon}"></i> ${section.name}</td>
                    <td><input type="checkbox" class="perm-checkbox" data-section="${section.id}" data-action="view" ${perms.view ? 'checked' : ''} ${shouldLock ? 'disabled' : ''}></td>
                    <td><input type="checkbox" class="perm-checkbox" data-section="${section.id}" data-action="add" ${perms.add ? 'checked' : ''} ${shouldLock ? 'disabled' : ''}></td>
                    <td><input type="checkbox" class="perm-checkbox" data-section="${section.id}" data-action="edit" ${perms.edit ? 'checked' : ''} ${shouldLock ? 'disabled' : ''}></td>
                    <td><input type="checkbox" class="perm-checkbox" data-section="${section.id}" data-action="delete" ${perms.delete ? 'checked' : ''} ${shouldLock ? 'disabled' : ''}></td>
                `;
                tbody.appendChild(row);
            });

            tbody.querySelectorAll('.perm-checkbox').forEach(cb => {
                if (shouldLock) {
                    cb.style.opacity = '0.4';
                    cb.style.cursor = 'not-allowed';
                }
            });
        };

        // =========================================
        // Collect permissions from matrix
        // =========================================
        function collectPermissionsFromMatrix() {
            const tbody = document.getElementById('permMatrixBody');
            if (!tbody) return null;

            const perms = {};

            sections.forEach(section => {
                const viewCb = tbody.querySelector(`.perm-checkbox[data-section="${section.id}"][data-action="view"]`);
                const addCb = tbody.querySelector(`.perm-checkbox[data-section="${section.id}"][data-action="add"]`);
                const editCb = tbody.querySelector(`.perm-checkbox[data-section="${section.id}"][data-action="edit"]`);
                const deleteCb = tbody.querySelector(`.perm-checkbox[data-section="${section.id}"][data-action="delete"]`);

                perms[section.id] = {
                    view: viewCb ? viewCb.checked : false,
                    add: addCb ? addCb.checked : false,
                    edit: editCb ? editCb.checked : false,
                    delete: deleteCb ? deleteCb.checked : false
                };
            });

            return perms;
        }

        // =========================================
        // Save Permissions (API)
        // =========================================
        window.savePermissionsBtn = async function() {
            const currentKey = getCurrentPermKey();
            if (!currentKey) {
                alert('⚠️ Please select a role or user first.');
                return;
            }

            const permissions = collectPermissionsFromMatrix();
            if (!permissions) return;

            const activePermTab = document.querySelector('.perm-tab.active');
            const permType = activePermTab ? activePermTab.getAttribute('data-perm') : 'role';

            try {
                let response;

                if (permType === 'role') {
                    // ذخیره برای role
                    response = await API.post('/permissions/role', {
                        role: currentKey,
                        permissions: permissions
                    });
                } else {
                    // ذخیره برای user
                    const userId = currentKey.replace('user_', '');
                    response = await API.post('/permissions/user', {
                        user_id: userId,
                        permissions: permissions
                    });
                }

                if (response.success) {
                    window.logActivity('update', `Updated permissions for: ${currentKey}`, 'info');
                    alert('✅ Permissions saved successfully!');

                    // رفرش cache
                    await fetchAllPermissionsFromAPI();
                    await loadPermissions();
                } else {
                    alert('⚠️ ' + (response.message || 'Failed to save permissions'));
                }
            } catch (err) {
                console.error('Save permissions error:', err);
                alert('⚠️ Network error. Please try again.');
            }
        };

        // =========================================
        // Copy Permissions from Role to User
        // =========================================
        window.copyPermissionsFromRole = async function() {
            const userSelect = document.getElementById('permUserSelect');
            if (!userSelect || !userSelect.value) {
                alert('⚠️ Please select a user first.');
                return;
            }

            const userId = userSelect.value;

            // کدوم role رو انتخاب کرده؟
            const roleSelect = document.getElementById('permRoleSelect');
            const roleToCopy = roleSelect ? roleSelect.value : 'employee';

            if (!confirm(`Copy permissions from "${displayRole(roleToCopy)}" role to this user?`)) return;

            try {
                const response = await API.post('/permissions/copy-from-role', {
                    user_id: userId,
                    role: roleToCopy
                });

                if (response.success) {
                    alert('✅ Permissions copied successfully!');
                    await fetchAllPermissionsFromAPI();
                    await loadPermissions();
                } else {
                    alert('⚠️ ' + (response.message || 'Failed to copy permissions'));
                }
            } catch (err) {
                console.error('Copy permissions error:', err);
                alert('⚠️ Network error. Please try again.');
            }
        };

        // =========================================
        // Perm Tabs
        // =========================================
        document.querySelectorAll('.perm-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.perm-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const permType = tab.getAttribute('data-perm');
                const roleSelectRow = document.getElementById('roleSelectRow');
                const userSelectRow = document.getElementById('userSelectRow');

                if (permType === 'role') {
                    if (roleSelectRow) roleSelectRow.style.display = 'flex';
                    if (userSelectRow) userSelectRow.style.display = 'none';
                } else {
                    if (roleSelectRow) roleSelectRow.style.display = 'none';
                    if (userSelectRow) userSelectRow.style.display = 'flex';
                    refreshPermUserSelect();
                }

                loadPermissions();
            });
        });

        // =========================================
        // Initial load
        // =========================================
        loadPermissions();    


    }  // ← این آکولاد بستن if (wsUsersTable) رو اضافه کن

    /* =========================================
       SECTION 20: SYSTEM - BACKUP & RESTORE
       ========================================= */
    window.createBackup = async function() {
        if (!confirm('Create a new backup of the database?')) return;

        try {
            const resp = await API.post('/backup/create', {});
            
            if (resp.success) {
                if (window.logActivity) {
                    window.logActivity('backup', 'Created a new backup: ' + resp.data.filename, 'success');
                }
                
                alert('✅ Backup created!\n\nFile: ' + resp.data.filename + '\nSize: ' + resp.data.sizeFormatted + '\nTables: ' + resp.data.tables + '\nRows: ' + resp.data.rows);
                
                // رفرش لیست
                if (typeof loadBackupList === 'function') loadBackupList();
            } else {
                alert('⚠️ ' + (resp.message || 'Backup failed'));
            }
        } catch (e) {
            console.error(e);
            alert('⚠️ Network error');
        }
    };

    window.restoreBackup = function() {
        // ⚠️ نمایش لیست بکاپ‌ها برای انتخاب
        openRestoreModal();
    };

    window.openRestoreModal = async function() {
        try {
            const resp = await API.get('/backup/list');
            
            if (!resp.success || !resp.data || resp.data.length === 0) {
                alert('⚠️ No backups found. Create a backup first.');
                return;
            }

            const backups = resp.data;
            
            let html = '<div style="max-height:400px;overflow-y:auto;">';
            backups.forEach(b => {
                html += `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 15px;background:#0A1128;border:1px solid #2D3748;border-radius:8px;margin-bottom:8px;">
                        <div style="flex:1;">
                            <strong style="display:block;color:#fff;font-size:12px;font-family:monospace;margin-bottom:3px;">${b.filename}</strong>
                            <span style="font-size:11px;color:#A0AEC0;">${b.date} • ${b.sizeFormatted}</span>
                        </div>
                        <button onclick="confirmRestore('${b.filename}')" style="background:#EF4444;color:#fff;border:none;padding:8px 15px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;">
                            <i class="fas fa-sync-alt"></i> Restore
                        </button>
                    </div>
                `;
            });
            html += '</div>';

            // مودال
            const modal = document.createElement('div');
            modal.id = 'restoreModal';
            modal.style.cssText = 'position:fixed;inset:0;background:rgba(10,17,40,0.95);backdrop-filter:blur(8px);display:flex;justify-content:center;align-items:center;z-index:99999;padding:20px;';
            modal.innerHTML = `
                <div style="background:#1C2541;border:1px solid #2D3748;border-radius:15px;padding:25px;max-width:600px;width:100%;max-height:80vh;overflow:auto;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:15px;border-bottom:1px solid #2D3748;">
                        <h3 style="color:#fff;font-size:16px;font-weight:600;margin:0;">
                            <i class="fas fa-database" style="color:#00A8FF;"></i> Select Backup to Restore
                        </h3>
                        <button onclick="document.getElementById('restoreModal').remove()" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#EF4444;width:32px;height:32px;border-radius:6px;cursor:pointer;font-size:14px;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div style="background:rgba(245,158,11,0.08);border-left:3px solid #F59E0B;padding:12px;border-radius:6px;margin-bottom:15px;font-size:12px;color:#F59E0B;">
                        <i class="fas fa-exclamation-triangle"></i> Warning: This will replace ALL current data!
                    </div>
                    ${html}
                </div>
            `;
            document.body.appendChild(modal);

        } catch (e) {
            console.error(e);
            alert('⚠️ Failed to load backup list');
        }
    };

    window.confirmRestore = async function(filename) {
        if (!confirm('⚠️ WARNING!\n\nThis will DELETE all current data and restore from:\n' + filename + '\n\nContinue?')) return;

        try {
            const resp = await API.post('/backup/restore', { filename: filename });
            
            if (resp.success) {
                if (window.logActivity) {
                    window.logActivity('restore', 'Restored from: ' + filename, 'warning');
                }
                
                alert('✅ Restore successful!\n\nTables: ' + resp.data.restoredTables + '\nRows: ' + resp.data.restoredRows + '\n\nPage will reload.');
                
                const modal = document.getElementById('restoreModal');
                if (modal) modal.remove();
                
                setTimeout(() => window.location.reload(), 1500);
            } else {
                alert('⚠️ ' + (resp.message || 'Restore failed'));
            }
        } catch (e) {
            console.error(e);
            alert('⚠️ Network error');
        }
    };

    /* =========================================
       SECTION 21: SYSTEM - CLEAR CACHE
       ========================================= */
    window.clearCache = function() {
        if (!confirm('Are you sure you want to clear all cache?\n\nThis will clear:\n• Session storage\n• Activity log\n\nYour data (products, services, etc.) will NOT be affected.')) return;

        sessionStorage.clear();
        localStorage.removeItem(ACTIVITY_LOG_KEY);

        const cacheBox = document.querySelector('.cache-success-box span');
        if (cacheBox) {
            const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kabul' });
            cacheBox.textContent = 'Last cleared: ' + now;
        }

        window.logActivity('clear', 'Cleared all cache', 'warning');
        renderActivityLog();
        alert('✅ Cache cleared successfully!');
    };

    /* =========================================
       SECTION 22: SYSTEM - MAINTENANCE MODE
       ========================================= */
    const maintenanceToggle = document.getElementById('wsMaintenanceMode');
    const maintenanceNote = document.querySelector('.maintenance-note');

    if (maintenanceToggle) {
        // ⚠️ لود از API
        (async function loadMaintenance() {
            try {
                const resp = await API.get('/maintenance');
                if (resp.success && resp.data && resp.data.enabled) {
                    maintenanceToggle.checked = true;
                    if (maintenanceNote) {
                        maintenanceNote.textContent = 'Website is currently in maintenance mode.';
                        maintenanceNote.style.color = '#F59E0B';
                    }
                }
                
                // پر کردن message
                if (resp.success && resp.data && resp.data.message) {
                    const msgEl = document.getElementById('wsMaintenanceMessage');
                    if (msgEl) msgEl.value = resp.data.message;
                }
            } catch (e) {}
        })();

        maintenanceToggle.addEventListener('change', () => {
            if (maintenanceToggle.checked) {
                if (maintenanceNote) {
                    maintenanceNote.textContent = 'Website is currently in maintenance mode.';
                    maintenanceNote.style.color = '#F59E0B';
                }
            } else {
                if (maintenanceNote) {
                    maintenanceNote.textContent = 'Your website is currently live.';
                    maintenanceNote.style.color = '';
                }
            }
        });
    }

    window.saveMaintenanceSettings = async function() {
        const enabled = document.getElementById('wsMaintenanceMode')?.checked || false;
        const message = document.getElementById('wsMaintenanceMessage')?.value || '';

        try {
            const resp = await API.post('/maintenance', {
                enabled: enabled,
                message: message
            });

            if (resp.success) {
                window.logActivity('update', `Maintenance Mode: ${enabled ? 'ON' : 'OFF'}`, 'info');
                alert('✅ Maintenance settings saved!');
            } else {
                alert('⚠️ ' + (resp.message || 'Failed to save'));
            }
        } catch (e) {
            console.error(e);
            alert('⚠️ Network error');
        }
    };

    /* =========================================
       SECTION 23: SYSTEM - SEO SETTINGS
       ========================================= */
    function loadSEOSettings() {
        try {
            const settings = localStorage.getItem(WS_SETTINGS_KEY);
            if (!settings) return;

            const data = JSON.parse(settings);
            if (data.seo) {
                const titleEl = document.getElementById('globalMetaTitle');
                const descEl = document.getElementById('globalMetaDesc');
                const gaEl = document.getElementById('googleAnalyticsId');

                if (titleEl && data.seo.metaTitle) titleEl.value = data.seo.metaTitle;
                if (descEl && data.seo.metaDescription) descEl.value = data.seo.metaDescription;
                if (gaEl && data.seo.googleAnalyticsId) gaEl.value = data.seo.googleAnalyticsId;
            }
        } catch (e) {}
    }

    window.saveSEOSettings = function() {
        const settings = (function() {
            try {
                const data = localStorage.getItem(WS_SETTINGS_KEY);
                return data ? JSON.parse(data) : {};
            } catch (e) { return {}; }
        })();

        settings.seo = {
            metaTitle: document.getElementById('globalMetaTitle')?.value.trim() || '',
            metaDescription: document.getElementById('globalMetaDesc')?.value.trim() || '',
            googleAnalyticsId: document.getElementById('googleAnalyticsId')?.value.trim() || '',
            lastUpdated: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kabul' })
        };
        localStorage.setItem(WS_SETTINGS_KEY, JSON.stringify(settings));
        window.logActivity('update', 'Updated SEO Settings', 'info');
        alert('✅ SEO settings saved!');
    };

    /* =========================================
       SECTION 24: SYSTEM - EMAIL SETTINGS
       ========================================= */
    async function loadEmailSettings() {
        try {
            const resp = await API.get('/settings/email');
            
            if (resp.success && resp.data && resp.data.value) {
                const data = resp.data.value;
                
                const hostEl = document.getElementById('smtpHost');
                const portEl = document.getElementById('smtpPort');
                const userEl = document.getElementById('smtpUsername');
                const passEl = document.getElementById('smtpPassword');
                
                if (hostEl && data.host) hostEl.value = data.host;
                if (portEl && data.port) portEl.value = data.port;
                if (userEl && data.username) userEl.value = data.username;
                if (passEl && data.password) passEl.value = data.password;
            }
        } catch (e) {}
    }

    async function saveEmailSettings() {
        try {
            const emailSettings = {
                host: document.getElementById('smtpHost')?.value.trim() || '',
                port: document.getElementById('smtpPort')?.value.trim() || '587',
                username: document.getElementById('smtpUsername')?.value.trim() || '',
                password: document.getElementById('smtpPassword')?.value || '',
                encryption: 'tls'
            };

            await API.post('/settings', { email: emailSettings });
            return true;
        } catch (e) {
            console.error('Save email error:', e);
            return false;
        }
    }

    window.sendTestEmail = async function() {
        const smtpUser = document.getElementById('smtpUsername')?.value.trim() || '';
        
        if (!smtpUser) {
            alert('⚠️ Please enter SMTP Username first.');
            return;
        }

        const host = document.getElementById('smtpHost')?.value.trim() || '';
        const pass = document.getElementById('smtpPassword')?.value || '';

        if (!host || !pass) {
            alert('⚠️ Please fill SMTP Host and Password first.');
            return;
        }

        // اول ذخیره
        const saved = await saveEmailSettings();
        if (!saved) {
            alert('⚠️ Failed to save SMTP settings');
            return;
        }

        // لودینگ روی دکمه
        const btn = document.querySelector('.btn-send-test');
        const originalHTML = btn ? btn.innerHTML : '';
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            btn.disabled = true;
        }

        try {
            const resp = await API.post('/settings/test-email', { to: smtpUser });

            if (resp.success) {
                alert('✅ ' + resp.message + '\n\nCheck your inbox!');
            } else {
                alert('⚠️ ' + (resp.message || 'Failed to send'));
            }
        } catch (e) {
            console.error(e);
            alert('⚠️ Network error');
        } finally {
            if (btn) {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }
        }
    };

    // Load SEO & Email on init
    loadSEOSettings();
    loadEmailSettings();

    console.log('✅ Stage 15/18 — Sections 20-24 loaded');

    /* =========================================
       SECTION 25: SYSTEM - STORAGE MANAGEMENT
       ========================================= */
    window.manageStorage = function() {
        const mediaData = localStorage.getItem('akbariMedia');
        let usedMB = 0;
        let imageCount = 0;
        let docCount = 0;
        let otherCount = 0;

        if (mediaData) {
            try {
                const items = JSON.parse(mediaData);
                let totalBytes = 0;
                items.forEach(item => {
                    if (item.size) totalBytes += item.size;
                    if (item.type === 'image') imageCount++;
                    else if (item.type === 'document') docCount++;
                    else otherCount++;
                });
                usedMB = (totalBytes / (1024 * 1024)).toFixed(2);
            } catch (e) {}
        }

        const message = `📊 Storage Report:\n\n` +
                    `Used: ${usedMB} MB / 500 MB\n\n` +
                    `Breakdown:\n` +
                    `• Images: ${imageCount} files\n` +
                    `• Documents: ${docCount} files\n` +
                    `• Others: ${otherCount} files\n\n` +
                    `To free space, delete unused files from Media Library.`;

        alert(message);
    };

    function updateStorageBar() {
        const storageFill = document.querySelector('.storage-progress-bar');
        const storageInfo = document.querySelector('.storage-progress-info span');

        if (!storageFill) return;

        const mediaData = localStorage.getItem('akbariMedia');
        let usedMB = 0;
        const limitMB = 500;

        if (mediaData) {
            try {
                const items = JSON.parse(mediaData);
                let totalBytes = 0;
                items.forEach(item => {
                    if (item.size) totalBytes += item.size;
                });
                usedMB = parseFloat((totalBytes / (1024 * 1024)).toFixed(2));
            } catch (e) {}
        }

        const percent = Math.min((usedMB / limitMB) * 100, 100);
        storageFill.style.width = percent.toFixed(1) + '%';

        if (storageInfo) {
            storageInfo.textContent = `${usedMB} MB / ${limitMB} MB (${percent.toFixed(1)}%)`;
        }

        const breakdownItems = document.querySelectorAll('.storage-breakdown li strong');
        if (breakdownItems.length >= 4 && mediaData) {
            try {
                const items = JSON.parse(mediaData);
                let imgBytes = 0, docBytes = 0, otherBytes = 0;

                items.forEach(item => {
                    if (item.type === 'image') imgBytes += item.size || 0;
                    else if (item.type === 'document') docBytes += item.size || 0;
                    else otherBytes += item.size || 0;
                });

                breakdownItems[0].textContent = (imgBytes / (1024 * 1024)).toFixed(0) + ' MB';
                breakdownItems[1].textContent = (docBytes / (1024 * 1024)).toFixed(0) + ' MB';
                breakdownItems[2].textContent = '0 MB';
                breakdownItems[3].textContent = (otherBytes / (1024 * 1024)).toFixed(0) + ' MB';
            } catch (e) {}
        }
    }

    /* =========================================
       BUTTON LISTENERS (Backup/Restore)
       ========================================= */
    const backupNowBtn = document.querySelector('.btn-backup');
    if (backupNowBtn) {
        backupNowBtn.addEventListener('click', () => createBackup());
    }

    const restoreBackupBtn = document.querySelector('.btn-restore');
    if (restoreBackupBtn) {
        restoreBackupBtn.addEventListener('click', () => restoreBackup());
    }

    /* =========================================
       PASSWORD TOGGLE (SYSTEM SETTINGS)
       ========================================= */
    document.querySelectorAll('.password-input-wrapper .toggle-pw').forEach(btn => {
        if (btn.id === 'userPasswordToggle') return;

        btn.addEventListener('click', () => {
            const input = btn.parentElement.querySelector('input');
            if (!input) return;

            if (input.type === 'password') {
                input.type = 'text';
                btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                input.type = 'password';
                btn.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    });

    /* =========================================
       KEYBOARD SHORTCUTS
       ========================================= */
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();

            const activeTab = document.querySelector('.ws-tab.active');
            if (activeTab) {
                const tabName = activeTab.getAttribute('data-tab');
                switch(tabName) {
                    case 'general':
                        if (typeof saveGeneralSettings === 'function') saveGeneralSettings();
                        break;
                    case 'appearance':
                        if (typeof saveAppearanceSettings === 'function') saveAppearanceSettings();
                        break;
                    case 'contact':
                        if (typeof saveContactSettings === 'function') saveContactSettings();
                        break;
                    case 'ecommerce':
                        if (typeof saveEcommerceSettings === 'function') saveEcommerceSettings();
                        break;
                }
            }
        }

        if (e.key === 'Escape') {
            const userFormBox = document.getElementById('userFormBox');
            if (userFormBox && userFormBox.style.display === 'block') {
                closeUserForm();
            }
        }
    });

    // Update storage bar on load
    updateStorageBar();

    console.log('✅ Stage 16/18 — Section 25 loaded');

    /* =========================================
       SECTION 26: INITIALIZE PAGES
       ========================================= */
    if (window.location.pathname.includes('dashboard')) {
        const products = getProducts();
        const statCards = document.querySelectorAll('.stats-grid .stat-info h3');
        if (statCards.length >= 4) {
            if (statCards[0]) statCards[0].textContent = products.length;

            const services = getServices();
            if (statCards[1]) statCards[1].textContent = services.length;

            const messages = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
            if (statCards[3]) statCards[3].textContent = messages.length;
        }

        const recentMessagesList = document.querySelector('.message-list');
        if (recentMessagesList) {
            const messages = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
            const recentMessages = messages.slice(0, 4);

            if (recentMessages.length > 0) {
                recentMessagesList.innerHTML = '';
                recentMessages.forEach(msg => {
                    const li = document.createElement('li');
                    const initials = msg.name ? msg.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

                    li.innerHTML = `
                        <div class="msg-avatar ${msg.status === 'unread' ? 'blue' : 'green'}" style="width:40px;height:40px;font-size:12px;">${initials}</div>
                        <div class="msg-info">
                            <h4>${msg.name || 'Anonymous'}</h4>
                            <p>${(msg.message || '').substring(0, 40)}...</p>
                        </div>
                        <span class="msg-time">${msg.date ? msg.date.split(' ').slice(0, 2).join(' ') : ''}</span>
                    `;
                    recentMessagesList.appendChild(li);
                });
            }
        }
    }

    if (document.getElementById('productsTableBody')) {
        renderProducts();
        updateStats();
    }

    if (document.getElementById('servicesTableBody')) {
        renderServices();
        updateServiceStats();
    }

    /* =========================================
       SECTION 27: RENDER ACTIVITY LOG
       ========================================= */
    /**
     * Render Activity Log از API
     */
    async function renderActivityLog() {
        const activityList = document.querySelector('.activity-list');
        if (!activityList) return;

        try {
            activityList.innerHTML = `
                <li style="text-align:center; padding: 30px 20px; color: #A0AEC0; display: block;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 30px; color: #00A8FF; margin-bottom: 10px; display: block;"></i>
                    <span style="font-size: 12px;">Loading activities...</span>
                </li>
            `;

            const response = await API.get('/activity-log', { per_page: 10 });

            if (!response.success || !response.data.logs) {
                activityList.innerHTML = `
                    <li style="text-align:center; padding: 30px 20px; color: #A0AEC0; display: block;">
                        <i class="fas fa-history" style="font-size: 40px; color: #2D3748; margin-bottom: 10px; display: block;"></i>
                        <span style="font-size: 12px;">Could not load activities.</span>
                    </li>
                `;
                return;
            }

            const logs = response.data.logs;

            if (logs.length === 0) {
                activityList.innerHTML = `
                    <li style="text-align:center; padding: 30px 20px; color: #A0AEC0; display: block;">
                        <i class="fas fa-history" style="font-size: 40px; color: #2D3748; margin-bottom: 10px; display: block;"></i>
                        <span style="font-size: 12px;">No activity recorded yet.</span>
                    </li>
                `;
                return;
            }

            activityList.innerHTML = '';
            logs.forEach(entry => {
                const li = document.createElement('li');
                li.setAttribute('data-type', entry.type || 'info');

                let dateStr = '';
                if (entry.created_at) {
                    try {
                        const d = new Date(entry.created_at.replace(' ', 'T'));
                        dateStr = d.toLocaleString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        });
                    } catch (e) {
                        dateStr = entry.created_at;
                    }
                }

                li.innerHTML = `
                    <img src="${entry.user_avatar || 'assets/images/avatar-ahmad.png'}" alt="User" onerror="this.src='assets/images/avatar-ahmad.png'">
                    <div>
                        <strong>${entry.user_name || 'System'}</strong>
                        <span>${entry.description || ''}</span>
                    </div>
                    <small>${dateStr}</small>
                `;
                activityList.appendChild(li);
            });

        } catch (e) {
            console.error('Failed to render activity log:', e);
            activityList.innerHTML = `
                <li style="text-align:center; padding: 30px 20px; color: #EF4444; display: block;">
                    <i class="fas fa-exclamation-circle" style="font-size: 30px; margin-bottom: 10px; display: block;"></i>
                    <span style="font-size: 12px;">Error loading activities</span>
                </li>
            `;
        }
    }

    /* =========================================
       SECTION 28: SYSTEM INFO UPDATE
       ========================================= */
    function updateSystemInfo() {
        const sysTotalUsers = document.getElementById('sysTotalUsers');
        if (sysTotalUsers) {
            try {
                const users = JSON.parse(localStorage.getItem(WS_USERS_KEY) || '[]');
                sysTotalUsers.textContent = users.length;
            } catch (e) {}
        }

        const sysTotalProducts = document.getElementById('sysTotalProducts');
        if (sysTotalProducts) {
            try {
                const products = JSON.parse(localStorage.getItem('akbariProducts') || '[]');
                sysTotalProducts.textContent = products.length;
            } catch (e) {}
        }

        const storageUsedEl = document.querySelector('.system-info-list li:nth-child(7) strong');
        if (storageUsedEl) {
            try {
                const media = JSON.parse(localStorage.getItem('akbariMedia') || '[]');
                let totalBytes = 0;
                media.forEach(item => {
                    if (item.size) totalBytes += item.size;
                });
                const usedMB = (totalBytes / (1024 * 1024)).toFixed(2);
                storageUsedEl.textContent = `${usedMB} MB / 5 GB`;
            } catch (e) {}
        }

        const browserItem = document.querySelector('.system-info-list li:nth-child(4) strong');
        if (browserItem) {
            const ua = navigator.userAgent;
            let browser = 'Unknown';
            if (ua.includes('Chrome')) browser = 'Chrome';
            else if (ua.includes('Firefox')) browser = 'Firefox';
            else if (ua.includes('Safari')) browser = 'Safari';
            else if (ua.includes('Edge')) browser = 'Edge';

            let os = 'Unknown';
            if (ua.includes('Windows')) os = 'Windows';
            else if (ua.includes('Mac')) os = 'macOS';
            else if (ua.includes('Linux')) os = 'Linux';
            else if (ua.includes('Android')) os = 'Android';
            else if (ua.includes('iOS')) os = 'iOS';

            browserItem.textContent = `${browser} / ${os}`;
        }
    }

    function updateStorageManagement() {
        const storageFill = document.querySelector('.storage-progress-bar');
        const storageInfo = document.querySelector('.storage-progress-info span');
        const breakdownItems = document.querySelectorAll('.storage-breakdown li strong');

        try {
            const media = JSON.parse(localStorage.getItem('akbariMedia') || '[]');
            let totalBytes = 0;
            let imgBytes = 0, docBytes = 0, otherBytes = 0;

            media.forEach(item => {
                const size = item.size || 0;
                totalBytes += size;

                if (item.type === 'image') imgBytes += size;
                else if (item.type === 'document') docBytes += size;
                else otherBytes += size;
            });

            const usedMB = parseFloat((totalBytes / (1024 * 1024)).toFixed(2));
            const limitMB = 500;
            const percent = Math.min((usedMB / limitMB) * 100, 100);

            if (storageFill) {
                storageFill.style.width = percent.toFixed(1) + '%';
            }

            if (storageInfo) {
                storageInfo.textContent = `${usedMB} MB / ${limitMB} MB (${percent.toFixed(1)}%)`;
            }

            if (breakdownItems.length >= 4) {
                breakdownItems[0].textContent = (imgBytes / (1024 * 1024)).toFixed(2) + ' MB';
                breakdownItems[1].textContent = '0 MB';
                breakdownItems[2].textContent = (docBytes / (1024 * 1024)).toFixed(2) + ' MB';
                breakdownItems[3].textContent = (otherBytes / (1024 * 1024)).toFixed(2) + ' MB';
            }
        } catch (e) {}
    }

    function saveBackupToHistory(filename, size) {
        try {
            let history = JSON.parse(localStorage.getItem(BACKUP_HISTORY_KEY) || '[]');

            const entry = {
                id: Date.now(),
                filename: filename,
                size: size,
                date: new Date().toLocaleString('en-GB', {
                    timeZone: 'Asia/Kabul',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };

            history.unshift(entry);
            if (history.length > 10) history = history.slice(0, 10);

            localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(history));
            renderBackupHistory();
        } catch (e) {}
    }

    async function loadBackupList() {
        const backupList = document.querySelector('.backup-list');
        if (!backupList) return;

        try {
            backupList.innerHTML = `
                <div style="text-align:center;padding:15px;color:#A0AEC0;font-size:12px;">
                    <i class="fas fa-spinner fa-spin"></i> Loading...
                </div>
            `;

            const resp = await API.get('/backup/list');

            if (!resp.success || !resp.data || resp.data.length === 0) {
                backupList.innerHTML = `
                    <div style="text-align:center;padding:20px;color:#A0AEC0;font-size:12px;">
                        <i class="fas fa-database" style="font-size:30px;color:#2D3748;margin-bottom:10px;display:block;"></i>
                        No backups yet. Click "Backup Now" to create one.
                    </div>
                `;
                return;
            }

            backupList.innerHTML = '';
            resp.data.slice(0, 5).forEach(b => {
                const div = document.createElement('div');
                div.className = 'backup-item';
                div.innerHTML = `
                    <div>
                        <strong>${b.filename}</strong>
                        <span>${b.date} • ${b.sizeFormatted}</span>
                    </div>
                    <div class="backup-item-actions">
                        <span class="status-badge success">Success</span>
                        <button class="btn-icon" onclick="downloadBackup('${b.filename}')" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn-icon" onclick="deleteBackup('${b.filename}')" title="Delete" style="background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.3);color:#EF4444;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                backupList.appendChild(div);
            });

        } catch (e) {
            console.error(e);
        }
    }

    window.downloadBackup = function(filename) {
        const token = sessionStorage.getItem('akbari_token') || localStorage.getItem('akbari_token');
        window.open((window.API_BASE || 'http://localhost/Akbari-Solution/api/v1') + '/backup/download/' + filename + '?token=' + token, '_blank');
    };

    window.deleteBackup = async function(filename) {
        if (!confirm('Delete backup: ' + filename + '?')) return;
        
        try {
            const resp = await API.del('/backup/' + filename);
            if (resp.success) {
                loadBackupList();
            } else {
                alert('⚠️ ' + (resp.message || 'Failed'));
            }
        } catch (e) {
            console.error(e);
            alert('⚠️ Network error');
        }
    };

    // Initialize system sections
    updateSystemInfo();
    updateStorageManagement();
    loadBackupList();
    renderActivityLog();

    // if (document.getElementById('mediaGrid')) {
    //     applyMediaFilters();
    //     updateStorageDisplay();
    // }

    // if (document.getElementById('messagesList')) {
    //     applyMsgFilters();
    // }


    /* =========================================
       SECTION 29: SMOOTH SCROLL FOR ANCHOR LINKS
       ========================================= */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    /* =========================================
       SECTION 30: USER PROFILE DROPDOWN (TOPBAR)
       ========================================= */
    const userProfile = document.querySelector('.user-profile');

    if (userProfile) {
        if (!userProfile.querySelector('.user-profile-dropdown')) {
            const dropdown = document.createElement('div');
            dropdown.className = 'user-profile-dropdown';
            dropdown.innerHTML = `
                <a href="my-profile.html" class="dropdown-item">
                    <i class="fas fa-user"></i>
                    <span>My Profile</span>
                </a>
                <a href="account-settings.html" class="dropdown-item">
                    <i class="fas fa-cog"></i>
                    <span>Account Settings</span>
                </a>
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item logout-item" onclick="logoutUser(); return false;">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </a>
            `;
            userProfile.appendChild(dropdown);
        }

        userProfile.addEventListener('click', (e) => {
            if (e.target.closest('.dropdown-item')) {
                return;
            }

            e.stopPropagation();
            userProfile.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!userProfile.contains(e.target)) {
                userProfile.classList.remove('active');
            }
        });
    }

    console.log('✅ Stage 17/18 — Sections 26-30 loaded');

    /* =========================================
       SECTION 31: LOAD CURRENT USER INFO (Final)
       ========================================= */
    function loadCurrentUserInfoFinal() {
        try {
            const currentUser = getCurrentUser();

            if (!currentUser) {
                console.warn('⚠️ No current user found');
                return;
            }

            // ⚠️ ترجمه نقش
            let roleText = currentUser.role || 'Administrator';
            if (roleText === 'super_admin') roleText = 'Super Administrator';
            if (roleText === 'admin') roleText = 'Administrator';
            if (roleText === 'employee') roleText = 'Employee';

            const nameEl = document.querySelector('.user-profile .user-info h4');
            const roleEl = document.querySelector('.user-profile .user-info span');
            const avatarEl = document.querySelector('.user-profile img');

            if (nameEl) nameEl.textContent = currentUser.name || 'User';
            if (roleEl) roleEl.textContent = roleText;

            if (avatarEl) {
                const avatarSrc = currentUser.avatar;

                if (avatarSrc && avatarSrc.trim() !== '' && avatarSrc.length < 2000) {
                    avatarEl.src = avatarSrc;
                    avatarEl.style.display = '';

                    const existingFallback = avatarEl.parentElement?.querySelector('.avatar-fallback');
                    if (existingFallback) existingFallback.remove();

                    avatarEl.onerror = function() {
                        this.style.display = 'none';
                        const parent = this.parentElement;
                        if (parent && !parent.querySelector('.avatar-fallback')) {
                            const initials = (currentUser.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                            const fallback = document.createElement('div');
                            fallback.className = 'avatar-fallback';
                            fallback.textContent = initials;
                            parent.insertBefore(fallback, this);
                        }
                    };
                }
            }

            const welcomeEl = document.querySelector('.page-header h1');
            if (welcomeEl && welcomeEl.textContent.includes('Welcome')) {
                welcomeEl.textContent = 'Welcome, ' + (currentUser.name || 'User');
            }

        } catch (e) {
            console.warn('Could not load current user:', e);
        }
    }

    loadCurrentUserInfoFinal();

    /* =========================================
       SECTION 34.5: UPDATE ORDER BADGE
       ========================================= */
    async function updateOrderBadge() {
        try {
            const response = await API.get('/orders/stats');
            if (response.success && response.data) {
                const badge = document.getElementById('sidebarOrderCount');
                if (badge) badge.textContent = response.data.new_orders || 0;
            }
        } catch (e) {
            console.error('Failed to load orders stats:', e);
        }
    }
    updateOrderBadge();

    /* =========================================
       SECTION 32: ACTIVITY LOG MODAL
       ========================================= */
    window.openActivityLogModal = function() {
        const log = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]');

        const modal = document.createElement('div');
        modal.className = 'activity-log-modal';
        modal.innerHTML = `
            <div class="activity-log-modal-content" onclick="event.stopPropagation()">
                <div class="activity-log-modal-header">
                    <h3><i class="fas fa-history"></i> All Activities (${log.length})</h3>
                    <button class="btn-close-modal" onclick="closeActivityLogModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="activity-log-modal-body">
                    <ul>
                        ${log.length === 0 ? '<li style="text-align:center; padding: 40px; color: #A0AEC0; display: block;">No activities yet.</li>' :
                            log.map(entry => `
                                <li data-type="${entry.type || 'info'}">
                                    <img src="${entry.avatar}" alt="User">
                                    <div>
                                        <strong>${entry.user}</strong>
                                        <span>${entry.description}</span>
                                    </div>
                                    <small>${entry.date}</small>
                                </li>
                            `).join('')
                        }
                    </ul>
                </div>
            </div>
        `;
        modal.onclick = closeActivityLogModal;
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
    };

    window.closeActivityLogModal = function() {
        const modal = document.querySelector('.activity-log-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    };

    /* =========================================
       SECTION 33: BACKUP HISTORY MODAL
       ========================================= */
    window.openBackupHistoryModal = function() {
        const history = JSON.parse(localStorage.getItem(BACKUP_HISTORY_KEY) || '[]');

        const modal = document.createElement('div');
        modal.className = 'activity-log-modal';
        modal.innerHTML = `
            <div class="activity-log-modal-content" onclick="event.stopPropagation()">
                <div class="activity-log-modal-header">
                    <h3><i class="fas fa-database"></i> All Backups (${history.length})</h3>
                    <button class="btn-close-modal" onclick="closeBackupHistoryModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="activity-log-modal-body">
                    ${history.length === 0 ? '<p style="text-align:center; padding: 40px; color: #A0AEC0;">No backups yet.</p>' :
                        `<div class="backup-list-full">
                            ${history.map(entry => `
                                <div class="backup-item">
                                    <div>
                                        <strong>${entry.filename}</strong>
                                        <span>${entry.date} • ${entry.size}</span>
                                    </div>
                                    <div class="backup-item-actions">
                                        <span class="status-badge success">Success</span>
                                        <button class="btn-icon" onclick="deleteBackupHistory(${entry.id}); closeBackupHistoryModal(); openBackupHistoryModal();" title="Delete">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>`
                    }
                </div>
            </div>
        `;
        modal.onclick = closeBackupHistoryModal;
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
    };

    window.closeBackupHistoryModal = function() {
        const modal = document.querySelector('.activity-log-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    };

    /* =========================================
       LOGOUT FUNCTION
       ========================================= */
    window.logoutUser = function() {
        if (!confirm('Are you sure you want to logout?')) return;
        
        // پاک کردن توکن
        if (window.Auth && typeof Auth.logout === 'function') {
            Auth.logout();
        }
        
        // پاک کردن LocalStorage قدیمی
        localStorage.removeItem('akbariCurrentUserId');
        localStorage.removeItem('akbariLoggedIn');
        sessionStorage.removeItem('akbariLoggedIn');
        
        // ریدایرکت به login
        window.location.href = 'login.html';
    };

    /* =========================================
       SECTION 33.5: LOGOUT FUNCTION
       ========================================= */
    window.logoutUser = function() {
        if (!confirm('Are you sure you want to logout?')) return;
        
        if (window.Auth && typeof Auth.logout === 'function') {
            Auth.logout();
        }
        
        localStorage.removeItem('akbariCurrentUserId');
        localStorage.removeItem('akbariLoggedIn');
        sessionStorage.removeItem('akbariLoggedIn');
        
        window.location.href = 'login.html';
    };

    /* =========================================
       SECTION 34: FINAL LOGGING
       ========================================= */
    console.log('%c✅ Akbari Solution Dashboard Ready', 'color: #00A8FF; font-size: 14px; font-weight: bold;');
    console.log('%cDashboard.js loaded successfully — 34 sections complete', 'color: #10B981; font-size: 12px;');

}); // ← ⚠️ پایان DOMContentLoaded (این خط رو فراموش نکن!)