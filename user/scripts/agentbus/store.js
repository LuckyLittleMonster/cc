'use strict';

const fs = require('node:fs');
const path = require('node:path');

const LOG_FILE = 'bus.jsonl';

// Message ids are 1..n with messages[i].id === i + 1, so a cursor doubles as an array index.
class Store {
  constructor(dataDir) {
    fs.mkdirSync(dataDir, { recursive: true });
    this.file = path.join(dataDir, LOG_FILE);
    this.messages = [];
    this.agents = new Map();
    this.replay();
  }

  replay() {
    if (!fs.existsSync(this.file)) return;
    const lines = fs.readFileSync(this.file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (!line.trim()) return;
      try {
        this.apply(JSON.parse(line));
      } catch (err) {
        // A crash mid-append leaves a truncated last line; anything else is worth seeing.
        process.stderr.write(`agentbus: skipped bad log line ${i + 1}: ${err.message}\n`);
      }
    });
  }

  apply(ev) {
    if (ev.t === 'msg') {
      const { t, ...msg } = ev;
      this.messages.push(msg);
    } else if (ev.t === 'agent') {
      const { t, ...agent } = ev;
      this.agents.set(agent.name, agent);
    }
  }

  record(ev) {
    fs.appendFileSync(this.file, JSON.stringify(ev) + '\n');
    this.apply(ev);
  }

  get lastId() {
    return this.messages.length;
  }

  touch(name) {
    const now = new Date().toISOString();
    const existing = this.agents.get(name);
    if (existing) {
      const updated = { ...existing, last_seen: now };
      this.agents.set(name, updated);
      return updated;
    }
    const created = { name, joined: this.lastId, cursor: 0, last_seen: now };
    this.record({ t: 'agent', ...created });
    return created;
  }

  addMessage({ from, to, body, reply_to }) {
    const msg = {
      id: this.lastId + 1,
      ts: new Date().toISOString(),
      from,
      to,
      body,
      ...(reply_to ? { reply_to } : {}),
    };
    this.record({ t: 'msg', ...msg });
    return msg;
  }

  // Direct mail is delivered whenever the recipient shows up; broadcasts only from join time on.
  static isFor(msg, agent) {
    if (msg.to === agent.name) return true;
    return msg.to === '*' && msg.from !== agent.name && msg.id > agent.joined;
  }

  pending(name, limit = Infinity) {
    const agent = this.agents.get(name);
    if (!agent) return { messages: [], cursor: 0 };
    const out = [];
    for (let i = agent.cursor; i < this.messages.length; i += 1) {
      const msg = this.messages[i];
      if (!Store.isFor(msg, agent)) continue;
      out.push(msg);
      if (out.length >= limit) return { messages: out, cursor: msg.id };
    }
    return { messages: out, cursor: this.lastId };
  }

  advance(name, cursor) {
    const agent = this.agents.get(name);
    if (!agent || agent.cursor === cursor) return;
    this.record({ t: 'agent', ...agent, cursor });
  }

  recent(n) {
    return this.messages.slice(-n);
  }
}

module.exports = { Store };
