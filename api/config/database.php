<?php
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$isLocalhost = strpos($host, 'localhost') !== false || strpos($host, '127.0.0.1') !== false;

if ($isLocalhost) {
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
    return [
        'host' => 'sql204.infinityfree.com',
        'port' => 3306,
        'database' => 'if0_43119523_akbari_solution',
        'username' => 'if0_43119523',
        'password' => 'PASSWORD_FTP_اینجا',
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci'
    ];
}