import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';

// Priority: 1. LocalStorage (user override) 2. Official ID 3. Env var
const GOOGLE_CLIENT_ID = localStorage.getItem('pingor_client_id') || '563125092156-lmlkaed98pqsm76fg09bs7ns9drrqhgr.apps.googleusercontent.com';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
