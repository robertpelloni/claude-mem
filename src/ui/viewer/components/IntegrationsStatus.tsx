import React, { useEffect, useState } from 'react';
import type { IntegrationStatus } from '../types';

export function IntegrationsStatus() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/integrations/status');
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch integration status:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
    // Poll every 30s
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ padding: '16px', color: 'var(--color-text-muted)' }}>Loading integration status...</div>;
  if (!status) return <div style={{ padding: '16px', color: 'var(--color-accent-error)' }}>Failed to load status</div>;

  return (
    <div className="settings-section">
      <h3>Integrations</h3>

      {/* Chroma Status */}
      <div className="integration-card" style={{
        marginBottom: '16px',
        padding: '12px',
        border: '1px solid var(--color-border-primary)',
        borderRadius: '6px',
        backgroundColor: 'var(--color-bg-tertiary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '13px' }}>Chroma Vector DB</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: status.chroma.connected ? 'var(--color-accent-success)' : 'var(--color-accent-error)' }}>
              {status.chroma.connected ? 'Connected' : 'Disconnected'}
            </span>
            <div className={`status-dot ${status.chroma.connected ? 'connected' : ''}`} />
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          {status.chroma.error ? (
            <div style={{ color: 'var(--color-accent-error)', marginTop: '4px' }}>{status.chroma.error}</div>
          ) : (
            <>
              {status.chroma.itemCount !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span>Vectors Indexed:</span>
                  <span style={{ fontFamily: 'monospace' }}>{status.chroma.itemCount.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span>Collection:</span>
                <span style={{ fontFamily: 'monospace' }}>{status.chroma.collectionName}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* OpenCode Plugin Status */}
      <div className="integration-card" style={{
        padding: '12px',
        border: '1px solid var(--color-border-primary)',
        borderRadius: '6px',
        backgroundColor: 'var(--color-bg-tertiary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '13px' }}>OpenCode Plugin</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Client-Side</span>
            <div className="status-dot" style={{ backgroundColor: 'var(--color-text-muted)', animation: 'none' }} />
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          <div style={{ lineHeight: '1.4' }}>
            Status is managed by the OpenCode client. Ensure the plugin is installed in your project.
          </div>
          <div style={{ marginTop: '8px', fontSize: '11px', fontFamily: 'monospace', padding: '4px', background: 'var(--color-bg-input)', borderRadius: '4px' }}>
            npm install @opencode-ai/plugin
          </div>
        </div>
      </div>
    </div>
  );
}
