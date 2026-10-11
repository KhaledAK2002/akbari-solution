<?php
/**
 * Product Model
 * مدیریت داده‌های محصولات
 */

class Product {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * دریافت همه محصولات
     */
    public function getAll($filters = []) {
        $sql = "SELECT * FROM products WHERE 1=1";
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
        $products = $stmt->fetchAll();

        foreach ($products as &$product) {
            $product['images'] = $this->getImages($product['id']);
        }

        return $products;
    }

    /**
     * دریافت یک محصول با ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM products WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $product = $stmt->fetch();

        if ($product) {
            $product['images'] = $this->getImages($product['id']);
        }

        return $product;
    }

    /**
     * دریافت عکس‌های محصول
     */
    public function getImages($productId) {
        $stmt = $this->db->prepare(
            "SELECT id, product_id, image_path, is_cover, sort_order 
             FROM product_images 
             WHERE product_id = :product_id 
             ORDER BY is_cover DESC, sort_order ASC, id ASC"
        );
        $stmt->execute(['product_id' => $productId]);
        return $stmt->fetchAll();
    }

    /**
     * دریافت یک عکس با ID
     */
    public function getImageById($imageId) {
        $stmt = $this->db->prepare("SELECT * FROM product_images WHERE id = :id");
        $stmt->execute(['id' => $imageId]);
        return $stmt->fetch();
    }

    /**
     * شمارش کل محصولات
     */
    public function count($filters = []) {
        $sql = "SELECT COUNT(*) as total FROM products WHERE 1=1";
        $params = [];

        if (!empty($filters['status'])) {
            $sql .= " AND status = :status";
            $params['status'] = $filters['status'];
        }
        if (!empty($filters['category'])) {
            $sql .= " AND category = :category";
            $params['category'] = $filters['category'];
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch();
        return (int)$result['total'];
    }

    /**
     * افزودن محصول جدید
     */
    public function create($data) {
        $sql = "INSERT INTO products 
                (name, slug, category, short_desc, full_desc, price, old_price, status, 
                 features, version, file_size, file_format, compatible, language, license,
                 meta_title, meta_description, demo_link, download_link)
                VALUES 
                (:name, :slug, :category, :short_desc, :full_desc, :price, :old_price, :status,
                 :features, :version, :file_size, :file_format, :compatible, :language, :license,
                 :meta_title, :meta_description, :demo_link, :download_link)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'name' => $data['name'],
            'slug' => $data['slug'] ?? make_slug($data['name']),
            'category' => $data['category'],
            'short_desc' => $data['short_desc'] ?? '',
            'full_desc' => $data['full_desc'] ?? '',
            'price' => $data['price'] ?? 0,
            'old_price' => $data['old_price'] ?? 0,
            'status' => $data['status'] ?? 'Active',
            'features' => $data['features'] ?? '',
            'version' => $data['version'] ?? '1.0',
            'file_size' => $data['file_size'] ?? 'N/A',
            'file_format' => $data['file_format'] ?? 'N/A',
            'compatible' => $data['compatible'] ?? 'N/A',
            'language' => $data['language'] ?? 'English',
            'license' => $data['license'] ?? 'Single User',
            'meta_title' => $data['meta_title'] ?? '',
            'meta_description' => $data['meta_description'] ?? '',
            'demo_link' => $data['demo_link'] ?? '',
            'download_link' => $data['download_link'] ?? ''
        ]);

        return $this->db->lastInsertId();
    }

    /**
     * افزودن عکس به محصول
     */
    public function addImage($productId, $imagePath, $isCover = false, $sortOrder = 0) {
        $stmt = $this->db->prepare(
            "INSERT INTO product_images (product_id, image_path, is_cover, sort_order) 
             VALUES (:product_id, :image_path, :is_cover, :sort_order)"
        );
        $stmt->execute([
            'product_id' => $productId,
            'image_path' => $imagePath,
            'is_cover' => $isCover ? 1 : 0,
            'sort_order' => $sortOrder
        ]);
        return $this->db->lastInsertId();
    }

    /**
     * حذف عکس
     */
    public function deleteImage($imageId) {
        $stmt = $this->db->prepare("DELETE FROM product_images WHERE id = :id");
        return $stmt->execute(['id' => $imageId]);
    }

    /**
     * تنظیم عکس به عنوان Cover
     */
    public function setAsCover($imageId) {
        // اول همه cover ها رو صفر کن
        $stmt = $this->db->prepare(
            "UPDATE product_images SET is_cover = 0 
             WHERE product_id = (SELECT product_id FROM product_images WHERE id = :id)"
        );
        $stmt->execute(['id' => $imageId]);

        // بعد این عکس رو cover کن
        $stmt = $this->db->prepare("UPDATE product_images SET is_cover = 1 WHERE id = :id");
        return $stmt->execute(['id' => $imageId]);
    }

    /**
     * حذف محصول
     */
    public function delete($id) {
        // اول عکس‌ها رو حذف کن
        $stmt = $this->db->prepare("DELETE FROM product_images WHERE product_id = :id");
        $stmt->execute(['id' => $id]);

        // بعد محصول
        $stmt = $this->db->prepare("DELETE FROM products WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }

    /**
     * به‌روزرسانی محصول
     */
    public function update($id, $data) {
        $fields = [];
        $params = ['id' => $id];

        $allowed = ['name', 'slug', 'category', 'short_desc', 'full_desc', 'price', 
                    'old_price', 'status', 'features', 'version', 'file_size', 
                    'file_format', 'compatible', 'language', 'license',
                    'meta_title', 'meta_description', 'demo_link', 'download_link'];

        foreach ($allowed as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if (empty($fields)) return false;

        $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }
}