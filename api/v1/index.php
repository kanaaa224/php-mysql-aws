<?php
require_once 'methods.php';

////////////////////////////////////////////////////////////////////////////////////////////////////

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

header("Content-Type: application/json; charset=utf-8");

header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");
header("Content-Security-Policy: script-src 'self'");
header("Strict-Transport-Security: max-age=31536000;");

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Expires: Thu, 01 Jan 1970 00:00:00 GMT");

////////////////////////////////////////////////////////////////////////////////////////////////////

function html_escape($string = '') {
    return htmlspecialchars($string, ENT_QUOTES, 'UTF-8');
}

function html_recursive_escape($data = '') {
    if(is_array($data)) {
        foreach($data as $key => $value) {
            $data[$key] = html_recursive_escape($value);
        }
    } else if(is_string($data)) {
        $data = html_escape($data);
    }

    return $data;
}

function payload() {
    switch($_SERVER['REQUEST_METHOD'] ?? '') {
        case 'GET':
        case 'POST': {
            $request_data = [
                'queryParams' => $_GET  ?: [],
                'form'        => $_POST ?: [],

                'raw' => json_decode(file_get_contents('php://input') ?: '', true) ?: []
            ];

            $request_data = html_recursive_escape($request_data);
            $request_data = array_merge($request_data['queryParams'], $request_data['form'], $request_data['raw']);

            return [
                'method' => ($request_data['method'] ?? null) ?: '',
                'params' => ($request_data['params'] ?? null) ?: []
            ];
        }

        default: {
            http_response_code(405);

            exit;
        }
    }
}

function response($payload = []) {
    $data = [];

    $payload['method'] = preg_replace('/-/', '_', $payload['method']);

    if (is_callable(['Methods', $payload['method']])) {
        $data = call_user_func(['Methods', $payload['method']], $payload['params']);
    } else {
        http_response_code(400);

        exit;
    }

    $data = [
        'status' => true,
        'data'   => $data
    ];

    http_response_code(200);

    if(!empty($data)) echo json_encode($data, JSON_NUMERIC_CHECK | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}

////////////////////////////////////////////////////////////////////////////////////////////////////

response(payload());
?>