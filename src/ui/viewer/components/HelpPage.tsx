import React, { useState } from 'react';

const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="help-section">
    <h3 className="help-section-title">{title}</h3>
    <div className="help-content">
      {children}
    </div>
  </div>
);

export const HelpPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'search', label: 'Search Tools' },
    { id: 'concepts', label: 'Concepts & Privacy' },
    { id: 'features', label: 'Endless Mode' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'config', label: 'Configuration' },
  ];

  return (
    <div className="help-page-container">
      {/* Sidebar */}
      <div className="help-sidebar">
        <h2 className="help-sidebar-title">Help & Documentation</h2>
        <nav className="help-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`help-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="help-main">
        {activeTab === 'overview' && (
          <HelpSection title="Overview">
            <p>
              Claude-Mem is a persistent memory system for AI coding assistants. It automatically captures your work context,
              summarizes it, and makes it available to future sessions.
            </p>
            <h4>Key Features</h4>
            <ul>
              <li><strong>Persistent Memory:</strong> Context survives across sessions.</li>
              <li><strong>Search:</strong> Find past decisions, bugs, and features using natural language.</li>
              <li><strong>Progressive Disclosure:</strong> Shows relevant summaries first, details on demand.</li>
              <li><strong>Viewer UI:</strong> This interface allows you to browse and manage your memory stream.</li>
            </ul>
          </HelpSection>
        )}

        {activeTab === 'search' && (
          <HelpSection title="Search Tools">
            <p>
              Use the <code>mem-search</code> skill to query your project history. This is available in Claude Code, OpenCode, and Gemini.
            </p>
            <h4>Example Queries</h4>
            <div className="code-block">
              "How did we fix the login bug?"<br />
              "Show me recent work on the viewer UI."<br />
              "What decisions were made about the database schema?"
            </div>
            <h4>Tool Capabilities</h4>
            <ul>
              <li><strong>Search Observations:</strong> Full-text search across all recorded actions.</li>
              <li><strong>Search Sessions:</strong> Find high-level summaries of past work sessions.</li>
              <li><strong>By Concept:</strong> Filter by tags like 'bugfix', 'refactor', 'feature'.</li>
            </ul>
          </HelpSection>
        )}

        {activeTab === 'concepts' && (
          <HelpSection title="Concepts & Privacy">
            <h4>Observations</h4>
            <p>
              Every action (tool use, file edit) is recorded as an "Observation". These are compressed into semantic summaries.
            </p>
            <h4>Sessions</h4>
            <p>
              A "Session" groups related observations. When a session ends, it is summarized and stored in the long-term memory.
            </p>
            <h4>Privacy Control</h4>
            <p>
              Claude-Mem respects your privacy. You can exclude sensitive content from being stored by wrapping it in tags:
            </p>
            <div className="code-block">
              &lt;private&gt;<br />
              API Key: sk-12345...<br />
              &lt;/private&gt;
            </div>
            <p>
              Content within these tags is stripped before it reaches the memory database.
            </p>
          </HelpSection>
        )}

        {activeTab === 'features' && (
          <HelpSection title="Endless Mode (Beta)">
            <p>
              <strong>Status: Experimental</strong>
            </p>
            <p>
              Endless Mode is a biomimetic memory architecture that dramatically extends session length by compressing
              context in real-time.
            </p>
            <h4>How it Works</h4>
            <ul>
              <li><strong>Real-time Compression:</strong> Tool outputs are compressed into concise observations immediately.</li>
              <li><strong>Working Memory:</strong> Only relevant, compressed context is kept in the active window.</li>
              <li><strong>Archive Memory:</strong> Full details are moved to disk but remain searchable.</li>
            </ul>
            <h4>Benefits</h4>
            <ul>
              <li>Significantly reduces token usage.</li>
              <li>Allows for much longer coding sessions without hitting context limits.</li>
              <li>Scales linearly instead of quadratically.</li>
            </ul>
            <p>
              <em>Note: You can enable/disable experimental features in the Settings menu (switch to Beta channel).</em>
            </p>
          </HelpSection>
        )}

        {activeTab === 'integrations' && (
          <HelpSection title="Integrations">
            <h4>Claude Code</h4>
            <p>
              The primary integration. Uses the <code>claude-mem</code> plugin.
            </p>
            <h4>OpenCode</h4>
            <p>
              Connects via the <code>opencode-plugin</code>. Provides memory search and context injection within the OpenCode environment.
            </p>
            <h4>Gemini CLI</h4>
            <p>
              Connects via <code>gemini-cli-extension</code> (MCP). Allows Gemini to:
            </p>
            <ul>
              <li><strong>Search Memory:</strong> Query project history.</li>
              <li><strong>Get Context:</strong> Retrieve recent work context.</li>
              <li><strong>Record Observations:</strong> Save new actions to memory.</li>
              <li><strong>Summarize:</strong> Generate session summaries.</li>
            </ul>
          </HelpSection>
        )}

        {activeTab === 'config' && (
          <HelpSection title="Configuration">
            <p>
              Configure Claude-Mem via <code>~/.claude-mem/settings.json</code> or the Settings menu in this UI.
            </p>
            <h4>Key Settings</h4>
            <ul>
              <li><code>CLAUDE_MEM_MODEL</code>: The AI model used for summarization (default: claude-sonnet-4-5).</li>
              <li><code>CLAUDE_MEM_WORKER_PORT</code>: Port for the worker service (default: 37777).</li>
              <li><code>CLAUDE_MEM_LOG_LEVEL</code>: Verbosity of logs (DEBUG, INFO, WARN, ERROR).</li>
            </ul>
          </HelpSection>
        )}
      </div>
    </div>
  );
};
