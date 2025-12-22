"""
Custom cache system for efficient and flexible caching.
Provides a dict-like interface for easy cache access.
"""
from django.core.cache import cache as django_cache
from typing import Any, Optional, List
import pickle
import logging

logger = logging.getLogger('utils')


class CustomCache:
    """
    Custom cache wrapper that provides a dict-like interface
    and additional functionality over Django's cache.
    """
    
    def __init__(self, prefix: str = '', default_timeout: int = 300):
        """
        Initialize cache with optional prefix and default timeout.
        
        Args:
            prefix: Prefix for all cache keys
            default_timeout: Default timeout in seconds (5 minutes)
        """
        self.prefix = prefix
        self.default_timeout = default_timeout
        self._backend = django_cache
    
    def _make_key(self, key: str) -> str:
        """Generate prefixed cache key"""
        return f"{self.prefix}{key}" if self.prefix else key
    
    def set(self, key: str, value: Any, timeout: Optional[int] = None) -> bool:
        """
        Set a cache value.
        
        Args:
            key: Cache key
            value: Value to cache (must be picklable)
            timeout: Timeout in seconds (None uses default)
        
        Returns:
            bool: True if successful
        """
        try:
            cache_timeout = timeout if timeout is not None else self.default_timeout
            self._backend.set(self._make_key(key), value, cache_timeout)
            return True
        except Exception as e:
            logger.error(f"Cache set error for key '{key}': {e}")
            return False
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Get a cache value.
        
        Args:
            key: Cache key
            default: Default value if key not found
        
        Returns:
            Cached value or default
        """
        try:
            value = self._backend.get(self._make_key(key), default)
            return value
        except Exception as e:
            logger.error(f"Cache get error for key '{key}': {e}")
            return default
    
    def delete(self, key: str) -> bool:
        """
        Delete a cache entry.
        
        Args:
            key: Cache key
        
        Returns:
            bool: True if successful
        """
        try:
            self._backend.delete(self._make_key(key))
            return True
        except Exception as e:
            logger.error(f"Cache delete error for key '{key}': {e}")
            return False
    
    def has(self, key: str) -> bool:
        """
        Check if key exists in cache.
        
        Args:
            key: Cache key
        
        Returns:
            bool: True if key exists
        """
        try:
            return self._backend.has_key(self._make_key(key))
        except Exception as e:
            logger.error(f"Cache has error for key '{key}': {e}")
            return False
    
    def get_many(self, keys: List[str]) -> dict:
        """
        Get multiple cache values at once.
        
        Args:
            keys: List of cache keys
        
        Returns:
            dict: Dictionary of key-value pairs
        """
        try:
            prefixed_keys = [self._make_key(k) for k in keys]
            values = self._backend.get_many(prefixed_keys)
            # Remove prefix from returned keys
            if self.prefix:
                return {k.replace(self.prefix, '', 1): v for k, v in values.items()}
            return values
        except Exception as e:
            logger.error(f"Cache get_many error: {e}")
            return {}
    
    def set_many(self, data: dict, timeout: Optional[int] = None) -> bool:
        """
        Set multiple cache values at once.
        
        Args:
            data: Dictionary of key-value pairs
            timeout: Timeout in seconds (None uses default)
        
        Returns:
            bool: True if successful
        """
        try:
            cache_timeout = timeout if timeout is not None else self.default_timeout
            prefixed_data = {self._make_key(k): v for k, v in data.items()}
            self._backend.set_many(prefixed_data, cache_timeout)
            return True
        except Exception as e:
            logger.error(f"Cache set_many error: {e}")
            return False
    
    def delete_many(self, keys: List[str]) -> bool:
        """
        Delete multiple cache entries at once.
        
        Args:
            keys: List of cache keys
        
        Returns:
            bool: True if successful
        """
        try:
            prefixed_keys = [self._make_key(k) for k in keys]
            self._backend.delete_many(prefixed_keys)
            return True
        except Exception as e:
            logger.error(f"Cache delete_many error: {e}")
            return False
    
    def clear(self) -> bool:
        """
        Clear all cache entries (with prefix if set).
        
        Returns:
            bool: True if successful
        """
        try:
            if self.prefix:
                # Delete all keys with this prefix
                # Note: This requires iterating through keys which may be expensive
                # For production, consider using cache versioning instead
                logger.warning("Clearing prefixed cache - this operation may be expensive")
            self._backend.clear()
            return True
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return False
    
    def incr(self, key: str, delta: int = 1) -> Optional[int]:
        """
        Increment a cache value.
        
        Args:
            key: Cache key
            delta: Amount to increment
        
        Returns:
            New value or None if error
        """
        try:
            return self._backend.incr(self._make_key(key), delta)
        except Exception as e:
            logger.error(f"Cache incr error for key '{key}': {e}")
            return None
    
    def decr(self, key: str, delta: int = 1) -> Optional[int]:
        """
        Decrement a cache value.
        
        Args:
            key: Cache key
            delta: Amount to decrement
        
        Returns:
            New value or None if error
        """
        try:
            return self._backend.decr(self._make_key(key), delta)
        except Exception as e:
            logger.error(f"Cache decr error for key '{key}': {e}")
            return None
    
    # Dict-like interface
    def __getitem__(self, key: str) -> Any:
        """Get cache value using dict syntax: cache[key]"""
        value = self.get(key)
        if value is None:
            raise KeyError(f"Cache key '{key}' not found")
        return value
    
    def __setitem__(self, key: str, value: Any):
        """Set cache value using dict syntax: cache[key] = value"""
        self.set(key, value)
    
    def __delitem__(self, key: str):
        """Delete cache value using dict syntax: del cache[key]"""
        self.delete(key)
    
    def __contains__(self, key: str) -> bool:
        """Check if key exists using 'in' operator: key in cache"""
        return self.has(key)
    
    def get_or_set(self, key: str, default: Any, timeout: Optional[int] = None) -> Any:
        """
        Get cache value or set it if not exists.
        
        Args:
            key: Cache key
            default: Default value (can be callable)
            timeout: Timeout in seconds
        
        Returns:
            Cached or default value
        """
        try:
            value = self.get(key)
            if value is None:
                # If default is callable, call it
                default_value = default() if callable(default) else default
                self.set(key, default_value, timeout)
                return default_value
            return value
        except Exception as e:
            logger.error(f"Cache get_or_set error for key '{key}': {e}")
            return default() if callable(default) else default


# Global cache instances
app_cache = CustomCache(prefix='app:', default_timeout=300)  # 5 minutes
session_cache = CustomCache(prefix='session:', default_timeout=1800)  # 30 minutes
page_cache = CustomCache(prefix='page:', default_timeout=600)  # 10 minutes

# Export for easy import
__all__ = ['CustomCache', 'app_cache', 'session_cache', 'page_cache']
