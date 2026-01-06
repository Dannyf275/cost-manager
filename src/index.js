// src/index.js

// Import the React library, which is necessary to use JSX syntax.
import React from 'react';

// Import the ReactDOM library, specifically the 'client' module for React 18+.
// This library provides methods to interact with the DOM (the web page).
import ReactDOM from 'react-dom/client';

// Import the global CSS file.
// This file contains basic styles (like body margin resets) and applies to the whole app.
import './index.css';

// Import the main Application component.
import App from './app';

// Select the HTML element with the id 'root' from public/index.html.
// This is where the entire React application will be "attached" and rendered.
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the App component into the root element.
// React.StrictMode is a wrapper that helps identify potential problems in the app during development.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);