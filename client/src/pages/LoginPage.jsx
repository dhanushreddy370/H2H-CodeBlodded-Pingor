import React from 'react';
import { Bot, Mail, ShieldCheck } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/url');
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to get auth URL:', error);
      alert('Failed to connect to authentication server. Please ensure the backend is running.');
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg-primary)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '48px', textAlign: 'center' }}>
        <div className="icon-container" style={{ margin: '0 auto 24px', width: '64px', height: '64px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
          <Bot size={32} />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '12px' }}>Pingor AI</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: '1.6' }}>
          Connect your Gmail account to start tracking communications with intelligence.
        </p>

        <button 
          onClick={handleGoogleLogin}
          className="button" 
          style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '1rem', display: 'flex', gap: '12px' }}
        >
          <img src="https://www.google.com/favicon.ico" width="20" alt="google" />
          Continue with Google
        </button>

        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '24px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} /> Secure Sync
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Mail size={14} /> Gmail Certified
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
