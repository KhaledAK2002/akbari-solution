<?php
/**
 * Media Controller
 * مدیریت API فایل‌های رسانه‌ای
 */

class MediaController {
    private $mediaModel;

    public function __construct() {
        $this->mediaModel = new Media();
    }

    /**
     * GET /api/v1/media
     */
    public function index() {
        AuthMiddleware::requirePermission('media', 'view');

        $filters = [
            'file_type' => Request::get('type'),
            'search' => Request::get('search'),
        ];

        $page = (int)Request::get('page', 1);
        $perPage = (int)Request::get('per_page', 50);
        $filters['limit'] = $perPage;
        $filters['offset'] = ($page - 1) * $perPage;

        $filters = array_filter($filters, function($v) {
            return $v !== null && $v !== '';
        });

        try {
            $items = $this->mediaModel->getAll($filters);
            $total = $this->mediaModel->count($filters);

            foreach ($items as &$item) {
                $item['url'] = SITE_URL . '/' . ltrim($item['file_path'], '/');
            }

            Response::success([
                'media' => $items,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'total_pages' => ceil($total / $perPage)
                ]
            ], 'Media fetched successfully');

        } catch (Exception $e) {
            Response::error('Failed to fetch media: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/media/stats
     */
    public function stats() {
        AuthMiddleware::requirePermission('media', 'view');

        try {
            $stats = $this->mediaModel->getStats();
            Response::success($stats, 'Stats fetched successfully');
        } catch (Exception $e) {
            Response::error('Failed to fetch stats: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/media/upload
     */
    public function upload() {
        AuthMiddleware::requirePermission('media', 'add');

        $files = Request::files();

        if (empty($files['file']) && empty($files['files'])) {
            Response::error('No file uploaded', 400);
        }

        $isSingle = !empty($files['file']);
        $filesToProcess = $isSingle ? $files['file'] : $files['files'];

        $uploadDir = __DIR__ . '/../../uploads/media/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $uploadedItems = [];

        if ($isSingle) {
            $filesToProcess = [
                'name' => [$filesToProcess['name']],
                'type' => [$filesToProcess['type']],
                'tmp_name' => [$filesToProcess['tmp_name']],
                'error' => [$filesToProcess['error']],
                'size' => [$filesToProcess['size']]
            ];
        }

        $count = count($filesToProcess['name']);

        for ($i = 0; $i < $count; $i++) {
            if ($filesToProcess['error'][$i] !== UPLOAD_ERR_OK) continue;
            if ($filesToProcess['size'][$i] > 5 * 1024 * 1024) continue;

            $originalName = $filesToProcess['name'][$i];
            $tmpName = $filesToProcess['tmp_name'][$i];
            $fileSize = $filesToProcess['size'][$i];
            $mimeType = $filesToProcess['type'][$i];

            $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

            $imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
            $docExts = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'];
            $fileType = 'other';
            if (in_array($ext, $imageExts)) $fileType = 'image';
            elseif (in_array($ext, $docExts)) $fileType = 'document';

            $allowedExts = array_merge($imageExts, $docExts, ['zip', 'rar']);
            if (!in_array($ext, $allowedExts)) continue;

            $newFileName = 'media_' . uniqid() . '_' . time() . '.' . $ext;
            $filePath = $uploadDir . $newFileName;

            if (move_uploaded_file($tmpName, $filePath)) {
                $relativePath = 'uploads/media/' . $newFileName;

                $dimensions = null;
                if ($fileType === 'image') {
                    $imgInfo = @getimagesize($filePath);
                    if ($imgInfo) {
                        $dimensions = $imgInfo[0] . ' × ' . $imgInfo[1];
                    }
                }

                $mediaId = $this->mediaModel->create([
                    'file_name' => $originalName,
                    'file_path' => $relativePath,
                    'file_type' => $fileType,
                    'file_size' => $fileSize,
                    'mime_type' => $mimeType,
                    'dimensions' => $dimensions,
                    'alt_text' => pathinfo($originalName, PATHINFO_FILENAME)
                ]);

                $media = $this->mediaModel->getById($mediaId);
                $media['url'] = SITE_URL . '/' . $relativePath;

                $uploadedItems[] = $media;
            }
        }

        if (empty($uploadedItems)) {
            Response::error('No files uploaded successfully', 400);
        }

        Response::success([
            'items' => $uploadedItems,
            'count' => count($uploadedItems)
        ], 'Files uploaded successfully', 201);
    }

    /**
     * GET /api/v1/media/{id}
     */
    public function show($id) {
        AuthMiddleware::requirePermission('media', 'view');

        try {
            $media = $this->mediaModel->getById($id);

            if (!$media) {
                Response::error('Media not found', 404);
            }

            $media['url'] = SITE_URL . '/' . ltrim($media['file_path'], '/');

            Response::success($media, 'Media fetched successfully');
        } catch (Exception $e) {
            Response::error('Failed to fetch media: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/v1/media/{id}
     */
    public function update($id) {
        AuthMiddleware::requirePermission('media', 'edit');

        $data = Request::json();

        $existing = $this->mediaModel->getById($id);
        if (!$existing) {
            Response::error('Media not found', 404);
        }

        try {
            if (!empty($data['file_name'])) {
                $data['file_name'] = trim($data['file_name']);
            }
            if (!empty($data['alt_text'])) {
                $data['alt_text'] = trim($data['alt_text']);
            }

            $this->mediaModel->update($id, $data);
            $media = $this->mediaModel->getById($id);
            $media['url'] = SITE_URL . '/' . ltrim($media['file_path'], '/');

            Response::success($media, 'Media updated successfully');
        } catch (Exception $e) {
            Response::error('Failed to update media: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/v1/media/{id}
     */
    public function destroy($id) {
        AuthMiddleware::requirePermission('media', 'delete');

        $existing = $this->mediaModel->getById($id);
        if (!$existing) {
            Response::error('Media not found', 404);
        }

        try {
            $this->mediaModel->delete($id);
            Response::success(null, 'Media deleted successfully');
        } catch (Exception $e) {
            Response::error('Failed to delete media: ' . $e->getMessage(), 500);
        }
    }
}