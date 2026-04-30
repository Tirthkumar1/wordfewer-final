# WordFever — Play Store Launch Checklist

## Services Decision

| Service | Decision | Reason |
|---|---|---|
| AdMob | ✅ Keep | Free, earns money from day 1 |
| RevenueCat IAP | ❌ Skip | No premium features yet |
| Sentry | ❌ Skip | Use Play Console Android Vitals instead |
| PostHog | ❌ Skip | Use Play Console installs/retention |
| Push Notifications | ❌ Skip | Add in v1.1 |
| Vercel Cron | ✅ Keep | Free tier, needed for daily challenge |
| EAS Build | ⚠️ Optional | Build locally with gradlew to avoid it |

**Only unavoidable cost: $25 Google Play developer registration (one-time)**

---

## Code / Config

- [ ] Replace AdMob test App ID with real App ID in `android/app/src/main/AndroidManifest.xml`
- [ ] Create real AdMob ad units (banner + interstitial) and add unit IDs to code
- [ ] Un-stub `showInterstitial()` in `GameOverScreen.tsx`
- [ ] Add banner ad to `HomeScreen.tsx`
- [ ] Set `versionCode 1` and `versionName "1.0"` in `android/app/build.gradle` ✅ already set
- [ ] Generate release keystore (one-time, back it up safely)
- [ ] Configure release signing in `android/app/build.gradle`
- [ ] Test signed release build end-to-end on a real device

## Google Play Console

- [ ] Pay $25 developer registration fee
- [ ] Create app listing (package: `com.wordfever`)
- [ ] Write store description (max 4000 chars)
- [ ] Write short description (max 80 chars)
- [ ] Fill content rating questionnaire
- [ ] Set pricing to Free
- [ ] Upload signed AAB file
- [ ] Submit for review (expect 1–7 days)

## Assets Needed

- [ ] App icon — 512×512 PNG
- [ ] Feature graphic — 1024×500 PNG
- [ ] Phone screenshots — minimum 2, max 8 (recommended: 4–5)
- [ ] Optional: 7-inch tablet screenshots

## Backend / DB

- [ ] Seed at least one row in `daily_challenges` table for each active language
- [ ] Deploy Vercel cron function (`netlify/functions/seed-daily-challenge.ts` → move to Vercel)
- [ ] Set `DATABASE_URL` env var in production build / EAS secrets
- [ ] Verify Neon DB is on a paid plan if expecting >500MB data (free tier is fine to start)

## Google Auth

- [ ] Add production SHA-1 fingerprint to Firebase (release keystore SHA-1, different from debug)
- [ ] Download and replace `google-services.json` after adding production SHA-1

## Testing Before Submit

- [ ] Full game loop on real device (start → play → game over → leaderboard)
- [ ] Google Sign-In works on release build
- [ ] Daily challenge loads (requires seeded DB row)
- [ ] Leaderboard shows scores
- [ ] Profile stats update after game
- [ ] AdMob ads load (not test ads)
- [ ] App does not crash on cold start
- [ ] Back button behaviour is correct throughout

---

## Post-Launch (v1.1 Ideas)

- Push notifications (streak reminders)
- RevenueCat IAP (Remove Ads)
- Sentry crash reporting
- More languages
- PostHog analytics
