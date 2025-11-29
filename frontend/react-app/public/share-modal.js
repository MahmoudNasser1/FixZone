// Share modal script with extreme defensive guards
(function () {
  'use strict';

  // Safety check for environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const RETRY_DELAYS = [500, 1000, 2000];
  let retryAttempts = 0;
  let scheduledId = null;

  // Safe event listener attachment
  const safeAddListener = (element, event, handler) => {
    if (element && typeof element.addEventListener === 'function') {
      try {
        element.addEventListener(event, handler);
        return true;
      } catch (e) {
        console.warn('ShareModal: Failed to add listener', e);
      }
    }
    return false;
  };

  // Main initialization function
  const initShareModal = () => {
    try {
      // Extra safety check
      if (typeof document === 'undefined' || !document.getElementById) {
        return false;
      }

      const shareButton = document.getElementById('share-button');
      const shareModal = document.getElementById('share-modal');

      // If elements don't exist, we can't do anything - silently fail
      if (!shareButton || !shareModal) {
        return false;
      }

      // Define handlers
      const openModal = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (shareModal) shareModal.style.display = 'block';
      };

      const closeModal = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (shareModal) shareModal.style.display = 'none';
      };

      const backdropClick = (e) => {
        if (e && e.target === shareModal) {
          closeModal(e);
        }
      };

      // Attach listeners - only if elements exist
      if (shareButton) {
        safeAddListener(shareButton, 'click', openModal);
      }
      
      if (shareModal) {
        safeAddListener(shareModal, 'click', backdropClick);
        
        // Close button inside modal
        try {
          const closeButtons = shareModal.querySelectorAll('.close, [data-close-modal]');
          if (closeButtons && closeButtons.length > 0) {
            Array.from(closeButtons).forEach(btn => {
              if (btn) {
                safeAddListener(btn, 'click', closeModal);
              }
            });
          }
        } catch (queryError) {
          console.warn('ShareModal: Error querying close buttons', queryError);
        }
      }

      return true;
    } catch (error) {
      console.warn('ShareModal: Error during init', error);
      return false;
    }
  };

  // Retry logic
  const attemptInit = () => {
    if (initShareModal()) {
      return; // Success
    }

    if (retryAttempts < RETRY_DELAYS.length) {
      scheduledId = setTimeout(() => {
        retryAttempts++;
        attemptInit();
      }, RETRY_DELAYS[retryAttempts]);
    }
  };

  // Start when DOM is ready - with extra safety checks
  if (typeof document !== 'undefined') {
    try {
      if (document.readyState === 'loading') {
        if (typeof document.addEventListener === 'function') {
          document.addEventListener('DOMContentLoaded', attemptInit);
        }
      } else {
        // DOM is already ready, but wait a bit to ensure elements are rendered
        setTimeout(attemptInit, 100);
      }
    } catch (e) {
      console.warn('ShareModal: Error setting up initialization', e);
    }
  }

  // Cleanup on unload (optional, but good practice)
  if (typeof window !== 'undefined' && window.addEventListener) {
    try {
      window.addEventListener('beforeunload', () => {
        if (scheduledId) clearTimeout(scheduledId);
      });
    } catch (e) {
      // Ignore errors during cleanup
    }
  }

})();
