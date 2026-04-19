import React, { useState } from 'react';
import { Bot, CheckSquare } from 'lucide-react';

const Inbox = () => {
  const [selectedThreadId, setSelectedThreadId] = useState('t_1001');

  const threads = [
    { threadId: 't_1001', subject: 'Review: Q3 Marketing Assets', snippet: 'Hi, I just shared the new marketing assets for Q3. Could you please review them by Friday?', lastUpdated: '2026-10-24T10:30:00Z', senderName: 'Alice Smith', senderEmail: 'alice@example.com', aiSummary: 'Alice shared Q3 marketing assets and requested a review by Friday.', extractedTasks: ['Review Q3 assets by Friday'] },
    { threadId: 't_1002', subject: 'Weekly Team Sync', snippet: 'Here is the agenda for our upcoming team sync. Please add your points.', lastUpdated: '2026-10-23T14:15:00Z', senderName: 'Bob Johnson', senderEmail: 'bob@example.com', aiSummary: 'Bob sent the agenda for the sync and asked team to add discussion points.', extractedTasks: ['Add points to sync agenda'] },
    { threadId: 't_1003', subject: 'Server Maintenance Notice', snippet: 'Scheduled maintenance will occur this weekend from 2am to 4am EST.', lastUpdated: '2026-10-22T08:00:00Z', senderName: 'System Notifications', senderEmail: 'no-reply@system.com', aiSummary: 'Routine maintenance scheduled for the weekend (2am-4am EST).', extractedTasks: [] },
    { threadId: 't_1004', subject: 'Invoice #4029 Due', snippet: 'Attached is the invoice for services rendered in September.', lastUpdated: '2026-10-21T09:45:00Z', senderName: 'Finance Dept', senderEmail: 'finance@acme.com', aiSummary: 'Finance sent Invoice #4029 for September services.', extractedTasks: ['Pay Invoice #4029'] },
    { threadId: 't_1005', subject: 'User Interview Feedback', snippet: 'I finished the user interviews, the main takeaways are quite surprising...', lastUpdated: '2026-10-20T16:20:00Z', senderName: 'Sarah Connor', senderEmail: 'sarah.c@example.com', aiSummary: 'Sarah completed interviews and attached surprising takeaways.', extractedTasks: [] },
    { threadId: 't_1006', subject: 'Lunch this Thursday?', snippet: 'Hey, are you free for lunch on Thursday? Thinking about hitting up the new sushi place.', lastUpdated: '2026-10-20T11:00:00Z', senderName: 'Mike Davis', senderEmail: 'mdavis@example.com', aiSummary: 'Mike wants to get sushi for lunch on Thursday.', extractedTasks: ['Reply to Mike about Thursday lunch'] },
    { threadId: 't_1007', subject: 'Action Required: Security Update', snippet: 'Please update your security credentials by EOD to avoid account locking.', lastUpdated: '2026-10-19T13:30:00Z', senderName: 'IT Support', senderEmail: 'it-helpdesk@company.com', aiSummary: 'IT requires security credentials update by End of Day.', extractedTasks: ['Update security credentials by EOD'] },
    { threadId: 't_1008', subject: 'Partnership Inquiry', snippet: 'We love what Pingor is building and want to integrate with our platform.', lastUpdated: '2026-10-18T15:10:00Z', senderName: 'Jane Williams', senderEmail: 'jane.w@partner.com', aiSummary: 'Jane is interested in a partnership integration with Pingor.', extractedTasks: ['Follow up with Jane regarding partnership'] },
    { threadId: 't_1009', subject: 'Design System Iteration 3', snippet: 'Here are the Figma links for the latest iterations on the design system components.', lastUpdated: '2026-10-18T09:05:00Z', senderName: 'Design Team', senderEmail: 'design@company.com', aiSummary: 'Design team shared Figma links for iteration 3.', extractedTasks: [] },
    { threadId: 't_1010', subject: 'Welcome to the platform!', snippet: 'Thanks for signing up! Here is a quick guide to getting started with your new account.', lastUpdated: '2026-10-17T18:00:00Z', senderName: 'Onboarding', senderEmail: 'hello@company.com', aiSummary: 'Automated onboarding email with a getting started guide.', extractedTasks: [] },
    { threadId: 't_1011', subject: 'Contract Revision v2', snippet: 'I have attached the updated contract with the clauses we discussed.', lastUpdated: '2026-10-16T14:40:00Z', senderName: 'Emma Watson', senderEmail: 'emma.w@lawfirm.com', aiSummary: 'Emma sent updated contract v2 with discussed clauses attached.', extractedTasks: ['Review Contract Revision v2'] },
  ];

  const selectedThread = threads.find(t => t.threadId === selectedThreadId);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <h1 className="page-title">Inbox</h1>
      <div className="inbox-layout">
        <div className="inbox-sidebar">
          {threads.length === 0 ? (
             <div className="empty-state">
               <h3>Inbox Zero! 🎉</h3>
               <p>You're all caught up on your emails.</p>
             </div>
          ) : (
            threads.map(thread => (
              <div 
                key={thread.threadId} 
                className={`email-item ${selectedThreadId === thread.threadId ? 'selected' : ''}`}
                onClick={() => setSelectedThreadId(thread.threadId)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="email-subject" style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {thread.subject}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatTime(thread.lastUpdated)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="email-sender" style={{ color: 'var(--text-main)' }}>{thread.senderName || 'Unknown Sender'}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {thread.snippet}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="inbox-main">
          {selectedThread ? (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{selectedThread.subject}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                <div className="avatar">
                  {(selectedThread.senderName || 'U').charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{selectedThread.senderName}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedThread.senderEmail}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {formatTime(selectedThread.lastUpdated)}
                </div>
              </div>

              {/* AI Enhancements Block */}
              <div className="ai-summary-block">
                <div className="ai-summary-title">
                  <Bot size={18} /> AI Summary
                </div>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {selectedThread.aiSummary}
                </p>
                
                {selectedThread.extractedTasks && selectedThread.extractedTasks.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                     <div className="ai-summary-title" style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
                       <CheckSquare size={16} /> Extracted Tasks
                     </div>
                     <ul style={{ paddingLeft: '24px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                       {selectedThread.extractedTasks.map((t, i) => <li key={i}>{t}</li>)}
                     </ul>
                  </div>
                )}
              </div>

              <div style={{ color: 'var(--text-main)', lineHeight: '1.6' }}>
                <p>{selectedThread.snippet}</p>
                <br/>
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>[Full raw email content would be mapped from Gmail payload here...]</p>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>Select a thread to read</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;
