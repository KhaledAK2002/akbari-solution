<?php
/**
 * JWT Helper
 * ساخت و بررسی JSON Web Token
 * بدون نیاز به کتابخانه خارجی
 */

class JWT {
    
    /**
     * ساخت توکن
     */
    public static function encode($payload, $secret = null) {
        if ($secret === null) $secret = JWT_SECRET;

        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256'
        ];

        $headerEncoded = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, $secret, true);
        $signatureEncoded = self::base64UrlEncode($signature);

        return $headerEncoded . '.' . $payloadEncoded . '.' . $signatureEncoded;
    }

    /**
     * بررسی و خواندن توکن
     */
    public static function decode($token, $secret = null) {
        if ($secret === null) $secret = JWT_SECRET;

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;

        // بررسی امضا
        $signature = hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, $secret, true);
        $expectedSignature = self::base64UrlEncode($signature);

        if (!hash_equals($expectedSignature, $signatureEncoded)) {
            return null;
        }

        // رمزگشایی payload
        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);
        if (!$payload) {
            return null;
        }

        // بررسی انقضا
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    /**
     * ساخت توکن برای کاربر
     */
    public static function generateForUser($user) {
        $now = time();
        $payload = [
            'iss' => 'Akbari-Solution',
            'iat' => $now,
            'exp' => $now + JWT_EXPIRE,
            'user_id' => (int)$user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'role' => $user['role']
        ];
        return self::encode($payload);
    }

    /**
     * Base64 URL Encode
     */
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL Decode
     */
    private static function base64UrlDecode($data) {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }
}