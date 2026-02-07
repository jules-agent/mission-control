# Mission Control Dashboard

A mission control dashboard built with Next.js 15, TypeScript, and Tailwind CSS. It features a live system status panel and a mission task manager backed by local JSON files.

## Setup

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Open `http://localhost:3000` to view the dashboard.

## Data storage

- Status data: `data/status.json`
- Tasks data: `data/tasks.json`

The API routes read and write directly to these files.

## Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - start production server
- `npm run lint` - run Next.js lint
# Trigger deployment with NEXT_PUBLIC_SUPABASE_URL
