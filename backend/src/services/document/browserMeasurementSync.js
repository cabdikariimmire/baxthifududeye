// Synchronous wrapper for browser measurement using a child process.
// This allows PaginationEngine (which is synchronous) to obtain measurements without async/await.

const path = require('path');
const { execFileSync } = require('child_process');

const resultCache = new Map();

function cacheKey(opts) {
  return JSON.stringify(opts);
}

function validateMeasurement(result, opts) {
  if (!result || !Number.isFinite(result.heightPt) || result.heightPt <= 0 ||
      !Number.isFinite(result.lineCount) || result.lineCount < 1 ||
      !Number.isFinite(result.lineHeightPt) || result.lineHeightPt <= 0) {
    throw new Error(`Browser measurement returned an invalid result for ${opts?.fontFamily || 'requested font'}: ${JSON.stringify(result)}`);
  }
  return result;
}

function runWorker(payload) {
  const workerPath = path.resolve(__dirname, '../../utils/measurement_worker.js');
  const b64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
  const stdout = execFileSync(process.execPath, [workerPath, b64], {
    encoding: 'utf8',
    timeout: 120000,
    windowsHide: true,
  });
  try {
    return JSON.parse(stdout.trim());
  } catch (error) {
    throw new Error(`Browser measurement worker returned invalid JSON: ${error.message}`);
  }
}

/**
 * Synchronously measure text using Puppeteer via a separate worker process.
 * @param {Object} opts Measurement options (same as measureText).
 * @returns {Object} Measurement result containing lineCount, lineHeightPt, etc.
 */
function measureSync(opts) {
  const key = cacheKey(opts);
  if (resultCache.has(key)) return resultCache.get(key);
  const result = validateMeasurement(runWorker(opts), opts);
  resultCache.set(key, result);
  return result;
}

/**
 * Measure a set of texts in one isolated worker/browser lifecycle. Pagination
 * uses this to avoid launching Chromium once per paragraph.
 */
function measureManySync(optionsList) {
  const missing = optionsList.filter((opts) => !resultCache.has(cacheKey(opts)));
  if (missing.length > 0) {
    const measured = runWorker({ batch: missing });
    if (!Array.isArray(measured) || measured.length !== missing.length) {
      throw new Error(`Browser measurement worker returned ${measured?.length || 0} results for ${missing.length} requests`);
    }
    missing.forEach((opts, index) => {
      resultCache.set(cacheKey(opts), validateMeasurement(measured[index], opts));
    });
  }
  return optionsList.map((opts) => resultCache.get(cacheKey(opts)));
}

module.exports = { measureSync, measureManySync };
