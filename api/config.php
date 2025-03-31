<?php
// Configurações de erro
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Configurações de cache
define('CACHE_DIR', __DIR__ . '/../cache');
define('CACHE_DURATION', 3600); // 1 hora

// Configurações da API
define('API_BASE_URL', 'https://api.elevenlabs.io/v1');
define('MAX_CHARS', 5000);

// Configurações de streaming
define('STREAM_CHUNK_SIZE', 8192);
define('MAX_EXECUTION_TIME', 300); // 5 minutos
ini_set('max_execution_time', MAX_EXECUTION_TIME);

// Funções de cache
function getCache($key) {
    $file = CACHE_DIR . '/' . md5($key) . '.cache';
    if (!file_exists($file)) {
        return false;
    }
    
    $data = file_get_contents($file);
    $cache = json_decode($data, true);
    
    if ($cache['expires'] < time()) {
        unlink($file);
        return false;
    }
    
    return $cache['data'];
}

function setCache($key, $data) {
    if (!is_dir(CACHE_DIR)) {
        mkdir(CACHE_DIR, 0777, true);
    }
    
    $file = CACHE_DIR . '/' . md5($key) . '.cache';
    $cache = [
        'expires' => time() + CACHE_DURATION,
        'data' => $data
    ];
    
    file_put_contents($file, json_encode($cache));
}

// Funções de validação
function validateText($text) {
    if (empty($text)) {
        return false;
    }
    
    if (strlen($text) > MAX_CHARS) {
        return false;
    }
    
    return true;
}

// Função para obter header de forma case-insensitive
function getHeader($name) {
    $headers = getallheaders();
    
    // Busca direta em caso sensível
    if (isset($headers[$name])) {
        return $headers[$name];
    }
    
    // Busca insensível a maiúsculas/minúsculas
    foreach ($headers as $key => $value) {
        if (strtolower($key) === strtolower($name)) {
            return $value;
        }
    }
    
    return null;
}

function validateApiKey($apiKey) {
    if (empty($apiKey)) {
        return false;
    }
    
    // Verificar formato da API key do ElevenLabs (começa com "sk_" seguido por caracteres alfanuméricos)
    // Atualização: aceitar letras maiúsculas e minúsculas
    if (!preg_match('/^sk_[a-zA-Z0-9]{40,}$/', $apiKey)) {
        return false;
    }
    
    return true;
}

// Funções de resposta
function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['error' => $message]);
    exit;
}

function sendSuccess($data) {
    echo json_encode($data);
    exit;
}

// Funções de segurança
function sanitizeInput($input) {
    return htmlspecialchars(strip_tags(trim($input)));
}

function generateToken() {
    return bin2hex(random_bytes(32));
}

// Funções de log
function logError($message, $context = []) {
    $log = [
        'timestamp' => date('Y-m-d H:i:s'),
        'message' => $message,
        'context' => $context
    ];
    
    error_log(json_encode($log) . PHP_EOL, 3, __DIR__ . '/../logs/error.log');
} 

/**
 * Função para registrar logs das requisições à API ElevenLabs
 * 
 * @param string $action Ação/endpoint utilizado
 * @param array $requestData Dados enviados na requisição
 * @param int $responseCode Código de resposta HTTP
 * @param array $responseData Dados recebidos na resposta (opcional)
 * @param string $error Mensagem de erro, se houver (opcional)
 */
function logApiRequest($action, $requestData, $responseCode, $responseData = [], $error = '') {
    // Criar diretório de logs se não existir
    $logDir = __DIR__ . '/logs';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    // Nome do arquivo de log (um por dia)
    $logFile = $logDir . '/elevenlabs_' . date('Y-m-d') . '.log';
    
    // Formatar dados sensíveis
    if (isset($requestData['text'])) {
        // Limitar tamanho do texto para o log
        $requestData['text'] = substr($requestData['text'], 0, 100) . 
            (strlen($requestData['text']) > 100 ? '...' : '');
    }
    
    // Sanitizar dados da API key
    if (isset($requestData['apiKey'])) {
        $requestData['apiKey'] = substr($requestData['apiKey'], 0, 5) . '...';
    }
    
    // Formatar log
    $logData = [
        'timestamp' => date('Y-m-d H:i:s'),
        'action' => $action,
        'request' => $requestData,
        'response_code' => $responseCode,
        'response' => $responseData,
    ];
    
    if (!empty($error)) {
        $logData['error'] = $error;
    }
    
    // Adicionar ao arquivo de log
    file_put_contents(
        $logFile, 
        json_encode($logData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n---\n", 
        FILE_APPEND
    );
}