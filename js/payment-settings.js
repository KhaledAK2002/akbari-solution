document.addEventListener('DOMContentLoaded', async () => {
    
    // =========================================
    // اطلاعات پیش‌فرض هر Payment Method
    // =========================================
    const PAYMENT_METHODS = {
        'hesabpay': {
            name: 'HesabPay',
            logo: 'assets/images/bank-hesabpay.png',
            defaultAccountName: 'Mohammad Khalid Akbari',
            defaultAccountNumber: '+93 782 311 365',
            defaultCurrency: 'AFN'
        },
        'mymoney': {
            name: 'My Money',
            logo: 'assets/images/bank-mymoney.png',
            defaultAccountName: 'MOHAMMAD KHALID AKBARI',
            defaultAccountNumber: '0016-0100-1483-1',
            defaultCurrency: 'AFN'
        },
        'microfinance': {
            name: 'The First MicroFinanceBank',
            logo: 'assets/images/bank-microfinance.png',
            defaultAccountName: 'Mohammad Khalid Akbari',
            defaultAccountNumber: '021001020009834',
            defaultCurrency: 'AFN'
        },
        'westernunion': {
            name: 'Western Union',
            logo: 'assets/images/bank-westernunion.png',
            defaultAccountName: 'Mohammad Khalid Akbari',
            defaultAccountNumber: 'N/A',
            defaultCurrency: 'USD'
        },
        'moneygram': {
            name: 'MoneyGram',
            logo: 'assets/images/bank-moneygram.png',
            defaultAccountName: 'Mohammad Khalid Akbari',
            defaultAccountNumber: 'N/A',
            defaultCurrency: 'USD'
        },
        'paypal': {
            name: 'PayPal',
            logo: 'assets/images/bank-paypal.png',
            defaultAccountName: 'Mohammad Khalid Akbari',
            defaultAccountNumber: 'khalid@paypal.com',
            defaultCurrency: 'USD'
        }
    };
    
    // =========================================
    // گرفتن Payment Method از URL
    // =========================================
    const urlParams = new URLSearchParams(window.location.search);
    const methodKey = urlParams.get('method') || 'hesabpay';
    const methodInfo = PAYMENT_METHODS[methodKey];
    
    if (!methodInfo) {
        alert('Invalid payment method!');
        window.location.href = 'website-settings.html';
        return;
    }
    
    // آپدیت عنوان صفحه
    document.getElementById('pageTitle').textContent = methodInfo.name + ' Payment Settings';
    document.getElementById('pageDesc').textContent = 'Configure ' + methodInfo.name + ' payment method for your customers.';
    document.getElementById('breadcrumbMethod').textContent = methodInfo.name + ' Settings';
    document.title = methodInfo.name + ' Settings - Akbari Solution';
    
    // آپدیت preview
    document.getElementById('pmPreviewName').textContent = methodInfo.name;
    document.getElementById('pmPreviewName2').textContent = methodInfo.name;
    
    // =========================================
    // متغیرهای داخلی
    // =========================================
    let currentMethodData = null; // اطلاعات از API
    let pendingLogo = null;
    let pendingQR = null;
    
    // =========================================
    // بارگذاری تنظیمات از API
    // =========================================
    async function loadPaymentSettings() {
        // لودینگ
        try {
            const response = await API.get('/payment-methods/key/' + methodKey);
            
            if (response.success && response.data) {
                currentMethodData = response.data;
                
                // پر کردن فیلدها
                document.getElementById('pmAccountName').value = currentMethodData.account_name || methodInfo.defaultAccountName;
                document.getElementById('pmAccountNumber').value = currentMethodData.account_number || methodInfo.defaultAccountNumber;
                document.getElementById('pmAccountType').value = currentMethodData.account_type || 'Personal';
                document.getElementById('pmCurrency').value = currentMethodData.currency || methodInfo.defaultCurrency;
                document.getElementById('pmInstructions').value = currentMethodData.instructions || '';
                document.getElementById('pmOrderEmail').value = currentMethodData.order_email || 'orders@akbarisolution.com';
                document.getElementById('pmSendEmailNotification').checked = currentMethodData.send_email_notification === 1;
                document.getElementById('pmShowOnCheckout').checked = currentMethodData.show_on_checkout !== 0;
                document.getElementById('pmSetAsDefault').checked = currentMethodData.is_default === 1;
                
                // Logo
                if (currentMethodData.logo) {
                    document.getElementById('pmLogoPreview').src = currentMethodData.logo;
                    document.getElementById('pmPreviewLogo').src = currentMethodData.logo;
                } else {
                    document.getElementById('pmLogoPreview').src = methodInfo.logo;
                    document.getElementById('pmPreviewLogo').src = methodInfo.logo;
                }
                
                // QR Code
                if (currentMethodData.qr_code) {
                    document.getElementById('pmQrPreview').src = currentMethodData.qr_code;
                    document.getElementById('pmQrPreview').style.display = 'block';
                    document.getElementById('pmQrEmpty').style.display = 'none';
                }
            } else {
                // تنظیمات پیش‌فرض (اگه توی دیتابیس نبود)
                document.getElementById('pmAccountName').value = methodInfo.defaultAccountName;
                document.getElementById('pmAccountNumber').value = methodInfo.defaultAccountNumber;
                document.getElementById('pmCurrency').value = methodInfo.defaultCurrency;
                document.getElementById('pmLogoPreview').src = methodInfo.logo;
                document.getElementById('pmPreviewLogo').src = methodInfo.logo;
            }
            
            updatePreviewInstructions();
            
        } catch (e) {
            console.error('Failed to load payment settings:', e);
            // fallback به پیش‌فرض
            document.getElementById('pmAccountName').value = methodInfo.defaultAccountName;
            document.getElementById('pmAccountNumber').value = methodInfo.defaultAccountNumber;
            document.getElementById('pmLogoPreview').src = methodInfo.logo;
            document.getElementById('pmPreviewLogo').src = methodInfo.logo;
        }
    }
    
    // =========================================
    // آپدیت Preview
    // =========================================
    function updatePreviewInstructions() {
        const instructions = document.getElementById('pmInstructions').value.trim();
        const previewEl = document.getElementById('pmPreviewInstructions');
        previewEl.textContent = instructions || 'Payment instructions will appear here...';
    }
    
    document.getElementById('pmInstructions').addEventListener('input', updatePreviewInstructions);
    
    // =========================================
    // Logo Upload
    // =========================================
    document.getElementById('pmLogoInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 2 * 1024 * 1024) {
            alert('⚠️ Image is too large (max 2MB).');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('pmLogoPreview').src = event.target.result;
            document.getElementById('pmPreviewLogo').src = event.target.result;
            pendingLogo = event.target.result;
        };
        reader.readAsDataURL(file);
    });
    
    window.removePMLogo = function() {
        if (!confirm('Remove logo?')) return;
        document.getElementById('pmLogoPreview').src = methodInfo.logo;
        document.getElementById('pmPreviewLogo').src = methodInfo.logo;
        pendingLogo = null;
    };
    
    // =========================================
    // QR Code Upload
    // =========================================
    document.getElementById('pmQrInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 1 * 1024 * 1024) {
            alert('⚠️ QR Code is too large (max 1MB).');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('pmQrPreview').src = event.target.result;
            document.getElementById('pmQrPreview').style.display = 'block';
            document.getElementById('pmQrEmpty').style.display = 'none';
            pendingQR = event.target.result;
        };
        reader.readAsDataURL(file);
    });
    
    window.removePMQR = function() {
        if (!confirm('Remove QR Code?')) return;
        document.getElementById('pmQrPreview').src = '';
        document.getElementById('pmQrPreview').style.display = 'none';
        document.getElementById('pmQrEmpty').style.display = 'flex';
        pendingQR = null;
    };
    
    // =========================================
    // ذخیره تنظیمات (API)
    // =========================================
    window.savePaymentSettings = async function() {
        console.log('=== savePaymentSettings STARTED ===');
        
        const accountName = document.getElementById('pmAccountName').value.trim();
        const accountNumber = document.getElementById('pmAccountNumber').value.trim();
        
        if (!accountName || !accountNumber) {
            alert('⚠️ Please fill in required fields (Account Name, Account Number).');
            return;
        }
        
        // پیدا کردن ID
        let methodId = currentMethodData ? currentMethodData.id : null;
        
        if (!methodId) {
            try {
                const resp = await API.get('/payment-methods/key/' + methodKey);
                if (resp.success && resp.data) {
                    methodId = resp.data.id;
                }
            } catch (e) {}
        }
        
        if (!methodId) {
            alert('⚠️ Payment method not found in database.');
            return;
        }
        
        // ⚠️ ساخت data (فقط یک بار!)
        const isEmailNotifChecked = document.getElementById('pmSendEmailNotification')?.checked;
        
        const updateData = {
            account_name: accountName,
            account_number: accountNumber,
            account_type: document.getElementById('pmAccountType').value,
            currency: document.getElementById('pmCurrency').value,
            instructions: document.getElementById('pmInstructions').value.trim(),
            show_on_checkout: document.getElementById('pmShowOnCheckout').checked ? 1 : 0,
            is_default: document.getElementById('pmSetAsDefault').checked ? 1 : 0,
            order_email: document.getElementById('pmOrderEmail')?.value.trim() || '',
            send_email_notification: isEmailNotifChecked ? 1 : 0
        };
        
        // ⚠️ DEBUG
        console.log('=== DEBUG updateData ===');
        console.log('send_email_notification checkbox checked:', isEmailNotifChecked);
        console.log('send_email_notification value (0 or 1):', updateData.send_email_notification);
        console.log('updateData:', JSON.stringify(updateData, null, 2));
        console.log('=======================');
        
        // اگه لوگو جدید آپلود شده
        if (pendingLogo) {
            updateData.logo = pendingLogo;
        }
        
        // اگه QR جدید آپلود شده
        if (pendingQR) {
            updateData.qr_code = pendingQR;
        }
        
        // لودینگ
        const saveBtn = document.querySelector('.btn-save-settings');
        const originalHTML = saveBtn ? saveBtn.innerHTML : '';
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            saveBtn.disabled = true;
        }
        
        try {
            const response = await API.put('/payment-methods/' + methodId, updateData);
            console.log('API response:', response);
            
            if (response.success) {
                if (window.logActivity) {
                    window.logActivity('update', `Updated ${methodInfo.name} payment settings`, 'info');
                }
                
                currentMethodData = response.data;
                
                if (response.data.logo) {
                    document.getElementById('pmLogoPreview').src = response.data.logo;
                    document.getElementById('pmPreviewLogo').src = response.data.logo;
                }
                
                alert('✅ ' + methodInfo.name + ' settings saved successfully!');
                
                pendingLogo = null;
                pendingQR = null;
            } else {
                alert('⚠️ ' + (response.message || 'Failed to save settings'));
            }
        } catch (err) {
            console.error('Save error:', err);
            alert('⚠️ Network error. Please try again.');
        } finally {
            if (saveBtn) {
                saveBtn.innerHTML = originalHTML;
                saveBtn.disabled = false;
            }
        }
    };
    
    // =========================================
    // Reset به پیش‌فرض
    // =========================================
    window.resetPaymentSettings = function() {
        if (!confirm('Reset ' + methodInfo.name + ' settings to default?')) return;
        
        document.getElementById('pmAccountName').value = methodInfo.defaultAccountName;
        document.getElementById('pmAccountNumber').value = methodInfo.defaultAccountNumber;
        document.getElementById('pmAccountType').value = 'Personal';
        document.getElementById('pmCurrency').value = methodInfo.defaultCurrency;
        document.getElementById('pmInstructions').value = '';
        document.getElementById('pmSetAsDefault').checked = false;
        document.getElementById('pmShowOnCheckout').checked = true;
        
        document.getElementById('pmLogoPreview').src = methodInfo.logo;
        document.getElementById('pmPreviewLogo').src = methodInfo.logo;
        
        document.getElementById('pmQrPreview').src = '';
        document.getElementById('pmQrPreview').style.display = 'none';
        document.getElementById('pmQrEmpty').style.display = 'flex';
        
        pendingLogo = null;
        pendingQR = null;
        
        updatePreviewInstructions();
    };
    
    // =========================================
    // Copy Helper
    // =========================================
    window.copyValue = function(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        input.select();
        input.setSelectionRange(0, 99999);
        
        try {
            navigator.clipboard.writeText(input.value).then(() => {
                alert('✅ Copied: ' + input.value);
            }).catch(() => {
                document.execCommand('copy');
                alert('✅ Copied!');
            });
        } catch (e) {
            document.execCommand('copy');
            alert('✅ Copied!');
        }
    };
    
    // =========================================
    // اجرای اولیه
    // =========================================
    await loadPaymentSettings();
    
});