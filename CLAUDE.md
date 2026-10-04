# roost (Hemma)
v3.0.0, worldwide real estate browsing. Repo: https://github.com/nulljosh/roost

## Rules

- Mobile-first layout, horizontal filter chips on small screens
- Palette and type come from `src/tokens.css` (cream `#FFF3E8` (the icon background), bark `#3A2A20`,
  clay `#B5836A`, tan `#C9A184`, the icon palette). Edit that file; do not add a second theme.
  The harsh red `#E4002B` was softened to clay tones on 2026-08-31.
- Sans-serif only, DM Sans via `var(--font)` / `var(--font-display)`. No serif
  faces (the retired palette used Fraunces; it is gone).
- Map markers stay as price pill SVGs
- No emojis

## Run

```bash
cp .env.example .env   # Supabase keys, or auth stays disabled
npm install && npm run dev
npm run build
npm test
```

A deploy is served from the service worker cache for one load, so verify a fresh
deploy with a hard reload (or unregister the worker) before believing what you
see.

Auth reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` at build time. Without
them `authConfigured` is false and every sign-in shows "not configured".

## Deploy

Cloudflare Pages project `roost` (roost.heyitsmejosh.com), direct upload:

```bash
npm run build && npx wrangler pages deploy dist --project-name=roost --branch=main
```

Env vars live in the local `.env` and are baked into the bundle, not set in the
Pages dashboard.

## Key Files

- src/main.jsx: App bootstrap and Vite entry
- src/App.jsx: Routing and protected routes
- src/context/AuthContext.jsx: Supabase Auth (session, profile in user_metadata, Apple/Google OAuth alongside email/password)
- src/context/PlaceContext.jsx: Current place, sale/rent mode, locale
- src/context/FavoritesContext.jsx: Favorites with localStorage sync
- src/context/FiltersContext.jsx: Price, beds, type, sort filters
- src/lib/market.js: Per-country currency, units, price levels
- src/components/MapView.jsx: Leaflet map with price pill markers
- src/lib/geo.js: Nominatim place search + Overpass streets (mirrors, 30d cache)
- src/lib/mapPins.js: Which pins survive at a given zoom
- src/data/listings.js: Per-place seeded listing generation (MLS/IDX shape)
- src/pages/: Landing, Login, Register, ForgotPassword, Listings, ListingDetail, Settings
