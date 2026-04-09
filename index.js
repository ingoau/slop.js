'use strict';

const { OpenAI } = require('openai');

const SYSTEM_PROMPT =
  'You are a JavaScript code generator. ' +
  'When given a prompt, respond with ONLY valid JavaScript code that can be executed within eval(). ' +
  'Do not wrap the code in markdown code fences, do not add explanations, ' +
  'and do not include any text other than the raw JavaScript code itself.';

const RETRY_MESSAGE =
  'The previous code threw an error: %s\n\n' +
  'Please fix the code and respond with only the corrected JavaScript.';

/**
 * Generate JavaScript code from a natural-language prompt using an AI model,
 * eval() the result, and automatically retry with error feedback if it throws.
 *
 * @param {string} prompt - Natural-language description of the code to generate.
 * @param {object} [options]
 * @param {string} [options.provider]    - AI provider: "openai" (default) or "anthropic".
 * @param {string} [options.apiKey]      - API key (defaults to OPENAI_API_KEY or ANTHROPIC_API_KEY env var).
 * @param {string} [options.baseURL]     - Custom base URL for OpenAI-compatible providers (Groq, Mistral, etc.).
 * @param {string} [options.model]       - Model to use (default: "gpt-4o" for OpenAI, "claude-opus-4-5" for Anthropic).
 * @param {number} [options.maxRetries]  - Maximum number of AI fix attempts (default: 10).
 * @returns {Promise<*>} Resolves with the value returned by the evaluated code.
 */
async function slop(prompt, options = {}) {
  const { provider = 'openai', maxRetries = 10 } = options;

  if (provider === 'anthropic') {
    return slopAnthropic(prompt, options, maxRetries);
  }

  return slopOpenAI(prompt, options, maxRetries);
}

async function slopOpenAI(prompt, options, maxRetries) {
  const {
    apiKey = process.env.OPENAI_API_KEY,
    model = 'gpt-4o',
    baseURL,
  } = options;

  const clientOptions = { apiKey };
  if (baseURL) clientOptions.baseURL = baseURL;
  const client = new OpenAI(clientOptions);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user',   content: prompt },
  ];

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // On retry, tell the AI about the error so it can fix the code.
    if (lastError !== null) {
      messages.push({
        role: 'user',
        content: RETRY_MESSAGE.replace('%s', lastError.message),
      });
    }

    const response = await client.chat.completions.create({ model, messages });
    const code = response.choices[0].message.content;

    // Keep the conversation going so the AI has its own prior output as context.
    messages.push({ role: 'assistant', content: code });

    try {
      // Raw, unsandboxed eval — intentionally so per the design.
      // eslint-disable-next-line no-eval
      const result = eval(code); // nosonar
      // Transparently support code that itself returns a Promise.
      return result && typeof result.then === 'function' ? await result : result;
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) {
        throw new Error(
          `slop.js: gave up after ${maxRetries} attempt(s). Last error: ${err.message}`,
        );
      }
    }
  }
}

async function slopAnthropic(prompt, options, maxRetries) {
  const { Anthropic } = require('@anthropic-ai/sdk');
  const {
    apiKey = process.env.ANTHROPIC_API_KEY,
    model = 'claude-opus-4-5',
  } = options;

  const client = new Anthropic({ apiKey });

  // Anthropic keeps the system prompt separate; messages are user/assistant only.
  const messages = [{ role: 'user', content: prompt }];

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // On retry, tell the AI about the error so it can fix the code.
    if (lastError !== null) {
      messages.push({
        role: 'user',
        content: RETRY_MESSAGE.replace('%s', lastError.message),
      });
    }

    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
    });
    const code = response.content[0].text;

    // Keep the conversation going so the AI has its own prior output as context.
    messages.push({ role: 'assistant', content: code });

    try {
      // Raw, unsandboxed eval — intentionally so per the design.
      // eslint-disable-next-line no-eval
      const result = eval(code); // nosonar
      // Transparently support code that itself returns a Promise.
      return result && typeof result.then === 'function' ? await result : result;
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) {
        throw new Error(
          `slop.js: gave up after ${maxRetries} attempt(s). Last error: ${err.message}`,
        );
      }
    }
  }
}

module.exports = slop;
