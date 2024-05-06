import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BroadcastProvider } from '../lib/main.ts';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BroadcastProvider>
      <App />
    </BroadcastProvider>
  </React.StrictMode>,
);
