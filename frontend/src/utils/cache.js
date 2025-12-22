// Generic cache utility for browser caching with TTL support

class BrowserCache {
  constructor(prefix = 'app_cache_') {
    this.prefix = prefix;
    this.storage = localStorage;
  }

  // Generate prefixed key
  _getKey(key) {
    return `${this.prefix}${key}`;
  }

  // Set cache with TTL (time to live in seconds)
  set(key, value, ttl = 3600) {
    try {
      const item = {
        value,
        expiry: Date.now() + (ttl * 1000),
        timestamp: Date.now()
      };
      this.storage.setItem(this._getKey(key), JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Get cached value
  get(key, defaultValue = null) {
    try {
      const itemStr = this.storage.getItem(this._getKey(key));
      if (!itemStr) {
        return defaultValue;
      }

      const item = JSON.parse(itemStr);
      
      // Check if expired
      if (Date.now() > item.expiry) {
        this.remove(key);
        return defaultValue;
      }

      return item.value;
    } catch (error) {
      console.error('Cache get error:', error);
      return defaultValue;
    }
  }

  // Remove specific cache entry
  remove(key) {
    try {
      this.storage.removeItem(this._getKey(key));
      return true;
    } catch (error) {
      console.error('Cache remove error:', error);
      return false;
    }
  }

  // Check if cache exists and is valid
  has(key) {
    const value = this.get(key);
    return value !== null;
  }

  // Clear all cache with this prefix
  clear() {
    try {
      const keys = Object.keys(this.storage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          this.storage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  // Get all cache keys
  keys() {
    try {
      const keys = Object.keys(this.storage);
      return keys
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.substring(this.prefix.length));
    } catch (error) {
      console.error('Cache keys error:', error);
      return [];
    }
  }

  // Get cache size (approximate, in characters)
  size() {
    try {
      let total = 0;
      const keys = Object.keys(this.storage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          total += this.storage.getItem(key)?.length || 0;
        }
      });
      return total;
    } catch (error) {
      console.error('Cache size error:', error);
      return 0;
    }
  }

  // Clean expired entries
  cleanExpired() {
    try {
      const keys = this.keys();
      let cleaned = 0;
      
      keys.forEach(key => {
        const itemStr = this.storage.getItem(this._getKey(key));
        if (itemStr) {
          try {
            const item = JSON.parse(itemStr);
            if (Date.now() > item.expiry) {
              this.remove(key);
              cleaned++;
            }
          } catch (e) {
            // Invalid item, remove it
            this.remove(key);
            cleaned++;
          }
        }
      });
      
      return cleaned;
    } catch (error) {
      console.error('Cache clean error:', error);
      return 0;
    }
  }

  // Get metadata about cache entry
  getMetadata(key) {
    try {
      const itemStr = this.storage.getItem(this._getKey(key));
      if (!itemStr) {
        return null;
      }

      const item = JSON.parse(itemStr);
      return {
        key,
        timestamp: item.timestamp,
        expiry: item.expiry,
        ttl: Math.max(0, Math.floor((item.expiry - Date.now()) / 1000)),
        expired: Date.now() > item.expiry
      };
    } catch (error) {
      console.error('Cache metadata error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const cache = new BrowserCache('app_cache_');

// Export class for creating custom cache instances
export { BrowserCache };

// Export convenience methods
export const getCache = (key, defaultValue = null) => cache.get(key, defaultValue);
export const setCache = (key, value, ttl = 3600) => cache.set(key, value, ttl);
export const removeCache = (key) => cache.remove(key);
export const clearCache = () => cache.clear();
export const hasCache = (key) => cache.has(key);

export default cache;
