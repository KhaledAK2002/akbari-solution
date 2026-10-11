document.addEventListener('DOMContentLoaded', async () => {
    
    const serviceTitle = document.getElementById('serviceTitle');
    if (!serviceTitle) return;

    // گرفتن ID خدمت از URL
    const urlParams = new URLSearchParams(window.location.search);
    const serviceId = urlParams.get('id');

    if (!serviceId) {
        alert('Service not found!');
        window.location.href = 'services.html';
        return;
    }

    // نمایش لودینگ
    serviceTitle.textContent = 'Loading...';

    // ⚠️ درخواست به API
    const response = await API.get('/services/' + serviceId);

    if (!response.success) {
        alert('Service not found!');
        window.location.href = 'services.html';
        return;
    }

    const service = response.data;

    // Breadcrumb
    document.getElementById('breadcrumbService').textContent = service.name;
    document.title = service.name + ' - Akbari Solution';

    // عنوان و توضیحات
    serviceTitle.textContent = service.name;
    document.getElementById('serviceDesc').textContent = service.short_desc || 'We provide professional solutions.';

    // آیکون خدمت
    const serviceIcon = document.getElementById('serviceIcon');
    const iconMap = {
        'Software': '<i class="fas fa-code"></i>',
        'Web': '<i class="fas fa-globe"></i>',
        'Database': '<i class="fas fa-database"></i>',
        'Mobile App': '<i class="fas fa-mobile-alt"></i>',
        'Consulting': '<i class="fas fa-comments"></i>',
        'Support': '<i class="fas fa-tools"></i>'
    };
    const colorMap = {
        'Software': 'blue',
        'Web': 'purple',
        'Database': 'green',
        'Mobile App': 'orange',
        'Consulting': 'blue',
        'Support': 'purple'
    };
    serviceIcon.innerHTML = iconMap[service.category] || '<i class="fas fa-cog"></i>';
    serviceIcon.className = 'service-icon-large ' + (colorMap[service.category] || 'blue');

    // لیست "What We Develop"
    const checkList = document.getElementById('serviceCheckList');
    if (service.features && service.features.trim() !== '') {
        const featuresArray = service.features.split('\n').filter(f => f.trim() !== '');
        featuresArray.forEach(feature => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-check-circle"></i> ${feature}`;
            checkList.appendChild(li);
        });
    } else {
        const defaultFeatures = [
            'Management Systems (e.g. clinic, pharmacy, school, company)',
            'Accounting and Finance Systems',
            'Inventory and Stock Management Systems',
            'Web Applications (Admin Panels, Portals, Online Systems)',
            'Desktop Applications (Windows)',
            'Mobile Applications (Android & iOS)',
            'Database Design and Development',
            'Integration with Third-party Services (API, Payment, etc.)'
        ];
        defaultFeatures.forEach(feature => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-check-circle"></i> ${feature}`;
            checkList.appendChild(li);
        });
    }

    // FAQ Accordion
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            faqItem.classList.toggle('active');
        });
    });

    // Back to Top
    const backToTopBtn = document.querySelector('.back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // اتصال دکمه Order به Checkout
    const orderServiceBtn = document.getElementById('orderServiceBtn');
    if (orderServiceBtn) {
        orderServiceBtn.href = 'checkout.html?id=' + service.id;
    }

});