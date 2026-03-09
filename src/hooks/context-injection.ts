import { logger } from '../utils/logger.js';
/**
 * Context Injection Utilities
 *
 * Utilities for Endless Mode v7.1:
 * - Clear tool inputs from transcript to save tokens
 * - Format observations as markdown for additionalContext field
 */

import { readFile, writeFile } from 'fs/promises';
import { ObservationRow } from '../services/sqlite/types.js';
import { SessionStore } from '../services/sqlite/SessionStore.js';
import * as path from 'path';

/**
 * Clears the tool input for a specific tool_use_id in the transcript.
 * This saves tokens by removing large tool inputs after observations are captured.
 *
 * @param transcriptPath - Absolute path to the transcript JSON file
 * @param toolUseId - The tool_use_id to find and clear
 * @returns Number of tokens saved (estimated as input length / 4)
 */
export async function clearToolInputInTranscript(
  transcriptPath: string,
  toolUseId: string
): Promise<number> {
  let tokensSaved = 0;

  try {
    const transcriptContent = await readFile(transcriptPath, 'utf-8');

    // First, try to parse the entire file as a JSON array
    try {
      const parsed = JSON.parse(transcriptContent);
      if (Array.isArray(parsed)) {
        let modified = false;
        for (const message of parsed) {
          if (message.content && Array.isArray(message.content)) {
            for (const block of message.content) {
              if (block.type === 'tool_use' && block.id === toolUseId) {
                if (block.input && Object.keys(block.input).length > 0) {
                  const inputStr = JSON.stringify(block.input);
                  tokensSaved = Math.floor(inputStr.length / 4);
                  block.input = {};
                  modified = true;
                }
              }
            }
          } else if (message.message?.content && Array.isArray(message.message?.content)) {
            // Also handle nested message.content
            for (const block of message.message.content) {
              if (block.type === 'tool_use' && block.id === toolUseId) {
                if (block.input && Object.keys(block.input).length > 0) {
                  const inputStr = JSON.stringify(block.input);
                  tokensSaved = Math.floor(inputStr.length / 4);
                  block.input = {};
                  modified = true;
                }
              }
            }
          }
        }

        if (modified) {
          await writeFile(transcriptPath, JSON.stringify(parsed, null, 2), 'utf-8');
        }
        return tokensSaved;
      }
    } catch (e) {
      // Not a valid JSON array, fallback to JSONL format parsing
    }

    const lines = transcriptContent.trim().split('\n');

    let modified = false;
    const updatedLines: string[] = [];

    for (const line of lines) {
      if (!line.trim()) {
        updatedLines.push(line);
        continue;
      }

      try {
        const message = JSON.parse(line);

        if (message.message?.content && Array.isArray(message.message.content)) {
          for (const block of message.message.content) {
            if (block.type === 'tool_use' && block.id === toolUseId) {
              if (block.input && Object.keys(block.input).length > 0) {
                const inputStr = JSON.stringify(block.input);
                tokensSaved = Math.floor(inputStr.length / 4);
                block.input = {};
                modified = true;
              }
            }
          }
        } else if (message.content && Array.isArray(message.content)) {
          for (const block of message.content) {
            if (block.type === 'tool_use' && block.id === toolUseId) {
              if (block.input && Object.keys(block.input).length > 0) {
                const inputStr = JSON.stringify(block.input);
                tokensSaved = Math.floor(inputStr.length / 4);
                block.input = {};
                modified = true;
              }
            }
          }
        }

        updatedLines.push(JSON.stringify(message));
      } catch (parseError) {
        updatedLines.push(line);
      }
    }

    if (modified) {
      await writeFile(transcriptPath, updatedLines.join('\n') + '\n', 'utf-8');
    }
  } catch (error: any) {
    // Don't throw - this is a token optimization, not critical
    console.error(`Failed to clear tool input in transcript: ${error.message}`);
  }

  return tokensSaved;
}

/**
 * Format an observation as markdown for injection into Claude's context
 *
 * @param obs - Observation row from database
 * @returns Formatted markdown string
 */
export function formatObservationAsMarkdown(obs: ObservationRow): string {
  const typeEmoji: Record<ObservationRow['type'], string> = {
    decision: '⚖️',
    bugfix: '🔴',
    feature: '🟣',
    refactor: '🔄',
    discovery: '🔵',
    change: '✅'
  };

  const emoji = typeEmoji[obs.type] || '📝';

  let markdown = `**#${obs.id}** ${emoji} **${obs.title || 'Observation'}**\n\n`;

  if (obs.subtitle) {
    markdown += `${obs.subtitle}\n\n`;
  }

  if (obs.narrative) {
    markdown += `${obs.narrative}\n\n`;
  }

  if (obs.facts) {
    try {
      const facts = JSON.parse(obs.facts);
      if (facts.length > 0) {
        markdown += `**Facts:**\n${facts.map((f: string) => `- ${f}`).join('\n')}\n\n`;
      }
    } catch {
      // Skip malformed facts
    }
  }

  if (obs.concepts) {
    try {
      const concepts = JSON.parse(obs.concepts);
      if (concepts.length > 0) {
        markdown += `**Concepts:** ${concepts.join(', ')}\n\n`;
      }
    } catch {
      // Skip malformed concepts
    }
  }

  const filesRead = obs.files_read ? JSON.parse(obs.files_read) : [];
  const filesModified = obs.files_modified ? JSON.parse(obs.files_modified) : [];

  if (filesRead.length > 0 || filesModified.length > 0) {
    markdown += `**Files:**\n`;
    if (filesRead.length > 0) {
      markdown += `- Read: ${filesRead.join(', ')}\n`;
    }
    if (filesModified.length > 0) {
      markdown += `- Modified: ${filesModified.join(', ')}\n`;
    }
    markdown += '\n';
  }

  markdown += `Read: ~${Math.ceil((obs.text?.length || 0) / 4)}, Work: 🔍 ${obs.discovery_tokens}`;

  return `<claude-mem-context>\n${markdown.trim()}\n</claude-mem-context>`;
}

/**
 * Returns historical warnings for the specified workspace files
 */
export function getDebtWarningsForFiles(files: string[], project: string, cwd: string): string | null {
  if (!files || files.length === 0) return null;
  const db = new SessionStore();

  try {
    const observations = db.db.prepare(`
      SELECT * FROM observations
      WHERE project = ? AND type IN ('bugfix', 'decision')
      ORDER BY created_at_epoch DESC
      LIMIT 100
    `).all(project) as ObservationRow[];

    if (observations.length === 0) return null;

    const warnings: string[] = [];
    const usedObsIds = new Set<number>();

    for (const file of files) {
      const relativeFile = path.isAbsolute(file) ? path.relative(cwd, file) : file;

      const fileWarnings = observations.filter(obs => {
        if (usedObsIds.has(obs.id)) return false;
        try {
          const modified = JSON.parse(obs.files_modified || '[]');
          const read = JSON.parse(obs.files_read || '[]');

          const isMatch = [...modified, ...read].some(storedPath =>
            storedPath === relativeFile ||
            storedPath.endsWith(relativeFile.replace(/\\\\/g, '/')) ||
            relativeFile.endsWith(storedPath.replace(/\\\\/g, '/'))
          );
          return isMatch;
        } catch {
          return false;
        }
      });

      if (fileWarnings.length > 0) {
        warnings.push(`\n**Historical warnings for \`${relativeFile}\`:**`);
        for (const obs of fileWarnings.slice(0, 3)) { // max 3 per file
          usedObsIds.add(obs.id);
          const emoji = obs.type === 'bugfix' ? '🔴' : '🧠';
          const details = obs.subtitle ? obs.subtitle : (obs.narrative ? obs.narrative.slice(0, 100) + '...' : '');
          warnings.push(`- [${emoji} ${obs.type.toUpperCase()}] **${obs.title}**: ${details}`);
        }
      }
    }

    if (warnings.length > 0) {
      return `\n# ⚠️ Historical Context Inject\n${warnings.join('\n')}\n---`;
    }
    return null;

  } catch (err) {
    return null;
  } finally {
    db.close();
  }
}
