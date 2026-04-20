import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Bell, Cpu, Save, CheckCircle } from 'lucide-react';

const Settings = () => {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    jobRole: user?.jobRole || '',
    company: user?.company || '',
    syncFrequency: user?.syncFrequency || '30',
    aiModel: 'llama3.2 (Local)'
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedUser = { ...user, ...formData };
    login(updatedUser); // Update local storage and context
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="settings-container">
      <h1 className="page-title">Settings</h1>
      
      <div className="grid grid-cols-1" style={{ maxWidth: '800px' }}>
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <div className="icon-container" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <User size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Personal Information</h3>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name} 
                  onChange={handleChange}
                  className="chat-input" 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email} 
                  onChange={handleChange}
                  readOnly
                  className="chat-input" 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>Job Role</label>
                <input 
                  type="text" 
                  name="jobRole"
                  placeholder="e.g. Product Manager"
                  value={formData.jobRole} 
                  onChange={handleChange}
                  className="chat-input" 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>Company / Org</label>
                <input 
                  type="text" 
                  name="company"
                  placeholder="e.g. Pingor Labs"
                  value={formData.company} 
                  onChange={handleChange}
                  className="chat-input" 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '40px 0 24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <div className="icon-container" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <Cpu size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>AI & Synchronization</h3>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>AI Model (Ollama)</label>
                <input 
                  type="text" 
                  value={formData.aiModel} 
                  readOnly
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-muted)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>Sync Frequency (minutes)</label>
                <select 
                  name="syncFrequency"
                  value={formData.syncFrequency} 
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                >
                  <option value="5">Every 5 minutes</option>
                  <option value="15">Every 15 minutes</option>
                  <option value="30">Every 30 minutes</option>
                  <option value="60">Hourly</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {saved && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: '600', fontSize: '0.9rem' }}>
                  <CheckCircle size={18} /> Settings saved successfully!
                </div>
              )}
              <button type="submit" className="button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                <Save size={18} /> Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
