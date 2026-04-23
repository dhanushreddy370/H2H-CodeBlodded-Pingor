import React, { useEffect, useState } from 'react';
import { Search, Sparkles, ArrowLeft, Mail, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

const SmartSearch = ({ onBack = () => {} }) => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [queries, setQueries] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/search/demo-queries`)
      .then((res) => res.json())
      .then((data) => setQueries(data.queries || []))
      .catch(console.error);
  }, []);

  const runSearch = async (nextPrompt = prompt) => {
    const userId = user?.userId || user?.id || user?.sub;
    if (!userId || !nextPrompt) return;

    setLoading(true);
    setPrompt(nextPrompt);
    try {
      const res = await fetch(`${API_BASE}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, prompt: nextPrompt })
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tasks-page" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        width: '100%',
        marginBottom: '32px',
        gap: '20px'
      }}>
        {/* Left Side: Back Button */}
        <div style={{ flex: '0 0 120px' }}>
          <button className="button-secondary" onClick={onBack} style={{ whiteSpace: 'nowrap' }}>
            <ArrowLeft size={18} /> Back
          </button>
        </div>

        {/* Center: Search Bar and Button */}
        <div style={{ flex: '1', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            width: '100%', 
            maxWidth: '750px',
            background: 'var(--bg-card)',
            padding: '6px',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <Search 
                size={20} 
                style={{ 
                  marginLeft: '12px',
                  color: 'var(--text-muted)',
                  flexShrink: 0
                }} 
              />
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                placeholder="Find all emails from Ravi about the budget..."
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  height: '44px',
                  fontSize: '1rem',
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  color: 'var(--text-main)'
                }}
              />
            </div>
            <button 
              className="button" 
              onClick={() => runSearch()} 
              disabled={loading}
              style={{ 
                height: '44px', 
                padding: '0 24px', 
                borderRadius: '12px',
                flexShrink: 0
              }}
            >
              {loading ? 'Searching...' : 'Run Search'}
            </button>
          </div>
        </div>

        {/* Right Side: Spacer for perfect centering */}
        <div style={{ flex: '0 0 120px' }} className="mobile-hide"></div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Sparkles size={18} color="var(--primary)" />
          <h3 className="section-title" style={{ margin: 0 }}>Demo Search Prompts</h3>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {queries.map((query) => (
            <button
              key={query}
              onClick={() => runSearch(query)}
              className="button-secondary"
              style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem' }}
            >
              {query}
            </button>
          ))}
        </div>
      </div>

      {results && (
        <>
          <div className="card" style={{ padding: '24px' }}>
            <h3 className="section-title" style={{ marginTop: 0 }}>Search Interpretation</h3>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.86rem', color: 'var(--text-main)', background: '#f8fafc', borderRadius: '16px', padding: '16px', border: '1px solid var(--border)' }}>
              {JSON.stringify(results.filters, null, 2)}
            </pre>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <Mail size={18} color="var(--primary)" />
              <h3 className="section-title" style={{ margin: 0 }}>Results ({results.count})</h3>
            </div>
            {results.results.length > 0 ? (
              results.results.map((thread) => (
                <div key={thread._id} style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{thread.subject || 'Untitled thread'}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: thread.priority >= 4 ? '#b91c1c' : 'var(--primary)' }}>
                      P{thread.priority || 3}
                    </div>
                  </div>
                  <div style={{ marginTop: '6px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {thread.sender || 'Unknown sender'} • {thread.categoryTag || 'unclassified'}{thread.needsFollowUp ? ' • waiting on you' : ''}
                  </div>
                  <div style={{ marginTop: '8px', color: 'var(--text-main)' }}>{thread.snippet || thread.aiSummary || 'No snippet available.'}</div>
                </div>
              ))
            ) : (
              <div style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                <AlertTriangle size={16} /> No threads matched this natural-language query.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SmartSearch;
