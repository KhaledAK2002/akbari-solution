<?php
/**
 * Akbari Solution - API Entry Point
 * نقطه ورود API
 */

// ⚠️ Railway fix: handle /api/ base path
if (isset($_SERVER['REQUEST_URI'])) {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (strpos($uri, '/api/') === 0) {
        $_SERVER['REQUEST_URI'] = substr($uri, 4);
    }
}   


// =========================================
// 1. Autoloader
// =========================================
require_once __DIR__ . '/core/Autoloader.php';
Autoloader::register();

// =========================================
// 2. لود تنظیمات
// =========================================
require_once __DIR__ . '/config/constants.php';
require_once __DIR__ . '/middlewares/CorsMiddleware.php';
require_once __DIR__ . '/helpers/response.php';

// =========================================
// 3. CORS
// =========================================
CorsMiddleware::handle();

// =========================================
// 4. مدیریت خطاها
// =========================================
set_exception_handler(function($e) {
    if (DEBUG_MODE) {
        Response::error($e->getMessage(), 500, [
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);
    } else {
        Response::error('Internal Server Error', 500);
    }
});

// =========================================
// 5. تعریف مسیرها
// =========================================
$router = new Router();

// === TEST ROUTE ===
$router->get('/v1/ping', function() {
    Response::success([
        'message' => 'pong',
        'time' => date('Y-m-d H:i:s'),
        'version' => '1.0'
    ]);
});

// =========================================
// === AUTH ===
// =========================================
$router->post('/v1/auth/login', 'AuthController@login');
$router->post('/v1/auth/logout', 'AuthController@logout');
$router->get('/v1/auth/me', 'AuthController@me');
$router->post('/v1/auth/change-password', 'AuthController@changePassword');

// =========================================
// === PRODUCTS ===
// =========================================
// --- Product Images (Admin) — قبل از {id} باشه ---
$router->delete('/v1/products/images/{imageId}', 'ProductController@deleteImage');
$router->post('/v1/products/{id}/images', 'ProductController@uploadImages');

// --- Public ---
$router->get('/v1/products', 'ProductController@index');
$router->get('/v1/products/{id}', 'ProductController@show');

// --- Admin CRUD ---
$router->post('/v1/products', 'ProductController@store');
$router->put('/v1/products/{id}', 'ProductController@update');
$router->delete('/v1/products/{id}', 'ProductController@destroy');

// =========================================
// === MESSAGES ===
// =========================================
// --- Stats (Admin) — قبل از {id} باشه ---
$router->get('/v1/messages/stats', 'MessageController@stats');

// --- Public (ارسال پیام از فرم تماس) ---
$router->post('/v1/messages', 'MessageController@store');

// --- Admin ---
$router->get('/v1/messages', 'MessageController@index');
$router->get('/v1/messages/{id}', 'MessageController@show');
$router->put('/v1/messages/{id}', 'MessageController@update');
$router->delete('/v1/messages/{id}', 'MessageController@destroy');

// =========================================
// === SETTINGS ===
// =========================================
// --- Public (بدون توکن) — قبل از {key} باشه ---
$router->get('/v1/settings/public', 'SettingController@publicSettings');

// --- Admin ---
$router->get('/v1/settings', 'SettingController@index');
$router->post('/v1/settings', 'SettingController@store');
$router->get('/v1/settings/{key}', 'SettingController@show');
$router->put('/v1/settings/{key}', 'SettingController@update');
$router->delete('/v1/settings/{key}', 'SettingController@destroy');
$router->post('/v1/settings/test-email', 'SettingController@testEmail');

// =========================================
// === PAGES (Home, About, Contact) ===
// =========================================
$router->get('/v1/pages/{key}', 'PageController@show');
$router->post('/v1/pages/{key}', 'PageController@save');

// =========================================
// === MAINTENANCE MODE ===
// =========================================
$router->get('/v1/maintenance', 'SettingController@getMaintenance');
$router->post('/v1/maintenance', 'SettingController@saveMaintenance');

// =========================================
// === BACKUP / RESTORE ===
// =========================================
$router->post('/v1/backup/create', 'BackupController@create');
$router->get('/v1/backup/list', 'BackupController@list');
$router->get('/v1/backup/download/{filename}', 'BackupController@download');
$router->delete('/v1/backup/{filename}', 'BackupController@destroy');
$router->post('/v1/backup/restore', 'BackupController@restore');

// =========================================
// === USERS ===
// =========================================
// --- Stats (Admin) — قبل از {id} باشه ---
$router->get('/v1/users/stats', 'UserController@stats');

// --- Admin CRUD ---
$router->get('/v1/users', 'UserController@index');
$router->post('/v1/users', 'UserController@store');
$router->get('/v1/users/{id}', 'UserController@show');
$router->put('/v1/users/{id}', 'UserController@update');
$router->delete('/v1/users/{id}', 'UserController@destroy');

// =========================================
// === PERMISSIONS ===
// =========================================
$router->get('/v1/permissions', 'PermissionController@index');
$router->get('/v1/permissions/role/{role}', 'PermissionController@byRole');
$router->get('/v1/permissions/user/{userId}', 'PermissionController@byUser');
$router->post('/v1/permissions/role', 'PermissionController@saveForRole');
$router->post('/v1/permissions/user', 'PermissionController@saveForUser');
$router->post('/v1/permissions/copy-from-role', 'PermissionController@copyFromRole');

// =========================================
// === PAYMENT METHODS ===
// =========================================
// --- Public (بدون توکن) — قبل از {id} باشه ---
$router->get('/v1/payment-methods/public', 'PaymentMethodController@publicMethods');

// --- Admin ---
$router->get('/v1/payment-methods', 'PaymentMethodController@index');
$router->post('/v1/payment-methods', 'PaymentMethodController@store');
$router->get('/v1/payment-methods/key/{key}', 'PaymentMethodController@showByKey');
$router->post('/v1/payment-methods/set-default/{id}', 'PaymentMethodController@setDefault');
$router->get('/v1/payment-methods/{id}', 'PaymentMethodController@show');
$router->put('/v1/payment-methods/{id}', 'PaymentMethodController@update');
$router->delete('/v1/payment-methods/{id}', 'PaymentMethodController@destroy');

// =========================================
// === MEDIA ===
// =========================================
$router->get('/v1/media/stats', 'MediaController@stats');
$router->post('/v1/media/upload', 'MediaController@upload');
$router->get('/v1/media', 'MediaController@index');
$router->get('/v1/media/{id}', 'MediaController@show');
$router->put('/v1/media/{id}', 'MediaController@update');
$router->delete('/v1/media/{id}', 'MediaController@destroy');

// =========================================
// === ORDERS ===
// =========================================
$router->get('/v1/orders/stats', 'OrderController@stats');
$router->post('/v1/orders', 'OrderController@store');
$router->get('/v1/orders', 'OrderController@index');
$router->get('/v1/orders/{id}', 'OrderController@show');
$router->put('/v1/orders/{id}', 'OrderController@update');
$router->delete('/v1/orders/{id}', 'OrderController@destroy');

// =========================================
// === ACTIVITY LOG ===
// =========================================
$router->get('/v1/activity-log/stats', 'ActivityLogController@stats');
$router->delete('/v1/activity-log/clear', 'ActivityLogController@clearAll');
$router->post('/v1/activity-log/clean', 'ActivityLogController@cleanOld');
$router->post('/v1/activity-log', 'ActivityLogController@store');
$router->get('/v1/activity-log', 'ActivityLogController@index');
$router->get('/v1/activity-log/{id}', 'ActivityLogController@show');
$router->delete('/v1/activity-log/{id}', 'ActivityLogController@destroy');

// =========================================
// === SERVICES ===
// =========================================
// --- Upload (Admin) — قبل از {id} باشه ---
$router->post('/v1/services/upload-image', 'ServiceController@uploadImage');

// --- Public ---
$router->get('/v1/services', 'ServiceController@index');
$router->get('/v1/services/{id}', 'ServiceController@show');

// --- Admin CRUD ---
$router->post('/v1/services', 'ServiceController@store');
$router->put('/v1/services/{id}', 'ServiceController@update');
$router->delete('/v1/services/{id}', 'ServiceController@destroy');

// =========================================
// 6. اجرا
// =========================================
$router->dispatch();