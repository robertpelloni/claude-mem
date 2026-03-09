# Branch Memory Research & Implementation Strategy

## The Problem
Upstream `claude-mem` introduced a concept known as "branch memory," which aims to solve a classic chat issue: Context degradation when a user creates a new fork of an existing conversation.

By default, an LLM session creates a linear timeline of observations. If a user rolls back to Prompt #5 and branches a different path, the context ID must diverge or observations after Prompt #5 bleed into the new fork.

## SQLite Schema Considerations
Currently, our `observations` table maps strictly to `conversation_id`.

```sql
CREATE TABLE observations (
    id ROWID,
    conversation_id TEXT NOT NULL,
    prompt_number INTEGER NOT NULL,
    text TEXT NOT NULL,
    -- missing: branch_id
);
```

To support upstream branch memory, we must update the schema:

1. Add `branch_id` (TEXT, default 'main') to `observations`.
2. Modify the extraction queries (`get_recent_observations()`) to explicitly target a specific `branch_id` and all its parent ancestors up to the fork point.
3. Update `record_observation()` to accept an optional `branch_id` parameter directly from VS Code or Cursor webhook injections.

## Upstream Integration Analysis
While `branch-memory` works effectively in standard chat environments with discrete message nodes, `claude-mem` heavily relies on `mem-search` (semantic FTS5 queries). 
If an observation is branched, FTS5 will need an advanced filter `WHERE branch_id IN (ancestors)` to prevent vector leakage from parallel, alternate-reality conversation branches.

**Conclusion:**
This feature requires extremely careful migration planning and should be formalized into Phase H, alongside a major major version upgrade (v11) due to the disruptive schema alterations.
