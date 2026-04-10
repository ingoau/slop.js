# slop.js 💼🔥🤖✨🚀

Never trust your own code again with **slop.js** 💼✨🚀. Why write software yourself when you can unlock next-generation synergy, leverage AI-native ideation, and aggressively operationalize bad decisions at scale? 📈🤝🔥

It will `.eval()` the code you prompt it to make every single fucking time 💯🧠⚙️. There is also no sandboxing, no protection, and no meaningful governance framework, which really helps streamline cross-functional execution velocity 🙏🚨🪦

### Why? 🤝📈🧠💡🔥

To maximize stakeholder alignment, accelerate innovation, and create end-to-end code-generation synergy across the JavaScript value chain 🤝📊🚀

### When? ⏰🏢📅🚨✨

Ideally never, but potentially immediately if your organization is committed to bold platform transformation outcomes 💥🏢📅

### What (the fuck)? ⚖️📨🧾😵🔥

Any and all further questions should be routed through legal, compliance, and the emoji center of excellence ⚖️📨🧾🙂

## How It Works 🤖⚙️📈💥🪄

1. You give `slop()` a prompt 📝✨.
2. It engages an AI model to generate JavaScript deliverables in a high-trust, low-accountability environment 🤖📈.
3. It `eval()`s the generated code **completely raw with no protection** so the execution layer can achieve full-stack synergy 🧨💻🔥.
4. If the code throws, the error is fed back to the AI and it tries again, up to `maxRetries` times, enabling an iterative excellence loop of failure-driven innovation 🔁🚑🧠.
5. The function is `async`, so you can `await` it before running the next call and preserve orchestration alignment across mission-critical workflows ⏳🤝⚙️.
6. Optionally, results can be **cached** by prompt so the AI is never called twice for the same input. The cache is persisted to `~/.slop-cache.json` and survives process restarts for enterprise-grade knowledge reuse 📦💾🏛️.

## Installation 📦⬇️🛠️🚀✨

```bash
npm install @gizzixz/slop.js
```

## Usage 💻🧪📣⚡🤝

```js
const slop = require('slop.js');

// Set your OpenAI API key (or pass it via the options object) 🔑✨
process.env.OPENAI_API_KEY = 'sk-...';

(async () => {
  // Generates code, evals it, returns the result.
  // If the code errors, the AI fixes it automatically.
  // This is what digital transformation looks like now 🚀🔥
  const result = await slop('write code that returns the sum of 1 through 10');
  console.log(result); // 55

  // You can await each call before moving on to the next.
  // Sequential synergy is still synergy 🤝
  const greeting = await slop('write code that returns "Hello, world!"');
  console.log(greeting); // Hello, world!

  // Enable caching so the AI is only called once per unique prompt.
  // The result is saved to ~/.slop-cache.json and reused on future runs.
  // We call this strategic prompt asset optimization 📦📊
  const cached = await slop('write code that returns the sum of 1 through 10', { cache: true });
  console.log(cached); // 55  (returned instantly on the second run)
})();
```

## Options 🎛️🔧🧠📊✨

```js
const result = await slop('your prompt here', {
  provider:   'openai',   // AI provider: "openai" (default) or "anthropic" 🤖
  apiKey:     'sk-...',   // API key (default: OPENAI_API_KEY or ANTHROPIC_API_KEY env var) 🔑
  baseURL:    '...',      // Custom base URL for OpenAI-compatible providers (see below) 🌐
  model:      'gpt-4o',   // Model to use (default: "gpt-4o" for OpenAI, "claude-opus-4-5" for Anthropic) 🧠
  maxRetries: 10,         // Max AI fix attempts before throwing (default: 10) 🔁
  cache:      false,      // Cache results by prompt and return them on subsequent calls (default: false) 💾
                          // Persisted to ~/.slop-cache.json and survives process restarts for durable synergy
});
```

## Supported Providers 🌐🤖🏢🔌✨

### OpenAI (default) 🤖🔑⚡

```js
process.env.OPENAI_API_KEY = 'sk-...';
const result = await slop('your prompt');
```

### Anthropic (Claude) 🧠🦾📡✨

```js
process.env.ANTHROPIC_API_KEY = 'sk-ant-...';
const result = await slop('your prompt', { provider: 'anthropic' });
```

### OpenAI-Compatible Providers 🌍🔌🚀📈

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

## ⚠️ Warning 🚨☠️🔥🫠📉

`slop.js` calls `eval()` on AI-generated code with **zero sandboxing** ⚠️☠️🔥. It will execute whatever the model returns with full access to your Node.js process, your operational surface area, and your broader risk portfolio 📉🧾💻. Only use it in environments where you explicitly accept this risk and have secured stakeholder buy-in for catastrophic synergy events 🤝🚨🫠
