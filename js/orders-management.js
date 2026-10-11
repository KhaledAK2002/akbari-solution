/* =========================================
   ORDERS MANAGEMENT - API-Based
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    
    const ordersTableBody = document.getElementById('ordersTableBody');
    if (!ordersTableBody) return;

    let ordersCache = [];
    let currentPage = 1;
    const perPage = 10;
    let currentStatus = '';
    let currentPaymentStatus = '';
    let currentSearch = '';

    // =========================================
    // Helpers
    // =========================================
    function formatDate(dateStr) {
        // استفاده از تابع Global
        if (typeof window.formatDateTimeGlobal === 'function') {
            return window.formatDateTimeGlobal(dateStr);
        }
        
        // Fallback
        if (!dateStr) return 'N/A';
        try {
            const d = new Date(dateStr.replace(' ', 'T'));
            return d.toLocaleDateString('en-GB', { 
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    }

    function formatPrice(amount, currency = 'USD') {
        if (window.formatPrice) {
            return window.formatPrice(amount);
        }
        return '$' + parseFloat(amount || 0).toFixed(2);
    }

    function getStatusBadge(status) {
        const map = {
            'new': { class: 'blue', text: 'New' },
            'processing': { class: 'orange', text: 'Processing' },
            'completed': { class: 'green', text: 'Completed' },
            'cancelled': { class: 'red', text: 'Cancelled' }
        };
        return map[status] || { class: 'blue', text: status };
    }

    function getPaymentBadge(status) {
        const map = {
            'pending': { color: '#F59E0B', text: 'Pending' },
            'paid': { color: '#10B981', text: 'Paid' },
            'failed': { color: '#EF4444', text: 'Failed' },
            'refunded': { color: '#8B5CF6', text: 'Refunded' }
        };
        return map[status] || { color: '#A0AEC0', text: status };
    }

    function getInitials(name) {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    // =========================================
    // API: Fetch Orders
    // =========================================
    async function fetchOrders() {
        try {
            const params = { per_page: 100 };
            if (currentStatus) params.status = currentStatus;
            if (currentPaymentStatus) params.payment_status = currentPaymentStatus;
            if (currentSearch) params.search = currentSearch;

            const response = await API.get('/orders', params);

            if (response.success && response.data.orders) {
                ordersCache = response.data.orders;
                return ordersCache;
            }
            return [];
        } catch (e) {
            console.error('Failed to fetch orders:', e);
            return [];
        }
    }

    // =========================================
    // API: Fetch Stats
    // =========================================
    async function fetchStats() {
        try {
            const response = await API.get('/orders/stats');
            if (response.success && response.data) {
                return response.data;
            }
            return { total: 0, new_orders: 0, processing: 0, completed: 0, cancelled: 0 };
        } catch (e) {
            return { total: 0, new_orders: 0, processing: 0, completed: 0, cancelled: 0 };
        }
    }

    // =========================================
    // Load & Render
    // =========================================
    async function loadAndRender() {
        ordersTableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center; padding:40px; color:#A0AEC0;">
                    <i class="fas fa-spinner fa-spin" style="font-size:30px; margin-bottom:15px; display:block; color:#00A8FF;"></i>
                    Loading orders...
                </td>
            </tr>
        `;

        await fetchOrders();
        renderOrders();
        await updateStats();
    }

    function renderOrders() {
        const total = ordersCache.length;
        const totalPages = Math.ceil(total / perPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;

        const startIndex = (currentPage - 1) * perPage;
        const endIndex = startIndex + perPage;
        const pageOrders = ordersCache.slice(startIndex, endIndex);

        ordersTableBody.innerHTML = '';

        if (total === 0) {
            ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align:center; padding:60px 20px; color:#A0AEC0;">
                        <i class="fas fa-shopping-cart" style="font-size:50px; margin-bottom:20px; display:block; color:#2D3748;"></i>
                        <h3 style="color:white; margin-bottom:10px;">No orders yet</h3>
                        <p>Orders will appear here when customers submit them.</p>
                    </td>
                </tr>
            `;
            document.getElementById('showingText').textContent = 'Showing 0 to 0 of 0 orders';
            renderPagination(0, 1);
            return;
        }

        pageOrders.forEach((order, index) => {
            const actualIndex = startIndex + index + 1;
            const statusBadge = getStatusBadge(order.order_status);
            const paymentBadge = getPaymentBadge(order.payment_status);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${actualIndex}</td>
                <td>
                    <strong style="color:#00A8FF;font-family:monospace;">${order.order_number}</strong>
                </td>
                <td>
                    <div class="prod-name-cell">
                        <strong>${order.customer_name}</strong>
                        <span>${order.customer_email}</span>
                    </div>
                </td>
                <td>
                    <div class="prod-name-cell">
                        <strong>${order.item_name || 'N/A'}</strong>
                        <span>${order.item_type}</span>
                    </div>
                </td>
                <td><strong>${formatPrice(order.amount, order.currency)}</strong></td>
                <td>
                    <span style="color:${paymentBadge.color};font-weight:600;font-size:12px;">
                        <i class="fas fa-circle" style="font-size:8px;"></i> ${paymentBadge.text}
                    </span>
                </td>
                <td>
                    <span class="category-tag ${statusBadge.class}">${statusBadge.text}</span>
                </td>
                <td>${formatDate(order.created_at)}</td>
                <td class="action-buttons">
                    <button class="action-btn view" onclick="viewOrder(${order.id})" title="View Details" style="background:#4A5568;">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteOrder(${order.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            ordersTableBody.appendChild(row);
        });

        document.getElementById('showingText').textContent = 
            `Showing ${startIndex + 1} to ${Math.min(endIndex, total)} of ${total} orders`;

        renderPagination(total, totalPages);
    }

    function renderPagination(total, totalPages) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        paginationContainer.innerHTML = '';
        if (total === 0 || totalPages <= 1) return;

        // Prev
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn' + (currentPage === 1 ? ' disabled' : '');
        prevBtn.textContent = 'Previous';
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) { currentPage--; renderOrders(); }
        });
        paginationContainer.appendChild(prevBtn);

        // Pages
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                const pageBtn = document.createElement('button');
                pageBtn.className = 'page-btn' + (i === currentPage ? ' active' : '');
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => { currentPage = i; renderOrders(); });
                paginationContainer.appendChild(pageBtn);
            }
        }

        // Next
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn' + (currentPage === totalPages ? ' disabled' : '');
        nextBtn.textContent = 'Next';
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) { currentPage++; renderOrders(); }
        });
        paginationContainer.appendChild(nextBtn);
    }

    async function updateStats() {
        const stats = await fetchStats();

        document.getElementById('statTotalOrders').textContent = stats.total || 0;
        document.getElementById('statNewOrders').textContent = stats.new_orders || 0;
        document.getElementById('statCompletedOrders').textContent = stats.completed || 0;
        document.getElementById('statCancelledOrders').textContent = stats.cancelled || 0;

        // Sidebar badge
        const sidebarBadge = document.getElementById('sidebarOrderCount');
        if (sidebarBadge) sidebarBadge.textContent = stats.new_orders || 0;
    }

    // =========================================
    // View Order Details
    // =========================================
    window.viewOrder = async function(id) {
        try {
            const response = await API.get('/orders/' + id);
            if (!response.success || !response.data) {
                alert('⚠️ Order not found');
                return;
            }

            const order = response.data;
            const modal = document.getElementById('orderDetailsModal');
            const body = document.getElementById('orderDetailsBody');

            const paymentBadge = getPaymentBadge(order.payment_status);
            const statusBadge = getStatusBadge(order.order_status);

            body.innerHTML = `
                <div style="padding: 20px;">
                    <!-- Order Info -->
                    <div style="background:#0A1128;padding:15px;border-radius:10px;margin-bottom:15px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                            <strong style="color:#00A8FF;font-family:monospace;font-size:16px;">${order.order_number}</strong>
                            <span class="category-tag ${statusBadge.class}">${statusBadge.text}</span>
                        </div>
                        <p style="color:#A0AEC0;font-size:12px;">Created: ${formatDate(order.created_at)}</p>
                    </div>

                    <!-- Customer Info -->
                    <h4 style="color:white;margin-bottom:10px;font-size:14px;"><i class="fas fa-user" style="color:#00A8FF;"></i> Customer Information</h4>
                    <table style="width:100%;margin-bottom:15px;">
                        <tr><td style="padding:5px 0;color:#A0AEC0;font-size:13px;">Name:</td><td style="color:white;font-size:13px;"><strong>${order.customer_name}</strong></td></tr>
                        <tr><td style="padding:5px 0;color:#A0AEC0;font-size:13px;">Email:</td><td style="color:white;font-size:13px;">${order.customer_email}</td></tr>
                        <tr><td style="padding:5px 0;color:#A0AEC0;font-size:13px;">Phone:</td><td style="color:white;font-size:13px;">${order.customer_phone || 'N/A'}</td></tr>
                        <tr><td style="padding:5px 0;color:#A0AEC0;font-size:13px;">City:</td><td style="color:white;font-size:13px;">${order.customer_city || 'N/A'}</td></tr>
                        ${order.customer_note ? `<tr><td style="padding:5px 0;color:#A0AEC0;font-size:13px;">Note:</td><td style="color:white;font-size:13px;">${order.customer_note}</td></tr>` : ''}
                    </table>

                    <!-- Item Info -->
                    <h4 style="color:white;margin-bottom:10px;font-size:14px;"><i class="fas fa-box" style="color:#00A8FF;"></i> Item Information</h4>
                    <table style="width:100%;margin-bottom:15px;">
                        <tr><td style="padding:5px 0;color:#A0AEC0;font-size:13px;">Type:</td><td style="color:white;font-size:13px;">${order.item_type}</td></tr>
                        <tr><td style="padding:5px 0;color:#A0AEC0;font-size:13px;">Name:</td><td style="color:white;font-size:13px;"><strong>${order.item_name || 'N/A'}</strong></td></tr>
                        <tr><td style="padding:5px 0;color:#A0AEC0;font-size:13px;">Amount:</td><td style="color:#10B981;font-size:15px;font-weight:600;">${formatPrice(order.amount, order.currency)}</td></tr>
                    </table>

                    <!-- Payment Info -->
                    <h4 style="color:white;margin-bottom:10px;font-size:14px;"><i class="fas fa-credit-card" style="color:#00A8FF;"></i> Payment Information</h4>
                    <table style="width:100%;margin-bottom:15px;">
                        <tr><td style="padding:5px 0;color:#A0AEC0;font-size:13px;">Method:</td><td style="color:white;font-size:13px;">${order.payment_method || 'N/A'}</td></tr>
                        <tr><td style="padding:5px 0;color:#A0AEC0;font-size:13px;">Status:</td><td style="color:${paymentBadge.color};font-size:13px;font-weight:600;">${paymentBadge.text}</td></tr>
                    </table>

                    <!-- Update Section -->
                    <h4 style="color:white;margin-bottom:10px;font-size:14px;"><i class="fas fa-cog" style="color:#00A8FF;"></i> Update Order</h4>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px;">
                        <div>
                            <label style="display:block;color:#A0AEC0;font-size:12px;margin-bottom:5px;">Order Status</label>
                            <select id="updateOrderStatus" class="form-select" style="width:100%;">
                                <option value="new" ${order.order_status === 'new' ? 'selected' : ''}>New</option>
                                <option value="processing" ${order.order_status === 'processing' ? 'selected' : ''}>Processing</option>
                                <option value="completed" ${order.order_status === 'completed' ? 'selected' : ''}>Completed</option>
                                <option value="cancelled" ${order.order_status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label style="display:block;color:#A0AEC0;font-size:12px;margin-bottom:5px;">Payment Status</label>
                            <select id="updatePaymentStatus" class="form-select" style="width:100%;">
                                <option value="pending" ${order.payment_status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="paid" ${order.payment_status === 'paid' ? 'selected' : ''}>Paid</option>
                                <option value="failed" ${order.payment_status === 'failed' ? 'selected' : ''}>Failed</option>
                                <option value="refunded" ${order.payment_status === 'refunded' ? 'selected' : ''}>Refunded</option>
                            </select>
                        </div>
                    </div>

                    <button onclick="updateOrder(${order.id})" style="width:100%;background:#00A8FF;color:white;border:none;padding:12px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:'Poppins',sans-serif;">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            `;

            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);

        } catch (e) {
            console.error(e);
            alert('⚠️ Failed to load order details');
        }
    };

    window.closeOrderDetails = function() {
        const modal = document.getElementById('orderDetailsModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    };

    window.updateOrder = async function(id) {
        const orderStatus = document.getElementById('updateOrderStatus').value;
        const paymentStatus = document.getElementById('updatePaymentStatus').value;

        try {
            const response = await API.put('/orders/' + id, {
                order_status: orderStatus,
                payment_status: paymentStatus
            });

            if (response.success) {
                window.logActivity('update', `Updated order #${id} - Status: ${orderStatus}, Payment: ${paymentStatus}`, 'info');
                alert('✅ Order updated successfully!');
                closeOrderDetails();
                await loadAndRender();
            } else {
                alert('⚠️ ' + (response.message || 'Failed to update order'));
            }
        } catch (e) {
            console.error(e);
            alert('⚠️ Network error');
        }
    };

    window.deleteOrder = async function(id) {
        if (!confirm('Are you sure you want to delete this order?')) return;

        try {
            const response = await API.del('/orders/' + id);
            if (response.success) {
                window.logActivity('delete', `Deleted order #${id}`, 'danger');
                await loadAndRender();
            } else {
                alert('⚠️ ' + (response.message || 'Failed to delete order'));
            }
        } catch (e) {
            console.error(e);
            alert('⚠️ Network error');
        }
    };

    // =========================================
    // Filter Listeners
    // =========================================
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                currentSearch = e.target.value.toLowerCase().trim();
                currentPage = 1;
                loadAndRender();
            }, 400);
        });
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            currentStatus = e.target.value;
            currentPage = 1;
            loadAndRender();
        });
    }

    const paymentStatusFilter = document.getElementById('paymentStatusFilter');
    if (paymentStatusFilter) {
        paymentStatusFilter.addEventListener('change', (e) => {
            currentPaymentStatus = e.target.value;
            currentPage = 1;
            loadAndRender();
        });
    }

    // Modal close on overlay click
    const modal = document.getElementById('orderDetailsModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeOrderDetails();
        });
    }

    // =========================================
    // Initial Load
    // =========================================
    loadAndRender();
});