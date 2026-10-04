# Hemma Roadmap (repo: roost)

## App Store push 2026-09-03
- [ ] Not yet in App Store Connect. Next steps: asc-name-creator probe (Roost
      itself not checked), native iOS/macOS build, signing, screenshots, ASC
      record creation, submit. Multi-hour job, own session.
- [ ] Positioning ammo from a competitor scan: Zillow reviews complain about
      broken saved commute filters, removed sold-price history, forced AI
      tagging over manual tags. Roost's edge if/when shipped: keep price
      history and manual tags simple and reliable.

## Braindump 2026-08-19
- [ ] Rename? "Roost" may not be the final name, run asc-name-creator for alternatives before any App Store record is made.

## From Apple Notes (imported 2026-08-27)
- [ ] Roost needs a landing page and iOS/Mac apps.

## Worldwide build 2026-08-28
Web app now browses anywhere on earth: Nominatim place search, real local street
names from Overpass, per-country currency/units/price levels, sale and rent
modes, and UI strings in 25 languages with RTL.

- [ ] Native iOS + macOS apps. Not started. One SwiftUI multiplatform target with
      MapKit, reusing the same market tables and generator ported to Swift.
- [ ] Login/Register/ForgotPassword copy is still English-only; the strings dict
      has the keys, the pages just do not call `t()` yet.
- [ ] Listing descriptions and feature bullets were removed: the old generated
      English prose could not be localized. Either translate a template or wait
      for a real feed.
- [ ] Inventory is generated, not real. Shape matches an MLS/IDX response so a
      feed swap is one function (`generateListings`).
- [ ] Rename check before any App Store record, run asc-name-creator.
- [x] Landing pitch translated into all 26 languages (2026-09-06).

## Demo pass 2026-08-30

Signing in worked for the first time, so the app behind /browse got a real look.
Fixed: Overpass mirrors + a 30 day localStorage cache, Esri dark tiles (CARTO
watermarks unkeyed domains), pin thinning by zoom, favorites synced to the
account, Settings preferences actually applied to browse filters and priced off
the local market, protected routes waiting for the session instead of bouncing
signed-in people to /login, the filter row wrapping instead of looking clipped,
and the detail page's mislabelled area/year stats.

- [x] Price pins now use Web Mercator pixel collision checks at each zoom, so
      dense pockets show separated pills without adding a cluster library.
- [ ] No land check on generated coordinates. Street anchors are on land by
      construction, but the no-streets fallback can still put a home in water.
- [ ] Service worker serves the previous build for one load after a deploy.
      Every check of a fresh deploy needs a hard reload or an unregister first.
- [ ] `animate.css` is imported in `src/main.jsx` and never used: roughly 70K of
      the 108K CSS bundle.
- [ ] JS ships as one 592K chunk; Leaflet loads on the landing page where there
      is no map. Wants a route-level split.
- [ ] Login/Register/ForgotPassword copy is still English-only.
- [ ] `npm test` runs two node files. No CI runs them.
- [ ] 12 photos across 60 listings, so each image is the hero of 5 homes.

## TUI pilot (2026-09-05)
- `roost-tui` SwiftPM target (SwiftTUI). `swift build && ./.build/debug/roost-tui "Vancouver"` hits Nominatim directly, same public geocoding API src/lib/geo.js calls. Needs a real TTY.

## 2026-09-10 loading cleanup

Removed the unused animate.css import and dependency. App routes load on demand; Leaflet CSS travels with the map. The main JavaScript bundle is 437 kB, with the 162 kB listings bundle separate. Build and both test suites pass. Existing test CI was verified in .github/workflows/test.yml.

## From Notes (2026-09-12)
- [ ] Sync UI/color palette more with portfolio and other projects
