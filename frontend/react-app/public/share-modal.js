// Share Modal Script - Ultra Safe Version with Complete Error Handling
(function() {
  'use strict';
  
  // Check if we're in a browser environment
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }
  
  let initialized = false;
  let initAttempts = 0;
  const MAX_ATTEMPTS = 10;
  let shareButtonListener = null;
  let shareModalListener = null;
  let closeButtonListener = null;
  
  // Only initialize if elements exist
  function safeInit() {
    // Prevent multiple initializations
    if (initialized) {
      return;
    }
    
    // Prevent infinite retries
    initAttempts++;
    if (initAttempts > MAX_ATTEMPTS) {
      console.debug('Share modal: Max initialization attempts reached');
      return;
    }
    
    try {
      // Verify document and querySelector exist
      if (!document || typeof document.querySelector !== 'function') {
        if (initAttempts < MAX_ATTEMPTS) {
          setTimeout(safeInit, 500);
        }
        return;
      }
      
      const shareButton = document.querySelector('#share-button');
      const shareModal = document.querySelector('#share-modal');
      
      // If elements don't exist, just return silently
      if (!shareButton || !shareModal) {
        // Retry after a delay if elements not found yet
        if (initAttempts < MAX_ATTEMPTS) {
          setTimeout(safeInit, 500);
        }
        return;
      }
      
      // Verify elements are actual DOM elements
      if (!(shareButton instanceof Element) || !(shareModal instanceof Element)) {
        if (initAttempts < MAX_ATTEMPTS) {
          setTimeout(safeInit, 500);
        }
        return;
      }
      
      // Verify addEventListener exists on elements
      if (typeof shareButton.addEventListener !== 'function' || 
          typeof shareModal.addEventListener !== 'function') {
        console.debug('Share modal: addEventListener not available on elements');
        return;
      }
      
      try {
        // Add click listener to share button
        shareButtonListener = function(e) {
          try {
            e.preventDefault();
            e.stopPropagation();
            const modal = document.querySelector('#share-modal');
            if (modal && modal instanceof Element && modal.style) {
              modal.style.display = 'block';
            }
          } catch (err) {
            console.debug('Share modal: Error in share button handler:', err);
          }
        };
        shareButton.addEventListener('click', shareButtonListener);
        
        // Add click listener to close button if it exists
        const closeButton = shareModal.querySelector('.close, [data-close-modal]');
        if (closeButton && 
            closeButton instanceof Element && 
            typeof closeButton.addEventListener === 'function') {
          closeButtonListener = function(e) {
            try {
              e.preventDefault();
              e.stopPropagation();
              const modal = document.querySelector('#share-modal');
              if (modal && modal instanceof Element && modal.style) {
                modal.style.display = 'none';
              }
            } catch (err) {
              console.debug('Share modal: Error in close button handler:', err);
            }
          };
          closeButton.addEventListener('click', closeButtonListener);
        }
        
        // Add click listener to modal backdrop
        shareModalListener = function(e) {
          try {
            const modal = document.querySelector('#share-modal');
            if (e.target === modal && modal && modal instanceof Element && modal.style) {
              modal.style.display = 'none';
            }
          } catch (err) {
            console.debug('Share modal: Error in backdrop handler:', err);
          }
        };
        shareModal.addEventListener('click', shareModalListener);
        
        // Mark as initialized to prevent duplicate listeners
        initialized = true;
        console.debug('Share modal: Successfully initialized');
      } catch (err) {
        // Silent fail - elements might not be ready yet
        console.debug('Share modal: Initialization error:', err);
        if (initAttempts < MAX_ATTEMPTS) {
          setTimeout(safeInit, 500);
        }
        return;
      }
    } catch (error) {
      // Silent fail - elements don't exist, which is fine
      console.debug('Share modal: safeInit error:', error);
      if (initAttempts < MAX_ATTEMPTS) {
        setTimeout(safeInit, 500);
      }
      return;
    }
  }
  
  // Cleanup function to remove listeners
  function cleanup() {
    try {
      const shareButton = document.querySelector('#share-button');
      const shareModal = document.querySelector('#share-modal');
      const closeButton = shareModal?.querySelector('.close, [data-close-modal]');
      
      if (shareButton && shareButtonListener && typeof shareButton.removeEventListener === 'function') {
        shareButton.removeEventListener('click', shareButtonListener);
      }
      if (shareModal && shareModalListener && typeof shareModal.removeEventListener === 'function') {
        shareModal.removeEventListener('click', shareModalListener);
      }
      if (closeButton && closeButtonListener && typeof closeButton.removeEventListener === 'function') {
        closeButton.removeEventListener('click', closeButtonListener);
      }
    } catch (err) {
      console.debug('Share modal: Cleanup error:', err);
    }
  }
  
  // Wait for DOM to be ready before initializing
  // Use DOMContentLoaded to ensure DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // Wait a bit more for React to render
      setTimeout(safeInit, 500);
    });
  } else {
    // DOM is already ready, but wait a bit to ensure React has rendered
    setTimeout(safeInit, 500);
  }
  
  // Also try after a longer delay in case React is still loading
  setTimeout(safeInit, 2000);
  
  // Cleanup on page unload
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('beforeunload', cleanup);
  }
})();
