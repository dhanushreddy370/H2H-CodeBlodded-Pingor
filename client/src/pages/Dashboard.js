import React from 'react';
import { Mail, CheckCircle, Clock } from 'lucide-react';

const Dashboard = ({ setActivePage }) => {
  const recentActions = [
    { id: 1, action: 'Drafted reply to "Project Proposal"', time: '10 mins ago' },
    { id: 2, action: 'Categorized 15 incoming emails', time: '1 hour ago' },
    { id: 3, action: 'Follow-up sent automatically to Client XYZ', time: '2 hours ago' },
    { id: 4, action: 'Extracted task: "Review Q3 marketing assets"', time: '3 hours ago' },
    { id: 5, action: 'Sent meeting invite to Marketing Team', time: '5 hours ago' },
    { id: 6, action: 'Archived 42 promotional emails', time: '6 hours ago' },
    { id: 7, action: 'Drafted response to "Urgent: Server Outage"', time: 'Yesterday' },
    { id: 8, action: 'Extracted task: "Update project timeline"', time: 'Yesterday' },
    { id: 9, action: 'Categorized 8 incoming emails as Finance', time: 'Yesterday' },
    { id: 10, action: 'Follow-up sent to Alice Smith', time: '2 days ago' },
    { id: 11, action: 'Summarized long thread: "Weekly sync notes"', time: '2 days ago' }
  ];

  const stats = { emailsProcessed: 438, tasksPending: 6, followUpsNeeded: 12 };

  const prompts = [
    "Show my pending tasks",
    "Summarize today's emails",
    "Find emails from Ravi"
  ];

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      
      <div className="quick-actions">
        {prompts.map((p, i) => (
          <button key={i} className="quick-action-btn" onClick={() => setActivePage && setActivePage('AI Assistant')}>
             ✨ {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: '32px', marginTop: '24px' }}>
        <div className="card clickable" onClick={() => setActivePage && setActivePage('Inbox')}>
          <div className="stat-label"><Mail size={16} /> Emails Processed</div>
          <div className="stat-value">{stats.emailsProcessed}</div>
        </div>
        
        <div className="card clickable" onClick={() => setActivePage && setActivePage('Tasks')}>
          <div className="stat-label"><CheckCircle size={16} /> Tasks Pending</div>
          <div className="stat-value">{stats.tasksPending}</div>
        </div>
        
        <div className="card clickable" onClick={() => setActivePage && setActivePage('Follow-ups')}>
          <div className="stat-label"><Clock size={16} /> Follow-ups Needed</div>
          <div className="stat-value">{stats.followUpsNeeded}</div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Activity Timeline</h3>
        <div className="timeline-container">
          {recentActions.map(action => (
            <div key={action.id} className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">{action.action}</div>
              <div className="timeline-time">{action.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
