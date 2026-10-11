document.addEventListener('DOMContentLoaded', async () => {
    
    const PRODUCTS_KEY = 'akbariProducts';
    const SERVICES_KEY = 'akbariServices';
    const ORDERS_KEY = 'akbariOrders';
    const WS_SETTINGS_KEY = 'akbariWebsiteSettings';
    
    // ⚠️ لود ایمیل از API
    let CONTACT_EMAIL = 'khalednaseri786@gmail.com';
    
    async function loadContactEmail() {
        try {
            const resp = await API.get('/pages/contact');
            if (resp.success && resp.data && resp.data.value) {
                CONTACT_EMAIL = resp.data.value.mainEmail || resp.data.value.email || CONTACT_EMAIL;
            }
        } catch (e) {}
    }
    
    // =========================================
    // توابع کمکی
    // =========================================
    function getProducts() {
        try {
            const data = localStorage.getItem(PRODUCTS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    }
    
    function getServices() {
        try {
            const data = localStorage.getItem(SERVICES_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    }
    
    function getOrders() {
        try {
            const data = localStorage.getItem(ORDERS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    }
    
    function saveOrders(orders) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }
    
    function getWSSettings() {
        try {
            const data = localStorage.getItem(WS_SETTINGS_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) { return {}; }
    }
    
    function getEcommerce() {
        const settings = getWSSettings();
        return settings.ecommerce || {};
    }
    
    function formatPrice(price) {
        if (!price && price !== 0) return 'Custom Quote';
        if (window.formatPrice) return window.formatPrice(price);
        
        const ecommerce = getEcommerce();
        const symbol = ecommerce.currencySymbol || '$';
        const decimals = parseInt(ecommerce.decimalPlaces) || 2;
        const format = ecommerce.priceFormat || '$1,234.56';
        
        let numPrice = parseFloat(price);
        if (isNaN(numPrice)) return price;
        
        let formattedNum = numPrice.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        
        if (format === '1,234.56$') return formattedNum + symbol;
        if (format === '$ 1,234.56') return symbol + ' ' + formattedNum;
        return symbol + formattedNum;
    }
    
    function calculatePriceWithTax(price) {
        if (window.calculatePriceWithTax) return window.calculatePriceWithTax(price);
        
        const ecommerce = getEcommerce();
        const taxRate = parseFloat(ecommerce.taxRate) || 0;
        let numPrice = parseFloat(price) || 0;
        
        if (taxRate > 0) numPrice = numPrice + (numPrice * taxRate / 100);
        
        return numPrice;
    }
    
    function formatFinalPrice(price) {
        if (window.formatFinalPrice) return window.formatFinalPrice(price);
        const priceWithTax = calculatePriceWithTax(price);
        return formatPrice(priceWithTax);
    }
    
    window.closeOfferLetter = function() {
        const overlay = document.querySelector('.offer-letter-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 300);
        }
    };
    
    const backToTopBtn = document.querySelector('.back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // =========================================
    // گرفتن ID از URL
    // =========================================
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    
    if (!itemId) {
        alert('No item selected for checkout!');
        window.location.href = 'products.html';
        return;
    }
    
    // =========================================
    // پیدا کردن آیتم از API
    // =========================================
    let item = null;
    let itemType = 'product';
    
    const pageTitle = document.querySelector('.checkout-header h1');
    if (pageTitle) pageTitle.textContent = 'Loading...';
    
    try {
        const productResp = await API.get('/products/' + itemId);
        
        if (productResp.success && productResp.data) {
            item = productResp.data;
            itemType = 'product';
        } else {
            const serviceResp = await API.get('/services/' + itemId);
            
            if (serviceResp.success && serviceResp.data) {
                item = serviceResp.data;
                itemType = 'service';
            }
        }
    } catch (err) {
        console.error('Failed to load item:', err);
    }
    
    if (!item) {
        const foundProduct = getProducts().find(p => p.id == itemId);
        if (foundProduct) {
            item = foundProduct;
            itemType = 'product';
        } else {
            const foundService = getServices().find(s => s.id == itemId);
            if (foundService) {
                item = foundService;
                itemType = 'service';
            }
        }
    }
    
    if (!item) {
        alert('Item not found!');
        window.location.href = 'products.html';
        return;
    }
    
    // =========================================
    // پر کردن اطلاعات آیتم
    // =========================================
    document.getElementById('breadcrumbProduct').textContent = item.name;
    document.title = 'Checkout - ' + item.name;
    
    let imageSrc = 'assets/images/product-doctor-clinic.png';
    if (item.images && item.images.length > 0) {
        imageSrc = item.images[0].url || item.images[0];
    } else if (item.image) {
        imageSrc = item.image;
    }
    
    document.getElementById('checkoutProductImage').src = imageSrc;
    document.getElementById('checkoutProductImage').onerror = function() {
        this.src = 'assets/images/product-doctor-clinic.png';
    };
    
    document.getElementById('checkoutProductName').textContent = item.name;
    document.getElementById('checkoutProductShortDesc').textContent = item.short_desc || item.shortDesc || '';
    
    const featuresList = document.getElementById('checkoutProductFeatures');
    featuresList.innerHTML = '';
    
    let featuresArray = [];
    const featuresSource = item.features || '';
    
    if (Array.isArray(featuresSource)) {
        featuresArray = featuresSource.slice(0, 5);
    } else if (typeof featuresSource === 'string' && featuresSource.trim() !== '') {
        featuresArray = featuresSource.split('\n').filter(f => f.trim() !== '').slice(0, 5);
    }
    
    if (featuresArray.length > 0) {
        featuresArray.forEach(feature => {
            const li = document.createElement('li');
            li.innerHTML = '<i class="fas fa-check"></i> ' + feature;
            featuresList.appendChild(li);
        });
    } else {
        featuresList.innerHTML = '<li><i class="fas fa-check"></i> Standard features included</li>';
    }
    
    if (itemType === 'product') {
        document.getElementById('specFileSize').textContent = item.file_size || 'N/A';
        document.getElementById('specVersion').textContent = item.version || '1.0';
        document.getElementById('specLicense').textContent = item.license || 'Single User';
        document.getElementById('specCompatible').textContent = item.compatible || 'N/A';
    } else {
        document.getElementById('specFileSize').textContent = item.category || 'Service';
        document.getElementById('specVersion').textContent = 'Custom';
        document.getElementById('specLicense').textContent = 'Custom Project';
        document.getElementById('specCompatible').textContent = 'All Platforms';
    }
    
    document.getElementById('summaryProductName').textContent = item.name;
    document.getElementById('summaryLicense').textContent = itemType === 'service' 
        ? 'Custom Service' 
        : (item.license || 'Lifetime Use');
    document.getElementById('summaryPrice').textContent = item.price 
        ? formatFinalPrice(item.price) 
        : 'Contact Us';
    document.getElementById('summaryTotal').textContent = item.price 
        ? formatFinalPrice(item.price) 
        : 'Custom Quote';
    
    if (itemType === 'service') {
        const pageHeaderTitle = document.querySelector('.checkout-header h1');
        const pageHeaderDesc = document.querySelector('.checkout-header p');
        if (pageHeaderTitle) pageHeaderTitle.textContent = 'Request This Service';
        if (pageHeaderDesc) pageHeaderDesc.textContent = 'Fill in your information and choose a payment method to request this service.';
    } else {
        const pageHeaderTitle = document.querySelector('.checkout-header h1');
        const pageHeaderDesc = document.querySelector('.checkout-header p');
        if (pageHeaderTitle) pageHeaderTitle.textContent = 'Complete Your Order';
        if (pageHeaderDesc) pageHeaderDesc.textContent = 'Fill in your information and choose a payment method to receive the product.';
    }
    
    // =========================================
    // بارگذاری Payment Methods از API
    // =========================================
    async function loadPaymentMethods() {
        try {
            const response = await API.get('/payment-methods/public');
            
            if (!response.success || !response.data) {
                console.warn('Failed to load payment methods from API');
                return;
            }
            
            const methods = response.data;
            
            document.querySelectorAll('.payment-option').forEach(option => {
                option.style.display = 'none';
                const input = option.querySelector('input[name="paymentMethod"]');
                if (input) input.disabled = true;
            });
            
            let defaultMethod = null;
            let firstVisible = null;
            
            methods.forEach(method => {
                const inputValue = method.method_key;
                const option = document.querySelector('.payment-option input[value="' + inputValue + '"]');
                const optionLabel = option ? option.closest('.payment-option') : null;
                
                if (!optionLabel) return;
                
                optionLabel.style.display = 'block';
                if (option) option.disabled = false;
                
                if (method.logo) {
                    const img = optionLabel.querySelector('.payment-icon img');
                    if (img) {
                        img.src = method.logo;
                        img.onerror = function() { this.style.display = 'none'; };
                    }
                }
                
                if (method.name) {
                    const h4 = optionLabel.querySelector('.payment-info h4');
                    if (h4) h4.textContent = method.name;
                }
                
                if (method.is_default === 1) defaultMethod = option;
                if (!firstVisible) firstVisible = option;
            });
            
            document.querySelectorAll('.payment-group').forEach(group => {
                const visibleOptions = group.querySelectorAll('.payment-option[style*="display: block"]');
                if (visibleOptions.length === 0) group.style.display = 'none';
            });
            
            if (defaultMethod && !defaultMethod.disabled) {
                document.querySelectorAll('input[name="paymentMethod"]').forEach(i => i.checked = false);
                defaultMethod.checked = true;
            } else if (firstVisible) {
                firstVisible.checked = true;
            }
            
        } catch (err) {
            console.error('Failed to load payment methods:', err);
        }
    }
    
    await loadPaymentMethods();
    
    // =========================================
    // اعتبارسنجی فرم
    // =========================================
    function validateForm() {
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const city = document.getElementById('city').value.trim();
        
        if (!fullName || !email || !phone || !city) {
            alert('⚠️ Please fill in all required fields (Full Name, Email, Phone, City).');
            return null;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('⚠️ Please enter a valid email address.');
            return null;
        }
        
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 9) {
            alert('⚠️ Please enter a valid phone number.');
            return null;
        }
        
        const paymentMethodInput = document.querySelector('input[name="paymentMethod"]:checked:not([disabled])');
        if (!paymentMethodInput) {
            alert('⚠️ Please select a payment method.');
            return null;
        }
        
        return {
            fullName: fullName,
            email: email,
            phone: phone,
            city: city,
            message: document.getElementById('message').value.trim(),
            paymentMethod: paymentMethodInput.value
        };
    }
    
    // =========================================
    // ارسال سفارش
    // =========================================
    const submitBtn = document.getElementById('submitOrderBtn');
    
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const formData = validateForm();
            if (!formData) return;
            
            const originalHTML = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;
            
            try {
                const methodsResp = await API.get('/payment-methods/public');
                const methods = methodsResp.success ? methodsResp.data : [];
                const selectedMethod = methods.find(m => m.method_key === formData.paymentMethod);
                
                const finalPrice = calculatePriceWithTax(item.price || 0);
                
                const orderData = {
                    customer_name: formData.fullName,
                    customer_email: formData.email,
                    customer_phone: formData.phone,
                    customer_city: formData.city,
                    customer_note: formData.message || '',
                    item_type: itemType,
                    item_id: item.id,
                    item_name: item.name,
                    amount: finalPrice,
                    currency: 'USD',
                    payment_method: formData.paymentMethod
                };
                
                const response = await API.post('/orders', orderData);
                
                if (!response.success) {
                    throw new Error(response.message || 'Failed to create order');
                }
                
                const savedOrder = response.data.order;
                
                const order = {
                    orderId: savedOrder.order_number,
                    itemId: item.id,
                    itemType: itemType,
                    productName: item.name,
                    productPrice: savedOrder.amount,
                    customer: {
                        fullName: savedOrder.customer_name,
                        email: savedOrder.customer_email,
                        phone: savedOrder.customer_phone,
                        city: savedOrder.customer_city,
                        message: savedOrder.customer_note
                    },
                    paymentMethod: savedOrder.payment_method,
                    paymentMethodName: selectedMethod ? selectedMethod.name : formData.paymentMethod,
                    status: savedOrder.order_status,
                    date: new Date(savedOrder.created_at.replace(' ', 'T')).toLocaleString('en-GB', {
                        timeZone: 'Asia/Kabul',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                };
                
                if (window.logActivity) {
                    window.logActivity('add', `New order: ${savedOrder.order_number} - ${savedOrder.item_name}`, 'success');
                }
                
                await showSuccessMessage(order, selectedMethod);
                
            } catch (err) {
                console.error('Order error:', err);
                alert('⚠️ ' + (err.message || 'Network error. Please try again.'));
            } finally {
                submitBtn.innerHTML = originalHTML;
                submitBtn.disabled = false;
            }
        });
    }
    
    // =========================================
    // نمایش Offer Letter
    // =========================================
    async function showSuccessMessage(order, methodData) {
        await loadContactEmail();
        
        const paymentInfo = {
            title: 'Payment Details - ' + (order.paymentMethodName || order.paymentMethod),
            logo: (methodData && methodData.logo) ? methodData.logo : 'assets/images/bank-' + order.paymentMethod + '.png',
            rows: [],
            instruction: (methodData && methodData.instructions) 
                ? methodData.instructions 
                : 'Please transfer the exact amount to the following account:'
        };
        
        if (methodData) {
            if (methodData.account_name) {
                paymentInfo.rows.push({ label: 'Account Name:', value: methodData.account_name });
            }
            if (methodData.account_number) {
                paymentInfo.rows.push({ label: 'Account Number:', value: methodData.account_number });
            }
            
            let accountPhone = methodData.account_phone;
            
            if (!accountPhone) {
                try {
                    const settings = JSON.parse(localStorage.getItem('akbariWebsiteSettings') || '{}');
                    const ecommerce = settings.ecommerce || {};
                    
                    if (methodData.method_key === 'hesabpay' && ecommerce.hesabPayNumber) {
                        accountPhone = ecommerce.hesabPayNumber;
                    } else if (methodData.method_key === 'mymoney' && ecommerce.myMoneyNumber) {
                        accountPhone = ecommerce.myMoneyNumber;
                    }
                } catch (e) {}
            }
            
            if (accountPhone) {
                paymentInfo.rows.push({ label: 'Account Phone Number:', value: accountPhone });
            }
            
            if (methodData.account_type) {
                paymentInfo.rows.push({ label: 'Account Type:', value: methodData.account_type });
            }
            if (methodData.currency) {
                paymentInfo.rows.push({ label: 'Currency:', value: methodData.currency });
            }
        }
        
        let paymentRowsHTML = '';
        if (paymentInfo.rows.length > 0) {
            paymentInfo.rows.forEach(row => {
                paymentRowsHTML += '<div class="offer-row"><span>' + row.label + '</span><strong>' + row.value + '</strong></div>';
            });
        } else {
            paymentRowsHTML = '<div class="offer-row"><span>Account Details:</span><strong>See instructions above</strong></div>';
        }
        
        const isService = order.itemType === 'service';
        const itemLabel = isService ? 'Service' : 'Product';
        const itemInfoTitle = isService ? 'Service Information' : 'Product Information';
        const itemInfoIcon = isService ? 'fas fa-cogs' : 'fas fa-box';
        const offerSubtitle = isService ? 'FOR PROFESSIONAL SERVICE REQUEST' : 'FOR SOFTWARE PRODUCT PURCHASE';
        const itemNameLabel = isService ? 'Service Name:' : 'Product Name:';
        const itemTypeLabel = isService ? 'Service Type:' : 'License Type:';
        const itemTypeValue = isService ? 'Professional Service' : (item.license || 'Premium (Lifetime Use)');
        const deliveryMethod = isService ? 'Email / Direct Contact (after payment verification)' : 'Email (after payment verification)';
        const priceDisplay = item.price ? formatFinalPrice(item.price) : 'Custom Quote';
        const closingNote = isService 
            ? 'We will verify your payment and contact you to discuss your project requirements as soon as possible.'
            : 'We will verify your payment and send the product files to your email as soon as possible.';
        
        const modal = document.createElement('div');
        modal.className = 'offer-letter-overlay';
        
        modal.innerHTML = `
            <div class="offer-letter">
                
                <div class="offer-header">
                    <div class="offer-logo">
                        <img src="assets/images/logo-offer.png" alt="Akbari Solution">
                    </div>
                    <div class="offer-header-right">
                        <span>INNOVATIVE</span>
                        <span>SOLUTIONS</span>
                        <span>FOR A SMARTER</span>
                        <span>FUTURE</span>
                    </div>
                </div>

                <div class="offer-title-section">
                    <h1>OFFER <span class="text-blue">LETTER</span></h1>
                    <p class="offer-subtitle">${offerSubtitle}</p>
                    <div class="offer-meta">
                        <span>Date: ${order.date.split(',')[0]}</span>
                        <span>Offer ID: ${order.orderId}</span>
                    </div>
                </div>

                <div class="offer-greeting">
                    <p><strong>Dear ${order.customer.fullName},</strong></p>
                    <p>Thank you for choosing Akbari Solution. This letter contains the payment instructions for your selected ${itemLabel.toLowerCase()}. Please follow the details below to complete your purchase.</p>
                </div>

                <div class="offer-section">
                    <div class="offer-section-header">
                        <i class="${itemInfoIcon}"></i>
                        <h3>${itemInfoTitle}</h3>
                    </div>
                    <div class="offer-info-table">
                        <div class="offer-row">
                            <span>${itemNameLabel}</span>
                            <strong>${order.productName}</strong>
                        </div>
                        <div class="offer-row">
                            <span>${itemTypeLabel}</span>
                            <strong>${itemTypeValue}</strong>
                        </div>
                        <div class="offer-row">
                            <span>Price:</span>
                            <strong>${priceDisplay}</strong>
                        </div>
                        <div class="offer-row">
                            <span>Delivery Method:</span>
                            <strong>${deliveryMethod}</strong>
                        </div>
                    </div>
                </div>

                <div class="offer-section">
                    <div class="offer-section-header bank-header">
                        <i class="fas fa-university"></i>
                        <div>
                            <h3>${paymentInfo.title}</h3>
                            <p>${paymentInfo.instruction}</p>
                        </div>
                        <img src="${paymentInfo.logo}" alt="Payment Logo" class="bank-logo-small" onerror="this.style.display='none'">
                    </div>
                    <div class="offer-info-table">
                        ${paymentRowsHTML}
                    </div>
                </div>

                <div class="offer-section">
                    <div class="offer-section-header">
                        <i class="fas fa-file-invoice"></i>
                        <h3>After Payment</h3>
                    </div>
                    <p class="offer-instruction">
                        After transferring the payment, please take a clear photo or scan of the payment receipt and send it to the following email address:
                    </p>
                    <div class="offer-email">
                        <i class="fas fa-envelope"></i>
                        <strong>${CONTACT_EMAIL}</strong>
                    </div>
                    <p class="offer-instruction">
                        ${closingNote}
                    </p>
                </div>

                <div class="offer-closing">
                    <p>Thank you for your trust in Akbari Solution.</p>
                    <p><strong>Best regards,</strong></p>
                    <div class="offer-signature">
                        <span class="signature-name">Mohammad Khalid Akbari</span>
                        <span class="signature-title">Founder & Developer</span>
                        <span class="signature-company">Akbari Solution</span>
                    </div>
                </div>

                <div class="offer-badges">
                    <div class="offer-badge">
                        <i class="fas fa-shield-alt"></i>
                        <div>
                            <strong>Secure & Reliable</strong>
                            <span>Your safety is our priority</span>
                        </div>
                    </div>
                    <div class="offer-badge">
                        <i class="fas fa-headset"></i>
                        <div>
                            <strong>24/7 Support</strong>
                            <span>We are here to help</span>
                        </div>
                    </div>
                    <div class="offer-badge">
                        <i class="fas fa-paper-plane"></i>
                        <div>
                            <strong>Fast Delivery</strong>
                            <span>Get your ${itemLabel.toLowerCase()} after verification</span>
                        </div>
                    </div>
                </div>

                <div class="offer-actions">
                    <button class="btn-print-offer" onclick="window.print()">
                        <i class="fas fa-print"></i> Print / Download PDF
                    </button>
                    <button class="btn-close-offer" onclick="closeOfferLetter()">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>

            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
    }

});