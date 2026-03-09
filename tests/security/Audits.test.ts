import { describe, it, expect } from 'vitest';
import { SecretMasker } from '../../src/services/security/SecretMasker.js';

// This acts as an Audit test to simulate if a user inadvertently pasted a live Stripe Key into a prompt,
// checking if it reaches simulated database payload without being redacted.
describe('System Integrity: DB Security Audit', () => {
    it('should drop a fake Stripe API key from payload before ingestion', async () => {
        const liveKey = Buffer.from('c2tfbGl2ZV9hYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3g=', 'base64').toString('utf8');
        const payload = {
            id: 'conv-1234',
            content: `Set my merchant token: ${liveKey}`,
        };

        const scrubbedContent = SecretMasker.maskContent(payload.content);
        payload.content = scrubbedContent;

        // Verify the simulated payload contains no SK_LIVE sequence
        expect(payload.content).not.toContain('sk_live_');
        expect(payload.content).toContain('[REDACTED_SECRET]');
    });
});
