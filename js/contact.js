document.addEventListener('DOMContentLoaded', async () => {
    
    const API_BASE = window.API_BASE || 'http://localhost/Akbari-Solution/api/v1';
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    // =========================================
    // API-based data fetcher
    // =========================================
    async function getContactData() {
        try {
            const resp = await fetch(API_BASE + '/pages/contact', {
                headers: { 'Accept': 'application/json' }
            });
            const data = await resp.json();
            return data.success ? (data.data?.value || null) : null;
        } catch (e) {
            return null;
        }
    }
    
    async function getSettingsData() {
        try {
            const resp = await fetch(API_BASE + '/settings/public', {
                headers: { 'Accept': 'application/json' }
            });
            const data = await resp.json();
            return data.success ? data.data : null;
        } catch (e) {
            return null;
        }
    }
    
    // =========================================
    // Map Rendering
    // =========================================
    async function renderContactMap(pageData) {
        const mapContainer = document.getElementById('contactMap');
        if (!mapContainer) return;

        // ۱. mapsLink از Website Settings
        let mapsLink = '';
        try {
            const settingsData = await getSettingsData();
            if (settingsData?.contact?.mapsLink) {
                mapsLink = settingsData.contact.mapsLink;
            }
        } catch (e) {}

        // ۲. mapEmbed از Contact Management
        const mapEmbed = pageData?.mapEmbed || '';

        // تبدیل لینک به URL قابل embed
        function buildEmbedUrl(link) {
        if (!link || !link.trim()) return '';
        
        link = link.trim();
        
        // ۱. لینک short (maps.app.goo.gl) → قابل embed مستقیم نیست
        if (link.includes('maps.app.goo.gl') || link.includes('goo.gl/maps')) {
            // نمیتونیم coords استخراج کنیم - fallback به Kabul
            return `https://maps.google.com/maps?q=34.538388,69.144444&z=15&output=embed`;
        }
        
        // ۲. فرمت: !3dLAT!4dLNG (لینک place)
        let match = link.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
        if (match) {
            return `https://maps.google.com/maps?q=${match[1]},${match[2]}&z=17&output=embed`;
        }
        
        // ۳. فرمت: @LAT,LNG,ZOOMz
        match = link.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),(\d+\.?\d*)z/);
        if (match) {
            return `https://maps.google.com/maps?q=${match[1]},${match[2]}&z=${Math.floor(match[3])}&output=embed`;
        }
        
        // ۴. فرمت: ?q=LAT,LNG
        if (link.includes('?q=') || link.includes('&q=')) {
            const qMatch = link.match(/[?&]q=([^&]+)/);
            if (qMatch) {
                return `https://maps.google.com/maps?q=${qMatch[1]}&z=17&output=embed`;
            }
        }
        
        // ۵. فقط یه جفت lat,lng توش هست
        match = link.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
        if (match) {
            return `https://maps.google.com/maps?q=${match[1]},${match[2]}&z=17&output=embed`;
        }
        
        // ۶. fallback نهایی
        return `https://maps.google.com/maps?q=${encodeURIComponent(link)}&z=15&output=embed`;
    }

        // رندر بر اساس Priority
        let finalMapHTML = '';

        // Priority 1: iframe کامل از Contact Management
        if (mapEmbed && mapEmbed.trim().includes('<iframe')) {
            finalMapHTML = mapEmbed.trim();
        }
        // Priority 2: mapsLink از Website Settings
        else if (mapsLink) {
            const embedUrl = buildEmbedUrl(mapsLink);
            finalMapHTML = `
                <iframe 
                    src="${embedUrl}"
                    width="100%" 
                    height="100%" 
                    style="border: 0; display: block;" 
                    allowfullscreen="" 
                    loading="lazy" 
                    referrerpolicy="no-referrer-when-downgrade">
                </iframe>
            `;
        }

        // اگه هیچ‌کدوم نبود، HTML default بمونه
        if (!finalMapHTML) return;

        // دکمه "Open in Google Maps"
        const openUrl = mapsLink || '#';

        mapContainer.innerHTML = `
            ${finalMapHTML}
            <a href="${openUrl}" 
               target="_blank" 
               rel="noopener noreferrer"
               style="position: absolute; top: 10px; right: 10px; background-color: #00A8FF; color: white; padding: 8px 14px; border-radius: 8px; font-size: 11px; font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); z-index: 10;">
                <i class="fas fa-external-link-alt"></i>
                Open in Google Maps
            </a>
        `;
    }
    
    // =========================================
    // بارگذاری اطلاعات Contact
    // =========================================
    async function loadContactInfo() {
        const data = await getContactData();
        if (!data) return;
        
        // Hero Title
        if (data.pageTitle) {
            const heroTitle = document.getElementById('contactHeroTitle');
            if (heroTitle) {
                let titleHTML = data.pageTitle;
                if (titleHTML.includes('Together')) {
                    titleHTML = titleHTML.replace('Together', '<span class="text-blue">Together</span>');
                }
                heroTitle.innerHTML = titleHTML;
            }
        }
        
        // Hero Description
        if (data.shortDesc) {
            const heroDesc = document.getElementById('contactHeroDesc');
            if (heroDesc) heroDesc.textContent = data.shortDesc;
        }
        
        // عکس پس‌زمینه Hero
        if (data.image) {
            const heroBg = document.querySelector('.contact-hero-bg img');
            if (heroBg) heroBg.src = data.image;
        }
        
        // Contact Info
        if (data.address) {
            const el = document.getElementById('infoAddress');
            if (el) el.textContent = data.address;
        }
        if (data.phone) {
            const el = document.getElementById('infoPhone');
            if (el) el.textContent = data.phone;
        }
        if (data.whatsapp) {
            const el = document.getElementById('infoWhatsApp');
            if (el) el.textContent = data.whatsapp;
            
            const whatsappBtn = document.querySelector('.btn-whatsapp-chat');
            if (whatsappBtn) {
                const cleanedNumber = data.whatsapp.replace(/\D/g, '');
                whatsappBtn.href = 'https://wa.me/' + cleanedNumber;
            }
        }
        if (data.email) {
            const el = document.getElementById('infoEmail');
            if (el) el.textContent = data.email;
        }
        if (data.workingHours) {
            const el = document.getElementById('infoHours');
            if (el) el.textContent = data.workingHours;
        }
        
        // Footer Contact Info
        if (data.address) {
            const el = document.getElementById('footerAddress');
            if (el) el.textContent = data.address;
        }
        if (data.phone) {
            const el = document.getElementById('footerPhone');
            if (el) el.textContent = data.phone;
        }
        if (data.email) {
            const el = document.getElementById('footerEmail');
            if (el) el.textContent = data.email;
        }
        if (data.workingHours) {
            const el = document.getElementById('footerHours');
            if (el) el.textContent = data.workingHours.split('\n')[0];
        }
        
        // ⚠️ Map Rendering
        await renderContactMap(data);
    }
    
    // =========================================
    // ارسال فرم به API
    // =========================================
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('senderName').value.trim();
        const email = document.getElementById('senderEmail').value.trim();
        const phone = document.getElementById('senderPhone').value.trim();
        const subject = document.getElementById('senderSubject').value;
        const message = document.getElementById('senderMessage').value.trim();
        
        if (!name || !email || !subject || !message) {
            alert('⚠️ Please fill in all required fields (Name, Email, Subject, Message).');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('⚠️ Please enter a valid email address.');
            return;
        }
        
        if (message.length < 10) {
            alert('⚠️ Please write a message with at least 10 characters.');
            return;
        }
        
        const submitBtn = contactForm.querySelector('.btn-send-message');
        const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
        }
        
        try {
            const response = await fetch(API_BASE + '/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    phone: phone || '',
                    subject: subject,
                    message: message
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showSuccessNotification(name);
                contactForm.reset();
                
                try {
                    if (typeof window.logActivity === 'function') {
                        window.logActivity('message', `New message from: ${name} - "${subject}"`, 'info');
                    }
                } catch(e) {}
                
            } else {
                alert('⚠️ ' + (data.message || 'Failed to send message. Please try again.'));
            }
            
        } catch (err) {
            console.error('Send message error:', err);
            alert('⚠️ Network error. Please check your connection and try again.');
        } finally {
            if (submitBtn) {
                submitBtn.innerHTML = originalBtnHTML;
                submitBtn.disabled = false;
            }
        }
    });
    
    // =========================================
    // پیام موفقیت
    // =========================================
    function showSuccessNotification(name) {
        const modal = document.createElement('div');
        modal.className = 'contact-success-modal';
        modal.innerHTML = `
            <div class="contact-success-content">
                <div class="success-check-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2>Message Sent Successfully!</h2>
                <p>Thank you, <strong>${name}</strong>. Your message has been received. We will get back to you as soon as possible.</p>
                <button class="btn-close-success" onclick="this.closest('.contact-success-modal').remove()">
                    <i class="fas fa-check"></i> Close
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
            }
        }, 8000);
    }
    
    const backToTopBtn = document.querySelector('.back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    await loadContactInfo();
    
});