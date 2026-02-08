import React, { useState, useEffect } from 'react';

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function SearchInput({ onSearch, isLoading }: SearchInputProps) {
  const [query, setQuery] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
        onSearch(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <div className="search-input-container" style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
      >
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input
        type="text"
        placeholder="Search memory..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 32px',
          paddingRight: isLoading ? '32px' : '12px',
          background: 'var(--color-bg-input)',
          border: '1px solid var(--color-border-primary)',
          borderRadius: '20px',
          fontSize: '13px',
          color: 'var(--color-text-primary)',
          outline: 'none',
          transition: 'all 0.2s ease'
        }}
      />
      {isLoading && (
        <div
          className="spinner"
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            marginTop: '-6px',
            width: '12px',
            height: '12px',
            borderWidth: '1.5px'
          }}
        />
      )}
    </div>
  );
}
