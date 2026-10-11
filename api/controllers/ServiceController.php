<?php
/**
 * Service Controller
 * مدیریت API خدمات
 */

class ServiceController {
    private $serviceModel;

    public function __construct() {
        $this->serviceModel = new Service();
    }

    /**
     * GET /api/v1/services
     */
    public function index() {
        $filters = [
            'status' => 'Active',
            'category' => Request::get('category'),
            'search' => Request::get('search'),
        ];

        $page = (int)Request::get('page', 1);
        $perPage = (int)Request::get('per_page', 12);
        $filters['limit'] = $perPage;
        $filters['offset'] = ($page - 1) * $perPage;

        $filters = array_filter($filters, function($v) {
            return $v !== null && $v !== '';
        });

        try {
            $services = $this->serviceModel->getAll($filters);
            $total = $this->serviceModel->count($filters);

            foreach ($services as &$service) {
                $service = $this->formatService($service);
            }

            Response::success([
                'services' => $services,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'total_pages' => ceil($total / $perPage)
                ]
            ], 'Services fetched successfully');

        } catch (Exception $e) {
            Response::error('Failed to fetch services: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/services/{id}
     */
    public function show($id) {
        try {
            $service = $this->serviceModel->getById($id);

            if (!$service) {
                Response::error('Service not found', 404);
            }

            if ($service['status'] !== 'Active') {
                Response::error('Service not available', 404);
            }

            Response::success($this->formatService($service), 'Service fetched successfully');

        } catch (Exception $e) {
            Response::error('Failed to fetch service: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/services
     */
    public function store() {
        AuthMiddleware::requirePermission('services', 'add');

        $data = Request::json();

        if (empty($data['name'])) {
            Response::error('Service name is required', 400);
        }
        if (empty($data['category'])) {
            Response::error('Category is required', 400);
        }
        if (empty($data['short_desc'])) {
            Response::error('Short description is required', 400);
        }

        try {
            if (!empty($data['image_data'])) {
                $imagePath = $this->saveBase64Image($data['image_data']);
                if ($imagePath) {
                    $data['image_path'] = $imagePath;
                }
            }

            $serviceId = $this->serviceModel->create($data);
            $service = $this->serviceModel->getById($serviceId);

            Response::success($this->formatService($service), 'Service created successfully', 201);

        } catch (Exception $e) {
            Response::error('Failed to create service: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/v1/services/{id}
     */
    public function update($id) {
        AuthMiddleware::requirePermission('services', 'edit');

        $data = Request::json();

        $existing = $this->serviceModel->getById($id);
        if (!$existing) {
            Response::error('Service not found', 404);
        }

        try {
            if (!empty($data['image_data'])) {
                $imagePath = $this->saveBase64Image($data['image_data']);
                if ($imagePath) {
                    if (!empty($existing['image_path'])) {
                        $oldPath = __DIR__ . '/../../' . $existing['image_path'];
                        if (file_exists($oldPath)) {
                            unlink($oldPath);
                        }
                    }
                    $data['image_path'] = $imagePath;
                }
            }

            $this->serviceModel->update($id, $data);

            $service = $this->serviceModel->getById($id);

            Response::success($this->formatService($service), 'Service updated successfully');

        } catch (Exception $e) {
            Response::error('Failed to update service: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/v1/services/{id}
     */
    public function destroy($id) {
        AuthMiddleware::requirePermission('services', 'delete');

        $existing = $this->serviceModel->getById($id);
        if (!$existing) {
            Response::error('Service not found', 404);
        }

        try {
            $this->serviceModel->delete($id);
            Response::success(null, 'Service deleted successfully');

        } catch (Exception $e) {
            Response::error('Failed to delete service: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/services/upload-image
     */
    public function uploadImage() {
        AuthMiddleware::requirePermission('services', 'edit');

        $files = Request::files();
        if (empty($files['image'])) {
            Response::error('No image uploaded', 400);
        }

        $file = $files['image'];

        if ($file['size'] > UPLOAD_MAX_SIZE) {
            Response::error('Image too large. Max ' . (UPLOAD_MAX_SIZE / 1024 / 1024) . ' MB', 400);
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            Response::error('Invalid image type. Allowed: jpg, jpeg, png, gif, webp', 400);
        }

        $uploadDir = __DIR__ . '/../../uploads/services/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $filename = 'service_' . uniqid() . '.' . $ext;
        $filePath = $uploadDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            Response::error('Failed to save image', 500);
        }

        $relativePath = 'uploads/services/' . $filename;

        Response::success([
            'path' => $relativePath,
            'url' => SITE_URL . '/' . $relativePath
        ], 'Image uploaded successfully', 201);
    }

    /**
     * تبدیل مسیر عکس به URL کامل
     */
    private function formatService($service) {
        if (!empty($service['features'])) {
            $service['features'] = array_values(
                array_filter(explode("\n", $service['features']), function($f) {
                    return trim($f) !== '';
                })
            );
        } else {
            $service['features'] = [];
        }

        if (!empty($service['image_path'])) {
            $service['image'] = SITE_URL . '/' . ltrim($service['image_path'], '/');
        } else {
            $service['image'] = null;
        }

        return $service;
    }

    /**
     * ذخیره عکس Base64
     */
    private function saveBase64Image($base64Data) {
        if (!preg_match('/^data:image\/(\w+);base64,/', $base64Data, $matches)) {
            return null;
        }

        $ext = strtolower($matches[1]);
        if ($ext === 'jpeg') $ext = 'jpg';

        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            return null;
        }

        $data = substr($base64Data, strpos($base64Data, ',') + 1);
        $data = base64_decode($data);

        if ($data === false) {
            return null;
        }

        $uploadDir = __DIR__ . '/../../uploads/services/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $filename = 'service_' . uniqid() . '.' . $ext;
        $filePath = $uploadDir . $filename;

        if (file_put_contents($filePath, $data) === false) {
            return null;
        }

        return 'uploads/services/' . $filename;
    }
}