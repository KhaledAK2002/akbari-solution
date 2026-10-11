/* =========================================
   ACCOUNT SETTINGS - API-Based
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    
    console.log('=== account-settings.js STARTED ===');
    
    const passwordForm = document.getElementById('passwordForm');
    if (!passwordForm) {
        console.log('❌ Not on account-settings page');
        return;
    }
    
    console.log('✅ account-settings page found');
    
    // =========================================
    // TABS SWITCHING
    // =========================================
    const tabBtns = document.querySelectorAll('.settings-tab-btn');
    const tabPanels = document.querySelectorAll('.settings-tab-panel');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            tabPanels.forEach(p => p.classList.remove('active'));
            const targetPanel = document.getElementById('tab-' + targetTab);
            if (targetPanel) targetPanel.classList.add('active');
            
            window.location.hash = targetTab;
        });
    });
    
    const hash = window.location.hash.replace('#', '');
    if (hash === 'password' || hash === 'notifications') {
        const targetBtn = document.querySelector(`.settings-tab-btn[data-tab="${hash}"]`);
        if (targetBtn) targetBtn.click();
    }
    
    // =========================================
    // PASSWORD SHOW/HIDE
    // =========================================
    document.querySelectorAll('.toggle-pw').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
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
    
    // =========================================
    // PASSWORD STRENGTH CHECKER
    // =========================================
    const newPasswordInput = document.getElementById('newPassword');
    const strengthBars = document.querySelectorAll('#passwordStrength .strength-bar');
    const strengthText = document.querySelector('#passwordStrength .strength-text');
    
    function checkPasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        return strength;
    }
    
    function updateStrengthUI(strength) {
        strengthBars.forEach(bar => {
            bar.classList.remove('weak', 'medium', 'strong');
        });
        
        if (strength === 0) {
            strengthText.textContent = 'Password strength';
            strengthText.style.color = '#A0AEC0';
        } else if (strength === 1) {
            strengthBars[0].classList.add('weak');
            strengthText.textContent = 'Weak';
            strengthText.style.color = '#EF4444';
        } else if (strength === 2) {
            strengthBars[0].classList.add('medium');
            strengthBars[1].classList.add('medium');
            strengthText.textContent = 'Fair';
            strengthText.style.color = '#F59E0B';
        } else if (strength === 3) {
            strengthBars[0].classList.add('strong');
            strengthBars[1].classList.add('strong');
            strengthBars[2].classList.add('strong');
            strengthText.textContent = 'Good';
            strengthText.style.color = '#10B981';
        } else if (strength === 4) {
            strengthBars.forEach(bar => bar.classList.add('strong'));
            strengthText.textContent = 'Strong';
            strengthText.style.color = '#10B981';
        }
    }
    
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', (e) => {
            const strength = checkPasswordStrength(e.target.value);
            updateStrengthUI(strength);
        });
    }
    
    // =========================================
    // PASSWORD MATCH CHECKER
    // =========================================
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordMatchMsg = document.getElementById('passwordMatchMsg');
    
    function checkPasswordMatch() {
        const newPw = newPasswordInput.value;
        const confirmPw = confirmPasswordInput.value;
        
        if (!confirmPw) {
            passwordMatchMsg.textContent = '';
            passwordMatchMsg.className = 'password-match-msg';
            return false;
        }
        
        if (newPw === confirmPw) {
            passwordMatchMsg.textContent = '✓ Passwords match';
            passwordMatchMsg.className = 'password-match-msg success';
            return true;
        } else {
            passwordMatchMsg.textContent = '✗ Passwords do not match';
            passwordMatchMsg.className = 'password-match-msg error';
            return false;
        }
    }
    
    if (confirmPasswordInput && newPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
        newPasswordInput.addEventListener('input', checkPasswordMatch);
    }
    
    // =========================================
    // SUBMIT PASSWORD FORM (API-Based)
    // =========================================
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPw = document.getElementById('currentPassword').value;
        const newPw = document.getElementById('newPassword').value;
        const confirmPw = document.getElementById('confirmPassword').value;
        
        if (!currentPw || !newPw || !confirmPw) {
            alert('⚠️ Please fill in all fields.');
            return;
        }
        
        if (newPw.length < 6) {
            alert('⚠️ New password must be at least 6 characters.');
            return;
        }
        
        if (newPw !== confirmPw) {
            alert('⚠️ New passwords do not match.');
            return;
        }
        
        if (newPw === currentPw) {
            alert('⚠️ New password must be different from current password.');
            return;
        }
        
        // ارسال به API
        try {
            const response = await API.post('/auth/change-password', {
                current_password: currentPw,
                new_password: newPw
            });
            
            if (response.success) {
                passwordForm.reset();
                updateStrengthUI(0);
                passwordMatchMsg.textContent = '';
                passwordMatchMsg.className = 'password-match-msg';
                
                if (window.logActivity && typeof window.logActivity === 'function') {
                    window.logActivity('update', 'Changed account password', 'warning');
                }
                
                showToast('Password updated successfully!', 'success');
            } else {
                alert('⚠️ ' + (response.message || 'Failed to change password'));
            }
        } catch (err) {
            console.error('Password change error:', err);
            alert('⚠️ Network error. Please try again.');
        }
    });
    
    // =========================================
    // NOTIFICATIONS - LOAD FROM LOCALSTORAGE
    // =========================================
    function loadNotifications() {
        try {
            const notifSettings = JSON.parse(localStorage.getItem('akbariNotifications') || '{}');
            
            const notifEmail = document.getElementById('notifEmail');
            const notifOrder = document.getElementById('notifOrder');
            const notifProduct = document.getElementById('notifProduct');
            const notifSystem = document.getElementById('notifSystem');
            const notifMarketing = document.getElementById('notifMarketing');
            
            if (notifEmail) notifEmail.checked = notifSettings.email !== false;
            if (notifOrder) notifOrder.checked = notifSettings.order !== false;
            if (notifProduct) notifProduct.checked = notifSettings.product === true;
            if (notifSystem) notifSystem.checked = notifSettings.system !== false;
            if (notifMarketing) notifMarketing.checked = notifSettings.marketing === true;
        } catch (e) {
            console.error('Failed to load notifications:', e);
        }
    }
    
    // =========================================
    // NOTIFICATIONS - SAVE
    // =========================================
    const saveNotificationsBtn = document.getElementById('saveNotificationsBtn');
    if (saveNotificationsBtn) {
        saveNotificationsBtn.addEventListener('click', () => {
            const settings = {
                email: document.getElementById('notifEmail')?.checked || false,
                order: document.getElementById('notifOrder')?.checked || false,
                product: document.getElementById('notifProduct')?.checked || false,
                system: document.getElementById('notifSystem')?.checked || false,
                marketing: document.getElementById('notifMarketing')?.checked || false
            };
            
            localStorage.setItem('akbariNotifications', JSON.stringify(settings));
            
            if (window.logActivity && typeof window.logActivity === 'function') {
                window.logActivity('update', 'Updated notification preferences', 'info');
            }
            
            showToast('Notification preferences saved!', 'success');
        });
    }
    
    // =========================================
    // TOAST NOTIFICATION
    // =========================================
    function showToast(message, type = 'success') {
        const colors = {
            success: { bg: '#10B981', shadow: 'rgba(16, 185, 129, 0.4)', icon: 'fa-check-circle' },
            error: { bg: '#EF4444', shadow: 'rgba(239, 68, 68, 0.4)', icon: 'fa-exclamation-circle' },
            warning: { bg: '#F59E0B', shadow: 'rgba(245, 158, 11, 0.4)', icon: 'fa-exclamation-triangle' }
        };
        
        const c = colors[type] || colors.success;
        
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;top:30px;right:30px;background-color:' + c.bg + ';color:white;padding:16px 24px;border-radius:12px;font-size:14px;font-weight:500;font-family:Poppins,sans-serif;display:flex;align-items:center;gap:10px;box-shadow:0 10px 30px ' + c.shadow + ';z-index:9999;transform:translateX(400px);transition:transform 0.4s ease;';
        toast.innerHTML = '<i class="fas ' + c.icon + '" style="font-size:20px;"></i><span>' + message + '</span>';
        document.body.appendChild(toast);
        
        setTimeout(() => toast.style.transform = 'translateX(0)', 10);
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }
    
    // =========================================
    // اجرای اولیه
    // =========================================
    loadNotifications();
    
    console.log('=== account-settings.js DONE ===');
});