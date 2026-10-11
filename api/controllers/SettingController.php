<?php
/**
 * Setting Controller
 * مدیریت API تنظیمات سایت
 */

class SettingController {
    private $settingModel;

    public function __construct() {
        $this->settingModel = new Setting();
    }

    /**
     * GET /api/v1/settings
     */
    public function index() {
        AuthMiddleware::requirePermission('settings', 'view');

        try {
            $settings = $this->settingModel->getAll();
            Response::success($settings, 'Settings fetched successfully');
        } catch (Exception $e) {
            Response::error('Failed to fetch settings: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/settings/public
     * ⚠️ عمومی — برای Frontend
     */
    public function publicSettings() {
        try {
            $settings = $this->settingModel->getAll();

            $publicKeys = ['general', 'appearance', 'contact', 'ecommerce'];
            $public = [];

            foreach ($publicKeys as $key) {
                if (isset($settings[$key])) {
                    $public[$key] = $settings[$key];
                }
            }

            Response::success($public, 'Public settings fetched successfully');
        } catch (Exception $e) {
            Response::error('Failed to fetch public settings: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/settings/{key}
     */
    public function show($key) {
        AuthMiddleware::requirePermission('settings', 'view');

        try {
            $value = $this->settingModel->get($key);

            if ($value === null) {
                Response::success(null, 'Setting not found');
            }

            Response::success([
                'key' => $key,
                'value' => $value
            ], 'Setting fetched successfully');

        } catch (Exception $e) {
            Response::error('Failed to fetch setting: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/settings
     */
    public function store() {
        AuthMiddleware::requirePermission('settings', 'edit');

        $data = Request::json();

        if (empty($data) || !is_array($data)) {
            Response::error('Invalid settings data', 400);
        }

        $allowedKeys = [
            'general', 'appearance', 'contact', 'ecommerce',
            'seo', 'email', 'maintenance', 'payment_settings'
        ];

        try {
            $saved = [];
            foreach ($data as $key => $value) {
                if (!in_array($key, $allowedKeys)) {
                    continue;
                }

                $this->settingModel->set($key, $value);
                $saved[] = $key;
            }

            $allSettings = $this->settingModel->getAll();

            Response::success([
                'saved_keys' => $saved,
                'settings' => $allSettings
            ], 'Settings saved successfully');

        } catch (Exception $e) {
            Response::error('Failed to save settings: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/v1/settings/{key}
     */
    public function update($key) {
        AuthMiddleware::requirePermission('settings', 'edit');

        $data = Request::json();

        try {
            $this->settingModel->set($key, $data);
            $value = $this->settingModel->get($key);

            Response::success([
                'key' => $key,
                'value' => $value
            ], 'Setting updated successfully');

        } catch (Exception $e) {
            Response::error('Failed to update setting: ' . $e->getMessage(), 500);
        }
    }

        /**
     * POST /api/v1/settings/test-email
     * تست ارسال ایمیل
     */
    public function testEmail() {
        AuthMiddleware::requireSuperAdmin();

        $data = Request::json();
        $to = $data['to'] ?? '';

        if (empty($to) || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            Response::error('Valid email required', 400);
        }

        try {
            $emailSettings = $this->settingModel->get('email') ?? [];

            if (empty($emailSettings['host']) || empty($emailSettings['username']) || empty($emailSettings['password'])) {
                Response::error('SMTP settings not configured', 400);
            }

            $mailHelper = new MailHelper();
            $subject = 'Test Email from Akbari Solution';
            $body = '<h2>✅ SMTP Test Successful!</h2><p>This is a test email from Akbari Solution.</p><p>Time: ' . date('Y-m-d H:i:s') . '</p>';

            $result = $mailHelper->send($to, $subject, $body, $emailSettings);

            if ($result) {
                Response::success(null, 'Test email sent to ' . $to);
            } else {
                Response::error('Failed to send. Check SMTP credentials.', 500);
            }

        } catch (Exception $e) {
            Response::error('Error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/v1/settings/{key}
     */
    public function destroy($key) {
        AuthMiddleware::requirePermission('settings', 'delete');

        try {
            $this->settingModel->delete($key);
            Response::success(null, 'Setting deleted successfully');

        } catch (Exception $e) {
            Response::error('Failed to delete setting: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/maintenance
     * عمومی — بدون auth (فرانت چک میکنه)
     */
    public function getMaintenance() {
        try {
            $value = $this->settingModel->get('maintenance');

            if ($value === null) {
                $value = [
                    'enabled' => false,
                    'message' => 'We are currently performing scheduled maintenance. Please check back soon.'
                ];
            }

            Response::success($value, 'Maintenance settings fetched');

        } catch (Exception $e) {
            Response::error('Failed to fetch maintenance: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/maintenance
     * ذخیره — نیاز به permission
     */
    public function saveMaintenance() {
        AuthMiddleware::requirePermission('settings', 'edit');

        $data = Request::json();

        if (!isset($data['enabled'])) {
            Response::error('enabled field is required', 400);
        }

        try {
            $maintenanceData = [
                'enabled' => (bool)$data['enabled'],
                'message' => $data['message'] ?? 'We are currently performing scheduled maintenance. Please check back soon.',
                'lastUpdated' => date('Y-m-d H:i:s')
            ];

            $this->settingModel->set('maintenance', $maintenanceData);

            Response::success($maintenanceData, 'Maintenance settings saved');

        } catch (Exception $e) {
            Response::error('Failed to save maintenance: ' . $e->getMessage(), 500);
        }
    }
}