# Medipal

## Setup

```bash
npm install
cp .env.example .env
```

Set Supabase values in `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_AGENT_API_BASE_URL` (defaults to `http://127.0.0.1:3001`)
- `VITE_AGENT_API_TOKEN` (optional Bearer token for protected `/api/*` routes)

## Run

```bash
npm run dev -- --port 4103
```

## Validate

```bash
npm run typecheck
npm run build
```
