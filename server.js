import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

// Servir archivos estáticos
app.use(express.static('.'));

// Health check
app.get('/', (req, res) => {
  res.send('✅ Andinet v2 funcionando');
});

// Proxy para Claude API (opcional, si lo necesitas)
app.post('/api/claude', async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en puerto ${PORT}`);
});
