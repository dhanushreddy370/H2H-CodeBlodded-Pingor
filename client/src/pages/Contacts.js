import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, User, Mail, Phone, Edit2, Trash2, X, Save, ChevronRight, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GooeyInput } from '../components/ui/GooeyInput';
import { API_BASE } from '../config';

const Contacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);
  
  

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const userId = user?.userId || user?.id || user?.sub;
      if (!userId) return;
      const res = await fetch(`${API_BASE}/contacts?userId=${userId}`);
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    const contentArea = document.querySelector('.content-area');
    if (isModalOpen) {
      document.body.classList.add('modal-open');
      if (contentArea) contentArea.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('modal-open');
      if (contentArea) contentArea.style.overflow = 'auto';
    }
    return () => {
      document.body.classList.remove('modal-open');
      if (contentArea) contentArea.style.overflow = 'auto';
    };
  }, [isModalOpen]);

  const handleOpenModal = (contact = null) => {
    setSelectedContact(contact);
    setFormData(contact ? { name: contact.name, email: contact.email, phone: contact.phone || '' } : { name: '', email: '', phone: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = user?.userId || user?.id || user?.sub;
    const method = selectedContact ? 'PATCH' : 'POST';
    const url = selectedContact ? `${API_BASE}/contacts/${selectedContact._id}` : `${API_BASE}/contacts`;

    setIsSaving(true);

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId })
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchContacts();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to save contact');
      }
    } catch (err) {
      console.error('Failed to save contact:', err);
      alert('Network error while saving contact');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      const res = await fetch(`${API_BASE}/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchContacts();
      } else {
        alert('Failed to delete contact');
      }
    } catch (err) {
      console.error('Failed to delete contact:', err);
      alert('Network error while deleting contact');
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="contacts-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ flex: 1, maxWidth: '400px' }}>
          <GooeyInput 
            placeholder="Search contacts..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="button" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => handleOpenModal()}>
          <UserPlus size={20} /> Add Contact
        </button>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px' }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '60px', marginBottom: '12px', borderRadius: '12px' }}></div>)}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <User size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
            <p>{searchQuery ? 'No contacts found matching your search.' : 'No contacts yet. Start by adding your first one!'}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map(contact => (
                  <tr key={contact._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{contact.name}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                        <Mail size={14} /> {contact.email}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                        <Phone size={14} /> {contact.phone || '—'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="icon-container" onClick={() => handleOpenModal(contact)} style={{ width: '32px', height: '32px' }}>
                          <Edit2 size={14} />
                        </button>
                        <button className="icon-container" onClick={() => handleDelete(contact._id)} style={{ width: '32px', height: '32px', color: '#ef4444' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container" style={{ maxWidth: 'min(500px, 90%)', maxHeight: 'min(800px, 90%)' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                {selectedContact ? 'Edit Contact' : 'New Contact'}
              </h2>
              <div className="icon-container" onClick={() => setIsModalOpen(false)} style={{ cursor: 'pointer' }}>
                <X size={20} />
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ gridTemplateColumns: '1fr', padding: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>NAME *</label>
                    <input 
                      required
                      className="chat-input"
                      style={{ width: '100%' }}
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>EMAIL *</label>
                    <input 
                      required
                      type="email"
                      className="chat-input"
                      style={{ width: '100%' }}
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>MOBILE NUMBER</label>
                    <input 
                      className="chat-input"
                      style={{ width: '100%' }}
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <button type="submit" disabled={isSaving} className="button" style={{ marginTop: '12px', width: '100%', padding: '12px', opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'wait' : 'pointer' }}>
                    {isSaving ? (
                      <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto' }} />
                    ) : (
                      <>
                        <Save size={18} style={{ marginRight: '8px' }} /> {selectedContact ? 'Update Contact' : 'Create Contact'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
