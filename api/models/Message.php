<?php
/**
 * Message Model
 * مدیریت داده‌های پیام‌های تماس
 */

class Message {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * دریافت همه پیام‌ها (برای ادمین)
     */
    public function getAll($filters = []) {
        $sql = "SELECT * FROM messages WHERE 1=1";
        $params = [];

        // فیلتر وضعیت
        if (!empty($filters['status'])) {
            $sql .= " AND status = :status";
            $params['status'] = $filters['status'];
        }

        // جستجو
        if (!empty($filters['search'])) {
            $sql .= " AND (name LIKE :search OR email LIKE :search OR subject LIKE :search OR message LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }

        $sql .= " ORDER BY id DESC";

        // صفحه‌بندی
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
     * دریافت یک پیام با ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM messages WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    /**
     * شمارش کل پیام‌ها
     */
    public function count($filters = []) {
        $sql = "SELECT COUNT(*) as total FROM messages WHERE 1=1";
        $params = [];

        if (!empty($filters['status'])) {
            $sql .= " AND status = :status";
            $params['status'] = $filters['status'];
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (name LIKE :search OR email LIKE :search OR subject LIKE :search OR message LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch();
        return (int)$result['total'];
    }

    /**
     * شمارش پیام‌های خوانده‌نشده
     */
    public function countUnread() {
        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM messages WHERE status = 'unread'");
        $stmt->execute();
        $result = $stmt->fetch();
        return (int)$result['total'];
    }

    /**
     * شمارش بر اساس وضعیت
     */
    public function countByStatus() {
        $stmt = $this->db->prepare(
            "SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END) as unread,
                SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied,
                SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived
             FROM messages"
        );
        $stmt->execute();
        return $stmt->fetch();
    }

    /**
     * ایجاد پیام جدید
     */
    public function create($data) {
        $sql = "INSERT INTO messages (name, email, phone, subject, message, status)
                VALUES (:name, :email, :phone, :subject, :message, :status)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? '',
            'subject' => $data['subject'],
            'message' => $data['message'],
            'status' => $data['status'] ?? 'unread'
        ]);

        return $this->db->lastInsertId();
    }

    /**
     * به‌روزرسانی پیام (وضعیت و یادداشت)
     */
    public function update($id, $data) {
        $fields = [];
        $params = ['id' => $id];

        $allowed = ['status', 'note'];

        foreach ($allowed as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if (empty($fields)) return false;

        $sql = "UPDATE messages SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    /**
     * علامت‌گذاری به عنوان خوانده‌شده
     */
    public function markAsRead($id) {
        $stmt = $this->db->prepare("UPDATE messages SET status = 'read' WHERE id = :id AND status = 'unread'");
        return $stmt->execute(['id' => $id]);
    }

    /**
     * حذف پیام
     */
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM messages WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }
}