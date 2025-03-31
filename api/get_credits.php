<?php
require_once 'config.php';

// Configurar headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: X-API-Key');

// Verificar método OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar método GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    die(json_encode(['error' => 'Método não permitido']));
}

// Verificar API Key
$apiKey = getHeader('X-API-Key') ?? '';
if (!$apiKey) {
    http_response_code(401);
    die(json_encode(['error' => 'API Key não fornecida']));
}

// Verificar formato da API key do ElevenLabs (começa com "sk_" seguido por caracteres alfanuméricos)
if (!preg_match('/^sk_[a-z0-9]{40,}$/', $apiKey)) {
    http_response_code(401);
    die(json_encode(['error' => 'Formato de API Key inválido']));
}

// Preparar dados para log
$requestLogData = [
    'endpoint' => 'user/subscription',
    'method' => 'GET',
    'api_key_masked' => substr($apiKey, 0, 5) . '...'
];

// Inicializar cURL
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.elevenlabs.io/v1/user/subscription',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'xi-api-key: ' . $apiKey,
        'Content-Type: application/json'
    ]
]);

try {
    // Executar requisição
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    // Lógica de log e processamento
    if ($httpCode === 200) {
        $responseData = json_decode($response, true);
        $logResponseData = [
            'status' => 'success',
            'available' => ($responseData['character_limit'] - $responseData['character_count']) ?? 0,
            'total' => $responseData['character_limit'] ?? 0
        ];
        logApiRequest('get_credits', $requestLogData, $httpCode, $logResponseData);
    } else {
        $errorMsg = curl_error($ch) ?: 'Erro desconhecido';
        logApiRequest('get_credits', $requestLogData, $httpCode, [], $errorMsg);
    }
    
    // Verificar erros do cURL
    if (curl_errno($ch)) {
        error_log("Erro cURL: " . curl_error($ch));
        http_response_code(500);
        die(json_encode(['error' => 'Erro ao buscar créditos']));
    }
    
    // Verificar código de resposta
    if ($httpCode !== 200) {
        error_log("Erro ElevenLabs: " . $response);
        http_response_code($httpCode);
        die(json_encode(['error' => 'Erro ao buscar créditos']));
    }
    
    // Processar resposta
    $data = json_decode($response, true);
    echo json_encode([
        'available' => ($data['character_limit'] - $data['character_count']) ?? 0,
        'total' => $data['character_limit'] ?? 0
    ]); 

} finally {
    // Garantir que o cURL sempre seja fechado
    if ($ch) curl_close($ch);
}

