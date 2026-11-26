'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { startServer } = require('../server');
const { Client } = require('../client');
const { workOnce, runClaude, nameForDir, MAX_REPLY_BYTES } = require('../worker');

const TOKEN = 'worker-token-0123456789';

async function withBus(fn) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentbus-worker-'));
  const srv = await startServer({ host: '127.0.0.1', port: 0, token: TOKEN, dataDir });
  const client = (name) => new Client({ url: `http://127.0.0.1:${srv.port}`, token: TOKEN, name });
  try {
    await fn(client);
  } finally {
    await srv.close();
  }
}

test('nameForDir matches the default name a session in that dir would get', () => {
  assert.equal(nameForDir('C:\\Users\\x\\git\\R2AGI', 'PaiDesktop'), 'paidesktop/r2agi');
  assert.equal(nameForDir('/home/x/my project', 'box'), 'box/my-project');
});

test('workOnce runs an unclaimed task in the dir and replies to the sender as a note', async () => {
  await withBus(async (client) => {
    const worker = client('pc/proj');
    await worker.inbox();
    await client('boss').inbox();
    await client('boss').send('pc/proj', 'count the files');

    const calls = [];
    const runner = async (dir, prompt) => {
      calls.push({ dir, prompt });
      return { code: 0, stdout: 'there are 3 files\n', stderr: '' };
    };
    const did = await workOnce({ client: worker, dir: '/work/proj', graceSec: 0, runner, log: () => {} });

    assert.equal(did, 1);
    assert.equal(calls[0].dir, '/work/proj');
    assert.match(calls[0].prompt, /count the files/);
    assert.match(calls[0].prompt, /boss/);
    const [reply] = await client('boss').inbox();
    assert.equal(reply.kind, 'note');
    assert.equal(reply.reply_to, 1);
    assert.match(reply.body, /there are 3 files/);
  });
});

test('workOnce reports a failed run back to the sender', async () => {
  await withBus(async (client) => {
    const worker = client('pc/proj');
    await worker.inbox();
    await client('boss').inbox();
    await client('boss').send('pc/proj', 'break');
    const runner = async () => ({ code: 3, stdout: '', stderr: 'boom' });
    await workOnce({ client: worker, dir: '.', graceSec: 0, runner, log: () => {} });
    const [reply] = await client('boss').inbox();
    assert.match(reply.body, /failed \(exit 3\)/);
    assert.match(reply.body, /boom/);
  });
});

test('workOnce leaves notes alone and does nothing when idle', async () => {
  await withBus(async (client) => {
    const worker = client('pc/proj');
    await worker.inbox();
    await client('boss').send('pc/proj', 'thanks', { kind: 'note' });
    let ran = false;
    const runner = async () => {
      ran = true;
      return { code: 0, stdout: '', stderr: '' };
    };
    assert.equal(await workOnce({ client: worker, dir: '.', graceSec: 0, runner, log: () => {} }), 0);
    assert.equal(ran, false);
    assert.equal((await worker.inbox()).length, 1);
  });
});

test('a huge result is cut to fit the bus body limit', async () => {
  await withBus(async (client) => {
    const worker = client('pc/proj');
    await worker.inbox();
    await client('boss').inbox();
    await client('boss').send('pc/proj', 'talk a lot');
    const runner = async () => ({ code: 0, stdout: '汉'.repeat(40000), stderr: '' });
    await workOnce({ client: worker, dir: '.', graceSec: 0, runner, log: () => {} });
    const [reply] = await client('boss').inbox();
    assert.ok(Buffer.byteLength(reply.body) <= MAX_REPLY_BYTES + 200);
    assert.match(reply.body, /truncated/);
  });
});

test('runClaude feeds the prompt on stdin and runs in the given dir', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentbus-fake-claude-'));
  const fake = path.join(dir, 'fake.js');
  fs.writeFileSync(fake, "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{console.log(process.cwd()+'|'+s.trim());process.exit(s.includes('fail')?2:0)})");
  const ok = await runClaude(dir, 'hello there', { command: process.execPath, args: [fake] });
  assert.equal(ok.code, 0);
  assert.equal(ok.stdout.trim(), `${fs.realpathSync(dir)}|hello there`);
  const bad = await runClaude(dir, 'please fail', { command: process.execPath, args: [fake] });
  assert.equal(bad.code, 2);
});

test('runClaude kills a run that exceeds its timeout', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentbus-slow-claude-'));
  const slow = path.join(dir, 'slow.js');
  fs.writeFileSync(slow, 'setTimeout(() => {}, 60000)');
  const res = await runClaude(dir, 'x', { command: process.execPath, args: [slow], timeoutMs: 300 });
  assert.notEqual(res.code, 0);
  assert.match(res.stderr, /timed out/);
});
