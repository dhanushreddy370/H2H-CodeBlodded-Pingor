import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import {jwtDecode} from 'jwt-decode'; // Note the curly brace import might fail if the library doesn't export it like that, usually it's `import { jwtDecode } from 'jwt-decode'` or `import jwt_decode from 'jwt-decode'`. The newest version 4.0 uses `import { jwtDecode } from "jwt-decode";`.
import { useAuth } from '../context/AuthContext';
import { Bot } from 'lucide-react';
import '../App.css';

const Login = () => {
  const { login } = useAuth();
  const [localName, setLocalName] = useState('');
  const [localEmail, setLocalEmail] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [company, setCompany] = useState('');
  const [isDevMode, setIsDevMode] = useState(false);
  const [setupStep, setSetupStep] = useState('auth'); // 'auth' or 'setup'
  const [tempUser, setTempUser] = useState(null);
  const [authMode, setAuthMode] = useState('register'); // 'register' or 'login'
  const handleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    const userData = {
      name: decoded.name,
      email: decoded.email,
      picture: decoded.picture,
      sub: decoded.sub
    };
    
    // If it's a first time registration, force setup
    if (authMode === 'register') {
      setTempUser(userData);
      setSetupStep('setup');
    } else {
      login(userData);
    }
  };

  const handleError = () => {
    console.log('Login Failed');
  };

  const handleDevLogin = (e) => {
    e.preventDefault();
    if (!localName || !localEmail || !jobRole || !company) return;
    
    login({
      name: localName,
      email: localEmail,
      jobRole,
      company,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(localName)}&background=random`,
      sub: localEmail.toLowerCase().replace(/[^a-z0-9]/g, '')
    });
  };

  const handleFinalSetup = (e) => {
    e.preventDefault();
    if (!jobRole || !company) return;
    login({ ...tempUser, jobRole, company });
  };

  if (setupStep === 'setup') {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg-main)', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '40px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '10px' }}>One last thing...</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>To personalize your AI assistant, tell us a bit about your work.</p>
          
          <form onSubmit={handleFinalSetup} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>Job Role</label>
              <input 
                type="text" 
                placeholder="e.g. Project Manager" 
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                required
                style={{ border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '8px', width: '100%', fontSize: '1rem', background: 'var(--bg-main)', color: 'var(--text-main)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>Company</label>
              <input 
                type="text" 
                placeholder="e.g. Acme Corp" 
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                style={{ border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '8px', width: '100%', fontSize: '1rem', background: 'var(--bg-main)', color: 'var(--text-main)' }}
              />
            </div>
            <button type="submit" className="button" style={{ padding: '14px', fontSize: '1rem', marginTop: '10px', justifyContent: 'center' }}>
              Finalize Setup & Enter Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg-main)' }}>
      {/* Left Branding Panel */}
      <div style={{ flex: 1, backgroundColor: 'var(--primary)', padding: '60px', display: 'flex', flexDirection: 'column', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ zIndex: 2, display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'auto' }}>
          <div style={{ background: 'white', padding: '8px', borderRadius: '12px' }}>
            <Bot size={28} color="var(--primary)" />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Pingor</span>
        </div>
        
        <div style={{ zIndex: 2, marginBottom: '60px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: '1.1', marginBottom: '20px' }}>Your AI-Powered <br/> Workspace</h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.9', maxWidth: '400px', lineHeight: '1.6' }}>
            Seamlessly integrate your email, action items, and follow-ups. Let Pingor's agentic intelligence manage the noise while you focus on what matters.
          </p>
        </div>
        
        {/* Decorative Background Elements */}
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', zIndex: 1 }}></div>
        <div style={{ position: 'absolute', top: '10%', right: '20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', zIndex: 1 }}></div>
      </div>

      {/* Right Auth Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', borderBottom: '2px solid var(--border)' }}>
            <button 
              onClick={() => { setAuthMode('register'); setIsDevMode(false); }}
              style={{ padding: '10px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.1rem', fontWeight: authMode === 'register' ? 'bold' : '500', color: authMode === 'register' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: authMode === 'register' ? '3px solid var(--primary)' : '3px solid transparent', marginBottom: '-2px' }}
            >
              Sign Up
            </button>
            <button 
              onClick={() => { setAuthMode('login'); setIsDevMode(false); }}
              style={{ padding: '10px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.1rem', fontWeight: authMode === 'login' ? 'bold' : '500', color: authMode === 'login' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: authMode === 'login' ? '3px solid var(--primary)' : '3px solid transparent', marginBottom: '-2px' }}
            >
              Log In
            </button>
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '10px', color: 'var(--text-main)' }}>
            {authMode === 'register' ? 'Create an account' : 'Welcome back'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>
            {authMode === 'register' ? 'Connect your Google account to automatically sync your inbox and generate personalized tasks.' : 'Sign in to access your agentic dashboard and follow-ups.'}
          </p>

          {!isDevMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-card)' }}>
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={handleError}
                  text={authMode === 'register' ? "signup_with" : "signin_with"}
                  shape="pill"
                  size="large"
                  theme="outline"
                />
              </div>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '20px', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setIsDevMode(true)}>
                Are you a developer? Local test login
              </p>
            </div>
          ) : (
            <div className="fade-enter fade-enter-active">
              <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleDevLogin}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Full Name</label>
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    required
                    style={{ border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '8px', width: '100%', fontSize: '1rem', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="john@example.com" 
                    value={localEmail}
                    onChange={(e) => setLocalEmail(e.target.value)}
                    required
                    style={{ border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '8px', width: '100%', fontSize: '1rem', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                  />
                </div>
                {authMode === 'register' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Job Role</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Sales Lead" 
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}
                        required
                        style={{ border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '8px', width: '100%', fontSize: '1rem', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Company</label>
                      <input 
                        type="text" 
                        placeholder="e.g. TechFlow" 
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        required
                        style={{ border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '8px', width: '100%', fontSize: '1rem', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                      />
                    </div>
                  </>
                )}
                <button type="submit" className="button" style={{ justifyContent: 'center', padding: '14px', fontSize: '1rem', marginTop: '10px' }}>
                  {authMode === 'register' ? 'Create Local Account' : 'Sign In Locally'}
                </button>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '20px', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setIsDevMode(false)}>
                  Back to Google OAuth
                </p>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
