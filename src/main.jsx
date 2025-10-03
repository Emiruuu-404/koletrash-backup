import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// MS Edge compatibility check
const isEdge = /Edg/.test(navigator.userAgent);
console.log('Browser detected:', isEdge ? 'Microsoft Edge' : 'Other browser');

// Fallback for MS Edge compatibility
const renderApp = () => {
  try {
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <BrowserRouter basename={window.location.pathname.startsWith('/koletrash') ? '/koletrash' : '/'}>
          <App />
        </BrowserRouter>
      </StrictMode>,
    )
  } catch (error) {
    console.error('Error rendering app:', error);
    // Fallback for older browsers
    document.getElementById('root').innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h1>KolekTrash</h1>
        <p>Please use a modern browser or update your current browser to access this application.</p>
        <a href="/login" style="display: inline-block; padding: 10px 20px; background: #16a34a; color: white; text-decoration: none; border-radius: 5px;">Go to Login</a>
      </div>
    `;
  }
};

// Ensure DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}
