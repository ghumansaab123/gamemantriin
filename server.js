
// server.js — safe version using dynamic fetch import if needed
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = 3000;

// safe fetch: use global fetch (Node 18+), otherwise dynamically import node-fetch
const fetch = globalThis.fetch || ((...args) => import('node-fetch').then(m => m.default(...args)));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// in-memory sessions
const sessions = {};

// helper: md5
function md5(str) {
  return crypto.createHash('md5').update(String(str)).digest('hex');
}

// helper to find balance
function findBalance(obj) {
  if (!obj) return null;
  if (typeof obj.balance !== 'undefined') return obj.balance;
  if (typeof obj.money !== 'undefined') return obj.money;
  if (typeof obj.amount !== 'undefined') return obj.amount;
  if (obj.obj) return findBalance(obj.obj);
  if (obj.data) return findBalance(obj.data);
  return null;
}

app.get('/', (req, res) => res.redirect('/login.html'));

// POST /api/login
app.post('/api/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) return res.status(400).json({ ok: false, error: 'mobile & password required' });

    // MD5 password as remote expects
    const hashed = md5(password);

    const remoteUrl = `https://mantrishop.in/lottery-backend/glserver/user/login?mobile=${encodeURIComponent(mobile)}&password=${encodeURIComponent(hashed)}`;

    const remoteResp = await fetch(remoteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://mantrishop.in',
        'Referer': 'https://mantrishop.in/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        'Accept': '*/*'
      },
      body: ''
    });

    // capture set-cookie headers if any
    const sc = remoteResp.headers && (remoteResp.headers.raw ? remoteResp.headers.raw()['set-cookie'] : remoteResp.headers.get && remoteResp.headers.get('set-cookie'));
    let cookieString = '';
    if (sc && Array.isArray(sc)) {
      cookieString = sc.map(c => c.split(';')[0]).join('; ');
    } else if (typeof sc === 'string') {
      cookieString = sc.split(';')[0];
    }

    // parse JSON safely
    let remoteData;
    try {
      remoteData = await remoteResp.json();
    } catch (err) {
      const text = await remoteResp.text().catch(() => '');
      remoteData = { parseError: true, text };
    }

    const sessionId = uuidv4();
    sessions[sessionId] = { cookies: cookieString, data: remoteData, createdAt: Date.now() };

    return res.json({ ok: true, sessionId, remoteData });
  } catch (err) {
    console.error('Login proxy error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ ok: false, error: 'Proxy login error', details: err && err.message ? err.message : String(err) });
  }
});

// GET /api/balance?sessionId=...
app.get('/api/balance', async (req, res) => {
  try {
    const sessionId = req.query.sessionId;
    if (!sessionId) return res.status(400).json({ ok: false, error: 'sessionId required' });

    const session = sessions[sessionId];
    if (!session) return res.status(404).json({ ok: false, error: 'invalid sessionId' });

    const stored = session.data || {};
    const balanceFromLogin = findBalance(stored);
    if (balanceFromLogin !== null) {
      return res.json({ ok: true, balance: balanceFromLogin, raw: stored });
    }

    // if no balance in login response but cookies exist, try follow-up (optional)
    if (!session.cookies) {
      return res.json({ ok: true, balance: null, raw: stored, message: 'no cookies to perform follow-up request' });
    }

    // example follow-up (may need to change based on real API)
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
    return res.json({ ok: true, balance: balance, raw: followData });
  } catch (err) {
    console.error('Balance error:', err);
    return res.status(500).json({ ok: false, error: 'Server error fetching balance', details: err && err.message ? err.message : '' });
  }
});

// cleanup
setInterval(() => {
  const now = Date.now();
  for (const sid of Object.keys(sessions)) {
    if (now - sessions[sid].createdAt > 1000 * 60 * 60 * 6) delete sessions[sid];
  }
}, 1000 * 60 * 30);

app.listen(PORT, () => console.log(`Proxy server running at http://localhost:${PORT}`));

