/**
 * ChatbotComponent.js
 * Definición del componente FloatingChatBot para reutilización
 * 
 * Uso en archivos HTML:
 * <script type="text/babel" src="ChatbotComponent.js"></script>
 */

const FloatingChatBot = () => {
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
            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, sessionId: sessionId })
            });

            if (!response.ok) throw new Error(`Error: ${response.status}`);

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
                content: '⚠️ Lo siento, hubo un error procesando tu mensaje. Por favor, intenta nuevamente.',
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
                React.createElement('div', { className: 'chat-header-info' },
                    React.createElement('h3', null, 'Ximena'),
                    React.createElement('p', null, 'Asistente Virtual • En línea')
                ),
                React.createElement('button', { className: 'close-button', onClick: toggleChat },
                    React.createElement('i', { className: 'fas fa-times' })
                )
            ),
            React.createElement('div', { className: 'chat-messages' },
                messages.map((message) =>
                    React.createElement('div', {
                        key: message.id,
                        className: `message ${message.role === 'user' ? 'user' : message.role === 'system' ? 'message-system' : 'assistant'}`
                    },
                        React.createElement('div', { className: 'message-header' },
                            React.createElement('span', null, message.role === 'user' ? 'Tú' : 'Ximena'),
                            React.createElement('span', null, message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
                        ),
                        message.role === 'assistant'
                            ? React.createElement('div', { className: 'markdown-content', dangerouslySetInnerHTML: renderMarkdown(message.content) })
                            : React.createElement('div', null, message.content),
                        message.toolsUsed && message.toolsUsed.length > 0
                            ? React.createElement('div', { className: 'tools-used' },
                                React.createElement('i', { className: 'fas fa-tools me-1' }),
                                `Herramientas usadas: ${message.toolsUsed.join(', ')}`
                            )
                            : null
                    )
                ),
                loading && React.createElement('div', { className: 'message assistant' },
                    React.createElement('div', { className: 'typing-indicator' },
                        React.createElement('span'),
                        React.createElement('span'),
                        React.createElement('span')
                    )
                ),
                React.createElement('div', { ref: messagesEndRef })
            ),
            React.createElement('div', { className: 'chat-input-container' },
                suggestion && React.createElement('div', { className: 'suggestions' },
                    suggestions.map((sugg, index) =>
                        React.createElement('button', {
                            key: index,
                            className: 'suggestion-chip',
                            onClick: () => handleSuggestionClick(sugg),
                            disabled: loading
                        }, sugg)
                    )
                ),
                React.createElement('div', { className: 'input-group' },
                    React.createElement('button', { className: 'send-button', onClick: () => setSuggestion(!suggestion) },
                        loading ? React.createElement('i', { className: 'fas fa-spinner fa-spin' }) : React.createElement('i', { className: 'fa-solid fa-comment-dots' })
                    ),
                    React.createElement('textarea', {
                        placeholder: 'Escribe tu mensaje...',
                        value: input,
                        onChange: (e) => setInput(e.target.value),
                        onKeyPress: handleKeyPress,
                        disabled: loading,
                        rows: '1'
                    }),
                    React.createElement('button', { className: 'send-button', onClick: () => sendMessage(), disabled: !input.trim() || loading },
                        loading ? React.createElement('i', { className: 'fas fa-spinner fa-spin' }) : React.createElement('i', { className: 'fas fa-paper-plane' })
                    )
                )
            )
        ),
        React.createElement('button', { className: 'chatbot-button', onClick: toggleChat },
            React.createElement('i', { className: 'fas fa-comment-dots' })
        )
    );
};
