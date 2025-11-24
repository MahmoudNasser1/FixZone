// Share Modal Script - Silent Version with Safe Element Access
(function() {
  'use strict';
  
  // Check if we're in a browser environment
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }
  
  let initialized = false;
  let initAttempts = 0;
  const MAX_ATTEMPTS = 10;
  
  // Only initialize if elements exist
  function safeInit() {
    // Prevent multiple initializations
    if (initialized) {
      return;
    }
    
    // Prevent infinite retries
    initAttempts++;
    if (initAttempts > MAX_ATTEMPTS) {
      return;
    }
    
    try {
      // Verify document and querySelector exist
      if (!document || typeof document.querySelector !== 'function') {
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
        return;
      }
      
      // Only proceed if both elements exist and have addEventListener
      if (shareButton && shareModal && 
          typeof shareButton.addEventListener === 'function' && 
          typeof shareModal.addEventListener === 'function') {
        try {
          // Add click listener to share button
          shareButton.addEventListener('click', function(e) {
            e.preventDefault();
            const modal = document.querySelector('#share-modal');
            if (modal && modal instanceof Element) {
              modal.style.display = 'block';
            }
          });
          
          // Add click listener to close button if it exists
          const closeButton = shareModal.querySelector('.close');
          if (closeButton && 
              closeButton instanceof Element && 
              typeof closeButton.addEventListener === 'function') {
            closeButton.addEventListener('click', function() {
              const modal = document.querySelector('#share-modal');
              if (modal && modal instanceof Element) {
                modal.style.display = 'none';
              }
            });
          }
          
          // Add click listener to modal backdrop
          shareModal.addEventListener('click', function(e) {
            const modal = document.querySelector('#share-modal');
            if (e.target === modal && modal && modal instanceof Element) {
              modal.style.display = 'none';
            }
          });
          
          // Mark as initialized to prevent duplicate listeners
          initialized = true;
        } catch (err) {
          // Silent fail - elements might not be ready yet
          console.debug('Share modal initialization error:', err);
          return;
        }
      }
    } catch (error) {
      // Silent fail - elements don't exist, which is fine
      console.debug('Share modal safeInit error:', error);
      return;
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
})();
