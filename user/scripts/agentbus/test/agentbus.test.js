'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { startServer } = require('../server');
const { Client } = require('../client');

const TOKEN = 'test-token-0123456789';

async function withBus(fn, opts = {}) {
  const dataDir = opts.dataDir || fs.mkdtempSync(path.join(os.tmpdir(), 'agentbus-'));
  const srv = await startServer({ host: '127.0.0.1', port: 0, token: TOKEN, dataDir });
  const url = `http://127.0.0.1:${srv.port}`;
  const client = (name, token = TOKEN) => new Client({ url, token, name });
  try {
    await fn({ client, url, dataDir });
  } finally {
    await srv.close();
  }
  return dataDir;
}

test('direct message reaches only its recipient and inbox advances', async () => {
  await withBus(async ({ client }) => {
    const a = client('pc1/a');
    const b = client('pc2/b');
    const c = client('pc3/c');
    await Promise.all([a.inbox(), b.inbox(), c.inbox()]);

    const { id } = await a.send('pc2/b', 'hello b');
    assert.ok(id > 0);

    const got = await b.inbox();
    assert.equal(got.length, 1);
    assert.equal(got[0].from, 'pc1/a');
    assert.equal(got[0].body, 'hello b');
    assert.deepEqual(await b.inbox(), []);
    assert.deepEqual(await c.inbox(), []);
  });
});

test('broadcast reaches every other agent but not the sender', async () => {
  await withBus(async ({ client }) => {
    const [a, b, c] = ['a', 'b', 'c'].map((n) => client(n));
    await Promise.all([a.inbox(), b.inbox(), c.inbox()]);

    await a.send('*', 'all hands');

    assert.equal((await b.inbox())[0].body, 'all hands');
    assert.equal((await c.inbox())[0].body, 'all hands');
    assert.deepEqual(await a.inbox(), []);
  });
});

test('late joiner gets direct mail sent before it joined but not old broadcasts', async () => {
  await withBus(async ({ client }) => {
    const a = client('a');
    await a.inbox();
    await a.send('*', 'old news');
    await a.send('late', 'waiting for you');

    const late = client('late');
    const got = await late.inbox();
    assert.deepEqual(got.map((m) => m.body), ['waiting for you']);
  });
});

test('peek does not advance the cursor', async () => {
  await withBus(async ({ client }) => {
    const a = client('a');
    const b = client('b');
    await b.inbox();
    await a.send('b', 'x');
    assert.equal((await b.inbox({ peek: true })).length, 1);
    assert.equal((await b.inbox()).length, 1);
    assert.equal((await b.inbox()).length, 0);
  });
});

test('long poll wakes when a message arrives', async () => {
  await withBus(async ({ client }) => {
    const a = client('a');
    const b = client('b');
    await b.inbox();
    const started = Date.now();
    const pending = b.inbox({ wait: 10 });
    setTimeout(() => a.send('b', 'ping', { replyTo: 7 }), 150);
    const got = await pending;
    assert.equal(got[0].body, 'ping');
    assert.equal(got[0].reply_to, 7);
    assert.ok(Date.now() - started < 5000);
  });
});

test('long poll returns empty after the wait expires', async () => {
  await withBus(async ({ client }) => {
    const b = client('b');
    assert.deepEqual(await b.inbox({ wait: 1 }), []);
  });
});

test('agents lists everyone seen with unread counts', async () => {
  await withBus(async ({ client }) => {
    const a = client('a');
    const b = client('b');
    await b.inbox();
    await a.send('b', '1');
    await a.send('b', '2');
    const list = await a.agents();
    const byName = Object.fromEntries(list.map((x) => [x.name, x]));
    assert.equal(byName.b.unread, 2);
    assert.equal(byName.a.unread, 0);
  });
});

test('wrong token is rejected', async () => {
  await withBus(async ({ client }) => {
    await assert.rejects(client('a', 'nope').inbox(), /401/);
  });
});

test('invalid names and oversized bodies are rejected', async () => {
  await withBus(async ({ client }) => {
    await assert.rejects(client('bad name!').inbox(), /400/);
    await assert.rejects(client('a').send('b', 'x'.repeat(70 * 1024)), /413|400/);
  });
});

test('messages and cursors survive a restart', async () => {
  const dataDir = await withBus(async ({ client }) => {
    const b = client('b');
    await b.inbox();
    await client('a').send('b', 'first');
    await b.inbox();
    await client('a').send('b', 'second');
  });
  await withBus(async ({ client }) => {
    const got = await client('b').inbox();
    assert.deepEqual(got.map((m) => m.body), ['second']);
    const { id } = await client('a').send('b', 'third');
    assert.equal(id, 3);
  }, { dataDir });
});

test('server refuses to listen on a non-loopback host without a token', async () => {
  await assert.rejects(
    startServer({ host: '0.0.0.0', port: 0, token: '', dataDir: os.tmpdir() }),
    /token/,
  );
});
