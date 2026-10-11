document.addEventListener('DOMContentLoaded', async () => {
    
    // =========================================
    // بررسی وجود صفحه
    // =========================================
    const mainImage = document.getElementById('mainProductImage');
    if (!mainImage) return;

    const REVIEWS_KEY = 'akbariReviews';

    // ⚠️ تابع فرمت قیمت نهایی با Tax
    function formatProductPrice(price) {
        try {
            const settings = JSON.parse(localStorage.getItem('akbariWebsiteSettings') || '{}');
            const ecommerce = settings.ecommerce || {};
            
            const symbol = ecommerce.currencySymbol || '$';
            const decimals = parseInt(ecommerce.decimalPlaces) || 2;
            const format = ecommerce.priceFormat || '$1,234.56';
            const taxRate = parseFloat(ecommerce.taxRate) || 0;
            
            let numPrice = parseFloat(price) || 0;
            
            if (taxRate > 0) {
                numPrice = numPrice + (numPrice * taxRate / 100);
            }
            
            let formattedNum = numPrice.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            
            if (format === '1,234.56$') return formattedNum + symbol;
            if (format === '$ 1,234.56') return symbol + ' ' + formattedNum;
            return symbol + formattedNum;
        } catch (e) {
            return '$' + price;
        }
    }

    // گرفتن ID محصول از URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        alert('Product not found!');
        window.location.href = 'products.html';
        return;
    }

    // ⚠️ نمایش لودینگ
    mainImage.src = 'assets/images/product-doctor-clinic.png';
    document.getElementById('productTitle').textContent = 'Loading...';

    // ⚠️ درخواست به API
    const response = await API.get('/products/' + productId);

    if (!response.success) {
        alert('Product not found!');
        window.location.href = 'products.html';
        return;
    }

    const product = response.data;

    // =========================================
    // پر کردن اطلاعات محصول
    // =========================================
    document.getElementById('breadcrumbProductName').textContent = product.name;
    document.title = product.name + ' - Akbari Solution';

    document.getElementById('productCategoryBadge').textContent = product.category;
    document.getElementById('productTitle').textContent = product.name;
    document.getElementById('productShortDesc').textContent = product.short_desc;
    document.getElementById('productPrice').textContent = formatProductPrice(product.price);
    document.getElementById('productFullDesc').innerHTML = product.full_desc || product.short_desc;
    document.getElementById('tabFullDescription').innerHTML = product.full_desc || product.short_desc;
    document.getElementById('sidebarProductName').textContent = product.name;
    document.getElementById('infoCategory').textContent = product.category;
    document.getElementById('infoDate').textContent = product.created_at ? product.created_at.split(' ')[0] : 'N/A';
    document.getElementById('infoVersion').textContent = product.version || '1.0';
    document.getElementById('infoFileSize').textContent = product.file_size || 'N/A';
    document.getElementById('infoFileFormat').textContent = product.file_format || 'N/A';
    document.getElementById('infoCompatible').textContent = product.compatible || 'N/A';
    document.getElementById('infoLanguage').textContent = product.language || 'English';
    document.getElementById('infoLicense').textContent = product.license || 'Single User';

    // قیمت قدیمی و تخفیف
    if (product.old_price && parseFloat(product.old_price) > parseFloat(product.price)) {
        document.getElementById('productOldPrice').textContent = formatProductPrice(product.old_price);
        const discount = Math.round(((product.old_price - product.price) / product.old_price) * 100);
        document.getElementById('discountBadge').textContent = discount + '% OFF';
    } else {
        const oldPriceEl = document.getElementById('productOldPrice');
        const discountEl = document.getElementById('discountBadge');
        if (oldPriceEl) oldPriceEl.style.display = 'none';
        if (discountEl) discountEl.style.display = 'none';
    }

    // دکمه دانلود دمو
    const demoBtn = document.getElementById('downloadDemoBtn');
    if (demoBtn) {
        if (product.demo_link) {
            demoBtn.href = product.demo_link;
            demoBtn.target = '_blank';
        } else {
            demoBtn.style.opacity = '0.5';
            demoBtn.style.pointerEvents = 'none';
        }
    }

    // =========================================
    // ویژگی‌های کلیدی
    // =========================================
    const keyFeaturesGrid = document.getElementById('keyFeaturesGrid');
    const featuresList = document.getElementById('featuresList');

    if (product.features && product.features.trim() !== '') {
        const featuresArray = product.features.split('\n').filter(f => f.trim() !== '');

        featuresArray.forEach(feature => {
            const item = document.createElement('div');
            item.className = 'key-feature-item';
            item.innerHTML = `<i class="fas fa-check-circle"></i> <span>${feature}</span>`;
            if (keyFeaturesGrid) keyFeaturesGrid.appendChild(item);
        });

        featuresArray.forEach(feature => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-check"></i> ${feature}`;
            if (featuresList) featuresList.appendChild(li);
        });
    } else {
        if (keyFeaturesGrid) keyFeaturesGrid.innerHTML = '<p style="color: #A0AEC0;">No features listed.</p>';
        if (featuresList) featuresList.innerHTML = '<li>No features listed.</li>';
    }

    // =========================================
    // گالری تصاویر
    // =========================================
    const thumbnailList = document.getElementById('thumbnailList');
    
    let images = ['assets/images/product-doctor-clinic.png'];
    
    if (product.images && product.images.length > 0) {
        images = product.images.map(img => img.url);
    }

    let currentImageIndex = 0;

    // تنظیم عکس اصلی
    mainImage.src = images[0];
    mainImage.onerror = function() {
        this.src = 'assets/images/product-doctor-clinic.png';
    };

    // ساخت Thumbnails
    if (thumbnailList) {
        thumbnailList.innerHTML = '';
        
        if (images.length > 1) {
            images.forEach((img, index) => {
                const thumb = document.createElement('div');
                thumb.className = 'thumbnail-item' + (index === 0 ? ' active' : '');
                thumb.innerHTML = `<img src="${img}" alt="Thumbnail ${index + 1}">`;
                thumb.addEventListener('click', () => {
                    document.querySelectorAll('.thumbnail-item').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                    mainImage.src = img;
                    currentImageIndex = index;
                });
                thumbnailList.appendChild(thumb);
            });
            
            if (images.length <= 5) {
                thumbnailList.style.gridTemplateColumns = `repeat(${images.length}, 1fr)`;
            }
        } else {
            thumbnailList.style.display = 'none';
        }
    }

    // دکمه‌های Prev/Next
    const prevBtn = document.getElementById('prevImage');
    const nextBtn = document.getElementById('nextImage');

    if (images.length <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    } else {
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
                mainImage.src = images[currentImageIndex];
                document.querySelectorAll('.thumbnail-item').forEach((t, i) => {
                    t.classList.toggle('active', i === currentImageIndex);
                });
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentImageIndex = (currentImageIndex + 1) % images.length;
                mainImage.src = images[currentImageIndex];
                document.querySelectorAll('.thumbnail-item').forEach((t, i) => {
                    t.classList.toggle('active', i === currentImageIndex);
                });
            });
        }
    }

    // =========================================
    // تب‌ها
    // =========================================
    const productTabs = document.querySelectorAll('.product-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    productTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            productTabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const targetPane = document.getElementById('tab-' + targetTab);
            if (targetPane) targetPane.classList.add('active');
        });
    });

    // =========================================
    // دکمه Add to Cart
    // =========================================
    function addToCart() {
        window.location.href = 'checkout.html?id=' + product.id;
    }
    
    const addToCartBtn = document.getElementById('addToCartBtn');
    const sidebarAddToCart = document.getElementById('sidebarAddToCart');
    
    if (addToCartBtn) addToCartBtn.addEventListener('click', addToCart);
    if (sidebarAddToCart) sidebarAddToCart.addEventListener('click', addToCart);

    // =========================================
    // سیستم نظرات (محلی)
    // =========================================
    function getAllReviews() {
        try {
            const data = localStorage.getItem(REVIEWS_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }

    function getProductReviews(pid) {
        const allReviews = getAllReviews();
        return allReviews[pid] || [];
    }

    function saveReview(pid, review) {
        const allReviews = getAllReviews();
        if (!allReviews[pid]) allReviews[pid] = [];
        allReviews[pid].unshift(review);
        localStorage.setItem(REVIEWS_KEY, JSON.stringify(allReviews));
    }

    function calculateAverageRating(reviews) {
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((total, r) => total + r.rating, 0);
        return (sum / reviews.length).toFixed(1);
    }

    function renderStars(rating) {
        let html = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = (rating - fullStars) >= 0.5;
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                html += '<i class="fas fa-star"></i>';
            } else if (i === fullStars && hasHalfStar) {
                html += '<i class="fas fa-star-half-alt"></i>';
            } else {
                html += '<i class="far fa-star"></i>';
            }
        }
        return html;
    }

    function renderReviews() {
        const reviews = getProductReviews(product.id);
        const reviewsList = document.getElementById('reviewsList');
        const ratingStars = document.getElementById('ratingStars');
        const ratingText = document.getElementById('ratingText');
        const reviewsTabBtn = document.getElementById('reviewsTabBtn');
        
        const avgRating = calculateAverageRating(reviews);
        
        if (ratingStars) ratingStars.innerHTML = renderStars(parseFloat(avgRating));
        if (ratingText) ratingText.textContent = `${avgRating} (${reviews.length} review${reviews.length !== 1 ? 's' : ''})`;
        if (reviewsTabBtn) reviewsTabBtn.textContent = `Reviews (${reviews.length})`;
        
        if (!reviewsList) return;
        
        if (reviews.length === 0) {
            reviewsList.innerHTML = `
                <div class="no-reviews">
                    <i class="far fa-comment-dots"></i>
                    <h4>No reviews yet</h4>
                    <p>Be the first to review this product!</p>
                </div>
            `;
            return;
        }
        
        reviewsList.innerHTML = '';
        reviews.forEach(review => {
            const reviewItem = document.createElement('div');
            reviewItem.className = 'review-item';
            reviewItem.innerHTML = `
                <div class="review-header">
                    <div class="reviewer-avatar"><i class="fas fa-user"></i></div>
                    <div class="reviewer-info">
                        <h5>${review.name}</h5>
                        <div class="review-stars">${renderStars(review.rating)}</div>
                    </div>
                    <span class="review-date">${review.date}</span>
                </div>
                <p class="review-comment">${review.comment}</p>
            `;
            reviewsList.appendChild(reviewItem);
        });
    }
    
    // ستاره‌های ورودی فرم نظر
    let selectedRating = 0;
    const ratingStarsInput = document.getElementById('ratingStarsInput');
    
    if (ratingStarsInput) {
        const stars = ratingStarsInput.querySelectorAll('i');
        
        stars.forEach(star => {
            star.addEventListener('mouseenter', () => {
                const rating = parseInt(star.getAttribute('data-rating'));
                stars.forEach((s, i) => {
                    if (i < rating) {
                        s.classList.remove('far');
                        s.classList.add('fas');
                    } else {
                        s.classList.remove('fas');
                        s.classList.add('far');
                    }
                });
            });
            
            star.addEventListener('click', () => {
                selectedRating = parseInt(star.getAttribute('data-rating'));
            });
        });
        
        ratingStarsInput.addEventListener('mouseleave', () => {
            stars.forEach((s, i) => {
                if (i < selectedRating) {
                    s.classList.remove('far');
                    s.classList.add('fas');
                } else {
                    s.classList.remove('fas');
                    s.classList.add('far');
                }
            });
        });
    }
    
    // ثبت نظر جدید
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('reviewerName').value.trim();
            const comment = document.getElementById('reviewComment').value.trim();
            
            if (selectedRating === 0) {
                alert('⚠️ Please select a rating (click on the stars).');
                return;
            }
            
            if (!name || !comment) {
                alert('⚠️ Please fill in all required fields.');
                return;
            }
            
            const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
            const newReview = {
                id: Date.now(),
                name: name,
                rating: selectedRating,
                comment: comment,
                date: new Date().toLocaleDateString('en-GB', dateOptions)
            };
            
            saveReview(product.id, newReview);
            
            reviewForm.reset();
            selectedRating = 0;
            if (ratingStarsInput) {
                ratingStarsInput.querySelectorAll('i').forEach(s => {
                    s.classList.remove('fas');
                    s.classList.add('far');
                });
            }
            
            alert('✅ Thank you! Your review has been submitted.');
            renderReviews();
        });
    }
    
    renderReviews();

});