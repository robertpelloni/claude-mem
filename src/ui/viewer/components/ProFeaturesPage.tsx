import React from 'react';

export function ProFeaturesPage() {
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-header)', marginBottom: '16px' }}>
        Pro Features (Coming Soon)
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '40px' }}>
        Advanced capabilities for power users and teams.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* Remote Sync */}
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-primary)',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-header)', marginBottom: '8px' }}>
            ☁️ Remote Sync
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Synchronize your memories across multiple devices and team members.
            Never lose context when switching machines.
          </p>
          <div style={{ marginTop: '16px', display: 'inline-block', fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}>
            In Development
          </div>
        </div>

        {/* Graph View */}
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-primary)',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-header)', marginBottom: '8px' }}>
            🕸️ Knowledge Graph
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Visualize connections between files, concepts, and decisions in an interactive node graph.
            Discover hidden dependencies in your codebase.
          </p>
          <div style={{ marginTop: '16px', display: 'inline-block', fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}>
            Planned
          </div>
        </div>

        {/* IDE Integration */}
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-primary)',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-header)', marginBottom: '8px' }}>
            🖥️ IDE Native Widgets
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Access your memory stream directly inside VS Code and JetBrains IDEs.
            Context-aware suggestions as you type.
          </p>
          <div style={{ marginTop: '16px', display: 'inline-block', fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}>
            Planned
          </div>
        </div>
      </div>
    </div>
  );
}
