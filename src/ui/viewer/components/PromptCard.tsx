import React from 'react';
import { UserPrompt } from '../types';
import { formatDate } from '../utils/formatters';

interface PromptCardProps {
  prompt: UserPrompt;
}

export function PromptCard({ prompt }: PromptCardProps) {
  const date = formatDate(prompt.created_at_epoch);

  return (
    <div className="card prompt-card">
      <div className="card-header">
        <div className="card-header-left">
          <span className="card-type" title="User Prompt">Prompt</span>
          <span className="card-project" title={`Project Context: ${prompt.project}`}>{prompt.project}</span>
        </div>
      </div>
      <div className="card-content" title="User Prompt Text">
        {prompt.prompt_text}
      </div>
      <div className="card-meta">
        <span className="meta-date" title={`Prompt ID: ${prompt.id}, Created At: ${date}`}>#{prompt.id} • {date}</span>
      </div>
    </div>
  );
}
