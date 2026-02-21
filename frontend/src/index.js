import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker — auto-reload when new version deploys
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('SW registered:', reg.scope);

      // When a new SW is waiting, reload immediately
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            console.log('SW updated — reloading for fresh content');
            window.location.reload();
          }
        });
      });
    }).catch(err => console.log('SW failed:', err));

    // Also listen for SW_UPDATED message from the new SW
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data?.type === 'SW_UPDATED') {
        console.log('SW says new version:', event.data.version, '— reloading');
        window.location.reload();
      }
    });
  });
}