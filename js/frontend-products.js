document.addEventListener('DOMContentLoaded', async () => {
    
    const productsGrid = document.getElementById('productsGrid');
    const noProductsMessage = document.getElementById('noProductsMessage');

    if (!productsGrid) return;

    // تعیین رنگ Badge
    function getBadgeClass(category) {
        const map = {
            'Databases': 'blue',
            'Software': 'purple',
            'Web Apps': 'green',
            'Mobile Apps': 'orange',
            'Business Tools': 'blue'
        };
        return map[category] || 'blue';
    }

    // ⚠️ تابع فرمت قیمت نهایی با Tax
    function formatProductPrice(price) {
        try {
            const settings = JSON.parse(localStorage.getItem('akbariWebsiteSettings') || '{}');
            const ecommerce = settings.ecommerce || {};
            
            const symbol = ecommerce.currencySymbol || '$';
            const decimals = parseInt(ecommerce.decimalPlaces) || 2;
            const format = ecommerce.priceFormat || '$1,234.56';
            const taxRate = parseFloat(ecommerce.taxRate) || 0;
            
            let numPrice = parseFloat(price) || 0;
            
            if (taxRate > 0) {
                numPrice = numPrice + (numPrice * taxRate / 100);
            }
            
            let formattedNum = numPrice.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            
            if (format === '1,234.56$') return formattedNum + symbol;
            if (format === '$ 1,234.56') return symbol + ' ' + formattedNum;
            return symbol + formattedNum;
        } catch (e) {
            return '$' + price;
        }
    }

    // ⚠️ نمایش محصولات از API
    async function renderProducts(filter = 'all') {
        
        // نمایش لودینگ
        productsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 60px; color: #A0AEC0;">
                <i class="fas fa-spinner fa-spin" style="font-size: 40px;"></i>
                <p style="margin-top: 20px;">Loading products...</p>
            </div>
        `;

        // درخواست به API
        const params = {};
        if (filter !== 'all') {
            params.category = filter;
        }

        const response = await API.get('/products', params);

        if (!response.success) {
            productsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding: 60px; color: #EF4444;">
                    <i class="fas fa-exclamation-circle" style="font-size: 50px;"></i>
                    <h3 style="margin-top: 20px;">Error Loading Products</h3>
                    <p>${response.message || 'Please try again later.'}</p>
                </div>
            `;
            return;
        }

        const products = response.data.products || [];

        productsGrid.innerHTML = '';

        if (products.length === 0) {
            productsGrid.style.display = 'none';
            if (noProductsMessage) noProductsMessage.style.display = 'block';
            return;
        }

        productsGrid.style.display = 'grid';
        if (noProductsMessage) noProductsMessage.style.display = 'none';

        // نمایش هر محصول
        products.forEach(product => {
            const coverImage = (product.images && product.images.length > 0)
                ? product.images[0].url
                : 'assets/images/product-doctor-clinic.png';

            const card = document.createElement('div');
            card.className = 'product-card-frontend';
            card.innerHTML = `
                <div class="card-image">
                    <img src="${coverImage}" alt="${product.name}" onerror="this.src='assets/images/product-doctor-clinic.png'">
                    <span class="card-badge ${getBadgeClass(product.category)}">${product.category}</span>
                </div>
                <div class="card-content">
                    <h3>${product.name}</h3>
                    <p>${product.short_desc || ''}</p>
                    <span class="price">${formatProductPrice(product.price)}</span>
                    <a href="product-details.html?id=${product.id}" class="btn-view-details">
                        View Details <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            `;
            productsGrid.appendChild(card);
        });
    }

    // فیلتر تب‌ها
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const filter = tab.getAttribute('data-filter');
            renderProducts(filter);
        });
    });

    // بررسی URL Parameter
    function applyFilterFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const filterParam = urlParams.get('filter');
        
        if (filterParam) {
            const targetTab = document.querySelector(`.filter-tab[data-filter="${filterParam}"]`);
            if (targetTab) {
                filterTabs.forEach(t => t.classList.remove('active'));
                targetTab.classList.add('active');
                renderProducts(filterParam);
                return true;
            }
        }
        return false;
    }
    
    if (!applyFilterFromURL()) {
        await renderProducts();
    }

});