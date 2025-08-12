/**
 * @fileoverview Main entry point for CritGenius Listener React application
 * Initializes React app with strict mode, MUI theme provider, and CSS baseline
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App.tsx';
import { critgeniusTheme } from './theme';
import './index.css';

// Create root element and render app
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={critgeniusTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
