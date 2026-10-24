# Kohinoor Mills — Energy Management System Client

A standalone React + Vite frontend for the existing EMS Express API. This client does not contain or replace the backend.

## Requirements
- Node.js 22.22 or newer
- The existing Express server running at `http://127.0.0.1:3000`

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Vite proxies `/api` requests to `http://127.0.0.1:3000` by default. To use another backend address, copy `.env.example` to `.env` and set `VITE_API_PROXY_TARGET`.

## Build client

```bash
npm run build
npm run preview
```

The production build is created in this project's `dist/` directory. It does not write to or modify the Express server directory. For production, host the `dist/` folder and configure your reverse proxy to forward `/api` to the existing Express server.

## UI features
- Responsive EMS dashboard and existing division/report routes retained
- Premium Kohinoor-inspired teal, slate and neutral design system
- Light and dark themes, with the user's selection retained in local browser storage
- Reusable dashboard cards, charts, meter tables and shared reading display component
- Failed/missing BACnet readings show a red `0` with an explanatory tooltip; a real numeric zero is shown normally
- Existing API client remains unchanged

## Brand reference
Visual direction references the official Kohinoor Mills website: https://kohinoormills.com/ — textile-industry heritage, modern manufacturing, sustainability and restrained corporate colors. This is an EMS dashboard, not a copy of the marketing website.
