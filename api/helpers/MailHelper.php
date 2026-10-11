<?php
/**
 * Mail Helper
 * ارسال ایمیل (Order Confirmation, Notification)
 */

class MailHelper {
    private $settingModel;
    
    public function __construct() {
        $this->settingModel = new Setting();
    }
    
    /**
     * ⚠️ چک تنظیمات SMTP
     */
    private function isSmtpConfigured($emailSettings) {
        return !empty($emailSettings['host']) 
            && !empty($emailSettings['username']) 
            && !empty($emailSettings['password']);
    }
    
    /**
     * ارسال ایمیل تایید سفارش به مشتری
     */
    public function sendOrderConfirmation($order, $paymentMethod = null) {
        $settings = $this->settingModel->getAll();
        $ecommerce = $settings['ecommerce'] ?? [];
        $emailSettings = $settings['email'] ?? [];
        $general = $settings['general'] ?? [];
        $contact = $settings['contact'] ?? [];
        
        // ⚠️ اگه SMTP تنظیم نشده → خارج شو
        if (!$this->isSmtpConfigured($emailSettings)) {
            return false;
        }
        
        // چک کردن فعال بودن toggle
        if (isset($ecommerce['orderConfirmation']) && $ecommerce['orderConfirmation'] === false) {
            return false;
        }
        
        $to = $order['customer_email'];
        $siteName = $general['siteTitle'] ?? 'Akbari Solution';
        $orderNumber = $order['order_number'];
        
        $subject = "Order Confirmation - {$orderNumber} | {$siteName}";
        
        $body = $this->buildOrderEmailHTML([
            'customerName' => $order['customer_name'],
            'orderNumber' => $orderNumber,
            'itemName' => $order['item_name'] ?? 'N/A',
            'amount' => $order['amount'],
            'currency' => $order['currency'] ?? 'USD',
            'siteName' => $siteName,
            'paymentMethod' => $paymentMethod ? $paymentMethod['name'] : $order['payment_method'],
            'contactEmail' => $contact['mainEmail'] ?? $emailSettings['username'] ?? '',
            'contactPhone' => $contact['mainPhone'] ?? '',
            'siteUrl' => $general['siteUrl'] ?? 'http://localhost/Akbari-Solution'
        ]);
        
        return $this->send($to, $subject, $body, $emailSettings);
    }
    
    /**
     * ارسال ایمیل به ادمین
     */
    public function sendAdminNotification($order) {
        $settings = $this->settingModel->getAll();
        $ecommerce = $settings['ecommerce'] ?? [];
        $emailSettings = $settings['email'] ?? [];
        
        // ⚠️ اگه SMTP تنظیم نشده → خارج شو
        if (!$this->isSmtpConfigured($emailSettings)) {
            return false;
        }
        
        $to = $ecommerce['adminEmail'] ?? $ecommerce['orderEmail'] ?? '';
        
        if (empty($to)) return false;
        
        $subject = "New Order Received - {$order['order_number']}";
        
        $body = "
            <h2>New Order Received</h2>
            <p><strong>Order Number:</strong> {$order['order_number']}</p>
            <p><strong>Customer:</strong> {$order['customer_name']}</p>
            <p><strong>Email:</strong> {$order['customer_email']}</p>
            <p><strong>Phone:</strong> {$order['customer_phone']}</p>
            <p><strong>Item:</strong> {$order['item_name']}</p>
            <p><strong>Amount:</strong> {$order['amount']} {$order['currency']}</p>
            <p><strong>Payment Method:</strong> {$order['payment_method']}</p>
        ";
        
        return $this->send($to, $subject, $body, $emailSettings);
    }
    
    /**
     * ارسال ایمیل پایه
     */
    public function send($to, $subject, $body, $emailSettings = []) {
        // سرکوب خطاهای PHP
        $oldErr = error_reporting(0);
        $oldDisplay = ini_set('display_errors', 0);
        
        $fromEmail = $emailSettings['username'] ?? 'noreply@akbarisolution.com';
        $fromName = 'Akbari Solution';
        
        // اگه SMTP تنظیم شده → از SMTP استفاده کن
        if ($this->isSmtpConfigured($emailSettings)) {
            try {
                $smtp = new SMTP([
                    'host' => $emailSettings['host'],
                    'port' => $emailSettings['port'] ?? 587,
                    'username' => $emailSettings['username'],
                    'password' => $emailSettings['password'],
                    'encryption' => $emailSettings['encryption'] ?? 'tls'
                ]);
                
                $result = $smtp->send($to, $subject, $body, $fromEmail, $fromName);
                
                error_reporting($oldErr);
                if ($oldDisplay !== false) ini_set('display_errors', $oldDisplay);
                
                if ($result) return true;
            } catch (Exception $e) {
                error_log('SMTP error: ' . $e->getMessage());
            }
        }
        
        // fallback: mail()
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: ' . $fromName . ' <' . $fromEmail . '>',
            'Reply-To: ' . $fromEmail,
            'X-Mailer: PHP/' . phpversion()
        ];
        
        try {
            $result = @mail($to, $subject, $body, implode("\r\n", $headers));
            
            error_reporting($oldErr);
            if ($oldDisplay !== false) ini_set('display_errors', $oldDisplay);
            
            return $result;
        } catch (Exception $e) {
            error_log('Mail error: ' . $e->getMessage());
            
            error_reporting($oldErr);
            if ($oldDisplay !== false) ini_set('display_errors', $oldDisplay);
            
            return false;
        }
    }
    
    /**
     * قالب HTML ایمیل سفارش
     */
    private function buildOrderEmailHTML($data) {
        $siteName = htmlspecialchars($data['siteName']);
        $customerName = htmlspecialchars($data['customerName']);
        $orderNumber = htmlspecialchars($data['orderNumber']);
        $itemName = htmlspecialchars($data['itemName']);
        $amount = number_format($data['amount'], 2);
        $currency = htmlspecialchars($data['currency']);
        $paymentMethod = htmlspecialchars($data['paymentMethod']);
        $contactEmail = htmlspecialchars($data['contactEmail']);
        $contactPhone = htmlspecialchars($data['contactPhone']);
        
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #00A8FF, #0084CC); padding: 30px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 24px; }
    .body { padding: 30px; color: #1A202C; line-height: 1.6; }
    .body h2 { color: #00A8FF; font-size: 18px; margin-top: 0; }
    .info-box { background: #F8FAFC; border-left: 4px solid #00A8FF; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E2E8F0; }
    .info-row:last-child { border-bottom: none; }
    .info-row span { color: #64748B; }
    .info-row strong { color: #0A1128; }
    .footer { background: #0A1128; color: #A0AEC0; padding: 20px; text-align: center; font-size: 12px; }
    .footer a { color: #00A8FF; text-decoration: none; }
</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Order Confirmation</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Thank you for your order!</p>
        </div>
        
        <div class="body">
            <h2>Dear {$customerName},</h2>
            <p>Your order has been received successfully. We are processing it and will contact you soon with payment instructions.</p>
            
            <div class="info-box">
                <div class="info-row">
                    <span>Order Number:</span>
                    <strong>{$orderNumber}</strong>
                </div>
                <div class="info-row">
                    <span>Item:</span>
                    <strong>{$itemName}</strong>
                </div>
                <div class="info-row">
                    <span>Amount:</span>
                    <strong>{$amount} {$currency}</strong>
                </div>
                <div class="info-row">
                    <span>Payment Method:</span>
                    <strong>{$paymentMethod}</strong>
                </div>
            </div>
            
            <p><strong>What's next?</strong></p>
            <p>Please complete the payment using the details provided in the offer letter. After payment, send us the receipt and we will deliver your product as soon as possible.</p>
            
            <p style="margin-top: 25px;">If you have any questions, contact us:</p>
            <p style="font-size: 14px;">
                📧 <a href="mailto:{$contactEmail}" style="color: #00A8FF;">{$contactEmail}</a><br>
                📱 {$contactPhone}
            </p>
        </div>
        
        <div class="footer">
            <p>&copy; 2026 {$siteName}. All rights reserved.</p>
            <p>Technology for a Better Tomorrow</p>
        </div>
    </div>
</body>
</html>
HTML;
    }
}