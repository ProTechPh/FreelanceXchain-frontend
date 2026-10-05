/**
 * High-performance, in-memory LRU (Least Recently Used) cache with TTL expiration.
 * Suitable for client-side and server-side Next.js usage.
 */

export interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

export interface LRUCacheOptions<K, V> {
  maxSize?: number;
  defaultTtlMs?: number;
  onEvict?: (key: K, value: V) => void;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

export class LRUCache<K = string, V = any> {
  private cache: Map<K, CacheEntry<V>>;
  private readonly maxSize: number;
  private readonly defaultTtlMs: number;
  private readonly onEvict?: (key: K, value: V) => void;
  private hits: number = 0;
  private misses: number = 0;

  constructor(options: LRUCacheOptions<K, V> = {}) {
    this.cache = new Map();
    this.maxSize = Math.max(1, options.maxSize ?? 100);
    this.defaultTtlMs = options.defaultTtlMs ?? 60_000;
    this.onEvict = options.onEvict;
  }

  /**
   * Retrieves a value by key. Refreshes recency to MRU position.
   * Returns undefined if key does not exist or has expired.
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.onEvict?.(key, entry.value);
      this.misses++;
      return undefined;
    }

    this.hits++;
    // Move to end (Most Recently Used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  /**
   * Checks if non-expired key exists without updating recency.
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.onEvict?.(key, entry.value);
      return false;
    }

    return true;
  }

  /**
   * Inspects value without updating recency.
   */
  peek(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.onEvict?.(key, entry.value);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Stores a value with optional custom TTL in milliseconds.
   * If at capacity, evicts the least recently used entry.
   */
  set(key: K, value: V, ttlMs?: number): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest (head of Map iterator)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        const oldEntry = this.cache.get(oldestKey);
        this.cache.delete(oldestKey);
        if (oldEntry) {
          this.onEvict?.(oldestKey, oldEntry.value);
        }
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  /**
   * Deletes a specific entry by key.
   */
  delete(key: K): boolean {
    const entry = this.cache.get(key);
    const deleted = this.cache.delete(key);
    if (deleted && entry) {
      this.onEvict?.(key, entry.value);
    }
    return deleted;
  }

  /**
   * Clears all cache entries.
   */
  clear(): void {
    if (this.onEvict) {
      for (const [key, entry] of this.cache) {
        this.onEvict(key, entry.value);
      }
    }
    this.cache.clear();
  }

  /**
   * Current number of stored items.
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Maximum capacity.
   */
  get capacity(): number {
    return this.maxSize;
  }

  /**
   * Observability metrics.
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }
}
