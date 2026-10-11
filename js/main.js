document.addEventListener('DOMContentLoaded', async () => {

    const HOME_KEY = 'akbariHome';
    const CONTACT_KEY = 'akbariContact';
    const ABOUT_KEY = 'akbariAbout';
    const API_BASE = window.API_BASE || 'http://localhost/Akbari-Solution/api/v1';
    
    // =========================================
    // Back to Top Button
    // =========================================
    const backToTopBtn = document.querySelector('.back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // =========================================
    // Sticky Header Shadow on Scroll
    // =========================================
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
            } else {
                header.style.boxShadow = 'none';
            }
        });
    }

    // =========================================
    // Toggle Password Visibility (Login Page)
    // =========================================
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.querySelector('.login-form input[type="password"]');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
        });
    }

    // =========================================
    // API-Based Data Loaders
    // =========================================
    async function fetchHomeDataFromAPI() {
        try {
            const resp = await fetch(API_BASE + '/pages/home', {
                headers: { 'Accept': 'application/json' }
            });
            const data = await resp.json();
            return data.success ? (data.data?.value || null) : null;
        } catch (e) {
            console.error('fetchHome error:', e);
            return null;
        }
    }

    async function fetchAboutDataFromAPI() {
        try {
            const resp = await fetch(API_BASE + '/pages/about', {
                headers: { 'Accept': 'application/json' }
            });
            const data = await resp.json();
            return data.success ? (data.data?.value || null) : null;
        } catch (e) {
            console.error('fetchAbout error:', e);
            return null;
        }
    }

    async function fetchContactDataFromAPI() {
        try {
            const resp = await fetch(API_BASE + '/pages/contact', {
                headers: { 'Accept': 'application/json' }
            });
            const data = await resp.json();
            return data.success ? (data.data?.value || null) : null;
        } catch (e) {
            console.error('fetchContact error:', e);
            return null;
        }
    }
    
    // =========================================
    // Home Page - Load Hero Data
    // =========================================
    async function loadHomeHero() {
        const heroTitle = document.getElementById('heroTitle');
        if (!heroTitle) return;
        
        const data = await fetchHomeDataFromAPI();
        if (!data) return;
        
        if (data.smallTitle) {
            const badge = document.getElementById('heroBadge');
            if (badge) badge.textContent = data.smallTitle;
        }
        
        if (data.mainHeading) {
            let headingHTML = data.mainHeading;
            
            if (headingHTML.includes('Software & Applications')) {
                headingHTML = headingHTML.replace('Software & Applications', '<span class="text-blue">Software & Applications</span>');
            } else if (headingHTML.includes('Software &')) {
                const match = headingHTML.match(/Software &[^,]*/);
                if (match) {
                    headingHTML = headingHTML.replace(match[0], `<span class="text-blue">${match[0]}</span>`);
                }
            }
            
            heroTitle.innerHTML = headingHTML;
        }
        
        if (data.description) {
            const desc = document.getElementById('heroDesc');
            if (desc) desc.textContent = data.description;
        }
        
        if (data.image) {
            const heroImg = document.getElementById('heroImage');
            if (heroImg) heroImg.src = data.image;
        }
        
        if (data.features && data.features.length > 0) {
            renderFeatures(data.features);
        }
    }
    
    function renderFeatures(features) {
        const featuresBar = document.getElementById('featuresBar');
        if (!featuresBar) return;
        
        const defaultIcons = [
            'fas fa-download',
            'fas fa-shield-alt',
            'fas fa-headset',
            'fas fa-sync-alt'
        ];
        
        featuresBar.innerHTML = '';
        
        features.forEach((feature, index) => {
            const iconClass = defaultIcons[index] || 'fas fa-star';
            
            const featureHTML = `
                <div class="feature-item">
                    <i class="${iconClass}"></i>
                    <div>
                        <h4>${feature.title}</h4>
                        <p>${feature.desc}</p>
                    </div>
                </div>
            `;
            
            featuresBar.insertAdjacentHTML('beforeend', featureHTML);
        });
    }
    
    async function loadFooterContact() {
        try {
            const contactData = await fetchContactDataFromAPI();
            if (!contactData) return;
            
            const footerAddress = document.getElementById('footerAddress');
            const footerEmail = document.getElementById('footerEmail');
            const footerPhone = document.getElementById('footerPhone');
            const footerWhatsApp = document.getElementById('footerWhatsApp');
            
            if (footerAddress && contactData.address) footerAddress.textContent = contactData.address;
            if (footerEmail && contactData.email) footerEmail.textContent = contactData.email;
            if (footerPhone && contactData.phone) footerPhone.textContent = contactData.phone;
            if (footerWhatsApp && contactData.whatsapp) footerWhatsApp.textContent = contactData.whatsapp;
        } catch (e) {}
    }
    
    async function loadAboutFooterContact() {
        try {
            const aboutData = await fetchAboutDataFromAPI();
            if (!aboutData) return;
            
            const footerAddress = document.getElementById('footerAddress');
            const footerEmail = document.getElementById('footerEmail');
            const footerPhone = document.getElementById('footerPhone');
            const footerHours = document.getElementById('footerHours');
            
            if (footerAddress && aboutData.contactAddress) footerAddress.textContent = aboutData.contactAddress;
            if (footerEmail && aboutData.contactEmail) footerEmail.textContent = aboutData.contactEmail;
            if (footerPhone && aboutData.contactPhone) footerPhone.textContent = aboutData.contactPhone;
            if (footerHours && aboutData.contactHours) footerHours.textContent = aboutData.contactHours;
        } catch (e) {}
    }
    
    await loadHomeHero();
    await loadFooterContact();
    await loadAboutFooterContact();

});