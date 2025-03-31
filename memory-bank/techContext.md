# Tech Context - Pocket ElevenLabs

## Tecnologias Utilizadas

### Frontend

- **HTML5**: Estrutura base da aplicação
- **CSS3**: Estilização com suporte responsivo
- **JavaScript (Vanilla)**: Lógica de interação e processamento no cliente
- **Bootstrap 5**: Framework CSS para interface responsiva
- **Bootstrap Icons**: Ícones utilizados na interface
- **LocalStorage API**: Armazenamento de configurações no navegador

### Backend

- **PHP 8.2+**: Linguagem de script no servidor
- **cURL**: Biblioteca para requisições HTTP à API ElevenLabs
- **JSON**: Formato de dados para comunicação com API

### APIs Externas

- **ElevenLabs API v1**: 
  - Base URL: `https://api.elevenlabs.io/v1`
  - Endpoints utilizados:
    - `/voices`: Listagem de vozes disponíveis
    - `/text-to-speech/{voice_id}/stream`: Geração de áudio com streaming
    - `/user/subscription`: Consulta de créditos e limites

## Configuração do Ambiente de Desenvolvimento

### Requisitos

- Servidor Web (Apache, Nginx, etc.)
- PHP 8.2 ou superior com as seguintes extensões:
  - curl
  - json
  - fileinfo
- Permissões de escrita nos diretórios:
  - `/cache`: Para armazenamento de cache
  - `/logs`: Para armazenamento de logs
  - `/api/storage`: Para armazenamento de request IDs

### Configuração do Servidor Web

#### Apache

```apache
<VirtualHost *:80>
    ServerName pocket-elevenlabs.local
    DocumentRoot /path/to/pocket-elevenlabs
    
    <Directory /path/to/pocket-elevenlabs>
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/pocket-elevenlabs-error.log
    CustomLog ${APACHE_LOG_DIR}/pocket-elevenlabs-access.log combined
</VirtualHost>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name pocket-elevenlabs.local;
    root /path/to/pocket-elevenlabs;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
    }
    
    error_log /var/log/nginx/pocket-elevenlabs-error.log;
    access_log /var/log/nginx/pocket-elevenlabs-access.log;
}
```

### Configuração do PHP

Recomendações para `php.ini`:

```ini
max_execution_time = 300
memory_limit = 128M
post_max_size = 8M
upload_max_filesize = 2M
display_errors = Off
log_errors = On
error_reporting = E_ALL
```

## Restrições Técnicas

1. **Limite de Caracteres**: Máximo de 5000 caracteres por requisição à API ElevenLabs
2. **Tempo de Execução**: Timeout de requisições definido como 30 segundos
3. **Cache**: Duração do cache de 1 hora para vozes
4. **Cross-Origin**: Configurações CORS para permitir acesso da aplicação frontend
5. **Streaming**: Buffering e compressão PHP desabilitados para streaming adequado

## Dependências

### Frontend (CDN)

| Biblioteca | Versão | URL |
|------------|--------|-----|
| Bootstrap CSS | 5.3.3 | https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css |
| Bootstrap JS | 5.3.3 | https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js |
| Bootstrap Icons | 1.11.3 | https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css |

### PHP (Nativas)

| Extensão/Módulo | Função |
|-----------------|--------|
| cURL | Requisições HTTP para a API ElevenLabs |
| JSON | Codificação/decodificação de dados |
| FileInfo | Manipulação de tipos MIME |
| OPCache | Recomendado para otimização | 