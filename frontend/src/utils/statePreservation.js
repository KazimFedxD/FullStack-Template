// State preservation utility for maintaining state across page reloads and navigation

class StatePreservation {
  constructor(prefix = 'preserved_state_') {
    this.prefix = prefix;
    this.storage = sessionStorage; // Use sessionStorage for tab-specific state
  }

  // Generate prefixed key
  _getKey(key) {
    return `${this.prefix}${key}`;
  }

  // Save state
  save(key, state) {
    try {
      const item = {
        state,
        timestamp: Date.now(),
        url: window.location.pathname
      };
      this.storage.setItem(this._getKey(key), JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('State save error:', error);
      return false;
    }
  }

  // Load state
  load(key, defaultState = null) {
    try {
      const itemStr = this.storage.getItem(this._getKey(key));
      if (!itemStr) {
        return defaultState;
      }

      const item = JSON.parse(itemStr);
      return item.state;
    } catch (error) {
      console.error('State load error:', error);
      return defaultState;
    }
  }

  // Remove preserved state
  remove(key) {
    try {
      this.storage.removeItem(this._getKey(key));
      return true;
    } catch (error) {
      console.error('State remove error:', error);
      return false;
    }
  }

  // Check if state exists
  has(key) {
    return this.storage.getItem(this._getKey(key)) !== null;
  }

  // Clear all preserved states
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
      console.error('State clear error:', error);
      return false;
    }
  }

  // Get all state keys
  keys() {
    try {
      const keys = Object.keys(this.storage);
      return keys
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.substring(this.prefix.length));
    } catch (error) {
      console.error('State keys error:', error);
      return [];
    }
  }

  // Get metadata about preserved state
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
        url: item.url,
        age: Date.now() - item.timestamp
      };
    } catch (error) {
      console.error('State metadata error:', error);
      return null;
    }
  }

  // Save form state (useful for multi-step forms)
  saveFormState(formId, formData) {
    return this.save(`form_${formId}`, formData);
  }

  // Load form state
  loadFormState(formId) {
    return this.load(`form_${formId}`, {});
  }

  // Clear form state
  clearFormState(formId) {
    return this.remove(`form_${formId}`);
  }

  // Save scroll position
  saveScrollPosition(page = 'default') {
    const position = {
      x: window.scrollX,
      y: window.scrollY
    };
    return this.save(`scroll_${page}`, position);
  }

  // Load and restore scroll position
  loadScrollPosition(page = 'default') {
    const position = this.load(`scroll_${page}`, null);
    if (position) {
      window.scrollTo(position.x, position.y);
      return true;
    }
    return false;
  }

  // Save page state (generic)
  savePageState(pageId, state) {
    return this.save(`page_${pageId}`, state);
  }

  // Load page state
  loadPageState(pageId, defaultState = {}) {
    return this.load(`page_${pageId}`, defaultState);
  }

  // Clear page state
  clearPageState(pageId) {
    return this.remove(`page_${pageId}`);
  }
}

// Export singleton instance
export const statePreservation = new StatePreservation('preserved_state_');

// Export class for creating custom instances
export { StatePreservation };

// Export convenience methods
export const saveState = (key, state) => statePreservation.save(key, state);
export const loadState = (key, defaultState = null) => statePreservation.load(key, defaultState);
export const removeState = (key) => statePreservation.remove(key);
export const clearStates = () => statePreservation.clear();
export const hasState = (key) => statePreservation.has(key);

// Form-specific methods
export const saveFormState = (formId, formData) => statePreservation.saveFormState(formId, formData);
export const loadFormState = (formId) => statePreservation.loadFormState(formId);
export const clearFormState = (formId) => statePreservation.clearFormState(formId);

// Scroll-specific methods
export const saveScrollPosition = (page) => statePreservation.saveScrollPosition(page);
export const loadScrollPosition = (page) => statePreservation.loadScrollPosition(page);

// Page-specific methods
export const savePageState = (pageId, state) => statePreservation.savePageState(pageId, state);
export const loadPageState = (pageId, defaultState) => statePreservation.loadPageState(pageId, defaultState);
export const clearPageState = (pageId) => statePreservation.clearPageState(pageId);

export default statePreservation;
