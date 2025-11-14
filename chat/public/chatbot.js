// floating-chatbot.js
(function () {
    // Configuración por defecto
    const defaultConfig = {
        apiBase: 'http://localhost:3000/api',
        assistantName: 'Ximena',
        welcomeMessage: '¡Hola! 👋 Soy Ximena, tu asistente virtual. ¿En qué puedo ayudarte hoy?',
        suggestions: [
            "¿Tienen disponibilidad para 2 personas este fin de semana?",
            "Necesito alojamiento para 4 personas del 15 al 20 de diciembre",
            "Quiero consultar disponibilidad en el hotel 2",
            "¿Qué alojamientos tienen para 3 personas?"
        ],
        position: { bottom: '20px', right: '20px' },
        primaryColor: '#3498db',
        secondaryColor: '#8e44ad',
        containerId: 'floating-chatbot-container'
    };

    // Cargar dependencias CSS
    function loadCSS() {
        const style = document.createElement('style');
        style.textContent = `
            .floating-chatbot-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }

            .floating-chatbot-button {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #3498db, #8e44ad);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                transition: all 0.3s ease;
                border: none;
                font-size: 24px;
            }

            .floating-chatbot-button:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(0, 0, 0, 0.3);
            }

            .floating-chatbot-window {
                position: absolute;
                bottom: 80px;
                right: 0;
                width: 380px;
                height: 600px;
                background: white;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                opacity: 0;
                transform: translateY(20px) scale(0.9);
                transition: all 0.3s ease;
            }

            .floating-chatbot-window.open {
                opacity: 1;
                transform: translateY(0) scale(1);
            }

            .floating-chat-header {
                background: linear-gradient(135deg, #3498db, #8e44ad);
                color: white;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .floating-chat-header-info h3 {
                margin: 0;
                font-size: 1.2rem;
            }

            .floating-chat-header-info p {
                margin: 0;
                font-size: 0.8rem;
                opacity: 0.9;
            }

            .floating-close-button {
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }

            .floating-close-button:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .floating-chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                background: #f8f9fa;
            }

            .floating-message {
                margin-bottom: 15px;
                padding: 12px 16px;
                border-radius: 15px;
                max-width: 85%;
                word-wrap: break-word;
                animation: fadeIn 0.3s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .floating-message.user {
                background: #3498db;
                color: white;
                margin-left: auto;
                border-bottom-right-radius: 5px;
            }

            .floating-message.assistant {
                background: white;
                border: 1px solid #e9ecef;
                margin-right: auto;
                border-bottom-left-radius: 5px;
            }

            .floating-message-system {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                margin: 10px auto;
                text-align: center;
                max-width: 90%;
                font-size: 0.9em;
            }

            .floating-message-header {
                display: flex;
                justify-content: space-between;
                font-size: 0.8em;
                margin-bottom: 5px;
                opacity: 0.8;
            }

            .floating-tools-used {
                font-size: 0.75em;
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px dashed #dee2e6;
                color: #6c757d;
            }

            .floating-typing-indicator {
                display: flex;
                gap: 4px;
                padding: 10px;
            }

            .floating-typing-indicator span {
                width: 8px;
                height: 8px;
                background: #6c757d;
                border-radius: 50%;
                animation: typing 1.4s infinite ease-in-out;
            }

            @keyframes typing {
                0%, 60%, 100% {
                    transform: translateY(0);
                    opacity: 0.4;
                }
                30% {
                    transform: translateY(-10px);
                    opacity: 1;
                }
            }

            .floating-chat-input-container {
                padding: 15px;
                border-top: 1px solid #dee2e6;
                background: white;
            }

            .floating-suggestions {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 10px;
            }

            .floating-suggestion-chip {
                background: #e9ecef;
                border: none;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 0.85em;
                cursor: pointer;
                transition: all 0.2s;
                text-align: left;
            }

            .floating-suggestion-chip:hover {
                background: #3498db;
                color: white;
            }

            .floating-input-group {
                display: flex;
                gap: 10px;
            }

            .floating-input-group textarea {
                flex: 1;
                border: 1px solid #dee2e6;
                border-radius: 20px;
                padding: 10px 15px;
                resize: none;
                font-family: inherit;
                outline: none;
                transition: border 0.2s;
                font-size: 14px;
            }

            .floating-input-group textarea:focus {
                border-color: #3498db;
            }

            .floating-send-button {
                background: #3498db;
                color: white;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background 0.2s;
            }

            .floating-send-button:hover {
                background: #2980b9;
            }

            .floating-send-button:disabled {
                background: #bdc3c7;
                cursor: not-allowed;
            }

            .floating-markdown-content h1, .floating-markdown-content h2, .floating-markdown-content h3 {
                margin-top: 0.5em;
                margin-bottom: 0.5em;
                font-size: 1em;
            }
            
            .floating-markdown-content h1 {
                font-size: 1.2em;
            }
            
            .floating-markdown-content h2 {
                font-size: 1.1em;
            }
            
            .floating-markdown-content p {
                margin-bottom: 0.8em;
            }
            
            .floating-markdown-content ul, .floating-markdown-content ol {
                margin-bottom: 0.8em;
                padding-left: 1.5em;
            }
            
            .floating-markdown-content table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 1em;
                font-size: 0.9em;
            }
            
            .floating-markdown-content th, .floating-markdown-content td {
                border: 1px solid #dee2e6;
                padding: 6px 10px;
                text-align: left;
            }
            
            .floating-markdown-content th {
                background-color: #f8f9fa;
                font-weight: 600;
            }
            
            .floating-markdown-content code {
                background-color: #f8f9fa;
                padding: 2px 4px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
            }
            
            .floating-markdown-content pre {
                background-color: #f8f9fa;
                padding: 12px;
                border-radius: 5px;
                overflow-x: auto;
                margin-bottom: 1em;
            }
            
            .floating-markdown-content pre code {
                background: none;
                padding: 0;
            }
            
            .floating-markdown-content blockquote {
                border-left: 4px solid #3498db;
                padding-left: 1em;
                margin-left: 0;
                color: #6c757d;
                font-style: italic;
            }

            @media (max-width: 480px) {
                .floating-chatbot-window {
                    width: calc(100vw - 40px);
                    right: 10px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Cargar dependencias de scripts
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Componente del Chatbot
    class FloatingChatbot {
        constructor(config = {}) {
            this.config = { ...defaultConfig, ...config };
            this.messages = [];
            this.input = '';
            this.loading = false;
            this.isOpen = false;
            this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            this.init();
        }

        async init() {
            // Cargar dependencias
            loadCSS();
            await this.loadDependencies();

            // Crear contenedor
            this.createContainer();

            // Renderizar componente
            this.render();
        }

        async loadDependencies() {
            const dependencies = [
                'https://unpkg.com/react@18/umd/react.development.js',
                'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
                'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.5/purify.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/js/all.min.js'
            ];

            for (const dep of dependencies) {
                await loadScript(dep);
            }
        }

        createContainer() {
            let container = document.getElementById(this.config.containerId);
            if (!container) {
                container = document.createElement('div');
                container.id = this.config.containerId;
                document.body.appendChild(container);
            }
            this.container = container;
        }

        renderMarkdown(content) {
            const rawMarkup = window.marked.parse(content);
            const sanitizedMarkup = window.DOMPurify.sanitize(rawMarkup);
            return { __html: sanitizedMarkup };
        }

        async sendMessage(messageText = null) {
            const text = messageText || this.input;
            if (!text.trim() || this.loading) return;

            // Agregar mensaje del usuario
            const userMessage = {
                id: `msg_${Date.now()}`,
                role: 'user',
                content: text,
                timestamp: new Date()
            };

            this.messages = [...this.messages, userMessage];
            this.input = '';
            this.loading = true;
            this.render();

            try {
                const response = await fetch(`${this.config.apiBase}/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: text,
                        sessionId: this.sessionId
                    })
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }

                const data = await response.json();

                const assistantMessage = {
                    id: data.messageId,
                    role: 'assistant',
                    content: data.response,
                    timestamp: new Date(data.timestamp),
                    toolsUsed: data.toolsUsed
                };

                this.messages = [...this.messages, assistantMessage];

            } catch (error) {
                console.error('Error:', error);

                const errorMessage = {
                    id: `error_${Date.now()}`,
                    role: 'assistant',
                    content: '⚠️ Lo siento, hubo un error procesando tu mensaje. Por favor, intenta nuevamente.',
                    timestamp: new Date()
                };

                this.messages = [...this.messages, errorMessage];
            } finally {
                this.loading = false;
                this.render();
            }
        }

        handleSuggestionClick(suggestion) {
            this.sendMessage(suggestion);
        }

        handleKeyPress(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        }

        clearChat() {
            this.messages = [{
                id: 'welcome',
                role: 'system',
                content: this.config.welcomeMessage,
                timestamp: new Date()
            }];

            // Limpiar historial en el servidor
            fetch(`${this.config.apiBase}/chat/history`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId: this.sessionId })
            }).catch(console.error);

            this.render();
        }

        toggleChat() {
            this.isOpen = !this.isOpen;
            this.render();
        }

        render() {
            if (!window.React || !window.ReactDOM) {
                console.error('React no está cargado');
                return;
            }

            const { createElement, useState, useEffect, useRef } = window.React;

            // Para simplificar, vamos a usar una versión simplificada del renderizado
            // En una implementación real, esto sería un componente React completo

            const containerStyle = {
                bottom: this.config.position.bottom,
                right: this.config.position.right
            };

            const headerStyle = {
                background: `linear-gradient(135deg, ${this.config.primaryColor}, ${this.config.secondaryColor})`
            };

            const buttonStyle = {
                background: `linear-gradient(135deg, ${this.config.primaryColor}, ${this.config.secondaryColor})`
            };

            const messagesHtml = this.messages.map(message => `
                <div class="floating-message ${message.role === 'user' ? 'user' : message.role === 'system' ? 'floating-message-system' : 'assistant'}">
                    <div class="floating-message-header">
                        <span>${message.role === 'user' ? 'Tú' : this.config.assistantName}</span>
                        <span>${message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    ${message.role === 'assistant' ?
                    `<div class="floating-markdown-content">${this.renderMarkdown(message.content).__html}</div>` :
                    `<div>${message.content}</div>`
                }
                    ${message.toolsUsed && message.toolsUsed.length > 0 ?
                    `<div class="floating-tools-used">
                            <i class="fas fa-tools me-1"></i>
                            Herramientas usadas: ${message.toolsUsed.join(', ')}
                        </div>` : ''
                }
                </div>
            `).join('');

            const suggestionsHtml = this.config.suggestions.map((suggestion, index) => `
                <button class="floating-suggestion-chip" onclick="window.chatbot.handleSuggestionClick('${suggestion.replace(/'/g, "\\'")}')" ${this.loading ? 'disabled' : ''}>
                    ${suggestion}
                </button>
            `).join('');

            const chatWindow = `
                <div class="floating-chatbot-window ${this.isOpen ? 'open' : ''}">
                    <div class="floating-chat-header" style="${Object.entries(headerStyle).map(([k, v]) => `${k}: ${v}`).join(';')}">
                        <div class="floating-chat-header-info">
                            <h3>${this.config.assistantName}</h3>
                            <p>Asistente Virtual • En línea</p>
                        </div>
                        <button class="floating-close-button" onclick="window.chatbot.toggleChat()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div class="floating-chat-messages">
                        ${messagesHtml}
                        ${this.loading ? `
                            <div class="floating-message assistant">
                                <div class="floating-typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        ` : ''}
                        <div id="messages-end"></div>
                    </div>

                    <div class="floating-chat-input-container">
                        <div class="floating-suggestions">
                            ${suggestionsHtml}
                        </div>

                        <div class="floating-input-group">
                            <textarea 
                                placeholder="Escribe tu mensaje..." 
                                oninput="window.chatbot.input = this.value"
                                onkeypress="window.chatbot.handleKeyPress(event)"
                                ${this.loading ? 'disabled' : ''}
                                rows="1"
                            >${this.input}</textarea>
                            <button 
                                class="floating-send-button" 
                                onclick="window.chatbot.sendMessage()" 
                                ${!this.input.trim() || this.loading ? 'disabled' : ''}
                            >
                                ${this.loading ?
                    '<i class="fas fa-spinner fa-spin"></i>' :
                    '<i class="fas fa-paper-plane"></i>'
                }
                            </button>
                        </div>
                    </div>
                </div>
            `;

            const button = `
                <button class="floating-chatbot-button" onclick="window.chatbot.toggleChat()" style="${Object.entries(buttonStyle).map(([k, v]) => `${k}: ${v}`).join(';')}">
                    <i class="fas fa-comment-dots"></i>
                </button>
            `;

            this.container.innerHTML = `
                <div class="floating-chatbot-container" style="${Object.entries(containerStyle).map(([k, v]) => `${k}: ${v}`).join(';')}">
                    ${chatWindow}
                    ${button}
                </div>
            `;

            // Scroll to bottom
            setTimeout(() => {
                const messagesEnd = document.getElementById('messages-end');
                if (messagesEnd) {
                    messagesEnd.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    }

    // API pública
    window.FloatingChatbot = FloatingChatbot;

    // Inicialización automática si hay configuración global
    if (window.FLOATING_CHATBOT_CONFIG) {
        window.chatbot = new FloatingChatbot(window.FLOATING_CHATBOT_CONFIG);
    }
})();