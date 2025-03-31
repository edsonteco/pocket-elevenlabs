<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

// Verificar método OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Preparar dados para log
$requestLogData = [
    'endpoint' => 'get_last_request_id',
    'method' => $_SERVER['REQUEST_METHOD']
    // Removi o api_key_masked pois não estamos validando a API key
];

try {
    $requestId = '';
    $storagePath = __DIR__ . '/storage/last_request_id.txt';

    if (file_exists($storagePath)) {
        $requestId = file_get_contents($storagePath);
    }

    // Log da operação
    $logResponseData = [
        'status' => 'success',
        'request_id_found' => !empty($requestId)
    ];

    if (!empty($requestId)) {
        $logResponseData['request_id'] = $requestId;
    }

    logApiRequest('get_last_request_id', $requestLogData, 200, $logResponseData);

    // Retornar resposta
    echo json_encode(['request_id' => $requestId]);

} catch (Exception $e) {
    // Log de erro
    logApiRequest('get_last_request_id', $requestLogData, 500, [], $e->getMessage());

    // Resposta de erro
    http_response_code(500);
    die(json_encode(['error' => 'Erro ao obter request-id']));
}