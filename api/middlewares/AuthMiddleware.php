<?php
/**
 * Auth Middleware
 * چک توکن JWT
 */

class AuthMiddleware {
    
    /**
     * احراز هویت کاربر
     */
    public static function authenticate() {
        $token = Request::bearerToken();

        // ⚠️ اگه از هدر نبود، از URL بخون
        if (!$token) {
            $token = $_GET['token'] ?? null;
        }

        if (!$token) {
            return null;
        }

        $payload = JWT::decode($token);

        return $payload;
    }

    /**
     * اجبار به احراز هویت
     */
    public static function require() {
        $user = self::authenticate();

        if (!$user) {
            Response::error('Unauthorized - Please login', 401);
        }

        return $user;
    }

    /**
     * اجبار به نقش خاص
     */
    public static function requireRole($roles = []) {
        $user = self::require();

        if (!in_array($user['role'], $roles)) {
            Response::error('Forbidden - Insufficient permissions', 403);
        }

        return $user;
    }

    /**
     * اجبار به ادمین بودن
     */
    public static function requireAdmin() {
        return self::requireRole(['super_admin', 'admin']);
    }

    /**
     * اجبار به Super Admin بودن
     */
    public static function requireSuperAdmin() {
        return self::requireRole(['super_admin']);
    }

    /**
     * ⚠️ جدید: اجبار به داشتن permission خاص
     * 
     * @param string $section نام بخش (products, services, messages, ...)
     * @param string $action نوع دسترسی (view, add, edit, delete)
     */
    public static function requirePermission($section, $action = 'view') {
        $user = self::require();
        
        // ⚠️ Super Admin → همه چیز
        if ($user['role'] === 'super_admin') {
            return $user;
        }
        
        // ⚠️ Admin → همه چیز (اگه می‌خوای admin هم محدود بشه، این بلاک رو حذف کن)
        if ($user['role'] === 'admin') {
            return $user;
        }
        
        // ⚠️ Employee → چک permissions از دیتابیس
        $permissionModel = new Permission();
        $permissions = $permissionModel->getForUser($user['user_id']);
        
        // اگه این permission رو نداره، رد کن
        if (!isset($permissions[$section]) || !$permissions[$section][$action]) {
            Response::error('Forbidden - Insufficient permissions', 403);
        }
        
        return $user;
    }
}