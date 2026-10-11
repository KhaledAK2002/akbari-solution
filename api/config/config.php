<?php
// ⚠️ تشخیص خودکار محیط
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$isLocalhost = strpos($host, 'localhost') !== false || strpos($host, '127.0.0.1') !== false;

$siteUrl = $isLocalhost 
    ? 'http://localhost/Akbari-Solution' 
    : 'https://' . $host;

return [
    'site_name' => 'Akbari Solution',
    'site_url' => $siteUrl,
    'jwt_secret' => 'AKBARI_SOLUTION_SECRET_KEY_2026_CHANGE_THIS_IN_PRODUCTION',
    'jwt_expire' => 86400,
    'upload_max_size' => 5 * 1024 * 1024,
    'allowed_image_types' => ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    'upload_dir' => __DIR__ . '/../uploads/',
    'allowed_origins' => ['*'],
    'debug' => $isLocalhost,
    'default_language' => 'en',
    'timezone' => 'Asia/Kabul'
];