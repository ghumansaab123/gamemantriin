// server.js — main entry for Express proxy
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const path = require('path');

// Create app
const app = express();
const PORT = process.env.PORT || 3000;

// Safe fetch: Node 18+ has global fetch, else fall back to node-fetch
const fetch = globalThis.fetch || ((...args) => import('node-fetch').then(m => m.default(...args)));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory session store
const sessions = {};

// Helper: md5 hashing
function md5(str) {
  return crypto.createHash('md5').update(String(str)).digest('hex');
}

// Helper: recursively find balance
function findBalance(obj) {
  if (!obj) return null;
  if (typeof obj.balance !== 'undefined') return obj.balance;
  if (typeof obj.money !== 'undefined') return obj.money;
  if (typeof obj.amount !== 'undefined') return obj.amount;
  if (obj.obj) return findBalance(obj.obj);
  if (obj.data) return findBalance(obj.data);
  return null;
}

// Redirect root → login page
app.get('/', (req, res) => res.redirect('/login.html'));

// Login proxy
app.post('/api/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) return res.status(400).json({ ok: false, error: 'mobile & password required' });

    const hashed = md5(password);
    const remoteUrl = `https://mantrishop.in/lottery-backend/glserver/user/login?mobile=${encodeURIComponent(mobile)}&password=${encodeURIComponent(hashed)}`;

    const remoteResp = await fetch(remoteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://mantrishop.in',
        'Referer': 'https://mantrishop.in/',
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*'
      },
      body: ''
    });

    // Capture cookies
    const sc = remoteResp.headers?.raw ? remoteResp.headers.raw()['set-cookie'] : remoteResp.headers?.get?.('set-cookie');
    let cookieString = '';
    if (sc && Array.isArray(sc)) {
      cookieString = sc.map(c => c.split(';')[0]).join('; ');
    } else if (typeof sc === 'string') {
      cookieString = sc.split(';')[0];
    }

    let remoteData;
    try {
      remoteData = await remoteResp.json();
    } catch (err) {
      const text = await remoteResp.text().catch(() => '');
      remoteData = { parseError: true, text };
      console.log('Remote response text:', text);
    }

    const sessionId = uuidv4();
    sessions[sessionId] = { cookies: cookieString, data: remoteData, createdAt: Date.now() };

    res.json({ ok: true, sessionId, remoteData });
  } catch (err) {
    console.error('Login proxy error:', err);
    res.status(500).json({ ok: false, error: 'Proxy login error', details: err.message || String(err) });
  }
});

// Balance proxy
app.get('/api/balance', async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ ok: false, error: 'sessionId required' });

    const session = sessions[sessionId];
    if (!session) return res.status(404).json({ ok: false, error: 'invalid sessionId' });

    const stored = session.data || {};
    const balanceFromLogin = findBalance(stored);
    if (balanceFromLogin !== null) {
      return res.json({ ok: true, balance: balanceFromLogin, raw: stored });
    }

    if (!session.cookies) {
      return res.json({ ok: true, balance: null, raw: stored, message: 'no cookies for follow-up request' });
    }

    const followUpUrl = 'https://mantrishop.in/lottery-backend/glserver/user/getUserById';
    const followResp = await fetch(followUpUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Cookie': session.cookies,
        'Referer': 'https://mantrishop.in/',
        'Origin': 'https://mantrishop.in'
      }
    });

    if (!followResp.ok) {
      return res.json({ ok: true, balance: null, raw: stored, followUpStatus: followResp.status });
    }

    const followData = await followResp.json();
    const balance = findBalance(followData);
    res.json({ ok: true, balance, raw: followData });
  } catch (err) {
    console.error('Balance error:', err);
    res.status(500).json({ ok: false, error: 'Server error fetching balance', details: err.message || '' });
  }
});

// Cleanup expired sessions
setInterval(() => {
  const now = Date.now();
  for (const sid of Object.keys(sessions)) {
    if (now - sessions[sid].createdAt > 1000 * 60 * 60 * 6) delete sessions[sid];
  }
}, 1000 * 60 * 30);

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
