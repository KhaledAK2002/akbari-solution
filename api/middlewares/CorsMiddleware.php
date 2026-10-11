<?php
/**
 * CORS Middleware
 * مدیریت CORS برای درخواست‌های Frontend
 */

class CorsMiddleware {
    
    public static function handle() {
        // اجازه دسترسی از همه جا (در production محدود کن)
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Max-Age: 86400');

        // اگه درخواست OPTIONS بود، فقط پاسخ بده و خارج شو
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
    }
}