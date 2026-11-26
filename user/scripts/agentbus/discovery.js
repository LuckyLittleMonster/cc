'use strict';

const dgram = require('node:dgram');
const crypto = require('node:crypto');
const os = require('node:os');

const MAGIC = 'agentbus';
const NONCE_RE = /^[0-9a-f]{16,64}$/;
const MAX_DATAGRAM = 512;

// The server proves it holds the token without sending it; clients ignore buses they cannot verify.
function proof(token, nonce) {
  return crypto.createHmac('sha256', token).update(nonce).digest('hex');
}

function parse(buf) {
  if (buf.length > MAX_DATAGRAM) return null;
  try {
    return JSON.parse(buf.toString('utf8'));
  } catch {
    return null; // stray traffic on a shared port is normal, not an error
  }
}

const toInt = (ip) => ip.split('.').reduce((acc, part) => ((acc << 8) | Number(part)) >>> 0, 0);
const toIp = (n) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');

// 255.255.255.255 leaves through one NIC only on Windows, so also hit every directed broadcast.
function broadcastTargets() {
  const out = new Set(['255.255.255.255', '127.0.0.1']);
  for (const a of Object.values(os.networkInterfaces()).flat()) {
    if (!a || a.family !== 'IPv4' || a.internal) continue;
    out.add(toIp((toInt(a.address) | ~toInt(a.netmask)) >>> 0));
  }
  return [...out];
}

function startResponder({ host, port, token, httpPort }) {
  const sock = dgram.createSocket('udp4');
  sock.on('message', (buf, rinfo) => {
    const req = parse(buf);
    if (req?.[MAGIC] !== 'discover' || typeof req.nonce !== 'string' || !NONCE_RE.test(req.nonce)) return;
    const reply = JSON.stringify({ [MAGIC]: 'here', port: httpPort, proof: proof(token, req.nonce) });
    sock.send(reply, rinfo.port, rinfo.address);
  });
  return new Promise((resolve, reject) => {
    sock.once('error', reject);
    sock.bind(port, host, () => {
      sock.off('error', reject);
      sock.on('error', (err) => process.stderr.write(`agentbus discovery: ${err.message}\n`));
      resolve({
        port: sock.address().port,
        close: () => new Promise((done) => sock.close(done)),
      });
    });
  });
}

function discover({ token, port = 7788, targets = broadcastTargets(), timeoutMs = 1500 } = {}) {
  if (!token) return Promise.reject(new Error('discover needs the bus token'));
  const nonce = crypto.randomBytes(16).toString('hex');
  const expected = Buffer.from(proof(token, nonce), 'hex');
  const payload = JSON.stringify({ [MAGIC]: 'discover', nonce });

  return new Promise((resolve, reject) => {
    const sock = dgram.createSocket('udp4');
    let timer;
    let settled = false;
    const finish = (err, url) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      sock.close();
      if (err) reject(err);
      else resolve(url);
    };
    sock.on('message', (buf, rinfo) => {
      const msg = parse(buf);
      if (msg?.[MAGIC] !== 'here' || typeof msg.proof !== 'string' || !Number.isInteger(msg.port)) return;
      const got = Buffer.from(msg.proof, 'hex');
      if (got.length !== expected.length || !crypto.timingSafeEqual(got, expected)) return;
      finish(null, `http://${rinfo.address}:${msg.port}`);
    });
    sock.on('error', (err) => {
      // Windows surfaces an ICMP port-unreachable from a silent target as ECONNRESET.
      if (err.code === 'ECONNRESET') return;
      finish(err);
    });
    sock.bind(0, () => {
      sock.setBroadcast(true);
      // A target can be unroutable (adapter down); the others still count, so per-send errors are dropped.
      for (const t of targets) sock.send(payload, port, t, () => {});
      timer = setTimeout(() => finish(null, null), timeoutMs);
    });
  });
}

module.exports = { discover, startResponder, broadcastTargets };
