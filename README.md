# slop.js

Never trust your own code again with **slop.js** — have AI generate your code each time you want to do something, and automatically fix it whenever it breaks.

## How it works

1. You give `slop()` a natural-language prompt.
2. It asks an OpenAI model to write the JavaScript code.
3. It `eval()`s the generated code — **raw, no sandboxing**.
4. If the code throws, the error is fed back to the AI and it tries again, up to `maxRetries` times.
5. The function is `async`, so you can `await` it before running the next call.

## Installation

```bash
npm install slop.js
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
})();
```

## Options

```js
const result = await slop('your prompt here', {
  apiKey:     'sk-...',   // OpenAI API key (default: process.env.OPENAI_API_KEY)
  model:      'gpt-4o',   // Model to use (default: 'gpt-4o')
  maxRetries: 10,         // Max AI fix attempts before throwing (default: 10)
});
```

## ⚠️ Warning

`slop.js` calls `eval()` on AI-generated code with **zero sandboxing**. It will execute whatever the model returns with full access to your Node.js process. Only use it in environments where you accept this risk.
