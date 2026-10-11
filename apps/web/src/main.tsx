import { SessionProvider } from '@curso/login-sdk/react';
import '@isaac545454/nucleus/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado.');

createRoot(root).render(
  <StrictMode>
    <SessionProvider>
      <App />
    </SessionProvider>
  </StrictMode>,
);
