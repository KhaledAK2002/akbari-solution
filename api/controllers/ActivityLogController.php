<?php
/**
 * Activity Log Controller
 * مدیریت API لاگ فعالیت‌ها
 */

class ActivityLogController {
    private $activityLogModel;

    public function __construct() {
        $this->activityLogModel = new ActivityLog();
    }

    /**
     * GET /api/v1/activity-log
     */
    public function index() {
        AuthMiddleware::requireAdmin();

        $filters = [
            'type' => Request::get('type'),
            'action' => Request::get('action'),
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
            $logs = $this->activityLogModel->getAll($filters);
            $total = $this->activityLogModel->count($filters);

            Response::success([
                'logs' => $logs,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'total_pages' => ceil($total / $perPage)
                ]
            ], 'Activity logs fetched successfully');

        } catch (Exception $e) {
            Response::error('Failed to fetch activity logs: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/activity-log/stats
     */
    public function stats() {
        AuthMiddleware::requireAdmin();

        try {
            $stats = $this->activityLogModel->getStats();
            Response::success($stats, 'Stats fetched successfully');
        } catch (Exception $e) {
            Response::error('Failed to fetch stats: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/activity-log
     * ثبت لاگ جدید (ادمین یا خودکار)
     */
    public function store() {
        // اینجا Auth اجباری نیست چون میخوایم از فرانت هم بتونیم لاگ بفرستیم
        // ولی اگه توکن داشتیم، کاربر رو تشخیص میدیم
        $currentUser = AuthMiddleware::authenticate();

        $data = Request::json();

        if (empty($data['description'])) {
            Response::error('Description is required', 400);
        }

        // اگه کاربر لاگین بود، اطلاعاتش رو اضافه کن
        if ($currentUser) {
            $data['user_id'] = $currentUser['user_id'] ?? null;
            $data['user_name'] = $currentUser['name'] ?? 'User';
        }

        // IP کاربر
        if (empty($data['ip_address'])) {
            $data['ip_address'] = $_SERVER['REMOTE_ADDR'] ?? null;
        }

        try {
            $logId = $this->activityLogModel->create($data);
            $log = $this->activityLogModel->getById($logId);

            Response::success($log, 'Activity logged successfully', 201);

        } catch (Exception $e) {
            Response::error('Failed to log activity: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/activity-log/{id}
     */
    public function show($id) {
        AuthMiddleware::requireAdmin();

        try {
            $log = $this->activityLogModel->getById($id);

            if (!$log) {
                Response::error('Activity log not found', 404);
            }

            Response::success($log, 'Activity log fetched successfully');
        } catch (Exception $e) {
            Response::error('Failed to fetch log: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/v1/activity-log/{id}
     */
    public function destroy($id) {
        AuthMiddleware::requireAdmin();

        $existing = $this->activityLogModel->getById($id);
        if (!$existing) {
            Response::error('Activity log not found', 404);
        }

        try {
            $this->activityLogModel->delete($id);
            Response::success(null, 'Activity log deleted successfully');
        } catch (Exception $e) {
            Response::error('Failed to delete log: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/v1/activity-log/clear
     * پاک کردن همه لاگ‌ها (فقط Super Admin)
     */
    public function clearAll() {
        AuthMiddleware::requireSuperAdmin();

        try {
            $this->activityLogModel->clearAll();
            Response::success(null, 'All activity logs cleared');
        } catch (Exception $e) {
            Response::error('Failed to clear logs: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/activity-log/clean
     * پاک کردن لاگ‌های قدیمی
     */
    public function cleanOld() {
        AuthMiddleware::requireAdmin();

        $days = (int)(Request::json()['days'] ?? 30);

        try {
            $deleted = $this->activityLogModel->cleanOld($days);
            Response::success(['deleted' => $deleted], "Logs older than {$days} days cleaned");
        } catch (Exception $e) {
            Response::error('Failed to clean logs: ' . $e->getMessage(), 500);
        }
    }
}