import React, { useState } from 'react';

const FollowUps = ({ setActivePage }) => {
  const [senderFilter, setSenderFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  
  const dormantThreads = [
    { threadId: 't_2001', subject: 'Partnership Inquiry', lastUpdated: '2026-10-05T00:00:00Z', senderName: 'John Doe', priority: 'High' },
    { threadId: 't_2002', subject: 'Contract Revision', lastUpdated: '2026-10-15T00:00:00Z', senderName: 'Emma Watson', priority: 'High' },
    { threadId: 't_2003', subject: 'Ticket #49281', lastUpdated: '2026-10-23T00:00:00Z', senderName: 'Tech Corp Support', priority: 'Medium' },
    { threadId: 't_2004', subject: 'Feedback on v2 prototypes', lastUpdated: '2026-10-10T11:00:00Z', senderName: 'Product Team', priority: 'Medium' },
    { threadId: 't_2005', subject: 'Q3 Budget Approvals', lastUpdated: '2026-10-01T09:00:00Z', senderName: 'Finance Div', priority: 'High' },
    { threadId: 't_2006', subject: 'Question regarding new feature', lastUpdated: '2026-10-15T14:30:00Z', senderName: 'Alice Smith', priority: 'Low' },
    { threadId: 't_2007', subject: 'Re: Job Application - Software Eng', lastUpdated: '2026-09-28T16:00:00Z', senderName: 'HR Dept', priority: 'Medium' },
    { threadId: 't_2008', subject: 'Vendor Agreement Renewals', lastUpdated: '2026-10-05T12:00:00Z', senderName: 'Legal', priority: 'High' },
    { threadId: 't_2009', subject: 'Marketing Asset Delivery Status', lastUpdated: '2026-10-18T10:00:00Z', senderName: 'Agency X', priority: 'Medium' },
    { threadId: 't_2010', subject: 'Investor Update Call Scheduling', lastUpdated: '2026-10-22T08:00:00Z', senderName: 'Investor Relations', priority: 'High' }
  ];

  const timeSince = (dateString, refDate) => {
    const lastUpdateDate = new Date(dateString);
    const now = refDate;
    const diffTime = Math.abs(now - lastUpdateDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return `${diffDays} days ago`;
  };

  const priorityRenderer = (priorityText) => {
    if (priorityText === 'High')   return <span className="badge high badge-priority-item" style={{background: 'var(--danger-bg)', color: 'var(--danger-text)'}}>🔴 High</span>;
    if (priorityText === 'Medium') return <span className="badge pending badge-priority-item" style={{background: 'var(--warning-bg)', color: 'var(--warning-text)'}}>🟡 Medium</span>;
    return <span className="badge priority-item" style={{background: 'var(--success-bg)', color: 'var(--success-text)'}}>🟢 Low</span>;
  };

  const openInPingor = (item) => {
    if (setActivePage) {
      alert(`Sending ${item.subject} Context to Pingor Chat Interface...`);
      setActivePage('Pingor');
    }
  };

  const viewOriginal = (id) => {
    alert(`Opening original thread ${id} in separate view/tab.`);
  };

  const filteredThreads = dormantThreads.filter(t => {
    if (senderFilter && !t.senderName.toLowerCase().includes(senderFilter.toLowerCase())) return false;
    if (subjectFilter && !t.subject.toLowerCase().includes(subjectFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Follow-ups Needed</h1>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <input 
            type="text" 
            placeholder="Filter by Sender" 
            value={senderFilter}
            onChange={e => setSenderFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
          />
          <input 
            type="text" 
            placeholder="Filter by Subject" 
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
          />
        </div>
      </div>
      
      {filteredThreads.length === 0 ? (
        <div className="empty-state card">
          <h3>No follow-ups match filters 🎉</h3>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Priority (AI Assigned)</th>
                <th>Sender</th>
                <th>Subject</th>
                <th>Last Reply</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredThreads.map(item => {
                return (
                  <tr key={item.threadId}>
                    <td>
                      {priorityRenderer(item.priority)}
                    </td>
                    <td style={{ fontWeight: '500', color: 'var(--text-main)' }}>{item.senderName}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.subject}</td>
                    <td style={{ color: 'var(--text-main)' }}>
                      {timeSince(item.lastUpdated, new Date('2026-10-24T12:00:00Z'))}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openInPingor(item)} className="quick-action-btn" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Open in Pingor</button>
                        <button onClick={() => viewOriginal(item.threadId)} className="quick-action-btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>View Original</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FollowUps;
