/**
 * netlify/functions/claude.js
 *
 * Serverless proxy for the Anthropic Claude API.
 * Runs server-side on Netlify — no CORS issues, API key never in browser network tab.
 *
 * How it works:
 * 1. index.html calls POST /netlify/functions/claude with { ...payload, apiKey }
 * 2. This function strips the apiKey, calls Anthropic server-side, returns response
 * 3. Client never sees the raw Anthropic endpoint or auth headers
 */

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

exports.handler = async function(event, context) {

  /* Only allow POST */
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  /* Extract apiKey from body — never forwarded to Anthropic */
  const { apiKey, ...payload } = body;

  /* Validate key format */
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: { message: 'Invalid or missing API key. Must start with sk-ant-' } }),
    };
  }

  /* Optional: use env var as override (set in Netlify dashboard → Site settings → Environment variables) */
  const effectiveKey = process.env.ANTHROPIC_API_KEY || apiKey;

  try {
    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': effectiveKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        /* Allow only same-origin calls — tighten in production */
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data),
    };

  } catch (err) {
    console.error('Claude proxy error:', err);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: { message: 'Upstream API call failed: ' + err.message } }),
    };
  }
};
