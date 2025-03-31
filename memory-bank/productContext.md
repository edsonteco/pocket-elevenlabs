# Product Context - Pocket ElevenLabs

## Motivação do Projeto

O Pocket ElevenLabs nasceu da necessidade de oferecer uma interface simples e direta para a geração de áudio utilizando a API ElevenLabs. Enquanto a plataforma oficial oferece muitos recursos, ela pode ser complexa e não otimizada para casos de uso rápidos e diretos. Este projeto preenche essa lacuna, fornecendo uma solução leve, eficiente e focada em uma única tarefa: converter texto em áudio de alta qualidade.

## Problemas que Resolve

1. **Complexidade Reduzida**: Simplifica o processo de geração de áudio comparado à interface oficial do ElevenLabs.

2. **Otimização de Créditos**: Implementa mecanismos para reduzir o consumo de créditos através do reuso inteligente de request IDs.

3. **Processamento de Texto**: Melhora automaticamente o texto para melhor pronúncia, aumentando a qualidade do áudio gerado.

4. **Experiência Web Simplificada**: Oferece uma alternativa web para quem não deseja instalar aplicativos ou utilizar a plataforma completa.

5. **Transparência de Créditos**: Mostra claramente o saldo de créditos disponíveis e consumidos.

## Como o Produto Deve Funcionar

### Fluxo Principal

1. **Configuração Inicial**: 
   - O usuário acessa a aplicação web
   - Na primeira vez, configura sua chave API do ElevenLabs
   - A chave é armazenada localmente no navegador

2. **Entrada de Texto**:
   - O usuário digita ou cola o texto a ser convertido
   - O sistema mostra o contador de caracteres (limite de 5000)

3. **Configuração de Voz**:
   - Seleção da voz desejada entre as disponíveis na conta
   - Escolha do modelo de voz (Multilingual, Flash, Turbo, Scribe)
   - Ajuste de parâmetros como velocidade, estabilidade, similaridade e estilo

4. **Processamento e Confirmação**:
   - O texto é processado automaticamente para melhorar a pronúncia
   - O usuário visualiza as modificações e pode aceitá-las ou rejeitá-las

5. **Geração e Reprodução**:
   - O áudio é gerado e transmitido diretamente via streaming
   - Um player de áudio permite reprodução imediata
   - A opção de download do arquivo MP3 fica disponível

6. **Regeneração Otimizada**:
   - Permite até duas regenerações sem custo adicional de caracteres
   - Utiliza o mesmo request ID para evitar novo consumo de créditos

## Objetivos de Experiência do Usuário

1. **Simplicidade**: Interface minimalista focada na tarefa principal

2. **Transparência**: Feedback claro sobre processamento de texto e consumo de créditos

3. **Eficiência**: Processo rápido e direto de conversão de texto para áudio

4. **Confiabilidade**: Funcionamento estável e tratamento adequado de erros

5. **Acessibilidade**: Compatibilidade com diferentes dispositivos e navegadores 