<?php
/**
 * Permission Controller
 * مدیریت API دسترسی‌ها
 */

class PermissionController {
    private $permissionModel;

    public function __construct() {
        $this->permissionModel = new Permission();
    }

    /**
     * GET /api/v1/permissions
     * دریافت همه permissions (فقط ادمین)
     */
    public function index() {
        AuthMiddleware::requireAdmin();

        try {
            $permissions = $this->permissionModel->getAll();
            Response::success($permissions, 'Permissions fetched successfully');
        } catch (Exception $e) {
            Response::error('Failed to fetch permissions: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/permissions/role/{role}
     * دریافت permissions یه role (فقط ادمین)
     */
    public function byRole($role) {
        AuthMiddleware::requireAdmin();

        try {
            $permissions = $this->permissionModel->getByRole($role);
            Response::success([
                'role' => $role,
                'permissions' => $permissions
            ], 'Permissions fetched successfully');
        } catch (Exception $e) {
            Response::error('Failed to fetch permissions: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/permissions/user/{userId}
     * دریافت permissions یه کاربر (فقط ادمین)
     */
    public function byUser($userId) {
        // ⚠️ فقط لاگین باشه کافیه (نه admin)
        $currentUser = AuthMiddleware::require();
        
        // ⚠️ هر کاربری فقط می‌تونه permissions خودش رو ببینه
        // (مگر ادمین که همه رو می‌تونه ببینه)
        $isAdmin = in_array($currentUser['role'], ['super_admin', 'admin']);
        $isOwnProfile = (int)$currentUser['user_id'] === (int)$userId;
        
        if (!$isAdmin && !$isOwnProfile) {
            Response::error('Forbidden', 403);
        }
        
        try {
            $permissions = $this->permissionModel->getForUser($userId);
            Response::success([
                'user_id' => $userId,
                'permissions' => $permissions
            ], 'Permissions fetched successfully');
        } catch (Exception $e) {
            Response::error('Failed to fetch permissions: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/permissions/role
     * ذخیره permissions یه role (فقط Super Admin)
     * Body: { role: "admin", permissions: { dashboard: {...}, ... } }
     */
    public function saveForRole() {
        $currentUser = AuthMiddleware::requireSuperAdmin();

        $data = Request::json();

        if (empty($data['role'])) {
            Response::error('Role is required', 400);
        }
        if (!isset($data['permissions']) || !is_array($data['permissions'])) {
            Response::error('Permissions array is required', 400);
        }

        // جلوگیری از تغییر Super Admin
        if ($data['role'] === 'super_admin' && $currentUser['role'] !== 'super_admin') {
            Response::error('Only Super Admin can modify Super Admin permissions', 403);
        }

        try {
            $this->permissionModel->saveForRole($data['role'], $data['permissions']);
            $permissions = $this->permissionModel->getByRole($data['role']);

            Response::success([
                'role' => $data['role'],
                'permissions' => $permissions
            ], 'Permissions saved successfully');

        } catch (Exception $e) {
            Response::error('Failed to save permissions: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/permissions/user
     * ذخیره permissions یه کاربر خاص (فقط ادمین)
     * Body: { user_id: 3, permissions: { dashboard: {...}, ... } }
     */
    public function saveForUser() {
        AuthMiddleware::requireAdmin();

        $data = Request::json();

        if (empty($data['user_id'])) {
            Response::error('User ID is required', 400);
        }
        if (!isset($data['permissions']) || !is_array($data['permissions'])) {
            Response::error('Permissions array is required', 400);
        }

        try {
            $this->permissionModel->saveForUser($data['user_id'], $data['permissions']);
            $permissions = $this->permissionModel->getForUser($data['user_id']);

            Response::success([
                'user_id' => $data['user_id'],
                'permissions' => $permissions
            ], 'Permissions saved successfully');

        } catch (Exception $e) {
            Response::error('Failed to save permissions: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/permissions/copy-from-role
     * کپی permissions از role به user
     * Body: { user_id: 3, role: "admin" }
     */
    public function copyFromRole() {
        AuthMiddleware::requireAdmin();

        $data = Request::json();

        if (empty($data['user_id']) || empty($data['role'])) {
            Response::error('User ID and Role are required', 400);
        }

        try {
            $rolePermissions = $this->permissionModel->getByRole($data['role']);
            
            if (empty($rolePermissions)) {
                Response::error('No permissions found for role: ' . $data['role'], 404);
            }

            $this->permissionModel->saveForUser($data['user_id'], $rolePermissions);
            $permissions = $this->permissionModel->getForUser($data['user_id']);

            Response::success([
                'user_id' => $data['user_id'],
                'permissions' => $permissions
            ], 'Permissions copied successfully');

        } catch (Exception $e) {
            Response::error('Failed to copy permissions: ' . $e->getMessage(), 500);
        }
    }
}