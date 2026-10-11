<?php
/**
 * Backup Controller
 * مدیریت Backup/Restore دیتابیس
 */

class BackupController {
    private $db;
    private $backupDir;

    private $tables = [
        'activity_log', 'media', 'messages', 'orders', 'payment_methods',
        'permissions', 'products', 'product_images', 'services',
        'settings', 'users'
    ];

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->backupDir = __DIR__ . '/../../uploads/backups/';
        
        if (!is_dir($this->backupDir)) {
            mkdir($this->backupDir, 0777, true);
        }
    }

    /**
     * POST /api/v1/backup/create
     */
    public function create() {
        AuthMiddleware::requireSuperAdmin();

        try {
            $backup = [
                'version' => '1.0',
                'createdAt' => date('Y-m-d H:i:s'),
                'tables' => []
            ];

            $totalRows = 0;

            foreach ($this->tables as $table) {
                try {
                    $stmt = $this->db->query("SELECT * FROM `$table`");
                    $rows = $stmt->fetchAll();
                    $backup['tables'][$table] = $rows;
                    $totalRows += count($rows);
                } catch (Exception $e) {
                    $backup['tables'][$table] = [];
                }
            }

            $json = json_encode($backup, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            $size = strlen($json);

            $filename = 'backup_' . date('Y-m-d_H-i-s') . '.json';
            $filepath = $this->backupDir . $filename;

            if (file_put_contents($filepath, $json) === false) {
                Response::error('Failed to write backup file', 500);
            }

            Response::success([
                'filename' => $filename,
                'size' => $size,
                'sizeFormatted' => $this->formatSize($size),
                'tables' => count($this->tables),
                'rows' => $totalRows,
                'createdAt' => $backup['createdAt']
            ], 'Backup created successfully', 201);

        } catch (Exception $e) {
            Response::error('Backup failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/backup/list
     */
    public function list() {
        AuthMiddleware::requireSuperAdmin();

        try {
            $files = glob($this->backupDir . 'backup_*.json');
            $backups = [];

            foreach ($files as $file) {
                $stat = stat($file);
                $backups[] = [
                    'filename' => basename($file),
                    'size' => $stat['size'],
                    'sizeFormatted' => $this->formatSize($stat['size']),
                    'date' => date('Y-m-d H:i:s', $stat['mtime'])
                ];
            }

            usort($backups, function($a, $b) {
                return strtotime($b['date']) - strtotime($a['date']);
            });

            Response::success($backups, 'Backups fetched');

        } catch (Exception $e) {
            Response::error('Failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/backup/download/{filename}
     */
    public function download($filename) {
        AuthMiddleware::requireSuperAdmin();

        $filename = basename($filename);
        $filepath = $this->backupDir . $filename;

        if (!file_exists($filepath) || strpos($filename, 'backup_') !== 0) {
            Response::error('Backup not found', 404);
        }

        header('Content-Type: application/json');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . filesize($filepath));
        readfile($filepath);
        exit;
    }

    /**
     * DELETE /api/v1/backup/{filename}
     */
    public function destroy($filename) {
        AuthMiddleware::requireSuperAdmin();

        $filename = basename($filename);
        $filepath = $this->backupDir . $filename;

        if (!file_exists($filepath) || strpos($filename, 'backup_') !== 0) {
            Response::error('Backup not found', 404);
        }

        unlink($filepath);
        Response::success(null, 'Backup deleted');
    }

    /**
     * POST /api/v1/backup/restore
     * Body: { filename: "backup_xxx.json" }
     */
    public function restore() {
        AuthMiddleware::requireSuperAdmin();

        $data = Request::json();
        $filename = $data['filename'] ?? '';

        if (empty($filename)) {
            Response::error('Filename required', 400);
        }

        $filename = basename($filename);
        $filepath = $this->backupDir . $filename;

        if (!file_exists($filepath)) {
            Response::error('Backup file not found', 404);
        }

        try {
            $json = file_get_contents($filepath);
            $backup = json_decode($json, true);

            if (!$backup || !isset($backup['tables'])) {
                Response::error('Invalid backup file', 400);
            }

            $restored = [];

            $this->db->exec("SET FOREIGN_KEY_CHECKS = 0");

            foreach ($backup['tables'] as $table => $rows) {
                if (!in_array($table, $this->tables)) continue;

                $this->db->exec("DELETE FROM `$table`");

                if (!empty($rows)) {
                    $columns = array_keys($rows[0]);
                    $cols = '`' . implode('`, `', $columns) . '`';
                    $placeholders = ':' . implode(', :', $columns);

                    $sql = "INSERT INTO `$table` ($cols) VALUES ($placeholders)";
                    $stmt = $this->db->prepare($sql);

                    foreach ($rows as $row) {
                        $params = [];
                        foreach ($row as $k => $v) {
                            $params[$k] = $v;
                        }
                        $stmt->execute($params);
                    }
                }

                $restored[$table] = count($rows);
            }

            $this->db->exec("SET FOREIGN_KEY_CHECKS = 1");

            Response::success([
                'restoredTables' => count($restored),
                'restoredRows' => array_sum($restored)
            ], 'Restore completed successfully');

        } catch (Exception $e) {
            $this->db->exec("SET FOREIGN_KEY_CHECKS = 1");
            Response::error('Restore failed: ' . $e->getMessage(), 500);
        }
    }

    private function formatSize($bytes) {
        if ($bytes < 1024) return $bytes . ' B';
        if ($bytes < 1024 * 1024) return round($bytes / 1024, 2) . ' KB';
        return round($bytes / (1024 * 1024), 2) . ' MB';
    }
}