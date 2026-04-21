import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const AuthCallback = ({ onLogin }) => {
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [error, setError] = useState(null);

  useEffect(() => {
    const processAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (!code) {
        setStatus('error');
        setError('No authorization code found in URL');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          // Wait a second to show success state before logging in
          setTimeout(() => {
            onLogin(data.user);
            // Redirect with sync flag
            window.location.href = '/?sync=true';
          }, 1500);
        } else {
          setStatus('error');
          setError(data.error || 'Failed to exchange authorization code');
        }
      } catch (err) {
        setStatus('error');
        setError('Network error during authentication');
        console.error(err);
      }
    };

    processAuth();
  }, [onLogin]);

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg-primary)',
      color: 'var(--text-main)',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '40px' }}>
        {status === 'processing' && (
          <>
            <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto 24px', color: 'var(--primary)' }} />
            <h2 style={{ marginBottom: '12px' }}>Authenticating...</h2>
            <p style={{ color: 'var(--text-muted)' }}>Exchanging your Google credentials for a secure session.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} style={{ margin: '0 auto 24px', color: '#10b981' }} />
            <h2 style={{ marginBottom: '12px' }}>Success!</h2>
            <p style={{ color: 'var(--text-muted)' }}>Your account is connected. Redirecting to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={48} style={{ margin: '0 auto 24px', color: '#ef4444' }} />
            <h2 style={{ marginBottom: '12px' }}>Auth Failed</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{error}</p>
            <button 
              className="button" 
              onClick={() => window.location.href = '/'}
              style={{ padding: '10px 20px' }}
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
