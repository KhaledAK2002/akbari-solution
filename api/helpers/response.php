<?php
/**
 * Response Helpers
 * توابع کمکی برای پاسخ‌ها
 */

/**
 * پاسخ سریع موفق
 */
function respond_success($data = null, $message = 'Success') {
    Response::success($data, $message);
}

/**
 * پاسخ سریع خطا
 */
function respond_error($message = 'Error', $code = 400) {
    Response::error($message, $code);
}

/**
 * پاکسازی ورودی
 */
function sanitize($value) {
    if (is_array($value)) {
        return array_map('sanitize', $value);
    }
    return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
}

/**
 * ساخت Slug
 */
function make_slug($text) {
    $text = preg_replace('/[^a-zA-Z0-9\s-]/', '', $text);
    $text = strtolower(trim($text));
    $text = preg_replace('/[\s-]+/', '-', $text);
    return $text;
}

/**
 * تولید شماره سفارش (ترتیبی)
 * فرمت: AKB-YYMMDD-XXX
 * مثال: AKB-261003-001 (اولین سفارش امروز)
 *       AKB-261003-002 (دومین سفارش امروز)
 *       AKB-261004-001 (اولین سفارش فردا)
 */
function generate_order_number() {
    $db = Database::getInstance()->getConnection();
    $today = date('ymd');
    $prefix = 'AKB-' . $today . '-';
    
    // آخرین شماره سفارش امروز رو پیدا کن
    $stmt = $db->prepare(
        "SELECT order_number FROM orders 
         WHERE order_number LIKE :prefix 
         ORDER BY id DESC 
         LIMIT 1"
    );
    $stmt->execute(['prefix' => $prefix . '%']);
    $lastOrder = $stmt->fetch();
    
    // اگه سفارش امروز بود، عدد رو +1 کن
    if ($lastOrder) {
        // استخراج سه رقم آخر
        $parts = explode('-', $lastOrder['order_number']);
        $lastNumber = (int)end($parts);
        $nextNumber = $lastNumber + 1;
    } else {
        // اگه اولین سفارش امروز بود، از 1 شروع کن
        $nextNumber = 1;
    }
    
    // اگه از 999 گذشت، به 999 برش بزن (یا می‌تونی 4 رقمی کنی)
    if ($nextNumber > 999) {
        $nextNumber = 999; // یا از فرمت دیگه‌ای استفاده کن
    }
    
    $sequence = str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    return $prefix . $sequence;
}