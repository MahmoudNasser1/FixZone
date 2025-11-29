// Share modal script with extreme defensive guards
(function () {
  'use strict';

  // Safety check for environment - exit early if not in browser
  if (typeof window === 'undefined' || typeof document === 'undefined' || !document) {
    return;
  }
  
  // Additional safety check - ensure document is actually an object
  try {
    if (!document || typeof document !== 'object' || !document.getElementById) {
      return;
    }
  } catch (e) {
    return; // Exit if document access fails
  }

  const RETRY_DELAYS = [500, 1000, 2000];
  let retryAttempts = 0;
  let scheduledId = null;
  let isInitialized = false;

  // Safe event listener attachment with null checks
  const safeAddListener = (element, event, handler) => {
    try {
      if (!element || typeof element !== 'object') {
        return false;
      }
      if (typeof element.addEventListener !== 'function') {
        return false;
      }
      element.addEventListener(event, handler);
      return true;
    } catch (e) {
      // Silently fail - don't log warnings in production
      return false;
    }
  };

  // Main initialization function
  const initShareModal = () => {
    // Prevent multiple initializations
    if (isInitialized) {
      return true;
    }

    try {
      // Extra safety checks
      if (typeof document === 'undefined' || !document.getElementById) {
        return false;
      }

      // Check if document.body is ready
      if (!document.body) {
        return false;
      }

      const shareButton = document.getElementById('share-button');
      const shareModal = document.getElementById('share-modal');

      // If elements don't exist, we can't do anything - silently fail
      if (!shareButton || !shareModal) {
        return false;
      }

      // Double check that elements are actually DOM elements
      if (!(shareButton instanceof Element) || !(shareModal instanceof Element)) {
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

      // Attach listeners - only if elements exist and are valid
      if (shareButton && shareButton instanceof Element) {
        safeAddListener(shareButton, 'click', openModal);
      }
      
      if (shareModal && shareModal instanceof Element) {
        safeAddListener(shareModal, 'click', backdropClick);
        
        // Close button inside modal
        try {
          const closeButtons = shareModal.querySelectorAll('.close, [data-close-modal]');
          if (closeButtons && closeButtons.length > 0) {
            Array.from(closeButtons).forEach(btn => {
              if (btn && btn instanceof Element) {
                safeAddListener(btn, 'click', closeModal);
              }
            });
          }
        } catch (queryError) {
          // Silently fail - don't log in production
          // Don't return false here, just continue
        }
      }

      isInitialized = true;
      return true;
    } catch (error) {
      // Silently fail - don't log errors in production
      return false;
    }
  };

  // Retry logic with max attempts
  const MAX_RETRIES = 3;
  const attemptInit = () => {
    // Check if elements exist before trying
    if (typeof document === 'undefined' || !document.body) {
      if (retryAttempts < MAX_RETRIES) {
        scheduledId = setTimeout(() => {
          retryAttempts++;
          attemptInit();
        }, RETRY_DELAYS[Math.min(retryAttempts, RETRY_DELAYS.length - 1)]);
      }
      return;
    }

    const shareButton = document.getElementById('share-button');
    const shareModal = document.getElementById('share-modal');
    
    // If elements don't exist, don't retry - they may not be on this page
    if (!shareButton || !shareModal) {
      return; // Silently exit - elements not on this page
    }

    if (initShareModal()) {
      return; // Success
    }

    if (retryAttempts < MAX_RETRIES) {
      scheduledId = setTimeout(() => {
        retryAttempts++;
        attemptInit();
      }, RETRY_DELAYS[Math.min(retryAttempts, RETRY_DELAYS.length - 1)]);
    }
  };

  // Start when DOM is ready - with extra safety checks
  if (typeof document !== 'undefined') {
    try {
      // Wait for DOM to be fully ready
      const initializeWhenReady = () => {
        // Double check document and document.body exist
        if (!document || !document.body) {
          // If body doesn't exist yet, wait a bit more (max 10 retries = 5 seconds)
          if (retryAttempts < 10) {
            setTimeout(initializeWhenReady, 50);
          }
          return;
        }
        
        // Check if elements exist before trying to initialize
        try {
          const shareButton = document.getElementById('share-button');
          const shareModal = document.getElementById('share-modal');
          
          // If elements don't exist, don't try to initialize
          if (!shareButton || !shareModal) {
            return; // Silently exit - elements may not be on this page
          }
          
          attemptInit();
        } catch (getElementError) {
          // Silently fail if getElementById fails
          return;
        }
      };

      // Check if document.addEventListener exists before using it
      if (document.addEventListener && typeof document.addEventListener === 'function') {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initializeWhenReady);
        } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
          // DOM is already ready, but wait a bit to ensure elements are rendered
          setTimeout(initializeWhenReady, 200);
        } else {
          // Fallback: wait a bit then try
          setTimeout(initializeWhenReady, 300);
        }
      } else {
        // Fallback if addEventListener is not available
        setTimeout(initializeWhenReady, 300);
      }
    } catch (e) {
      // Silently fail - don't log in production
    }
  }

  // Cleanup on unload (optional, but good practice)
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    try {
      window.addEventListener('beforeunload', () => {
        if (scheduledId) {
          clearTimeout(scheduledId);
        }
      });
    } catch (e) {
      // Ignore errors during cleanup
    }
  }

})();
