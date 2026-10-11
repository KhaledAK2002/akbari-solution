<?php
/**
 * Message Controller
 * مدیریت API پیام‌های تماس
 */

class MessageController {
    private $messageModel;

    public function __construct() {
        $this->messageModel = new Message();
    }

    /**
     * GET /api/v1/messages
     */
    public function index() {
        AuthMiddleware::requirePermission('messages', 'view');

        $filters = [
            'status' => Request::get('status'),
            'search' => Request::get('search'),
        ];

        $page = (int)Request::get('page', 1);
        $perPage = (int)Request::get('per_page', 20);
        $filters['limit'] = $perPage;
        $filters['offset'] = ($page - 1) * $perPage;

        $filters = array_filter($filters, function($v) {
            return $v !== null && $v !== '';
        });

        try {
            $messages = $this->messageModel->getAll($filters);
            $total = $this->messageModel->count($filters);

            Response::success([
                'messages' => $messages,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'total_pages' => ceil($total / $perPage)
                ]
            ], 'Messages fetched successfully');

        } catch (Exception $e) {
            Response::error('Failed to fetch messages: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/messages/{id}
     */
    public function show($id) {
        AuthMiddleware::requirePermission('messages', 'view');

        try {
            $message = $this->messageModel->getById($id);

            if (!$message) {
                Response::error('Message not found', 404);
            }

            if ($message['status'] === 'unread') {
                $this->messageModel->markAsRead($id);
                $message['status'] = 'read';
            }

            Response::success($message, 'Message fetched successfully');

        } catch (Exception $e) {
            Response::error('Failed to fetch message: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/messages/stats
     */
    public function stats() {
        AuthMiddleware::requirePermission('messages', 'view');

        try {
            $stats = $this->messageModel->countByStatus();
            Response::success($stats, 'Stats fetched successfully');

        } catch (Exception $e) {
            Response::error('Failed to fetch stats: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/messages
     * ⚠️ عمومی — از فرم تماس
     */
    public function store() {
        $data = Request::json();

        if (empty($data['name'])) {
            Response::error('Name is required', 400);
        }
        if (empty($data['email'])) {
            Response::error('Email is required', 400);
        }
        if (empty($data['subject'])) {
            Response::error('Subject is required', 400);
        }
        if (empty($data['message'])) {
            Response::error('Message is required', 400);
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            Response::error('Invalid email address', 400);
        }

        if (strlen($data['message']) < 10) {
            Response::error('Message must be at least 10 characters', 400);
        }

        try {
            $messageId = $this->messageModel->create($data);
            $message = $this->messageModel->getById($messageId);

            Response::success([
                'id' => $messageId,
                'message' => $message
            ], 'Message sent successfully', 201);

        } catch (Exception $e) {
            Response::error('Failed to send message: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/v1/messages/{id}
     */
    public function update($id) {
        AuthMiddleware::requirePermission('messages', 'edit');

        $data = Request::json();

        $existing = $this->messageModel->getById($id);
        if (!$existing) {
            Response::error('Message not found', 404);
        }

        try {
            $this->messageModel->update($id, $data);
            $message = $this->messageModel->getById($id);

            Response::success($message, 'Message updated successfully');

        } catch (Exception $e) {
            Response::error('Failed to update message: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/v1/messages/{id}
     */
    public function destroy($id) {
        AuthMiddleware::requirePermission('messages', 'delete');

        $existing = $this->messageModel->getById($id);
        if (!$existing) {
            Response::error('Message not found', 404);
        }

        try {
            $this->messageModel->delete($id);
            Response::success(null, 'Message deleted successfully');

        } catch (Exception $e) {
            Response::error('Failed to delete message: ' . $e->getMessage(), 500);
        }
    }
}