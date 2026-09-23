import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Exercise the shipped renderer and loader without remote Twitch requests.
const source = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const block = source.slice(source.indexOf('const scheduleRoot ='), source.indexOf('if (scheduleRoot) {'));
const element = () => ({
  dataset: {}, children: [], textContent: '',
  append(...items) { this.children.push(...items); },
  replaceChildren(...items) { this.children = items; },
  setAttribute() {}
});
const nodes = Object.fromEntries(['data-twitch-schedule', 'data-schedule-list', 'data-schedule-status'].map(key => [`[${key}]`, element()]));
const now = Date.parse('2026-09-23T18:00:00Z');
class Clock extends Date {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return now; }
}
let response;
const context = {
  Date: Clock, Intl, siteConfig: {},
  document: { querySelector: key => nodes[key], createElement: element, createDocumentFragment: element },
  fetch: async () => response
};
const { renderSchedule, loadSchedule } = runInNewContext(`${block}\n({ renderSchedule, loadSchedule });`, context);
const payload = {
  fetchedAt: new Date(now - 3600000).toISOString(), timezone: 'America/Chicago',
  events: [{ day: 'WE', start: '12:00', end: '22:00', title: 'Official show', recurring: true }]
};
renderSchedule(payload);
assert.equal(nodes['[data-twitch-schedule]'].dataset.scheduleState, 'ready');
assert.equal(nodes['[data-schedule-list]'].children[0].children.length, 1);
assert.match(nodes['[data-schedule-status]'].textContent, /Last checked on Twitch/);
for (const fetchedAt of [undefined, 'invalid', new Date(now - 86400001).toISOString(), new Date(now + 300001).toISOString()]) {
  assert.throws(() => renderSchedule({ ...payload, fetchedAt }), /no longer current/);
}
renderSchedule({ ...payload, fetchedAt: new Date(now - 86400000).toISOString() });
nodes['[data-twitch-schedule]'].dataset.scheduleState = '';
response = { ok: true, json: async () => ({ ...payload, fetchedAt: '2026-07-26T03:06:33.780Z' }) };
await loadSchedule();
assert.equal(nodes['[data-twitch-schedule]'].dataset.scheduleState, 'fallback');
assert.equal(nodes['[data-schedule-list]'].children.length, 1);
assert.equal(nodes['[data-schedule-list]'].children[0].className, 'schedule-fallback');
assert.match(nodes['[data-schedule-list]'].children[0].textContent, /Current stream times are on Twitch/);
response = { ok: false, status: 503 };
await loadSchedule();
assert.equal(nodes['[data-twitch-schedule]'].dataset.scheduleState, 'fallback');
console.log('Schedule tests passed: fresh, expired, invalid, future, boundary, replacement, and request failure.');
