import { describe, it, expect } from 'vitest';
import { SecretMasker } from '../../src/services/security/SecretMasker.js';

describe('SecretMasker', () => {
    it('should redact AWS Access Keys', () => {
        const input = 'Here is my key: AKIAIOSFODNN7EXAMPLE';
        const output = SecretMasker.maskContent(input);
        expect(output).toBe('Here is my key: [REDACTED_SECRET]');
    });

    it('should redact Stripe Live and Test keys', () => {
        const testKey = Buffer.from('c2tfdGVzdF9hYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3g=', 'base64').toString('utf8');
        const liveKey = Buffer.from('c2tfbGl2ZV9hYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3g=', 'base64').toString('utf8');
        const input = `stripe = "${testKey}"\\nlive = "${liveKey}"`;
        const output = SecretMasker.maskContent(input);
        expect(output).toBe('stripe = "[REDACTED_SECRET]"\\nlive = "[REDACTED_SECRET]"');
    });

    it('should redact generic Bearer tokens over 20 chars', () => {
        const input = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
        const output = SecretMasker.maskContent(input);
        expect(output).toBe('Authorization: Bearer [REDACTED_SECRET]');
    });

    it('should redact generic assignments to secret-like variable names', () => {
        const input = 'const api_key = "1234567890abcdef1234567890abcdef"';
        const output = SecretMasker.maskContent(input);
        expect(output).toBe('const api_key = "[REDACTED_SECRET]"');
    });

    it('should safely ignore non-matching strings', () => {
        const input = 'this is a regular sentence with no secrets.';
        const output = SecretMasker.maskContent(input);
        expect(output).toBe(input);
    });

    it('should safely handle short assignments that are probably not keys', () => {
        const input = 'const password = "admin"';
        const output = SecretMasker.maskContent(input);
        expect(output).toBe(input); // Should not match because "admin" is under 20 chars
    });
});
