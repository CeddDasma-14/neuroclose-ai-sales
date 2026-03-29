'use strict';

/**
 * LangFuse observability wrapper.
 *
 * Traces every Claude API call: model, prompt, output, token usage.
 * Falls through silently if LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY are not set.
 * Never throws — LangFuse errors must not affect the main pipeline.
 */

let _langfuse = null;
let _initialized = false;

function getLangfuse() {
  if (_initialized) return _langfuse;
  _initialized = true;

  const { LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_BASE_URL } = process.env;
  const LANGFUSE_BASEURL = LANGFUSE_BASE_URL;
  if (!LANGFUSE_PUBLIC_KEY || !LANGFUSE_SECRET_KEY) return null;

  try {
    const { Langfuse } = require('langfuse');
    _langfuse = new Langfuse({
      publicKey: LANGFUSE_PUBLIC_KEY,
      secretKey: LANGFUSE_SECRET_KEY,
      baseUrl: LANGFUSE_BASEURL || 'https://cloud.langfuse.com',
    });
    return _langfuse;
  } catch {
    return null;
  }
}

/**
 * Wraps a client.messages.create call with a LangFuse generation trace.
 * Returns the raw Anthropic response — identical to calling client.messages.create directly.
 *
 * @param {object} client       - Anthropic SDK client
 * @param {string} traceName    - Workflow name, e.g. 'classifyReply'
 * @param {string|null} userId  - Lead phone number (for per-lead tracing in LangFuse UI)
 * @param {object} metadata     - Any extra context to attach to the trace
 * @param {object} createParams - Params passed directly to client.messages.create
 */
async function tracedCreate(client, traceName, userId, metadata, createParams) {
  const lf = getLangfuse();

  if (!lf) {
    return client.messages.create(createParams);
  }

  const trace = lf.trace({ name: traceName, userId: userId || undefined, metadata });
  const generation = trace.generation({
    name: traceName,
    model: createParams.model,
    input: createParams.messages,
  });

  try {
    const response = await client.messages.create(createParams);
    generation.end({
      output: response.content[0]?.text,
      usage: {
        input: response.usage?.input_tokens,
        output: response.usage?.output_tokens,
      },
    });
    lf.flushAsync().catch(() => {});
    return response;
  } catch (err) {
    generation.end({ output: `ERROR: ${err.message}` });
    lf.flushAsync().catch(() => {});
    throw err;
  }
}

module.exports = { tracedCreate };
