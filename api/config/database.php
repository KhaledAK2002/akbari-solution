<?php
/**
 * Database Configuration
 * Auto-detect محیط (localhost / Railway)
 */

$isLocalhost = !isset($_ENV['RAILWAY_ENVIRONMENT']) 
    && !isset($_SERVER['RAILWAY_ENVIRONMENT'])
    && !getenv('RAILWAY_ENVIRONMENT');

if ($isLocalhost) {
    // === Localhost (XAMPP) ===
    return [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'akbari_solution',
        'username' => 'root',
        'password' => '',
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci'
    ];
} else {
    // === Railway Production ===
    return [
        'host' => getenv('MYSQLHOST') ?: getenv('MYSQL_HOST'),
        'port' => (int)(getenv('MYSQLPORT') ?: getenv('MYSQL_PORT') ?: 3306),
        'database' => getenv('MYSQLDATABASE') ?: getenv('MYSQL_DATABASE'),
        'username' => getenv('MYSQLUSER') ?: getenv('MYSQL_USER') ?: 'root',
        'password' => getenv('MYSQLPASSWORD') ?: getenv('MYSQL_PASSWORD') ?: getenv('MYSQL_ROOT_PASSWORD'),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci'
    ];
}