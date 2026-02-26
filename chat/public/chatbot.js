const { render } = ReactDOM;

const { useState, useRef, useEffect } = React;

// Configurar marked para renderizado de Markdown
marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: function (code, lang) {
        return code;
    }
});

function FloatingChatBot() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState(true);
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
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

        // Mensaje de bienvenida
        setMessages([{
            id: 'welcome',
            role: 'system',
            content: '¡Hola! 👋 Soy Ximena. ¿En qué puedo ayudarte hoy?',
            timestamp: new Date()
        }]);
    }, []);

    // Función para convertir Markdown a HTML seguro
    const renderMarkdown = (content) => {
        const rawMarkup = marked.parse(content);
        const sanitizedMarkup = DOMPurify.sanitize(rawMarkup);
        return { __html: sanitizedMarkup };
    };

    const sendMessage = async (messageText = null) => {
        const text = messageText || input;
        if (!text.trim() || loading) return;

        // Agregar mensaje del usuario
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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: text,
                    sessionId: sessionId
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

    const clearChat = () => {
        setMessages([{
            id: 'welcome',
            role: 'system',
            content: '¡Hola! 👋 Soy Ximena, ¿En qué puedo ayudarte hoy?',
            timestamp: new Date()
        }]);

        setSuggestion(true);

        // Limpiar historial en el servidor
        fetch(`${API_BASE}/chat/history`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId: sessionId })
        }).catch(console.error);
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="chatbot-container">
            <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
                <div className="chat-header">
                    <div className="chat-header-info">
                        <h3>Ximena</h3>
                        <p>Asistente Virtual • En línea</p>
                    </div>
                    <button className="close-button" onClick={toggleChat}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="chat-messages">
                    {messages.map((message) => (
                        <div key={message.id} className={`message ${message.role === 'user' ? 'user' :
                            message.role === 'system' ? 'message-system' : 'assistant'
                            }`}>
                            <div className="message-header">
                                <span>
                                    {message.role === 'user' ? 'Tú' :
                                        message.role === 'system' ? 'Ximena' : 'Ximena'}
                                </span>
                                <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            {/* Renderizar contenido según el tipo de mensaje */}
                            {message.role === 'assistant' ? (
                                <div
                                    className="markdown-content"
                                    dangerouslySetInnerHTML={renderMarkdown(message.content)}
                                />
                            ) : (
                                <div>{message.content}</div>
                            )}

                            {message.toolsUsed && message.toolsUsed.length > 0 && (
                                <div className="tools-used">
                                    <i className="fas fa-tools me-1"></i>
                                    Herramientas usadas: {message.toolsUsed.join(', ')}
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="message assistant">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-container">
                    {suggestion && (
                        <div className="suggestions">
                            {suggestions.map((sugg, index) => (
                                <button
                                    key={index}
                                    className="suggestion-chip"
                                    onClick={() => handleSuggestionClick(sugg)}
                                    disabled={loading}
                                >
                                    {sugg}
                                </button>
                            ))}
                        </div>
                    )}


                    <div className="input-group">
                        <textarea
                            placeholder="Escribe tu mensaje..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={loading}
                            rows="1"
                        />
                        <button
                            className="send-button"
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || loading}
                        >
                            {loading ? (
                                <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                                <i className="fas fa-paper-plane"></i>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <button className="chatbot-button" onClick={toggleChat}>
                <i className="fas fa-comment-dots"></i>
            </button>
        </div>
    );
}

// Renderizar el componente
const container = document.getElementById('chatbot-root');
render(<FloatingChatBot />, container);