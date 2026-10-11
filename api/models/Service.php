<?php
/**
 * Service Model
 * مدیریت داده‌های خدمات
 */

class Service {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * دریافت همه خدمات
     */
    public function getAll($filters = []) {
        $sql = "SELECT * FROM services WHERE 1=1";
        $params = [];

        if (!empty($filters['status'])) {
            $sql .= " AND status = :status";
            $params['status'] = $filters['status'];
        }

        if (!empty($filters['category'])) {
            $sql .= " AND category = :category";
            $params['category'] = $filters['category'];
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (name LIKE :search OR short_desc LIKE :search)";
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
     * دریافت یک خدمت با ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM services WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    /**
     * شمارش کل خدمات
     */
    public function count($filters = []) {
        $sql = "SELECT COUNT(*) as total FROM services WHERE 1=1";
        $params = [];

        if (!empty($filters['status'])) {
            $sql .= " AND status = :status";
            $params['status'] = $filters['status'];
        }
        if (!empty($filters['category'])) {
            $sql .= " AND category = :category";
            $params['category'] = $filters['category'];
        }
        if (!empty($filters['search'])) {
            $sql .= " AND (name LIKE :search OR short_desc LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch();
        return (int)$result['total'];
    }

    /**
     * ایجاد خدمت جدید
     */
    public function create($data) {
        $sql = "INSERT INTO services 
                (name, slug, category, short_desc, full_desc, features, image_path, 
                 status, meta_title, meta_description)
                VALUES 
                (:name, :slug, :category, :short_desc, :full_desc, :features, :image_path,
                 :status, :meta_title, :meta_description)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'name' => $data['name'],
            'slug' => $data['slug'] ?? make_slug($data['name']),
            'category' => $data['category'],
            'short_desc' => $data['short_desc'] ?? '',
            'full_desc' => $data['full_desc'] ?? '',
            'features' => is_array($data['features'] ?? null) 
                            ? implode("\n", $data['features']) 
                            : ($data['features'] ?? ''),
            'image_path' => $data['image_path'] ?? null,
            'status' => $data['status'] ?? 'Active',
            'meta_title' => $data['meta_title'] ?? '',
            'meta_description' => $data['meta_description'] ?? ''
        ]);

        return $this->db->lastInsertId();
    }

    /**
     * به‌روزرسانی خدمت
     */
    public function update($id, $data) {
        $fields = [];
        $params = ['id' => $id];

        $allowed = ['name', 'slug', 'category', 'short_desc', 'full_desc', 
                    'features', 'image_path', 'status', 'meta_title', 'meta_description'];

        foreach ($allowed as $field) {
            if (isset($data[$field])) {
                $value = $data[$field];

                // اگه features آرایه بود، به string تبدیل کن
                if ($field === 'features' && is_array($value)) {
                    $value = implode("\n", $value);
                }

                $fields[] = "$field = :$field";
                $params[$field] = $value;
            }
        }

        if (empty($fields)) return false;

        $sql = "UPDATE services SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    /**
     * حذف خدمت
     */
    public function delete($id) {
        // اول اطلاعات خدمت رو بگیر (برای حذف عکس)
        $service = $this->getById($id);

        // حذف فایل عکس اگه وجود داشت
        if ($service && !empty($service['image_path'])) {
            $filePath = __DIR__ . '/../../' . $service['image_path'];
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }

        $stmt = $this->db->prepare("DELETE FROM services WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }
}