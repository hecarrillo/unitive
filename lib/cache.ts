type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

class Cache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly TTL: number = 5 * 60 * 1000; // 5 minutes in milliseconds

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if the cache entry has expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const appCache = new Cache();