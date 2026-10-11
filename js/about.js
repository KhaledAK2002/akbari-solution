document.addEventListener('DOMContentLoaded', async () => {
    
    const API_BASE = window.API_BASE || 'http://localhost/Akbari-Solution/api/v1';
    const aboutTitle = document.getElementById('aboutTitle');
    
    if (!aboutTitle) return;
    
    async function getAboutData() {
        try {
            const resp = await fetch(API_BASE + '/pages/about', {
                headers: { 'Accept': 'application/json' }
            });
            const data = await resp.json();
            return data.success ? (data.data?.value || null) : null;
        } catch (e) {
            return null;
        }
    }
    
    async function loadAboutData() {
        const data = await getAboutData();
        if (!data) return;
        
        if (data.pageTitle) {
            let titleHTML = data.pageTitle;
            if (titleHTML.includes('Smarter Solutions')) {
                titleHTML = titleHTML.replace('Smarter Solutions', '<span class="text-blue">Smarter Solutions</span>');
            }
            document.getElementById('aboutTitle').innerHTML = titleHTML;
        }
        
        if (data.shortIntro) {
            const el = document.getElementById('aboutShortIntro');
            if (el) el.textContent = data.shortIntro;
        }
        
        if (data.ourStory) {
            const el = document.getElementById('ourStoryText');
            if (el) el.innerHTML = data.ourStory;
        }
        
        if (data.ourMission) {
            const el = document.getElementById('ourMissionText');
            if (el) el.textContent = data.ourMission;
        }
        
        if (data.ourVision) {
            const el = document.getElementById('ourVisionText');
            if (el) el.textContent = data.ourVision;
        }
        
        if (data.statProjects !== undefined) {
            const el = document.getElementById('statProjects');
            if (el) el.textContent = data.statProjects;
        }
        if (data.statClients !== undefined) {
            const el = document.getElementById('statClients');
            if (el) el.textContent = data.statClients;
        }
        if (data.statSatisfaction !== undefined) {
            const el = document.getElementById('statSatisfaction');
            if (el) el.textContent = data.statSatisfaction;
        }
        if (data.statExperience !== undefined) {
            const el = document.getElementById('statExperience');
            if (el) el.textContent = data.statExperience;
        }
        
        if (data.image) {
            const heroImg = document.querySelector('.about-hero-bg img');
            if (heroImg) heroImg.src = data.image;
        }
    }
    
    const backToTopBtn = document.querySelector('.back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    await loadAboutData();

    // =========================================
    // آپدیت اطلاعات تماس در فوتر
    // =========================================
    async function updateFooterContact() {
        const data = await getAboutData();
        if (!data) return;
        
        const footerAddress = document.getElementById('footerAddress');
        const footerPhone = document.getElementById('footerPhone');
        const footerEmail = document.getElementById('footerEmail');
        const footerHours = document.getElementById('footerHours');
        
        if (footerAddress && data.contactAddress) footerAddress.textContent = data.contactAddress;
        if (footerPhone && data.contactPhone) footerPhone.textContent = data.contactPhone;
        if (footerEmail && data.contactEmail) footerEmail.textContent = data.contactEmail;
        if (footerHours && data.contactHours) footerHours.textContent = data.contactHours;
    }

    await updateFooterContact();
    
});