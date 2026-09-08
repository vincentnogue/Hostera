import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/lib/hosteraBackend'
import App from '@/App.jsx'
import '@/index.css'

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  )
} catch (err) {
  console.error('Failed to mount the app:', err);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML =
      '<div style="position:fixed;inset:0;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;gap:12px;font-family:sans-serif;' +
      'text-align:center;padding:24px;">' +
      '<h1 style="font-size:16px;font-weight:600;color:#111;">Unable to load this page</h1>' +
      '<p style="font-size:13px;color:#666;max-width:360px;">Something went wrong while loading the app. Reloading usually fixes this.</p>' +
      '<button onclick="window.location.reload()" style="padding:8px 16px;border-radius:8px;background:#111;color:#fff;border:none;font-size:13px;">Reload</button></div>';
  }
}
