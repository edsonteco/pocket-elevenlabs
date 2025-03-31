# System Patterns - Pocket ElevenLabs

## Arquitetura do Sistema

O Pocket ElevenLabs segue uma arquitetura cliente-servidor simplificada:

```
[Cliente - Frontend JS/HTML] <---> [Backend PHP - Proxy API] <---> [ElevenLabs API]
```

### Componentes Principais

1. **Frontend (HTML/JS/CSS)**:
   - Interface de usuário construída com Bootstrap 5
   - Lógica de interação com usuário e manipulação de formulários
   - Sistema de processamento de texto
   - Armazenamento local (localStorage) para configurações

2. **Backend (PHP)**:
   - Endpoints de proxy para comunicação com a API ElevenLabs
   - Sistema de cache para otimização de chamadas
   - Streaming direto de áudio para o cliente
   - Validação de entradas e sanitização

3. **Serviços Externos**:
   - API ElevenLabs para geração de áudio
   - Gerenciamento de créditos e vozes

## Principais Decisões Técnicas

### Segurança

1. **Armazenamento de Chave API**:
   - Chave API armazenada exclusivamente no navegador do cliente
   - Transmitida ao servidor apenas durante as requisições
   - Nunca armazenada no servidor

2. **Validação e Sanitização**:
   - Validação rigorosa de entradas no backend e frontend
   - Sanitização de dados para prevenir injection
   - Logs sem dados sensíveis completos

### Otimização

1. **Cache de Vozes**:
   - Sistema de cache para reduzir chamadas à API de vozes
   - Cache com tempo de expiração definido

2. **Streaming Direto**:
   - Áudio transmitido diretamente da API para o cliente
   - Sem armazenamento intermediário no servidor

3. **Reuso de Request IDs**:
   - Armazenamento do último request ID para regenerações
   - Permite até 2 regenerações sem custo adicional

### Processamento de Texto

1. **Preprocessamento**:
   - Conversão de números para texto por extenso
   - Formatação de moedas para melhor pronúncia
   - Tratamento de abreviações comuns

2. **Feedback Visual**:
   - Sistema de diferenciação para mostrar alterações no texto
   - Destaque de modificações para confirmação do usuário

## Padrões de Design Utilizados

1. **Proxy Pattern**:
   - Backend atua como proxy para a API ElevenLabs
   - Adiciona cache, validação e tratamento de erros

2. **Observer Pattern**:
   - Atualizações reativas da interface baseadas em eventos
   - Contador de caracteres e feedback visual

3. **Factory Pattern**:
   - Criação de objetos de configuração para requisições à API
   - Geração dinâmica de parâmetros de voz

4. **Singleton Pattern**:
   - Gerenciamento único de sessão e configurações
   - Controle centralizado de estado

## Relação Entre Componentes

### Fluxo de Dados

1. **Validação de API Key**:
   ```
   [Frontend] -> Envio de chave API -> [Backend] -> Validação com API ElevenLabs
   [Frontend] <- Resposta de validação <- [Backend]
   ```

2. **Listagem de Vozes**:
   ```
   [Frontend] -> Requisição de vozes -> [Backend] -> [Cache] ou [API ElevenLabs]
   [Frontend] <- Lista de vozes <- [Backend]
   ```

3. **Geração de Áudio**:
   ```
   [Frontend] -> Texto processado + Configurações -> [Backend] -> API ElevenLabs
   [Frontend] <- Streaming de áudio <- [Backend] <- API ElevenLabs
   ```

4. **Verificação de Créditos**:
   ```
   [Frontend] -> Requisição de saldo -> [Backend] -> API ElevenLabs
   [Frontend] <- Saldo de créditos <- [Backend]
   ```

### Interações de Componentes

- O frontend gerencia o estado da aplicação e interação com usuário
- O backend funciona como um proxy seguro, adicionando cache e otimizações
- A comunicação entre frontend e backend é feita via requisições AJAX
- O streaming de áudio é realizado em tempo real sem armazenamento intermediário 