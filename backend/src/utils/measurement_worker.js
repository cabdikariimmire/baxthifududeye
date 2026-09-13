#!/usr/bin/env node

// measurement_worker.js
// Called by browserMeasurementSync to perform asynchronous browser measurement in a separate process.
// Accepts a single argument: a base64-encoded JSON string with measurement options.
// Outputs a single line of JSON to stdout containing the measurement result.

const path = require('path');

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('No measurement options provided');
    process.exit(1);
  }
  let opts;
  try {
    // Decode base64 argument
    const jsonStr = Buffer.from(arg, 'base64').toString('utf8');
    opts = JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse measurement options:', e);
    process.exit(1);
  }
  // Import the async measurement service. A batch shares one browser/page pool
  // lifecycle, which is important because pagination measures many blocks.
  const { measureText, measureTextBatch } = require('../services/document/browserMeasurementService');
  const { closeBrowser } = require('./browserSingleton');
  try {
    let result;
    if (Array.isArray(opts.batch)) {
      result = await measureTextBatch(opts.batch);
    } else {
      result = await measureText(opts);
    }
    // Print result as JSON on stdout (no extra whitespace)
    console.log(JSON.stringify(result));
  } catch (e) {
    console.error('Measurement error:', e);
    process.exitCode = 1;
  } finally {
    // Do not leave Chromium alive after the synchronous parent receives the
    // result. This was the source of the old worker hang.
    await closeBrowser();
  }
}

main();
