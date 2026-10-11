<?php
/**
 * Constants
 * ثابت‌های پروژه
 */

// لود config
$config = require_once __DIR__ . '/config.php';

// تعریف ثابت‌ها
define('SITE_NAME', $config['site_name']);
define('SITE_URL', $config['site_url']);
define('JWT_SECRET', $config['jwt_secret']);
define('JWT_EXPIRE', $config['jwt_expire']);
define('UPLOAD_MAX_SIZE', $config['upload_max_size']);
define('UPLOAD_DIR', $config['upload_dir']);
define('DEBUG_MODE', $config['debug']);

// تنظیم Timezone
date_default_timezone_set($config['timezone']);

// نمایش خطاها در حالت debug
if (DEBUG_MODE) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    error_reporting(0);
}