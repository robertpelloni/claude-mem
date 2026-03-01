import React, { useEffect, useState } from 'react';
import { TimelineControl } from './TimelineControl';

interface SystemInfo {
  dependencies: Record<string, string>;
  git: {
    branch: string | null;
    commit: string | null;
    remote: string | null;
  };
  structure: {
    name: string;
    type: 'directory' | 'file';
    children: any[];
  } | null;
  endlessMode?: {
    active: boolean;
    savings: number;
    sessions: number;
    observations: number;
  };
}

interface Analytics {
  topFiles: Array<{ name: string; count: number }>;
  topConcepts: Array<{ name: string; count: number }>;
}

export function DashboardPage() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeEpoch, setTimeEpoch] = useState<number>(Date.now());
  const [minEpoch, setMinEpoch] = useState<number | undefined>(undefined);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Query params for time travel
        const timeQuery = timeEpoch < Date.now() - 5000 ? `?before_epoch=${timeEpoch}` : '';

        const [sysRes, analRes] = await Promise.all([
          fetch(`/api/system/info${timeQuery}`),
          fetch(`/api/analytics${timeQuery}`)
        ]);

        if (sysRes.ok) {
          setInfo(await sysRes.json());
        }

        if (analRes.ok) {
          setAnalytics(await analRes.json());
        }

        setLoading(false);

        // On first load, try to guess the min epoch for the slider from the oldest file change or just set a default 30 day window
        if (minEpoch === undefined) {
            setMinEpoch(Date.now() - (30 * 24 * 60 * 60 * 1000));
        }

      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    loadData();
  }, [timeEpoch]);

  const renderTree = (node: any, depth = 0) => {
    if (!node) return null;
    const paddingLeft = depth * 20;

    // Check if this file is in top active files
    const fileStats = node.type === 'file' && analytics
      ? analytics.topFiles.find(f => f.name === node.name)
      : null;

    // Determine heat color (simplified)
    const heatColor = fileStats ? `rgba(217, 119, 87, ${Math.min(0.2 + (fileStats.count * 0.05), 0.8)})` : 'transparent';
    const heatBorder = fileStats ? `1px solid rgba(217, 119, 87, ${Math.min(0.5 + (fileStats.count * 0.05), 1)})` : '1px solid transparent';

    return (
      <div key={node.name} style={{ marginLeft: depth > 0 ? '12px' : 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          padding: '2px 4px',
          fontSize: '13px',
          color: node.type === 'directory' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
          background: heatColor,
          border: heatBorder,
          borderRadius: '4px',
          marginBottom: '2px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{node.type === 'directory' ? '📁' : '📄'}</span>
            <span>{node.name}</span>
          </div>
          {fileStats && (
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-accent-primary)' }} title={`${fileStats.count} changes`}>
              🔥 {fileStats.count}
            </span>
          )}
        </div>
        {node.children && node.children.map((child: any) => renderTree(child, depth + 1))}
      </div>
    );
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading dashboard...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-accent-error)' }}>{error}</div>;
  if (!info) return null;

  const isEndlessMode = info.git.branch?.includes('beta') || (info.endlessMode && info.endlessMode.active);

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-header)', marginBottom: '24px' }}>System Dashboard</h2>

      <TimelineControl
        currentEpoch={timeEpoch}
        onChange={setTimeEpoch}
        minEpoch={minEpoch}
        maxEpoch={Date.now()}
      />

      {/* Endless Mode Visualization */}
      {isEndlessMode && (
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-primary)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: 'var(--color-accent-primary)',
            color: 'white',
            fontSize: '10px',
            fontWeight: 600,
            padding: '4px 8px',
            borderBottomLeftRadius: '8px'
          }}>
            {info.endlessMode ? 'ACTIVE' : 'BETA FEATURE'}
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>
            Endless Mode Simulation
          </h3>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Working Memory</div>
              <div style={{ height: '8px', background: 'var(--color-bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '15%', height: '100%', background: 'var(--color-accent-success)' }}></div>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>~500 tokens (Compressed)</div>
            </div>
            <div style={{ fontSize: '20px', color: 'var(--color-text-muted)' }}>→</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Archive Memory</div>
              <div style={{ height: '8px', background: 'var(--color-bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '85%', height: '100%', background: 'var(--color-accent-primary)' }}></div>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {info.endlessMode
                  ? `${info.endlessMode.savings.toLocaleString()} tokens (Saved) • ${info.endlessMode.observations.toLocaleString()} items`
                  : 'Unlimited (Disk)'}
              </div>
            </div>
          </div>
          <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Endless Mode is active. Tool outputs are being compressed in real-time to preserve context window space.
            {info.endlessMode && ` Total sessions: ${info.endlessMode.sessions}`}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', gridAutoRows: 'minmax(min-content, max-content)' }}>

        {/* Analytics Section */}
        {analytics && (
          <>
            <div style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border-primary)',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>
                Top Concepts
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {analytics.topConcepts.length === 0 ? (
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No concepts found</span>
                ) : (
                  analytics.topConcepts.map((c) => (
                    <span key={c.name} style={{
                      fontSize: '12px',
                      background: 'var(--color-bg-tertiary)',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border-primary)'
                    }}>
                      {c.name} <span style={{ opacity: 0.6 }}>({c.count})</span>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border-primary)',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>
                Most Active Files
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analytics.topFiles.length === 0 ? (
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No file activity recorded</span>
                ) : (
                  analytics.topFiles.map((f) => (
                    <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>{f.name}</span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{f.count} changes</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Git Info */}
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-primary)',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>
            Version Control
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Branch:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{info.git.branch || 'Unknown'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Commit:</span>
              <span style={{ fontFamily: 'monospace' }}>{info.git.commit?.substring(0, 7) || 'Unknown'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Remote:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{info.git.remote || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Project Structure */}
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-primary)',
          borderRadius: '8px',
          padding: '20px',
          gridRow: 'span 2'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>
            Project Structure
          </h3>
          <div style={{
            fontFamily: 'monospace',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {renderTree(info.structure)}
          </div>
        </div>

        {/* Dependencies */}
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-primary)',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>
            Dependencies ({Object.keys(info.dependencies).length})
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {Object.entries(info.dependencies).map(([name, version]) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--color-text-primary)' }}>{name}</span>
                <span style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{version}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
