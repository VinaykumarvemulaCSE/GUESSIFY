<p align="center">
  <img src="assets/icon.png" width="112" alt="Guessify app icon" />
</p>

<h1 align="center">Guessify</h1>

<p align="center">
  An arcade-intellectual number guessing game for Android.<br />
  Solo runs, live 1v1 duels, period leaderboards, and no pay-to-win.
</p>

<p align="center">
  <a href="https://expo.dev/accounts/vinnuuu07/projects/guessify/builds">EAS builds</a> ·
  <a href="./ROADMAP.md">Roadmap</a> ·
  <a href="https://vinaykumar.eu.cc/privacy/guessify">Privacy</a>
</p>

---

## Status

| | |
|---|---|
| **Version** | `1.1.0` (`versionCode 2`) — release candidate |
| **Platform** | Android only (iOS and web are deferred) |
| **Backend** | Firebase Auth + Firestore, **Spark plan** (no Cloud Functions) |
| **Build** | EAS production AAB — [build history](https://expo.dev/accounts/vinnuuu07/projects/guessify/builds) |
| **Store** | Not published yet; Play Console closed testing is the next step |

`1.1.0` is the first public-facing build: it fixes the remaining copy and data-accuracy issues found in the `1.0.0` release candidate. See [What changed in 1.1.0](#what-changed-in-110).

## Features

- **Three solo stages** with real difficulty: Easy (1–50, 8 guesses), Medium (1–100, 10), Hard (1–1,000, 15).
- **Four-way directional feedback** — too high, high, low, too low — plus a correct guess.
- **Two tactical hints** per round: a narrowed range, then parity and digit sum.
- **Live 1v1 duels** with 6-character room codes, three modes, a 30-second turn timer, and automatic room expiry.
- **Weekly, monthly, and all-time leaderboards** backed by real period documents.
- **Tiers and achievements** derived from actual play — Bronze through Grandmaster; no seeded rows, coins, or fake unlocks.
- **Email/password or guest play**, cloud sync, and an offline outbox so a dropped connection does not lose an award.
- **In-app account deletion** and public privacy/deletion pages.
- **Sound and haptics** that respect the in-app toggles.

## How it plays

| Stage | Range | Guesses | Base score |
|-------|-------|---------|------------|
| Easy | 1–50 | 8 | 500 |
| Medium | 1–100 | 10 | 800 |
| Hard | 1–1,000 | 15 | 1200 |

```
Score = max(50, Base − 25 × (Attempts − 1) − 50 × HintsUsed)
```

A wrong final guess (or a surrender) ends the round with 0 points. Hints cost 50 points each; the score never drops below 50 for a win.

**Duel modes**

- **Both Together** — alternating guesses, 30-second turns, first correct guess wins.
- **Host Guesses** / **Friend Guesses** — one player sets the secret and scores each guess from memory; the guesser keeps the floor until they solve it. There is no attempt cap.

The winner earns +150 points and the other player +45. Rooms close after 5 minutes of inactivity.

## Progression

Tiers are computed from lifetime points:

| Tier | Points |
|------|--------|
| Bronze | 0–199 |
| Silver | 200–599 |
| Gold | 600–1,199 |
| Diamond | 1,200–1,999 |
| Master | 2,000–2,999 |
| Grandmaster | 3,000+ |

Achievements unlock from real stats: first win, 50%+ win rate, a 3-win streak, and a points milestone. Weekly boards roll over Monday 00:00 UTC; monthly boards roll over on the 1st at 00:00 UTC.

## Tech stack

- **Expo SDK 57** / React Native 0.86 / React 19 / TypeScript (strict)
- **Expo Router** for file-based routes and `guessify://` deep links
- **Firebase JS SDK 11** — Auth and Firestore, Spark plan only
- **AsyncStorage** for session, settings, local history, and the award outbox
- **expo-audio** + **expo-haptics** for optional feedback
- **Vitest** for engine tests; **@firebase/rules-unit-testing** for the Firestore security matrix
- **EAS Build** for Android app bundles

## Architecture

```text
src/app/          Expo Router routes (auth, tabs, solo, duel, legal)
src/screens/      screen implementations rendered by those routes
src/context/      AppContext — auth, settings, solo, duels, boards, outbox facade
src/services/     Firebase auth/Firestore, local storage
src/lib/          firebase bootstrap, period keys, ids, outbox, sound, logging
src/constants/    theme tokens and game rules (single source of truth)
src/components/   shared UI primitives (numpad, cards, buttons, logo)
src/__tests__/    engine + security-rules suites
```

Game rules are defined once in `src/constants/gameRules.ts`; the stage picker and the in-app rulebook read from that file, so the numbers cannot drift from the code.

## Data model and integrity

Firebase Spark rules out Cloud Functions and App Check, so integrity is enforced by security rules, caps, and idempotent writes:

- **Owner-only private data** — `users/*` is readable only by its owner, and email never reaches `publicProfiles/*`.
- **Absolute, idempotent awards** — each result is written to `matches/{clientMatchId}`; retries and outbox flushes cannot double-count.
- **Capped leaderboard writes** — points are monotonic and bounded by the largest single award; one write cannot inflate an entry by more than one match.
- **Referee duels** — the setter holds the secret in memory, the target is absent from Firestore while a round is `PLAYING`, and only the referee can score a guess.
- **Period boards** — weekly and monthly boards are real documents (`2026-W43`, `2026-10`), created on the first award, with UTC rollover.

**Limits are documented, not hidden.** This is casual fair play: a modified client can still submit plausible scores. App Check/Play Integrity needs a native build and is deferred to a later release. Room expiry is enforced by the app on an epoch-ms `expiresAt` field, not Firestore TTL.

## Getting started

```bash
npm install
cp .env.example .env        # add your Firebase project values
npx expo run:android        # or: npx expo start
```

### Firebase setup

1. Create a Firebase project and enable **Email/Password** and **Anonymous** auth.
2. Create a Firestore database and deploy the rules: `npx firebase deploy --only firestore:rules`.
3. Register an Android app with package `com.innogen.guessify` and place `google-services.json` in the repo root.
4. Fill the six `EXPO_PUBLIC_FIREBASE_*` values in `.env`.

Without Firebase keys the app still runs in local-only mode: solo games, history, and settings work; duels and online leaderboards are unavailable.

### Environment variables

```dotenv
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

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

## Tests

```bash
npm test            # 19 cases: scoring, feedback, hints, periods, duel points
npm run test:rules  # 28 cases: cross-user reads, forged matches, cap/replay, room secrecy
```

The rules suite needs Java 21+ and starts its own Firestore emulator on `127.0.0.1:8080`.

## Build and release

```bash
npx eas-cli login
npx eas-cli build --platform android --profile production
```

`app.json` is the version source (`expo.version`, `android.versionCode`); EAS is configured with `appVersionSource: "local"`. The production profile emits an `.aab`, which is what Play Console expects.

## What changed in 1.1.0

- Corrected the in-app rulebook: per-stage guess budgets, Hard's real 1,200-point base, and no fictional setter attempt cap.
- Replaced the false "server-side score validation" claim with an accurate description of the rules/referee model.
- Replaced the hardcoded "Gold II" rank with the player's real tier and relabeled the record card as all-modes.
- Made weekly/monthly keys use UTC so boards roll over at the stated time everywhere.
- Made stage cards and rule numbers read from `gameRules.ts`; removed the static "POPULAR" badge.
- Removed the unused draw award and the last hardcoded version labels.

## Known limits

- Android only; no iOS or web build.
- No Cloud Functions, App Check, or server-side score validation (Spark plan).
- No crash reporting/analytics in this release; Play Console vitals are used for the closed test.
- Leaderboards and match history are capped at 50 rows and rendered without virtualization.
- Accessibility is baseline: primary controls are labelled, but a full audit is still pending.
- Room expiry is app-enforced, so abandoned rooms can briefly remain in Firestore.

## Privacy

- Privacy policy: https://vinaykumar.eu.cc/privacy/guessify
- Delete your account: https://vinaykumar.eu.cc/delete-account/guessify — also available in-app under **Profile → Settings → Delete account**

## License

MIT — see [LICENSE](./LICENSE).

## Author

Built by **Vinay Kumar Vemula** — [github.com/VinaykumarvemulaCSE](https://github.com/VinaykumarvemulaCSE).
