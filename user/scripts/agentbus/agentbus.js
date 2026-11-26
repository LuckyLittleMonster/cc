#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { parseArgs } = require('node:util');
const { Client } = require('./client');
const { startServer, NAME_RE } = require('./server');
const { discover } = require('./discovery');
const { DEFAULT_PORT, configPath, writeConfig, settings } = require('./config');

const FOLLOW_WAIT_SEC = 50;
const RETRY_MS = 5000;

const USAGE = `agentbus - message bus for agents on several machines

  send <to> <text...> [--reply ID]   to = agent name or * (everyone); text "-" reads stdin
  inbox [--wait SEC] [--peek] [--limit N]
  follow                              print new mail forever (for Monitor / a terminal)
  agents                              who is on the bus, last seen, unread
  log [-n N]                          last N messages on the bus
  whoami
  discover [--token T] [--port ${DEFAULT_PORT}] [--wait SEC]   find the bus on the LAN, save it
  init --url URL --token TOKEN [--name NAME]   write the config by hand
  serve [--host 0.0.0.0] [--port ${DEFAULT_PORT}] [--data DIR]
  token                               print a fresh random token

Global: --as NAME (this agent's name), --config FILE (default ~/.agentbus.json), --log FILE (append output).
Env: AGENTBUS_URL AGENTBUS_TOKEN AGENTBUS_NAME AGENTBUS_CONFIG.
A client that cannot reach its saved URL re-discovers the bus once and retries.`;

const NOT_FOUND = (port) => `no bus answered on UDP ${port}. Check: the server is running (setup-server.ps1), `
  + `both machines are on the same subnet, the server firewall allows UDP ${port}, and the token matches.`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function stamp(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatMessage(m) {
  const re = m.reply_to ? ` (re #${m.reply_to})` : '';
  return `#${m.id} [${stamp(m.ts)}] ${m.from} -> ${m.to}${re}: ${m.body}`;
}

function printMessages(messages) {
  console.log(messages.length ? messages.map(formatMessage).join('\n') : '(empty)');
}

// Scheduled tasks have no console; append synchronously so the last error survives process.exit.
function redirectOutput(file) {
  const write = (chunk) => {
    fs.appendFileSync(file, chunk);
    return true;
  };
  process.stdout.write = write;
  process.stderr.write = write;
}

function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((a) => a && a.family === 'IPv4' && !a.internal)
    .map((a) => a.address);
}

async function serve(flags, cfg) {
  const host = flags.host || '0.0.0.0';
  const port = Number(flags.port || DEFAULT_PORT);
  const dataDir = flags.data || path.join(os.homedir(), '.agentbus-data');
  const srv = await startServer({ host, port, token: cfg.token, dataDir });
  const where = host === '0.0.0.0' ? lanAddresses().map((ip) => `http://${ip}:${srv.port}`) : [`http://${host}:${srv.port}`];
  const disc = srv.discoveryPort ? `discovery on UDP ${srv.discoveryPort}` : 'discovery off (no token)';
  console.log(`${new Date().toISOString()} agentbus serving on ${where.join(' , ')}; ${disc}; data ${dataDir}`);
  const stop = async () => {
    await srv.close();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

async function findBus(token, port, waitSec) {
  const deadline = Date.now() + waitSec * 1000;
  for (;;) {
    const url = await discover({ token, port });
    if (url || Date.now() >= deadline) return url;
    await sleep(RETRY_MS);
  }
}

async function discoverCommand(flags, cfg) {
  if (!cfg.token) throw new Error('discover needs the bus token: --token TOKEN (ask the user for it)');
  const port = Number(flags.port || DEFAULT_PORT);
  const url = await findBus(cfg.token, port, Number(flags.wait || 0));
  if (!url) throw new Error(NOT_FOUND(port));
  const file = configPath(flags);
  writeConfig(file, { url, token: cfg.token, ...(flags.name ? { name: flags.name } : {}) });
  console.log(`${new Date().toISOString()} found bus at ${url}; saved to ${file}`);
}

// The server's discovery port defaults to its HTTP port, so the saved URL tells us where to ask.
async function withRediscovery(flags, run) {
  const cfg = settings(flags);
  try {
    return await run(new Client(cfg));
  } catch (err) {
    if (!err.message.startsWith('cannot reach') || !cfg.token || cfg.urlPinned) throw err;
    const url = await discover({ token: cfg.token, port: Number(new URL(cfg.url).port) || DEFAULT_PORT });
    if (!url || url === cfg.url) throw err;
    writeConfig(configPath(flags), { url });
    return run(new Client({ ...cfg, url }));
  }
}

async function follow(flags) {
  for (;;) {
    try {
      const messages = await withRediscovery(flags, (c) => c.inbox({ wait: FOLLOW_WAIT_SEC }));
      if (messages.length) console.log(messages.map(formatMessage).join('\n'));
    } catch (err) {
      console.error(`agentbus: ${err.message}; retrying in 10s`);
      await sleep(2 * RETRY_MS);
    }
  }
}

async function clientCommand(cmd, rest, flags) {
  switch (cmd) {
    case 'send': {
      const [to, ...words] = rest;
      const text = words.length === 1 && words[0] === '-' ? fs.readFileSync(0, 'utf8').trim() : words.join(' ');
      if (!to || !text) throw new Error('usage: send <to> <text...>');
      const replyTo = flags.reply ? Number(flags.reply) : undefined;
      const { id } = await withRediscovery(flags, (c) => c.send(to, text, { replyTo }));
      return console.log(`sent #${id} -> ${to}`);
    }
    case 'inbox': {
      const opts = { wait: Number(flags.wait || 0), peek: Boolean(flags.peek), limit: flags.limit ? Number(flags.limit) : undefined };
      return printMessages(await withRediscovery(flags, (c) => c.inbox(opts)));
    }
    case 'follow':
      return follow(flags);
    case 'agents': {
      const list = await withRediscovery(flags, (c) => c.agents());
      return console.log(list.length
        ? list.map((a) => `${a.name}  last ${stamp(a.last_seen)}  unread ${a.unread}`).join('\n')
        : '(no agents yet)');
    }
    case 'log':
      return printMessages(await withRediscovery(flags, (c) => c.log(Number(flags.n || 20))));
    default:
      throw new Error(`unknown command "${cmd}"\n\n${USAGE}`);
  }
}

async function main(argv) {
  const { values: flags, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      as: { type: 'string' },
      config: { type: 'string' },
      log: { type: 'string' },
      reply: { type: 'string' },
      wait: { type: 'string' },
      peek: { type: 'boolean' },
      limit: { type: 'string' },
      n: { type: 'string', short: 'n' },
      url: { type: 'string' },
      token: { type: 'string' },
      name: { type: 'string' },
      host: { type: 'string' },
      port: { type: 'string' },
      data: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (flags.log) redirectOutput(flags.log);
  const [cmd, ...rest] = positionals;
  if (!cmd || flags.help) return console.log(USAGE);

  if (cmd === 'token') return console.log(crypto.randomBytes(24).toString('hex'));
  if (cmd === 'init') {
    if (!flags.url || !flags.token) throw new Error('init needs --url and --token');
    const file = configPath(flags);
    writeConfig(file, { url: flags.url, token: flags.token, ...(flags.name ? { name: flags.name } : {}) });
    return console.log(`wrote ${file}`);
  }

  const cfg = settings(flags);
  if (!NAME_RE.test(cfg.name)) throw new Error(`invalid agent name "${cfg.name}"; pass --as NAME`);
  if (cmd === 'serve') return serve(flags, cfg);
  if (cmd === 'discover') return discoverCommand(flags, cfg);
  if (cmd === 'whoami') return console.log(`${cfg.name} @ ${cfg.url}`);
  return clientCommand(cmd, rest, flags);
}

main(process.argv.slice(2)).catch((err) => {
  console.error(`${new Date().toISOString()} agentbus: ${err.message}`);
  process.exit(1);
});
