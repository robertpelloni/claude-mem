import type { PlatformAdapter } from '../types.js';
import { borgEngineAdapter } from './borg-engine.js';
import { cursorAdapter } from './cursor.js';
import { rawAdapter } from './raw.js';

export function getPlatformAdapter(platform: string): PlatformAdapter {
  switch (platform) {
    case 'borg-engine': return borgEngineAdapter;
    case 'cursor': return cursorAdapter;
    case 'raw': return rawAdapter;
    // Codex CLI and other compatible platforms use the raw adapter (accepts both camelCase and snake_case fields)
    default: return rawAdapter;
  }
}

export { borgEngineAdapter, cursorAdapter, rawAdapter };
