<?php
require_once 'config.php';

// Desativar compressão e limpar buffers
if (ob_get_level()) ob_end_clean();
ini_set('output_buffering', 'off');
ini_set('zlib.output_compression', 'off');

// Configurar headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

// Verificar método OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json');
    http_response_code(405);
    die(json_encode(['error' => 'Método não permitido']));
}

// Verificar API Key
$apiKey = getHeader('X-API-Key') ?? '';
if (!$apiKey) {
    header('Content-Type: application/json');
    http_response_code(401);
    die(json_encode(['error' => 'API Key não fornecida']));
}

// Verificar formato da API key do ElevenLabs (começa com "sk_" seguido por caracteres alfanuméricos)
if (!preg_match('/^sk_[a-z0-9]{40,}$/', $apiKey)) {
    header('Content-Type: application/json');
    http_response_code(401);
    die(json_encode(['error' => 'Formato de API Key inválido']));
}

// Receber dados JSON
$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    header('Content-Type: application/json');
    http_response_code(400);
    die(json_encode(['error' => 'Dados inválidos']));
}

// Validar campos obrigatórios
$requiredFields = ['text', 'voiceId', 'modelId'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field]) || empty($data[$field])) {
        header('Content-Type: application/json');
        http_response_code(400);
        die(json_encode(['error' => "Campo {$field} é obrigatório"]));
    }
}

// Preparar dados para log
$requestLogData = [
    'endpoint' => "text-to-speech/{$data['voiceId']}/stream",
    'method' => 'POST',
    'voice_id' => $data['voiceId'],
    'model_id' => $data['modelId'],
    'text_length' => strlen($data['text']),
    'text_md5' => md5($data['text']), // MD5 do texto para comparações
    'has_previous_request_id' => isset($data['previousRequestId']) && !empty($data['previousRequestId']),
    'api_key_masked' => substr($apiKey, 0, 5) . '...',
    // Incluir todos os parâmetros enviados para a API
    'voice_settings' => [
        'stability' => isset($data['stability']) ? $data['stability'] : 0.2,
        'similarity_boost' => isset($data['similarity']) ? $data['similarity'] : 0.75,
        'style' => isset($data['style']) ? $data['style'] : 0,
        'use_speaker_boost' => isset($data['speakerBoost']) ? $data['speakerBoost'] : true,
        'speed' => isset($data['speed']) ? $data['speed'] : 1.0
    ]
];

$requestBody = [
    'text' => $data['text'],
    'model_id' => $data['modelId'],
    'voice_settings' => [
        'stability' => isset($data['stability']) ? $data['stability'] : 0.2,
        'similarity_boost' => isset($data['similarity']) ? $data['similarity'] : 0.75,
        'style' => isset($data['style']) ? $data['style'] : 0,
        'use_speaker_boost' => isset($data['speakerBoost']) ? $data['speakerBoost'] : true,
        'speed' => isset($data['speed']) ? $data['speed'] : 1.0
    ]
];

// Incluir previous_request_ids se um request-id anterior foi fornecido
if (isset($data['previousRequestId']) && !empty($data['previousRequestId']) && $data['previousRequestId'] !== 'undefined' && $data['previousRequestId'] !== 'null' && $data['previousRequestId'] !== '') {
    $requestLogData['previous_request_id'] = $data['previousRequestId']; // ID completo
    $requestBody['previous_request_ids'] = [$data['previousRequestId']];
    error_log("Incluindo request-id anterior: " . $data['previousRequestId']);
}

// Configurar cURL
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => "https://api.elevenlabs.io/v1/text-to-speech/{$data['voiceId']}/stream?enable_logging=true&output_format=mp3_44100_128",
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($requestBody),
    CURLOPT_HTTPHEADER => [
        'xi-api-key: ' . $apiKey,
        'Content-Type: application/json'
    ],
    CURLOPT_TIMEOUT => 30
]);

$responseHeaders = [];
curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) use (&$responseHeaders) {
    $len = strlen($header);
    $headerParts = explode(':', $header, 2);
    if (count($headerParts) == 2) {
        $key = strtolower(trim($headerParts[0]));
        $value = trim($headerParts[1]);
        $responseHeaders[$key] = $value;
    }
    return $len;
});

// Configurar streaming
curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($curl, $data) {
    // Se for a primeira parte, enviar o header de áudio
    static $headersSent = false;
    if (!$headersSent) {
        header('Content-Type: audio/mpeg');
        // Forçar flush do buffer
        ob_implicit_flush(true);
        $headersSent = true;
    }
    
    echo $data;
    return strlen($data);
});

try {
    // Executar requisição (sem retorno - o streaming já foi feito)
    $success = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (!$success || $httpCode !== 200) {
        header('Content-Type: application/json');
        $errorResponse = ['error' => 'Erro ao gerar áudio'];
        
        // Adicionar o request-id ao response se disponível
        if (isset($responseHeaders['request-id'])) {
            $errorResponse['request_id'] = $responseHeaders['request-id'];
        }
        
        $errorMsg = curl_error($ch) ?: 'Erro desconhecido';
        logApiRequest('generate_audio', $requestLogData, $httpCode, [], $errorMsg);

        error_log("Erro ElevenLabs: Código " . $httpCode . (isset($responseHeaders['request-id']) ? " Request-ID: " . $responseHeaders['request-id'] : ""));
        http_response_code($httpCode ?: 500);
        die(json_encode($errorResponse));
    }

    // Após gerar o áudio com sucesso
    if ($success && isset($responseHeaders['request-id'])) {
        // Criar diretório de storage se não existir
        $storagePath = __DIR__ . '/storage';
        if (!is_dir($storagePath)) {
            mkdir($storagePath, 0755, true);
        }
        
        // Salvar o request-id em um arquivo único
        file_put_contents($storagePath . '/last_request_id.txt', $responseHeaders['request-id']);
        
        // Registrar para debugging
        error_log("Áudio gerado com sucesso. Request-ID: " . $responseHeaders['request-id']);

        // Log de sucesso
        $responseLogData = [
            'status' => 'success',
            'request_id' => $responseHeaders['request-id'] ?? 'não disponível', // ID completo
            'character_cost' => $responseHeaders['character-cost'] ?? 'não disponível',
            'history_item_id' => $responseHeaders['history-item-id'] ?? 'não disponível'
        ];

        logApiRequest('generate_audio', $requestLogData, $httpCode, $responseLogData);
    }
} finally {
    // Garantir que o cURL sempre seja fechado
    if ($ch) curl_close($ch);
}