/**
 * AKBARI SOLUTION — GLOBAL CONFIG
 * ⚠️ فقط این فایل رو برای محیط‌های مختلف عوض کن
 */

(function() {
    // ⚠️ تشخیص خودکار محیط
    const host = window.location.hostname;
    
    let env = 'production';
    
    if (host === 'localhost' || host === '127.0.0.1') {
        env = 'localhost';
    }
    
    const CONFIGS = {
        localhost: {
            API_BASE: 'http://localhost/Akbari-Solution/api/v1',
            SITE_URL: 'http://localhost/Akbari-Solution',
            UPLOADS_URL: 'http://localhost/Akbari-Solution/uploads',
            ENV: 'localhost'
        },
        production: {
            API_BASE: 'https://' + host + '/api/v1',
            SITE_URL: 'https://' + host,
            UPLOADS_URL: 'https://' + host + '/uploads',
            ENV: 'production'
        }
    };
    
    window.APP_CONFIG = CONFIGS[env];
    window.API_BASE = CONFIGS[env].API_BASE;
    window.SITE_URL = CONFIGS[env].SITE_URL;
    window.UPLOADS_URL = CONFIGS[env].UPLOADS_URL;
    
    console.log('✅ Config loaded — ENV:', env, '| API:', window.API_BASE);
})();