'use strict';

const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { nameForDir } = require('./config');

const MAX_REPLY_BYTES = 60 * 1024;
const POLL_MS = 5000;
const ERROR_BACKOFF_MS = 15000;
const DEFAULT_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const TAIL_CHARS = 2000;
const CLAUDE_ARGS = ['-p', '--permission-mode', 'bypassPermissions', '--output-format', 'text'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fitBytes(text, max) {
  const buf = Buffer.from(text);
  if (buf.length <= max) return text;
  return `${buf.subarray(0, max).toString('utf8').replace(/�+$/, '')}\n... [truncated]`;
}

function buildPrompt(task, name, dir) {
  return `You are the agentbus worker for "${name}", running headless in ${dir}.
Agent "${task.from}" sent you this task over agentbus (message #${task.id}):

${task.body}

Nobody is watching this run and nobody can answer questions: decide sensibly and state any assumption you made.
Your final message is sent back to "${task.from}" as the reply, so end with a short report: what you did, the results, and anything left undone.`;
}

function runClaude(dir, prompt, { command = 'claude', args = CLAUDE_ARGS, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  return new Promise((resolve) => {
    // npm installs claude as a .cmd shim, which needs a shell; only fixed args reach it, the prompt goes on stdin.
    const shell = process.platform === 'win32' && /\.(cmd|bat)$/i.test(command);
    const child = spawn(shell ? `"${command}"` : command, args, { cwd: dir, shell, windowsHide: true });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    child.stdout.setEncoding('utf8').on('data', (d) => { stdout += d; });
    child.stderr.setEncoding('utf8').on('data', (d) => { stderr += d; });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: `${stderr}${err.message}` });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) resolve({ code: -1, stdout, stderr: `${stderr}\ntimed out after ${timeoutMs / 1000}s` });
      else resolve({ code: code ?? -1, stdout, stderr });
    });
    child.stdin.on('error', () => {}); // the child may exit before reading its stdin; the exit code tells the story
    child.stdin.end(prompt);
  });
}

async function workOnce({ client, dir, graceSec, runner, log }) {
  const tasks = await client.take({ minAge: graceSec, limit: 1 });
  for (const task of tasks) {
    log(`${client.name} #${task.id} from ${task.from}: running`);
    const res = await runner(dir, buildPrompt(task, client.name, dir));
    const tail = (res.stderr.trim() || res.stdout.trim()).slice(-TAIL_CHARS);
    const body = res.code === 0
      ? `[worker ${client.name}] ${res.stdout.trim() || '(no output)'}`
      : `[worker ${client.name}] failed (exit ${res.code}): ${tail}`;
    try {
      await client.send(task.from, fitBytes(body, MAX_REPLY_BYTES), { replyTo: task.id, kind: 'note' });
    } catch (err) {
      log(`${client.name} #${task.id}: reply lost (${err.message}); result was:\n${body}`);
      throw err;
    }
    log(`${client.name} #${task.id}: replied (exit ${res.code})`);
  }
  return tasks.length;
}

async function runWorker({ dirs, graceSec, makeClient, recover, runner, log }) {
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) throw new Error(`worker dir does not exist: ${dir}`);
  }
  await Promise.all(dirs.map(async (dir) => {
    const name = nameForDir(dir);
    log(`worker ${name} -> ${dir} (takes tasks unread for ${graceSec}s)`);
    for (;;) {
      try {
        const did = await workOnce({ client: makeClient(name), dir, graceSec, runner, log });
        if (!did) await sleep(POLL_MS);
      } catch (err) {
        log(`${name}: ${err.message}`);
        await recover(err);
        await sleep(ERROR_BACKOFF_MS);
      }
    }
  }));
}

module.exports = { workOnce, runWorker, runClaude, buildPrompt, nameForDir, MAX_REPLY_BYTES };
