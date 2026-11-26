'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { startServer } = require('../server');
const { Client } = require('../client');

const TOKEN = 'tasks-token-0123456789';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withBus(fn, dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentbus-tasks-'))) {
  const srv = await startServer({ host: '127.0.0.1', port: 0, token: TOKEN, dataDir });
  const client = (name) => new Client({ url: `http://127.0.0.1:${srv.port}`, token: TOKEN, name });
  try {
    await fn(client);
  } finally {
    await srv.close();
  }
  return dataDir;
}

test('plain messages are tasks, replies and --note are notes', async () => {
  await withBus(async (client) => {
    const a = client('a');
    const b = client('b');
    await b.inbox();
    await a.send('b', 'do it');
    await a.send('b', 'fyi', { kind: 'note' });
    await a.send('b', 'answer', { replyTo: 1 });
    const kinds = (await b.inbox()).map((m) => m.kind);
    assert.deepEqual(kinds, ['task', 'note', 'note']);
  });
});

test('take claims only tasks older than min_age and hides them from the inbox', async () => {
  await withBus(async (client) => {
    const a = client('a');
    const b = client('b');
    await b.inbox();
    await a.send('b', 'task one');
    await a.send('b', 'just a note', { kind: 'note' });

    assert.deepEqual(await b.take({ minAge: 60 }), []);
    await sleep(1100);
    const taken = await b.take({ minAge: 1 });
    assert.deepEqual(taken.map((m) => m.body), ['task one']);
    assert.deepEqual(await b.take({ minAge: 0 }), []);
    assert.deepEqual((await b.inbox()).map((m) => m.body), ['just a note']);
  });
});

test('a task already read from the inbox cannot be taken', async () => {
  await withBus(async (client) => {
    const b = client('b');
    await b.inbox();
    await client('a').send('b', 'mine');
    assert.equal((await b.inbox()).length, 1);
    assert.deepEqual(await b.take({ minAge: 0 }), []);
  });
});

test('taking a broadcast task only claims it for the taker', async () => {
  await withBus(async (client) => {
    const b = client('b');
    const c = client('c');
    await Promise.all([b.inbox(), c.inbox()]);
    await client('a').send('*', 'everyone run tests');
    assert.equal((await b.take({ minAge: 0 })).length, 1);
    assert.equal((await c.inbox()).length, 1);
  });
});

test('take respects limit and survives a restart', async () => {
  const dataDir = await withBus(async (client) => {
    const b = client('b');
    await b.inbox();
    await client('a').send('b', 't1');
    await client('a').send('b', 't2');
    assert.deepEqual((await b.take({ minAge: 0, limit: 1 })).map((m) => m.body), ['t1']);
  });
  await withBus(async (client) => {
    assert.deepEqual((await client('b').inbox()).map((m) => m.body), ['t2']);
  }, dataDir);
});

test('messages stored before kinds existed are classified by reply_to', async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentbus-legacy-'));
  const legacy = [
    { t: 'agent', name: 'b', joined: 0, cursor: 0, last_seen: new Date().toISOString() },
    { t: 'msg', id: 1, ts: '2026-01-01T00:00:00.000Z', from: 'a', to: 'b', body: 'old task' },
    { t: 'msg', id: 2, ts: '2026-01-01T00:00:00.000Z', from: 'a', to: 'b', body: 'old reply', reply_to: 1 },
  ];
  fs.writeFileSync(path.join(dataDir, 'bus.jsonl'), legacy.map((e) => JSON.stringify(e)).join('\n') + '\n');
  await withBus(async (client) => {
    const b = client('b');
    assert.deepEqual((await b.take({ minAge: 0 })).map((m) => m.body), ['old task']);
    assert.deepEqual((await b.inbox()).map((m) => [m.body, m.kind]), [['old reply', 'note']]);
  }, dataDir);
});
