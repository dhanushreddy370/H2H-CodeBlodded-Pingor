import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, Bell, Save, CheckCircle, Moon, Sun, 
  User, RefreshCw, LogOut, Mail, Clock, Layout, 
  Check, AlertCircle, Loader2
} from 'lucide-react';
import { API_BASE } from '../config';

const Settings = ({ darkMode, toggleDarkMode }) => {
  const { user, login, logout } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    dailyDigest: true,
    followupReminders: true,
    syncFrequency: '30',
    viewMode: 'comfortable'
  });
  const [saved, setSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.settings) {
      setSettings(prev => ({ ...prev, ...user.settings }));
    }
  }, [user]);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userId = user?.userId || user?.id || user?.sub;
      const res = await fetch(`${API_BASE}/api/users/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, settings })
      });
      const updatedUser = await res.json();
      if (res.ok) {
        login(updatedUser); 
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const userId = user?.userId || user?.id || user?.sub;
      await fetch(`${API_BASE}/api/sync/manual?userId=${userId}`, { method: 'POST' });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsSyncing(false), 2000);
    }
  };

  const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', marginTop: '16px' }}>
      <div className="icon-container" style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '40px', height: '40px', borderRadius: '12px' }}>
        <Icon size={18} />
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>{title}</h3>
        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{subtitle}</p>
      </div>
    </div>
  );


  const SettingRow = ({ label, description, children }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border)', marginBottom: '16px', transition: 'all 0.2s' }}>
      <div style={{ flex: 1, paddingRight: '16px' }}>
        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>{label}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500, lineHeight: 1.4 }}>{description}</div>
      </div>
      {children}
    </div>
  );

  return (
    <div className="settings-container" style={{ paddingBottom: '100px' }}>
      <div className="grid grid-cols-1" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '8px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Manage your account preferences and AI configuration.</p>
        </div>

        {/* 1. Notifications */}
        <div className="card" style={{ padding: '32px', marginBottom: '32px', borderRadius: '24px' }}>
          <SectionHeader 
            icon={Bell} 
            title="Notifications" 
            subtitle="Configure how and when you receive intelligence alerts" 
          />
          
          <SettingRow label="Daily Digest" description="Receive a morning summary of high-priority tasks and upcoming follow-ups via email.">
            <button 
              onClick={() => handleToggle('dailyDigest')}
              className={`switch ${settings.dailyDigest ? 'active' : ''}`}
            >
              <div className="switch-handle" />
            </button>
          </SettingRow>

          <SettingRow label="Follow-up Reminders" description="Get real-time push notifications when a thread hasn't received a reply within your set window.">
            <button 
              onClick={() => handleToggle('followupReminders')}
              className={`switch ${settings.followupReminders ? 'active' : ''}`}
            >
              <div className="switch-handle" />
            </button>
          </SettingRow>
        </div>

        {/* 2. Sync Settings */}
        <div className="card" style={{ padding: '32px', marginBottom: '32px', borderRadius: '24px' }}>
          <SectionHeader 
            icon={RefreshCw} 
            title="Sync Settings" 
            subtitle="Control the frequency of Gmail analysis and intelligence extraction" 
          />
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', marginBottom: '16px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analysis Frequency</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <button
                onClick={() => setSettings({ ...settings, syncFrequency: '60' })}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: '2px solid',
                  borderColor: settings.syncFrequency === '60' ? 'var(--primary)' : 'var(--border)',
                  background: settings.syncFrequency === '60' ? 'var(--primary-light)' : 'var(--bg-card)',
                  color: settings.syncFrequency === '60' ? 'var(--primary)' : 'var(--text-main)',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Clock size={20} />
                <span>Hourly (Automated)</span>
              </button>
              <button
                onClick={() => setSettings({ ...settings, syncFrequency: 'manual' })}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: '2px solid',
                  borderColor: settings.syncFrequency === 'manual' ? 'var(--primary)' : 'var(--border)',
                  background: settings.syncFrequency === 'manual' ? 'var(--primary-light)' : 'var(--bg-card)',
                  color: settings.syncFrequency === 'manual' ? 'var(--primary)' : 'var(--text-main)',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Shield size={20} />
                <span>Manual Trigger</span>
              </button>
            </div>
          </div>

          <button 
            className="button" 
            onClick={handleSyncNow}
            disabled={isSyncing}
            style={{ width: '100%', padding: '18px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem', fontWeight: 800 }}
          >
            {isSyncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            {isSyncing ? 'Syncing Gmail Archive...' : 'Force Intelligence Sync Now'}
          </button>
        </div>

        {/* 3. UI Preferences */}
        <div className="card" style={{ padding: '32px', marginBottom: '32px', borderRadius: '24px' }}>
          <SectionHeader 
            icon={Layout} 
            title="Interface Preferences" 
            subtitle="Customize how Pingor looks and feels on your device" 
          />
          
          <SettingRow label="Dark Mode" description="Switch to a dark interface to reduce eye strain in low-light environments.">
            <button 
              onClick={toggleDarkMode}
              className={`switch ${darkMode ? 'active' : ''}`}
            >
              <div className="switch-handle" />
            </button>
          </SettingRow>

          <SettingRow label="View Density" description="Choose between a compact or more spacious layout.">
            <div style={{ display: 'flex', background: 'var(--sidebar-hover)', padding: '6px', borderRadius: '14px' }}>
              <button 
                onClick={() => setSettings({...settings, viewMode: 'compact'})}
                style={{ 
                  padding: '10px 20px', borderRadius: '10px', border: 'none', 
                  background: settings.viewMode === 'compact' ? 'var(--bg-card)' : 'transparent',
                  color: settings.viewMode === 'compact' ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: settings.viewMode === 'compact' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >Compact</button>
              <button 
                onClick={() => setSettings({...settings, viewMode: 'comfortable'})}
                style={{ 
                  padding: '10px 20px', borderRadius: '10px', border: 'none', 
                  background: settings.viewMode === 'comfortable' ? 'var(--bg-card)' : 'transparent',
                  color: settings.viewMode === 'comfortable' ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: settings.viewMode === 'comfortable' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >Comfortable</button>
            </div>
          </SettingRow>
        </div>

        {/* 4. Account & Session */}
        <div className="card" style={{ padding: '32px', marginBottom: '40px', borderRadius: '24px' }}>
          <SectionHeader 
            icon={User} 
            title="Account & Connectivity" 
            subtitle="Manage your connected Google identity and active session" 
          />
          
          <SettingRow label="Connected Google Account" description={user?.email || 'No email attached'}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              {user?.gmailConnected ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', fontWeight: '800', fontSize: '0.9rem', background: 'var(--success-bg)', padding: '8px 16px', borderRadius: '12px' }}>
                  <CheckCircle size={16} /> Connected
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', fontWeight: '800', fontSize: '0.9rem', background: 'var(--danger-bg)', padding: '8px 16px', borderRadius: '12px' }}>
                  <AlertCircle size={16} /> Not Connected
                </div>
              )}
            </div>
          </SettingRow>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-start' }}>
            <button 
              onClick={logout} 
              className="button-secondary" 
              style={{ color: 'var(--danger-text)', borderColor: 'var(--border)', background: 'var(--danger-bg)', display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 24px', borderRadius: '16px', fontWeight: 800 }}
            >
              <LogOut size={18} /> Sign Out of Pingor
            </button>
          </div>
        </div>

        {/* Floating Save Bar */}
        <div className="glass" style={{ 
          position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
          width: 'min(700px, 90%)',
          padding: '16px 24px', borderRadius: '24px', zIndex: 100,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.15)', border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(20px)', background: 'var(--glass-bg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {saved ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', fontWeight: '800' }}>
                <div style={{ background: 'var(--success-bg)', padding: '8px', borderRadius: '50%' }}><Check size={18} /></div>
                Settings synchronized
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', fontWeight: '800', fontSize: '0.95rem' }}>
                <div style={{ background: 'var(--danger-bg)', padding: '8px', borderRadius: '50%' }}><Shield size={18} /></div>
                <span>You have unsaved changes</span>
              </div>
            )}
          </div>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="button" 
            style={{ padding: '14px 32px', borderRadius: '16px', boxShadow: '0 8px 20px rgba(37,99,235,0.25)', minWidth: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;

