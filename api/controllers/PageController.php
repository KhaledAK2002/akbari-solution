<?php
/**
 * Page Controller
 * مدیریت صفحات Home, About, Contact (با Permission)
 */

class PageController {
    private $settingModel;
    private $allowedPages = ['home', 'about', 'contact'];

    public function __construct() {
        $this->settingModel = new Setting();
    }

    /**
     * GET /api/v1/pages/{key}
     */
    public function show($key) {
        if (!in_array($key, $this->allowedPages)) {
            Response::error('Invalid page key', 400);
        }

        try {
            $value = $this->settingModel->get($key);

            if ($value === null) {
                Response::success(null, 'Page not set yet');
            }

            Response::success([
                'key' => $key,
                'value' => $value
            ], 'Page fetched successfully');

        } catch (Exception $e) {
            Response::error('Failed to fetch page: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/pages/{key}
     */
    public function save($key) {
        AuthMiddleware::requirePermission('pages', 'edit');

        if (!in_array($key, $this->allowedPages)) {
            Response::error('Invalid page key', 400);
        }

        $data = Request::json();

        if (empty($data) || !is_array($data)) {
            Response::error('Invalid page data', 400);
        }

        try {
            $this->settingModel->set($key, $data);
            $value = $this->settingModel->get($key);

            Response::success([
                'key' => $key,
                'value' => $value
            ], 'Page saved successfully');

        } catch (Exception $e) {
            Response::error('Failed to save page: ' . $e->getMessage(), 500);
        }
    }
}