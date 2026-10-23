# Guessify

A number-guessing game for Android, built with Expo and Firebase. Guess the secret number in as few attempts as possible, use tactical hints when you're stuck, and race a friend in real-time 1v1 duels.

## Status

**Android-first, feature-complete, pre-release.** All app-side work for v1.0 is done: routing, security rules, period leaderboards, referee duels, offline sync, account deletion, audio/haptic feedback and the legal pages. What remains is account-bound release work — the EAS production build, Play Console listing and the 14-day closed test. iOS is deferred; there is no web build.

See [ROADMAP.md](./ROADMAP.md) for the phase plan, what shipped, and the few items deliberately deferred, and [PRD.md](./PRD.md) for the requirements.

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

- Expo SDK 57 / React Native 0.86 / React 19, TypeScript strict
- Expo Router (file-based routes, `guessify://` deep links)
- Firebase Auth + Firestore (`firebase` JS SDK 11), **Spark plan — no Cloud Functions**
- AsyncStorage for session, settings, local history and the sync outbox
- `expo-audio` + `expo-haptics` for feedback that follows the settings toggles
- Vitest for engine tests; `@firebase/rules-unit-testing` + Firestore emulator for the security matrix
- EAS Build for Android app bundles

## Data model and integrity

Firebase Spark rules out Cloud Functions and App Check in this setup, so integrity is enforced by security rules plus idempotent writes:

- **Owner-only private data.** `users/*` is readable only by its owner; email never leaks. `publicProfiles/*` is signed-in readable and field-whitelisted.
- **Absolute, idempotent match writes.** Every result is `setDoc` at `matches/{clientMatchId}`; retries cannot double-count.
- **Capped leaderboard writes.** Points are monotonic, bounded by the largest single award (`1200`), must advance `lastMatchId`, and a single write cannot grow an entry by more than one award.
- **Referee duels.** The setter holds the secret in memory only, the target is absent while a round is `PLAYING`, and only the referee scores guesses. Participants alone may read or update a room.
- **Offline outbox.** Awards are queued locally and flushed oldest-first; the UI shows how many are pending.
- **Period boards.** Weekly (`2026-W43`), monthly (`2026-10`) and all-time boards are real documents, created on first award — no derived multipliers and no seeded rows.

Limits are documented rather than hidden: a determined modified client can still write plausible scores, so leaderboards are casual fair play. App Check (Play Integrity) requires a native build and is planned for v1.1, and room expiry is enforced by the app (`expiresAt` epoch ms) instead of Firestore TTL, which needs a Timestamp field. Both are tracked in [ROADMAP.md](./ROADMAP.md).

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

Without Firebase keys the app runs in local-only mode: solo games, history and settings work, while duels and online leaderboards are unavailable.

## Tests

```bash
npm test          # engine: scoring, warm/cold thresholds, hints, periods, duel points
npm run test:rules  # security rules against the Firestore emulator
```

The rules suite needs Java 21+ and starts its own emulator on `127.0.0.1:8080` via
`firebase emulators:exec` (project `guessify-rules-test`). It covers the leak cases:
cross-user reads, forged matches, leaderboard replay/over-cap writes, third-player joins,
and storing the duel secret while `PLAYING`.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm start` | Expo dev server |
| `npm run android` | Build and run on a device/emulator |
| `npm run lint` | ESLint via `expo lint` |
| `npm test` | Engine unit tests |
| `npm run test:rules` | Firestore rules tests (starts the emulator) |
| `npx tsc --noEmit` | Typecheck |
| `npx expo-doctor` | Dependency/config health check |
| `npx expo install --fix` | Align package versions with the SDK |

## Project structure

```
src/
  app/                  Expo Router routes (splash, auth, main, solo, duel, legal)
  components/common/    shared UI (buttons, cards, numpad, nav, modals)
  constants/            theme tokens and game rules (single source of truth)
  context/              AppContext: the composed app façade (auth, settings, game, duels)
  lib/                  firebase bootstrap, periods, ids, outbox, sound, logging, routes
  screens/              screen implementations rendered by the routes
  services/             Firebase auth/Firestore, local storage
  types/                domain models
  __tests__/            engine + security-rules suites
```

## Privacy and account deletion

- Privacy policy: https://vinaykumar.eu.cc/privacy/guessify
- Delete your account: https://vinaykumar.eu.cc/delete-account/guessify (also available in-app under Profile → Settings → Delete account)

## License

MIT — see [LICENSE](./LICENSE).
