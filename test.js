'use strict';

/**
 * Smoke-tests for slop.js
 *
 * These tests mock the OpenAI and Anthropic clients so no real API key is needed.
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

// Patch require('@anthropic-ai/sdk') before loading index.js
require.cache[require.resolve('@anthropic-ai/sdk')] = {
  id: require.resolve('@anthropic-ai/sdk'),
  filename: require.resolve('@anthropic-ai/sdk'),
  loaded: true,
  exports: {
    Anthropic: class MockAnthropic {
      constructor() {}
      get messages() {
        return {
          create: async () => {
            const code = responsesToReturn[callCount] ?? responsesToReturn[responsesToReturn.length - 1];
            callCount++;
            return { content: [{ type: 'text', text: code }] };
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
// Test 5 — Anthropic happy path: code works on the first attempt
// ---------------------------------------------------------------------------
async function testAnthropicHappyPath() {
  reset(['2 * 3']);
  const result = await slop('multiply 2 and 3', { provider: 'anthropic' });
  assert.strictEqual(result, 6, 'Expected eval("2 * 3") === 6');
  assert.strictEqual(callCount, 1, 'Expected exactly one Anthropic API call');
  console.log('✓ testAnthropicHappyPath');
}

// ---------------------------------------------------------------------------
// Test 6 — Anthropic retry loop: first response throws, second is correct
// ---------------------------------------------------------------------------
async function testAnthropicRetryOnError() {
  reset([
    'throw new Error("anthropic oops")', // attempt 1 – fails
    '"anthropic fixed"',                 // attempt 2 – succeeds
  ]);
  const result = await slop('do something', { provider: 'anthropic', maxRetries: 5 });
  assert.strictEqual(result, 'anthropic fixed', 'Expected result after Anthropic retry');
  assert.strictEqual(callCount, 2, 'Expected two Anthropic API calls (one fail + one fix)');
  console.log('✓ testAnthropicRetryOnError');
}

// ---------------------------------------------------------------------------
// Test 7 — Anthropic exhausted retries: should throw after maxRetries attempts
// ---------------------------------------------------------------------------
async function testAnthropicExhaustedRetries() {
  reset(['throw new Error("always broken")']);
  let threw = false;
  try {
    await slop('break everything', { provider: 'anthropic', maxRetries: 3 });
  } catch (err) {
    threw = true;
    assert.ok(
      err.message.includes('gave up after 3 attempt(s)'),
      `Unexpected error message: ${err.message}`,
    );
  }
  assert.ok(threw, 'Expected slop() to throw after exhausting Anthropic retries');
  assert.strictEqual(callCount, 3, 'Expected exactly 3 Anthropic API calls');
  console.log('✓ testAnthropicExhaustedRetries');
}

// ---------------------------------------------------------------------------
// Test 8 — OpenAI-compatible baseURL: passes baseURL to OpenAI constructor
// ---------------------------------------------------------------------------
async function testOpenAICompatibleBaseURL() {
  reset(['"groq result"']);
  // The MockOpenAI ignores baseURL, so this just verifies no error is thrown
  // and the result flows through correctly.
  const result = await slop('return a string', {
    baseURL: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
  });
  assert.strictEqual(result, 'groq result', 'Expected result with custom baseURL');
  assert.strictEqual(callCount, 1, 'Expected exactly one API call with baseURL');
  console.log('✓ testOpenAICompatibleBaseURL');
}

// ---------------------------------------------------------------------------
// Test 9 — cache miss then hit: second call returns cached result without AI
// ---------------------------------------------------------------------------
async function testCacheMissThenHit() {
  // Clear the module-level cache between test runs by deleting the cached module
  // and re-requiring it, then restore the mock in the new module cache entry.
  // Simpler: use a unique prompt so no prior test entry exists.
  reset(['"cached value"']);
  const uniquePrompt = 'unique prompt for cache test ' + Date.now();

  // First call — cache miss, AI is called.
  const result1 = await slop(uniquePrompt, { cache: true });
  assert.strictEqual(result1, 'cached value', 'Expected first call to return AI result');
  assert.strictEqual(callCount, 1, 'Expected one AI call on cache miss');

  // Second call — cache hit, AI should NOT be called again.
  const countBefore = callCount;
  const result2 = await slop(uniquePrompt, { cache: true });
  assert.strictEqual(result2, 'cached value', 'Expected second call to return cached result');
  assert.strictEqual(callCount, countBefore, 'Expected no additional AI calls on cache hit');

  console.log('✓ testCacheMissThenHit');
}

// ---------------------------------------------------------------------------
// Test 10 — cache disabled: same prompt calls AI every time
// ---------------------------------------------------------------------------
async function testCacheDisabled() {
  reset(['"no cache"']);
  const uniquePrompt = 'no cache prompt ' + Date.now();

  await slop(uniquePrompt, { cache: false });
  assert.strictEqual(callCount, 1, 'Expected one AI call');

  await slop(uniquePrompt, { cache: false });
  assert.strictEqual(callCount, 2, 'Expected a second AI call when cache is disabled');

  console.log('✓ testCacheDisabled');
}

// ---------------------------------------------------------------------------
// Test 11 — cache isolation: same prompt with different provider is cached separately
// ---------------------------------------------------------------------------
async function testCacheIsolatedByProvider() {
  const uniquePrompt = 'cache isolation prompt ' + Date.now();

  // First call via openai
  reset(['"openai result"']);
  const r1 = await slop(uniquePrompt, { cache: true, provider: 'openai' });
  assert.strictEqual(r1, 'openai result');
  assert.strictEqual(callCount, 1, 'Expected one AI call for openai');

  // Second call via anthropic with same prompt — must NOT use the openai cached value
  reset(['"anthropic result"']);
  const r2 = await slop(uniquePrompt, { cache: true, provider: 'anthropic' });
  assert.strictEqual(r2, 'anthropic result');
  assert.strictEqual(callCount, 1, 'Expected one AI call for anthropic (separate cache entry)');

  // Third call via openai again — should hit cache, no extra AI call
  reset(['"should not be used"']);
  const r3 = await slop(uniquePrompt, { cache: true, provider: 'openai' });
  assert.strictEqual(r3, 'openai result', 'Expected cached openai result');
  assert.strictEqual(callCount, 0, 'Expected zero AI calls on cache hit');

  console.log('✓ testCacheIsolatedByProvider');
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
    await testAnthropicHappyPath();
    await testAnthropicRetryOnError();
    await testAnthropicExhaustedRetries();
    await testOpenAICompatibleBaseURL();
    await testCacheMissThenHit();
    await testCacheDisabled();
    await testCacheIsolatedByProvider();
    console.log('\nAll tests passed.');
  } catch (err) {
    console.error('\nTest failed:', err);
    process.exit(1);
  }
})();
