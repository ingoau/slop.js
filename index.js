'use strict';

const { OpenAI } = require('openai');

const SYSTEM_PROMPT =
  'You are a JavaScript code generator. ' +
  'When given a prompt, respond with ONLY valid JavaScript code that can be executed within eval(). ' +
  'Do not wrap the code in markdown code fences, do not add explanations, ' +
  'and do not include any text other than the raw JavaScript code itself.';

/**
 * Generate JavaScript code from a natural-language prompt using an AI model,
 * eval() the result, and automatically retry with error feedback if it throws.
 *
 * @param {string} prompt - Natural-language description of the code to generate.
 * @param {object} [options]
 * @param {string} [options.apiKey]      - OpenAI API key (defaults to OPENAI_API_KEY env var).
 * @param {string} [options.model]       - OpenAI model to use (default: "gpt-4o").
 * @param {number} [options.maxRetries]  - Maximum number of AI fix attempts (default: 10).
 * @returns {Promise<*>} Resolves with the value returned by the evaluated code.
 */
async function slop(prompt, options = {}) {
  const {
    apiKey = process.env.OPENAI_API_KEY,
    model = 'gpt-4o',
    maxRetries = 10,
  } = options;

  const client = new OpenAI({ apiKey });

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
        content:
          `The previous code threw an error: ${lastError.message}\n\n` +
          'Please fix the code and respond with only the corrected JavaScript.',
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

module.exports = slop;
