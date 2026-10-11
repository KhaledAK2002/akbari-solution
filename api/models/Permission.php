<?php
/**
 * Permission Model
 * مدیریت دسترسی‌ها (Flat structure)
 */

class Permission {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * دریافت همه permissions برای یه role
     */
    public function getByRole($role) {
        $stmt = $this->db->prepare(
            "SELECT section, can_view, can_add, can_edit, can_delete 
             FROM permissions WHERE role = :role"
        );
        $stmt->execute(['role' => $role]);
        $rows = $stmt->fetchAll();

        // تبدیل به ساختار object
        $result = [];
        foreach ($rows as $row) {
            $result[$row['section']] = [
                'view' => (bool)$row['can_view'],
                'add' => (bool)$row['can_add'],
                'edit' => (bool)$row['can_edit'],
                'delete' => (bool)$row['can_delete']
            ];
        }
        return $result;
    }

    /**
     * دریافت permissions برای یه user خاص
     * (شامل permissions از role + override های user)
     */
    public function getForUser($userId) {
        // اول role user رو بگیر
        $stmt = $this->db->prepare("SELECT role FROM users WHERE id = :id");
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch();

        if (!$user) return [];

        // بعد permissions role رو بگیر
        $rolePermissions = $this->getByRole($user['role']);

        // چک override های user (اگه هستن — توی جدول با role = 'user_1')
        $userOverrides = $this->getByRole('user_' . $userId);

        // Merge (user overrides role)
        return array_merge($rolePermissions, $userOverrides);
    }

    /**
     * ذخیره permissions برای یه role
     */
    public function saveForRole($role, $permissions) {
        // اول همه رو پاک کن
        $stmt = $this->db->prepare("DELETE FROM permissions WHERE role = :role");
        $stmt->execute(['role' => $role]);

        // بعد همه رو ذخیره کن
        return $this->insertPermissions($role, $permissions);
    }

    /**
     * ذخیره permissions برای یه user خاص
     */
    public function saveForUser($userId, $permissions) {
        $role = 'user_' . $userId;

        // اول همه رو پاک کن
        $stmt = $this->db->prepare("DELETE FROM permissions WHERE role = :role");
        $stmt->execute(['role' => $role]);

        // بعد همه رو ذخیره کن
        return $this->insertPermissions($role, $permissions);
    }

    /**
     * درج چند permission
     */
    private function insertPermissions($role, $permissions) {
        if (empty($permissions)) return true;

        $sql = "INSERT INTO permissions (role, section, can_view, can_add, can_edit, can_delete)
                VALUES (:role, :section, :can_view, :can_add, :can_edit, :can_delete)";
        $stmt = $this->db->prepare($sql);

        foreach ($permissions as $section => $perms) {
            $stmt->execute([
                'role' => $role,
                'section' => $section,
                'can_view' => !empty($perms['view']) ? 1 : 0,
                'can_add' => !empty($perms['add']) ? 1 : 0,
                'can_edit' => !empty($perms['edit']) ? 1 : 0,
                'can_delete' => !empty($perms['delete']) ? 1 : 0
            ]);
        }

        return true;
    }

    /**
     * حذف permissions یه user (وقتی کاربر حذف میشه)
     */
    public function deleteForUser($userId) {
        $stmt = $this->db->prepare("DELETE FROM permissions WHERE role = :role");
        return $stmt->execute(['role' => 'user_' . $userId]);
    }

    /**
     * دریافت همه permissions (برای همه role ها)
     */
    public function getAll() {
        $stmt = $this->db->prepare("SELECT * FROM permissions ORDER BY role, section");
        $stmt->execute();
        $rows = $stmt->fetchAll();

        // گروه‌بندی بر اساس role
        $result = [];
        foreach ($rows as $row) {
            $role = $row['role'];
            $section = $row['section'];

            if (!isset($result[$role])) {
                $result[$role] = [];
            }

            $result[$role][$section] = [
                'view' => (bool)$row['can_view'],
                'add' => (bool)$row['can_add'],
                'edit' => (bool)$row['can_edit'],
                'delete' => (bool)$row['can_delete']
            ];
        }

        return $result;
    }

    /**
     * پاک کردن permissions یه role
     */
    public function deleteForRole($role) {
        $stmt = $this->db->prepare("DELETE FROM permissions WHERE role = :role");
        return $stmt->execute(['role' => $role]);
    }
}