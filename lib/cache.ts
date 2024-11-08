// lib/cache.ts
type CacheEntry<T> = {
    data: T;
    timestamp: number;
  };
  
class Cache {
    private cache: Map<string, CacheEntry<unknown>> = new Map();
    private readonly TTL: number = 5 * 60 * 1000; // 5 minutes in milliseconds

    set<T>(key: string, data: T, ttl?: number): void {
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

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    // Delete all keys that match a pattern
    deletePattern(pattern: string): void {
        const regex = new RegExp(pattern);
        for (const key of this.cache.keys()) {
        if (regex.test(key)) {
            this.cache.delete(key);
        }
        }
    }

    // Get all keys that match a pattern
    getKeys(pattern?: string): string[] {
        if (!pattern) {
        return Array.from(this.cache.keys());
        }
        const regex = new RegExp(pattern);
        return Array.from(this.cache.keys()).filter(key => regex.test(key));
    }

    // Check if a key exists and is not expired
    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) {
        return false;
        }
        if (Date.now() - entry.timestamp > this.TTL) {
        this.cache.delete(key);
        return false;
        }
        return true;
    }
}

export const appCache = new Cache();