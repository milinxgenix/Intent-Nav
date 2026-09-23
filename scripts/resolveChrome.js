/**
 * IntentNav-SCFR: Cross-Platform Chromium / Chrome Executable Resolver
 *
 * Resolves Chrome/Chromium executable following strict precedence:
 * 1. CHROME_PATH environment variable
 * 2. Platform-specific known Chrome/Chromium filesystem paths
 * 3. System PATH executable discovery (which / where)
 * 4. Explicit, actionable error if no supported browser is discovered
 */

import fs from 'fs';
import { execSync } from 'child_process';

/**
 * Resolves the absolute path to a Chrome or Chromium executable.
 * @returns {string} Absolute path to resolved browser executable.
 */
export function resolveChromeExecutable() {
  // 1. CHROME_PATH environment variable
  if (process.env.CHROME_PATH) {
    const customPath = process.env.CHROME_PATH.trim();
    if (fs.existsSync(customPath)) {
      return customPath;
    }
    throw new Error(
      `[Chrome Discovery] CHROME_PATH environment variable is set to '${customPath}', ` +
      `but the executable does not exist at that location.`
    );
  }

  const platform = process.platform;
  const home = process.env.HOME || '';
  const candidates = [];

  // 2. Platform-specific known installation paths
  if (platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
      `${home}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
      `${home}/Applications/Chromium.app/Contents/MacOS/Chromium`
    );
  } else if (platform === 'linux') {
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
      '/usr/local/bin/google-chrome',
      '/usr/local/bin/chromium'
    );
  } else if (platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || '';
    const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
    const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';

    candidates.push(
      `${programFiles}\\Google\\Chrome\\Application\\chrome.exe`,
      `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe`,
      `${localAppData}\\Google\\Chrome\\Application\\chrome.exe`,
      `${programFiles}\\Chromium\\Application\\chrome.exe`,
      `${programFilesX86}\\Chromium\\Application\\chrome.exe`
    );
  }

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // 3. System PATH discovery (which / where)
  const lookupCmds = platform === 'win32'
    ? ['where chrome.exe', 'where chromium.exe']
    : ['which google-chrome', 'which google-chrome-stable', 'which chromium', 'which chromium-browser'];

  for (const cmd of lookupCmds) {
    try {
      const output = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .split(/\r?\n/)[0]
        .trim();
      if (output && fs.existsSync(output)) {
        return output;
      }
    } catch {}
  }

  // 4. Actionable error if not found
  throw new Error(
    `[Chrome Discovery] Could not find a valid Google Chrome or Chromium executable on platform '${platform}'.\n` +
    `Please install Google Chrome or Chromium, or set the CHROME_PATH environment variable:\n` +
    `  export CHROME_PATH="/path/to/google-chrome"\n`
  );
}

/**
 * Retrieves the version string of the resolved Chrome/Chromium binary.
 * @param {string} chromePath Path to browser executable
 * @returns {string} Clean version string (e.g. "Google Chrome 153.0.8010.53")
 */
export function getChromeVersion(chromePath) {
  try {
    const output = execSync(`"${chromePath}" --version`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    return output || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

/**
 * Logs resolved browser metadata to console.
 * @param {string} chromePath Path to browser executable
 * @returns {string} Version string
 */
export function logResolvedBrowser(chromePath) {
  const version = getChromeVersion(chromePath);
  console.log(`Resolved Chrome executable: ${chromePath}`);
  console.log(`Chrome version: ${version}`);
  return version;
}
