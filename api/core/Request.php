<?php
/**
 * Request Class
 * مدیریت ورودی‌های درخواست (GET, POST, JSON, Files)
 */

class Request {
    
    /**
     * متد HTTP
     */
    public static function method() {
        return $_SERVER['REQUEST_METHOD'];
    }

    /**
     * مسیر درخواست (بدون query string)
     */
    public static function uri() {
        $uri = $_SERVER['REQUEST_URI'];
        $uri = strtok($uri, '?');
        return $uri;
    }

    /**
     * دریافت ورودی GET
     */
    public static function get($key = null, $default = null) {
        if ($key === null) return $_GET;
        return $_GET[$key] ?? $default;
    }

    /**
     * دریافت ورودی POST
     */
    public static function post($key = null, $default = null) {
        if ($key === null) return $_POST;
        return $_POST[$key] ?? $default;
    }

    /**
     * دریافت JSON body
     */
    public static function json() {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        return $data ?: [];
    }

    /**
     * دریافت همه ورودی‌ها (GET + POST + JSON)
     */
    public static function all() {
        $data = [];
        $data = array_merge($data, $_GET);
        $data = array_merge($data, $_POST);
        $json = self::json();
        if (!empty($json)) {
            $data = array_merge($data, $json);
        }
        return $data;
    }

    /**
     * دریافت ورودی خاص (از هر جا)
     */
    public static function input($key, $default = null) {
        $all = self::all();
        return $all[$key] ?? $default;
    }

    /**
     * دریافت هدر
     */
    public static function header($name) {
        $headers = getallheaders();
        return $headers[$name] ?? null;
    }

    /**
     * دریافت Bearer Token
     */
    public static function bearerToken() {
        $authHeader = self::header('Authorization');
        if ($authHeader && preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /**
     * دریافت فایل‌های آپلود شده
     */
    public static function files() {
        return $_FILES;
    }

    /**
     * چک اینکه درخواست JSON هست یا نه
     */
    public static function isJson() {
        $contentType = self::header('Content-Type');
        return $contentType && strpos($contentType, 'application/json') !== false;
    }
}