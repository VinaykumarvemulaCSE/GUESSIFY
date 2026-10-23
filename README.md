# Guessify

A number-guessing game for Android, built with Expo and Firebase. Guess the secret number in as few attempts as possible, use tactical hints when you're stuck, and race a friend in real-time 1v1 duels.

## Status

Android-first, pre-release. iOS is deferred to a later version — there is no web build.

The project is being hardened for a Google Play launch: Expo Router migration, locked-down Firestore rules, and a tester-driven closed beta. See [ROADMAP.md](./ROADMAP.md) for the phase plan and [PRD.md](./PRD.md) for the full requirements.

## How it plays

| Difficulty | Range | Shields | Base score |
|------------|-------|---------|------------|
| Easy | 1–50 | 8 | 500 |
| Medium | 1–100 | 10 | 800 |
| Hard | 1–1000 | 15 | 1200 |

**Scoring:** `max(50, base − 25 × (attempts − 1) − 50 × hintsUsed)`

Every guess answers with one of four directional hints: correct, high/low (within 12% of the range), or too high/too low. Two hints per game reveal a narrowed range and a parity/digit-sum clue. Tiers start at Bronze and climb to Grandmaster.

**Duels** use a 6-character room code, three modes (both guess alternately, host guesses, friend guesses), a 30-second turn timer, and 5-minute room expiry.

## Stack

- Expo SDK 57 / React Native 0.86 / React 19
- TypeScript, strict mode
- Firebase Auth + Firestore (`firebase` JS SDK 11)
- AsyncStorage for local session, settings and match history
- EAS Build for Android app bundles

Firebase runs on the **Spark (free) plan** — no Cloud Functions. Scores are client-written with capped, monotonic, shape-validated writes plus App Check; the leaderboard is casual fair play, not tamper-proof.

## Getting started

```bash
npm install
cp .env.example .env        # fill in your Firebase project keys
npx expo run:android        # or: npx expo start
```

Firebase setup:

1. Create a Firebase project and enable **Email/Password** and **Anonymous** auth.
2. Create a Firestore database and deploy the rules: `firebase deploy --only firestore:rules`.
3. Register an Android app with package `com.innogen.guessify` and drop `google-services.json` in the repo root.
4. Add the six `EXPO_PUBLIC_FIREBASE_*` values to `.env`.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm start` | Expo dev server |
| `npm run android` | Build and run on a device/emulator |
| `npm run lint` | ESLint via `expo lint` |
| `npx tsc --noEmit` | Typecheck |
| `npx expo-doctor` | Dependency/config health check |
| `npx expo install --fix` | Align package versions with the SDK |

## Project structure

```
App.tsx                 app shell, screen switch, onboarding/session restore
index.ts                Expo entry point
src/
  components/common/    shared UI (buttons, cards, numpad, nav)
  constants/            theme tokens and game rules (single source of truth)
  context/              AppContext: auth, settings, solo game, duels, history
  lib/                  dev logging
  screens/              one file per screen
  services/             Firebase auth, Firestore, local storage
  types/                domain models
```

## License

MIT — see [LICENSE](./LICENSE).
