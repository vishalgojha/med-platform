# Mediscribe

## Setup

```bash
npm install
cp .env.example .env
```

Set Supabase values in `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Run

```bash
npm run dev -- --port 4102
```

## Validate

```bash
npm run typecheck
npm run build
```
