import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, CalendarDays, Sparkles, ClipboardList, Clock, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

const normalizeMarkdownText = (markdown = '') =>
  String(markdown)
    .replace(/â€”/g, ' - ')
    .replace(/•/g, ' • ');

const renderDigestMarkdown = (markdown = '') => {
  const normalized = normalizeMarkdownText(markdown);
  const lines = normalized.split('\n');
  const blocks = [];
  let listItems = [];
  let listKey = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    const nextKey = listKey++;
    blocks.push(
      <ul key={`list-${nextKey}`} className="digest-markdown-list">
        {listItems.map((item, index) => (
          <li key={`item-${nextKey}-${index}`}>{item}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    if (line.startsWith('# ')) {
      flushList();
      blocks.push(<h1 key={`h1-${index}`}>{line.slice(2)}</h1>);
      return;
    }

    if (line.startsWith('## ')) {
      flushList();
      blocks.push(<h2 key={`h2-${index}`}>{line.slice(3)}</h2>);
      return;
    }

    if (line.startsWith('- ')) {
      listItems.push(line.slice(2));
      return;
    }

    flushList();
    blocks.push(<p key={`p-${index}`}>{line}</p>);
  });

  flushList();
  return blocks;
};

const DailyDigest = ({ onBack = () => {} }) => {
  const { user } = useAuth();
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchDigest = useCallback(async () => {
    const userId = user?.userId || user?.id || user?.sub;
    if (!userId) return;

    try {
      const res = await fetch(`${API_BASE}/api/digest?userId=${userId}`);
      const data = await res.json();
      setDigest(data);
    } catch (err) {
      console.error('Failed to load digest', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDigest();
  }, [fetchDigest]);

  const copyDigest = async () => {
    if (!digest?.markdown) return;
    await navigator.clipboard.writeText(digest.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return <div className="card" style={{ padding: '32px' }}>Loading daily digest...</div>;
  }

  return (
    <div className="tasks-page" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="button-secondary" onClick={onBack}>
          <ArrowLeft size={18} /> Back
        </button>
        <button className="button" onClick={copyDigest}>
          <Copy size={16} /> {copied ? 'Copied' : 'Copy Markdown'}
        </button>
      </div>

      <div
        className="card"
        style={{
          padding: '32px',
          background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--bg-card) 100%)',
          border: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '999px', background: 'rgba(var(--primary-rgb), 0.12)', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
              <Sparkles size={14} /> Daily Digest
            </div>
            <h2 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>Executive summary for today</h2>
            <p style={{ margin: '12px 0 0', color: 'var(--text-muted)', fontSize: '1rem' }}>
              Generated on {new Date(digest?.generatedAt || Date.now()).toLocaleString()}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', minWidth: '280px', flex: 1 }}>
            {(digest?.overview || []).map((item) => (
              <div
                key={item}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--surface-outline)',
                  borderRadius: '18px',
                  padding: '16px 18px',
                  boxShadow: 'var(--shadow)'
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>{item.split(':')[0]}</div>
                <div style={{ marginTop: '6px', fontSize: '1.1rem', fontWeight: 900 }}>{item.split(':').slice(1).join(':').trim()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <ClipboardList size={20} color="var(--primary)" />
            <h3 className="section-title" style={{ margin: 0 }}>Critical Actions</h3>
          </div>
          {(digest?.urgentTasks || []).length > 0 ? (
            digest.urgentTasks.map((task) => (
              <div key={task._id} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 800 }}>{task.action || task.subject || 'Untitled task'}</div>
                <div style={{ marginTop: '6px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  P{task.priority || 3}{task.deadline ? ` • due ${new Date(task.deadline).toLocaleDateString()}` : ' • no deadline'}
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No urgent tasks right now.</p>
          )}
        </div>

        <div className="card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Clock size={20} color="var(--primary)" />
            <h3 className="section-title" style={{ margin: 0 }}>Follow-ups Due</h3>
          </div>
          {(digest?.followUps || []).length > 0 ? (
            digest.followUps.map((thread) => (
              <div key={thread._id} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 800 }}>{thread.subject || 'Untitled thread'}</div>
                <div style={{ marginTop: '6px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {thread.sender || 'Unknown sender'}{thread.followUpReason ? ` • ${thread.followUpReason}` : ''}
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Nothing is overdue for response.</p>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <CalendarDays size={20} color="var(--primary)" />
          <h3 className="section-title" style={{ margin: 0 }}>Digest Preview</h3>
        </div>
        <div className="digest-markdown-preview">
          {renderDigestMarkdown(digest?.markdown)}
        </div>
      </div>
    </div>
  );
};

export default DailyDigest;
