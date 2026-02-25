import React, { useEffect, useState } from 'react';

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
}

export function DashboardPage() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/system/info')
      .then(res => res.json())
      .then(data => {
        setInfo(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load system info');
        setLoading(false);
      });
  }, []);

  const renderTree = (node: any, depth = 0) => {
    if (!node) return null;
    const paddingLeft = depth * 20;

    return (
      <div key={node.name} style={{ marginLeft: depth > 0 ? '12px' : 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '2px 0',
          fontSize: '13px',
          color: node.type === 'directory' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)'
        }}>
          <span>{node.type === 'directory' ? '📁' : '📄'}</span>
          <span>{node.name}</span>
        </div>
        {node.children && node.children.map((child: any) => renderTree(child, depth + 1))}
      </div>
    );
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading dashboard...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-accent-error)' }}>{error}</div>;
  if (!info) return null;

  const isEndlessMode = info.git.branch?.includes('beta');

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-header)', marginBottom: '24px' }}>System Dashboard</h2>

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
            BETA FEATURE
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
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Unlimited (Disk)</div>
            </div>
          </div>
          <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Endless Mode is active. Tool outputs are being compressed in real-time to preserve context window space.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

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
