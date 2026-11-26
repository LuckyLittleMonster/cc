'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const DEFAULT_PORT = 7788;

function configPath(flags) {
  return flags.config || process.env.AGENTBUS_CONFIG || path.join(os.homedir(), '.agentbus.json');
}

function readConfig(file) {
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`cannot parse ${file}: ${err.message}`);
  }
}

function writeConfig(file, patch) {
  const next = { ...readConfig(file), ...patch };
  fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n', { mode: 0o600 });
  return next;
}

function defaultName() {
  const raw = `${os.hostname()}/${path.basename(process.cwd())}`.toLowerCase();
  return raw.replace(/[^a-z0-9._:/-]/g, '-').slice(0, 64);
}

function settings(flags) {
  const file = readConfig(configPath(flags));
  return {
    url: process.env.AGENTBUS_URL || file.url || `http://127.0.0.1:${DEFAULT_PORT}`,
    token: flags.token || process.env.AGENTBUS_TOKEN || file.token || '',
    name: flags.as || process.env.AGENTBUS_NAME || file.name || defaultName(),
    // An env-pinned URL is the user's explicit choice; discovery must not overwrite it.
    urlPinned: Boolean(process.env.AGENTBUS_URL),
  };
}

module.exports = { DEFAULT_PORT, configPath, readConfig, writeConfig, settings };
