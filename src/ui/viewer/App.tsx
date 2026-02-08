import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Feed } from './components/Feed';
import { ContextSettingsModal } from './components/ContextSettingsModal';
import { HelpModal } from './components/HelpModal';
import { useSSE } from './hooks/useSSE';
import { useSettings } from './hooks/useSettings';
import { useStats } from './hooks/useStats';
import { usePagination } from './hooks/usePagination';
import { useTheme } from './hooks/useTheme';
import { Observation, Summary, UserPrompt } from './types';
import { mergeAndDeduplicateByProject } from './utils/data';

export function App() {
  const [currentFilter, setCurrentFilter] = useState('');
  const [contextPreviewOpen, setContextPreviewOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    observations: Observation[];
    summaries: Summary[];
    prompts: UserPrompt[];
  }>({ observations: [], summaries: [], prompts: [] });
  const [isSearching, setIsSearching] = useState(false);

  const [paginatedObservations, setPaginatedObservations] = useState<Observation[]>([]);
  const [paginatedSummaries, setPaginatedSummaries] = useState<Summary[]>([]);
  const [paginatedPrompts, setPaginatedPrompts] = useState<UserPrompt[]>([]);

  const { observations, summaries, prompts, projects, isProcessing, queueDepth, isConnected } = useSSE();
  const { settings, saveSettings, isSaving, saveStatus } = useSettings();
  const { stats, refreshStats } = useStats();
  const { preference, resolvedTheme, setThemePreference } = useTheme();
  const pagination = usePagination(currentFilter);

  // Search handler
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults({ observations: [], summaries: [], prompts: [] });
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        query: query,
        limit: '20',
        format: 'json'
      });
      if (currentFilter) params.append('project', currentFilter);

      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults({
          observations: data.observations || [],
          summaries: data.sessions || [],
          prompts: data.prompts || []
        });
      }
    } catch (e) {
      console.error('Search failed', e);
    } finally {
      setIsSearching(false);
    }
  }, [currentFilter]);

  // When filtering by project: ONLY use paginated data (API-filtered)
  // When showing all projects: merge SSE live data with paginated data
  const allObservations = useMemo(() => {
    if (searchQuery) return searchResults.observations;
    if (currentFilter) {
      // Project filter active: API handles filtering, ignore SSE items
      return paginatedObservations;
    }
    // No filter: merge SSE + paginated, deduplicate by ID
    return mergeAndDeduplicateByProject(observations, paginatedObservations);
  }, [observations, paginatedObservations, currentFilter, searchQuery, searchResults]);

  const allSummaries = useMemo(() => {
    if (searchQuery) return searchResults.summaries;
    if (currentFilter) {
      return paginatedSummaries;
    }
    return mergeAndDeduplicateByProject(summaries, paginatedSummaries);
  }, [summaries, paginatedSummaries, currentFilter, searchQuery, searchResults]);

  const allPrompts = useMemo(() => {
    if (searchQuery) return searchResults.prompts;
    if (currentFilter) {
      return paginatedPrompts;
    }
    return mergeAndDeduplicateByProject(prompts, paginatedPrompts);
  }, [prompts, paginatedPrompts, currentFilter, searchQuery, searchResults]);

  // Toggle context preview modal
  const toggleContextPreview = useCallback(() => {
    setContextPreviewOpen(prev => !prev);
  }, []);

  // Toggle help modal
  const toggleHelp = useCallback(() => {
    setHelpOpen(prev => !prev);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
        return;
      }

      if (e.key === '?') {
        toggleHelp();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleHelp]);

  // Handle loading more data
  const handleLoadMore = useCallback(async () => {
    if (searchQuery) return; // Disable infinite scroll during search for now

    try {
      const [newObservations, newSummaries, newPrompts] = await Promise.all([
        pagination.observations.loadMore(),
        pagination.summaries.loadMore(),
        pagination.prompts.loadMore()
      ]);

      if (newObservations.length > 0) {
        setPaginatedObservations(prev => [...prev, ...newObservations]);
      }
      if (newSummaries.length > 0) {
        setPaginatedSummaries(prev => [...prev, ...newSummaries]);
      }
      if (newPrompts.length > 0) {
        setPaginatedPrompts(prev => [...prev, ...newPrompts]);
      }
    } catch (error) {
      console.error('Failed to load more data:', error);
    }
  }, [currentFilter, pagination.observations, pagination.summaries, pagination.prompts, searchQuery]);

  // Reset paginated data and load first page when filter changes
  useEffect(() => {
    setPaginatedObservations([]);
    setPaginatedSummaries([]);
    setPaginatedPrompts([]);
    handleLoadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilter]);

  return (
    <>
      <Header
        isConnected={isConnected}
        projects={projects}
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
        isProcessing={isProcessing}
        queueDepth={queueDepth}
        themePreference={preference}
        onThemeChange={setThemePreference}
        onContextPreviewToggle={toggleContextPreview}
        onHelpToggle={toggleHelp}
        onSearch={handleSearch}
        isSearching={isSearching}
      />

      <Feed
        observations={allObservations}
        summaries={allSummaries}
        prompts={allPrompts}
        onLoadMore={handleLoadMore}
        isLoading={!searchQuery && (pagination.observations.isLoading || pagination.summaries.isLoading || pagination.prompts.isLoading)}
        hasMore={!searchQuery && (pagination.observations.hasMore || pagination.summaries.hasMore || pagination.prompts.hasMore)}
      />

      <ContextSettingsModal
        isOpen={contextPreviewOpen}
        onClose={toggleContextPreview}
        settings={settings}
        onSave={saveSettings}
        isSaving={isSaving}
        saveStatus={saveStatus}
      />

      <HelpModal
        isOpen={helpOpen}
        onClose={toggleHelp}
      />
    </>
  );
}
