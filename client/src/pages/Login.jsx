import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../context/AuthContext';
import { Bot, ChevronRight, Mail, ShieldCheck, Sparkles, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import '../App.css';

const API_BASE = 'http://localhost:5000/api';

const Login = () => {
  const { login } = useAuth();
  const [landingView, setLandingView] = useState(true);
  const [authMode, setAuthMode] = useState('register'); // 'register' or 'login'
  const [setupStep, setSetupStep] = useState('auth'); // 'auth' or 'setup'
  const [tempUser, setTempUser] = useState(null);
  const [isNewUser, setIsNewUser] = useState(true);
  const [loadingCheck, setLoadingCheck] = useState(false);
  
  // Onboarding fields
  const [jobRole, setJobRole] = useState('');
  const [company, setCompany] = useState('');
  
  // Dev mode fields
  const [isDevMode, setIsDevMode] = useState(false);
  const [localName, setLocalName] = useState('');
  const [localEmail, setLocalEmail] = useState('');

  const handleSuccess = async (credentialResponse) => {
    setLoadingCheck(true);
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const email = decoded.email;
      
      // Check if user exists in backend
      const response = await axios.get(`${API_BASE}/auth/check-user?email=${email}`);
      const userData = {
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
        sub: decoded.sub,
        ...(response.data.exists ? response.data.user : {})
      };

      if (response.data.exists || authMode === 'login') {
        // User already exists or is explicitly trying to log in
        // (If they don't exist but chose 'login', we go in with defaults to satisfy USER_REQUEST)
        login(userData);
      } else {
        // New user on Sign Up mode, show onboarding
        setTempUser(userData);
        setSetupStep('setup');
      }
    } catch (error) {
      console.error('Error during auth check:', error);
      const decoded = jwtDecode(credentialResponse.credential);
      const userData = {
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
        sub: decoded.sub
      };
      
      if (authMode === 'login') {
        login(userData);
      } else {
        setTempUser(userData);
        setSetupStep('setup');
      }
    } finally {
      setLoadingCheck(false);
    }
  };

  const handleError = () => {
    alert('Google Authentication Failed. Please try again.');
  };

  const handleFinalSetup = async (e) => {
    e.preventDefault();
    if (!jobRole || !company) return;
    
    const finalUser = { ...tempUser, jobRole, company };
    
    try {
      // Register in backend
      await axios.post(`${API_BASE}/auth/register`, { userData: finalUser });
      login(finalUser);
    } catch (error) {
      console.error('Error saving user:', error);
      login(finalUser); // Login anyway on error as fallback
    }
  };

  const handleDevLogin = async (e) => {
    e.preventDefault();
    if (!localName || !localEmail) return;

    if (authMode === 'register' && (!jobRole || !company)) return;

    const devUser = {
      name: localName,
      email: localEmail,
      jobRole: jobRole || 'Dev User',
      company: company || 'Dev Lab',
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(localName)}&background=random`,
      sub: localEmail.toLowerCase().replace(/[^a-z0-9]/g, '')
    };

    try {
      if (authMode === 'register') {
        await axios.post(`${API_BASE}/auth/register`, { userData: devUser });
      }
      login(devUser);
    } catch (error) {
      login(devUser);
    }
  };

  const parallaxVariants = {
    initial: { y: 0 },
    animate: (custom) => ({
      y: [0, custom ? -20 : 20, 0],
      transition: {
        duration: custom ? 4 : 5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    })
  };

  const containerVariants = {
    exit: {
      opacity: 0,
      y: -100,
      transition: { duration: 0.8, ease: "easeInOut" }
    }
  };

  if (setupStep === 'setup') {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg-primary)', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card" 
          style={{ width: '100%', maxWidth: '500px', padding: '48px' }}
        >
          <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <Sparkles size={24} />
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '12px', letterSpacing: '-0.02em' }}>Welcome, {tempUser?.name?.split(' ')[0]}!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '1.1rem', lineHeight: '1.6' }}>Help Pingor personalize your experience by providing a few details.</p>
          
          <form onSubmit={handleFinalSetup} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px' }}>What is your job role?</label>
              <input 
                type="text" 
                placeholder="e.g. Project Manager, Founder..." 
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                required
                className="gooey-input-field"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px' }}>Where do you work?</label>
              <input 
                type="text" 
                placeholder="e.g. Acme Corp" 
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                className="gooey-input-field"
              />
            </div>
            <button type="submit" className="button" style={{ padding: '16px', fontSize: '1.1rem', marginTop: '16px', width: '100%' }}>
              Launch Your Dashboard <ArrowRight size={20} />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative', background: 'var(--bg-primary)' }}>
      <AnimatePresence mode="wait">
        {landingView ? (
          <motion.div
            key="landing"
            variants={containerVariants}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit="exit"
            style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px', zIndex: 10, position: 'relative' }}
          >
            {/* Parallax Background Elements */}
            <div className="parallax-bg">
              <motion.div 
                custom={true}
                variants={parallaxVariants}
                animate="animate"
                className="parallax-circle" 
                style={{ top: '20%', left: '15%', width: '400px', height: '400px', background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }} 
              />
              <motion.div 
                custom={false}
                variants={parallaxVariants}
                animate="animate"
                className="parallax-circle" 
                style={{ bottom: '10%', right: '10%', width: '600px', height: '600px', background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} 
              />
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{ zIndex: 2 }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '8px 16px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '20px', marginBottom: '32px', fontWeight: '600', fontSize: '0.9rem' }}>
                <Zap size={16} fill="currentColor" /> Welcome to Pingor AI
              </div>
              <h1 style={{ fontSize: 'clamp(3rem, 10vw, 5rem)', fontWeight: '900', lineHeight: '0.9', marginBottom: '24px', letterSpacing: '-0.04em' }}>
                Your Workspace, <br/> <span style={{ color: 'var(--primary)' }}>Empowered by AI.</span>
              </h1>
              <p style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto 48px', lineHeight: '1.6' }}>
                Pingor orchestrates your emails, action items, and follow-ups into a single, intelligent flow. Focus on deep work while our agentic AI handles the logistics.
              </p>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLandingView(false)}
                className="button"
                style={{ padding: '20px 48px', fontSize: '1.25rem', borderRadius: '100px', boxShadow: '0 20px 40px -10px rgba(37, 99, 235, 0.4)' }}
              >
                Get Started <ChevronRight size={24} />
              </motion.button>

              <div style={{ marginTop: '64px', display: 'flex', justifyContent: 'center', gap: '32px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={18} color="var(--primary)" /> Smart Sync</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={18} color="var(--primary)" /> 24/7 Follow-ups</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={18} color="var(--primary)" /> Agentic Chat</div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="auth"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ height: '100vh', width: '100vw', display: 'flex' }}
          >
            {/* Left Branding Panel */}
            <div style={{ flex: 1, backgroundColor: 'var(--primary)', padding: '60px', display: 'flex', flexDirection: 'column', color: 'white', position: 'relative', overflow: 'hidden' }}>
              <div style={{ zIndex: 2, display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'auto' }}>
                <div style={{ background: 'white', padding: '8px', borderRadius: '12px' }}>
                  <Bot size={28} color="var(--primary)" />
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Pingor</span>
              </div>
              
              <div style={{ zIndex: 2, marginBottom: '60px' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: '1.1', marginBottom: '20px' }}>Built for the <br/> Modern Professional</h1>
                <p style={{ fontSize: '1.1rem', opacity: '0.9', maxWidth: '400px', lineHeight: '1.6' }}>
                  Join thousands of users who have reclaimed their time. Pingor's agentic synchronization ensures you are always one step ahead.
                </p>
              </div>
              
              {/* Decorative Background Elements */}
              <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', zIndex: 1 }}></div>
              <div style={{ position: 'absolute', top: '10%', right: '20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', zIndex: 1 }}></div>
            </div>

            {/* Right Auth Panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', background: 'var(--bg-card)' }}>
              <div style={{ width: '100%', maxWidth: '400px' }}>
                
                <div style={{ display: 'flex', width: '100%', marginBottom: '40px', borderBottom: '2px solid var(--border)' }}>
                  <button 
                    onClick={() => { setAuthMode('register'); setIsDevMode(false); }}
                    style={{ flex: 1, padding: '16px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.1rem', fontWeight: authMode === 'register' ? 'bold' : '500', color: authMode === 'register' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: authMode === 'register' ? '3px solid var(--primary)' : '3px solid transparent', marginBottom: '-2px', transition: 'all 0.3s', textAlign: 'center' }}
                  >
                    Sign Up
                  </button>
                  <button 
                    onClick={() => { setAuthMode('login'); setIsDevMode(false); }}
                    style={{ flex: 1, padding: '16px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.1rem', fontWeight: authMode === 'login' ? 'bold' : '500', color: authMode === 'login' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: authMode === 'login' ? '3px solid var(--primary)' : '3px solid transparent', marginBottom: '-2px', transition: 'all 0.3s', textAlign: 'center' }}
                  >
                    Log In
                  </button>
                </div>

                <motion.div
                  key={authMode}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    {authMode === 'register' ? 'Create account' : 'Welcome back'}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '1.05rem' }}>
                    {authMode === 'register' 
                      ? 'Securely connect your Gmail to allow Pingor to manage your communications.' 
                      : 'Sign in to access your dashboard and active follow-ups.'}
                  </p>

                  {!isDevMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="glass" style={{ display: 'flex', justifyContent: 'center', padding: '24px', borderRadius: '16px', background: 'var(--bg-primary)' }}>
                        {loadingCheck ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                            <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                            Checking account...
                          </div>
                        ) : (
                          <GoogleLogin
                            onSuccess={handleSuccess}
                            onError={handleError}
                            text={authMode === 'register' ? "signup_with" : "signin_with"}
                            shape="pill"
                            size="large"
                            theme="outline"
                          />
                        )}
                      </div>
                      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '24px' }}>
                        <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setIsDevMode(true)}>Test login without Gmail</span>
                      </p>
                    </div>
                  ) : (
                    <div className="fade-enter fade-enter-active">
                      <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} onSubmit={handleDevLogin}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>Full Name</label>
                          <input 
                            type="text" 
                            placeholder="John Doe" 
                            value={localName}
                            onChange={(e) => setLocalName(e.target.value)}
                            required
                            className="gooey-input-field"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>Email Address</label>
                          <input 
                            type="email" 
                            placeholder="john@example.com" 
                            value={localEmail}
                            onChange={(e) => setLocalEmail(e.target.value)}
                            required
                            className="gooey-input-field"
                          />
                        </div>
                        {authMode === 'register' && (
                          <>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>Job Role</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Sales Lead" 
                                value={jobRole}
                                onChange={(e) => setJobRole(e.target.value)}
                                required
                                className="gooey-input-field"
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>Company</label>
                              <input 
                                type="text" 
                                placeholder="e.g. TechFlow" 
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                required
                                className="gooey-input-field"
                              />
                            </div>
                          </>
                        )}
                        <button type="submit" className="button" style={{ padding: '16px', fontSize: '1rem', marginTop: '10px' }}>
                          {authMode === 'register' ? 'Create Account' : 'Sign In'}
                        </button>
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '20px', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setIsDevMode(false)}>
                          Back to Google Auth
                        </p>
                      </form>
                    </div>
                  )}

                  <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '24px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={14} /> Secure Encryption
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={14} /> Gmail Certified
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
