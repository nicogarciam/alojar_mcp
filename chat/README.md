🤖 Chatbot MCP - Asistente de Disponibilidad de Alojamientos
Un chatbot inteligente que utiliza el Model Context Protocol (MCP) para consultar disponibilidad de alojamientos en tiempo real. Integra modelos de lenguaje con herramientas específicas de dominio para proporcionar respuestas precisas y contextuales.

🚀 Características
Agente Inteligente: Utiliza LLM (OpenAI GPT) para entender consultas naturales

Integración MCP: Consume herramientas de disponibilidad en tiempo real

API REST: Fácil integración con frontends Angular, React, Vue, etc.

Gestión de Sesiones: Mantiene contexto de conversación

Manejo Robust de Errores: Recuperación elegante de fallos

Despliegue Ready: Configuración lista para producción

📋 Prerrequisitos
Node.js 18+

npm o yarn

API Key de OpenAI o proveedor compatible

Servidor MCP de disponibilidad (proyecto separado)

🛠️ Instalación
1. Clonar y Configurar el Proyecto
bash
# Clonar el repositorio
git clone <repository-url>
cd chatbot-mcp

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
2. Configurar Variables de Entorno
Edita el archivo .env:

env
# Puerto del servidor
PORT=3000

# Configuración MCP - Servidor de Disponibilidad
MCP_SERVER_COMMAND=node
MCP_SERVER_PATH=../mcp-server/dist/main.js
ALOJAR_API_TOKEN=tu_token_jwt_aqui
ALOJAR_API_BASE_URL=http://localhost/alojar/public

# Configuración LLM (OpenAI o compatible)
LLM_API_KEY=tu_api_key_de_openai
LLM_MODEL=gpt-3.5-turbo
# LLM_BASE_URL=https://api.openai.com/v1  # Descomenta para otros proveedores

# Entorno
NODE_ENV=development
3. Compilar el Proyecto
bash
# Compilar TypeScript
npm run build

# O ejecutar en modo desarrollo (con recarga automática)
npm run dev
🎯 Estructura del Proyecto
text
chatbot-mcp/
├── src/
│   ├── agents/           # Agentes inteligentes
│   │   └── availability.agent.ts
│   ├── services/         # Servicios (LLM, MCP)
│   │   ├── mcp.client.ts
│   │   └── llm.service.ts
│   ├── api/             # Rutas y controladores
│   │   └── chat.routes.ts
│   ├── types/           # Definiciones TypeScript
│   │   ├── chat.types.ts
│   │   └── mcp.types.ts
│   └── server.ts        # Servidor principal
├── public/              # Archivos estáticos (frontend)
├── package.json
├── tsconfig.json
└── .env
🔧 Uso de la API
Endpoints Disponibles
1. Enviar Mensaje al Chatbot
http
POST /api/chat
Content-Type: application/json

{
  "message": "¿Tienen disponibilidad para 4 personas del 15 al 20 de diciembre en el hotel 2?",
  "sessionId": "session_123"  // Opcional
}
Respuesta:

json
{
  "response": "📊 He consultado la disponibilidad para tu solicitud...",
  "sessionId": "session_123",
  "messageId": "msg_1702671634567_abc123",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "toolsUsed": ["check_availability"]
}
2. Health Check
http
GET /api/health
Respuesta:

json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "services": {
    "mcp": "connected",
    "llm": "connected"
  }
}
3. Limpiar Historial
http
DELETE /api/chat/history
Content-Type: application/json

{
  "sessionId": "session_123"
}
💬 Ejemplos de Uso
Consulta Básica de Disponibilidad
text
Usuario: Hola, necesito encontrar alojamiento para 3 personas del 10 al 15 de enero

Asistente: ¡Hola! Claro, puedo ayudarte a encontrar alojamiento disponible. 
¿Podrías decirme en qué hotel te gustaría hospedarte? Necesito el ID del hotel 
para consultar la disponibilidad.
Consulta Completa
text
Usuario: Quiero consultar disponibilidad en el hotel 2 para 4 personas del 2025-09-28 al 2025-10-01

Asistente: 🔍 Consultando disponibilidad para tu solicitud...

📊 **Resultados de Disponibilidad**

**Alojamientos completamente disponibles:** 2

🏨 **Alojamientos Disponibles:**
• **Depto 01** (Código: 001)
  Capacidad: 6 personas
  Descripción: Depto Grande
  Tipo: Depto x6

• **Depto 05** (Código: 005)
  Capacidad: 6 personas
  Descripción: Grande
  Tipo: Depto x6


  🚀 Despliegue en Producción
1. Build para Producción
bash
npm run build
2. Variables de Entorno en Producción
env
NODE_ENV=production
PORT=3000
LLM_API_KEY=tu_api_key_real
ALOJAR_API_TOKEN=tu_token_jwt_real
3. Usando PM2 (Recomendado)
bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicación
pm2 start dist/server.js --name "chatbot-mcp"

# Monitorear
pm2 monit

# Configurar inicio automático
pm2 startup
pm2 save
4. Docker (Opcional)
dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
bash
docker build -t chatbot-mcp .
docker run -p 3000:3000 --env-file .env chatbot-mcp
📊 Monitoreo y Logs
Health Check Endpoint
bash
curl http://localhost:3000/api/health
Logs de la Aplicación
Los logs se escriben en console.error para no interferir con el protocolo MCP. En producción, redirige los logs a un sistema de monitorización.



2. Acceder a los Chats
React: http://localhost:3000/react-chat.html

Vue: http://localhost:3000/vue-chat.html

Vanilla JS: http://localhost:3000/vanilla-chat.html

O

<script>
        // Configuración global
        window.FLOATING_CHATBOT_CONFIG = {
            apiBase: 'https://tu-api.com/api',
            assistantName: 'Tu Asistente',
            welcomeMessage: '¡Hola! ¿En qué puedo ayudarte?',
            suggestions: [
                "¿Tienen disponibilidad?",
                "¿Qué servicios ofrecen?",
                "¿Cómo hago una reserva?"
            ],
            primaryColor: '#ff6b6b',
            secondaryColor: '#4ecdc4'
        };
    </script>
    <script src="floating-chatbot.js"></script>


<head>
    <title>Mi Sitio Web</title>
    <script src="floating-chatbot.js"></script>
</head>
<body>
    <!-- Tu contenido -->
    
    <script>
        // Inicializar manualmente
        const chatbot = new FloatingChatbot({
            apiBase: 'https://tu-api.com/api',
            assistantName: 'Asistente',
            welcomeMessage: '¡Bienvenido!',
            suggestions: [
                "Pregunta 1",
                "Pregunta 2"
            ],
            position: { bottom: '30px', right: '30px' },
            primaryColor: '#3498db',
            secondaryColor: '#8e44ad'
        });
        
        // Guardar referencia global si es necesario
        window.chatbot = chatbot;
    </script>
</body>
</html>