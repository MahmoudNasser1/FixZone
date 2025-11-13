// Share Modal Script - Silent Version
(function() {
  'use strict';
  
  function initShareModal() {
    try {
      const shareButton = document.querySelector('#share-button');
      const shareModal = document.querySelector('#share-modal');
      
      if (!shareButton || !shareModal) {
        return;
      }
      
      try {
        shareButton.addEventListener('click', function(e) {
          e.preventDefault();
          shareModal.style.display = 'block';
        });
      } catch (err) {
        return;
      }
      
      const closeButton = shareModal.querySelector('.close');
      if (closeButton) {
        try {
          closeButton.addEventListener('click', function() {
            shareModal.style.display = 'none';
          });
        } catch (err) {
          // Silent fail
        }
      }
      
      try {
        shareModal.addEventListener('click', function(e) {
          if (e.target === shareModal) {
            shareModal.style.display = 'none';
          }
        });
      } catch (err) {
        // Silent fail
      }
    } catch (error) {
      // Silent fail
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShareModal);
  } else {
    setTimeout(initShareModal, 200);
  }
})();
