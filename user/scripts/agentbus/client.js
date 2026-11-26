'use strict';

class Client {
  constructor({ url, token, name }) {
    this.url = url.replace(/\/+$/, '');
    this.token = token;
    this.name = name;
  }

  async call(method, path, body) {
    let res;
    try {
      res = await fetch(this.url + path, {
        method,
        headers: {
          authorization: `Bearer ${this.token}`,
          ...(body ? { 'content-type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new Error(`cannot reach ${this.url}: ${err.cause?.code || err.message}`);
    }
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${res.status} ${payload.error || res.statusText}`);
    return payload;
  }

  async send(to, body, { replyTo } = {}) {
    return this.call('POST', '/v1/send', {
      from: this.name,
      to,
      body,
      ...(replyTo ? { reply_to: replyTo } : {}),
    });
  }

  async inbox({ wait = 0, peek = false, limit } = {}) {
    const q = new URLSearchParams({ name: this.name, wait: String(wait) });
    if (peek) q.set('peek', '1');
    if (limit) q.set('limit', String(limit));
    return (await this.call('GET', `/v1/inbox?${q}`)).messages;
  }

  async agents() {
    return (await this.call('GET', '/v1/agents')).agents;
  }

  async log(n = 20) {
    return (await this.call('GET', `/v1/log?n=${n}`)).messages;
  }
}

module.exports = { Client };
