// index.js
import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

// Optional enhancements:
// React Router
// import { BrowserRouter } from 'react-router-dom';

// Error Boundary HOC
// import ErrorBoundary from './components/ErrorBoundary';

// Context/Redux providers
// import { Provider as ReduxProvider } from 'react-redux';
// import store from './redux/store';

// Styling or global context
// import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);

// Original minimal render
const Original = () => <App />;

// Wrapped with enhancements (uncomment to use):
const Enhanced = () => (
  // <ErrorBoundary>
  //   <BrowserRouter>
  //     <ReduxProvider store={store}>
          <App />
  //     </ReduxProvider>
  //   </BrowserRouter>
  // </ErrorBoundary>
);

root.render(
  <>
    {/* Choose one: */}
    {/* <Original /> */}
    <Enhanced />
  </>
);