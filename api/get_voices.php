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

// Preparar dados base para log (comum a cache hit e miss)
$baseLogData = [
    'endpoint' => 'voices',
    'method' => 'GET',
    'api_key_masked' => substr($apiKey, 0, 5) . '...'
];

// Tentar obter do cache
$cacheKey = 'voices_' . $apiKey;
$cachedData = getCache($cacheKey);

if ($cachedData) {
    // Log quando dados são obtidos do cache
    $cacheLogData = array_merge($baseLogData, ['cache_status' => 'cache hit']);
    logApiRequest('get_voices', $cacheLogData, 200, [
        'status' => 'success',
        'cache' => true,
        'voice_count' => count($cachedData['voices'] ?? [])
    ]);
    
    header('Content-Type: application/json');
    echo json_encode($cachedData);
    exit;
}

// Preparar dados para log (cache miss)
$requestLogData = array_merge($baseLogData, ['cache_status' => 'cache miss']);

// Configurar cURL
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.elevenlabs.io/v1/voices',
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
    
    // Log da requisição à API
    if ($httpCode === 200) {
        $responseData = json_decode($response, true);
        $logResponseData = [
            'status' => 'success',
            'cache' => false,
            'voice_count' => isset($responseData['voices']) ? count($responseData['voices']) : 0
        ];
        logApiRequest('get_voices', $requestLogData, $httpCode, $logResponseData);
    } else {
        $errorMsg = curl_error($ch) ?: 'Erro desconhecido';
        logApiRequest('get_voices', $requestLogData, $httpCode, [], $errorMsg);
    }

    // Verificar erros do cURL
    if (curl_errno($ch)) {
        error_log("Erro cURL: " . curl_error($ch));
        http_response_code(500);
        die(json_encode(['error' => 'Erro ao buscar vozes']));
    }

    // Verificar código de resposta
    if ($httpCode !== 200) {
        error_log("Erro ElevenLabs: " . $response);
        http_response_code($httpCode);
        die(json_encode(['error' => 'Erro ao buscar vozes']));
    }

    // Salvar em cache
    $data = json_decode($response, true);
    setCache($cacheKey, $data);

    // Retornar resposta
    header('Content-Type: application/json');
    echo $response; 
} finally {
    // Garantir que o cURL sempre seja fechado
    if ($ch) curl_close($ch);
}

