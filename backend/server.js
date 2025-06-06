const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

const SAP_URL = 'https://srv-2108.starkcloud.com:50000/b1s/v1';
let sapSessionCookie = '';

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

// 🔐 LOGIN (guarda cookie y devuelve JSON)
app.post('/api/Login', async (req, res) => {
  try {
    const sapRes = await fetch(`${SAP_URL}/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    sapSessionCookie = sapRes.headers.get('set-cookie');
    const data = await sapRes.json();

    res.json({
      session: sapSessionCookie,
      data: data,
    });
  } catch (e) {
    res.status(500).json({ error: 'Error al hacer login' });
  }
});


// 🌀 PROXY GENÉRICO para GET/POST a cualquier ruta SAP
app.all('/api/:endpoint*', async (req, res) => {
  if (!sapSessionCookie) {
    return res.status(401).json({ error: 'No hay sesión activa en SAP' });
  }

  const endpoint = req.params.endpoint + (req.params[0] || '');
  const method = req.method;
  const body = ['POST', 'PUT', 'PATCH'].includes(method) ? JSON.stringify(req.body) : undefined;

  try {
    const sapRes = await fetch(`${SAP_URL}/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sapSessionCookie,
      },
      body,
    });

    const text = await sapRes.text();
    try {
      const data = JSON.parse(text);
      res.status(sapRes.status).json(data);
    } catch {
      res.status(sapRes.status).send(text); // fallback por si no es JSON
    }
  } catch (e) {
    res.status(500).json({ error: 'Error al comunicar con SAP', detail: e.message });
  }
});

// 🔧 Flutter Web build (SPA)
app.use(express.static(path.join(__dirname, '../frontend/web')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/web/index.html'));
});

app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
