<?php
/**
 * Setting Model
 * مدیریت تنظیمات سایت (Key-Value + JSON)
 */

class Setting {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * دریافت یه تنظیم با کلید
     * مقدار JSON برمیگردونه (decoded)
     */
    public function get($key) {
        $stmt = $this->db->prepare(
            "SELECT setting_value FROM settings WHERE setting_key = :key LIMIT 1"
        );
        $stmt->execute(['key' => $key]);
        $row = $stmt->fetch();

        if (!$row) return null;

        $decoded = json_decode($row['setting_value'], true);
        return $decoded !== null ? $decoded : $row['setting_value'];
    }

    /**
     * دریافت همه تنظیمات
     * به صورت associative array: [key => value]
     */
    public function getAll() {
        $stmt = $this->db->prepare("SELECT setting_key, setting_value FROM settings");
        $stmt->execute();
        $rows = $stmt->fetchAll();

        $result = [];
        foreach ($rows as $row) {
            $decoded = json_decode($row['setting_value'], true);
            $result[$row['setting_key']] = $decoded !== null ? $decoded : $row['setting_value'];
        }

        return $result;
    }

    /**
     * ذخیره یا به‌روزرسانی یه تنظیم
     */
    public function set($key, $value) {
        $jsonValue = is_string($value) ? $value : json_encode($value, JSON_UNESCAPED_UNICODE);

        // چک کن وجود داره یا نه
        $stmt = $this->db->prepare("SELECT id FROM settings WHERE setting_key = :key LIMIT 1");
        $stmt->execute(['key' => $key]);
        $existing = $stmt->fetch();

        if ($existing) {
            // UPDATE
            $stmt = $this->db->prepare(
                "UPDATE settings SET setting_value = :value, updated_at = NOW() 
                 WHERE setting_key = :key"
            );
            return $stmt->execute(['value' => $jsonValue, 'key' => $key]);
        } else {
            // INSERT
            $stmt = $this->db->prepare(
                "INSERT INTO settings (setting_key, setting_value) 
                 VALUES (:key, :value)"
            );
            return $stmt->execute(['key' => $key, 'value' => $jsonValue]);
        }
    }

    /**
     * ذخیره چند تنظیم یکجا
     */
    public function setMultiple($settings) {
        foreach ($settings as $key => $value) {
            $this->set($key, $value);
        }
        return true;
    }

    /**
     * حذف یه تنظیم
     */
    public function delete($key) {
        $stmt = $this->db->prepare("DELETE FROM settings WHERE setting_key = :key");
        return $stmt->execute(['key' => $key]);
    }

    /**
     * چک کن کلید وجود داره
     */
    public function exists($key) {
        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM settings WHERE setting_key = :key");
        $stmt->execute(['key' => $key]);
        $result = $stmt->fetch();
        return (int)$result['total'] > 0;
    }
}