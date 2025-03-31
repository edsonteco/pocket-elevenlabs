# Pocket ElevenLabs

Uma aplicação web simples para gerar áudio a partir de texto usando a API do ElevenLabs, com recursos avançados de processamento de texto e otimização de geração.

## Recursos Principais

- Interface responsiva com Bootstrap 5
- Processamento automático de texto para melhor pronúncia
- Streaming direto de áudio para melhor performance
- Sistema de cache para reduzir chamadas à API
- Regeneração otimizada de áudio sem custo adicional
- Persistência de configurações no navegador
- Monitoramento de créditos da conta ElevenLabs
- Download de áudio gerado em formato MP3

## Requisitos

- PHP 8.2 ou superior
- Servidor web (Apache, Nginx, etc.)
- Chave API do ElevenLabs
- Acesso à internet para comunicação com a API

## Instalação

1. Clone este repositório:
```bash
git clone https://github.com/seu-usuario/pocket-elevenlabs.git
cd pocket-elevenlabs
```

2. Configure as permissões dos diretórios:
```bash
mkdir -p cache logs api/storage
chmod 755 cache logs api/storage
```

3. Configure seu servidor web para apontar para o diretório do projeto.

## Estrutura do Projeto

- `index.html` - Interface principal da aplicação
- `js/app.js` - Lógica de front-end e comunicação com API
- `css/styles.css` - Estilos personalizados
- `api/` - Endpoints PHP para comunicação com a API ElevenLabs
  - `config.php` - Configurações e funções comuns
  - `generate_audio.php` - Geração e streaming de áudio
  - `get_voices.php` - Lista de vozes disponíveis (com cache)
  - `get_credits.php` - Consulta de créditos disponíveis
  - `get_last_request_id.php` - Gerenciamento de IDs de requisição

## Fluxo de Uso

1. Acesse a aplicação através do seu navegador.

2. Na primeira execução, você será solicitado a inserir sua chave API do ElevenLabs.

3. Digite o texto que deseja converter em áudio (máximo 5000 caracteres).

4. Configure as opções de voz:
   - Voz desejada (carregadas automaticamente da sua conta)
   - Modelo de voz (Multilingual, Flash, Turbo ou Scribe)
   - Velocidade de fala (0.7x a 1.2x)
   - Estabilidade, similaridade e estilo
   - Speaker boost (para maior clareza)

5. Clique em "Gerar" para criar o áudio.
   - O texto será automaticamente processado para melhorar a pronúncia
   - Você poderá revisar as alterações antes de confirmar
   - O áudio será transmitido diretamente da API para seu navegador

6. Use o player de áudio para ouvir o resultado ou baixe o arquivo MP3.

7. Você pode regenerar o áudio sem custo adicional de caracteres (até 2 tentativas).

## Recursos Técnicos

### Processamento de Texto
- Conversão automática de números para texto por extenso
- Adaptação de formatos de moeda para melhor pronúncia
- Tratamento de abreviações e símbolos comuns
- Prévia de alterações com destaque para modificações

### Otimização de Chamadas API
- Sistema de cache para lista de vozes
- Reuso de request IDs para regenerações sem custo
- Streaming direto do áudio sem armazenamento intermediário
- Monitoramento de saldo de caracteres em tempo real

### Segurança
- API key armazenada apenas no navegador do cliente
- Validação robusta de entradas
- Logs detalhados de erros e chamadas API
- Sanitização de dados sensíveis nos logs

## Limitações

- Limite de 5000 caracteres por geração
- Necessidade de conexão com internet
- Dependência da disponibilidade da API ElevenLabs

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests com melhorias.

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE.md para detalhes. 