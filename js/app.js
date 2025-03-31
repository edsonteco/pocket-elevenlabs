document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Inicializando aplicação');
    // Elementos da UI
    const elements = {
        textInput: document.getElementById('text-input'),
        charCounter: document.getElementById('char-counter'),
        generateBtn: document.getElementById('generate-btn'),
        downloadBtn: document.getElementById('download-btn'),
        audioPlayer: document.getElementById('audio-player'),
        audioOutput: document.getElementById('audio-output'),
        creditsAvailable: document.getElementById('credits-available'),
        creditsTotal: document.getElementById('credits-total'),
        creditsProgress: document.getElementById('credits-progress'),
        creditsPercent: document.getElementById('credits-percent'),
        configApiBtn: document.getElementById('config-api-btn'),
        apiKeyModal: new bootstrap.Modal(document.getElementById('apiKeyModal')),
        apiKeyInput: document.getElementById('api-key'),
        saveApiKeyBtn: document.getElementById('save-api-key'),
        apiKeyStatus: document.getElementById('api-key-status'),
        voiceSelect: document.getElementById('voice-select'),
        modelSelect: document.getElementById('model-select'),
        speedRange: document.getElementById('speed-range'),
        speedValue: document.getElementById('speed-value'),
        stabilityRange: document.getElementById('stability-range'),
        stabilityValue: document.getElementById('stability-value'),
        similarityRange: document.getElementById('similarity-range'),
        similarityValue: document.getElementById('similarity-value'),
        styleRange: document.getElementById('style-range'),
        styleValue: document.getElementById('style-value'),
        speakerBoost: document.getElementById('speaker-boost'),
        loadingSpinner: document.getElementById('loading-spinner'),
        confirmTextModal: new bootstrap.Modal(document.getElementById('confirmTextModal')),
        originalTextDisplay: document.getElementById('original-text'),
        processedTextDisplay: document.getElementById('processed-text'),
        confirmTextBtn: document.getElementById('confirm-text-btn'),
        cancelTextBtn: document.getElementById('cancel-text-btn'),
    };
    console.log('Elementos da UI inicializados');
    
    // Estado da aplicação
    const state = {
        apiKey: localStorage.getItem('elevenlabs_api_key'),
        audioBlob: null,
        isInitialized: false,
        lastRequestId: '',
        lastCreditsUpdate: 0,
        credits: {
            available: 0,
            total: 0
        }
    };
    
    // Log detalhado da API key
    if (state.apiKey) {
        console.log('API Key encontrada no localStorage', { 
            comprimento: state.apiKey.length, 
            iniciais: state.apiKey.substring(0, 5) + '...',
            formatoCorreto: state.apiKey.startsWith('sk_') 
        });
    } else {
        console.log('API Key NÃO encontrada no localStorage');
    }
    
    console.log('Estado da aplicação inicializado', { temApiKey: !!state.apiKey });
    
    // Função para mostrar erros
    function showError(message) {
        console.log('showError: Exibindo mensagem de erro', { message });
        const container = document.querySelector('.container-fluid');
        if (!container) {
            console.error('Container não encontrado');
            return;
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show';
        errorDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        container.insertBefore(errorDiv, container.firstChild);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
        console.log('showError: Erro exibido e programado para desaparecer em 5s');
    }
    
    // Função para mostrar status da API key
    function showApiKeyStatus(message, type) {
        console.log('showApiKeyStatus:', { message, type });
        elements.apiKeyStatus.textContent = message;
        elements.apiKeyStatus.className = `alert alert-${type}`;
        elements.apiKeyStatus.classList.remove('d-none');
    }
    
    // Função para habilitar/desabilitar interface
    function enableInterface(enable = true) {
        console.log('enableInterface:', { enable });
        const controlIds = [
            'text-input', 'voice-select', 'model-select', 
            'speed-range', 'stability-range', 'similarity-range', 
            'style-range', 'speaker-boost'
        ];

        controlIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.disabled = !enable;
            }
        });
        console.log('enableInterface: Interface atualizada');
    }
    
    // Função para validar e salvar API key
    async function validateAndSaveApiKey() {
        console.log('validateAndSaveApiKey: Iniciando validação');
        const newApiKey = elements.apiKeyInput.value.trim();
        if (!newApiKey) {
            console.log('validateAndSaveApiKey: API key vazia');
            showApiKeyStatus('Por favor, insira uma chave API válida.', 'danger');
            return;
        }
        
        // Log detalhado da API key inserida
        console.log('validateAndSaveApiKey: Nova API key', { 
            comprimento: newApiKey.length, 
            iniciais: newApiKey.substring(0, 5) + '...',
            formatoCorreto: newApiKey.startsWith('sk_')
        });
        
        try {
            console.log('validateAndSaveApiKey: Testando API key');
            // Testar a chave API
            console.log('validateAndSaveApiKey: Antes do fetch para get_voices.php');
            const response = await fetch('api/get_voices.php', {
                headers: {
                    'X-API-Key': newApiKey
                }
            });
            console.log('validateAndSaveApiKey: Depois do fetch para get_voices.php', { 
                status: response.status,
                ok: response.ok,
                headers: [...response.headers.entries()].map(h => `${h[0]}: ${h[1]}`).join(', ')
            });
            
            if (!response.ok) {
                console.log('validateAndSaveApiKey: Resposta não OK', { status: response.status });
                throw new Error('Chave API inválida');
            }
            
            // API key válida
            console.log('validateAndSaveApiKey: API key validada com sucesso');
            state.apiKey = newApiKey;
            localStorage.setItem('elevenlabs_api_key', state.apiKey);
            elements.apiKeyModal.hide();
            showApiKeyStatus('Chave API salva com sucesso!', 'success');
            
            // Inicializar se ainda não foi feito
            if (!state.isInitialized) {
                console.log('validateAndSaveApiKey: Iniciando app pela primeira vez');
                await initializeApp();
            } else {
                // Recarregar dados
                console.log('validateAndSaveApiKey: Recarregando dados');
                await Promise.all([fetchVoices(), fetchCredits()]);
            }
            console.log('validateAndSaveApiKey: Processo finalizado com sucesso');
        } catch (error) {
            console.log('validateAndSaveApiKey: Erro ao validar', { error: error.message });
            showApiKeyStatus('Erro ao validar chave API: ' + error.message, 'danger');
        }
    }
    
    // Função para atualizar contador de caracteres
    function updateCharCounter() {
        console.log('updateCharCounter: Atualizando contador');
        if (!elements.charCounter) return;
        
        const length = elements.textInput.value.length;
        elements.charCounter.textContent = `${length}/5000 caracteres`;
        console.log('updateCharCounter: Contador atualizado', { length });
    }
    
    // Função para processar texto - implementação completa
    function processText(text) {
        console.log('processText: Iniciando processamento', { tamanhoTexto: text.length });
        
        // Tratar valores monetários primeiro (antes de processar números simples)
        let processedText = text.replace(/R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)/g, (match, value) => {
            console.log('processText: Convertendo valor monetário BRL', { valor: match });
            return convertCurrencyToText(value, 'BRL');
        });
        
        // Tratar dólares
        processedText = processedText.replace(/\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)/g, (match, value) => {
            console.log('processText: Convertendo valor monetário USD', { valor: match });
            return convertCurrencyToText(value, 'USD');
        });
        
        // Converter números normais (sem cifrão)
        processedText = processedText.replace(/\b(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)\b/g, (match) => {
            // Remover pontos e substituir vírgula por ponto para processamento
            const cleanNumber = match.replace(/\./g, '').replace(',', '.');
            const number = parseFloat(cleanNumber);
            
            console.log('processText: Convertendo número', { numero: match, limpo: cleanNumber, valor: number });
            
            // Verificar se é um número com parte decimal
            if (match.includes(',')) {
                const parts = match.split(',');
                const integerPart = parts[0].replace(/\./g, ''); // Remove pontos
                const decimalPart = parts[1];
                
                const integerText = convertNumberToText(parseInt(integerPart));
                const decimalText = convertNumberToText(parseInt(decimalPart));
                
                // Para números decimais comuns
                return `${integerText} vírgula ${decimalText}`;
            }
            
            // Para números inteiros (remove pontos separadores de milhar)
            return convertNumberToText(parseInt(match.replace(/\./g, '')));
        });
        
        // Corrigir "aos" seguido de palavra
        processedText = processedText.replace(/\baos\s+([A-Za-zÀ-ÿ]+)\b/g, 'aos$1');
        
        // Corrigir "usa" para "uza"
        processedText = processedText.replace(/\busa\b/g, 'uza');
        
        console.log('processText: Processamento concluído');
        return processedText;
    }

    // Nova função para converter moedas para texto
    function convertCurrencyToText(value, currency) {
        // Remove pontos e substitui vírgula por ponto para processamento
        const sanitizedValue = value.replace(/\./g, '').replace(',', '.');
        const amount = parseFloat(sanitizedValue);
        
        // Separar parte inteira e centavos
        const parts = sanitizedValue.split('.');
        const integerPart = parseInt(parts[0]);
        const decimalPart = parts.length > 1 ? parseInt(parts[1].padEnd(2, '0').substring(0, 2)) : 0;
        
        const integerText = convertNumberToText(integerPart);
        
        // Adicionar unidade monetária e centavos
        let result = '';
        
        if (currency === 'BRL') {
            result = integerPart === 1 ? `${integerText} real` : `${integerText} reais`;
            
            if (decimalPart > 0) {
                const decimalText = convertNumberToText(decimalPart);
                result += decimalPart === 1 ? ` e ${decimalText} centavo` : ` e ${decimalText} centavos`;
            }
        } 
        else if (currency === 'USD') {
            result = integerPart === 1 ? `${integerText} dólar` : `${integerText} dólares`;
            
            if (decimalPart > 0) {
                const decimalText = convertNumberToText(decimalPart);
                result += decimalPart === 1 ? ` e ${decimalText} centavo` : ` e ${decimalText} centavos`;
            }
        }
        
        return result;
    }
    
    // Função auxiliar para conversão de números para texto
    function convertNumberToText(number) {
        console.log('convertNumberToText:', { number });
        const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
        const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
        const tens = ['', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
        const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
        const scales = ['', 'mil', 'milhão', 'bilhão', 'trilhão'];
        const scalesPlural = ['', 'mil', 'milhões', 'bilhões', 'trilhões'];
        
        if (number === 0) return 'zero';
        if (number === 100) return 'cem';
        
        // Função auxiliar para converter grupos de 3 dígitos
        function convertGroup(num) {
            let result = '';
            
            if (num >= 100) {
                result += hundreds[Math.floor(num / 100)];
                num %= 100;
                
                if (num > 0) {
                    result += ' e ';
                }
            }
            
            if (num >= 20) {
                const tensDigit = Math.floor(num / 10);
                result += tens[tensDigit];
                num %= 10;
                
                if (num > 0) {
                    if (tensDigit === 2) { // Exceção para números 21-29
                        result += ' ';
                    } else {
                        result += ' e ';
                    }
                }
            } else if (num >= 10) {
                result += teens[num - 10];
                num = 0;
            }
            
            if (num > 0) {
                result += units[num];
            }
            
            return result;
        }
        
        // Tratar o caso especial de zero
        if (number === 0) {
            return 'zero';
        }
        
        let result = '';
        let scaleIndex = 0;
        
        // Processar o número em grupos de 3 dígitos
        while (number > 0) {
            const group = number % 1000;
            
            if (group > 0) {
                // Exceção: Na casa dos milhares, quando o grupo é 1, apenas usar "mil" (sem o "um")
                if (scaleIndex === 1 && group === 1) {
                    result = scales[scaleIndex] + (result ? ' ' + result : '');
                } else if (scaleIndex > 0) {
                    const groupText = convertGroup(group);
                    const scaleName = group === 1 ? scales[scaleIndex] : scalesPlural[scaleIndex];
                    result = groupText + ' ' + scaleName + (result ? ' ' + result : '');
                } else {
                    const groupText = convertGroup(group);
                    result = groupText + (result ? ' ' + result : '');
                }
            }
            
            number = Math.floor(number / 1000);
            scaleIndex++;
        }
        
        return result.trim();
    }
    
    // Função para buscar vozes
    async function fetchVoices() {
        console.log('fetchVoices: Iniciando busca de vozes');
        console.log('fetchVoices: Usando API key', { 
            comprimento: state.apiKey?.length || 0,
            iniciais: state.apiKey ? (state.apiKey.substring(0, 5) + '...') : 'nenhuma'
        });
        
        try {
            console.log('fetchVoices: Antes do fetch para get_voices.php');
            const headers = { 'X-API-Key': state.apiKey };
            console.log('fetchVoices: Headers da requisição', { headers });
            
            const response = await fetch('api/get_voices.php', {
                headers: headers
            });
            console.log('fetchVoices: Depois do fetch para get_voices.php', { 
                status: response.status,
                ok: response.ok,
                url: response.url,
                type: response.type,
                headers: [...response.headers.entries()].map(h => `${h[0]}: ${h[1]}`).join(', ')
            });
            
            if (!response.ok) {
                console.log('fetchVoices: Resposta não OK', { status: response.status });
                throw new Error('Erro ao carregar vozes');
            }
            
            const data = await response.json();
            console.log('fetchVoices: Dados recebidos', { quantidade: data.voices.length });
            elements.voiceSelect.innerHTML = '';
            
            data.voices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.voice_id;
                option.textContent = voice.name;
                elements.voiceSelect.appendChild(option);
            });
            
            // Restaurar voz salva
            const savedSettings = localStorage.getItem('elevenlabs_settings');
            if (savedSettings) {
                console.log('fetchVoices: Tentando restaurar voz salva');
                const settings = JSON.parse(savedSettings);
                if (settings.voiceId) {
                    elements.voiceSelect.value = settings.voiceId;
                    console.log('fetchVoices: Voz restaurada', { voiceId: settings.voiceId });
                }
            }
            
            console.log('fetchVoices: Busca de vozes concluída com sucesso');
            return true;
        } catch (error) {
            console.log('fetchVoices: Erro ao buscar vozes', { error: error.message });
            console.error('Erro ao buscar vozes:', error);
            showError('Erro ao carregar vozes: ' + error.message);
            return false;
        }
    }
    
    // Crie uma versão protegida da função fetchCredits
    async function safelyFetchCredits() {
        // Verificar se já se passaram pelo menos 3 segundos desde a última chamada
        const now = Date.now();
        const timeSinceLastUpdate = now - state.lastCreditsUpdate;
        
        if (timeSinceLastUpdate < 3000) { // 3000ms = 3 segundos
            console.log('safelyFetchCredits: Ignorando chamada recente', { 
                secondsAgo: (timeSinceLastUpdate / 1000).toFixed(1),
                nextUpdateIn: ((3000 - timeSinceLastUpdate) / 1000).toFixed(1) + 's'
            });
            return false;
        }
        
        // Se passou tempo suficiente, atualizar timestamp e chamar fetchCredits
        state.lastCreditsUpdate = now;
        console.log('safelyFetchCredits: Buscando créditos');
        return await fetchCredits();
    }

    // Função para buscar créditos
    async function fetchCredits() {
        console.log('fetchCredits: Iniciando busca de créditos');
        console.log('fetchCredits: Usando API key', { 
            comprimento: state.apiKey?.length || 0,
            iniciais: state.apiKey ? (state.apiKey.substring(0, 5) + '...') : 'nenhuma'
        });
        
        try {
            console.log('fetchCredits: Antes do fetch para get_credits.php');
            const headers = { 'X-API-Key': state.apiKey };
            console.log('fetchCredits: Headers da requisição', { headers });
            
            const response = await fetch('api/get_credits.php', {
                headers: headers
            });
            console.log('fetchCredits: Depois do fetch para get_credits.php', { 
                status: response.status,
                ok: response.ok,
                url: response.url,
                type: response.type,
                headers: [...response.headers.entries()].map(h => `${h[0]}: ${h[1]}`).join(', ')
            });
            
            if (!response.ok) {
                console.log('fetchCredits: Resposta não OK', { status: response.status });
                throw new Error('Erro ao buscar créditos');
            }
            
            const data = await response.json();
            console.log('fetchCredits: Dados recebidos', { available: data.available, total: data.total });
            
            // Atualizar estado
            state.credits = {
                available: data.available,
                total: data.total
            };
            
            // Formatar os números com separadores de milhares
            const formatNumber = (num) => {
                return new Intl.NumberFormat('pt-BR').format(num);
            };
            
            // Atualizar UI
            elements.creditsAvailable.textContent = formatNumber(data.available);
            elements.creditsTotal.textContent = formatNumber(data.total);
            
            // Calcular porcentagem usada
            const usedPercent = data.total > 0 
                ? Math.round(((data.total - data.available) / data.total) * 100) 
                : 0;
            
            console.log('fetchCredits: Porcentagem usada calculada', { usedPercent });
            
            // Atualizar barra de progresso
            elements.creditsProgress.style.width = `${usedPercent}%`;
            elements.creditsPercent.textContent = `${usedPercent}%`;
            
            // Mudar cor da barra baseado no uso
            if (usedPercent > 90) {
                elements.creditsProgress.className = 'progress-bar bg-danger';
            } else if (usedPercent > 75) {
                elements.creditsProgress.className = 'progress-bar bg-warning';
            } else {
                elements.creditsProgress.className = 'progress-bar bg-success';
            }
            
            console.log('fetchCredits: Busca de créditos concluída com sucesso');
            return true;
        } catch (error) {
            console.log('fetchCredits: Erro ao buscar créditos', { error: error.message });
            console.error('Erro ao buscar créditos:', error);
            elements.creditsAvailable.textContent = '--';
            elements.creditsTotal.textContent = '--';
            elements.creditsPercent.textContent = '0%';
            elements.creditsProgress.style.width = '0%';
            return false;
        }
    }
    
    // Função para salvar configurações
    function saveSettings() {
        console.log('saveSettings: Salvando configurações');
        const settings = {
            model: elements.modelSelect.value,
            speed: elements.speedRange.value,
            stability: elements.stabilityRange.value,
            similarity: elements.similarityRange.value,
            style: elements.styleRange.value,
            speakerBoost: elements.speakerBoost.checked,
            voiceId: elements.voiceSelect.value,
            text: elements.textInput.value,
            timestamp: new Date().getTime()
        };
        
        localStorage.setItem('elevenlabs_settings', JSON.stringify(settings));
        console.log('saveSettings: Configurações salvas', { settings });
    }
    
    // Função para carregar configurações
    async function loadSettings() {
        console.log('loadSettings: Iniciando carregamento de configurações');
        const savedSettings = localStorage.getItem('elevenlabs_settings');
        if (!savedSettings) {
            console.log('loadSettings: Nenhuma configuração encontrada');
            return false;
        }
        
        try {
            const settings = JSON.parse(savedSettings);
            console.log('loadSettings: Configurações encontradas', { settings });
            
            // Restaurar configurações
            elements.modelSelect.value = settings.model || 'eleven_multilingual_v1';
            elements.speedRange.value = settings.speed || 1.0;
            elements.speedValue.textContent = settings.speed || '1.00';
            elements.stabilityRange.value = settings.stability || 30;
            elements.stabilityValue.textContent = `${settings.stability || 30}%`;
            elements.similarityRange.value = settings.similarity || 85;
            elements.similarityValue.textContent = `${settings.similarity || 85}%`;
            elements.styleRange.value = settings.style || 30;
            elements.styleValue.textContent = `${settings.style || 30}%`;
            elements.speakerBoost.checked = settings.speakerBoost !== undefined ? settings.speakerBoost : true;
            elements.textInput.value = settings.text || '';
            
            // Atualizar contador
            updateCharCounter();
            
            console.log('loadSettings: Configurações restauradas com sucesso');
            return true;
        } catch (error) {
            console.log('loadSettings: Erro ao carregar configurações', { error: error.message });
            console.error('Erro ao carregar configurações:', error);
            return false;
        }
    }
    
    // Adicionar esta nova função ao seu código
    async function getLastRequestId() {
        try {
            console.log('getLastRequestId: Buscando último request-id');
            const response = await fetch('api/get_last_request_id.php', {
                headers: {
                    'X-API-Key': state.apiKey
                }
            });
            
            if (!response.ok) {
                console.log('getLastRequestId: Erro na resposta', { status: response.status });
                return false; // Retorna false para indicar erro
            }
            
            const data = await response.json();
            if (data.request_id) {
                state.lastRequestId = data.request_id;
                console.log('getLastRequestId: Request-ID obtido:', state.lastRequestId);
                return true; // Retorna true para indicar sucesso
            } else {
                console.log('getLastRequestId: Nenhum request-id encontrado');
                return false;
            }
        } catch (error) {
            console.error('getLastRequestId: Erro ao obter request-id:', error);
            return false;
        }
    }

    // Função para destacar as diferenças entre dois textos
    function highlightDifferences(original, processed) {
        // Dividir os textos em palavras
        const originalWords = original.split(/(\s+)/);
        const processedWords = processed.split(/(\s+)/);
        
        let result = '';
        let i = 0, j = 0;
        
        // Criar uma versão com as diferenças destacadas
        while (i < processedWords.length) {
            if (i < processedWords.length && j < originalWords.length && processedWords[i] === originalWords[j]) {
                // Palavras iguais, manter sem destaque
                result += processedWords[i];
                i++;
                j++;
            } else {
                // Diferença encontrada, destacar com negrito
                result += '<strong class="text-danger">' + processedWords[i] + '</strong>';
                
                // Avançar no texto processado (pulando eventuais processamentos que removeram texto)
                i++;
                
                // Tentar encontrar a próxima correspondência no texto original
                let found = false;
                for (let lookahead = 1; lookahead < 5 && j + lookahead < originalWords.length; lookahead++) {
                    if (processedWords[i] === originalWords[j + lookahead]) {
                        j += lookahead;
                        found = true;
                        break;
                    }
                }
                
                // Se não encontrou correspondência, simplesmente avançar no texto original
                if (!found) j++;
            }
        }
        
        return result;
    }

    // Função para gerar lista de alterações
    function generateChangesList(original, processed) {
        // Encontrar alterações específicas conhecidas (números, valores monetários, etc.)
        const changes = [];
        
        // Verificar alterações de valores monetários (R$)
        const moneyPattern = /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)/g;
        let match;
        
        while ((match = moneyPattern.exec(original)) !== null) {
            const originalValue = match[0];
            const startPos = match.index;
            const endPos = startPos + originalValue.length;
            
            // Encontrar o valor correspondente no texto processado (já convertido)
            const beforeContext = original.substring(Math.max(0, startPos - 20), startPos);
            const afterContext = original.substring(endPos, Math.min(original.length, endPos + 20));
            
            // Buscar esse contexto no texto processado
            const contextPattern = new RegExp(
                escapeRegExp(beforeContext) + '(.+?)' + escapeRegExp(afterContext)
            );
            
            const processedMatch = contextPattern.exec(processed);
            if (processedMatch) {
                changes.push({
                    type: 'Valor monetário',
                    original: originalValue,
                    processed: processedMatch[1],
                    context: '...' + beforeContext + '___' + afterContext + '...'
                });
            }
        }
        
        // Verificar alterações de números
        const numberPattern = /\b(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)\b/g;
        while ((match = numberPattern.exec(original)) !== null) {
            // Similar à lógica acima, mas para números comuns
            // (código similar para números...)
        }
        
        // Verificar correções de "aos"
        const aosPattern = /\baos\s+([A-Za-zÀ-ÿ]+)\b/g;
        // (código similar para "aos"...)
        
        // Verificar correções de "usa" para "uza"
        const usaPattern = /\busa\b/g;
        // (código similar para "usa"...)
        
        return changes;
    }

    // Função auxiliar para escapar caracteres especiais em regex
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Separar a verificação de texto da geração de áudio
    function checkAndConfirmText() {
        console.log('checkAndConfirmText: Iniciando verificação de texto');
        try {
            // Validar entrada
            const text = elements.textInput.value.trim();
            if (!text) {
                console.log('checkAndConfirmText: Texto vazio');
                showError('Por favor, insira um texto para gerar o áudio.');
                return;
            }
            
            // Processar texto sem modificar o original ainda
            console.log('checkAndConfirmText: Preparando processamento de texto');
            const processedText = processText(text);
            
            // Se o texto processado for diferente do original, mostrar confirmação
            if (processedText !== text) {
                console.log('checkAndConfirmText: Texto modificado, mostrando confirmação');
                
                // Mostrar os textos no modal
                elements.originalTextDisplay.textContent = text;
                elements.processedTextDisplay.textContent = processedText;
                
                // Exibir o modal
                elements.confirmTextModal.show();
                
                // Configurar os botões
                const confirmHandler = () => {
                    console.log('checkAndConfirmText: Usuário confirmou as alterações');
                    elements.confirmTextModal.hide();
                    elements.confirmTextBtn.removeEventListener('click', confirmHandler);
                    elements.cancelTextBtn.removeEventListener('click', cancelHandler);
                    
                    // Atualizar o campo de texto com as modificações
                    elements.textInput.value = processedText;
                    updateCharCounter(); // Atualizar o contador de caracteres
                    saveSettings(); // Salvar o novo texto
                    
                    showError('Texto processado com sucesso. Clique em "Gerar" para continuar.');
                };
                
                const cancelHandler = () => {
                    console.log('checkAndConfirmText: Usuário cancelou as alterações');
                    elements.confirmTextModal.hide();
                    elements.confirmTextBtn.removeEventListener('click', confirmHandler);
                    elements.cancelTextBtn.removeEventListener('click', cancelHandler);
                    
                    // Não fazer nada com o texto, apenas informar o usuário
                    showError('Processamento de texto cancelado. Clique em "Gerar" para continuar com o texto original.');
                };
                
                // Remover handlers anteriores (prevenção)
                elements.confirmTextBtn.removeEventListener('click', confirmHandler);
                elements.cancelTextBtn.removeEventListener('click', cancelHandler);
                
                // Adicionar novos handlers
                elements.confirmTextBtn.addEventListener('click', confirmHandler);
                elements.cancelTextBtn.addEventListener('click', cancelHandler);
                
                return false; // Indicar que o processo foi interrompido para confirmação
            } else {
                // Se não houve alterações, continuar diretamente
                console.log('checkAndConfirmText: Texto não modificado, pode prosseguir');
                return true; // Indicar que o processo pode continuar
            }
        } catch (error) {
            console.log('checkAndConfirmText: Erro ao processar texto', { error: error.message });
            console.error('Erro ao processar texto:', error);
            showError(error.message || 'Erro ao processar texto. Tente novamente.');
            return false; // Indicar que houve erro
        }
    }

    // Função para gerar áudio
    async function generateAudio() {
        console.log('generateAudio: Iniciando geração de áudio');
        
        // Esconder player e desabilitar botão de download
        elements.audioPlayer.classList.add('d-none');
        elements.downloadBtn.disabled = true;
        console.log('generateAudio: Player ocultado e botão de download desabilitado');
        
        // Validar entrada
        const text = elements.textInput.value.trim();
        if (!text) {
            console.log('generateAudio: Texto vazio');
            showError('Por favor, insira um texto para gerar o áudio.');
            return;
        }
        
        try {
            // Processar texto sem modificar o original ainda
            console.log('generateAudio: Preparando processamento de texto');
            const processedText = processText(text);
            
            // Se o texto processado for diferente do original, mostrar confirmação
            if (processedText !== text) {
                console.log('generateAudio: Texto modificado, mostrando confirmação');
                
                // Processar as diferenças - MANTER ESTA PARTE!
                const highlightedText = highlightDifferences(text, processedText);
                const changesList = generateChangesList(text, processedText);

                // Mostrar os textos no modal com highlights
                elements.originalTextDisplay.textContent = text;
                elements.processedTextDisplay.innerHTML = highlightedText;
                
                // Gerar e mostrar a lista de alterações
                let changesHTML = '';
                if (changesList.length > 0) {
                    changesHTML = '<div class="mt-3 p-2 border-top"><h6>Resumo das alterações:</h6><ul>';
                    changesList.forEach(change => {
                        changesHTML += `<li><strong>${change.type}:</strong> "${change.original}" → "${change.processed}"</li>`;
                    });
                    changesHTML += '</ul></div>';
                    elements.processedTextDisplay.innerHTML += changesHTML;
                }
                
                // Exibir o modal
                elements.confirmTextModal.show();
                
                // Configurar os botões para o fluxo flexível
                const confirmHandler = () => {
                    console.log('generateAudio: Usuário confirmou as alterações');
                    elements.confirmTextModal.hide();
                    elements.confirmTextBtn.removeEventListener('click', confirmHandler);
                    elements.cancelTextBtn.removeEventListener('click', cancelHandler);
                    
                    // Atualizar o campo de texto com as modificações
                    elements.textInput.value = processedText;
                    updateCharCounter();
                    saveSettings();
                    
                    showError('Texto processado com sucesso. Clique em "Gerar" novamente para continuar.');
                };
                
                const cancelHandler = () => {
                    console.log('generateAudio: Usuário cancelou as alterações');
                    elements.confirmTextModal.hide();
                    elements.confirmTextBtn.removeEventListener('click', confirmHandler);
                    elements.cancelTextBtn.removeEventListener('click', cancelHandler);
                    
                    showError('Processamento cancelado. Clique em "Gerar" novamente para usar o texto original.');
                };
                
                // Remover handlers anteriores para evitar duplicação
                elements.confirmTextBtn.removeEventListener('click', confirmHandler);
                elements.cancelTextBtn.removeEventListener('click', cancelHandler);
                
                // Adicionar novos handlers
                elements.confirmTextBtn.addEventListener('click', confirmHandler);
                elements.cancelTextBtn.addEventListener('click', cancelHandler);
                
                return; // Parar aqui e aguardar a confirmação do usuário
            }
            
            // Se chegou aqui, o texto não precisava ser processado, então continua com a geração
            console.log('generateAudio: Texto não modificado, prosseguindo com geração de áudio');
            
            // Desabilitar botão e mostrar loading
            elements.generateBtn.disabled = true;
            elements.generateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Gerando...';
            console.log('generateAudio: UI atualizada para estado de carregamento');
            
            // Aqui utilizamos o texto atual do campo
            const textToGenerate = elements.textInput.value.trim();
            
            // Obter configurações 
            const voiceId = elements.voiceSelect.value;
            const modelId = elements.modelSelect.value;
            const speed = parseFloat(elements.speedRange.value);
            const stability = parseFloat(elements.stabilityRange.value) / 100;
            const similarity = parseFloat(elements.similarityRange.value) / 100;
            const style = parseFloat(elements.styleRange.value) / 100;
            const speakerBoost = elements.speakerBoost.checked;
            
            // Fazer requisição
            const headers = {
                'Content-Type': 'application/json',
                'X-API-Key': state.apiKey
            };
            
            const requestBody = {
                text: textToGenerate,
                voiceId: voiceId,
                modelId: modelId,
                speed: speed,
                stability: stability,
                similarity: similarity,
                style: style,
                speakerBoost: speakerBoost
            };
            
            // Incluir o request-id anterior se estiver disponível
            if (state.lastRequestId && state.lastRequestId !== '') {
                console.log('generateAudio: Incluindo request-id anterior', { requestId: state.lastRequestId });
                requestBody.previousRequestId = state.lastRequestId;
            }

            const response = await fetch('api/generate_audio.php', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao gerar áudio');
            }
            
            // Processar áudio
            state.audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(state.audioBlob);
            
            // Configurar player
            elements.audioOutput.src = audioUrl;
            elements.audioOutput.style.display = 'block';
            elements.audioPlayer.classList.remove('d-none');
            elements.downloadBtn.disabled = false;
            
            // Reproduzir áudio automaticamente
            try {
                await elements.audioOutput.play();
            } catch (playError) {
                console.warn('Reprodução automática não permitida:', playError);
            }
            
            // Atualizar créditos e salvar configurações
            await fetchCredits();
            saveSettings();
            await getLastRequestId();
            
        } catch (error) {
            console.log('generateAudio: Erro ao gerar áudio', { error: error.message });
            console.error('Erro ao gerar áudio:', error);
            showError(error.message || 'Erro ao gerar áudio. Tente novamente.');
        } finally {
            // Restaurar UI
            elements.generateBtn.disabled = false;
            elements.generateBtn.innerHTML = '<i class="bi bi-play-fill"></i> Gerar';
            console.log('generateAudio: UI restaurada');
        }
    }

    // Função para gerar áudio
    async function generateAudio_original() {
        console.log('generateAudio: Iniciando geração de áudio');
        try {
            // Validar entrada
            const text = elements.textInput.value.trim();
            if (!text) {
                console.log('generateAudio: Texto vazio');
                showError('Por favor, insira um texto para gerar o áudio.');
                return;
            }
            
            // Desabilitar botão e mostrar loading
            elements.generateBtn.disabled = true;
            elements.generateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Gerando...';
            console.log('generateAudio: UI atualizada para estado de carregamento');
            
            // Processar texto
            console.log('generateAudio: Iniciando processamento de texto');
            const processedText = processText(text);
            
            // Obter configurações com a escala correta
            const voiceId = elements.voiceSelect.value;
            const modelId = elements.modelSelect.value;
            const speed = parseFloat(elements.speedRange.value);
            const stability = parseFloat(elements.stabilityRange.value) / 100; // Escala de 0-1
            const similarity = parseFloat(elements.similarityRange.value) / 100; // Escala de 0-1
            const style = parseFloat(elements.styleRange.value) / 100; // Escala de 0-1
            const speakerBoost = elements.speakerBoost.checked;
            
            console.log('generateAudio: Configurações para geração', { 
                voiceId, modelId, speed, stability, similarity, style, speakerBoost,
                tamanhoTexto: processedText.length
            });
            
            console.log('generateAudio: Usando API key', { 
                comprimento: state.apiKey?.length || 0,
                iniciais: state.apiKey ? (state.apiKey.substring(0, 5) + '...') : 'nenhuma'
            });
            
            // Fazer requisição
            console.log('generateAudio: Antes do fetch para generate_audio.php');
            const headers = {
                'Content-Type': 'application/json',
                'X-API-Key': state.apiKey
            };
            console.log('generateAudio: Headers da requisição', { headers });
            
            const requestBody = {
                text: processedText,
                voiceId: voiceId,
                modelId: modelId,
                speed: speed,
                stability: stability,
                similarity: similarity,
                style: style,
                speakerBoost: speakerBoost
            };
            
            // Incluir o request-id anterior se estiver disponível
            if (state.lastRequestId && state.lastRequestId !== '') {
                console.log('generateAudio: Incluindo request-id anterior', { requestId: state.lastRequestId });
                requestBody.previousRequestId = state.lastRequestId;
            }

            const response = await fetch('api/generate_audio.php', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            });
            console.log('generateAudio: Depois do fetch para generate_audio.php', { 
                status: response.status,
                ok: response.ok,
                url: response.url,
                type: response.type
            });
            
            if (!response.ok) {
                console.log('generateAudio: Resposta não OK', { status: response.status });
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao gerar áudio');
            }
            
            // Processar áudio
            console.log('generateAudio: Obtendo blob de áudio');
            state.audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(state.audioBlob);
            console.log('generateAudio: Áudio obtido e URL criada', { tipo: state.audioBlob.type, tamanho: state.audioBlob.size });
            
            // Configurar player
            elements.audioOutput.src = audioUrl;
            elements.audioOutput.style.display = 'block';
            elements.audioPlayer.classList.remove('d-none');
            elements.downloadBtn.disabled = false;
            console.log('generateAudio: Player configurado');
            
            // Reproduzir áudio automaticamente
            try {
                console.log('generateAudio: Tentando reprodução automática');
                await elements.audioOutput.play();
                console.log('generateAudio: Reprodução automática iniciada');
            } catch (playError) {
                console.log('generateAudio: Erro na reprodução automática', { error: playError.message });
                console.warn('Reprodução automática não permitida:', playError);
            }
            
            // Atualizar créditos
            console.log('generateAudio: Atualizando créditos');
            await fetchCredits();
            
            // Salvar configurações
            console.log('generateAudio: Salvando configurações');
            saveSettings();
            
            await getLastRequestId();

            console.log('generateAudio: Geração de áudio concluída com sucesso');
        } catch (error) {
            console.log('generateAudio: Erro ao gerar áudio', { error: error.message });
            console.error('Erro ao gerar áudio:', error);
            showError(error.message || 'Erro ao gerar áudio. Tente novamente.');
        } finally {
            // Restaurar UI
            elements.generateBtn.disabled = false;
            elements.generateBtn.innerHTML = '<i class="bi bi-play-fill"></i> Gerar';
            console.log('generateAudio: UI restaurada');
        }
    }
    
    // Substituir espaços e caracteres especiais por underscore e capitalizar palavras
    const formatVoiceName = (name) => {
        // Primeiro substituir espaços e caracteres não alfanuméricos por underscore
        const cleanName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        // Dividir por underscore, capitalizar cada parte, e juntar novamente
        return cleanName.split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('_');
    };

    function formatModelName(modelValue) {
        // Primeiro removemos qualquer prefixo comum como 'eleven_'
        let modelName = modelValue.replace('eleven_', '');
        
        // Pegamos a primeira parte do nome (antes de qualquer underscore)
        const modelType = modelName.split('_')[0];
        
        // Extraímos a primeira letra do tipo do modelo
        const firstLetter = modelType.charAt(0).toLowerCase();
        
        // Procuramos pelo padrão de versão (v seguido de números e potencialmente um ponto)
        const versionRegex = /v(\d+)\.?(\d+)?/;
        const versionMatch = modelValue.match(versionRegex);
        
        // Extraímos e formatamos a versão
        let version = '';
        if (versionMatch) {
          // Versão principal
          version += versionMatch[1];
          
          // Se houver uma subversão (após o ponto), adicionamos sem o ponto
          if (versionMatch[2]) {
            version += versionMatch[2];
          }
        }
        
        // Combinamos a letra inicial com a versão
        return firstLetter + version;
      }

    function generateFileName() {
        // Obter nome da voz selecionada
        const voiceName = elements.voiceSelect.options[elements.voiceSelect.selectedIndex].text;
        
        // Obter outros parâmetros
        const model = formatModelName(elements.modelSelect.value);
        const speed = elements.speedRange.value * 100;
        const stability = elements.stabilityRange.value;
        const similarity = elements.similarityRange.value;
        const style = elements.styleRange.value;
        const boost = elements.speakerBoost.checked ? "b" : "nb";
        
        // Limpar nome da voz para uso em nome de arquivo
        const safeVoiceName = formatVoiceName(voiceName);
        
        // Criar string de data e hora formatada
        const now = new Date();
        const dateStr = now.toISOString().replace(/[:\.]/g, '_').slice(0, 19);
        
        // Criar nome de arquivo com timestamp para garantir unicidade
        return `PocketElevenlabs_${dateStr}_${safeVoiceName}_sp${speed}_s${stability}_sb${similarity}_se${style}_${boost}_${model}.mp3`;
    }

    // Função para baixar áudio
    function downloadAudio() {
        console.log('downloadAudio: Iniciando download');
        if (!state.audioBlob) {
            console.log('downloadAudio: Nenhum áudio disponível');
            showError('Nenhum áudio disponível para download.');
            return;
        }
        
        const a = document.createElement('a');
        a.href = URL.createObjectURL(state.audioBlob);
        a.download = generateFileName();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log('downloadAudio: Download iniciado');
    }
    
    // Função para atualizar contador de caracteres e estado do botão
    function updateCharCounter() {
        console.log('updateCharCounter: Atualizando contador');
        if (!elements.charCounter) return;
        
        const text = elements.textInput.value.trim();
        const length = elements.textInput.value.length;
        
        // Atualizar contador
        elements.charCounter.textContent = `${length}/5000 caracteres`;
        
        // Atualizar estado do botão de gerar
        if (text === '') {
            elements.generateBtn.disabled = true;
            console.log('updateCharCounter: Botão desabilitado - texto vazio');
        } else {
            elements.generateBtn.disabled = false;
            console.log('updateCharCounter: Botão habilitado - texto preenchido');
        }
        
        console.log('updateCharCounter: Contador e botão atualizados', { 
            length, 
            textoVazio: text === '', 
            botaoDesabilitado: elements.generateBtn.disabled 
        });
    }

    // Função para inicializar a aplicação
    async function initializeApp() {
        console.log('initializeApp: Iniciando aplicação');
        try {
            // Verificar API key
            if (!state.apiKey) {
                console.log('initializeApp: API key não encontrada, mostrando modal');
                elements.apiKeyModal.show();
                return;
            } else {
                console.log('initializeApp: API key encontrada', { 
                    comprimento: state.apiKey.length, 
                    iniciais: state.apiKey.substring(0, 5) + '...',
                    formatoCorreto: state.apiKey.startsWith('sk_')
                });
            }
            
            // Desabilitar interface até carregar
            console.log('initializeApp: Desabilitando interface durante carregamento');
            enableInterface(false);
            
            // Carregar configurações
            console.log('initializeApp: Carregando configurações');
            await loadSettings();
            
            // Verificar se o campo de texto está vazio e definir estado inicial do botão
            updateCharCounter();

            // Carregar vozes e créditos em paralelo
            console.log('initializeApp: Carregando vozes e créditos em paralelo');
            const results = await Promise.all([
                fetchVoices(),
                fetchCredits(),
                getLastRequestId()
            ]);
            console.log('initializeApp: Carregamento paralelo concluído', { 
                resultadoVozes: results[0], 
                resultadoCreditos: results[1],
                requestIdObtido: !!state.lastRequestId // Log do resultado
            });
            
            // Habilitar interface se não houve erros
            if (results[0]) {
                console.log('initializeApp: Vozes carregadas com sucesso, habilitando interface');
                enableInterface(true);
                state.isInitialized = true;
            } else {
                // Problema com a API key
                console.log('initializeApp: Problema ao carregar vozes, mostrando modal');
                console.log('initializeApp: Possível API key inválida? Resetando API key no modal');
                elements.apiKeyInput.value = '';
                elements.apiKeyModal.show();
            }
            
            console.log('initializeApp: Inicialização concluída');

            // Configurar atualização de créditos quando a janela voltar ao foco
            document.addEventListener('visibilitychange', function() {
                if (document.visibilityState === 'visible' && state.isInitialized) {
                    console.log('Página voltou ao foco, atualizando créditos');
                    safelyFetchCredits();
                }
            });

            // Atualizar créditos quando a janela recuperar o foco (Alt+Tab, Cmd+Tab)
            window.addEventListener('focus', function() {
                if (state.isInitialized) {
                    console.log('Janela recuperou o foco, atualizando créditos');
                    safelyFetchCredits();
                }
            });

        } catch (error) {
            console.log('initializeApp: Erro ao inicializar', { error: error.message });
            console.error('Erro ao inicializar:', error);
            showError('Erro ao inicializar aplicação: ' + error.message);
        }
    }
    
    console.log('Registrando event listeners');
    // Registrar event listeners
    elements.textInput.addEventListener('input', updateCharCounter);
    elements.textInput.addEventListener('input', saveSettings);
    elements.generateBtn.addEventListener('click', generateAudio);
    elements.downloadBtn.addEventListener('click', downloadAudio);
    elements.configApiBtn.addEventListener('click', () => {
        console.log('configApiBtn: Botão clicado, mostrando modal');
        elements.apiKeyInput.value = state.apiKey || '';
        elements.apiKeyModal.show();
    });
    elements.saveApiKeyBtn.addEventListener('click', validateAndSaveApiKey);
    
    // Event listeners para controles de configuração
    elements.speedRange.addEventListener('input', () => {
        console.log('speedRange: Valor alterado', { valor: elements.speedRange.value });
        elements.speedValue.textContent = elements.speedRange.value;
        saveSettings();
    });
    
    elements.stabilityRange.addEventListener('input', () => {
        console.log('stabilityRange: Valor alterado', { valor: elements.stabilityRange.value });
        elements.stabilityValue.textContent = `${elements.stabilityRange.value}%`;
        saveSettings();
    });
    
    elements.similarityRange.addEventListener('input', () => {
        console.log('similarityRange: Valor alterado', { valor: elements.similarityRange.value });
        elements.similarityValue.textContent = `${elements.similarityRange.value}%`;
        saveSettings();
    });
    
    elements.styleRange.addEventListener('input', () => {
        console.log('styleRange: Valor alterado', { valor: elements.styleRange.value });
        elements.styleValue.textContent = `${elements.styleRange.value}%`;
        saveSettings();
    });
    
    elements.voiceSelect.addEventListener('change', () => {
        console.log('voiceSelect: Voz alterada', { voz: elements.voiceSelect.value });
        saveSettings();
    });
    
    elements.modelSelect.addEventListener('change', () => {
        console.log('modelSelect: Modelo alterado', { modelo: elements.modelSelect.value });
        saveSettings();
    });
    
    elements.speakerBoost.addEventListener('change', () => {
        console.log('speakerBoost: Valor alterado', { ativado: elements.speakerBoost.checked });
        saveSettings();
    });
    
    // Verificar o localStorage diretamente
    console.log('Verificando localStorage antes da inicialização:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        if (key === 'elevenlabs_api_key') {
            console.log(`${key}: encontrado com ${value.length} caracteres`);
        } else {
            console.log(`${key}: ${value?.substring(0, 30)}${value?.length > 30 ? '...' : ''}`);
        }
    }
    
    // Iniciar aplicação
    console.log('Chamando initializeApp para iniciar a aplicação');
    initializeApp();
    console.log('Inicialização completa do script');
}); 