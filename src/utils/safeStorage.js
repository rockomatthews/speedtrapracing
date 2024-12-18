// src/utils/safeStorage.js
const safeStorage = {
    clearOldItems: () => {
      try {
        // Clear old cart items first
        localStorage.removeItem('shopping-cart');
        // Clear any expired sessions
        const session = localStorage.getItem('userSession');
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
            localStorage.removeItem('userSession');
          }
        }
      } catch (error) {
        console.warn('Error clearing storage:', error);
      }
    },
  
    setItem: (key, value) => {
      try {
        // First try to clear space
        safeStorage.clearOldItems();
        
        // Trim the data to essential fields
        const trimmedValue = {
          ...value,
          // Only keep essential user data
          email: value.email,
          uid: value.uid,
          displayName: value.displayName || '',
          isAdmin: value.isAdmin || false,
          expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString() // 24 hours
        };
  
        // Try to set the item
        localStorage.setItem(key, JSON.stringify(trimmedValue));
        return true;
      } catch (error) {
        console.warn('Storage error:', error);
        // If still failing, clear everything and try again
        try {
          localStorage.clear();
          localStorage.setItem(key, JSON.stringify(trimmedValue));
          return true;
        } catch (retryError) {
          console.error('Storage completely failed:', retryError);
          return false;
        }
      }
    },
  
    getItem: (key, defaultValue = null) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.error('Error reading from storage:', error);
        return defaultValue;
      }
    },
  
    removeItem: (key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing item:', error);
      }
    }
  };
  
  export default safeStorage;