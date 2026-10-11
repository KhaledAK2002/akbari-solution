/**
 * Global Settings Loader - v6.0 (API-Based)
 * اعمال تنظیمات Website Settings در کل سایت (از API)
 */

(function() {
    'use strict';
    
    const API_BASE = window.API_BASE || 'http://localhost/Akbari-Solution/api/v1';
    const CACHE_KEY = 'akbariSettingsCache';
    const CACHE_TIME = 10 * 1000; // 10 ثانیه cache (کوتاهتر شده)

    // ⚠️ چک Maintenance Mode از API
        async function checkMaintenanceFromAPI() {
        // ⚠️ فقط روی صفحات Frontend عمومی اعمال بشه
        const publicPages = ['index.html', 'about.html', 'contact.html', 'products.html', 
                            'product-details.html', 'services.html', 'service-details.html', 
                            'checkout.html'];
        
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        // اگه صفحه Management هست، خارج شو (Dashboard, Add, Edit, Settings)
        const isManagementPage = currentPage.includes('-management') || 
                                currentPage.includes('dashboard') ||
                                currentPage.includes('add-') ||
                                currentPage.includes('my-profile') ||
                                currentPage.includes('account-settings') ||
                                currentPage.includes('media-library') ||
                                currentPage.includes('payment-settings') ||
                                currentPage.includes('login');
        
        if (isManagementPage) return;
        
        // اگه صفحه عمومی نبود، خارج شو
        if (!publicPages.includes(currentPage)) return;
        
        // اگه لاگین هستی، خارج شو
        const isLoggedIn = sessionStorage.getItem('akbariLoggedIn') === 'true';
        if (isLoggedIn) return;
        
        try {
            const resp = await fetch(API_BASE + '/maintenance', {
                headers: { 'Accept': 'application/json' }
            });
            const data = await resp.json();
            
            if (data.success && data.data && data.data.enabled === true) {
                const message = data.data.message || 'We are currently performing scheduled maintenance. Please check back soon.';
                
                const maintenanceHTML = `
                    <div id="maintenance-overlay" style="
                        position: fixed; top: 0; left: 0;
                        width: 100vw; height: 100vh;
                        background: linear-gradient(135deg, #0A1128, #060C1A);
                        color: white; display: flex;
                        justify-content: center; align-items: center;
                        z-index: 9999999; font-family: 'Poppins', sans-serif; padding: 20px;
                    ">
                        <div style="text-align: center; max-width: 500px;">
                            <div style="width: 100px; height: 100px; background: rgba(245, 158, 11, 0.15); border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 30px; border: 3px solid rgba(245, 158, 11, 0.3);">
                                <i class="fas fa-tools" style="font-size: 45px; color: #F59E0B;"></i>
                            </div>
                            <h1 style="font-size: 32px; font-weight: 700; margin-bottom: 15px;">Under Maintenance</h1>
                            <p style="font-size: 15px; color: #A0AEC0; line-height: 1.7; margin-bottom: 30px;">${message}</p>
                            <a href="login.html" style="display: inline-flex; align-items: center; gap: 10px; background-color: #00A8FF; color: white; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none;">
                                <i class="fas fa-sign-in-alt"></i> Admin Login
                            </a>
                        </div>
                    </div>
                `;
                
                document.body.insertAdjacentHTML('beforeend', maintenanceHTML);
                document.body.style.overflow = 'hidden';
            }
        } catch (e) {
            console.warn('Maintenance check error:', e);
        }
    }
    
    /**
     * دریافت تنظیمات از API (با cache)
     */
    async function fetchSettings() {
        // چک cache
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const data = JSON.parse(cached);
                if (data.time && (Date.now() - data.time) < CACHE_TIME) {
                    return data.settings;
                }
            }
        } catch (e) {}
        
        // از API بگیر
        try {
            const response = await fetch(API_BASE + '/settings/public', {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            const data = await response.json();
            
            if (data.success && data.data) {
                // ذخیره در cache
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    time: Date.now(),
                    settings: data.data
                }));
                return data.data;
            }
            
            return {};
        } catch (err) {
            console.warn('Failed to fetch settings from API, using defaults');
            return {};
        }
    }
    
    /**
     * اعمال تنظیمات روی صفحه
     */
    async function applySettings() {
        const settings = await fetchSettings();
        
        const general = settings.general || {};
        const appearance = settings.appearance || {};
        const contactSettings = settings.contact || {};
        const ecommerce = settings.ecommerce || {};
        const seo = settings.seo || {};
        const maintenance = settings.maintenance || {};
        
        // ⚠️ چک Maintenance Mode
        if (maintenance.enabled === true) {
            applyMaintenanceMode(maintenance);
            return;
        }
        
        // =========================================
        // 1. General Settings
        // =========================================
        const siteTitle = general.siteTitle || 'Akbari Solution';
        const logoUrl = general.logo || 'assets/images/logo.png';
        const faviconUrl = general.favicon || 'assets/images/logo.png';
        const metaDescription = general.metaDescription || '';
        const metaKeywords = general.metaKeywords || '';
        const metaTitle = general.metaTitle || '';
        const siteUrl = general.siteUrl || '';
        const siteTagline = general.siteTagline || '';
        const siteDescription = general.siteDescription || '';
        
        // عنوان تب
        if (!document.body.hasAttribute('data-original-title')) {
            document.body.setAttribute('data-original-title', document.title);
        }
        const originalTitle = document.body.getAttribute('data-original-title');
        const isHome = window.location.pathname.indexOf('index') > -1;
        
        if (isHome && metaTitle) {
            document.title = metaTitle;
        } else if (siteTitle !== 'Akbari Solution') {
            document.title = originalTitle.replace(/Akbari Solution/g, siteTitle);
        }
        
        // Meta Tags — با fallback به Site Description
        const finalMetaDescription = metaDescription || siteDescription;
        
        if (finalMetaDescription) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', finalMetaDescription);
        }
        
        if (metaKeywords) {
            let metaKw = document.querySelector('meta[name="keywords"]');
            if (!metaKw) {
                metaKw = document.createElement('meta');
                metaKw.setAttribute('name', 'keywords');
                document.head.appendChild(metaKw);
            }
            metaKw.setAttribute('content', metaKeywords);
        }
        
        // Favicon
        if (faviconUrl) {
            let icon = document.querySelector('link[rel="icon"]');
            if (!icon) {
                icon = document.createElement('link');
                icon.rel = 'icon';
                document.head.appendChild(icon);
            }
            icon.href = faviconUrl;
        }
        
        // Logo
        if (logoUrl) {
            const logos = document.querySelectorAll('.header .logo img, .footer .brand-col img, .brand-col img, .sidebar-header img');
            for (let i = 0; i < logos.length; i++) {
                logos[i].src = logoUrl;
            }
        }
        
        // =========================================
        // 1.5. Site Tagline (Footer)
        // =========================================
        if (siteTagline) {
            const brandCols = document.querySelectorAll('.brand-col, .footer .brand-col');
            brandCols.forEach(col => {
                const logo = col.querySelector('img');
                if (logo) {
                    let taglineEl = col.querySelector('.site-tagline');
                    if (!taglineEl) {
                        taglineEl = document.createElement('p');
                        taglineEl.className = 'site-tagline';
                        taglineEl.style.cssText = `
                            font-size: 12px;
                            color: #00A8FF;
                            font-weight: 500;
                            margin-top: 10px;
                            margin-bottom: 15px;
                            letter-spacing: 0.5px;
                            text-transform: uppercase;
                        `;
                        logo.parentNode.insertBefore(taglineEl, logo.nextSibling);
                    }
                    taglineEl.textContent = siteTagline;
                }
            });
        }
        
        // =========================================
        // 1.6. Canonical Link + Open Graph
        // =========================================
        if (siteUrl) {
            const cleanSiteUrl = siteUrl.replace(/\/$/, '');
            const currentPath = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
            const fullUrl = currentPath ? cleanSiteUrl + '/' + currentPath : cleanSiteUrl;
            
            // Canonical
            let canonical = document.querySelector('link[rel="canonical"]');
            if (!canonical) {
                canonical = document.createElement('link');
                canonical.rel = 'canonical';
                document.head.appendChild(canonical);
            }
            canonical.href = fullUrl;
            
            // OG: url
            let ogUrl = document.querySelector('meta[property="og:url"]');
            if (!ogUrl) {
                ogUrl = document.createElement('meta');
                ogUrl.setAttribute('property', 'og:url');
                document.head.appendChild(ogUrl);
            }
            ogUrl.content = fullUrl;
            
            // OG: title
            let ogTitle = document.querySelector('meta[property="og:title"]');
            if (!ogTitle) {
                ogTitle = document.createElement('meta');
                ogTitle.setAttribute('property', 'og:title');
                document.head.appendChild(ogTitle);
            }
            ogTitle.content = document.title;
            
            // OG: description
            let ogDesc = document.querySelector('meta[property="og:description"]');
            if (!ogDesc) {
                ogDesc = document.createElement('meta');
                ogDesc.setAttribute('property', 'og:description');
                document.head.appendChild(ogDesc);
            }
            ogDesc.content = finalMetaDescription || '';
            
            // OG: site_name
            let ogSiteName = document.querySelector('meta[property="og:site_name"]');
            if (!ogSiteName) {
                ogSiteName = document.createElement('meta');
                ogSiteName.setAttribute('property', 'og:site_name');
                document.head.appendChild(ogSiteName);
            }
            ogSiteName.content = siteTitle;
            
            // OG: type
            let ogType = document.querySelector('meta[property="og:type"]');
            if (!ogType) {
                ogType = document.createElement('meta');
                ogType.setAttribute('property', 'og:type');
                document.head.appendChild(ogType);
            }
            ogType.content = 'website';
            
            // OG: image
            if (logoUrl) {
                let ogImage = document.querySelector('meta[property="og:image"]');
                if (!ogImage) {
                    ogImage = document.createElement('meta');
                    ogImage.setAttribute('property', 'og:image');
                    document.head.appendChild(ogImage);
                }
                ogImage.content = logoUrl;
            }
        }
        
        // =========================================
        // 2. Contact Info (Footer & Contact Page)
        // =========================================
        const mainEmail = contactSettings.mainEmail || '';
        const mainPhone = contactSettings.mainPhone || '';
        const whatsapp = contactSettings.whatsapp || '';
        const address = contactSettings.address || '';
        const mapsLink = contactSettings.mapsLink || '';
        const workingHours = contactSettings.workingHours || '';
        
        // Footer Contact
        const footerAddress = document.getElementById('footerAddress');
        const footerEmail = document.getElementById('footerEmail');
        const footerPhone = document.getElementById('footerPhone');
        const footerWhatsApp = document.getElementById('footerWhatsApp');
        const footerHours = document.getElementById('footerHours');
        
        if (footerAddress && address) footerAddress.textContent = address;
        if (footerEmail && mainEmail) footerEmail.textContent = mainEmail;
        if (footerPhone && mainPhone) footerPhone.textContent = mainPhone;
        if (footerWhatsApp && whatsapp) footerWhatsApp.textContent = whatsapp;
        if (footerHours && workingHours) footerHours.textContent = workingHours.split('\n')[0];
        
        // Contact Page Info
        const infoAddress = document.getElementById('infoAddress');
        const infoPhone = document.getElementById('infoPhone');
        const infoEmail = document.getElementById('infoEmail');
        const infoWhatsApp = document.getElementById('infoWhatsApp');
        const infoHours = document.getElementById('infoHours');
        
        if (infoAddress && address) infoAddress.textContent = address;
        if (infoPhone && mainPhone) infoPhone.textContent = mainPhone;
        if (infoEmail && mainEmail) infoEmail.textContent = mainEmail;
        if (infoWhatsApp && whatsapp) infoWhatsApp.textContent = whatsapp;
        if (infoHours && workingHours) infoHours.textContent = workingHours;
        
        // =========================================
        // 3. Social Media Links
        // =========================================
        const socialMap = {
            'fa-facebook-f': contactSettings.facebook || '',
            'fa-facebook': contactSettings.facebook || '',
            'fa-instagram': contactSettings.instagram || '',
            'fa-linkedin-in': contactSettings.linkedin || '',
            'fa-linkedin': contactSettings.linkedin || '',
            'fa-youtube': contactSettings.youtube || '',
            'fa-telegram-plane': contactSettings.telegram || '',
            'fa-telegram': contactSettings.telegram || '',
            'fa-tiktok': contactSettings.tiktok || ''
        };
        
        const allSocialLinks = document.querySelectorAll('.social-links a, .contact-social-links a');
        allSocialLinks.forEach(link => {
            const icon = link.querySelector('i');
            if (!icon) return;
            
            const classes = icon.className;
            for (const [iconClass, url] of Object.entries(socialMap)) {
                if (classes.includes(iconClass) && url) {
                    link.href = url;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    break;
                }
            }
        });
        
        // =========================================
        // 4. Google Maps - Embed + Clickable
        // =========================================
        if (mapsLink) {
            const mapContainer = document.getElementById('contactMap');
            if (mapContainer) {
                const displayAddress = address || 'Kabul, Afghanistan';
                
                // استخراج مختصات از لینک
                let coords = '34.532998,69.165407'; // پیش‌فرض (Kabul)
                const coordMatch = mapsLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                if (coordMatch) {
                    coords = coordMatch[1] + ',' + coordMatch[2];
                }
                
                const embedUrl = `https://maps.google.com/maps?q=${coords}&z=15&output=embed`;
                
                // ⚠️ فقط اگه iframe از قبل نبود، بساز
                const existingIframe = mapContainer.querySelector('iframe');
                
                if (!existingIframe) {
                    mapContainer.innerHTML = `
                        <iframe
                            src="${embedUrl}"
                            width="100%"
                            height="100%"
                            style="border: 0; display: block;"
                            allowfullscreen=""
                            loading="lazy"
                            referrerpolicy="no-referrer-when-downgrade">
                        </iframe>
                        <a href="${mapsLink}"
                           target="_blank"
                           rel="noopener noreferrer"
                           style="position: absolute; top: 10px; right: 10px; background-color: #00A8FF; color: white; padding: 8px 14px; border-radius: 8px; font-size: 11px; font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); z-index: 10;">
                            <i class="fas fa-external-link-alt"></i>
                            Open in Google Maps
                        </a>
                    `;
                } else {
                    // اگه iframe از قبل هست (توی HTML)، فقط دکمه رو آپدیت کن
                    const btn = mapContainer.querySelector('a');
                    if (btn) {
                        btn.href = mapsLink;
                    }
                }
            }
        }
        
        // =========================================
        // 5. Appearance - Colors
        // =========================================
        function shadeColor(color, percent) {
            let R = parseInt(color.substring(1,3), 16);
            let G = parseInt(color.substring(3,5), 16);
            let B = parseInt(color.substring(5,7), 16);
            
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
        
        // =========================================
        // 6. Theme Mode
        // =========================================
        function applyThemeMode() {
            const themeMode = appearance.themeMode || 'dark';
            let actualTheme = themeMode;
            
            if (themeMode === 'system') {
                actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            
            document.documentElement.setAttribute('data-theme', actualTheme);
            document.documentElement.setAttribute('data-theme-mode', themeMode);
        }
        
        applyThemeMode();
        
        // =========================================
        // 7. Font Family
        // =========================================
        function loadGoogleFont(fontName) {
            const fontId = 'google-font-' + fontName.replace(/\s+/g, '-').toLowerCase();
            if (document.getElementById(fontId)) return;
            
            const link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
            document.head.appendChild(link);
        }
        
        if (appearance.fontFamily) {
            const fontName = appearance.fontFamily;
            loadGoogleFont(fontName);
            
            document.body.style.fontFamily = `'${fontName}', 'Poppins', sans-serif`;
            
            let styleTag = document.getElementById('dynamic-font-style');
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'dynamic-font-style';
                document.head.appendChild(styleTag);
            }
            styleTag.textContent = `
                body, h1, h2, h3, h4, h5, h6, p, a, button, input, select, textarea, div {
                    font-family: '${fontName}', 'Poppins', sans-serif !important;
                }
                /* ⚠️ فونت‌های Script رو دست نزن */
                .footer-tagline, .footer-tagline span,
                .sidebar-tagline, .sidebar-tagline span,
                .signature-name {
                    font-family: 'Brush Script MT', cursive !important;
                    font-style: italic;
                }
            `;
        }
        
        // =========================================
        // 8. Button Style
        // =========================================
        let buttonStyleValue = 'rounded';
        if (appearance.buttonStyle) {
            buttonStyleValue = appearance.buttonStyle.toLowerCase().trim();
            // اطمینان از مقدار معتبر
            if (!['rounded', 'square', 'pill'].includes(buttonStyleValue)) {
                buttonStyleValue = 'rounded';
            }
        }
        document.documentElement.setAttribute('data-button-style', buttonStyleValue);
        
        // =========================================
        // 9. Header Style
        // =========================================
        let headerStyleValue = 'modern';
        if (appearance.headerStyle) {
            if (appearance.headerStyle.includes('Solid')) headerStyleValue = 'solid';
            else if (appearance.headerStyle.includes('Minimal')) headerStyleValue = 'minimal';
            else if (appearance.headerStyle.includes('Modern')) headerStyleValue = 'modern';
        }
        document.documentElement.setAttribute('data-header-style', headerStyleValue);
        
        // =========================================
        // 10. Custom CSS
        // =========================================
        if (appearance.customCSS && appearance.customCSS.trim() !== '') {
            let styleTag = document.getElementById('custom-user-css');
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'custom-user-css';
                document.head.appendChild(styleTag);
            }
            styleTag.textContent = appearance.customCSS;
        }
        
        // =========================================
        // 11. Custom JS
        // =========================================
        if (appearance.customJS && appearance.customJS.trim() !== '') {
            try {
                if (!document.getElementById('custom-user-js')) {
                    const script = document.createElement('script');
                    script.id = 'custom-user-js';
                    script.textContent = appearance.customJS;
                    document.body.appendChild(script);
                }
            } catch (e) { console.warn('Custom JS Error:', e); }
        }
        
        // =========================================
        // 12. E-commerce Currency Helpers
        // =========================================
        window.formatPrice = function(price) {
            if (!price && price !== 0) return 'Custom Quote';
            
            const symbol = ecommerce.currencySymbol || '$';
            const decimals = parseInt(ecommerce.decimalPlaces) || 2;
            const format = ecommerce.priceFormat || '$1,234.56';
            
            let numPrice = parseFloat(price);
            if (isNaN(numPrice)) return price;
            
            let formattedNum = numPrice.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            
            if (format === '1,234.56$') return formattedNum + symbol;
            if (format === '$ 1,234.56') return symbol + ' ' + formattedNum;
            return symbol + formattedNum;
        };
        
        // =========================================
        // 12.5. Global Date Formatter
        // =========================================
        window.formatDateGlobal = function(dateStr) {
            if (!dateStr) return 'N/A';
            
            let dateFormat = 'F j, Y';
            const dateFormatSetting = general.siteDateFormat || '';
            if (dateFormatSetting) dateFormat = dateFormatSetting;
            
            // تبدیل رشته به Date
            let date;
            if (dateStr instanceof Date) {
                date = dateStr;
            } else {
                // پشتیبانی از فرمت MySQL: YYYY-MM-DD HH:MM:SS
                try {
                    date = new Date(dateStr.replace(' ', 'T'));
                    if (isNaN(date.getTime())) {
                        return dateStr; // اگه نامعتبر بود، همون رشته رو برگردون
                    }
                } catch (e) {
                    return dateStr;
                }
            }
            
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            
            const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            
            switch (dateFormat) {
                case 'Y-m-d': 
                    return `${year}-${month}-${day}`;
                case 'd/m/Y': 
                    return `${day}/${month}/${year}`;
                case 'm/d/Y': 
                    return `${month}/${day}/${year}`;
                case 'F j, Y':
                default: 
                    return `${fullMonthNames[date.getMonth()]} ${date.getDate()}, ${year}`;
            }
        };

        // نسخه با زمان (برای Orders, Messages)
        window.formatDateTimeGlobal = function(dateStr) {
            if (!dateStr) return 'N/A';
            
            let date;
            try {
                date = new Date(dateStr.replace(' ', 'T'));
                if (isNaN(date.getTime())) return dateStr;
            } catch (e) {
                return dateStr;
            }
            
            const dateFormatted = window.formatDateGlobal(date);
            
            // اضافه کردن زمان
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            return `${dateFormatted} - ${hours}:${minutes}`;
        };
        
        window.calculatePriceWithTax = function(price) {
            const taxRate = parseFloat(ecommerce.taxRate) || 0;
            let numPrice = parseFloat(price) || 0;
            
            if (taxRate > 0) {
                numPrice = numPrice + (numPrice * taxRate / 100);
            }
            
            return numPrice;
        };
        
        window.formatFinalPrice = function(price) {
            const priceWithTax = window.calculatePriceWithTax(price);
            return window.formatPrice(priceWithTax);
        };
        
        // =========================================
        // 13. SEO - Google Analytics
        // =========================================
        const gaId = seo.googleAnalyticsId || '';
        if (gaId && gaId !== 'G-XXXXXXXXXX' && !document.getElementById('ga-script')) {
            const gaScript = document.createElement('script');
            gaScript.id = 'ga-script';
            gaScript.async = true;
            gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
            document.head.appendChild(gaScript);
            
            const gaConfig = document.createElement('script');
            gaConfig.id = 'ga-config';
            gaConfig.textContent = `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
            `;
            document.head.appendChild(gaConfig);
        }
    }
    
    /**
     * Maintenance Mode
     */
    function applyMaintenanceMode(maintenance) {
        // اگه توی صفحه login هستیم، خارج شو
        if (window.location.pathname.includes('login.html')) return;
        
        // چک لاگین
        const isLoggedIn = sessionStorage.getItem('akbariLoggedIn') === 'true';
        if (isLoggedIn) return;
        
        const message = maintenance.message || 'We are currently performing scheduled maintenance. Please check back soon.';
        
        const maintenanceHTML = `
            <div id="maintenance-overlay" style="
                position: fixed;
                top: 0; left: 0;
                width: 100vw; height: 100vh;
                background: linear-gradient(135deg, #0A1128, #060C1A);
                color: white;
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999999;
                font-family: 'Poppins', sans-serif;
                padding: 20px;
            ">
                <div style="text-align: center; max-width: 500px;">
                    <div style="
                        width: 100px; height: 100px;
                        background: rgba(245, 158, 11, 0.15);
                        border-radius: 50%;
                        display: flex; justify-content: center; align-items: center;
                        margin: 0 auto 30px;
                        border: 3px solid rgba(245, 158, 11, 0.3);
                    ">
                        <i class="fas fa-tools" style="font-size: 45px; color: #F59E0B;"></i>
                    </div>
                    <h1 style="font-size: 32px; font-weight: 700; margin-bottom: 15px;">Under Maintenance</h1>
                    <p style="font-size: 15px; color: #A0AEC0; line-height: 1.7; margin-bottom: 30px;">
                        ${message}
                    </p>
                    <a href="login.html" style="
                        display: inline-flex; align-items: center; gap: 10px;
                        background-color: #00A8FF; color: white;
                        padding: 14px 28px; border-radius: 10px;
                        font-size: 14px; font-weight: 600;
                        text-decoration: none;
                    ">
                        <i class="fas fa-sign-in-alt"></i> Admin Login
                    </a>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', maintenanceHTML);
        document.body.style.overflow = 'hidden';
    }
    
    // =========================================
    // اجرا
    // =========================================
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        checkMaintenanceFromAPI();
        applySettings();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            checkMaintenanceFromAPI();
            applySettings();
        });
    }

    
    // دوباره بعد از لود کامل
    window.addEventListener('load', () => {
        setTimeout(applySettings, 300);
    });
    
})();