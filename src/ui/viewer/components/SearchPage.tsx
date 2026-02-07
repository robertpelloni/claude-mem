import React, { useState } from 'react';
import { Observation, Summary } from '../types';
import { ObservationCard } from './ObservationCard';
import { SummaryCard } from './SummaryCard';

interface SearchResult {
  type: 'observation' | 'summary';
  score: number;
  item: Observation | Summary;
}

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`);
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();

      // Transform results to match our format
      // Assuming API returns { results: [...] } or just [...]
      // Adjust based on actual API response format from WorkerService
      const rawResults = Array.isArray(data) ? data : (data.results || []);

      const formattedResults: SearchResult[] = rawResults.map((r: any) => ({
        type: r.type === 'summary' ? 'summary' : 'observation',
        score: r.score || 0,
        item: r
      }));

      setResults(formattedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="search-page-container">
      <div className="search-header">
        <h2 className="search-title">Memory Search</h2>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your project history..."
            autoFocus
          />
          <button type="submit" className="search-button" disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      <div className="search-results">
        {error && <div className="search-error">{error}</div>}

        {results.length === 0 && !isSearching && query && !error && (
          <div className="no-results">No results found for "{query}"</div>
        )}

        {results.map((result, index) => (
          <div key={index} className="search-result-item">
            {result.type === 'observation' ? (
              <ObservationCard observation={result.item as Observation} />
            ) : (
              <SummaryCard summary={result.item as Summary} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
