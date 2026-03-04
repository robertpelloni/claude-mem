# Claude-Mem Memory Architecture

## Architectural Principles
The Claude-Mem memory system functions as an advanced retrieval-augmented generation (RAG) system crossed with biomimetic layered recall.

## Memory Types
1. **Working Memory**: Injected into the immediate prompt context upon initialization, optimized for token count.
2. **Short-Term Context**: Recent summaries or active observations accessed automatically.
3. **Long-Term Retrieval (ChromaDB + SQLite)**: FTS5 and semantic search combined across historical projects.

## Endless Mode (Beta)
Endless mode attempts to simulate true unbounded contextual reasoning by generating compressed "observations" on the fly, storing the original narrative, and replacing quadratic context expansion with O(N) linear summarization tracking.

## Integrating Submodules
This framework easily plugs into other systems, such as `supermemory`, `mem0`, `openmemory`, and `byterover`, via the universal MCP extension interface. However, our primary implementation focuses on ensuring `claude-mem` operates as a hyper-optimized backend server that can seamlessly interface with disparate client frontends.