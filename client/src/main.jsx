/**
 * main.jsx — CampusAI React Entry Point
 * Bootstraps the React application with BrowserRouter and StrictMode
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import './index.css';

// Find root element
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('[CampusAI] Root element #root not found in the DOM.');
}

// Create React root and render
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
