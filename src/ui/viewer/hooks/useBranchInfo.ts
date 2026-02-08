import { useState, useEffect } from 'react';

interface BranchInfo {
  branch: string | null;
  isBeta: boolean;
  isGitRepo: boolean;
}

export function useBranchInfo() {
  const [info, setInfo] = useState<BranchInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchStatus();
  }, []);

  return { info, loading };
}
