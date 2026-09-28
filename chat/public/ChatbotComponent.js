/**
 * ChatbotComponent.js
 * Definición del componente FloatingChatBot para reutilización
 * 
 * Uso en archivos HTML:
 * <script type="text/babel" src="ChatbotComponent.js"></script>
 */

const FloatingChatBot = ({ provider, model, onSessionIdChange }) => {
    const { useState, useRef, useEffect } = React;

    marked.setOptions({
        breaks: true,
        gfm: true,
        highlight: function (code, lang) {
            return code;
        }
    });

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState(true);
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(true);
    const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const messagesEndRef = useRef(null);

    const API_BASE = 'http://localhost:3000/api';

    const initialSuggestions = [
        "¿Tienen disponibilidad para 2 personas este fin de semana?",
        "Necesito alojamiento para 4 personas del 15 al 20 de diciembre",
        "Quiero consultar disponibilidad en el hotel 2",
        "¿Qué alojamientos tienen para 3 personas?"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (onSessionIdChange) {
            onSessionIdChange(sessionId);
        }
    }, [sessionId]);

    useEffect(() => {
        setSuggestions(initialSuggestions);
        setMessages([{
            id: 'welcome',
            role: 'system',
            content: '¡Hola! 👋 Soy Ximena. ¿En qué puedo ayudarte hoy?',
            timestamp: new Date()
        }]);
    }, []);

    const renderMarkdown = (content) => {
        const rawMarkup = marked.parse(content);
        const sanitizedMarkup = DOMPurify.sanitize(rawMarkup);
        return { __html: sanitizedMarkup };
    };

    const sendMessage = async (messageText = null) => {
        const text = messageText || input;
        if (!text.trim() || loading) return;

        const userMessage = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const payload = { message: text, sessionId: sessionId };
            if (provider) payload.provider = provider;
            if (model) payload.model = model;

            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || `Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            const assistantMessage = {
                id: data.messageId,
                role: 'assistant',
                content: data.response,
                timestamp: new Date(data.timestamp),
                toolsUsed: data.toolsUsed
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = {
                id: `error_${Date.now()}`,
                role: 'assistant',
                content: `⚠️ Error procesando tu mensaje: ${error.message}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        sendMessage(suggestion);
        setSuggestion(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    return React.createElement('div', { className: 'chatbot-container' },
        React.createElement('div', { className: `chatbot-window ${isOpen ? 'open' : ''}` },
            React.createElement('div', { className: 'chat-header' },
                React.createElement('div', { className: 'chat-header-avatar' },
                    React.createElement('div', { className: 'header-avatar-circle' }, 'X'),
                    React.createElement('div', { className: 'header-status-dot' })
                ),
                React.createElement('div', { className: 'chat-header-info' },
                    React.createElement('h3', null, 'Ximena'),
                    React.createElement('p', null, 'Asistente Virtual • Hotel CasaBlanca')
                ),
                React.createElement('div', { className: 'header-actions' },
                    React.createElement('button', {
                        className: 'header-action-btn',
                        title: 'Nueva conversación',
                        onClick: () => {
                            setMessages([{
                                id: 'welcome-reset',
                                role: 'system',
                                content: '¡Conversación reiniciada! ¿En qué puedo ayudarte?',
                                timestamp: new Date()
                            }]);
                            setSuggestion(true);
                        }
                    }, React.createElement('i', { className: 'fas fa-rotate-right' })),
                    React.createElement('button', { className: 'header-action-btn', onClick: toggleChat },
                        React.createElement('i', { className: 'fas fa-xmark' })
                    )
                )
            ),
            React.createElement('div', { className: 'chat-messages' },
                messages.map((message) =>
                    React.createElement('div', {
                        key: message.id,
                        className: `message ${message.role === 'user' ? 'user' : message.role === 'system' ? 'message-system' : 'assistant'}`
                    },
                        message.role === 'system' ? (
                            React.createElement('div', { className: 'message-system-wrapper' },
                                React.createElement('div', { className: 'message-system', dangerouslySetInnerHTML: renderMarkdown(message.content) })
                            )
                        ) : [
                            message.role !== 'user' ? React.createElement('div', { key: 'avatar', className: 'msg-avatar assistant-avatar' }, React.createElement('span', null, 'X')) : null,
                            React.createElement('div', { key: 'content', className: 'msg-content-col' },
                                React.createElement('div', { className: 'msg-bubble' },
                                    message.role === 'assistant'
                                        ? React.createElement('div', { className: 'markdown-content', dangerouslySetInnerHTML: renderMarkdown(message.content) })
                                        : React.createElement('span', null, message.content)
                                ),
                                message.toolsUsed && message.toolsUsed.length > 0
                                    ? React.createElement('div', { className: 'tools-badge-row', style: {marginTop: '5px'} },
                                        message.toolsUsed.map((t, i) => React.createElement('span', { key: i, className: 'tool-badge' }, `🔧 ${t}`))
                                    )
                                    : null
                            )
                        ]
                    )
                ),
                loading && React.createElement('div', { className: 'message assistant' },
                    React.createElement('div', { className: 'msg-avatar assistant-avatar' }, React.createElement('span', null, 'X')),
                    React.createElement('div', { className: 'msg-content-col' },
                        React.createElement('div', { className: 'msg-bubble' },
                            React.createElement('div', { className: 'typing-indicator' },
                                React.createElement('span'), React.createElement('span'), React.createElement('span')
                            )
                        )
                    )
                ),
                React.createElement('div', { ref: messagesEndRef })
            ),
            React.createElement('div', { className: 'chat-input-container' },
                suggestion && messages.length <= 1 && React.createElement('div', { className: 'suggestions-container' },
                    React.createElement('p', { className: 'suggestions-label' }, 'Sugerencias rápidas'),
                    React.createElement('div', { className: 'suggestions-chips' },
                        suggestions.map((sugg, index) =>
                            React.createElement('button', {
                                key: index,
                                className: 'suggestion-chip',
                                onClick: () => handleSuggestionClick(sugg),
                                disabled: loading
                            }, sugg)
                        )
                    )
                ),
                React.createElement('div', { className: 'input-wrapper' },
                    React.createElement('textarea', {
                        id: 'chat-input',
                        placeholder: 'Escribí tu mensaje...',
                        value: input,
                        onInput: (e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        },
                        onChange: (e) => setInput(e.target.value),
                        onKeyDown: (e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        },
                        disabled: loading,
                        rows: '1'
                    }),
                    React.createElement('button', {
                        className: `send-button ${(!input.trim() || loading) ? 'disabled' : ''}`,
                        onClick: () => sendMessage(),
                        disabled: !input.trim() || loading
                    },
                        loading ? React.createElement('i', { className: 'fas fa-circle-notch fa-spin' }) : React.createElement('i', { className: 'fas fa-paper-plane' })
                    )
                ),
                React.createElement('p', { className: 'input-hint' }, 'Enter para enviar · Shift+Enter para nueva línea')
            )
        ),
        React.createElement('button', { className: 'chatbot-button', onClick: toggleChat },
            React.createElement('i', { className: 'fas fa-comment-dots' })
        )
    );
};
