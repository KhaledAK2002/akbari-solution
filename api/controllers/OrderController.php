<?php
/**
 * Order Controller
 * مدیریت API سفارشات
 */

class OrderController {
    private $orderModel;

    public function __construct() {
        $this->orderModel = new Order();
    }

    /**
     * GET /api/v1/orders
     */
    public function index() {
        AuthMiddleware::requirePermission('orders', 'view');

        $filters = [
            'status' => Request::get('status'),
            'payment_status' => Request::get('payment_status'),
            'search' => Request::get('search'),
        ];

        $page = (int)Request::get('page', 1);
        $perPage = (int)Request::get('per_page', 20);
        $filters['limit'] = $perPage;
        $filters['offset'] = ($page - 1) * $perPage;

        $filters = array_filter($filters, function($v) {
            return $v !== null && $v !== '';
        });

        try {
            $orders = $this->orderModel->getAll($filters);
            $total = $this->orderModel->count($filters);

            Response::success([
                'orders' => $orders,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'total_pages' => ceil($total / $perPage)
                ]
            ], 'Orders fetched successfully');

        } catch (Exception $e) {
            Response::error('Failed to fetch orders: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/orders/stats
     */
    public function stats() {
        AuthMiddleware::requirePermission('orders', 'view');

        try {
            $stats = $this->orderModel->getStats();
            Response::success($stats, 'Stats fetched successfully');
        } catch (Exception $e) {
            Response::error('Failed to fetch stats: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/orders/{id}
     */
    public function show($id) {
        AuthMiddleware::requirePermission('orders', 'view');

        try {
            $order = $this->orderModel->getById($id);

            if (!$order) {
                Response::error('Order not found', 404);
            }

            Response::success($order, 'Order fetched successfully');
        } catch (Exception $e) {
            Response::error('Failed to fetch order: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/orders
     * ⚠️ عمومی — از Checkout
     */
    public function store() {
        $data = Request::json();

        if (empty($data['customer_name'])) {
            Response::error('Customer name is required', 400);
        }
        if (empty($data['customer_email'])) {
            Response::error('Customer email is required', 400);
        }
        if (!filter_var($data['customer_email'], FILTER_VALIDATE_EMAIL)) {
            Response::error('Invalid email address', 400);
        }
        if (empty($data['item_type']) || !in_array($data['item_type'], ['product', 'service'])) {
            Response::error('Invalid item type', 400);
        }
        if (empty($data['item_id'])) {
            Response::error('Item ID is required', 400);
        }

        try {
            $orderId = $this->orderModel->create($data);
            $order = $this->orderModel->getById($orderId);

            // ⚠️ ایمیل فقط روی هاست ارسال بشه (نه localhost)
            $isLocalhost = in_array($_SERVER['SERVER_NAME'] ?? '', ['localhost', '127.0.0.1'])
                        || strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false;

            if (!$isLocalhost) {
                register_shutdown_function(function() use ($order) {
                    try {
                        if (function_exists('fastcgi_finish_request')) {
                            fastcgi_finish_request();
                        }
                        
                        $mailHelper = new MailHelper();
                        $mailHelper->sendOrderConfirmation($order);
                        $mailHelper->sendAdminNotification($order);
                    } catch (Exception $e) {
                        error_log('Background mail error: ' . $e->getMessage());
                    }
                });
            }

            Response::success([
                'id' => $orderId,
                'order' => $order
            ], 'Order created successfully', 201);

        } catch (Exception $e) {
            Response::error('Failed to create order: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/v1/orders/{id}
     */
    public function update($id) {
        AuthMiddleware::requirePermission('orders', 'edit');

        $data = Request::json();

        $existing = $this->orderModel->getById($id);
        if (!$existing) {
            Response::error('Order not found', 404);
        }

        try {
            $this->orderModel->update($id, $data);
            $order = $this->orderModel->getById($id);

            Response::success($order, 'Order updated successfully');
        } catch (Exception $e) {
            Response::error('Failed to update order: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/v1/orders/{id}
     */
    public function destroy($id) {
        AuthMiddleware::requirePermission('orders', 'delete');

        $existing = $this->orderModel->getById($id);
        if (!$existing) {
            Response::error('Order not found', 404);
        }

        try {
            $this->orderModel->delete($id);
            Response::success(null, 'Order deleted successfully');
        } catch (Exception $e) {
            Response::error('Failed to delete order: ' . $e->getMessage(), 500);
        }
    }
}