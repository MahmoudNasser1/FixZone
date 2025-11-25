// Share modal script with defensive guards that quietly skip if elements are absent
(function() {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const RETRY_DELAYS = [500, 1000, 1600, 2400];
  let shareButton = null;
  let shareModal = null;
  let closeButton = null;
  let shareButtonListener = null;
  let closeListener = null;
  let modalListener = null;
  let initialized = false;
  let retryAttempts = 0;
  let scheduledId = null;

  const cleanup = () => {
    if (scheduledId) {
      clearTimeout(scheduledId);
      scheduledId = null;
    }

    if (shareButton && shareButtonListener && typeof shareButton.removeEventListener === 'function') {
      shareButton.removeEventListener('click', shareButtonListener);
    }
    if (closeButton && closeListener && typeof closeButton.removeEventListener === 'function') {
      closeButton.removeEventListener('click', closeListener);
    }
    if (shareModal && modalListener && typeof shareModal.removeEventListener === 'function') {
      shareModal.removeEventListener('click', modalListener);
    }

    shareButtonListener = null;
    closeListener = null;
    modalListener = null;
    shareButton = null;
    shareModal = null;
    closeButton = null;
    initialized = false;
    retryAttempts = 0;
  };

  const attachListeners = () => {
    shareButton = document.querySelector('#share-button');
    shareModal = document.querySelector('#share-modal');

    if (!shareButton || !shareModal) {
      return false;
    }
    if (!(shareButton instanceof Element) || !(shareModal instanceof Element)) {
      return false;
    }
    if (typeof shareButton.addEventListener !== 'function' || typeof shareModal.addEventListener !== 'function') {
      return false;
    }

    shareButtonListener = function(event) {
      try {
        event.preventDefault();
        event.stopPropagation();
        if (shareModal.style) {
          shareModal.style.display = 'block';
        }
      } catch (error) {
        console.debug('Share modal: Error opening modal', error);
      }
    };
    shareButton.addEventListener('click', shareButtonListener);

    closeButton = shareModal.querySelector('.close, [data-close-modal]');
    if (closeButton && typeof closeButton.addEventListener === 'function') {
      closeListener = function(event) {
        try {
          event.preventDefault();
          event.stopPropagation();
          if (shareModal.style) {
            shareModal.style.display = 'none';
          }
        } catch (error) {
          console.debug('Share modal: Error closing modal', error);
        }
      };
      closeButton.addEventListener('click', closeListener);
    }

    modalListener = function(event) {
      try {
        if (event.target === shareModal && shareModal.style) {
          shareModal.style.display = 'none';
        }
      } catch (error) {
        console.debug('Share modal: Error in backdrop handler', error);
      }
    };
    shareModal.addEventListener('click', modalListener);

    initialized = true;
    console.debug('Share modal: listeners attached safely');
    return true;
  };

  const scheduleNextAttempt = () => {
    if (initialized || retryAttempts >= RETRY_DELAYS.length) {
      scheduledId = null;
      return;
    }

    const delay = RETRY_DELAYS[retryAttempts];
    retryAttempts += 1;
    scheduledId = setTimeout(() => {
      scheduledId = null;
      if (!attachListeners()) {
        scheduleNextAttempt();
      }
    }, delay);
  };

  const startInit = () => {
    if (initialized) {
      return;
    }

    if (scheduledId) {
      return;
    }

    retryAttempts = 0;
    if (!attachListeners()) {
      scheduleNextAttempt();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startInit, { once: true });
  } else {
    startInit();
  }

  setTimeout(() => {
    if (!initialized) {
      startInit();
    }
  }, 2000);

  window.addEventListener('beforeunload', cleanup);
})();
