<?php
/**
 * Simple SMTP Client
 * بدون نیاز به PHPMailer
 */

class SMTP {
    private $host;
    private $port;
    private $username;
    private $password;
    private $encryption;
    private $socket;
    private $timeout = 10;
    private $debug = false;

    public function __construct($config) {
        $this->host = $config['host'] ?? 'smtp.gmail.com';
        $this->port = (int)($config['port'] ?? 587);
        $this->username = $config['username'] ?? '';
        $this->password = $config['password'] ?? '';
        $this->encryption = $config['encryption'] ?? 'tls';
    }

    public function send($to, $subject, $body, $fromEmail, $fromName = '') {
        try {
            if (!$this->connect()) return false;
            if (!$this->authenticate()) return false;

            $this->sendCommand("MAIL FROM: <{$fromEmail}>", '250');
            $this->sendCommand("RCPT TO: <{$to}>", '250');
            $this->sendCommand("DATA", '354');

            $headers = "From: {$fromName} <{$fromEmail}>\r\n";
            $headers .= "To: <{$to}>\r\n";
            $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
            $headers .= "Date: " . date('r') . "\r\n";

            $data = $headers . "\r\n" . $body . "\r\n.";
            $data = str_replace("\n.", "\n..", $data);

            $this->sendCommand($data, '250');
            $this->sendCommand("QUIT", '221');
            $this->close();

            return true;

        } catch (Exception $e) {
            error_log('SMTP Error: ' . $e->getMessage());
            return false;
        }
    }

    private function connect() {
        $protocol = ($this->encryption === 'ssl') ? 'ssl://' : '';
        $this->socket = @stream_socket_client(
            $protocol . $this->host . ':' . $this->port,
            $errno, $errstr, $this->timeout
        );

        if (!$this->socket) {
            throw new Exception("Connection failed: $errstr ($errno)");
        }

        stream_set_timeout($this->socket, $this->timeout);
        $this->readResponse(); // 220

        $this->sendCommand("EHLO " . gethostname(), '250');

        if ($this->encryption === 'tls') {
            $this->sendCommand("STARTTLS", '220');
            if (!stream_socket_enable_crypto($this->socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new Exception("TLS failed");
            }
            $this->sendCommand("EHLO " . gethostname(), '250');
        }

        return true;
    }

    private function authenticate() {
        if (empty($this->username)) return true;

        $this->sendCommand("AUTH LOGIN", '334');
        $this->sendCommand(base64_encode($this->username), '334');
        $this->sendCommand(base64_encode($this->password), '235');

        return true;
    }

    private function sendCommand($cmd, $expectCode = null) {
        fwrite($this->socket, $cmd . "\r\n");
        $response = $this->readResponse();

        if ($expectCode !== null) {
            if (strpos($response, (string)$expectCode) !== 0) {
                throw new Exception("Expected $expectCode, got: $response");
            }
        }

        return $response;
    }

    private function readResponse() {
        $response = '';
        while ($line = fgets($this->socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) === ' ') break;
        }
        if ($this->debug) error_log('SMTP: ' . trim($response));
        return $response;
    }

    private function close() {
        if ($this->socket) fclose($this->socket);
    }
}