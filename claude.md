# WordFever — Project Context

React Native + Expo app. Multilingual word chain game.
Stack: React Native, Expo, AsyncStorage, react-native-google-mobile-ads, 
RevenueCat, react-native-view-shot, expo-linear-gradient, expo-font.

## Design System (from Stitch export — STRICT)

### Colors (exact hex, no deviation)
background: #13121b
surface: #13121b
surface-container-lowest: #0e0d16
surface-container-low: #1c1a24
surface-container: #201e28
surface-container-high: #2a2933
surface-container-highest: #35343e
surface-bright: #3a3842
primary: #c9beff           (light violet — text on dark)
primary-container: #6c47ff  (electric violet — fills, borders)
secondary: #ffb3af          (coral pink)
secondary-container: #920418
tertiary: #3adfab           (mint green)
tertiary-container: #007b5b
on-surface: #e5e0ee
on-surface-variant: #c9c3d9
outline-variant: #484556
gradient-hero: from-[#6C47FF] to-[#FFB3AF]  (primary CTA gradient)

### Typography
- Headlines/Wordmark: Plus Jakarta Sans (700, 800)
- Game word display: Nunito (800, 900 Black)
- Body/UI labels: Inter (400, 500, 600)
- Indic scripts: Noto Sans Gujarati, Noto Sans Devanagari
- Timer/scores: must use tabular-nums class

### Design Rules (NEVER BREAK)
- NO 1px solid borders. Separation = background color shift only.
- NO pure black (#000). Always use surface tokens.
- NO drop shadows. Use tinted ambient: 
  box-shadow: 0 20px 40px rgba(108,71,255,0.15)
- Neural dot-grid texture: radial-gradient(rgba(108,71,255,0.08) 1px, 
  transparent 1px) at background-size 24px 24px — on every screen bg
- Glassmorphism for floating elements: surface color 80% opacity + 
  backdrop-blur-xl (20px)
- Ghost border fallback: outline-variant at 15% opacity only
- Minimum 48px tap targets on all interactive elements
- Indic script line-height: 1.2x normal

### Bottom Navigation (all screens)
4 tabs: HOME | LANGUAGES | LEADERBOARD | PROFILE
Active tab: filled violet circle pill with white icon + label
Inactive: gray icon + gray label, no background
Tab bar: bg-[#13121b]/80 backdrop-blur-xl, fixed bottom

### Language Rules
- Latin (en, de, fr, es, it, pl, nl, ro): chain_rule = last_letter
- Indic (gu, hi, mr, bn): chain_rule = last_akshar via Intl.Segmenter
- Hindi label in UI: "ANTYAKSHARI" badge
- German label: "WORD CHAIN" badge
- English label: "LAST LETTER" badge

## File Structure
/src/screens, /src/components, /src/engine, /src/store, 
/src/navigation, /src/theme, /src/services
/language_packs/{lang}/config.json + wordlist.json + ui_strings.json
/assets/fonts (Nunito, Plus Jakarta Sans, Noto Sans variants)
CLAUDE.md (this file)

## Neon Database Schema

scores table:
- id: uuid primary key default gen_random_uuid()
- username: text not null
- language_id: text not null (en, de, gu, hi etc.)
- chain_length: integer not null
- score: integer not null
- played_at: timestamptz default now()

daily_challenges table:
- id: uuid primary key
- language_id: text not null
- challenge_date: date not null
- starting_word: text not null
- difficulty: text (easy/medium/hard)
- unique(language_id, challenge_date)

daily_results table:
- id: uuid primary key
- device_id: text not null (anonymous, no auth needed v1)
- language_id: text not null
- challenge_date: date not null
- chain_length: integer
- score: integer
- played_at: timestamptz default now()
- unique(device_id, language_id, challenge_date)

## Full Stack

App: React Native + Expo SDK 51
Build: Expo EAS
DB: Neon (serverless PostgreSQL) + Drizzle ORM
Ads: AdMob via react-native-google-mobile-ads
IAP: RevenueCat via react-native-purchases
Error tracking: Sentry via @sentry/react-native
Analytics: PostHog via posthog-react-native
Push notifications: expo-notifications
Cron: Vercel serverless function (daily challenge seeder)
Share card: react-native-view-shot
Fonts: expo-font

## Environment Variables
Never hardcode secrets. All env vars via app.config.js + EAS secrets.
Local dev: .env file (gitignored)
Production: set via `eas secret:create`

Required vars:
DATABASE_URL          — Neon connection string
ADMOB_APP_ID_IOS      — AdMob iOS app ID
ADMOB_APP_ID_ANDROID  — AdMob Android app ID
REVENUECAT_KEY_IOS    — RevenueCat iOS public key
REVENUECAT_KEY_ANDROID — RevenueCat Android public key
SENTRY_DSN            — Sentry project DSN
POSTHOG_KEY           — PostHog project API key
VAPID_KEY             — Push notification key (expo-notifications)