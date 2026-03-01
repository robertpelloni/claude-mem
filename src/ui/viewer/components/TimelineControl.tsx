import React, { useState, useEffect } from 'react';

interface TimelineControlProps {
  minEpoch?: number;
  maxEpoch?: number;
  currentEpoch: number;
  onChange: (epoch: number) => void;
}

export function TimelineControl({ minEpoch, maxEpoch, currentEpoch, onChange }: TimelineControlProps) {
  // Default to a 30 day window if bounds aren't provided
  const now = Date.now();
  const actualMax = maxEpoch || now;
  const actualMin = minEpoch || (actualMax - 30 * 24 * 60 * 60 * 1000);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value, 10));
  };

  const formatDate = (epoch: number) => {
    if (epoch >= now - 1000) return 'Now'; // Give a little buffer for "Now"
    const date = new Date(epoch);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-primary)',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-header)' }}>
          ⏳ Time Travel Debugger
        </h3>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-accent-primary)' }}>
          {formatDate(currentEpoch)}
        </span>
      </div>

      <input
        type="range"
        min={actualMin}
        max={actualMax}
        value={currentEpoch}
        onChange={handleSliderChange}
        style={{ width: '100%', cursor: 'ew-resize' }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)' }}>
        <span>{new Date(actualMin).toLocaleDateString()}</span>
        <span>Drag to filter history</span>
        <span>Now</span>
      </div>
    </div>
  );
}
