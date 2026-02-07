import React, { useEffect, useState } from 'react';
import { useStats } from '../hooks/useStats';
import { LogEntry } from '../types';

interface SystemStatusProps {
  isConnected: boolean;
  mcpReady: boolean;
  initialized: boolean;
  version?: string;
  logs?: LogEntry[];
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ isConnected, mcpReady, initialized, version, logs = [] }) => {
  const { stats } = useStats();
  const [workerVersion, setWorkerVersion] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/version')
      .then(res => res.json())
      .then(data => setWorkerVersion(data.version))
      .catch(() => setWorkerVersion('Unknown'));
  }, []);

  return (
    <div className="status-container">
      <h2 className="status-title">System Status</h2>

      <div className="status-grid">
        {/* Worker Service Status */}
        <div className="status-card">
          <div className="status-card-label">Worker Service</div>
          <div className="status-card-value">
            <span className={`status-dot ${isConnected ? 'connected' : ''}`}></span>
            <span className="status-text">{isConnected ? 'Online' : 'Offline'}</span>
          </div>
          <div className="status-card-meta">Version: {workerVersion || '...'}</div>
        </div>

        {/* Database Status */}
        <div className="status-card">
          <div className="status-card-label">Database</div>
          <div className="status-card-value">
            <span className={`status-dot ${initialized ? 'connected' : ''}`}></span>
            <span className="status-text">{initialized ? 'Ready' : 'Initializing...'}</span>
          </div>
          <div className="status-card-meta">Sessions: {stats?.totalSessions || 0}</div>
        </div>

        {/* MCP / Gemini Status */}
        <div className="status-card">
          <div className="status-card-label">MCP Integration</div>
          <div className="status-card-value">
            <span className={`status-dot ${mcpReady ? 'connected' : ''}`}></span>
            <span className="status-text">{mcpReady ? 'Connected' : 'Waiting...'}</span>
          </div>
          <div className="status-card-meta">Gemini / Claude Code</div>
        </div>

        {/* OpenCode Plugin Status */}
        <div className="status-card">
          <div className="status-card-label">OpenCode Plugin</div>
          <div className="status-card-value">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">{isConnected ? 'Ready' : 'Unknown'}</span>
          </div>
          <div className="status-card-meta">Via HTTP Proxy</div>
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2 className="status-title">Live Logs</h2>
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-primary)',
          borderRadius: '8px',
          height: '400px',
          overflowY: 'auto',
          fontFamily: 'var(--font-terminal)',
          fontSize: '12px',
          padding: '16px'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>
              Waiting for logs...
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {log.timestamp.split(' ')[1]}
                </span>
                <span style={{
                  color: log.level === 'ERROR' ? 'var(--color-accent-error)' :
                         log.level === 'WARN' ? 'var(--color-accent-summary)' :
                         'var(--color-text-secondary)',
                  width: '50px',
                  display: 'inline-block',
                  fontWeight: 600
                }}>
                  [{log.level}]
                </span>
                <span style={{ color: 'var(--color-accent-primary)', width: '80px', display: 'inline-block' }}>
                  [{log.component}]
                </span>
                <span style={{ color: 'var(--color-text-primary)' }}>
                  {log.message}
                </span>
                {log.data && (
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    {log.data}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
