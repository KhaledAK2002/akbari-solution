<?php
/**
 * Media Model
 * مدیریت فایل‌های رسانه‌ای
 */

class Media {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * دریافت همه فایل‌ها
     */
    public function getAll($filters = []) {
        $sql = "SELECT * FROM media WHERE 1=1";
        $params = [];

        if (!empty($filters['file_type'])) {
            $sql .= " AND file_type = :file_type";
            $params['file_type'] = $filters['file_type'];
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (file_name LIKE :search OR alt_text LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }

        $sql .= " ORDER BY id DESC";

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
     * دریافت یه فایل با ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM media WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    /**
     * شمارش کل فایل‌ها
     */
    public function count($filters = []) {
        $sql = "SELECT COUNT(*) as total FROM media WHERE 1=1";
        $params = [];

        if (!empty($filters['file_type'])) {
            $sql .= " AND file_type = :file_type";
            $params['file_type'] = $filters['file_type'];
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (file_name LIKE :search OR alt_text LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch();
        return (int)$result['total'];
    }

    /**
     * آمار فایل‌ها
     */
    public function getStats() {
        $stmt = $this->db->prepare(
            "SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN file_type = 'image' THEN 1 ELSE 0 END) as images,
                SUM(CASE WHEN file_type = 'document' THEN 1 ELSE 0 END) as documents,
                SUM(CASE WHEN file_type NOT IN ('image', 'document') THEN 1 ELSE 0 END) as others,
                SUM(file_size) as total_size
             FROM media"
        );
        $stmt->execute();
        $result = $stmt->fetch();

        $result['total_size'] = (int)$result['total_size'];

        return $result;
    }

    /**
     * ایجاد فایل جدید
     */
    public function create($data) {
        $sql = "INSERT INTO media 
                (file_name, file_path, file_type, file_size, mime_type, dimensions, alt_text, uploaded_by)
                VALUES 
                (:file_name, :file_path, :file_type, :file_size, :mime_type, :dimensions, :alt_text, :uploaded_by)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'file_name' => $data['file_name'],
            'file_path' => $data['file_path'],
            'file_type' => $data['file_type'],
            'file_size' => $data['file_size'],
            'mime_type' => $data['mime_type'] ?? null,
            'dimensions' => $data['dimensions'] ?? null,
            'alt_text' => $data['alt_text'] ?? null,
            'uploaded_by' => $data['uploaded_by'] ?? null
        ]);

        return $this->db->lastInsertId();
    }

    /**
     * به‌روزرسانی فایل (نام و alt)
     */
    public function update($id, $data) {
        $fields = [];
        $params = ['id' => $id];

        $allowed = ['file_name', 'alt_text'];

        foreach ($allowed as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if (empty($fields)) return false;

        $sql = "UPDATE media SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    /**
     * حذف فایل
     */
    public function delete($id) {
        $media = $this->getById($id);
        if (!$media) return false;

        // حذف فایل از سرور
        $filePath = __DIR__ . '/../../' . $media['file_path'];
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        $stmt = $this->db->prepare("DELETE FROM media WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }
}