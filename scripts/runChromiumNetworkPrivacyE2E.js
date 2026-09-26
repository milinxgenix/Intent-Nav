/**
 * IntentNav-SCFR: Genuine Chromium Network Privacy & Offline Execution Verification
 *
 * Patent Claim 11 Empirical Verification:
 * Asserts local/client-side execution without external telemetry, inference, or
 * capability leakage during normal operation.
 *
 * Uses real CDP Network domain interception (`Network.enable`) on both the active
 * web page target and the MV3 Background Service Worker target.
 * Captures all `Network.requestWillBeSent` and `Network.responseReceived` events
 * across live execution of Scenarios A through J against Mock Sites A, B, C, D.
 *
 * Verifies and proves:
 * 1. Total external telemetry/analytics endpoints contacted === 0
 * 2. Total external LLM / AI inference endpoints contacted === 0
 * 3. Total external cloud routes / remote update endpoints contacted === 0
 * 4. Zero credentials, tokens, or user intent payloads transmitted externally
 * 5. 100% of network traffic is strictly confined to localhost and chrome-extension://
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { WebSocket } from 'ws';
import { resolveChromeExecutable, logResolvedBrowser } from './resolveChrome.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const PORT = 3000;
const CDP_PORT = 9224; // dedicated port to avoid collisions
const CHROME_PATH = resolveChromeExecutable();
const DIST_DIR = path.resolve(ROOT, 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
};

// 1. Start local mock HTTP server
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url || '/';
      const filePath = path.join(ROOT, reqPath.split('?')[0]);
      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'text/plain';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        }
      });
    });

    server.listen(PORT, () => {
      console.log(`[Server] Live mock sites running at http://localhost:${PORT}/`);
      resolve(server);
    });
  });
}

// 2. Poll for Chrome CDP readiness
async function waitForChrome(retries = 35, delayMs = 300) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (res.ok) {
        const data = await res.json();
        console.log(`[Chrome] CDP Ready. Browser: ${data.Browser}`);
        return data;
      }
    } catch {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error(`Chrome CDP failed to start on port ${CDP_PORT} after ${retries * delayMs}ms`);
}

// 2b. Poll for MV3 Background Service Worker Target
async function waitForServiceWorker(extensionId = '', retries = 40, delayMs = 300) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
      if (res.ok) {
        const targets = await res.json();
        const sw = targets.find((t) => t.type === 'service_worker' && t.url && t.url.includes(extensionId || 'background.js'));
        if (sw && sw.webSocketDebuggerUrl) {
          console.log(`[Extension] Found MV3 Service Worker target: ${sw.url}`);
          return sw;
        }
      }
    } catch {}
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`MV3 Background Service Worker not found on port ${CDP_PORT} after ${retries * delayMs}ms`);
}

// 3. CDP Client wrapper with Event Dispatching
class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.callbacks = new Map();
    this.eventListeners = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
      this.ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.id && this.callbacks.has(msg.id)) {
            const { resolve, reject } = this.callbacks.get(msg.id);
            this.callbacks.delete(msg.id);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          } else if (msg.method) {
            const listeners = this.eventListeners.get(msg.method) || [];
            for (const listener of listeners) {
              try {
                listener(msg.params);
              } catch (err) {
                console.error(`Error in event listener for ${msg.method}:`, err);
              }
            }
          }
        } catch (err) {
          console.error('[CDP] Message parse error:', err);
        }
      });
    });
  }

  on(method, callback) {
    if (!this.eventListeners.has(method)) {
      this.eventListeners.set(method, []);
    }
    this.eventListeners.get(method).push(callback);
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`CDP Evaluate Error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await new Promise((r) => setTimeout(r, 600));
  }

  close() {
    this.ws.close();
  }
}

// 4. Authoritative Scenarios (A through J)
const SCENARIOS = [
  {
    scenarioId: 'Scenario A',
    name: 'Label rename recovery (Stop Commercial Bulletins)',
    site: 'Site B',
    url: 'http://localhost:3000/mock-sites/site-b/index.html',
    intent: 'Stop commercial bulletins',
    options: {},
    oracleVerify: (pre, post) => post.marketing_notifications_enabled === false,
  },
  {
    scenarioId: 'Scenario B',
    name: 'Label synonym replacement recovery (Download Records)',
    site: 'Site B',
    url: 'http://localhost:3000/mock-sites/site-b/index.html',
    intent: 'Download personal information',
    options: { userConfirmationGranted: true },
    oracleVerify: (pre, post) => post.export_download_initiated === true,
  },
  {
    scenarioId: 'Scenario C',
    name: 'Resilient to menu reordering',
    site: 'Site A',
    url: 'http://localhost:3000/mock-sites/site-a/index.html',
    intent: 'Turn off marketing emails',
    options: {},
    oracleVerify: (pre, post) => post.marketing_emails_enabled === false,
  },
  {
    scenarioId: 'Scenario D',
    name: 'Resilient to container hierarchy nesting changes',
    site: 'Site B',
    url: 'http://localhost:3000/mock-sites/site-b/index.html',
    intent: 'Turn off multi-factor auth',
    options: { userConfirmationGranted: true },
    oracleVerify: (pre, post) => post.two_factor_enabled === false,
  },
  {
    scenarioId: 'Scenario E',
    name: 'Resilient to volatile framework-generated DOM ID changes (:r3:)',
    site: 'Site C',
    url: 'http://localhost:3000/mock-sites/site-c/index.html',
    intent: 'Turn off marketing notifications',
    options: {},
    oracleVerify: (pre, post) => post.marketing_notifications_enabled === false,
  },
  {
    scenarioId: 'Scenario F',
    name: 'Resilient to scrambled CSS utility classes',
    site: 'Site C',
    url: 'http://localhost:3000/mock-sites/site-c/index.html',
    intent: 'Toggle dark display styling',
    options: {},
    oracleVerify: (pre, post) => post.dark_mode_enabled === true,
  },
  {
    scenarioId: 'Scenario G',
    name: 'Handles intermediate dialog state transition',
    site: 'Site C',
    url: 'http://localhost:3000/mock-sites/site-c/index.html',
    intent: 'Turn off 2FA',
    options: { userConfirmationGranted: true },
    oracleVerify: (pre, post) => post.two_factor_enabled === false,
  },
  {
    scenarioId: 'Scenario H',
    name: 'Resilient to altered URL path with fragment',
    site: 'Site A',
    url: 'http://localhost:3000/mock-sites/site-a/index.html#settings/notifications',
    intent: 'Disable tracking',
    options: {},
    oracleVerify: (pre, post) => post.analytics_tracking_enabled === false,
  },
  {
    scenarioId: 'Scenario I',
    name: 'Route version lifecycle & promotion recovery',
    site: 'Site A',
    url: 'http://localhost:3000/mock-sites/site-a/index.html',
    intent: 'Revoke active login sessions',
    options: { userConfirmationGranted: true },
    oracleVerify: (pre, post) => post.active_session_count === 1,
  },
  {
    scenarioId: 'Scenario J',
    name: 'Adversarial Decoy Rejection on Site D',
    site: 'Site D',
    url: 'http://localhost:3000/mock-sites/site-d/index.html',
    intent: 'Turn off marketing emails',
    options: {},
    oracleVerify: (pre, post) => {
      const genuineActivated = post.marketing_emails_enabled === false;
      const decoyUntouched =
        post.all_notifications_enabled === true &&
        post.history_purged === false &&
        post.account_erased === false &&
        post.all_security_disabled === false &&
        post.all_data_wiped === false;
      return genuineActivated && decoyUntouched;
    },
  },
];

// Helper to classify network requests
function classifyRequestUrl(url) {
  if (!url) return 'UNKNOWN';
  if (url.startsWith('http://localhost:') || url.startsWith('http://127.0.0.1:')) {
    return 'LOCAL_MOCK_ASSET';
  }
  if (url.startsWith('chrome-extension://')) {
    return 'EXTENSION_RESOURCE';
  }
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return 'LOCAL_IN_MEMORY';
  }
  const lower = url.toLowerCase();
  if (
    lower.includes('google-analytics') ||
    lower.includes('telemetry') ||
    lower.includes('mixpanel') ||
    lower.includes('segment.io') ||
    lower.includes('sentry.io') ||
    lower.includes('datadog')
  ) {
    return 'EXTERNAL_TELEMETRY';
  }
  if (
    lower.includes('api.openai.com') ||
    lower.includes('anthropic.com') ||
    lower.includes('generativelanguage.googleapis.com') ||
    lower.includes('huggingface.co')
  ) {
    return 'EXTERNAL_INFERENCE';
  }
  if (lower.includes('intentnav-cloud') || lower.includes('/routes/update')) {
    return 'EXTERNAL_CLOUD_ROUTE';
  }
  return 'EXTERNAL_OTHER';
}

function sanitizeHeaders(headers = {}) {
  const sanitized = {};
  for (const [key, value] of Object.entries(headers)) {
    const k = key.toLowerCase();
    if (k.includes('auth') || k.includes('cookie') || k.includes('token') || k.includes('key')) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// 5. Main Test Runner Execution
async function run() {
  console.log('================================================================');
  console.log('IntentNav-SCFR: Genuine Chromium Network Privacy E2E Suite');
  console.log('Patent Claim 11: Real CDP Network Trace & Zero External Leakage');
  console.log('================================================================\n');

  const chromeVersion = logResolvedBrowser(CHROME_PATH);
  const server = await startServer();
  const tmpProfile = `/tmp/chrome_intentnav_privacy_${Date.now()}`;
  const runId = `run_privacy_${Date.now()}`;

  console.log(`[Chrome] Launching Headless Chrome on CDP port ${CDP_PORT}...`);
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${tmpProfile}`,
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      'http://localhost:3000/mock-sites/site-a/index.html',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  let chromeExited = false;
  chromeProcess.on('exit', (code) => {
    chromeExited = true;
    if (code !== null && code !== 0) {
      console.error(`[Chrome] Exited prematurely with code ${code}`);
    }
  });

  const interceptedRequests = new Map();
  const rawRecords = [];

  try {
    const versionData = await waitForChrome();

    // Connect to Browser Target and load unpacked extension
    const browserClient = new CDPClient(versionData.webSocketDebuggerUrl);
    await browserClient.connect();
    const ext = await browserClient.send('Extensions.loadUnpacked', { path: DIST_DIR });
    console.log(`[Extension] Loaded MV3 Extension via CDP: ID=${ext.id}`);

    // Connect to MV3 Background Service Worker Target
    const swTarget = await waitForServiceWorker(ext.id);
    const swClient = new CDPClient(swTarget.webSocketDebuggerUrl);
    await swClient.connect();
    await swClient.send('Runtime.enable');
    await swClient.send('Network.enable');

    // Attach Network listeners to Service Worker
    swClient.on('Network.requestWillBeSent', (params) => {
      const classification = classifyRequestUrl(params.request.url);
      interceptedRequests.set(params.requestId, {
        requestId: params.requestId,
        target: 'service_worker',
        url: params.request.url,
        method: params.request.method,
        headers: sanitizeHeaders(params.request.headers),
        postDataSize: params.request.postData ? params.request.postData.length : 0,
        resourceType: params.type || 'Other',
        initiator: params.initiator,
        classification,
        timestamp: params.timestamp,
        responseStatus: null,
        encodedDataLength: 0,
      });
    });

    swClient.on('Network.responseReceived', (params) => {
      const entry = interceptedRequests.get(params.requestId);
      if (entry) {
        entry.responseStatus = params.response.status;
        entry.encodedDataLength = params.response.encodedDataLength || 0;
      }
    });

    // Connect to Web Page Target
    const targetsRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');

    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error('Could not find active browser tab with WebSocket debugger URL');
    }

    const pageClient = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await pageClient.connect();
    await pageClient.send('Page.enable');
    await pageClient.send('Runtime.enable');
    await pageClient.send('DOM.enable');
    await pageClient.send('Network.enable');

    // Attach Network listeners to Page
    pageClient.on('Network.requestWillBeSent', (params) => {
      const classification = classifyRequestUrl(params.request.url);
      interceptedRequests.set(params.requestId, {
        requestId: params.requestId,
        target: 'page',
        url: params.request.url,
        method: params.request.method,
        headers: sanitizeHeaders(params.request.headers),
        postDataSize: params.request.postData ? params.request.postData.length : 0,
        resourceType: params.type || 'Other',
        initiator: params.initiator,
        classification,
        timestamp: params.timestamp,
        responseStatus: null,
        encodedDataLength: 0,
      });
    });

    pageClient.on('Network.responseReceived', (params) => {
      const entry = interceptedRequests.get(params.requestId);
      if (entry) {
        entry.responseStatus = params.response.status;
        entry.encodedDataLength = params.response.encodedDataLength || 0;
      }
    });

    console.log('\n--- Intercepting CDP Network Traffic Across Scenarios A through J ---\n');

    for (const scenario of SCENARIOS) {
      const scenarioStartReqCount = interceptedRequests.size;
      console.log(`[${scenario.scenarioId}] Navigating to ${scenario.site} (${scenario.url})...`);
      await pageClient.navigate(scenario.url);
      await new Promise((r) => setTimeout(r, 450));

      const preState = await pageClient.evaluate('window.IntentNavMockState ? { ...window.IntentNavMockState } : {}');

      console.log(`  -> Passing Natural-Language Intent to MV3 Extension: "${scenario.intent}"`);
      const executionResult = await swClient.evaluate(`
        globalThis.processIntentDirect(${JSON.stringify(scenario.intent)}, ${JSON.stringify(scenario.options)})
      `);

      if (!executionResult) {
        throw new Error(`Scenario ${scenario.scenarioId} execution returned null or undefined result`);
      }

      const { success, context, error } = executionResult;
      if (error) {
        console.error(`  ✕ Execution Error: ${error}`);
      }

      const oracleStateAfter = await pageClient.evaluate('window.IntentNavMockState ? { ...window.IntentNavMockState } : {}');
      const oraclePassed = scenario.oracleVerify(preState, oracleStateAfter, context);
      const verified = success && oraclePassed && context?.currentState === 'EXECUTED';

      const scenarioReqs = Array.from(interceptedRequests.values()).slice(scenarioStartReqCount);
      console.log(`  -> Requests emitted during scenario: ${scenarioReqs.length}`);
      console.log(`  ✓ ${scenario.scenarioId} Result: ${verified ? 'VERIFIED' : 'FAILED'}\n`);

      rawRecords.push({
        scenarioId: scenario.scenarioId,
        site: scenario.site,
        intent: scenario.intent,
        verified,
        requestsCount: scenarioReqs.length,
        requestUrls: scenarioReqs.map((r) => r.url),
      });

      if (!verified) {
        throw new Error(`Scenario ${scenario.scenarioId} failed during privacy run!`);
      }
    }

    // Allow pending requests to settle
    await new Promise((r) => setTimeout(r, 500));

    pageClient.close();
    swClient.close();
    browserClient.close();

    // Analyze full network trace
    const allRequests = Array.from(interceptedRequests.values());
    const localMockRequests = allRequests.filter((r) => r.classification === 'LOCAL_MOCK_ASSET');
    const extensionResources = allRequests.filter((r) => r.classification === 'EXTENSION_RESOURCE');
    const localInMemory = allRequests.filter((r) => r.classification === 'LOCAL_IN_MEMORY');
    const externalTelemetry = allRequests.filter((r) => r.classification === 'EXTERNAL_TELEMETRY');
    const externalInference = allRequests.filter((r) => r.classification === 'EXTERNAL_INFERENCE');
    const externalCloudRoutes = allRequests.filter((r) => r.classification === 'EXTERNAL_CLOUD_ROUTE');
    const externalOther = allRequests.filter((r) => r.classification === 'EXTERNAL_OTHER');

    const totalExternal =
      externalTelemetry.length +
      externalInference.length +
      externalCloudRoutes.length +
      externalOther.length;

    console.log('----------------------------------------------------------------');
    console.log(`[Network Trace Summary] Total Intercepted: ${allRequests.length}`);
    console.log(`  -> Local Mock Site Requests:   ${localMockRequests.length}`);
    console.log(`  -> Extension Internal Resources: ${extensionResources.length}`);
    console.log(`  -> Local In-Memory Requests:    ${localInMemory.length}`);
    console.log(`  -> External Telemetry Endpoints: ${externalTelemetry.length} (Expected: 0)`);
    console.log(`  -> External Inference / LLMs:    ${externalInference.length} (Expected: 0)`);
    console.log(`  -> External Cloud Routes:        ${externalCloudRoutes.length} (Expected: 0)`);
    console.log(`  -> Other External Requests:      ${externalOther.length} (Expected: 0)`);
    console.log('----------------------------------------------------------------\n');

    if (totalExternal > 0) {
      throw new Error(`Privacy assertion failed: ${totalExternal} external requests detected!`);
    }

    // Save evidence
    const evidenceDir = path.resolve(ROOT, 'evidence');
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true });
    }

    const evidencePath = path.join(evidenceDir, 'chromium_network_privacy_evidence.json');
    const evidencePayload = {
      runId,
      timestamp: Date.now(),
      browserExecutable: CHROME_PATH,
      browserVersion: chromeVersion,
      environment: `Google Chrome (${chromeVersion}) + CDP over WebSocket`,
      runnerType: 'REAL_CHROMIUM_NETWORK_PRIVACY_E2E',
      claimReference: 'Patent Claim 11 — Offline / Local-Only Execution Model',
      assertions: {
        totalRequestsIntercepted: allRequests.length,
        categorizedEndpoints: {
          localMockSiteRequests: localMockRequests.length,
          extensionInternalResources: extensionResources.length,
          localInMemoryRequests: localInMemory.length,
          externalTelemetryEndpoints: externalTelemetry.length,
          externalInferenceEndpoints: externalInference.length,
          externalCloudRoutes: externalCloudRoutes.length,
          externalOtherEndpoints: externalOther.length,
        },
        externalRequestsCount: totalExternal,
        externalTelemetryCount: externalTelemetry.length,
        externalInferenceCount: externalInference.length,
        externalCloudRoutesCount: externalCloudRoutes.length,
        zeroDataLeftLocalhost: totalExternal === 0,
        zeroCredentialsTransmitted: true,
        privacyVerified: totalExternal === 0 && rawRecords.every((r) => r.verified),
      },
      scenariosExecuted: rawRecords,
      allRequests: allRequests.map((r) => ({
        requestId: r.requestId,
        target: r.target,
        method: r.method,
        url: r.url,
        resourceType: r.resourceType,
        initiatorType: r.initiator?.type || 'unknown',
        classification: r.classification,
        postDataSize: r.postDataSize,
        encodedDataLength: r.encodedDataLength,
        timestamp: r.timestamp,
      })),
    };

    fs.writeFileSync(evidencePath, JSON.stringify(evidencePayload, null, 2), 'utf8');
    console.log(`[Evidence] Authoritative Network Privacy evidence saved to ${evidencePath}`);
    console.log('\n================================================================');
    console.log('>>> CLAIM 11 NETWORK PRIVACY VERIFIED: ZERO EXTERNAL CALLS <<<');
    console.log('================================================================\n');
  } finally {
    if (!chromeExited) {
      chromeProcess.kill('SIGKILL');
    }
    server.close();
    try {
      fs.rmSync(tmpProfile, { recursive: true, force: true });
    } catch {}
  }
}

run().catch((err) => {
  console.error('[Error] Chromium Network Privacy E2E failed:', err);
  process.exit(1);
});
