# slop.js

Never trust your own code again with **slop.js**, have AI generate your code each time you want to do something.

It will `.eval()` the code you prompt it to make every single fucking time. Oh there's also no sandboxing or protection.

### Why?

I don't know.

### When?

Hopefully never.

### What (the fuck)?

Any and all further questions will go through my lawyer.

## How it works

1. You give `slop()` a prompt.
2. It asks an AI model to write the JavaScript code.
3. It `eval()`s the generated code **completely raw with no protection**.
4. If the code throws, the error is fed back to the AI and it tries again, up to `maxRetries` times.
5. The function is `async`, so you can `await` it before running the next call.
6. Optionally, results can be **cached** by prompt so the AI is never called twice for the same input. The cache is persisted to `~/.slop-cache.json` and survives process restarts.

## Installation

```bash
npm install @gizzixz/slop.js
```

## Usage

```js
const slop = require('slop.js');

// Set your OpenAI API key (or pass it via the options object)
process.env.OPENAI_API_KEY = 'sk-...';

(async () => {
  // Generates code, evals it, returns the result.
  // If the code errors, the AI fixes it automatically.
  const result = await slop('write code that returns the sum of 1 through 10');
  console.log(result); // 55

  // You can await each call before moving on to the next.
  const greeting = await slop('write code that returns "Hello, world!"');
  console.log(greeting); // Hello, world!

  // Enable caching so the AI is only called once per unique prompt.
  // The result is saved to ~/.slop-cache.json and reused on future runs.
  const cached = await slop('write code that returns the sum of 1 through 10', { cache: true });
  console.log(cached); // 55  (returned instantly on the second run)
})();
```

## Options

```js
const result = await slop('your prompt here', {
  provider:   'openai',   // AI provider: "openai" (default) or "anthropic"
  apiKey:     'sk-...',   // API key (default: OPENAI_API_KEY or ANTHROPIC_API_KEY env var)
  baseURL:    '...',      // Custom base URL for OpenAI-compatible providers (see below)
  model:      'gpt-4o',   // Model to use (default: "gpt-4o" for OpenAI, "claude-opus-4-5" for Anthropic)
  maxRetries: 10,         // Max AI fix attempts before throwing (default: 10)
  cache:      false,      // Cache results by prompt and return them on subsequent calls (default: false)
                          // Persisted to ~/.slop-cache.json and survives process restarts
});
```

## Supported providers

### OpenAI (default)

```js
process.env.OPENAI_API_KEY = 'sk-...';
const result = await slop('your prompt');
```

### Anthropic (Claude)

```js
process.env.ANTHROPIC_API_KEY = 'sk-ant-...';
const result = await slop('your prompt', { provider: 'anthropic' });
```

### OpenAI-compatible providers

Any provider with an OpenAI-compatible API (Groq, Mistral, Together AI, Perplexity, OpenRouter, Google Gemini, etc.) can be used via the `baseURL` option:

```js
// Groq
const result = await slop('your prompt', {
  apiKey:   process.env.GROQ_API_KEY,
  baseURL:  'https://api.groq.com/openai/v1',
  model:    'llama-3.3-70b-versatile',
});

// Mistral
const result = await slop('your prompt', {
  apiKey:   process.env.MISTRAL_API_KEY,
  baseURL:  'https://api.mistral.ai/v1',
  model:    'mistral-large-latest',
});

// Google Gemini (OpenAI-compatible endpoint)
const result = await slop('your prompt', {
  apiKey:   process.env.GEMINI_API_KEY,
  baseURL:  'https://generativelanguage.googleapis.com/v1beta/openai/',
  model:    'gemini-2.0-flash',
});
```

## ⚠️ Warning

`slop.js` calls `eval()` on AI-generated code with **zero sandboxing**. It will execute whatever the model returns with full access to your Node.js process. Only use it in environments where you accept this risk.
