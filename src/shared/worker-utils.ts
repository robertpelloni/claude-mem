import path from "path";
import { spawn } from "child_process";
import { getPackageRoot } from "./paths.js";

<<<<<<< HEAD
const FIXED_PORT = parseInt(process.env.CLAUDE_MEM_WORKER_PORT || "37777", 10);
=======
// Named constants for health checks
// Allow env var override for users on slow systems (e.g., CLAUDE_MEM_HEALTH_TIMEOUT_MS=10000)
const HEALTH_CHECK_TIMEOUT_MS = (() => {
  const envVal = process.env.CLAUDE_MEM_HEALTH_TIMEOUT_MS;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (Number.isFinite(parsed) && parsed >= 500 && parsed <= 300000) {
      return parsed;
    }
    // Invalid env var — log once and use default
    logger.warn('SYSTEM', 'Invalid CLAUDE_MEM_HEALTH_TIMEOUT_MS, using default', {
      value: envVal, min: 500, max: 300000
    });
  }
  return getTimeout(HOOK_TIMEOUTS.HEALTH_CHECK);
})();
>>>>>>> upstream/main

/**
 * Check if worker is responsive by trying the health endpoint
 */
<<<<<<< HEAD
async function isWorkerHealthy(timeoutMs: number = 3000): Promise<boolean> {
  try {
    const response = await fetch(`http://127.0.0.1:${FIXED_PORT}/health`, {
      signal: AbortSignal.timeout(timeoutMs)
=======
export function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs: number): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(
      () => reject(new Error(`Request timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
    fetch(url, init).then(
      response => { clearTimeout(timeoutId); resolve(response); },
      err => { clearTimeout(timeoutId); reject(err); }
    );
  });
}

// Cache to avoid repeated settings file reads
let cachedPort: number | null = null;
let cachedHost: string | null = null;

/**
 * Get the worker port number from settings
 * Uses CLAUDE_MEM_WORKER_PORT from settings file or default (37777)
 * Caches the port value to avoid repeated file reads
 */
export function getWorkerPort(): number {
  if (cachedPort !== null) {
    return cachedPort;
  }

  const settingsPath = path.join(SettingsDefaultsManager.get('CLAUDE_MEM_DATA_DIR'), 'settings.json');
  const settings = SettingsDefaultsManager.loadFromFile(settingsPath);
  cachedPort = parseInt(settings.CLAUDE_MEM_WORKER_PORT, 10);
  return cachedPort;
}

/**
 * Get the worker host address
 * Uses CLAUDE_MEM_WORKER_HOST from settings file or default (127.0.0.1)
 * Caches the host value to avoid repeated file reads
 */
export function getWorkerHost(): string {
  if (cachedHost !== null) {
    return cachedHost;
  }

  const settingsPath = path.join(SettingsDefaultsManager.get('CLAUDE_MEM_DATA_DIR'), 'settings.json');
  const settings = SettingsDefaultsManager.loadFromFile(settingsPath);
  cachedHost = settings.CLAUDE_MEM_WORKER_HOST;
  return cachedHost;
}

/**
 * Clear the cached port and host values
 * Call this when settings are updated to force re-reading from file
 */
export function clearPortCache(): void {
  cachedPort = null;
  cachedHost = null;
}

/**
 * Check if worker HTTP server is responsive
 * Uses /api/health (liveness) instead of /api/readiness because:
 * - Hooks have 15-second timeout, but full initialization can take 5+ minutes (MCP connection)
 * - /api/health returns 200 as soon as HTTP server is up (sufficient for hook communication)
 * - /api/readiness returns 503 until full initialization completes (too slow for hooks)
 * See: https://github.com/thedotmack/claude-mem/issues/811
 */
async function isWorkerHealthy(): Promise<boolean> {
  const port = getWorkerPort();
  const response = await fetchWithTimeout(
    `http://127.0.0.1:${port}/api/health`, {}, HEALTH_CHECK_TIMEOUT_MS
  );
  return response.ok;
}

/**
 * Get the current plugin version from package.json.
 * Returns 'unknown' on ENOENT/EBUSY (shutdown race condition, fix #1042).
 */
function getPluginVersion(): string {
  try {
    const packageJsonPath = path.join(MARKETPLACE_ROOT, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT' || code === 'EBUSY') {
      logger.debug('SYSTEM', 'Could not read plugin version (shutdown race)', { code });
      return 'unknown';
    }
    throw error;
  }
}

/**
 * Get the running worker's version from the API
 */
async function getWorkerVersion(): Promise<string> {
  const port = getWorkerPort();
  const response = await fetchWithTimeout(
    `http://127.0.0.1:${port}/api/version`, {}, HEALTH_CHECK_TIMEOUT_MS
  );
  if (!response.ok) {
    throw new Error(`Failed to get worker version: ${response.status}`);
  }
  const data = await response.json() as { version: string };
  return data.version;
}

/**
 * Check if worker version matches plugin version
 * Note: Auto-restart on version mismatch is now handled in worker-service.ts start command (issue #484)
 * This function logs for informational purposes only.
 * Skips comparison when either version is 'unknown' (fix #1042 — avoids restart loops).
 */
async function checkWorkerVersion(): Promise<void> {
  try {
    const pluginVersion = getPluginVersion();

    // Skip version check if plugin version couldn't be read (shutdown race)
    if (pluginVersion === 'unknown') return;

    const workerVersion = await getWorkerVersion();

    // Skip version check if worker version is 'unknown' (avoids restart loops)
    if (workerVersion === 'unknown') return;

    if (pluginVersion !== workerVersion) {
      // Just log debug info - auto-restart handles the mismatch in worker-service.ts
      logger.debug('SYSTEM', 'Version check', {
        pluginVersion,
        workerVersion,
        note: 'Mismatch will be auto-restarted by worker-service start command'
      });
    }
  } catch (error) {
    // Version check is informational — don't fail the hook
    logger.debug('SYSTEM', 'Version check failed', {
      error: error instanceof Error ? error.message : String(error)
>>>>>>> upstream/main
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Wait for worker to become healthy
 */
async function waitForWorkerHealth(maxWaitMs: number = 10000): Promise<boolean> {
  const start = Date.now();
  const checkInterval = 100; // Check every 100ms
  
  while (Date.now() - start < maxWaitMs) {
    // Use shorter timeout (300ms) for faster failure detection during polling
    if (await isWorkerHealthy(300)) {
      return true;
    }
    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
  return false;
}

/**
 * Ensure worker service is running
 * Checks if worker is already running before attempting to start
 * This prevents unnecessary restarts that could interrupt mid-action processing
 */
export async function ensureWorkerRunning(): Promise<void> {
  // First, check if worker is already healthy
  if (await isWorkerHealthy(1000)) {
    return; // Worker is already running and responsive
  }

  const packageRoot = getPackageRoot();
  const pm2Path = path.join(packageRoot, "node_modules", ".bin", "pm2");
  const ecosystemPath = path.join(packageRoot, "ecosystem.config.cjs");

  // Check PM2 status to see if worker process exists
  const checkProcess = spawn(pm2Path, ["list", "--no-color"], {
    cwd: packageRoot,
    stdio: ["ignore", "pipe", "ignore"],
  });

  let output = "";
  checkProcess.stdout?.on("data", (data) => {
    output += data.toString();
  });

  // Wait for PM2 list to complete
  await new Promise<void>((resolve, reject) => {
    checkProcess.on("error", (error) => reject(error));
    checkProcess.on("close", (code) => {
      // PM2 list can fail, but we should still continue - just assume worker isn't running
      // This handles cases where PM2 isn't installed yet
      resolve();
    });
  });

  // Check if 'claude-mem-worker' is in the PM2 list output and is 'online'
  const isRunning = output.includes("claude-mem-worker") && output.includes("online");

  if (!isRunning) {
    // Start the worker
    const startProcess = spawn(pm2Path, ["start", ecosystemPath], {
      cwd: packageRoot,
      stdio: "ignore",
    });

    // Wait for PM2 start command to complete
    await new Promise<void>((resolve, reject) => {
      startProcess.on("error", (error) => reject(error));
      startProcess.on("close", (code) => {
        // Exit code 0 means success, null means process terminated abnormally
        // but PM2 sometimes returns null for successful daemon starts
        if (code !== 0 && code !== null) {
          reject(new Error(`PM2 start command failed with exit code ${code}`));
        } else {
          resolve();
        }
      });
    });
  }

  // Wait for worker to become healthy (either just started or was starting)
  const healthy = await waitForWorkerHealth(10000);
  if (!healthy) {
    throw new Error("Worker failed to become healthy after starting");
  }
}

/**
 * Get the worker port number (fixed port)
 */
export function getWorkerPort(): number {
  return FIXED_PORT;
}
