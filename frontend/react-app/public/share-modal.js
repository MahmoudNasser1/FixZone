// Share Modal Script - Silent Version with Safe Element Access
(function() {
  'use strict';
  
  // Only initialize if elements exist
  function safeInit() {
    try {
      const shareButton = document.querySelector('#share-button');
      const shareModal = document.querySelector('#share-modal');
      
      // If elements don't exist, just return silently
      if (!shareButton || !shareModal) {
        return;
      }
      
      // Only proceed if both elements exist
      if (shareButton && shareModal && typeof shareButton.addEventListener === 'function' && typeof shareModal.addEventListener === 'function') {
        try {
          // Add click listener to share button
          shareButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (shareModal) {
              shareModal.style.display = 'block';
            }
          });
          
          // Add click listener to close button if it exists
          const closeButton = shareModal.querySelector('.close');
          if (closeButton && typeof closeButton.addEventListener === 'function') {
            closeButton.addEventListener('click', function() {
              if (shareModal) {
                shareModal.style.display = 'none';
              }
            });
          }
          
          // Add click listener to modal backdrop
          shareModal.addEventListener('click', function(e) {
            if (e.target === shareModal && shareModal) {
              shareModal.style.display = 'none';
            }
          });
        } catch (err) {
          // Silent fail - elements might not be ready yet
          return;
        }
      }
    } catch (error) {
      // Silent fail - elements don't exist, which is fine
      return;
    }
  }
  
  // Wait for DOM to be ready before initializing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInit);
  } else {
    // DOM already loaded, check after a short delay
    setTimeout(safeInit, 200);
  }
})();
