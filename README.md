# Prop Vault (React Native + Expo 54)

NBA/NCAA player props analysis app: today's games, confidence-filtered props (>75%), Analyze paste, and Vault with EOD results via ESPN.

## Stack

- **Expo SDK 54** — expo-router (tabs), NativeWind (Tailwind), expo-sqlite, expo-notifications, expo-task-manager + expo-background-fetch
- **Scheduling** — 9AM, 12PM, 3PM, 9PM ET line checks; background fetch + "New lines available!" notifications
- **Data** — Local SQLite vault; ESPN scoreboard/summary APIs for games and boxscores

## Setup

```bash
cd prop-vault-mobile
npm install
npx expo start
```

Then press `i` for iOS simulator or `a` for Android emulator, or scan QR with Expo Go.

## Screens

1. **Home** — Header (Win % | ROI), today's props table (>75% confidence), Refresh, Last checked, ★ to add to Vault.
2. **Analyze** — Paste lines (e.g. `Player | PTS | 26.5 | Over`), tap Analyze → confidence % (only >75% shown).
3. **Vault** — Starred props, Check Results (ESPN boxscores → W/L), Win %, ROI, streak.

## Features

- **>75% confidence** — Props and Analyze results filtered to confidence >75%.
- **Star → Add to Vault** — Alert "Add to Vault?" → save to SQLite.
- **Check Results** — Fetches ESPN game summary per vault prop, compares actual vs line, updates win/loss and ROI.
- **Background** — `expo-task-manager` + `expo-background-fetch` for periodic line fetch; `expo-notifications` for "New lines available!" and EOD results.

## Builds

- **iOS/Android**: `npx expo prebuild` then build in Xcode/Android Studio, or use EAS Build.

## Env

No API keys required for ESPN (public APIs). Optional: set timezone/locale for ET scheduling (app uses device time for notifications).
