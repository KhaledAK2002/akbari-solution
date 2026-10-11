<?php
/**
 * Response Class
 * ارسال پاسخ‌های JSON استاندارد
 */

class Response {
    
    /**
     * پاسخ موفق
     */
    public static function success($data = null, $message = 'Success', $code = 200) {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * پاسخ خطا
     */
    public static function error($message = 'Error', $code = 400, $errors = null) {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * پاسخ بدون داده
     */
    public static function noContent() {
        http_response_code(204);
        exit;
    }

    /**
     * پاسخ با کد و پیام سفارشی
     */
    public static function json($data, $code = 200) {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}