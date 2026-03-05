import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { EventSource } from 'eventsource';
import express from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';

let MOCK_WORKER_PORT: number;
let TEST_SESSION_ID = `test-endless-mode-${Date.now()}`;
let mockServer: Server;
let mockApp: express.Application;
let mockQueueDepth = 1;

describe('Endless Mode v7.1 - Integration Tests', () => {
  beforeAll(async () => {
    // Start a mock worker to isolate the test from the host PM2 environment
    mockApp = express();
    mockApp.use(express.json());

    // Mock Health Check
    mockApp.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    // Mock Session Init
    mockApp.post('/api/sessions/init', (req, res) => {
      res.json({
        sessionDbId: 1,
        promptNumber: 1,
        skipped: false,
        contextInjected: false
      });
    });

    // Mock Observation Creation
    mockApp.post('/api/sessions/observations', (req, res) => {
      res.json({ status: 'queued' });
    });

    // Mock SSE Stream
    mockApp.get('/stream', (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Send an initial status
      res.write(`event: processing_status\ndata: ${JSON.stringify({ queueDepth: mockQueueDepth })}\n\n`);

      // Simulate queue draining
      setTimeout(() => {
        res.write(`event: processing_status\ndata: ${JSON.stringify({ queueDepth: 0 })}\n\n`);
      }, 500);
    });

    // Mock Fetch Observations
    mockApp.get('/api/sessions/observations-for-tool-use/:toolUseId', (req, res) => {
      const { toolUseId } = req.params;
      if (toolUseId === 'toolu_nonexistent') {
        res.json({ observations: [] });
      } else {
        res.json({
          observations: [
            { id: 1, tool_name: 'test', tool_response: '{}' }
          ]
        });
      }
    });

    await new Promise<void>((resolve) => {
      mockServer = mockApp.listen(0, '127.0.0.1', () => {
        MOCK_WORKER_PORT = (mockServer.address() as AddressInfo).port;
        resolve();
      });
    });
  });

  afterAll(() => {
    if (mockServer) {
      mockServer.close();
    }
  });

  describe('Full SSE Flow', () => {
    it('should complete full observation lifecycle with SSE', async () => {
      await fetch(`http://127.0.0.1:${MOCK_WORKER_PORT}/api/sessions/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentSessionId: TEST_SESSION_ID,
          project: 'test-project',
          prompt: 'test prompt to pass privacy check'
        })
      });

      const observationPayload = {
        contentSessionId: TEST_SESSION_ID,
        tool_name: 'Bash',
        tool_input: { command: 'git status', description: 'Check git status' },
        tool_response: { stdout: 'On branch main\nnothing to commit', exit_code: 0 },
        cwd: '/project',
        toolUseId: `toolu_integration_${Date.now()}`
      };

      const createResponse = await fetch(`http://127.0.0.1:${MOCK_WORKER_PORT}/api/sessions/observations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(observationPayload)
      });

      expect(createResponse.ok).toBe(true);

      const sseCompleted = await new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => {
          eventSource.close();
          reject(new Error('SSE timeout after 30 seconds'));
        }, 5000);

        const eventSource = new EventSource(`http://127.0.0.1:${MOCK_WORKER_PORT}/stream`);

        eventSource.addEventListener('processing_status', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.queueDepth === 0) {
              clearTimeout(timeout);
              eventSource.close();
              resolve(true);
            }
          } catch (error) {
            // Ignore malformed events
          }
        });

        eventSource.onerror = (error) => {
          clearTimeout(timeout);
          eventSource.close();
          reject(new Error('SSE connection error'));
        };
      });

      expect(sseCompleted).toBe(true);

      const fetchResponse = await fetch(
        `http://127.0.0.1:${MOCK_WORKER_PORT}/api/sessions/observations-for-tool-use/${observationPayload.toolUseId}`
      );

      expect(fetchResponse.ok).toBe(true);
      const fetchResult = await fetchResponse.json();

      expect(fetchResult.observations).toBeDefined();
      expect(Array.isArray(fetchResult.observations)).toBe(true);
    });

    it('should handle concurrent SSE connections', async () => {
      const toolUseIds = [
        `toolu_concurrent_1_${Date.now()}`,
        `toolu_concurrent_2_${Date.now()}`,
        `toolu_concurrent_3_${Date.now()}`
      ];

      const createPromises = toolUseIds.map((toolUseId) =>
        fetch(`http://127.0.0.1:${MOCK_WORKER_PORT}/api/sessions/observations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentSessionId: TEST_SESSION_ID,
            tool_name: 'Read',
            tool_input: { file_path: '/test/file.ts' },
            tool_response: { content: 'export const test = 1;' },
            cwd: '/project',
            toolUseId
          })
        })
      );

      const createResponses = await Promise.all(createPromises);
      createResponses.forEach((response) => expect(response.ok).toBe(true));

      const ssePromises = toolUseIds.map(
        () =>
          new Promise<boolean>((resolve, reject) => {
            const timeout = setTimeout(() => {
              eventSource.close();
              reject(new Error('SSE timeout'));
            }, 5000);

            const eventSource = new EventSource(`http://127.0.0.1:${MOCK_WORKER_PORT}/stream`);

            eventSource.addEventListener('processing_status', (event) => {
              try {
                const data = JSON.parse(event.data);
                if (data.queueDepth === 0) {
                  clearTimeout(timeout);
                  eventSource.close();
                  resolve(true);
                }
              } catch (error) {
                // Ignore
              }
            });

            eventSource.onerror = () => {
              clearTimeout(timeout);
              eventSource.close();
              reject(new Error('SSE error'));
            };
          })
      );

      const results = await Promise.all(ssePromises);
      results.forEach((result) => expect(result).toBe(true));
    });

    it('should broadcast processing status updates during queue processing', async () => {
      const toolUseId = `toolu_broadcast_${Date.now()}`;

      await fetch(`http://127.0.0.1:${MOCK_WORKER_PORT}/api/sessions/observations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentSessionId: TEST_SESSION_ID,
          tool_name: 'Edit',
          tool_input: {
            file_path: '/test/file.ts',
            old_string: 'const PORT = 3000;',
            new_string: 'const PORT = 8080;'
          },
          tool_response: { success: true },
          cwd: '/project',
          toolUseId
        })
      });

      const events: any[] = [];

      const completed = await new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => {
          eventSource.close();
          reject(new Error('SSE timeout'));
        }, 5000);

        const eventSource = new EventSource(`http://127.0.0.1:${MOCK_WORKER_PORT}/stream`);

        eventSource.addEventListener('processing_status', (event) => {
          try {
            const data = JSON.parse(event.data);
            events.push(data);

            if (data.queueDepth === 0) {
              clearTimeout(timeout);
              eventSource.close();
              resolve(true);
            }
          } catch (error) {
            // Ignore
          }
        });

        eventSource.onerror = () => {
          clearTimeout(timeout);
          eventSource.close();
          reject(new Error('SSE error'));
        };
      });

      expect(completed).toBe(true);
      expect(events.length).toBeGreaterThan(0);

      const lastEvent = events[events.length - 1];
      expect(lastEvent.queueDepth).toBe(0);

      events.forEach((event) => {
        expect(event).toHaveProperty('queueDepth');
        expect(typeof event.queueDepth).toBe('number');
      });
    });
  });

  describe('API Endpoints', () => {
    it('should fetch observations by tool_use_id', async () => {
      const toolUseId = `toolu_fetch_test_${Date.now()}`;

      await fetch(`http://127.0.0.1:${MOCK_WORKER_PORT}/api/sessions/observations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentSessionId: TEST_SESSION_ID,
          tool_name: 'Grep',
          tool_input: { pattern: 'function.*main', path: '/project/src' },
          tool_response: { matches: ['src/index.ts:10:export function main() {'] },
          cwd: '/project',
          toolUseId
        })
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          eventSource.close();
          reject(new Error('SSE timeout'));
        }, 5000);

        const eventSource = new EventSource(`http://127.0.0.1:${MOCK_WORKER_PORT}/stream`);

        eventSource.addEventListener('processing_status', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.queueDepth === 0) {
              clearTimeout(timeout);
              eventSource.close();
              resolve();
            }
          } catch (error) {
            // Ignore
          }
        });

        eventSource.onerror = () => {
          clearTimeout(timeout);
          eventSource.close();
          reject(new Error('SSE error'));
        };
      });

      const response = await fetch(
        `http://127.0.0.1:${MOCK_WORKER_PORT}/api/sessions/observations-for-tool-use/${toolUseId}`
      );

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.observations).toBeDefined();
      expect(Array.isArray(result.observations)).toBe(true);
    });

    it('should return empty array for non-existent tool_use_id', async () => {
      const response = await fetch(
        `http://127.0.0.1:${MOCK_WORKER_PORT}/api/sessions/observations-for-tool-use/toolu_nonexistent`
      );

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.observations).toEqual([]);
    });
  });
});
