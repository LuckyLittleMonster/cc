'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { installHook } = require('../hook');

const CMD = 'node "C:/x/agentbus.js" session-hint';

function tempSettings(content) {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'agentbus-hook-')), 'settings.json');
  if (content !== undefined) fs.writeFileSync(file, JSON.stringify(content, null, 2));
  return file;
}

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

test('adds a SessionStart hook and keeps every other setting and hook', () => {
  const other = { matcher: 'startup', hooks: [{ type: 'command', command: 'echo other' }] };
  const file = tempSettings({ model: 'opus', env: { A: '1' }, hooks: { SessionStart: [other], Stop: [{ hooks: [] }] } });
  installHook({ file, command: CMD });
  const s = read(file);
  assert.equal(s.model, 'opus');
  assert.deepEqual(s.env, { A: '1' });
  assert.deepEqual(s.hooks.Stop, [{ hooks: [] }]);
  assert.deepEqual(s.hooks.SessionStart[0], other);
  assert.equal(s.hooks.SessionStart[1].hooks[0].command, CMD);
  assert.ok(fs.existsSync(`${file}.bak-agentbus`));
});

test('installing twice leaves one hook, with the newest command', () => {
  const file = tempSettings({});
  installHook({ file, command: 'node "C:/old/agentbus.js" session-hint' });
  installHook({ file, command: CMD });
  const cmds = read(file).hooks.SessionStart.flatMap((g) => g.hooks.map((h) => h.command));
  assert.deepEqual(cmds, [CMD]);
});

test('remove deletes only our hook and drops empty containers', () => {
  const file = tempSettings({ model: 'opus' });
  installHook({ file, command: CMD });
  installHook({ file, command: CMD, remove: true });
  assert.deepEqual(read(file), { model: 'opus' });
});

test('works when settings.json does not exist yet', () => {
  const file = tempSettings();
  installHook({ file, command: CMD });
  assert.equal(read(file).hooks.SessionStart[0].hooks[0].command, CMD);
});

test('refuses to touch a settings file it cannot parse', () => {
  const file = tempSettings();
  fs.writeFileSync(file, '{ not json');
  assert.throws(() => installHook({ file, command: CMD }), /cannot parse/);
  assert.equal(fs.readFileSync(file, 'utf8'), '{ not json');
});
