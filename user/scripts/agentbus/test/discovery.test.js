'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { startServer } = require('../server');
const { discover } = require('../discovery');

const TOKEN = 'discovery-token-0123456789';

async function withServer(fn) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentbus-disc-'));
  const srv = await startServer({ host: '127.0.0.1', port: 0, discoveryPort: 0, token: TOKEN, dataDir });
  try {
    await fn(srv);
  } finally {
    await srv.close();
  }
}

test('discover finds a server that proves it knows the token', async () => {
  await withServer(async (srv) => {
    const url = await discover({
      token: TOKEN,
      port: srv.discoveryPort,
      targets: ['127.0.0.1'],
      timeoutMs: 1000,
    });
    assert.equal(url, `http://127.0.0.1:${srv.port}`);
    const health = await fetch(`${url}/health`).then((r) => r.json());
    assert.deepEqual(health, { ok: true });
  });
});

test('discover ignores a server with a different token', async () => {
  await withServer(async (srv) => {
    const url = await discover({
      token: 'some-other-token',
      port: srv.discoveryPort,
      targets: ['127.0.0.1'],
      timeoutMs: 500,
    });
    assert.equal(url, null);
  });
});

test('discover returns null when nobody answers', async () => {
  const url = await discover({ token: TOKEN, port: 1, targets: ['127.0.0.1'], timeoutMs: 300 });
  assert.equal(url, null);
});

test('discover requires a token', async () => {
  await assert.rejects(discover({ token: '' }), /token/);
});
