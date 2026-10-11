/**
 * Login Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.querySelector('.login-form');
    if (!loginForm) return;

    const emailInput = loginForm.querySelector('input[type="email"]');
    const passwordInput = loginForm.querySelector('input[type="password"]');
    const submitBtn = loginForm.querySelector('.btn-login');

    // اگه قبلاً لاگین کرده، مستقیم بره dashboard
    if (window.Auth && Auth.isLoggedIn()) {
        window.location.replace('dashboard.html');
        return;
    }

    // حذف اکشن فرم
    loginForm.setAttribute('action', 'javascript:void(0);');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showError('Please enter email and password');
            return;
        }

        // دکمه رو غیرفعال کن
        const originalBtnHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        submitBtn.disabled = true;

        try {
            const API_BASE = window.API_BASE || 'http://localhost/Akbari-Solution/api/v1';
            const response = await fetch(API_BASE + '/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success && data.data && data.data.token) {
                // ⚠️ تبدیل role به فرمت Display
                const user = data.data.user;
                const roleMap = {
                    'super_admin': 'Super Administrator',
                    'admin': 'Administrator',
                    'employee': 'Employee'
                };
                if (roleMap[user.role]) user.role = roleMap[user.role];

                Auth.save(data.data.token, user);
                
                // ⚠️ Set flag برای رد کردن Maintenance
                sessionStorage.setItem('akbariLoggedIn', 'true');
                sessionStorage.setItem('akbari_token', data.data.token);
                sessionStorage.setItem('akbari_user', JSON.stringify(user));
                
                showSuccess('Login successful! Redirecting...');

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 800);
            } else {
                showError(data.message || 'Invalid email or password');
                submitBtn.innerHTML = originalBtnHTML;
                submitBtn.disabled = false;
                passwordInput.value = '';
                passwordInput.focus();
            }
        } catch (err) {
            console.error('Login error:', err);
            showError('Cannot connect to server. Please try again.');
            submitBtn.innerHTML = originalBtnHTML;
            submitBtn.disabled = false;
        }
    });

    function showError(message) {
        let errorBox = document.querySelector('.login-error-msg');
        
        if (!errorBox) {
            errorBox = document.createElement('div');
            errorBox.className = 'login-error-msg';
            errorBox.style.cssText = `
                background-color: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: #EF4444;
                padding: 12px 15px;
                border-radius: 8px;
                font-size: 13px;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            loginForm.insertBefore(errorBox, loginForm.firstChild);
        }
        
        errorBox.innerHTML = `<i class="fas fa-exclamation-circle"></i> <span>${message}</span>`;
        errorBox.style.display = 'flex';

        clearTimeout(errorBox._timer);
        errorBox._timer = setTimeout(() => {
            errorBox.style.display = 'none';
        }, 5000);
    }

    function showSuccess(message) {
        let successBox = document.querySelector('.login-success-msg');
        
        if (!successBox) {
            successBox = document.createElement('div');
            successBox.className = 'login-success-msg';
            successBox.style.cssText = `
                background-color: rgba(16, 185, 129, 0.1);
                border: 1px solid rgba(16, 185, 129, 0.3);
                color: #10B981;
                padding: 12px 15px;
                border-radius: 8px;
                font-size: 13px;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            loginForm.insertBefore(successBox, loginForm.firstChild);
        }
        
        successBox.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
        successBox.style.display = 'flex';
    }
});