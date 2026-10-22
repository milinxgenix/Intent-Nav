/**
 * IntentNav-SCFR: Real Headless Chromium MV3 E2E Test Runner
 *
 * Drives the complete IntentNav-SCFR closed-loop navigation engine end-to-end
 * against live Mock Sites A, B, C, D in real headless Google Chrome over CDP:
 *
 * Real Natural-Language Intent
 *   -> CandidateGenerator.generateFromDOM() (Live Interface Observation)
 *   -> Capability Resolution & 5D Typed Drift Localization
 *   -> Invariant Closure & Contradiction Filtering
 *   -> Post-Gate Ranking & Ephemeral BindingHandle Resolution
 *   -> Execution Authorization Gating
 *   -> BrowserExecutionDispatcher Activation Dispatch (Real DOM Synthetic MouseEvent)
 *   -> Real Blink DOM & App State Mutation Witness Capture
 *   -> Causal Transition Verification (>=2 independent witness classes)
 *   -> Post-State Verification
 *   -> Route Promotion & 17-Precondition Verification
 *   -> EXECUTED State
 *
 * Note: Ground truth element IDs and selectors are ONLY used post-execution
 * by an independent test oracle to evaluate correctness. ZERO target IDs
 * are passed to IntentNav.
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
const CDP_PORT = 9222;
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
      console.log(`[Server] Live mock sites & assets running at http://localhost:${PORT}/`);
      resolve(server);
    });
  });
}

// 2. Poll for Chrome CDP readiness
async function waitForChrome(retries = 30, delayMs = 300) {
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
async function waitForServiceWorker(extensionId = '', browserClient = null, retries = 40, delayMs = 300) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
      if (res.ok) {
        const targets = await res.json();
        if (i === 0 || i % 10 === 0) {
          console.log(`[CDP] /json/list targets (attempt ${i + 1}):`, targets.map((t) => ({ type: t.type, url: t.url })));
        }
        const sw = targets.find((t) => (t.type === 'service_worker' || t.type === 'worker' || t.type === 'background_page') && t.url && t.url.includes(extensionId || 'background.js'));
        if (sw && sw.webSocketDebuggerUrl) {
          console.log(`[Extension] Found MV3 Service Worker target in /json/list: ${sw.url}`);
          return sw;
        }
      }
    } catch {}

    if (browserClient) {
      try {
        const { targetInfos } = await browserClient.send('Target.getTargets');
        if (i === 0 || i % 10 === 0) {
          console.log(`[CDP] Target.getTargets (attempt ${i + 1}):`, targetInfos.map((t) => ({ type: t.type, url: t.url })));
        }
        const swInfo = targetInfos.find((t) => (t.type === 'service_worker' || t.type === 'worker' || t.type === 'background_page') && t.url && t.url.includes(extensionId || 'background.js'));
        if (swInfo) {
          console.log(`[Extension] Found MV3 Service Worker target in Target.getTargets: ${swInfo.url}`);
          return {
            type: swInfo.type,
            url: swInfo.url,
            webSocketDebuggerUrl: `ws://127.0.0.1:${CDP_PORT}/devtools/page/${swInfo.targetId}`,
            targetId: swInfo.targetId,
          };
        }
      } catch {}
    }

    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`MV3 Background Service Worker not found on port ${CDP_PORT} after ${retries * delayMs}ms`);
}

// 3. CDP Client wrapper
class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
      this.ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      });
    });
  }

  send(method, params = {}, sessionId = undefined) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      const payload = { id, method, params };
      if (sessionId) payload.sessionId = sessionId;
      this.ws.send(JSON.stringify(payload));
    });
  }

  async evaluate(expression, sessionId = undefined) {
    const res = await this.send(
      'Runtime.evaluate',
      {
        expression,
        returnByValue: true,
        awaitPromise: true,
      },
      sessionId
    );
    if (res.exceptionDetails) {
      throw new Error(`CDP Evaluate Error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await new Promise((r) => setTimeout(r, 600)); // Allow DOM, scripts, and layout to settle
  }

  close() {
    this.ws.close();
  }
}

// 4. Authoritative Scenario Definitions (A through J)
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
    oracleVerify: (pre, post, ctx) => {
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

// 5. Main Test Runner Execution
async function run() {
  console.log('================================================================');
  console.log('IntentNav-SCFR: Genuine Headless Chromium E2E Verification Suite');
  console.log('Closed-Loop Natural-Language Control Pipeline with Zero Injected IDs');
  console.log('================================================================\n');

  const chromeVersion = logResolvedBrowser(CHROME_PATH);
  const server = await startServer();
  const tmpProfile = `/tmp/chrome_intentnav_e2e_${Date.now()}`;
  const runId = `run_chromium_${Date.now()}`;

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

  const rawRecords = [];

  try {
    const versionData = await waitForChrome();

    // Connect to Browser Target and load unpacked extension via CDP Extensions domain
    console.log(`[CDP] Connecting to Browser endpoint: ${versionData.webSocketDebuggerUrl}`);
    const browserClient = new CDPClient(versionData.webSocketDebuggerUrl);
    await browserClient.connect();

    // Listen for service worker attachment before loading extension to catch startup
    let swSessionId = null;
    const swAttachedPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('MV3 Service Worker attachment timeout after 15000ms')), 15000);
      browserClient.ws.on('message', async (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (
            msg.method === 'Target.attachedToTarget' &&
            msg.params?.targetInfo?.type === 'service_worker' &&
            msg.params?.targetInfo?.url?.includes('background.js')
          ) {
            clearTimeout(timeout);
            swSessionId = msg.params.sessionId;
            resolve(swSessionId);
          }
        } catch {}
      });
    });

    await browserClient.send('Target.setAutoAttach', {
      autoAttach: true,
      waitForDebuggerOnStart: true,
      flatten: true,
    });

    const ext = await browserClient.send('Extensions.loadUnpacked', { path: DIST_DIR });
    console.log(`[Extension] Loaded MV3 Extension via CDP: ID=${ext.id}`);

    await swAttachedPromise;
    console.log(`[CDP] Attached to MV3 Service Worker with sessionId: ${swSessionId}`);
    await browserClient.send('Runtime.enable', {}, swSessionId);
    await browserClient.send('Runtime.runIfWaitingForDebugger', {}, swSessionId);

    const swClient = {
      evaluate: (expr) => browserClient.evaluate(expr, swSessionId),
      send: (method, params) => browserClient.send(method, params, swSessionId),
      close: () => {},
    };

    // Wait for Background Service Worker module graph to initialize globalThis.processIntentDirect
    console.log('[Extension] Waiting for service worker module initialization...');
    let ready = false;
    for (let r = 0; r < 30; r++) {
      try {
        const fnType = await swClient.evaluate('typeof globalThis.processIntentDirect');
        if (fnType === 'function') {
          ready = true;
          console.log('[Extension] Service Worker processIntentDirect is ready.');
          break;
        }
      } catch {}
      await new Promise((res) => setTimeout(res, 200));
    }
    if (!ready) {
      throw new Error('Service Worker processIntentDirect failed to initialize within timeout');
    }

    // Connect to Web Page Target
    const targetsRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');

    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error('Could not find active browser tab with WebSocket debugger URL');
    }

    console.log(`[CDP] Connecting to page tab: ${pageTarget.url}`);
    const pageClient = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await pageClient.connect();
    await pageClient.send('Page.enable');
    await pageClient.send('Runtime.enable');
    await pageClient.send('DOM.enable');

    console.log('\n--- Executing Real Browser Scenarios A through J via Loaded MV3 Extension ---\n');

    for (const scenario of SCENARIOS) {
      console.log(`[${scenario.scenarioId}] Navigating to ${scenario.site} (${scenario.url})...`);
      await pageClient.navigate(scenario.url);

      // Allow page to load and contentScript to be injected and initialized at document_idle
      await new Promise((r) => setTimeout(r, 450));

      // 1. Independent test oracle records pre-state from outside IntentNav
      const preState = await pageClient.evaluate('window.IntentNavMockState ? { ...window.IntentNavMockState } : {}');

      // 2. Execute Scenario solely by passing the Natural-Language Intent to MV3 Service Worker
      // (NO /dist/e2eController.js injected into the webpage — genuine MV3 extension flow)
      console.log(`  -> Passing Natural-Language Intent to MV3 Extension: "${scenario.intent}"`);
      const executionResult = await swClient.evaluate(`
        globalThis.processIntentDirect(${JSON.stringify(scenario.intent)}, ${JSON.stringify(scenario.options)})
      `);

      if (!executionResult) {
        throw new Error(`Scenario ${scenario.scenarioId} execution returned null or undefined result`);
      }

      const { success, context, auditLog, error } = executionResult;
      if (error) {
        console.error(`  ✕ Execution Error: ${error}`);
      }

      // 3. Independent test oracle independently inspects the page post-state outside IntentNav
      const oracleStateAfter = await pageClient.evaluate('window.IntentNavMockState ? { ...window.IntentNavMockState } : {}');
      const oraclePassed = scenario.oracleVerify(preState, oracleStateAfter, context);

      const verified = success && oraclePassed && context?.currentState === 'EXECUTED';
      console.log(`  -> Machine State: ${context?.currentState || 'UNKNOWN'}`);
      console.log(`  -> Target Candidate: ${context?.selectedCandidate?.candidateLabel || 'NONE'}`);
      console.log(`  -> Causal Verification: ${context?.verificationResult?.status || 'NOT_RUN'}`);
      console.log(`  -> Oracle Evaluation: ${oraclePassed ? 'PASSED' : 'FAILED'}`);
      if (!verified) {
        console.error('  ✕ Audit Log:', JSON.stringify(auditLog, null, 2));
      }
      console.log(`  ✓ ${scenario.scenarioId} Result: ${verified ? 'VERIFIED' : 'FAILED'}\n`);

      // 5. Construct authoritative 30-field machine-readable raw record
      const rawRecord = {
        runId,
        scenarioId: scenario.scenarioId,
        site: scenario.site,
        intent: scenario.intent,
        normalizedIntent: context?.normalizedIntent?.canonicalText || scenario.intent.toLowerCase().trim(),
        resolvedCapabilityId: context?.resolvedCapability?.capabilityId || '',
        capabilityFingerprintHash: context?.resolvedCapability?.fingerprintHash || '',
        observedCandidateIds: (context?.candidateList || []).map((c) => c.candidateId),
        selectedCandidateId: context?.selectedCandidate?.candidateId || '',
        bindingHandle: context?.selectedCandidate?.bindingHandle || context?.activationEvent?.bindingHandle || null,
        driftVector: context?.driftVector || null,
        driftClassification: context?.driftResult?.classification || 'NONE',
        invariantResults: context?.invariantResults || {},
        rankingResults: context?.rankedScores || [],
        routeId: context?.activeRoute?.routeId || context?.provisionalRoute?.routeId || '',
        routeVersion: context?.activeRoute?.version || 1,
        routeStateBefore: context?.provisionalRoute ? 'PROVISIONAL' : 'ACTIVE_VALIDATED',
        routeStateAfter: context?.activeRoute?.status || 'UNKNOWN',
        authorizationDecision: context?.authorizationDecision || null,
        riskClass: context?.resolvedCapability?.riskMetadata?.riskClass || 'REVERSIBLE',
        activationEvent: context?.activationEvent || null,
        activationTimestamp: context?.activationEvent?.timestamp || 0,
        witnesses: context?.capturedWitnesses || [],
        witnessClasses: Array.from(new Set((context?.capturedWitnesses || []).map((w) => w.witnessClass))),
        transitionSignature:
          context?.validationRecord?.transitionSignature ||
          context?.verificationResult?.signature ||
          context?.verificationResult?.verificationToken?.transitionSignature ||
          context?.verificationResult?.transitionSignature ||
          context?.activeRoute?.transitionSignature ||
          null,
        causalVerificationResult: context?.verificationResult || null,
        postStateBefore: preState,
        postStateAfter: oracleStateAfter,
        postStateVerified: context?.postStateVerified === true && oraclePassed === true,
        promotionTokenState: context?.verificationResult?.verificationToken?.verifiedStatus || 'NONE',
        finalMachineState: context?.currentState || 'FAILED',
        failureReason: context?.verificationResult?.status !== 'VERIFIED' ? context?.verificationResult?.explanation || 'Unknown' : null,
        timestamp: Date.now(),
        // independentOracleResult: Explicitly separates the external test oracle from IntentNav's own evidence.
        // The oracle reads window.IntentNavMockState AFTER execution and evaluates the oracleVerify predicate.
        // This field is NOT produced by IntentNav — it is produced by the test harness as a post-execution check.
        independentOracleResult: {
          oraclePassed,
          preStateSnapshot: preState,
          postStateSnapshot: oracleStateAfter,
          oracleExpectation: scenario.oracleVerify.toString().replace(/\s+/g, ' ').slice(0, 200),
          evaluatedBy: 'INDEPENDENT_TEST_ORACLE',
        },
      };


      rawRecords.push(rawRecord);

      if (!verified) {
        throw new Error(`Scenario ${scenario.scenarioId} failed verification! (Machine State: ${context?.currentState}, Oracle: ${oraclePassed})`);
      }
    }

    pageClient.close();
    swClient.close();
    browserClient.close();

    // 6. Write authoritative evidence file
    const evidenceDir = path.resolve(ROOT, 'evidence');
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true });
    }
    const evidencePath = path.join(evidenceDir, 'chromium_e2e_evidence.json');
    const evidencePayload = {
      runId,
      timestamp: Date.now(),
      browserExecutable: CHROME_PATH,
      browserVersion: chromeVersion,
      environment: `Google Chrome (${chromeVersion}) + CDP over WebSocket`,
      runnerType: 'REAL_CHROMIUM_INTENTNAV_CLOSED_LOOP',
      totalScenarios: rawRecords.length,
      allPassed: rawRecords.every((r) => r.finalMachineState === 'EXECUTED'),
      scenarios: rawRecords,
    };

    fs.writeFileSync(evidencePath, JSON.stringify(evidencePayload, null, 2), 'utf8');
    console.log(`[Evidence] Full 30-field Chromium E2E raw evidence saved to ${evidencePath}`);

    console.log('\n================================================================');
    console.log('>>> ALL 10 REAL CHROMIUM E2E SCENARIOS (A-J) EMPIRICALLY VERIFIED! <<<');
    console.log('Zero Injected IDs | Live DOM Invariant Closure | Multi-Class Witnesses');
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
  console.error('[Error] Chromium E2E failed:', err);
  process.exit(1);
});
