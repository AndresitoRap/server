// server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8081;

const SAP_BASE = 'https://srv-2108.starkcloud.com:50000/b1s/v1';
let sapSessionCookie = '';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // sirve el Flutter Web

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Cookie': sapSessionCookie,
});

// LOGIN
app.post('/api/Login', async (req, res) => {
  try {
    const body = {
      UserName: 'pacjlesmes',
      Password: 'flink17B**64',
      CompanyDB: 'SBO_PACKVISION_TEST',
    };

    const response = await fetch(`${SAP_BASE}/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) return res.status(401).send('Login failed');

    const cookies = response.headers.raw()['set-cookie'];
    sapSessionCookie = cookies?.find(c => c.includes('B1SESSION')) || '';
    res.send({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Error');
  }
});

// Get Last Quotation
app.get('/api/LastQuotation', async (req, res) => {
  try {
    const url = `${SAP_BASE}/Quotations?$orderby=DocEntry desc&$top=1`;
    const response = await fetch(url, { headers: getHeaders() });
    const data = await response.json();
    const docNum = data?.value?.[0]?.DocNum || null;
    res.json({ docNum });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error getting quotation');
  }
});

// CardCodes Search
app.get('/api/CardCodes', async (req, res) => {
  const query = req.query.q || '';
  const url = `${SAP_BASE}/HCO_FRP1100?$select=Code,Name&$filter=contains(Name,'${query}') or contains(Code,'${query}')`;
  try {
    const response = await fetch(url, { headers: getHeaders() });
    const data = await response.json();
    res.json(data.value || []);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

// Catch-all para SPA Flutter Web
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicia servidor
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
