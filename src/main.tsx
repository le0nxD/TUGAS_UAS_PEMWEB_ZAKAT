import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#FFFFFF',
              color: '#374151',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
            success: {
              style: {
                border: '1px solid #D1FAE5',
                borderLeft: '4px solid #10B981',
              },
            },
            error: {
              style: {
                border: '1px solid #FEE2E2',
                borderLeft: '4px solid #EF4444',
              },
            },
          }}
        />
      </AuthProvider>
    </Router>
  </StrictMode>
);