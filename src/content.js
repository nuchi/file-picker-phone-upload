(function() {
  // Store original methods
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
  const fileInputListeners = new WeakMap();

  // Override addEventListener for file inputs
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (this instanceof HTMLInputElement && this.type === 'file' && type === 'change') {
      if (!fileInputListeners.has(this)) {
        fileInputListeners.set(this, new Set());
      }
      fileInputListeners.get(this).add({ listener, options });
    } else {
      originalAddEventListener.call(this, type, listener, options);
    }
  };

  // Override removeEventListener for file inputs
  EventTarget.prototype.removeEventListener = function(type, listener, options) {
    if (this instanceof HTMLInputElement && this.type === 'file' && type === 'change') {
      const listeners = fileInputListeners.get(this);
      if (listeners) {
        listeners.forEach((storedListener) => {
          if (storedListener.listener === listener) {
            listeners.delete(storedListener);
          }
        });
      }
    } else {
      originalRemoveEventListener.call(this, type, listener, options);
    }
  };

  // Override the 'change' event for file inputs
  const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'onchange');
  Object.defineProperty(HTMLInputElement.prototype, 'onchange', {
    set(value) {
      if (this.type === 'file') {
        if (!fileInputListeners.has(this)) {
          fileInputListeners.set(this, new Set());
        }
        fileInputListeners.get(this).add({ listener: value });
      } else {
        originalDescriptor.set.call(this, value);
      }
    },
    get() {
      if (this.type === 'file') {
        const listeners = fileInputListeners.get(this);
        return listeners ? Array.from(listeners)[0]?.listener : null;
      }
      return originalDescriptor.get.call(this);
    }
  });

  // Intercept file selection
  document.addEventListener('change', async function(event) {
    if (event.target.type === 'file') {
      const files = event.target.files;
      if (files.length > 0 && files[0].name === "Phone Upload") {
        event.preventDefault();
        event.stopPropagation();

        try {
          const snapdropFile = await openSnapdropModal();

          if (snapdropFile) {
            // Create a new FileList containing the Snapdrop file
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(snapdropFile);
            event.target.files = dataTransfer.files;

            // Dispatch a new 'change' event with the modified file
            const newEvent = new Event('change', { bubbles: true, cancelable: true });
            event.target.dispatchEvent(newEvent);
          }
        } catch (error) {
          // Modal was closed without selecting a file, do nothing
        }
      } else {
        // Trigger original listeners for non-special files
        const listeners = fileInputListeners.get(event.target);
        if (listeners) {
          listeners.forEach(({ listener, options }) => {
            if (typeof listener === 'function') {
              listener.call(event.target, event);
            } else if (listener && typeof listener.handleEvent === 'function') {
              listener.handleEvent.call(event.target, event);
            }
          });
        }
      }
    }
  }, true);

  function openSnapdropModal() {
    return new Promise((resolve, reject) => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: Arial, sans-serif;
      `;

      modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 10px; width: 80%; height: 80%; display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h1 style="margin: 0;">Snapdrop File Transfer</h1>
            <button id="closeModal" style="background: none; border: none; font-size: 20px; cursor: pointer;">✖</button>
          </div>
          <p>Please use Snapdrop to receive your file:</p>
          <iframe id="snapdropFrame" src="https://snapdrop.net/?inputcapture" style="width: 100%; height: 100%; border: none;"></iframe>
          <div id="status" style="margin-top: 10px; font-weight: bold;">Waiting for file...</div>
        </div>
      `;

      document.body.appendChild(modal);

      const closeButton = modal.querySelector('#closeModal');
      closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
        reject(new Error('Modal closed'));
      });

      window.addEventListener('message', function messageHandler(event) {
        if (event.origin === "https://snapdrop.net" && event.data.type === "file-received") {
          window.removeEventListener('message', messageHandler);
          document.body.removeChild(modal);

          const { name, mime, dataURL } = event.data;
          fetch(dataURL)
            .then(res => res.blob())
            .then(blob => {
              const receivedFile = new File([blob], name, { type: mime });
              resolve(receivedFile);
            });
        }
      });
    });
  }
})();
