import React, { useState, useEffect } from 'react';
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

  // Filters
  const [selectedType, setSelectedType] = useState('all');
  const [selectedProject, setSelectedProject] = useState('');
  const [projects, setProjects] = useState<string[]>([]);

  // Load available projects
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (data.projects) setProjects(data.projects);
      })
      .catch(console.error);
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() && selectedType === 'all' && !selectedProject) return;

    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      const params = new URLSearchParams({
        q: query,
        limit: '20'
      });

      if (selectedType !== 'all') {
        params.append('type', selectedType);
      }
      if (selectedProject) {
        params.append('project', selectedProject);
      }

      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();

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

        <div className="search-controls-container">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search history (e.g. 'auth bug', 'database schema')..."
              autoFocus
            />
            <button type="submit" className="search-button" disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>

          <div className="search-filters">
            <div className="filter-group">
              <label>Type:</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Items</option>
                <option value="observations">Observations</option>
                <option value="sessions">Summaries</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Project:</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="filter-select"
              >
                <option value="">All Projects</option>
                {projects.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="search-results">
        {error && <div className="search-error">{error}</div>}

        {results.length === 0 && !isSearching && (query || selectedProject) && !error && (
          <div className="no-results">
            No results found. Try adjusting your filters or search terms.
          </div>
        )}

        {results.map((result, index) => (
          <div key={`${result.type}-${result.item.id}-${index}`} className="search-result-item">
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
