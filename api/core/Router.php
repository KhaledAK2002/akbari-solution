<?php
/**
 * Router Class
 * مسیریاب درخواست‌ها
 */

class Router {
    private $routes = [];

    /**
     * ثبت مسیر GET
     */
    public function get($path, $handler) {
        $this->routes[] = [
            'method' => 'GET',
            'path' => $path,
            'handler' => $handler
        ];
    }

    /**
     * ثبت مسیر POST
     */
    public function post($path, $handler) {
        $this->routes[] = [
            'method' => 'POST',
            'path' => $path,
            'handler' => $handler
        ];
    }

    /**
     * ثبت مسیر PUT
     */
    public function put($path, $handler) {
        $this->routes[] = [
            'method' => 'PUT',
            'path' => $path,
            'handler' => $handler
        ];
    }

    /**
     * ثبت مسیر DELETE
     */
    public function delete($path, $handler) {
        $this->routes[] = [
            'method' => 'DELETE',
            'path' => $path,
            'handler' => $handler
        ];
    }

    /**
     * اجرای مسیریاب
     */
    public function dispatch() {
        $method = Request::method();
        $uri = Request::uri();

        // حذف base path
        $basePath = '/Akbari-Solution/api';
        if (strpos($uri, $basePath) === 0) {
            $uri = substr($uri, strlen($basePath));
        }

        $uri = '/' . trim($uri, '/');

        foreach ($this->routes as $route) {
            $pattern = $this->convertToRegex($route['path']);
            
            if ($route['method'] === $method && preg_match($pattern, $uri, $matches)) {
                array_shift($matches); // حذف full match
                
                $handler = $route['handler'];
                $params = array_values($matches);

                // اگه handler تابع باشه
                if (is_callable($handler)) {
                    call_user_func_array($handler, $params);
                    return;
                }

                // اگه handler اسم Controller باشه مثل 'ProductController@index'
                if (is_string($handler) && strpos($handler, '@') !== false) {
                    list($controllerName, $methodName) = explode('@', $handler);
                    $controllerFile = __DIR__ . '/../controllers/' . $controllerName . '.php';
                    
                    if (!file_exists($controllerFile)) {
                        Response::error('Controller not found: ' . $controllerName, 500);
                    }
                    
                    require_once $controllerFile;
                    $controller = new $controllerName();
                    
                    if (!method_exists($controller, $methodName)) {
                        Response::error('Method not found: ' . $methodName, 500);
                    }
                    
                    call_user_func_array([$controller, $methodName], $params);
                    return;
                }
            }
        }

        // مسیر پیدا نشد
        Response::error('Route not found: ' . $method . ' ' . $uri, 404);
    }

    /**
     * تبدیل path به regex
     */
    private function convertToRegex($path) {
        // {id} → ([^/]+)
        $pattern = preg_replace('/\{([a-zA-Z_]+)\}/', '([^/]+)', $path);
        return '#^' . $pattern . '$#';
    }
}