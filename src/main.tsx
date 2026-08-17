import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { AppErrorBoundary } from './components/RecoveryPages.tsx';

const rootElement = document.getElementById('root');

function showBootError(message: string) {
  document.body.style.margin = '0';
  document.body.style.background = '#020617';
  document.body.style.color = '#f8fafc';
  document.body.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;padding:24px;font-family:Inter,system-ui,sans-serif;text-align:center">
      <section style="max-width:520px">
        <h1 style="font-size:28px;margin:0 0 12px">PowerSense could not start</h1>
        <p style="color:#94a3b8;line-height:1.6;margin:0">${message}</p>
      </section>
    </main>
  `;
}

try {
  if (!rootElement) {
    throw new Error('The app root element is missing from index.html.');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </BrowserRouter>
    </StrictMode>,
  );
} catch (error) {
  console.error('PowerSense startup failed:', error);
  showBootError('Please refresh the page. If this continues, check the browser console for the startup error.');
}
