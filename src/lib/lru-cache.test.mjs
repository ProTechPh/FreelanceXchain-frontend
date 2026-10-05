import assert from 'node:assert/strict';
import test from 'node:test';

import { LRUCache } from './lru-cache.ts';

test('LRUCache stores and retrieves items', () => {
  const cache = new LRUCache({ maxSize: 3 });
  cache.set('a', 1);
  cache.set('b', 2);

  assert.equal(cache.get('a'), 1);
  assert.equal(cache.get('b'), 2);
  assert.equal(cache.get('c'), undefined);
  assert.equal(cache.size, 2);
});

test('LRUCache evicts least recently used item when capacity is exceeded', () => {
  const evicted = [];
  const cache = new LRUCache({
    maxSize: 3,
    onEvict: (k, v) => evicted.push({ k, v }),
  });

  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);

  // Access 'a' to promote it to MRU: order becomes b, c, a
  assert.equal(cache.get('a'), 1);

  // Add 'd': 'b' is now the oldest (LRU), so 'b' should be evicted
  cache.set('d', 4);

  assert.equal(cache.get('b'), undefined);
  assert.equal(cache.get('a'), 1);
  assert.equal(cache.get('c'), 3);
  assert.equal(cache.get('d'), 4);
  assert.equal(cache.size, 3);
  assert.deepEqual(evicted, [{ k: 'b', v: 2 }]);
});

test('LRUCache handles item updates correctly', () => {
  const cache = new LRUCache({ maxSize: 2 });
  cache.set('key', 'val1');
  cache.set('key', 'val2');

  assert.equal(cache.get('key'), 'val2');
  assert.equal(cache.size, 1);
});

test('LRUCache supports peek and has without altering recency', () => {
  const cache = new LRUCache({ maxSize: 2 });
  cache.set('a', 1);
  cache.set('b', 2);

  // peek does not promote 'a'
  assert.equal(cache.peek('a'), 1);
  assert.equal(cache.has('a'), true);
  assert.equal(cache.has('nonexistent'), false);

  // Adding 'c' should evict 'a' because 'a' was not promoted
  cache.set('c', 3);

  assert.equal(cache.get('a'), undefined);
  assert.equal(cache.get('b'), 2);
  assert.equal(cache.get('c'), 3);
});

test('LRUCache respects TTL expiration', async () => {
  const cache = new LRUCache({ maxSize: 5, defaultTtlMs: 25 });
  cache.set('temp', 'expires_soon');

  assert.equal(cache.get('temp'), 'expires_soon');

  await new Promise((resolve) => setTimeout(resolve, 35));

  assert.equal(cache.get('temp'), undefined);
  assert.equal(cache.has('temp'), false);
  assert.equal(cache.peek('temp'), undefined);
});

test('LRUCache tracks hit and miss telemetry', () => {
  const cache = new LRUCache({ maxSize: 5 });
  cache.set('k', 42);

  cache.get('k'); // hit
  cache.get('k'); // hit
  cache.get('missing'); // miss

  const stats = cache.getStats();
  assert.equal(stats.hits, 2);
  assert.equal(stats.misses, 1);
  assert.equal(stats.size, 1);
  assert.equal(stats.maxSize, 5);
  assert.ok(Math.abs(stats.hitRate - 2 / 3) < 0.001);

  cache.resetStats();
  const reset = cache.getStats();
  assert.equal(reset.hits, 0);
  assert.equal(reset.misses, 0);
  assert.equal(reset.hitRate, 0);
});

test('LRUCache delete and clear operations', () => {
  const cache = new LRUCache({ maxSize: 5 });
  cache.set('a', 1);
  cache.set('b', 2);

  assert.equal(cache.delete('a'), true);
  assert.equal(cache.delete('nonexistent'), false);
  assert.equal(cache.get('a'), undefined);
  assert.equal(cache.size, 1);

  cache.clear();
  assert.equal(cache.size, 0);
  assert.equal(cache.get('b'), undefined);
});
