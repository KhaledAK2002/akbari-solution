<?php
/**
 * Product Controller
 * مدیریت API محصولات
 */

class ProductController {
    private $productModel;

    public function __construct() {
        $this->productModel = new Product();
    }

    /**
     * GET /api/v1/products
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
            $products = $this->productModel->getAll($filters);
            $total = $this->productModel->count($filters);

            foreach ($products as &$product) {
                $product['images'] = $this->formatImages($product['images']);
                $product['image'] = !empty($product['images']) ? $product['images'][0]['url'] : null;
            }

            Response::success([
                'products' => $products,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'total_pages' => ceil($total / $perPage)
                ]
            ], 'Products fetched successfully');

        } catch (Exception $e) {
            Response::error('Failed to fetch products: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/products/{id}
     */
    public function show($id) {
        try {
            $product = $this->productModel->getById($id);

            if (!$product) {
                Response::error('Product not found', 404);
            }

            if ($product['status'] !== 'Active') {
                Response::error('Product not available', 404);
            }

            $product['images'] = $this->formatImages($product['images']);
            $product['image'] = !empty($product['images']) ? $product['images'][0]['url'] : null;

            Response::success($product, 'Product fetched successfully');

        } catch (Exception $e) {
            Response::error('Failed to fetch product: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/products
     */
    public function store() {
        AuthMiddleware::requirePermission('products', 'add');

        $data = Request::json();

        if (empty($data['name'])) {
            Response::error('Product name is required', 400);
        }
        if (empty($data['category'])) {
            Response::error('Category is required', 400);
        }
        if (!isset($data['price'])) {
            Response::error('Price is required', 400);
        }

        try {
            $productId = $this->productModel->create($data);

            $product = $this->productModel->getById($productId);
            $product['images'] = $this->formatImages($product['images']);
            $product['image'] = !empty($product['images']) ? $product['images'][0]['url'] : null;

            Response::success($product, 'Product created successfully', 201);

        } catch (Exception $e) {
            Response::error('Failed to create product: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/v1/products/{id}
     */
    public function update($id) {
        AuthMiddleware::requirePermission('products', 'edit');

        $data = Request::json();

        $existing = $this->productModel->getById($id);
        if (!$existing) {
            Response::error('Product not found', 404);
        }

        try {
            $this->productModel->update($id, $data);

            $product = $this->productModel->getById($id);
            $product['images'] = $this->formatImages($product['images']);
            $product['image'] = !empty($product['images']) ? $product['images'][0]['url'] : null;

            Response::success($product, 'Product updated successfully');

        } catch (Exception $e) {
            Response::error('Failed to update product: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/v1/products/{id}
     */
    public function destroy($id) {
        AuthMiddleware::requirePermission('products', 'delete');

        $existing = $this->productModel->getById($id);
        if (!$existing) {
            Response::error('Product not found', 404);
        }

        try {
            if (!empty($existing['images'])) {
                foreach ($existing['images'] as $img) {
                    $filePath = __DIR__ . '/../../' . $img['image_path'];
                    if (file_exists($filePath)) {
                        unlink($filePath);
                    }
                }
            }

            $this->productModel->delete($id);

            Response::success(null, 'Product deleted successfully');

        } catch (Exception $e) {
            Response::error('Failed to delete product: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/products/{id}/images
     */
    public function uploadImages($id) {
        AuthMiddleware::requirePermission('products', 'edit');

        $product = $this->productModel->getById($id);
        if (!$product) {
            Response::error('Product not found', 404);
        }

        $files = Request::files();
        if (empty($files['images'])) {
            Response::error('No images uploaded', 400);
        }

        $uploadDir = __DIR__ . '/../../uploads/products/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $uploadedImages = [];
        $isFirstImage = empty($product['images']);

        $imageFiles = $files['images'];
        $isMultiple = is_array($imageFiles['name']);

        if (!$isMultiple) {
            $imageFiles = [
                'name' => [$imageFiles['name']],
                'type' => [$imageFiles['type']],
                'tmp_name' => [$imageFiles['tmp_name']],
                'error' => [$imageFiles['error']],
                'size' => [$imageFiles['size']]
            ];
        }

        $count = count($imageFiles['name']);

        for ($i = 0; $i < $count; $i++) {
            if ($imageFiles['error'][$i] !== UPLOAD_ERR_OK) {
                continue;
            }

            if ($imageFiles['size'][$i] > UPLOAD_MAX_SIZE) {
                continue;
            }

            $ext = strtolower(pathinfo($imageFiles['name'][$i], PATHINFO_EXTENSION));
            if (!in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                continue;
            }

            $filename = 'product_' . $id . '_' . uniqid() . '.' . $ext;
            $filePath = $uploadDir . $filename;

            if (move_uploaded_file($imageFiles['tmp_name'][$i], $filePath)) {
                $relativePath = 'uploads/products/' . $filename;

                $isCover = ($isFirstImage && $i === 0);
                $sortOrder = count($uploadedImages);

                $imageId = $this->productModel->addImage($id, $relativePath, $isCover, $sortOrder);

                $uploadedImages[] = [
                    'id' => $imageId,
                    'url' => SITE_URL . '/' . $relativePath,
                    'path' => $relativePath,
                    'is_cover' => $isCover,
                    'sort_order' => $sortOrder
                ];
            }
        }

        if (empty($uploadedImages)) {
            Response::error('No images were uploaded successfully', 400);
        }

        Response::success([
            'images' => $uploadedImages,
            'count' => count($uploadedImages)
        ], 'Images uploaded successfully', 201);
    }

    /**
     * DELETE /api/v1/products/images/{imageId}
     */
    public function deleteImage($imageId) {
        AuthMiddleware::requirePermission('products', 'delete');

        $image = $this->productModel->getImageById($imageId);
        if (!$image) {
            Response::error('Image not found', 404);
        }

        try {
            $filePath = __DIR__ . '/../../' . $image['image_path'];
            if (file_exists($filePath)) {
                unlink($filePath);
            }

            $this->productModel->deleteImage($imageId);

            if ($image['is_cover']) {
                $remainingImages = $this->productModel->getImages($image['product_id']);
                if (!empty($remainingImages)) {
                    $this->productModel->setAsCover($remainingImages[0]['id']);
                }
            }

            Response::success(null, 'Image deleted successfully');

        } catch (Exception $e) {
            Response::error('Failed to delete image: ' . $e->getMessage(), 500);
        }
    }

    private function formatImages($images) {
        $result = [];
        foreach ($images as $img) {
            $result[] = [
                'id' => $img['id'],
                'url' => SITE_URL . '/' . ltrim($img['image_path'], '/'),
                'path' => $img['image_path'],
                'is_cover' => (bool)$img['is_cover'],
                'sort_order' => (int)$img['sort_order']
            ];
        }
        return $result;
    }
}