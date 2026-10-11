<?php
/**
 * Autoloader
 * لود خودکار کلاس‌ها
 */

class Autoloader {
    
    public static function register() {
        spl_autoload_register([self::class, 'load']);
    }

    public static function load($className) {
        // پوشه‌هایی که کلاس‌ها توشون هستن
        $directories = [
            __DIR__ . '/../core/',
            __DIR__ . '/../models/',
            __DIR__ . '/../controllers/',
            __DIR__ . '/../middlewares/',
            __DIR__ . '/../helpers/',
        ];

        foreach ($directories as $dir) {
            $file = $dir . $className . '.php';
            if (file_exists($file)) {
                require_once $file;
                return;
            }
        }
    }
}