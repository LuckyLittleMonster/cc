#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { parseArgs } = require('node:util');
const { Client } = require('./client');
const { startServer, NAME_RE } = require('./server');

const CONFIG_FILE = path.join(os.homedir(), '.agentbus.json');
const DEFAULT_PORT = 7788;
const FOLLOW_WAIT_SEC = 50;

const USAGE = `agentbus - message bus for agents on several machines

  send <to> <text...> [--reply ID]   to = agent name or * (everyone); text "-" reads stdin
  inbox [--wait SEC] [--peek] [--limit N]
  follow                              print new mail forever (for Monitor / a terminal)
  agents                              who is on the bus, last seen, unread
  log [-n N]                          last N messages on the bus
  whoami
  init --url URL --token TOKEN [--name NAME]   write ~/.agentbus.json
  serve [--host 0.0.0.0] [--port ${DEFAULT_PORT}] [--data DIR]
  token                               print a fresh random token

Global: --as NAME overrides this agent's name.
Env: AGENTBUS_URL AGENTBUS_TOKEN AGENTBUS_NAME override ~/.agentbus.json.`;

function readConfig() {
  if (!fs.existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch (err) {
    throw new Error(`cannot parse ${CONFIG_FILE}: ${err.message}`);
  }
}

function defaultName() {
  const raw = `${os.hostname()}/${path.basename(process.cwd())}`.toLowerCase();
  return raw.replace(/[^a-z0-9._:/-]/g, '-').slice(0, 64);
}

function settings(flags) {
  const file = readConfig();
  return {
    url: process.env.AGENTBUS_URL || file.url || `http://127.0.0.1:${DEFAULT_PORT}`,
    token: process.env.AGENTBUS_TOKEN || file.token || '',
    name: flags.as || process.env.AGENTBUS_NAME || file.name || defaultName(),
  };
}

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

function readStdin() {
  return fs.readFileSync(0, 'utf8').trim();
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
  console.log(`agentbus serving on ${where.join(' , ')}  (data: ${dataDir})`);
  const stop = async () => {
    await srv.close();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

async function follow(client) {
  for (;;) {
    try {
      const messages = await client.inbox({ wait: FOLLOW_WAIT_SEC });
      if (messages.length) console.log(messages.map(formatMessage).join('\n'));
    } catch (err) {
      console.error(`agentbus: ${err.message}; retrying in 10s`);
      await new Promise((r) => setTimeout(r, 10_000));
    }
  }
}

async function main(argv) {
  const { values: flags, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      as: { type: 'string' },
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
  const [cmd, ...rest] = positionals;
  if (!cmd || flags.help) return console.log(USAGE);

  if (cmd === 'token') return console.log(crypto.randomBytes(24).toString('hex'));
  if (cmd === 'init') {
    if (!flags.url || !flags.token) throw new Error('init needs --url and --token');
    const conf = { url: flags.url, token: flags.token, ...(flags.name ? { name: flags.name } : {}) };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(conf, null, 2) + '\n', { mode: 0o600 });
    return console.log(`wrote ${CONFIG_FILE}`);
  }

  const cfg = settings(flags);
  if (!NAME_RE.test(cfg.name)) throw new Error(`invalid agent name "${cfg.name}"; pass --as NAME`);
  if (cmd === 'serve') return serve(flags, cfg);

  const client = new Client(cfg);
  switch (cmd) {
    case 'whoami':
      return console.log(`${cfg.name} @ ${cfg.url}`);
    case 'send': {
      const [to, ...words] = rest;
      const text = words.length === 1 && words[0] === '-' ? readStdin() : words.join(' ');
      if (!to || !text) throw new Error('usage: send <to> <text...>');
      const { id } = await client.send(to, text, { replyTo: flags.reply ? Number(flags.reply) : undefined });
      return console.log(`sent #${id} -> ${to}`);
    }
    case 'inbox':
      return printMessages(await client.inbox({
        wait: Number(flags.wait || 0),
        peek: Boolean(flags.peek),
        limit: flags.limit ? Number(flags.limit) : undefined,
      }));
    case 'follow':
      return follow(client);
    case 'agents': {
      const list = await client.agents();
      return console.log(list.length
        ? list.map((a) => `${a.name}  last ${stamp(a.last_seen)}  unread ${a.unread}`).join('\n')
        : '(no agents yet)');
    }
    case 'log':
      return printMessages(await client.log(Number(flags.n || 20)));
    default:
      throw new Error(`unknown command "${cmd}"\n\n${USAGE}`);
  }
}

main(process.argv.slice(2)).catch((err) => {
  console.error(`agentbus: ${err.message}`);
  process.exit(1);
});
