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
      const shareButton = document.getElementById('share-button');
      const shareModal = document.getElementById('share-modal');

      // If elements don't exist, we can't do anything
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

      // Attach listeners
      safeAddListener(shareButton, 'click', openModal);
      safeAddListener(shareModal, 'click', backdropClick);

      // Close button inside modal
      const closeButtons = shareModal.querySelectorAll('.close, [data-close-modal]');
      if (closeButtons) {
        Array.from(closeButtons).forEach(btn => {
          safeAddListener(btn, 'click', closeModal);
        });
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

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attemptInit);
  } else {
    attemptInit();
  }

  // Cleanup on unload (optional, but good practice)
  window.addEventListener('beforeunload', () => {
    if (scheduledId) clearTimeout(scheduledId);
  });

})();
