/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANDINET V2 — claude-assistant.js
Asistente Claude flotante con acceso a contexto del app
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

window.AndinetAssistant = (function () {
‘use strict’;

let isOpen = false;
let messages = [];
const MAX_MESSAGES = 50;

// Obtener contexto actual del app
function getAppContext() {
const context = {};

```
// Planner tasks
if (window.AndinetStorage) {
  const planner = window.AndinetStorage.planner?.get?.() || {};
  context.plannerTasks = Object.keys(planner).length;
  context.todayTasks = planner.today?.length || 0;
}

// Inbox items
if (window.AndinetStorage) {
  const inbox = window.AndinetStorage.inbox?.get?.() || {};
  context.inboxItems = inbox.pending?.length || 0;
}

// Proyectos
if (window.AndinetStorage) {
  const proyectos = window.AndinetStorage.proyectos?.get?.() || {};
  context.activeProjects = Object.keys(proyectos).length;
}

// Current date
context.currentDate = new Date().toLocaleDateString('es-MX', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

// Current view
context.currentView = document.querySelector('.view.active')?.id || 'unknown';

return context;
```

}

// Crear HTML del asistente
function createAssistantHTML() {
return `
<div id="claude-assistant" class="claude-assistant">
<!-- Header -->
<div class="ca-header">
<div class="ca-title">✨ Asistente</div>
<button id="ca-close" class="ca-close-btn" title="Cerrar">×</button>
</div>

```
    <!-- Messages container -->
    <div id="ca-messages" class="ca-messages">
      <div class="ca-msg ca-msg-system">
        Hola, soy tu asistente. Puedo ayudarte a organizar tareas, 
        sugerir ideas, o simplemente charlar sobre lo que necesites. ¿Qué hay en tu mente?
      </div>
    </div>

    <!-- Input -->
    <div class="ca-input-wrap">
      <textarea 
        id="ca-input" 
        class="ca-input" 
        placeholder="Escribe algo… (Shift+Enter para enviar)"
        rows="3"
      ></textarea>
      <button id="ca-send" class="ca-send-btn" title="Enviar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </div>

    <!-- Loading indicator -->
    <div id="ca-loading" class="ca-loading" style="display:none">
      <span class="ca-spinner"></span>
    </div>
  </div>

  <!-- Toggle button (floating) -->
  <button id="ca-toggle" class="ca-toggle-btn" title="Asistente Claude">
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <circle cx="12" cy="12" r="10"/>
      <text x="12" y="15" text-anchor="middle" font-size="10" fill="white" font-weight="bold">C</text>
    </svg>
  </button>
`;
```

}

// Llamar Claude API
async function callClaudeAPI(userMessage) {
const context = getAppContext();

```
const systemPrompt = `Eres el asistente personal de Anne en su app Andinet. 
```

Eres como una amiga confidenta que entiende sus proyectos, hábitos y necesidades.
Contexto actual:

- Fecha: ${context.currentDate}
- Tareas hoy: ${context.todayTasks}
- Items en inbox: ${context.inboxItems}
- Proyectos activos: ${context.activeProjects}
- Vista actual: ${context.currentView}

Sé breve, cálido, y útil. Habla en español. Si puede ser, da sugerencias prácticas.`;

```
try {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Claude API error:', error);
    return `Error: ${error.error?.message || 'No se pudo conectar con Claude'}`;
  }

  const data = await response.json();
  return data.content[0]?.text || 'Sin respuesta';
} catch (err) {
  console.error('Claude API fetch error:', err);
  return `Error de conexión: ${err.message}`;
}
```

}

// Agregar mensaje al chat
function addMessage(text, isUser = false) {
const msgEl = document.createElement(‘div’);
msgEl.className = `ca-msg ${isUser ? 'ca-msg-user' : 'ca-msg-claude'}`;
msgEl.textContent = text;

```
const container = document.getElementById('ca-messages');
if (container) {
  container.appendChild(msgEl);
  container.scrollTop = container.scrollHeight;
}

messages.push({ role: isUser ? 'user' : 'assistant', text });

// Limitar historial
if (messages.length > MAX_MESSAGES) {
  messages.shift();
}
```

}

// Enviar mensaje
async function sendMessage() {
const input = document.getElementById(‘ca-input’);
const text = input?.value?.trim();

```
if (!text) return;

// Mostrar mensaje del usuario
addMessage(text, true);
input.value = '';
input.style.height = '48px';

// Mostrar loading
const loading = document.getElementById('ca-loading');
if (loading) loading.style.display = 'flex';

// Llamar Claude
const response = await callClaudeAPI(text);

// Ocultar loading
if (loading) loading.style.display = 'none';

// Mostrar respuesta
addMessage(response, false);
```

}

// Toggle open/close
function toggleAssistant() {
isOpen = !isOpen;
const assistant = document.getElementById(‘claude-assistant’);
const toggle = document.getElementById(‘ca-toggle’);

```
if (assistant) {
  assistant.classList.toggle('open', isOpen);
}
if (toggle) {
  toggle.classList.toggle('active', isOpen);
}

if (isOpen) {
  setTimeout(() => {
    document.getElementById('ca-input')?.focus();
  }, 100);
}
```

}

// Init
function init() {
// Crear HTML
const html = createAssistantHTML();
const wrapper = document.createElement(‘div’);
wrapper.innerHTML = html;
document.body.appendChild(wrapper);

```
// Event listeners
const closeBtn = document.getElementById('ca-close');
const toggleBtn = document.getElementById('ca-toggle');
const sendBtn = document.getElementById('ca-send');
const input = document.getElementById('ca-input');

if (closeBtn) closeBtn.addEventListener('click', toggleAssistant);
if (toggleBtn) toggleBtn.addEventListener('click', toggleAssistant);
if (sendBtn) sendBtn.addEventListener('click', sendMessage);

if (input) {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = '48px';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });
}
```

}

return {
init,
toggleAssistant,
sendMessage,
};
})();

// Auto-init
if (document.readyState === ‘loading’) {
document.addEventListener(‘DOMContentLoaded’, () => {
window.AndinetAssistant.init();
});
} else {
window.AndinetAssistant.init();
}