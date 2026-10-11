<?php
/**
 * Activity Log Model
 * مدیریت لاگ فعالیت‌ها
 */

class ActivityLog {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * دریافت همه لاگ‌ها
     */
    public function getAll($filters = []) {
        $sql = "SELECT al.*, u.avatar as user_avatar 
                FROM activity_log al 
                LEFT JOIN users u ON al.user_id = u.id 
                WHERE 1=1";
        $params = [];

        if (!empty($filters['type'])) {
            $sql .= " AND al.type = :type";
            $params['type'] = $filters['type'];
        }

        if (!empty($filters['user_id'])) {
            $sql .= " AND al.user_id = :user_id";
            $params['user_id'] = $filters['user_id'];
        }

        if (!empty($filters['action'])) {
            $sql .= " AND al.action = :action";
            $params['action'] = $filters['action'];
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (al.user_name LIKE :search OR al.description LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }

        $sql .= " ORDER BY al.id DESC";

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
     * شمارش لاگ‌ها
     */
    public function count($filters = []) {
        $sql = "SELECT COUNT(*) as total FROM activity_log WHERE 1=1";
        $params = [];

        if (!empty($filters['type'])) {
            $sql .= " AND type = :type";
            $params['type'] = $filters['type'];
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (user_name LIKE :search OR description LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch();
        return (int)$result['total'];
    }

    /**
     * ایجاد لاگ جدید
     */
    public function create($data) {
        $sql = "INSERT INTO activity_log 
                (user_id, user_name, action, description, type, ip_address)
                VALUES 
                (:user_id, :user_name, :action, :description, :type, :ip_address)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'user_id' => $data['user_id'] ?? null,
            'user_name' => $data['user_name'] ?? 'System',
            'action' => $data['action'] ?? 'unknown',
            'description' => $data['description'] ?? '',
            'type' => $data['type'] ?? 'info',
            'ip_address' => $data['ip_address'] ?? null
        ]);

        return $this->db->lastInsertId();
    }

    /**
     * دریافت لاگ با ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM activity_log WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    /**
     * حذف لاگ
     */
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM activity_log WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }

    /**
     * پاک کردن همه لاگ‌ها
     */
    public function clearAll() {
        $stmt = $this->db->prepare("DELETE FROM activity_log");
        return $stmt->execute();
    }

    /**
     * پاک کردن لاگ‌های قدیمی (بیشتر از X روز)
     */
    public function cleanOld($days = 30) {
        $sql = "DELETE FROM activity_log WHERE created_at < DATE_SUB(NOW(), INTERVAL :days DAY)";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':days', $days, PDO::PARAM_INT);
        return $stmt->execute();
    }

    /**
     * آمار لاگ‌ها
     */
    public function getStats() {
        $stmt = $this->db->prepare(
            "SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN type = 'success' THEN 1 ELSE 0 END) as success_count,
                SUM(CASE WHEN type = 'info' THEN 1 ELSE 0 END) as info_count,
                SUM(CASE WHEN type = 'warning' THEN 1 ELSE 0 END) as warning_count,
                SUM(CASE WHEN type = 'danger' THEN 1 ELSE 0 END) as danger_count,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_count
             FROM activity_log"
        );
        $stmt->execute();
        return $stmt->fetch();
    }
}