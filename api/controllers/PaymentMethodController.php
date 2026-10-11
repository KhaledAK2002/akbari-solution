<?php
/**
 * Payment Method Controller
 * مدیریت API روش‌های پرداخت
 */

class PaymentMethodController {
    private $paymentMethodModel;

    public function __construct() {
        $this->paymentMethodModel = new PaymentMethod();
    }

    /**
     * GET /api/v1/payment-methods
     * دریافت همه روش‌های پرداخت (ادمین — همه)
     */
    public function index() {
        AuthMiddleware::requireAdmin();

        try {
            $methods = $this->paymentMethodModel->getAll();
            Response::success($methods, 'Payment methods fetched successfully');
        } catch (Exception $e) {
            Response::error('Failed to fetch payment methods: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/payment-methods/public
     * دریافت روش‌های پرداخت برای Frontend (فقط فعال‌ها)
     */
    public function publicMethods() {
        try {
            $methods = $this->paymentMethodModel->getAll([
                'enabled' => 1,
                'show_on_checkout' => 1
            ]);
            Response::success($methods, 'Payment methods fetched successfully');
        } catch (Exception $e) {
            Response::error('Failed to fetch payment methods: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/payment-methods/{id}
     * دریافت یک روش پرداخت (ادمین)
     */
    public function show($id) {
        AuthMiddleware::requireAdmin();

        try {
            $method = $this->paymentMethodModel->getById($id);

            if (!$method) {
                Response::error('Payment method not found', 404);
            }

            Response::success($method, 'Payment method fetched successfully');
        } catch (Exception $e) {
            Response::error('Failed to fetch payment method: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/payment-methods/key/{key}
     * دریافت روش پرداخت با method_key
     */
    public function showByKey($key) {
        AuthMiddleware::requireAdmin();

        try {
            $method = $this->paymentMethodModel->getByKey($key);

            if (!$method) {
                Response::success(null, 'Payment method not found');
            }

            Response::success($method, 'Payment method fetched successfully');
        } catch (Exception $e) {
            Response::error('Failed to fetch payment method: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/payment-methods
     * ایجاد روش پرداخت جدید (ادمین)
     */
    public function store() {
        AuthMiddleware::requireAdmin();

        $data = Request::json();

        if (empty($data['method_key'])) {
            Response::error('Method key is required', 400);
        }

        // ⚠️ چک کردن لوگو Base64 → آپلود به سرور
        if (!empty($data['logo']) && strpos($data['logo'], 'data:image') === 0) {
            $logoPath = $this->saveImage($data['logo'], 'logos');
            if ($logoPath) {
                $data['logo'] = $logoPath;
            } else {
                unset($data['logo']);
            }
        }

        // ⚠️ چک کردن QR Code Base64 → آپلود به سرور
        if (!empty($data['qr_code']) && strpos($data['qr_code'], 'data:image') === 0) {
            $qrPath = $this->saveImage($data['qr_code'], 'qrcodes');
            if ($qrPath) {
                $data['qr_code'] = $qrPath;
            } else {
                unset($data['qr_code']);
            }
        }

        try {
            $methodId = $this->paymentMethodModel->create($data);
            $method = $this->paymentMethodModel->getById($methodId);

            Response::success($method, 'Payment method created successfully', 201);
        } catch (Exception $e) {
            Response::error('Failed to create payment method: ' . $e->getMessage(), 400);
        }
    }

    /**
     * PUT /api/v1/payment-methods/{id}
     * به‌روزرسانی روش پرداخت (ادمین)
     */
    public function update($id) {
        AuthMiddleware::requireAdmin();

        $data = Request::json();

        $existing = $this->paymentMethodModel->getById($id);
        if (!$existing) {
            Response::error('Payment method not found', 404);
        }

        // ⚠️ چک کردن لوگو Base64 → آپلود به سرور
        if (!empty($data['logo']) && strpos($data['logo'], 'data:image') === 0) {
            $logoPath = $this->saveImage($data['logo'], 'logos');
            if ($logoPath) {
                $data['logo'] = $logoPath;
                // پاک کردن فایل قدیمی
                if (!empty($existing['logo']) && strpos($existing['logo'], 'data:') !== 0) {
                    $oldPath = __DIR__ . '/../../' . $existing['logo'];
                    if (file_exists($oldPath)) {
                        unlink($oldPath);
                    }
                }
            } else {
                unset($data['logo']);
            }
        }

        // ⚠️ چک کردن QR Code Base64 → آپلود به سرور
        if (!empty($data['qr_code']) && strpos($data['qr_code'], 'data:image') === 0) {
            $qrPath = $this->saveImage($data['qr_code'], 'qrcodes');
            if ($qrPath) {
                $data['qr_code'] = $qrPath;
            } else {
                unset($data['qr_code']);
            }
        }

        // اگه is_default = true بود، setAsDefault کن
        if (!empty($data['is_default'])) {
            $this->paymentMethodModel->setAsDefault($id);
            unset($data['is_default']);
        }

        try {
            if (!empty($data)) {
                $this->paymentMethodModel->update($id, $data);
            }

            $method = $this->paymentMethodModel->getById($id);
            Response::success($method, 'Payment method updated successfully');
        } catch (Exception $e) {
            Response::error('Failed to update payment method: ' . $e->getMessage(), 400);
        }
    }

    /**
     * DELETE /api/v1/payment-methods/{id}
     * حذف روش پرداخت (ادمین)
     */
    public function destroy($id) {
        AuthMiddleware::requireAdmin();

        $existing = $this->paymentMethodModel->getById($id);
        if (!$existing) {
            Response::error('Payment method not found', 404);
        }

        try {
            $this->paymentMethodModel->delete($id);
            Response::success(null, 'Payment method deleted successfully');
        } catch (Exception $e) {
            Response::error('Failed to delete payment method: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/payment-methods/set-default/{id}
     * تنظیم به عنوان پیش‌فرض
     */
    public function setDefault($id) {
        AuthMiddleware::requireAdmin();

        $existing = $this->paymentMethodModel->getById($id);
        if (!$existing) {
            Response::error('Payment method not found', 404);
        }

        try {
            $this->paymentMethodModel->setAsDefault($id);
            $method = $this->paymentMethodModel->getById($id);

            Response::success($method, 'Payment method set as default');
        } catch (Exception $e) {
            Response::error('Failed to set default: ' . $e->getMessage(), 500);
        }
    }

    /**
     * ⚠️ ذخیره عکس از Base64
     */
    private function saveImage($base64Data, $subfolder) {
        if (!preg_match('/^data:image\/(\w+);base64,/', $base64Data, $matches)) {
            return null;
        }

        $ext = strtolower($matches[1]);
        if ($ext === 'jpeg') $ext = 'jpg';

        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'])) {
            return null;
        }

        $data = substr($base64Data, strpos($base64Data, ',') + 1);
        $data = base64_decode($data);

        if ($data === false) return null;
        if (strlen($data) > 2 * 1024 * 1024) return null;

        $uploadDir = __DIR__ . '/../../uploads/' . $subfolder . '/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $filename = $subfolder . '_' . uniqid() . '_' . time() . '.' . $ext;
        $filePath = $uploadDir . $filename;

        if (file_put_contents($filePath, $data) === false) {
            return null;
        }

        return 'uploads/' . $subfolder . '/' . $filename;
    }
}