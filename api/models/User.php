<?php
/**
 * User Model
 * مدیریت داده‌های کاربران
 */

class User {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * دریافت همه کاربران
     */
    public function getAll($filters = []) {
        $sql = "SELECT id, name, email, role, status, avatar, phone, location, last_login, created_at, updated_at 
                FROM users WHERE 1=1";
        $params = [];

        if (!empty($filters['role'])) {
            $sql .= " AND role = :role";
            $params['role'] = $filters['role'];
        }

        if (!empty($filters['status'])) {
            $sql .= " AND status = :status";
            $params['status'] = $filters['status'];
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (name LIKE :search OR email LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }

        $sql .= " ORDER BY id ASC";

        if (isset($filters['limit'])) {
            $sql .= " LIMIT :limit OFFSET :offset";
            $params['limit'] = (int)$filters['limit'];
            $params['offset'] = (int)($filters['offset'] ?? 0);
        }

        $stmt = $this->db->prepare($sql);

        foreach ($params as $key => $value) {
            if ($key === 'limit' || $key === 'offset') {
                $stmt->bindValue(':' . $key, $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue(':' . $key, $value);
            }
        }

        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * شمارش کل کاربران
     */
    public function count($filters = []) {
        $sql = "SELECT COUNT(*) as total FROM users WHERE 1=1";
        $params = [];

        if (!empty($filters['role'])) {
            $sql .= " AND role = :role";
            $params['role'] = $filters['role'];
        }

        if (!empty($filters['status'])) {
            $sql .= " AND status = :status";
            $params['status'] = $filters['status'];
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch();
        return (int)$result['total'];
    }

    /**
     * پیدا کردن کاربر با ایمیل
     */
    public function findByEmail($email) {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
        $stmt->execute(['email' => $email]);
        return $stmt->fetch();
    }

    /**
     * پیدا کردن کاربر با ID
     */
    public function findById($id) {
        $stmt = $this->db->prepare(
            "SELECT id, name, email, role, status, avatar, phone, location, last_login, created_at, updated_at 
             FROM users WHERE id = :id LIMIT 1"
        );
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    /**
     * بررسی پسورد
     */
    public function verifyPassword($plainPassword, $hashedPassword) {
        return password_verify($plainPassword, $hashedPassword);
    }

    /**
     * هش کردن پسورد
     */
    public function hashPassword($plainPassword) {
        return password_hash($plainPassword, PASSWORD_BCRYPT);
    }

    /**
     * ساخت کاربر جدید
     */
    public function create($data) {
        // چک تکراری بودن ایمیل
        if ($this->findByEmail($data['email'])) {
            throw new Exception('Email already exists');
        }

        $sql = "INSERT INTO users (name, email, password, role, status, avatar, phone, location)
                VALUES (:name, :email, :password, :role, :status, :avatar, :phone, :location)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $this->hashPassword($data['password']),
            'role' => $data['role'] ?? 'employee',
            'status' => $data['status'] ?? 'active',
            'avatar' => $data['avatar'] ?? 'assets/images/avatar-ahmad.png',
            'phone' => $data['phone'] ?? null,
            'location' => $data['location'] ?? null
        ]);

        return $this->db->lastInsertId();
    }

    /**
     * به‌روزرسانی کاربر
     */
    public function update($id, $data) {
        $fields = [];
        $params = ['id' => $id];

        $allowed = ['name', 'email', 'role', 'status', 'avatar', 'phone', 'location'];

        foreach ($allowed as $field) {
            if (isset($data[$field])) {
                // اگه ایمیل داره تغییر می‌کنه، چک تکراری نبودن
                if ($field === 'email') {
                    $existing = $this->findByEmail($data['email']);
                    if ($existing && $existing['id'] != $id) {
                        throw new Exception('Email already in use by another user');
                    }
                }

                $fields[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        // اگه پسورد جدید داده شده
        if (!empty($data['password'])) {
            $fields[] = "password = :password";
            $params['password'] = $this->hashPassword($data['password']);
        }

        if (empty($fields)) return false;

        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    /**
     * به‌روزرسانی پسورد
     */
    public function updatePassword($id, $newPassword) {
        $hash = $this->hashPassword($newPassword);
        $stmt = $this->db->prepare("UPDATE users SET password = :password WHERE id = :id");
        return $stmt->execute(['password' => $hash, 'id' => $id]);
    }

    /**
     * به‌روزرسانی زمان آخرین ورود
     */
    public function updateLastLogin($id) {
        $stmt = $this->db->prepare("UPDATE users SET last_login = NOW() WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }

    /**
     * حذف کاربر
     */
    public function delete($id) {
        // جلوگیری از حذف Super Admin اصلی
        $user = $this->findById($id);
        if ($user && $user['role'] === 'super_admin' && $id == 1) {
            throw new Exception('Cannot delete the main Super Administrator');
        }

        $stmt = $this->db->prepare("DELETE FROM users WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }

    /**
     * بررسی فعال بودن کاربر
     */
    public function isActive($user) {
        return isset($user['status']) && $user['status'] === 'active';
    }

    /**
     * شمارش کاربران بر اساس نقش
     */
    public function countByRole() {
        $stmt = $this->db->prepare(
            "SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN role = 'super_admin' THEN 1 ELSE 0 END) as super_admins,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
                SUM(CASE WHEN role = 'employee' THEN 1 ELSE 0 END) as employees,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users
             FROM users"
        );
        $stmt->execute();
        return $stmt->fetch();
    }
}