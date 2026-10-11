<?php
/**
 * Auth Controller
 * مدیریت احراز هویت
 */

class AuthController {
    private $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    /**
     * POST /api/v1/auth/login
     * ورود کاربر
     */
    public function login() {
        $email = trim(Request::input('email', ''));
        $password = Request::input('password', '');

        // اعتبارسنجی
        if (empty($email) || empty($password)) {
            Response::error('Email and password are required', 400);
        }

        // پیدا کردن کاربر
        $user = $this->userModel->findByEmail($email);

        if (!$user) {
            Response::error('Invalid email or password', 401);
        }

        // بررسی پسورد
        if (!$this->userModel->verifyPassword($password, $user['password'])) {
            Response::error('Invalid email or password', 401);
        }

        // بررسی فعال بودن
        if (!$this->userModel->isActive($user)) {
            Response::error('Account is inactive', 403);
        }

        // به‌روزرسانی آخرین ورود
        $this->userModel->updateLastLogin($user['id']);

        // ساخت توکن
        $token = JWT::generateForUser($user);

        // حذف پسورد از پاسخ
        unset($user['password']);

        Response::success([
            'token' => $token,
            'user' => $user
        ], 'Login successful');
    }

    /**
     * GET /api/v1/auth/me
     * اطلاعات کاربر جاری
     */
    public function me() {
        $user = AuthMiddleware::authenticate();
        
        if (!$user) {
            Response::error('Unauthorized', 401);
        }

        $fullUser = $this->userModel->findById($user['user_id']);
        
        if (!$fullUser) {
            Response::error('User not found', 404);
        }

        Response::success($fullUser, 'User info fetched');
    }

    /**
     * POST /api/v1/auth/logout
     * خروج (توکن رو از سمت Frontend پاک می‌کنه)
     */
    public function logout() {
        Response::success(null, 'Logout successful');
    }

    /**
     * POST /api/v1/auth/change-password
     * تغییر پسورد
     */
    public function changePassword() {
        $user = AuthMiddleware::authenticate();
        
        if (!$user) {
            Response::error('Unauthorized', 401);
        }

        $currentPassword = Request::input('current_password', '');
        $newPassword = Request::input('new_password', '');

        if (empty($currentPassword) || empty($newPassword)) {
            Response::error('Current and new password are required', 400);
        }

        if (strlen($newPassword) < 6) {
            Response::error('New password must be at least 6 characters', 400);
        }

        // پیدا کردن کاربر کامل (با پسورد)
        $fullUser = $this->userModel->findByEmail($user['email']);

        if (!$fullUser || !$this->userModel->verifyPassword($currentPassword, $fullUser['password'])) {
            Response::error('Current password is incorrect', 401);
        }

        // تغییر پسورد
        $this->userModel->updatePassword($user['user_id'], $newPassword);

        Response::success(null, 'Password changed successfully');
    }
}