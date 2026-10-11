<?php
/**
 * User Controller
 * مدیریت API کاربران
 */

class UserController {
    private $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    /**
     * GET /api/v1/users
     */
    public function index() {
        AuthMiddleware::requirePermission('users', 'view');

        $filters = [
            'role' => Request::get('role'),
            'status' => Request::get('status'),
            'search' => Request::get('search'),
        ];

        $page = (int)Request::get('page', 1);
        $perPage = (int)Request::get('per_page', 50);
        $filters['limit'] = $perPage;
        $filters['offset'] = ($page - 1) * $perPage;

        $filters = array_filter($filters, function($v) {
            return $v !== null && $v !== '';
        });

        try {
            $users = $this->userModel->getAll($filters);
            $total = $this->userModel->count($filters);

            Response::success([
                'users' => $users,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'total_pages' => ceil($total / $perPage)
                ]
            ], 'Users fetched successfully');

        } catch (Exception $e) {
            Response::error('Failed to fetch users: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/users/stats
     */
    public function stats() {
        AuthMiddleware::requirePermission('users', 'view');

        try {
            $stats = $this->userModel->countByRole();
            Response::success($stats, 'Stats fetched successfully');

        } catch (Exception $e) {
            Response::error('Failed to fetch stats: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/users/{id}
     */
    public function show($id) {
        AuthMiddleware::requirePermission('users', 'view');

        try {
            $user = $this->userModel->findById($id);

            if (!$user) {
                Response::error('User not found', 404);
            }

            Response::success($user, 'User fetched successfully');

        } catch (Exception $e) {
            Response::error('Failed to fetch user: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/users
     */
    public function store() {
        $currentUser = AuthMiddleware::requirePermission('users', 'add');

        $data = Request::json();

        if (empty($data['name'])) {
            Response::error('Name is required', 400);
        }
        if (empty($data['email'])) {
            Response::error('Email is required', 400);
        }
        if (empty($data['password'])) {
            Response::error('Password is required', 400);
        }
        if (strlen($data['password']) < 6) {
            Response::error('Password must be at least 6 characters', 400);
        }
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            Response::error('Invalid email address', 400);
        }

        // فقط Super Admin میتونه Super Admin بسازه
        if (!empty($data['role']) && $data['role'] === 'super_admin') {
            if ($currentUser['role'] !== 'super_admin') {
                Response::error('Only Super Admin can create Super Admin accounts', 403);
            }
        }

        // چک کردن آواتار Base64 → آپلود به سرور
        if (!empty($data['avatar']) && strpos($data['avatar'], 'data:image') === 0) {
            $avatarPath = $this->saveAvatar($data['avatar']);
            if ($avatarPath) {
                $data['avatar'] = $avatarPath;
            } else {
                unset($data['avatar']);
            }
        }

        try {
            $userId = $this->userModel->create($data);
            $user = $this->userModel->findById($userId);

            Response::success($user, 'User created successfully', 201);

        } catch (Exception $e) {
            Response::error('Failed to create user: ' . $e->getMessage(), 400);
        }
    }

    /**
     * PUT /api/v1/users/{id}
     */
    public function update($id) {
        $currentUser = AuthMiddleware::requirePermission('users', 'edit');

        $data = Request::json();

        $existing = $this->userModel->findById($id);
        if (!$existing) {
            Response::error('User not found', 404);
        }

        // جلوگیری از تغییر Super Admin اصلی توسط غیر Super Admin
        if ($id == 1 && $currentUser['role'] !== 'super_admin') {
            Response::error('Cannot modify main Super Administrator', 403);
        }

        // جلوگیری از تغییر نقش Super Admin اصلی
        if ($id == 1 && !empty($data['role']) && $data['role'] !== 'super_admin') {
            Response::error('Cannot change Super Administrator role', 403);
        }

        // فقط Super Admin میتونه نقش super_admin بده
        if (!empty($data['role']) && $data['role'] === 'super_admin' && $currentUser['role'] !== 'super_admin') {
            Response::error('Only Super Admin can assign Super Admin role', 403);
        }

        // چک کردن آواتار Base64 → آپلود به سرور
        if (!empty($data['avatar']) && strpos($data['avatar'], 'data:image') === 0) {
            $avatarPath = $this->saveAvatar($data['avatar']);
            if ($avatarPath) {
                $data['avatar'] = $avatarPath;
            } else {
                unset($data['avatar']);
            }
        }

        try {
            $this->userModel->update($id, $data);
            $user = $this->userModel->findById($id);

            Response::success($user, 'User updated successfully');

        } catch (Exception $e) {
            Response::error('Failed to update user: ' . $e->getMessage(), 400);
        }
    }

    /**
     * DELETE /api/v1/users/{id}
     */
    public function destroy($id) {
        $currentUser = AuthMiddleware::requirePermission('users', 'delete');

        // نمیشه خودت رو حذف کنی
        if ($id == $currentUser['user_id']) {
            Response::error('You cannot delete your own account', 400);
        }

        // نمیشه Super Admin اصلی رو حذف کنی
        if ($id == 1) {
            Response::error('Cannot delete main Super Administrator', 403);
        }

        $existing = $this->userModel->findById($id);
        if (!$existing) {
            Response::error('User not found', 404);
        }

        // فقط Super Admin میتونه Super Admin حذف کنه
        if ($existing['role'] === 'super_admin' && $currentUser['role'] !== 'super_admin') {
            Response::error('Only Super Admin can delete Super Admin accounts', 403);
        }

        try {
            $this->userModel->delete($id);
            Response::success(null, 'User deleted successfully');

        } catch (Exception $e) {
            Response::error('Failed to delete user: ' . $e->getMessage(), 400);
        }
    }

    /**
     * ذخیره آواتار از Base64
     */
    private function saveAvatar($base64Data) {
        if (!preg_match('/^data:image\/(\w+);base64,/', $base64Data, $matches)) {
            return null;
        }

        $ext = strtolower($matches[1]);
        if ($ext === 'jpeg') $ext = 'jpg';

        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            return null;
        }

        $data = substr($base64Data, strpos($base64Data, ',') + 1);
        $data = base64_decode($data);

        if ($data === false) {
            return null;
        }

        if (strlen($data) > 2 * 1024 * 1024) {
            return null;
        }

        $uploadDir = __DIR__ . '/../../uploads/avatars/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $filename = 'avatar_' . uniqid() . '_' . time() . '.' . $ext;
        $filePath = $uploadDir . $filename;

        if (file_put_contents($filePath, $data) === false) {
            return null;
        }

        return 'uploads/avatars/' . $filename;
    }
}