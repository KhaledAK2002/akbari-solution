document.addEventListener('DOMContentLoaded', async () => {
    
    const servicesGrid = document.getElementById('servicesGrid');
    const noServicesMessage = document.getElementById('noServicesMessage');

    if (!servicesGrid) return;

    // آیکون و رنگ بر اساس دسته‌بندی
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

    function getCategoryClass(category) {
        const map = {
            'Software': 'blue',
            'Web': 'purple',
            'Database': 'green',
            'Mobile App': 'orange',
            'Consulting': 'blue',
            'Support': 'purple'
        };
        return map[category] || 'blue';
    }

    // ⚠️ نمایش خدمات از API
    async function renderServices(filter = 'all') {

        // نمایش لودینگ
        servicesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 60px; color: #A0AEC0;">
                <i class="fas fa-spinner fa-spin" style="font-size: 40px;"></i>
                <p style="margin-top: 20px;">Loading services...</p>
            </div>
        `;

        // درخواست به API
        const params = {};
        if (filter !== 'all') {
            params.category = filter;
        }

        const response = await API.get('/services', params);

        if (!response.success) {
            servicesGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding: 60px; color: #EF4444;">
                    <i class="fas fa-exclamation-circle" style="font-size: 50px;"></i>
                    <h3 style="margin-top: 20px;">Error Loading Services</h3>
                    <p>${response.message || 'Please try again later.'}</p>
                </div>
            `;
            return;
        }

        const services = response.data.services || [];

        servicesGrid.innerHTML = '';

        if (services.length === 0) {
            servicesGrid.style.display = 'none';
            if (noServicesMessage) noServicesMessage.style.display = 'block';
            return;
        }

        servicesGrid.style.display = 'grid';
        if (noServicesMessage) noServicesMessage.style.display = 'none';

        // نمایش هر خدمت
        services.forEach(service => {
            const coverImage = service.image || 'assets/images/service-default.png';

            const card = document.createElement('div');
            card.className = 'service-card-frontend';
            card.innerHTML = `
                <div class="card-image">
                    <img src="${coverImage}" alt="${service.name}" onerror="this.src='assets/images/service-default.png'">
                    <div class="service-icon-badge ${getCategoryClass(service.category)}">
                        ${getCategoryIcon(service.category)}
                    </div>
                </div>
                <div class="card-content">
                    <h3>${service.name}</h3>
                    <p>${service.short_desc || ''}</p>
                    <a href="service-details.html?id=${service.id}" class="btn-learn-more">
                        Learn More <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            `;
            servicesGrid.appendChild(card);
        });
    }

    // فیلتر تب‌ها
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const filter = tab.getAttribute('data-filter');
            renderServices(filter);
        });
    });

    // اجرای اولیه
    await renderServices();

});