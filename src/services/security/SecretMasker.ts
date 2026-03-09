/**
 * SecretMasker - Vault-backed credential reduction
 * Scans observation text and file chunks for high-entropy secrets and identifiable API keys,
 * preventing credentials from ever entering the SQLite storage layer.
 */

// Common credential patterns
const SECRET_PATTERNS = [
    // AWS Keys
    /(AKIA[0-9A-Z]{16})/g,
    // Stripe Standard/Restricted Keys
    /(sk_(?:test|live)_[0-9a-zA-Z]{16,99})/g,
    /(rk_(?:test|live)_[0-9a-zA-Z]{16,99})/g,
    // GitHub Personal Access Tokens
    /(gh[p|u|s|r]_[a-zA-Z0-9]{36})/g,
    // Slack Tokens
    /(xox[baprs]-[0-9a-zA-Z]{10,48})/g,
    // Generic high-entropy Base64/Hex that looks suspiciously like a secret token assigning:
    // e.g., Bearer eyJhb..., Authorization: Basic ..., password="...", api_key="..."
    /(?:api[_-]?key|secret|password|token)["'\s:=]+(?:["']?)([a-zA-Z0-9_\-\.]{20,})(?:["']?)/gi,
    /(?:Bearer\s+)([a-zA-Z0-9_\-\.]{20,})/gi
];

export class SecretMasker {
    /**
     * Scans and sanitizes strings of recognizable secrets.
     */
    static maskContent(text: string): string {
        if (!text || typeof text !== 'string') return text;

        let sanitized = text;

        for (const pattern of SECRET_PATTERNS) {
            sanitized = sanitized.replace(pattern, (match, group1) => {
                if (group1) {
                    return match.replace(group1, '[REDACTED_SECRET]');
                }
                return '[REDACTED_SECRET]';
            });
        }

        return sanitized;
    }
}
