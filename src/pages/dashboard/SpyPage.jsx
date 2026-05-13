// src/pages/dashboard/SpyPage.jsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/lib/firebase';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressStep({ stage, message, active, done }) {
  const icons = {
    resolve: '🔍',
    harvest: '📦',
    dna: '🧬',
    patterns: '🕸️',
    voice: '🎙️',
    steal: '🃏',
    done: '✅',
  };
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 0',
        opacity: done ? 1 : active ? 1 : 0.45,
      }}
    >
      <span style={{ fontSize: '18px' }}>{icons[stage] || '⏳'}</span>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--text-primary)',
        }}
      >
        {message}
      </span>
      {done ? (
        <span style={{ marginLeft: 'auto', color: '#22c55e', fontSize: '13px' }}>✓</span>
      ) : (
        <>
          {active && (
            <motion.span
              style={{
                marginLeft: 'auto',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: 'var(--color-primary, #e07b39)',
                display: 'inline-block',
              }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          )}
        </>
      )}
    </motion.div>
  );
}

function PatternCard({ pattern }) {
  const badgeColors = {
    HOT: { bg: '#fef2f2', text: '#dc2626' },
    RISING: { bg: '#f0fdf4', text: '#16a34a' },
    COOLING: { bg: '#eff6ff', text: '#2563eb' },
    STABLE: { bg: '#fafafa', text: '#6b7280' },
  };
  const badge = pattern.trendBadge ? badgeColors[pattern.trendBadge] : null;
  const typeLabel = pattern.type === 'topic' ? '📌 Topic' : '🎣 Hook Formula';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-border)',
        borderRadius: '12px',
        padding: '16px',
        minWidth: '220px',
        maxWidth: '260px',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-secondary, #888)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {typeLabel}
        </span>
        {!!badge && (
          <span
            style={{
              background: badge.bg,
              color: badge.text,
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '99px',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
            }}
          >
            {pattern.trendBadge}
          </span>
        )}
      </div>
      <p
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '15px',
          color: 'var(--text-primary)',
          margin: '0 0 6px 0',
          lineHeight: '1.3',
        }}
      >
        {pattern.label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          color: 'var(--text-secondary, #888)',
          margin: 0,
        }}
      >
        {pattern.description || `Used by ${pattern.frequency}/${pattern.totalCompetitors} creators`}
      </p>
    </motion.div>
  );
}

function StealCard({ card, onSteal }) {
  const { post, stealAngle, suggestedIdea, suggestedAngle, voiceRulesApplied } = card;
  const dnaColor =
    (post.dnaScore || 0) >= 70
      ? '#22c55e'
      : (post.dnaScore || 0) >= 50
      ? '#f59e0b'
      : '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-border)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Header — competitor info */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--border-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'var(--border-border)',
            border: '1px solid rgba(0,0,0,0.08)',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {!!post.thumbnailUrl && (
            <img
              src={post.thumbnailUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '13px',
              color: 'var(--text-primary)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            @{post.competitorHandle ?? ''}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              color: 'var(--text-secondary, #888)',
              margin: 0,
            }}
          >
            {(post.views || 0).toLocaleString()} views · {post.platform ?? ''}
          </p>
        </div>
        {!!(post.dnaScore) && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '20px',
                color: dnaColor,
                margin: 0,
                lineHeight: 1,
              }}
            >
              {post.dnaScore}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                color: 'var(--text-secondary, #888)',
                margin: 0,
              }}
            >
              DNA
            </p>
          </div>
        )}
      </div>

      {/* Content — two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {/* Left — competitor */}
        <div style={{ padding: '14px', borderRight: '1px solid var(--border-border)' }}>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '10px',
              color: 'var(--text-secondary, #888)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              margin: '0 0 6px 0',
            }}
          >
            Their Post
          </p>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'var(--text-primary)',
              margin: '0 0 8px 0',
              lineHeight: '1.4',
            }}
          >
            {(post.hookText ?? '').slice(0, 100)}
            {(post.hookText ?? '').length > 100 ? '…' : ''}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              color: '#f59e0b',
              margin: 0,
            }}
          >
            💡 {stealAngle}
          </p>
        </div>

        {/* Right — your rewrite */}
        <div style={{ padding: '14px' }}>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '10px',
              color: 'var(--text-secondary, #888)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              margin: '0 0 6px 0',
            }}
          >
            Your Version
          </p>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'var(--text-primary)',
              margin: '0 0 8px 0',
              lineHeight: '1.4',
              fontStyle: 'italic',
            }}
          >
            {(suggestedIdea ?? '').slice(0, 100)}
            {(suggestedIdea ?? '').length > 100 ? '…' : ''}
          </p>
          {!!(voiceRulesApplied ?? []).length && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {(voiceRulesApplied ?? []).slice(0, 3).map((rule) => (
                <span
                  key={rule}
                  style={{
                    background: '#f0fdf4',
                    color: '#16a34a',
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '99px',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {rule}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-border)' }}>
        <button
          onClick={() => onSteal(card)}
          style={{
            width: '100%',
            background: 'var(--color-primary, #e07b39)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '10px',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Steal This → Open in Studio
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SpyPage() {
  const navigate = useNavigate();

  const [view, setView] = useState('setup'); // 'setup' | 'loading' | 'report'
  const [handlesInput, setHandlesInput] = useState('');
  const [platform, setPlatform] = useState('auto');
  const [progressSteps, setProgressSteps] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [recentSessions, setRecentSessions] = useState([]);

  // Load recent sessions on mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const token = await currentUser.getIdToken();
        const res = await fetch(`${API}/api/v1/rival/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setRecentSessions(data.data?.sessions || []);
      } catch {}
    };
    loadSessions();
  }, []);

  const handleSpy = async () => {
    const handles = handlesInput
      .split(/[\n,]+/)
      .map((h) => h.trim())
      .filter((h) => h.length > 0);

    if (handles.length === 0) {
      setError('Please enter at least one handle');
      return;
    }
    if (handles.length > 8) {
      setError('Maximum 8 handles per session');
      return;
    }

    setError('');
    setProgressSteps([]);
    setView('loading');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Not authenticated');
      const token = await currentUser.getIdToken();

      // EventSource doesn't support POST — use fetch with ReadableStream
      const res = await fetch(`${API}/api/v1/rival/spy/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ handles, platform }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'progress') {
              setProgressSteps((prev) => {
                const exists = prev.find((s) => s.stage === event.stage);
                if (exists) {
                  return prev.map((s) =>
                    s.stage === event.stage ? { ...event, done: event.done || false } : s,
                  );
                }
                return [...prev, { ...event, done: event.done || false }];
              });
            } else if (event.type === 'report') {
              setReport(event.data);
            } else if (event.type === 'done') {
              setView('report');
            } else if (event.type === 'error') {
              throw new Error(event.message);
            }
          } catch (parseErr) {
            // ignore malformed SSE lines
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setView('setup');
    }
  };

  const handleSteal = (card) => {
    navigate('/dashboard/studio', {
      state: {
        prefillIdea: card.suggestedIdea,
        prefillAngle: card.suggestedAngle,
        source: 'rival_steal',
        rivalHandle: card.post.competitorHandle,
      },
    });
  };

  const containerStyle = {
    maxWidth: '760px',
    margin: '0 auto',
    padding: '24px 16px 80px',
    fontFamily: 'var(--font-body)',
  };

  return (
    <div style={containerStyle}>
      <AnimatePresence mode="wait">
        {view === 'setup' ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '28px',
                  color: 'var(--text-primary)',
                  margin: '0 0 8px 0',
                }}
              >
                🕵️ Spy on Rivals
              </h1>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary, #888)', margin: 0 }}>
                Drop competitor handles. ARIA analyses what's working and rewrites it in your voice.
              </p>
            </div>

            {/* Handle input */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-border)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '16px',
              }}
            >
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  display: 'block',
                  marginBottom: '10px',
                }}
              >
                Competitor Handles
              </label>
              <textarea
                value={handlesInput}
                onChange={(e) => setHandlesInput(e.target.value)}
                placeholder={'@filmyvaibhav\n@techburner\nyoutube.com/c/carribean'}
                rows={4}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid var(--border-border)',
                  borderRadius: '10px',
                  padding: '12px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary, #888)',
                  margin: '8px 0 0 0',
                }}
              >
                One per line or comma-separated. Mix Instagram and YouTube. Max 8.
              </p>
            </div>

            {/* Platform toggle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {['auto', 'instagram', 'youtube'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '99px',
                    border: `1px solid ${platform === p ? 'var(--color-primary, #e07b39)' : 'var(--border-border)'}`,
                    background:
                      platform === p ? 'var(--color-primary, #e07b39)' : 'transparent',
                    color: platform === p ? '#fff' : 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {p === 'auto'
                    ? '🔀 Auto-detect'
                    : p === 'instagram'
                    ? '📸 Instagram'
                    : '▶️ YouTube'}
                </button>
              ))}
            </div>

            {!!error && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                }}
              >
                <p style={{ color: '#dc2626', fontSize: '13px', margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              onClick={() => handleSpy()}
              style={{
                width: '100%',
                background: 'var(--color-primary, #e07b39)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
                letterSpacing: '0.01em',
              }}
            >
              Run Rival Spy →
            </button>

            {/* Recent sessions */}
            {!!recentSessions.length && (
              <div style={{ marginTop: '32px' }}>
                <p
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary, #888)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '12px',
                  }}
                >
                  Recent Sessions
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {recentSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setHandlesInput((session.handles ?? []).join('\n'))}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-border)',
                        borderRadius: '99px',
                        padding: '6px 14px',
                        fontFamily: 'var(--font-body)',
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      {(session.handles ?? []).slice(0, 2).join(', ')}
                      {(session.handles ?? []).length > 2
                        ? ` +${(session.handles ?? []).length - 2}`
                        : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : view === 'loading' ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ maxWidth: '480px', margin: '0 auto', paddingTop: '40px' }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '22px',
                color: 'var(--text-primary)',
                marginBottom: '24px',
              }}
            >
              Running Rival Intelligence...
            </h2>
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-border)',
                borderRadius: '16px',
                padding: '20px',
              }}
            >
              {!!progressSteps.length && progressSteps.map((step, idx) => (
                <ProgressStep
                  key={step.stage}
                  stage={step.stage}
                  message={step.message}
                  active={idx === progressSteps.length - 1 && !step.done}
                  done={!!step.done}
                />
              ))}
              {!progressSteps.length && (
                <ProgressStep
                  stage="resolve"
                  message="Starting analysis..."
                  active={true}
                  done={false}
                />
              )}
            </div>
          </motion.div>
        ) : (
          <>
            {!!report && (
              <motion.div
                key="report"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Report header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '28px',
                  }}
                >
                  <div>
                    <h1
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '26px',
                        color: 'var(--text-primary)',
                        margin: '0 0 6px 0',
                      }}
                    >
                      Rival Intel Report
                    </h1>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary, #888)',
                        margin: 0,
                      }}
                    >
                      {report.totalPostsAnalysed ?? 0} posts analysed ·{' '}
                      {(report.handles ?? []).filter((h) => h.resolved).length} creators · avg
                      DNA {report.avgDnaScore ?? 0}/100
                    </p>
                  </div>
                  <button
                    onClick={() => setView('setup')}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-border)',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      fontFamily: 'var(--font-body)',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    New Spy
                  </button>
                </div>

                {/* Niche Map — horizontal scroll of pattern cards */}
                {!!(report.nichePatterns ?? []).length && (
                  <div style={{ marginBottom: '36px' }}>
                    <h2
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '18px',
                        color: 'var(--text-primary)',
                        margin: '0 0 14px 0',
                      }}
                    >
                      🕸️ Niche Map
                    </h2>
                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        overflowX: 'auto',
                        paddingBottom: '8px',
                      }}
                    >
                      {(report.nichePatterns ?? []).map((pattern, idx) => (
                        <PatternCard key={`${pattern.type}-${idx}`} pattern={pattern} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Gap opportunities */}
                {!!(report.gapOpportunities ?? []).length && (
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-border)',
                      borderRadius: '14px',
                      padding: '18px',
                      marginBottom: '36px',
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '18px',
                        color: 'var(--text-primary)',
                        margin: '0 0 12px 0',
                      }}
                    >
                      🎯 Your Gap Opportunities
                    </h2>
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary, #888)',
                        margin: '0 0 12px 0',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      Topics none of the {(report.handles ?? []).filter((h) => h.resolved).length}{' '}
                      competitors covered. First-mover advantage.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(report.gapOpportunities ?? []).map((gap, idx) => (
                        <div
                          key={`gap-${idx}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 14px',
                            background: '#f0fdf4',
                            borderRadius: '10px',
                          }}
                        >
                          <span style={{ fontSize: '16px' }}>🌱</span>
                          <span
                            style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: '13px',
                              color: '#166534',
                              flex: 1,
                            }}
                          >
                            {gap}
                          </span>
                          <button
                            onClick={() =>
                              navigate('/dashboard/studio', {
                                state: { prefillIdea: gap, source: 'rival_gap' },
                              })
                            }
                            style={{
                              background: '#16a34a',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontFamily: 'var(--font-body)',
                              fontSize: '12px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Create →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Steal Cards */}
                {!!(report.stealCards ?? []).length && (
                  <div style={{ marginBottom: '36px' }}>
                    <h2
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '18px',
                        color: 'var(--text-primary)',
                        margin: '0 0 6px 0',
                      }}
                    >
                      🃏 Steal Cards
                    </h2>
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary, #888)',
                        fontFamily: 'var(--font-body)',
                        margin: '0 0 16px 0',
                      }}
                    >
                      Top-performing posts ranked by DNA score. Tap to pre-fill Studio.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {(report.stealCards ?? []).map((card, idx) => (
                        <StealCard
                          key={`steal-${card.post?.postId ?? idx}`}
                          card={card}
                          onSteal={handleSteal}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Overserved topics */}
                {!!(report.overservedTopics ?? []).length && (
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-border)',
                      borderRadius: '14px',
                      padding: '18px',
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '16px',
                        color: 'var(--text-primary)',
                        margin: '0 0 10px 0',
                      }}
                    >
                      ⚠️ Overserved Topics
                    </h2>
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary, #888)',
                        fontFamily: 'var(--font-body)',
                        margin: '0 0 10px 0',
                      }}
                    >
                      Saturated — avoid unless you have a unique angle.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(report.overservedTopics ?? []).map((topic, idx) => (
                        <span
                          key={`over-${idx}`}
                          style={{
                            background: '#fef2f2',
                            color: '#dc2626',
                            fontSize: '12px',
                            padding: '4px 12px',
                            borderRadius: '99px',
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
