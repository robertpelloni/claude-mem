import React, { useState } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState('general');

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="context-settings-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', height: 'auto', maxHeight: '90vh' }}>
        <div className="modal-header">
          <h2>Help & Documentation</h2>
          <button onClick={onClose} className="modal-close-btn" title="Close (Esc)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-primary)', background: 'var(--color-bg-tertiary)' }}>
            {['General', 'Search', 'Shortcuts', 'About'].map(tab => {
                const id = tab.toLowerCase();
                return (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        style={{
                            padding: '12px 24px',
                            background: activeTab === id ? 'var(--color-bg-primary)' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === id ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
                            color: activeTab === id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                            fontWeight: activeTab === id ? 600 : 500,
                            borderRadius: 0,
                            marginBottom: -1
                        }}
                    >
                        {tab}
                    </button>
                )
            })}
          </div>

          <div style={{ padding: '24px', overflowY: 'auto', flex: 1, lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>
            {activeTab === 'general' && (
                <div>
                    <h3 style={{ color: 'var(--color-text-title)', marginBottom: '16px' }}>Claude-Mem</h3>
                    <p>Claude-Mem seamlessly preserves context across sessions by automatically capturing tool usage observations, generating semantic summaries, and making them available to future sessions.</p>

                    <h4 style={{ marginTop: '20px', marginBottom: '10px', color: 'var(--color-text-title)' }}>Key Features</h4>
                    <ul style={{ paddingLeft: '20px' }}>
                        <li><strong>Persistent Memory</strong> - Context survives across sessions</li>
                        <li><strong>Progressive Disclosure</strong> - Layered memory retrieval with token cost visibility</li>
                        <li><strong>Skill-Based Search</strong> - Query your project history with natural language</li>
                        <li><strong>Visual Timeline</strong> - Explore project history in this viewer</li>
                    </ul>
                </div>
            )}

            {activeTab === 'search' && (
                <div>
                    <h3 style={{ color: 'var(--color-text-title)', marginBottom: '16px' }}>Search Tools</h3>
                    <p>You can search your project history using the <code>mem-search</code> skill in Claude Code.</p>

                    <h4 style={{ marginTop: '20px', marginBottom: '10px', color: 'var(--color-text-title)' }}>Example Queries</h4>
                    <pre style={{ background: 'var(--color-bg-tertiary)', padding: '12px', borderRadius: '6px', overflowX: 'auto', border: '1px solid var(--color-border-primary)' }}>
"What bugs did we fix last session?"
"How did we implement authentication?"
"Show me recent work on this project"
"What was happening when we added the viewer UI?"
                    </pre>
                </div>
            )}

            {activeTab === 'shortcuts' && (
                <div>
                    <h3 style={{ color: 'var(--color-text-title)', marginBottom: '16px' }}>Keyboard Shortcuts</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <kbd style={{ background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border-primary)', fontFamily: 'monospace' }}>?</kbd>
                        </div>
                        <div>Open this help dialog</div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <kbd style={{ background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border-primary)', fontFamily: 'monospace' }}>Esc</kbd>
                        </div>
                        <div>Close modals</div>
                    </div>
                </div>
            )}

            {activeTab === 'about' && (
                <div>
                    <h3 style={{ color: 'var(--color-text-title)', marginBottom: '16px' }}>About</h3>
                    <p><strong>Claude-Mem</strong> v{process.env.npm_package_version || '7.3.9'}</p>
                    <p>Persistent memory compression system built for Claude Code.</p>

                    <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                        <a href="https://docs.claude-mem.ai" target="_blank" rel="noopener noreferrer" className="community-btn">Documentation</a>
                        <a href="https://github.com/thedotmack/claude-mem" target="_blank" rel="noopener noreferrer" className="community-btn">GitHub</a>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
