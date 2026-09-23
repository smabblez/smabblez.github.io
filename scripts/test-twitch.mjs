import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Execute the shipped integration with a controlled SDK, not a live-status claim.
const source = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const block = source.slice(source.indexOf('const twitchFrame ='), source.indexOf('const scheduleRoot ='));
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };
const fixture = ({ sdkPresent = true } = {}) => {
  const nodes = new Map();
  const timers = new Map();
  let observer;
  let player;
  let sdk;
  let nextTimer = 0;
  class Player {
    static READY = 'ready'; static ONLINE = 'online'; static PLAY = 'play'; static OFFLINE = 'offline';
    constructor(id, options) { this.id = id; this.options = options; this.listeners = new Map(); player = this; }
    addEventListener(event, callback) { this.listeners.set(event, callback); }
    emit(event) { this.listeners.get(event)?.(); }
  }
  class Observer {
    constructor(callback) { this.callback = callback; observer = this; }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  const window = {
    location: { hostname: 'preview.example' }, IntersectionObserver: Observer,
    setTimeout(callback) { timers.set(++nextTimer, callback); return nextTimer; },
    clearTimeout(id) { timers.delete(id); }
  };
  if (sdkPresent) window.Twitch = { Player };
  const document = {
    querySelector(selector) {
      if (!nodes.has(selector)) nodes.set(selector, { id: 'twitch-player', dataset: {}, attributes: {}, firstChild: {}, setAttribute(key, value) { this.attributes[key] = value; } });
      return nodes.get(selector);
    },
    createElement() { return { remove() { this.removed = true; } }; },
    head: { append(element) { sdk = element; } }
  };
  runInNewContext(block, { window, document, IntersectionObserver: Observer, siteConfig: { brand: { twitchChannel: 'smabblez' } } });
  return {
    get player() { return player; }, get sdk() { return sdk; }, get observer() { return observer; }, timers,
    state: () => nodes.get('[data-twitch-frame]').dataset.playerState,
    offlineHidden: () => nodes.get('[data-twitch-offline]').attributes['aria-hidden'],
    intersect: (visible = true) => observer.callback([{ isIntersecting: visible }]),
    expire: () => { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(callback => callback()); }
  };
};

const live = fixture();
assert.equal(live.state(), 'loading');
assert.equal(live.player, undefined, 'Player must remain deferred above the observer margin');
live.intersect(false);
assert.equal(live.player, undefined);
live.intersect();
assert.equal(live.player.options.autoplay, false);
assert.equal(live.player.options.muted, true);
assert.equal(live.player.options.channel, 'smabblez');
assert.equal(live.player.options.parent[0], 'preview.example');
assert.equal(live.observer.disconnected, true);
live.player.emit('ready');
assert.equal(live.state(), 'ready');
live.player.emit('online');
assert.equal(live.state(), 'online');
assert.equal(live.offlineHidden(), 'true');
assert.equal(live.timers.size, 0);
live.player.emit('ready');
assert.equal(live.state(), 'online', 'Late READY must not overwrite live status');
live.player.emit('offline');
assert.equal(live.state(), 'offline');
assert.equal(live.offlineHidden(), 'false');
live.player.emit('play');
assert.equal(live.state(), 'online');

const silentPlayer = fixture();
silentPlayer.intersect();
silentPlayer.player.emit('ready');
silentPlayer.expire();
assert.equal(silentPlayer.state(), 'fallback');
silentPlayer.player.emit('online');
assert.equal(silentPlayer.state(), 'online', 'A late valid online event should recover');

for (const failure of ['error', 'timeout', 'missing-constructor']) {
  const failed = fixture({ sdkPresent: false });
  assert.equal(failed.sdk, undefined);
  failed.intersect();
  assert.equal(failed.sdk.src, 'https://player.twitch.tv/js/embed/v1.js');
  if (failure === 'error') failed.sdk.onerror();
  else if (failure === 'timeout') failed.expire();
  else failed.sdk.onload();
  await settle();
  assert.equal(failed.state(), 'fallback', failure);
  assert.equal(failed.offlineHidden(), 'false');
  assert.equal(failed.timers.size, 0);
}
console.log('Twitch fixture tests passed: deferred SDK, player options, ready/live/offline/play, ordering, timeout, late recovery, and SDK failures.');
