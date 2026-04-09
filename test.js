'use strict';

/**
 * Smoke-tests for slop.js
 *
 * These tests mock the OpenAI client so no real API key is needed.
 * They verify the retry-on-error loop and the happy-path return value.
 */

const assert = require('assert');

// ---------------------------------------------------------------------------
// Minimal OpenAI mock injected via module-cache manipulation
// ---------------------------------------------------------------------------
let callCount = 0;
let responsesToReturn = [];

// Patch require('openai') before loading index.js
require.cache[require.resolve('openai')] = {
  id: require.resolve('openai'),
  filename: require.resolve('openai'),
  loaded: true,
  exports: {
    OpenAI: class MockOpenAI {
      constructor() {}
      get chat() {
        return {
          completions: {
            create: async () => {
              const code = responsesToReturn[callCount] ?? responsesToReturn[responsesToReturn.length - 1];
              callCount++;
              return { choices: [{ message: { content: code } }] };
            },
          },
        };
      }
    },
  },
};

const slop = require('./index.js');

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function reset(responses) {
  callCount = 0;
  responsesToReturn = responses;
}

// ---------------------------------------------------------------------------
// Test 1 — happy path: code works on the first attempt
// ---------------------------------------------------------------------------
async function testHappyPath() {
  reset(['1 + 1']);
  const result = await slop('add 1 and 1');
  assert.strictEqual(result, 2, 'Expected eval("1 + 1") === 2');
  assert.strictEqual(callCount, 1, 'Expected exactly one AI call');
  console.log('✓ testHappyPath');
}

// ---------------------------------------------------------------------------
// Test 2 — retry loop: first response throws, second is correct
// ---------------------------------------------------------------------------
async function testRetryOnError() {
  reset([
    'throw new Error("oops")', // attempt 1 – fails
    '"fixed"',                 // attempt 2 – succeeds
  ]);
  const result = await slop('do something', { maxRetries: 5 });
  assert.strictEqual(result, 'fixed', 'Expected result after retry to be "fixed"');
  assert.strictEqual(callCount, 2, 'Expected two AI calls (one fail + one fix)');
  console.log('✓ testRetryOnError');
}

// ---------------------------------------------------------------------------
// Test 3 — exhausted retries: should throw after maxRetries attempts
// ---------------------------------------------------------------------------
async function testExhaustedRetries() {
  reset(['throw new Error("always broken")']);
  let threw = false;
  try {
    await slop('break everything', { maxRetries: 3 });
  } catch (err) {
    threw = true;
    assert.ok(
      err.message.includes('gave up after 3 attempt(s)'),
      `Unexpected error message: ${err.message}`,
    );
  }
  assert.ok(threw, 'Expected slop() to throw after exhausting retries');
  assert.strictEqual(callCount, 3, 'Expected exactly 3 AI calls');
  console.log('✓ testExhaustedRetries');
}

// ---------------------------------------------------------------------------
// Test 4 — async code: eval result that is itself a Promise is awaited
// ---------------------------------------------------------------------------
async function testAsyncCode() {
  reset(['Promise.resolve(42)']);
  const result = await slop('return a promise resolving to 42');
  assert.strictEqual(result, 42, 'Expected awaited promise result to be 42');
  console.log('✓ testAsyncCode');
}

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
(async () => {
  try {
    await testHappyPath();
    await testRetryOnError();
    await testExhaustedRetries();
    await testAsyncCode();
    console.log('\nAll tests passed.');
  } catch (err) {
    console.error('\nTest failed:', err);
    process.exit(1);
  }
})();
