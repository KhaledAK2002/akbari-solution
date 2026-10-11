<?php
/**
 * Payment Method Model
 * مدیریت روش‌های پرداخت
 */

class PaymentMethod {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * دریافت همه روش‌های پرداخت
     */
    public function getAll($filters = []) {
        $sql = "SELECT * FROM payment_methods WHERE 1=1";
        $params = [];

        if (isset($filters['enabled'])) {
            $sql .= " AND enabled = :enabled";
            $params['enabled'] = (int)$filters['enabled'];
        }

        if (isset($filters['show_on_checkout'])) {
            $sql .= " AND show_on_checkout = :show_on_checkout";
            $params['show_on_checkout'] = (int)$filters['show_on_checkout'];
        }

        $sql .= " ORDER BY sort_order ASC, id ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * دریافت یک روش پرداخت با ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM payment_methods WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    /**
     * دریافت یک روش پرداخت با method_key
     */
    public function getByKey($key) {
        $stmt = $this->db->prepare("SELECT * FROM payment_methods WHERE method_key = :key LIMIT 1");
        $stmt->execute(['key' => $key]);
        return $stmt->fetch();
    }

    /**
     * دریافت روش پیش‌فرض
     */
    public function getDefault() {
        $stmt = $this->db->prepare("SELECT * FROM payment_methods WHERE is_default = 1 LIMIT 1");
        $stmt->execute();
        return $stmt->fetch();
    }

    /**
     * ایجاد روش پرداخت
     */
    public function create($data) {
        // چک تکراری نبودن method_key
        if (!empty($data['method_key']) && $this->getByKey($data['method_key'])) {
            throw new Exception('Method key already exists');
        }

        $sql = "INSERT INTO payment_methods 
                (method_key, name, logo, account_name, account_number, account_phone, account_type, 
                currency, instructions, qr_code, enabled, show_on_checkout, is_default, 
                sort_order, order_email, send_email_notification)
                VALUES 
                (:method_key, :name, :logo, :account_name, :account_number, :account_phone, :account_type,
                :currency, :instructions, :qr_code, :enabled, :show_on_checkout, 
                :is_default, :sort_order, :order_email, :send_email_notification)";


        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'method_key' => $data['method_key'],
            'name' => $data['name'] ?? null,
            'logo' => $data['logo'] ?? null,
            'account_name' => $data['account_name'] ?? null,
            'account_number' => $data['account_number'] ?? null,
            'account_phone' => $data['account_phone'] ?? null,
            'account_type' => $data['account_type'] ?? 'Personal',
            'currency' => $data['currency'] ?? 'AFN',
            'instructions' => $data['instructions'] ?? null,
            'qr_code' => $data['qr_code'] ?? null,
            'enabled' => isset($data['enabled']) ? (int)$data['enabled'] : 1,
            'show_on_checkout' => isset($data['show_on_checkout']) ? (int)$data['show_on_checkout'] : 1,
            'is_default' => isset($data['is_default']) ? (int)$data['is_default'] : 0,
            'sort_order' => isset($data['sort_order']) ? (int)$data['sort_order'] : 0,
            'order_email' => $data['order_email'] ?? null,
            'send_email_notification' => isset($data['send_email_notification']) ? (int)$data['send_email_notification'] : 1
        ]);

        return $this->db->lastInsertId();
    }

    /**
     * به‌روزرسانی روش پرداخت
     */
    public function update($id, $data) {
        $fields = [];
        $params = ['id' => $id];

        $allowed = [
            'method_key', 'name', 'logo', 'account_name', 'account_number', 'account_phone', 
            'account_type', 'currency', 'instructions', 'qr_code', 'enabled', 'show_on_checkout', 
            'is_default', 'sort_order', 'order_email', 'send_email_notification'
        ];


        foreach ($allowed as $field) {
            if (isset($data[$field])) {
                // اگه method_key داره تغییر می‌کنه، چک تکراری نبودن
                if ($field === 'method_key') {
                    $existing = $this->getByKey($data['method_key']);
                    if ($existing && $existing['id'] != $id) {
                        throw new Exception('Method key already in use');
                    }
                }

                $fields[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if (empty($fields)) return false;

        $sql = "UPDATE payment_methods SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    /**
     * حذف روش پرداخت
     */
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM payment_methods WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }

    /**
     * تنظیم به عنوان پیش‌فرض
     * (بقیه رو غیرپیش‌فرض میکنه)
     */
    public function setAsDefault($id) {
        // اول همه رو صفر کن
        $this->db->exec("UPDATE payment_methods SET is_default = 0");

        // بعد این یکی رو یک کن
        $stmt = $this->db->prepare("UPDATE payment_methods SET is_default = 1 WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }

    /**
     * ذخیره batch (چند روش پرداخت یکجا)
     */
    public function saveBatch($methods) {
        foreach ($methods as $method) {
            if (!empty($method['id'])) {
                // آپدیت
                $this->update($method['id'], $method);
            } else if (!empty($method['method_key'])) {
                // چک کن وجود داره یا نه
                $existing = $this->getByKey($method['method_key']);
                if ($existing) {
                    $this->update($existing['id'], $method);
                } else {
                    $this->create($method);
                }
            }
        }
        return true;
    }
}