<?php
/**
 * Order Model
 * مدیریت سفارشات
 */

class Order {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * دریافت همه سفارشات
     */
    public function getAll($filters = []) {
        $sql = "SELECT * FROM orders WHERE 1=1";
        $params = [];

        if (!empty($filters['status'])) {
            $sql .= " AND order_status = :status";
            $params['status'] = $filters['status'];
        }

        if (!empty($filters['payment_status'])) {
            $sql .= " AND payment_status = :payment_status";
            $params['payment_status'] = $filters['payment_status'];
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (order_number LIKE :search OR customer_name LIKE :search OR customer_email LIKE :search OR item_name LIKE :search)";
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
     * دریافت یه سفارش با ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM orders WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    /**
     * دریافت یه سفارش با شماره
     */
    public function getByNumber($orderNumber) {
        $stmt = $this->db->prepare("SELECT * FROM orders WHERE order_number = :number LIMIT 1");
        $stmt->execute(['number' => $orderNumber]);
        return $stmt->fetch();
    }

    /**
     * شمارش کل سفارشات
     */
    public function count($filters = []) {
        $sql = "SELECT COUNT(*) as total FROM orders WHERE 1=1";
        $params = [];

        if (!empty($filters['status'])) {
            $sql .= " AND order_status = :status";
            $params['status'] = $filters['status'];
        }

        if (!empty($filters['payment_status'])) {
            $sql .= " AND payment_status = :payment_status";
            $params['payment_status'] = $filters['payment_status'];
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (order_number LIKE :search OR customer_name LIKE :search OR customer_email LIKE :search OR item_name LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch();
        return (int)$result['total'];
    }

    /**
     * آمار سفارشات
     */
    public function getStats() {
        $stmt = $this->db->prepare(
            "SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN order_status = 'new' THEN 1 ELSE 0 END) as new_orders,
                SUM(CASE WHEN order_status = 'processing' THEN 1 ELSE 0 END) as processing,
                SUM(CASE WHEN order_status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as payment_pending,
                SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as payment_paid
             FROM orders"
        );
        $stmt->execute();
        return $stmt->fetch();
    }

    /**
     * شمارش کل سفارشات جدید (برای Badge سایدبار)
     */
    public function countNew() {
        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM orders WHERE order_status = 'new'");
        $stmt->execute();
        $result = $stmt->fetch();
        return (int)$result['total'];
    }

    /**
     * ایجاد سفارش جدید
     */
    public function create($data) {
        // تولید شماره سفارش
        if (empty($data['order_number'])) {
            $data['order_number'] = generate_order_number();
        }

        $sql = "INSERT INTO orders 
                (order_number, customer_name, customer_email, customer_phone, customer_city, customer_note,
                 item_type, item_id, item_name, amount, currency,
                 payment_method, payment_status, order_status)
                VALUES 
                (:order_number, :customer_name, :customer_email, :customer_phone, :customer_city, :customer_note,
                 :item_type, :item_id, :item_name, :amount, :currency,
                 :payment_method, :payment_status, :order_status)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'order_number' => $data['order_number'],
            'customer_name' => $data['customer_name'],
            'customer_email' => $data['customer_email'],
            'customer_phone' => $data['customer_phone'] ?? null,
            'customer_city' => $data['customer_city'] ?? null,
            'customer_note' => $data['customer_note'] ?? null,
            'item_type' => $data['item_type'],
            'item_id' => $data['item_id'],
            'item_name' => $data['item_name'] ?? null,
            'amount' => $data['amount'] ?? 0,
            'currency' => $data['currency'] ?? 'USD',
            'payment_method' => $data['payment_method'] ?? null,
            'payment_status' => $data['payment_status'] ?? 'pending',
            'order_status' => $data['order_status'] ?? 'new'
        ]);

        return $this->db->lastInsertId();
    }

    /**
     * به‌روزرسانی سفارش (status, payment_status, payment_proof)
     */
    public function update($id, $data) {
        $fields = [];
        $params = ['id' => $id];

        $allowed = ['payment_status', 'payment_proof', 'order_status', 'customer_note'];

        foreach ($allowed as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if (empty($fields)) return false;

        $sql = "UPDATE orders SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    /**
     * حذف سفارش
     */
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM orders WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }
}