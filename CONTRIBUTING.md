# Guia de Contribuição

Obrigado pelo seu interesse em contribuir com o Pocket ElevenLabs! Este documento fornece diretrizes e instruções para contribuir com o projeto.

## Como Contribuir

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Padrões de Código

### Frontend (JavaScript)
- Use JavaScript moderno (ES6+)
- Funções de processamento de texto devem ser expostas para permitir testes:
  - `processText()` como função principal
  - Funções auxiliares como `convertNumberToText()` e `convertCurrencyToText()`
- Manipulação de estado via funções específicas:
  - `saveSettings()` para persistir configurações
  - `loadSettings()` para carregar configurações
- Chamadas API com tratamento de erro e feedback visual

### Backend (PHP)
- Use PHP 8.2 ou superior
- Siga as PSR-12 para estilo de código PHP
- Validação rigorosa de entradas:
  - Validar API key antes de qualquer operação
  - Limitar tamanho do texto a 5000 caracteres
  - Sanitizar dados sensíveis em logs
- Streaming de áudio direto sem armazenamento intermediário

### Convenções de Nomenclatura

1. Funções JavaScript:
   - Verbos em camelCase para ações (ex: `generateAudio()`, `fetchVoices()`)
   - Auxiliares com prefixo descritivo (ex: `showError()`, `updateCharCounter()`)

2. IDs HTML:
   - Formato kebab-case (ex: `voice-select`, `text-input`)
   - Sufixos padrão para tipos: `-btn` para botões, `-range` para sliders

3. Endpoints PHP:
   - Nomes descritivos com underscores (ex: `get_voices.php`, `generate_audio.php`)
   - Prefixos para tipo de operação (`get_`, `generate_`)

## Estrutura do Projeto

```
pocket-elevenlabs/
├── api/                    # Endpoints da API
│   ├── config.php          # Configurações e funções comuns
│   ├── generate_audio.php  # Geração e streaming de áudio
│   ├── get_voices.php      # Lista de vozes disponíveis
│   ├── get_credits.php     # Consulta de créditos disponíveis
│   ├── get_last_request_id.php # Gerenciamento de IDs de requisição
│   ├── logs/               # Logs de erro
│   └── storage/            # Armazenamento de request IDs
├── css/                    # Arquivos CSS
│   └── styles.css          # Estilos personalizados
├── js/                     # Arquivos JavaScript
│   └── app.js              # Lógica principal da aplicação
├── cache/                  # Cache de dados
├── memory-bank/            # Documentação do projeto
└── index.html              # Interface principal
```

## Fluxos de Trabalho Importantes

### Processamento de Texto
- Sempre processar antes de enviar para a API
- Mostrar ao usuário as mudanças para confirmação
- Preservar texto original para referência

### Regeneração de Áudio
- Utilizar request ID da última geração bem-sucedida
- Permitir até 2 regenerações sem custo adicional
- Armazenar request ID no servidor para persistência

### Validação de API Key
- Verificar no frontend antes de salvar (formato válido)
- Validar no backend com requisição real à API
- Armazenar apenas no localStorage do cliente

## Otimizações a Considerar

1. Cache de vozes com duração de 1 hora para reduzir chamadas à API
2. Streaming direto de áudio para evitar problemas com arquivos grandes
3. Configurações do PHP para operações de longa duração
4. Controle de estado da interface durante operações

## Testes

- Teste todas as novas funcionalidades
- Verifique a compatibilidade com diferentes navegadores
- Teste em diferentes tamanhos de tela
- Verifique a performance
- Teste o processamento de texto com diferentes casos

## Documentação

- Atualize o README.md quando necessário
- Documente novas funcionalidades
- Mantenha a documentação no diretório `memory-bank/` atualizada
- Inclua exemplos de uso

## Segurança

- Não exponha informações sensíveis (especialmente API keys)
- Valide todas as entradas
- Sanitize dados de saída
- Mascare dados sensíveis nos logs
- Siga as melhores práticas de segurança

## Pull Requests

1. Descreva claramente as mudanças
2. Inclua testes quando possível
3. Atualize a documentação relevante
4. Verifique que sua implementação segue os padrões do projeto
5. Mantenha o escopo do PR focado

## Comunicação

- Seja profissional e respeitoso
- Use português para comunicação
- Responda a comentários e revisões
- Mantenha discussões focadas

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a licença MIT do projeto.

## Suporte

Se precisar de ajuda ou tiver dúvidas:
- Abra uma issue
- Entre em contato com os mantenedores
- Consulte a documentação no diretório `memory-bank/`

Obrigado por contribuir com o Pocket ElevenLabs! 