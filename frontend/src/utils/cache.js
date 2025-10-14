// src/utils/cache.js

// Cache utilities for reducing redundant API calls
class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
  }

  // Generate cache key from parameters
  generateKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join(',');
    return `${prefix}${sortedParams ? `_${sortedParams}` : ''}`;
  }

  // Set cache entry with TTL
  set(key, data, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
  }

  // Get cache entry if not expired
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Check if key exists and is not expired
  has(key) {
    return this.get(key) !== null;
  }

  // Clear expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Clear all cache entries
  clear() {
    this.cache.clear();
  }

  // Clear entries by prefix
  clearByPrefix(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}

// Create a global cache instance
const cache = new SimpleCache();

// Cleanup expired entries every 5 minutes
setInterval(() => cache.cleanup(), 5 * 60 * 1000);

// Weather data caching (longer TTL since weather doesn't change frequently)
export const cacheWeatherData = (lat, lon, date, hour, data) => {
  const key = cache.generateKey('weather', { lat, lon, date, hour });
  cache.set(key, data, 15 * 60 * 1000); // 15 minutes for weather data
};

export const getCachedWeatherData = (lat, lon, date, hour) => {
  const key = cache.generateKey('weather', { lat, lon, date, hour });
  return cache.get(key);
};

// User preferences caching
export const cacheUserPreferences = (userId, preferences) => {
  const key = cache.generateKey('preferences', { userId });
  cache.set(key, preferences, 10 * 60 * 1000); // 10 minutes
};

export const getCachedUserPreferences = (userId) => {
  const key = cache.generateKey('preferences', { userId });
  return cache.get(key);
};

// User subscriptions caching
export const cacheUserSubscriptions = (userId, subscriptions) => {
  const key = cache.generateKey('subscriptions', { userId });
  cache.set(key, subscriptions, 5 * 60 * 1000); // 5 minutes
};

export const getCachedUserSubscriptions = (userId) => {
  const key = cache.generateKey('subscriptions', { userId });
  return cache.get(key);
};

// Clear user-specific cache on logout
export const clearUserCache = (userId) => {
  cache.clearByPrefix(`preferences_userId:${userId}`);
  cache.clearByPrefix(`subscriptions_userId:${userId}`);
};

// Geocoding cache (locations don't change)
export const cacheGeocodingData = (lat, lon, data) => {
  const key = cache.generateKey('geocoding', { lat, lon });
  cache.set(key, data, 24 * 60 * 60 * 1000); // 24 hours for geocoding
};

export const getCachedGeocodingData = (lat, lon) => {
  const key = cache.generateKey('geocoding', { lat, lon });
  return cache.get(key);
};

// Weather preferences and precautions caching
export const cacheWeatherAnalysis = (weatherDataHash, analysisType, data) => {
  const key = cache.generateKey('analysis', { hash: weatherDataHash, type: analysisType });
  cache.set(key, data, 30 * 60 * 1000); // 30 minutes for analysis
};

export const getCachedWeatherAnalysis = (weatherDataHash, analysisType) => {
  const key = cache.generateKey('analysis', { hash: weatherDataHash, type: analysisType });
  return cache.get(key);
};

// Utility to create hash for weather data (for analysis caching)
export const createWeatherDataHash = (weatherData) => {
  if (!weatherData) return null;
  const str = JSON.stringify({
    temperature: weatherData.temperature,
    humidity: weatherData.humidity,
    windSpeed: weatherData.wind_speed,
    precipitation: weatherData.precipitation,
    location: weatherData.location
  });
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

export default cache;
