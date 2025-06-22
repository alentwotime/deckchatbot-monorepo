import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Get the root DOM element
const container = document.getElementById('root');
const root = createRoot(container);

// Just render the App
root.render(<App />);
