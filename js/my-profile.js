/* =========================================
   MY PROFILE - API-Based
   ========================================= */

document.addEventListener('DOMContentLoaded', async () => {
    
    console.log('=== my-profile.js STARTED ===');
    
    const profileForm = document.getElementById('profileForm');
    if (!profileForm) {
        console.log('❌ profileForm not found - not on my-profile page');
        return;
    }
    
    console.log('✅ profileForm found');
    console.log('Auth:', typeof Auth);
    console.log('API:', typeof API);
    
    let currentUser = null;
    
    // =========================================
    // Helper: parse phone
    // =========================================
    function parsePhone(phoneStr) {
        if (!phoneStr) return { code: '+93', number: '' };
        
        const codes = ['+971', '+93', '+92', '+98', '+44', '+1'];
        for (const code of codes) {
            if (phoneStr.startsWith(code)) {
                return {
                    code: code,
                    number: phoneStr.substring(code.length).trim()
                };
            }
        }
        return { code: '+93', number: phoneStr.replace(/^\+\d+\s*/, '') };
    }
    
    // =========================================
    // Helper: update flag
    // =========================================
    function updateFlag(code) {
        const flagImg = document.getElementById('selectedFlag');
        if (!flagImg) return;
        
        const codeToFlag = {
            '+93': 'af',
            '+92': 'pk',
            '+98': 'ir',
            '+1': 'us',
            '+44': 'gb',
            '+971': 'ae'
        };
        
        const flagCode = codeToFlag[code] || 'af';
        flagImg.src = 'https://flagcdn.com/w20/' + flagCode + '.png';
        flagImg.alt = flagCode.toUpperCase();
    }
    
    // =========================================
    // Helper: translate role
    // =========================================
    function translateRole(role) {
        if (role === 'super_admin') return 'Super Administrator';
        if (role === 'admin') return 'Administrator';
        if (role === 'employee') return 'Employee';
        return role || 'Administrator';
    }
    
    // =========================================
    // Update UI
    // =========================================
    function updateUI(user) {
        if (!user) return;
        
        const roleText = translateRole(user.role);
        
        // ⚠️ تعیین آواتار نهایی
        let avatarSrc = user.avatar;
        
        // اگه avatar خالی بود یا Base64 بزرگ، از fallback استفاده کن
        if (!avatarSrc || avatarSrc.trim() === '' || avatarSrc.length > 2000) {
            avatarSrc = null;
        }
        
        // تابع ست کردن آواتار با fallback
        function setAvatar(imgElement, user) {
            if (!imgElement) return;
            
            // اگه avatarSrc معتبر هست
            if (avatarSrc) {
                imgElement.src = avatarSrc;
                imgElement.style.display = '';
                imgElement.onerror = function() {
                    // اگه عکس لود نشد، حرف اول رو نشون بده
                    this.style.display = 'none';
                    const parent = this.parentElement;
                    if (parent && !parent.querySelector('.avatar-fallback')) {
                        const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                        const fallback = document.createElement('div');
                        fallback.className = 'avatar-fallback';
                        fallback.textContent = initials;
                        fallback.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#00A8FF,#0084CC);color:white;font-weight:700;font-size:16px;border-radius:50%;';
                        parent.insertBefore(fallback, this);
                    }
                };
            } else {
                // اگه avatar نبود، فقط حرف اول رو نشون بده
                imgElement.style.display = 'none';
                const parent = imgElement.parentElement;
                if (parent && !parent.querySelector('.avatar-fallback')) {
                    const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    const fallback = document.createElement('div');
                    fallback.className = 'avatar-fallback';
                    fallback.textContent = initials;
                    fallback.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#00A8FF,#0084CC);color:white;font-weight:700;font-size:16px;border-radius:50%;';
                    parent.insertBefore(fallback, imgElement);
                }
            }
        }
        
        // Topbar
        const topbarName = document.getElementById('topbarUserName');
        const topbarRole = document.getElementById('topbarUserRole');
        const topbarAvatar = document.getElementById('topbarAvatar');
        
        if (topbarName) topbarName.textContent = user.name || 'User';
        if (topbarRole) topbarRole.textContent = roleText;
        if (topbarAvatar) setAvatar(topbarAvatar, user);
        
        // Profile Card
        const avatar = document.getElementById('profileAvatar');
        const name = document.getElementById('profileCardName');
        const role = document.getElementById('profileCardRole');
        const email = document.getElementById('profileCardEmail');
        const phone = document.getElementById('profileCardPhone');
        const location = document.getElementById('profileCardLocation');
        
        if (avatar) setAvatar(avatar, user);
        if (name) name.textContent = user.name || 'User';
        if (role) role.textContent = roleText;
        if (email) email.textContent = user.email || '—';
        if (phone) phone.textContent = user.phone || '—';
        if (location) location.textContent = user.location || '—';
    }
    
    // =========================================
    // Fill Form
    // =========================================
    function fillForm(user) {
        if (!user) return;
        
        const roleText = translateRole(user.role);
        
        const fullNameEl = document.getElementById('fullName');
        const emailEl = document.getElementById('email');
        const locationEl = document.getElementById('location');
        const roleEl = document.getElementById('role');
        
        if (fullNameEl) fullNameEl.value = user.name || '';
        if (emailEl) emailEl.value = user.email || '';
        if (locationEl) locationEl.value = user.location || '';
        if (roleEl) roleEl.innerHTML = '<option>' + roleText + '</option>';
        
        const phoneParts = parsePhone(user.phone);
        const countryCodeSelect = document.getElementById('countryCode');
        if (countryCodeSelect) countryCodeSelect.value = phoneParts.code;
        
        const phoneEl = document.getElementById('phone');
        if (phoneEl) phoneEl.value = phoneParts.number;
        
        updateFlag(phoneParts.code);
    }
    
    // =========================================
    // Load Profile
    // =========================================
    async function loadProfile() {
        console.log('🔄 Loading profile...');
        
        // مرحله ۱: از Auth cache
        try {
            if (window.Auth && typeof Auth.getUser === 'function') {
                const authUser = Auth.getUser();
                console.log('Auth user:', authUser);
                
                if (authUser) {
                    currentUser = authUser;
                    updateUI(authUser);
                    fillForm(authUser);
                    console.log('✅ Loaded from Auth cache');
                }
            }
        } catch (e) {
            console.error('Auth getUser error:', e);
        }
        
        // مرحله ۲: از API
        try {
            if (typeof API !== 'undefined') {
                console.log('🔄 Fetching from API...');
                const response = await API.get('/auth/me');
                console.log('API response:', response);
                
                if (response.success && response.data) {
                    currentUser = response.data;
                    
                    if (window.Auth && typeof Auth.save === 'function') {
                        const token = Auth.getToken();
                        if (token) Auth.save(token, currentUser);
                    }
                    
                    updateUI(currentUser);
                    fillForm(currentUser);
                    console.log('✅ Loaded from API');
                    return;
                }
            }
        } catch (e) {
            console.error('API error:', e);
        }
        
        // اگه هیچکدوم کار نکرد
        if (!currentUser) {
            console.error('❌ No user found from Auth or API');
            alert('⚠️ No user found. Please login again.');
            window.location.href = 'login.html';
        }
    }
    
    // =========================================
    // Country Code Change
    // =========================================
    const countryCodeSelect = document.getElementById('countryCode');
    if (countryCodeSelect) {
        countryCodeSelect.addEventListener('change', (e) => {
            updateFlag(e.target.value);
        });
    }
    
    // =========================================
    // Avatar Upload
    // =========================================
    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            if (file.size > 2 * 1024 * 1024) {
                alert('⚠️ Image is too large (max 2MB).');
                avatarInput.value = '';
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                alert('⚠️ Please select a valid image file.');
                avatarInput.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('profileAvatar').src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
    
    // =========================================
    // Save Profile
    // =========================================
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            alert('⚠️ User not loaded. Please refresh the page.');
            return;
        }
        
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const location = document.getElementById('location').value.trim();
        const countryCode = document.getElementById('countryCode').value;
        const phoneNumber = document.getElementById('phone').value.trim();
        
        if (!fullName || !email) {
            alert('⚠️ Please fill in all required fields (Full Name, Email).');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('⚠️ Please enter a valid email address.');
            return;
        }
        
        const fullPhone = phoneNumber ? (countryCode + ' ' + phoneNumber) : '';
        const currentAvatar = document.getElementById('profileAvatar').src;
        
        const saveBtn = document.getElementById('saveBtn');
        const originalHTML = saveBtn ? saveBtn.innerHTML : '';
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            saveBtn.disabled = true;
        }
        
        try {
            const response = await API.put('/users/' + currentUser.id, {
                name: fullName,
                email: email,
                phone: fullPhone,
                location: location,
                avatar: currentAvatar
            });
            
            if (response.success) {
                if (window.Auth && typeof Auth.save === 'function') {
                    const token = Auth.getToken();
                    if (token) Auth.save(token, response.data);
                }
                
                currentUser = response.data;
                updateUI(currentUser);
                
                if (window.logActivity && typeof window.logActivity === 'function') {
                    window.logActivity('update', 'Updated profile: ' + fullName, 'info');
                }
                
                showSuccessMessage();
            } else {
                alert('⚠️ ' + (response.message || 'Failed to update profile'));
            }
        } catch (err) {
            console.error('Update error:', err);
            alert('⚠️ Network error. Please try again.');
        } finally {
            if (saveBtn) {
                saveBtn.innerHTML = originalHTML;
                saveBtn.disabled = false;
            }
        }
    });
    
    // =========================================
    // Cancel Button
    // =========================================
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Discard unsaved changes?')) {
                if (currentUser) fillForm(currentUser);
            }
        });
    }
    
    // =========================================
    // Success Toast
    // =========================================
    function showSuccessMessage() {
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;top:30px;right:30px;background-color:#10B981;color:white;padding:16px 24px;border-radius:12px;font-size:14px;font-weight:500;font-family:Poppins,sans-serif;display:flex;align-items:center;gap:10px;box-shadow:0 10px 30px rgba(16,185,129,0.4);z-index:9999;transform:translateX(400px);transition:transform 0.4s ease;';
        toast.innerHTML = '<i class="fas fa-check-circle" style="font-size:20px;"></i><span>Profile updated successfully!</span>';
        document.body.appendChild(toast);
        
        setTimeout(() => toast.style.transform = 'translateX(0)', 10);
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }
    
    // =========================================
    // Run
    // =========================================
    await loadProfile();
    
    console.log('=== my-profile.js DONE ===');
});