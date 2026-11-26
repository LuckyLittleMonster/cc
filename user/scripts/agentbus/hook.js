'use strict';

const fs = require('node:fs');

const isOurs = (h) => typeof h.command === 'string' && h.command.includes('agentbus') && h.command.includes('session-hint');

// Edits settings.json as JSON in node: PowerShell's ConvertTo-Json truncates nested settings past depth 2.
function installHook({ file, command, remove = false }) {
  let settings = {};
  if (fs.existsSync(file)) {
    const raw = fs.readFileSync(file, 'utf8');
    try {
      settings = JSON.parse(raw);
    } catch (err) {
      throw new Error(`cannot parse ${file}: ${err.message}`);
    }
    fs.writeFileSync(`${file}.bak-agentbus`, raw);
  }

  const kept = (settings.hooks?.SessionStart || [])
    .map((group) => ({ ...group, hooks: (group.hooks || []).filter((h) => !isOurs(h)) }))
    .filter((group) => group.hooks.length > 0);
  const sessionStart = remove ? kept : [...kept, { hooks: [{ type: 'command', command }] }];

  const { SessionStart, ...otherEvents } = settings.hooks || {};
  const hooks = sessionStart.length ? { ...otherEvents, SessionStart: sessionStart } : otherEvents;
  const { hooks: _old, ...rest } = settings;
  const next = Object.keys(hooks).length ? { ...rest, hooks } : rest;

  fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n');
  return next;
}

module.exports = { installHook };
