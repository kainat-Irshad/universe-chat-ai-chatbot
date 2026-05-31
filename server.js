const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/public')));

// === YAHAN APNI KEY DAALO ===
const OPENROUTER_KEY = "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";
// ============================

const SYSTEM = `Aap UNIVERSE CHAT hain — ek helpful AI assistant.
Urdu mein poochha jaye toh Urdu/Roman Urdu mein jawab do.
English mein poochha jaye toh English mein jawab do.
Hamesha friendly aur helpful raho.`;

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'Universe Chat'
      },
      body: JSON.stringify({
model: 'openrouter/auto',        stream: true,
        messages: [
          { role: 'system', content: SYSTEM },
          ...messages
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.log('API Error:', err);
      res.write(`data: ${JSON.stringify({ text: 'Error: ' + err })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') { res.write('data: [DONE]\n\n'); continue; }
        try {
          const parsed = JSON.parse(data);
          const text = parsed.choices?.[0]?.delta?.content;
          if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
        } catch(e) {}
      }
    }
    res.end();
  } catch (error) {
    console.log('Error:', error.message);
    res.write(`data: ${JSON.stringify({ text: 'Server error: ' + error.message })}\n\n`);
    res.end();
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

app.listen(3001, () => {
  console.log('\n🌌 UNIVERSE CHAT chal raha hai!');
  console.log('👉 http://localhost:3001\n');
});
