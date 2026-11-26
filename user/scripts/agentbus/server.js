'use strict';

const http = require('node:http');
const crypto = require('node:crypto');
const { Store } = require('./store');

const NAME_RE = /^[A-Za-z0-9._:/-]{1,64}$/;
const MAX_REQUEST_BYTES = 128 * 1024;
const MAX_BODY_BYTES = 64 * 1024;
const MAX_WAIT_SEC = 60;
const DEFAULT_LIMIT = 100;
const LOOPBACK = new Set(['127.0.0.1', '::1', 'localhost']);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function digest(s) {
  return crypto.createHash('sha256').update(String(s)).digest();
}

function checkAuth(req, token) {
  if (!token) return;
  const header = req.headers.authorization || '';
  const given = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!crypto.timingSafeEqual(digest(given), digest(token))) {
    throw new HttpError(401, 'bad token');
  }
}

function checkName(name, field) {
  if (typeof name !== 'string' || !NAME_RE.test(name)) {
    throw new HttpError(400, `invalid ${field}: use 1-64 chars of [A-Za-z0-9._:/-]`);
  }
  return name;
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_REQUEST_BYTES) {
        reject(new HttpError(413, 'request too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(new HttpError(400, 'body is not JSON'));
      }
    });
    req.on('error', reject);
  });
}

function send(res, status, payload) {
  const text = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(text),
  });
  res.end(text);
}

function startServer({ host = '0.0.0.0', port = 7788, token = '', dataDir }) {
  if (!token && !LOOPBACK.has(host)) {
    return Promise.reject(new Error('a token is required when listening beyond loopback'));
  }
  const store = new Store(dataDir);
  const waiters = new Set();

  const wake = () => {
    for (const w of [...waiters]) w.check();
  };

  const waitForMail = (name, seconds) => new Promise((resolve) => {
    const waiter = {
      done: () => {
        clearTimeout(waiter.timer);
        waiters.delete(waiter);
        resolve();
      },
      check: () => {
        if (store.pending(name, 1).messages.length > 0) waiter.done();
      },
    };
    waiter.timer = setTimeout(waiter.done, seconds * 1000);
    waiters.add(waiter);
  });

  const routes = {
    'GET /health': async () => ({ ok: true }),

    'POST /v1/send': async (req) => {
      const { from, to, body, reply_to } = await readJson(req);
      checkName(from, 'from');
      if (to !== '*') checkName(to, 'to');
      if (typeof body !== 'string' || body.length === 0) throw new HttpError(400, 'body must be a non-empty string');
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) throw new HttpError(413, `body over ${MAX_BODY_BYTES} bytes`);
      if (reply_to !== undefined && !Number.isInteger(reply_to)) throw new HttpError(400, 'reply_to must be an integer');
      store.touch(from);
      const msg = store.addMessage({ from, to, body, reply_to });
      wake();
      return { id: msg.id };
    },

    'GET /v1/inbox': async (req, url) => {
      const name = checkName(url.searchParams.get('name'), 'name');
      const wait = Math.min(Math.max(Number(url.searchParams.get('wait')) || 0, 0), MAX_WAIT_SEC);
      const peek = url.searchParams.get('peek') === '1';
      const limit = Math.max(Number(url.searchParams.get('limit')) || DEFAULT_LIMIT, 1);
      store.touch(name);
      if (wait > 0 && store.pending(name, 1).messages.length === 0) {
        await waitForMail(name, wait);
      }
      const { messages, cursor } = store.pending(name, limit);
      if (!peek) store.advance(name, cursor);
      return { messages };
    },

    'GET /v1/agents': async () => ({
      agents: [...store.agents.values()].map((a) => ({
        name: a.name,
        last_seen: a.last_seen,
        unread: store.pending(a.name).messages.length,
      })),
    }),

    'GET /v1/log': async (req, url) => {
      const n = Math.min(Math.max(Number(url.searchParams.get('n')) || 20, 1), 500);
      return { messages: store.recent(n) };
    },
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://bus');
    const handler = routes[`${req.method} ${url.pathname}`];
    try {
      if (!handler) throw new HttpError(404, 'no such route');
      if (url.pathname !== '/health') checkAuth(req, token);
      send(res, 200, await handler(req, url));
    } catch (err) {
      const status = err.status || 500;
      if (status === 500) process.stderr.write(`agentbus: ${err.stack}\n`);
      if (!res.headersSent) send(res, status, { error: err.message });
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      resolve({
        port: server.address().port,
        close: () => new Promise((done) => {
          for (const w of [...waiters]) w.done();
          server.closeAllConnections();
          server.close(() => done());
        }),
      });
    });
  });
}

module.exports = { startServer, NAME_RE };
