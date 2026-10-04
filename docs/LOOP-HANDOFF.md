# Brick App Store push (2026-10-04, paused)

## What the loop is

Push the Brick real estate app to the App Store. App is built, signed, ready to upload. ASC record creation paused due to Apple's web sign-in throttle.

## Where things stand (2026-10-04)

- iPhone app: built, signed, archived to `.asc/artifacts/Brick.ipa`. Bundle: `com.nulljosh.brick`. Screenshots and store metadata ready.
- ASC record: not created. Apple's web sign-in returned 503 at 13:07 and 13:32 (no verification code received). Retry paused. Throttle window requires at least one hour from last 13:32 attempt (resume after 14:32).
- Landing page: deployed at brick.heyitsmejosh.com with 27-second promo video, feature cards, honest copy.
- Stripe: web payments live (free pricing per Joshua's rebrand).
- Tests: green on latest runs (brick, journal, notes, dotfiles).

## Next, in order (resume at home)

1. Run `~/.local/bin/asc-login` once (needs the Mac popup Allow click; code reader reads from Mac screen). Wait until at least 14:32 (one hour after last 13:32 attempt).
2. Create ASC record: `asc web apps create --auto-rename=false` with bundle `com.nulljosh.brick`, display name Brick, SKU brick-ios, category Real Estate.
3. Rebuild and re-export iPhone app (asc xcode export to regenerate .asc/artifacts/Brick.ipa).
4. Upload IPA: `asc xcode upload --app <id>` with metadata from metadata/ and screenshots from screenshots/ios.
5. Set privacy (Privacy Policy URL), free pricing, submit to review.
6. QA landing page on iPhone while waiting (27s video plays, features readable, App Store link works once app is live).
7. QA iPhone app: sign in, browse, filter with ask bar, save home, verify deal score. Await App Review verdict.

## Restart prompt

```
/loop push brick to App Store from home: run asc-login (wait until 14:32 for Apple throttle window to clear), create ASC record for com.nulljosh.brick named Brick, export and upload the signed IPA (rebuild first), apply metadata and screenshots, set privacy and free pricing, submit to review, then QA landing and app until A+ (video plays, features read, app signs in and browses, ask bar works, deal score visible). State in docs/LOOP-HANDOFF.md. If rejected check Resolution Center and fix or reply truthfully.
```
