import React, { useEffect, useState } from 'react';

interface BranchInfo {
  branch: string | null;
  isBeta: boolean;
  isGitRepo: boolean;
}

export function VersionSwitcher() {
  const [info, setInfo] = useState<BranchInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/branch/status');
      if (response.ok) {
        const data = await response.json();
        setInfo(data);
      }
    } catch (e) {
      console.error('Failed to fetch branch status', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSwitch = async (branch: string) => {
    if (switching || branch === info?.branch) return;

    if (!confirm(`Switch to ${branch}? The worker will restart.`)) return;

    setSwitching(true);
    setError(null);

    try {
      const response = await fetch('/api/branch/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Switch failed');
      }

      // Reload page after a delay to allow restart
      setTimeout(() => {
        window.location.reload();
      }, 5000);

    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSwitching(false);
    }
  };

  if (loading) return <div style={{ padding: '16px', color: 'var(--color-text-muted)' }}>Loading version info...</div>;
  if (!info) return null;

  if (!info.isGitRepo) {
      return (
          <div className="settings-section">
              <h3>Version Channel</h3>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                  Version switching is not available (not a git repository).
              </div>
          </div>
      );
  }

  const currentBranch = info.branch || 'unknown';
  const isBeta = currentBranch.includes('beta');

  return (
    <div className="settings-section">
      <h3>Version Channel</h3>
      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
        Current Branch: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{currentBranch}</span>
      </div>

      {error && <div style={{ color: 'var(--color-accent-error)', marginBottom: '10px', fontSize: '12px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          disabled={switching || currentBranch === 'main'}
          onClick={() => handleSwitch('main')}
          title="Switch to the stable release channel"
          style={{
            flex: 1,
            opacity: currentBranch === 'main' ? 1 : 0.7,
            border: currentBranch === 'main' ? '1px solid var(--color-accent-success)' : undefined,
            color: currentBranch === 'main' ? 'var(--color-accent-success)' : undefined
          }}
        >
          {switching && currentBranch !== 'main' ? 'Switching...' : 'Stable'}
        </button>
        <button
          type="button"
          disabled={switching || isBeta}
          onClick={() => handleSwitch('beta/7.0')}
          title="Switch to the beta channel with experimental features"
          style={{
            flex: 1,
            opacity: isBeta ? 1 : 0.7,
            border: isBeta ? '1px solid var(--color-accent-primary)' : undefined,
            color: isBeta ? 'var(--color-accent-primary)' : undefined
          }}
        >
          {switching && !isBeta ? 'Switching...' : 'Beta (Endless Mode)'}
        </button>
      </div>

      <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
        Note: Switching branches will restart the worker service.
      </div>
    </div>
  );
}
