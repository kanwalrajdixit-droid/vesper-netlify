# VESPER — Netlify Deployment

## Folder Structure

```
vesper-netlify/
├── index.html                    ← VESPER frontend (complete app)
├── netlify.toml                  ← Netlify build + routing config
├── netlify/
│   └── functions/
│       └── claude.js             ← Serverless Claude API proxy
└── README.md
```

## How the proxy works

```
Browser (index.html)
  │
  │  POST /netlify/functions/claude
  │  Body: { ...claudePayload, apiKey: "sk-ant-..." }
  │
  ▼
Netlify Function (claude.js)  ← runs server-side, no CORS
  │
  │  POST https://api.anthropic.com/v1/messages
  │  Headers: x-api-key: sk-ant-...
  │
  ▼
Anthropic API
```

The API key travels from browser → Netlify function → Anthropic.
It never appears in a browser network tab as an outbound header.

---

## Deploy Steps

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "VESPER initial deploy"
git remote add origin https://github.com/YOUR_USERNAME/vesper.git
git push -u origin main
```

### 2. Connect to Netlify

1. Go to [netlify.com](https://netlify.com) → Log in
2. Click **Add new site** → **Import an existing project**
3. Choose **GitHub** → select your repo
4. Build settings (auto-detected from netlify.toml):
   - **Build command:** *(leave blank)*
   - **Publish directory:** `.`
5. Click **Deploy site**

### 3. Optional — Store API key as environment variable

Instead of entering the key every session, set it in Netlify:

1. Netlify dashboard → Your site → **Site configuration** → **Environment variables**
2. Add: `ANTHROPIC_API_KEY` = `sk-ant-your-key-here`
3. Redeploy

When `ANTHROPIC_API_KEY` is set in Netlify, the function uses it directly
and ignores whatever key the user types in the banner. You can then remove
the API key banner from index.html entirely if you want.

---

## Local Development

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run locally (functions + static files)
netlify dev
```

Open http://localhost:8888 — the proxy function works locally too.
