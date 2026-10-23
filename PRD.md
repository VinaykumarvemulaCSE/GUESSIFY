# Guessify — Product Requirements Document

**Version:** 1.0 (pre-production)
**Author:** Vinay Kumar Vemula
**Status:** Draft for build
**Platform:** Android (iOS deferred to post-1.0)
**Last updated:** 2026-10-23

---

## 1. Summary

Guessify is a number-guessing game for Android: solo runs against a hidden number with directional clues, and 1v1 duels against a friend in a shared live room. The app is written in React Native + Expo (SDK 57), uses Firebase Auth for accounts and Firestore for real-time duel state, leaderboards and match history.

Today it works for real users but is **not production-ready**: Firestore rules expose every user's email, the leaderboard accepts client-authored scores, duel guesses can be lost under concurrency, and Play Store compliance items (account deletion, privacy policy, data safety) are missing. This PRD defines exactly what v1.0 must contain before it goes to a closed test.

---

## 2. Goals

| # | Goal | Measure |
|---|------|---------|
| G1 | Ship a stable Android build to Google Play production | v1.0 live on Play, installable, no P0 crashes |
| G2 | Protect player data | No PII readable by another user or an unauthenticated client |
| G3 | Fair competition | No client can write leaderboard points or match results |
| G4 | Two-player duels never lose a guess | Concurrent submissions produce one consistent room state |
| G5 | Meet Play policy | Account deletion, privacy policy, data safety form all in place |
| G6 | Maintainable codebase | One location per concern, zero dead files/deps, typed routes |

## 3. Non-goals (v1.0)

- iOS build and App Store submission.
- Real-money, ads, in-app purchases, cosmetics.
- Friends list, chat, tournaments, more than 2 players per room.
- Push notifications (the existing `notifications` setting does nothing today).
- Web build (currently possible via `react-native-web`; dropped for v1.0).
- Google Sign-In for v1.0 *(decision D3 — can move into v1.0 if OAuth is ready before Phase 4)*.
- **Cloud Functions / Blaze plan.** v1.0 ships entirely on the Firebase **Spark (free) plan**: no scheduled functions, no callable functions, no server-side scoring. The integrity model in §8.2 is designed around that constraint.
- **Hardened anti-cheat.** With no server, a modified client can still inflate its score within the caps. v1.0 targets *casual fair play*, not tournament-grade integrity. Stated explicitly so the leaderboard is never described as tamper-proof.

---

## 4. Users

**Player (guest)** — opens the app, plays solo immediately, no account. Local stats only. Can create an account later to keep stats.

**Player (registered)** — email/password account. Ranked: points, tier, streaks, global leaderboard, career history across devices.

**Duelist** — a registered player who creates or joins a room by 6-character code and plays a turn-based 1v1.

**Operator (you)** — monitors crashes, reviews feedback from the closed test, bans abusive accounts manually in Firebase Console.

---

## 5. Current state (verified inventory)

**21 screens**, 5 shared components (`NeonButton`, `GlowCard`, `CustomNumpad`, `GameBottomNav`, `NeuralBulbLogo`), 5 services, 3 constant/type modules, ~4,200 lines of TS/TSX. TypeScript `strict` compiles with zero errors; `expo-doctor` passes 20/21 (two patch-level Expo mismatches).

### 5.1 What exists and works

| Area | Behaviour |
|------|-----------|
| Auth | Email/password sign-up, sign-in, password reset, anonymous guest, persisted session |
| Onboarding | One-time intro, skipped after first run |
| Solo | 3 difficulties (Easy 1–50/8 shields, Medium 1–100/10, Hard 1–1000/15), directional clues (too high/high/low/too low, ±12% = "warm"), 2 purchasable hints (−50 pts each), score `max(50, base − 25×(attempts−1) − 50×hints)`, victory/defeat screens |
| Duel | Create room with 6-char code, join by code, lobby with share sheet, 3 modes (both together / host guesses / friend guesses), 30 s turn deadline shown, live match log, rematch |
| Stats | Points, games, wins, losses, win rate, high score, current/best streak, average attempts |
| Leaderboard | Weekly / monthly / all-time, tiers Bronze→Grandmaster |
| History | Per-user local + cloud match history, career summary |
| Profile | Stats, achievements, rename, quick nav |
| Settings | Sound, haptics, keypad vibration toggles, clear history, rules/about |

### 5.2 What is broken, fake, or missing

| # | Finding | Evidence |
|---|---------|----------|
| B1 | All user profiles (including email) are publicly readable | `firestore.rules:12-19` |
| B2 | Any authenticated user can update any room or `history` doc | `firestore.rules:26,42-43` |
| B3 | Leaderboard weekly/monthly values are fabricated from all-time points | `firestoreService.ts:49-51` |
| B4 | Points are computed and written by the client | `firestoreService.ts:99-133` |
| B5 | Duel guesses use read-then-write, no transaction → lost guesses | `firestoreMultiplayer.ts:186-222` |
| B6 | Room secret (`targetNumber`) is readable by both players | `firestoreMultiplayer.ts:160-169` |
| B7 | Rooms never expire; `expiresAt` checked only on join | `firestoreMultiplayer.ts:79-81` |
| B8 | Google button hidden, but native path fakes a Google account via anonymous auth | `authService.ts:213-247` |
| B9 | No account deletion, no privacy policy | 0 references in repo |
| B10 | Silent failures: storage errors swallowed, Firestore writes only `console.warn` | `storage.ts` (`catch {}`), `firestoreService.ts:134` |
| B11 | Session restore uses AsyncStorage only, ignores Firebase auth state | `SplashScreen.tsx:20-26` |
| B12 | Guests are never restored across cold starts | `AppContext.tsx:186-190` |
| B13 | `notifications` setting is wired to nothing | `settings.notifications` → 0 usages |
| B14 | No error boundary; any render crash = blank screen | 0 occurrences |
| B15 | Zero accessibility labels across 21 screens | 0 occurrences |
| B16 | Dead code and deps | see §11 |

---

## 6. Functional requirements (v1.0)

Each requirement is testable. `FR-x` IDs are referenced by the roadmap.

### 6.1 Identity and accounts

- **FR-1** A user can play as a guest without creating an account; guest stats persist locally and are clearly labelled as local.
- **FR-2** A user can sign up with email + password (min 6 chars), sign in, and reset a forgotten password by email.
- **FR-3** A registered user's session survives app restart and reopens the app on Home without a login screen. Implemented against Firebase auth state, not only cached storage.
- **FR-4** A signed-in user can delete their account from Settings. Deletion removes auth record, profile, history, public profile and leaderboard entries, and signs the user out with an explicit confirmation dialog.
- **FR-5** A reachable web page explains how to request account deletion (URL declared in Play Console).
- **FR-6** If a guest upgrades to an account, the guest's local stats are offered for migration (single prompt, no silent merge).

### 6.2 Solo play

- **FR-7** Player selects a difficulty and starts a round against a random number in that range.
- **FR-8** Each guess returns one of: correct, too high, high (warm), low (warm), too low, plus the current narrowed range.
- **FR-9** Two hints per round, each costing 50 points from the final score; unlocking a hint is irreversible for the round.
- **FR-10** A round ends on a correct guess or when shields are exhausted; the result screen shows target, score, guesses and duration.
- **FR-11** Score follows `max(50, base − 25×(attempts−1) − 50×hints)`, computed by a single function used by both the UI and the server-side award path.
- **FR-12** Solo rounds completed offline are queued locally and synced when connectivity returns, without blocking gameplay.

### 6.3 Duels

- **FR-13** A player can create a room; a 6-character code is shown with a share action.
- **FR-14** A second player can join by code; the room rejects a third player and expired/invalid codes with specific messages.
- **FR-15** The host selects one of three modes: both guess alternately, host guesses / friend sets, friend guesses / host sets.
- **FR-16** During a round, both clients see the same guessed numbers, the active turn and a countdown; the state is driven by a single Firestore document subscription.
- **FR-17** Guess submission is transactional: two simultaneous guesses cannot overwrite each other, and a guess is rejected if it is not that player's turn or the round is over.
- **FR-18** A round ends on a correct guess; both players see the result screen and points are awarded once per player per round (idempotent).
- **FR-19** A rematch requires both players' agreement and starts a fresh round with a new secret.
- **FR-20** Leaving a room returns the player to Home and marks the room closed for the other player.
- **FR-21** Room documents expire automatically after 5 minutes of inactivity via Firestore TTL on `expiresAt` (no scheduled function).

**Referee rule (replaces server-held secrets).** Without Cloud Functions the secret cannot be kept server-side. Instead the **setter is the referee**: the secret number lives only in the setter's local state and is never written to Firestore while the round is `PLAYING`. The setter's client evaluates each guess and writes the guess record with its result. The guesser receives feedback through the room document and never sees the number. When the round ends, the setter writes the revealed `targetNumber`. Trade-offs, accepted for v1.0: if the setter leaves, the round dies; a setter can lie, but a setter could always cheat in couch play. For `BOTH_TOGETHER`, the host acts as referee.

### 6.4 Ranked integrity (Spark plan)

- **FR-22** A client can only raise its own `points` and only by the maximum a single match can award (1200 solo, 150 duel). Writes are absolute (never increments), so retries cannot double-award and a replay cannot compound.
- **FR-23** Leaderboard periods are real, not derived: scores are written to the entries document for the current week key and month key (`2026-W43`, `2026-10`) plus `allTime`, so each board reflects only matches played in that window.
- **FR-24** Each match is recorded under a client-generated `clientMatchId` used as the document ID, making recording idempotent without a server.

Firestore rules and App Check reject writes that are out of range, malformed, from unverified app instances, or targeting another user's documents. Anomalies (score jumps, impossible durations) are logged for manual review.

### 6.5 History and leaderboard

- **FR-25** History lists the last 50 matches per user with mode, difficulty, outcome, target, attempts, score, duration; empty state when none.
- **FR-26** Career summary shows games played, win rate, average guesses and best streak.
- **FR-27** Leaderboard lists rank, name, points, wins and tier; highlights the current user; visible to guests (read-only) and updated after a match.
- **FR-28** Users can hide themselves from the leaderboard (existing `hideFromLeaderboard` flag becomes functional).

### 6.6 Profile and settings

- **FR-29** A user can change their display name; the change appears on the leaderboard and in duel rooms.
- **FR-30** Settings toggles for sound, haptics and keypad vibration persist and take effect.
- **FR-31** "Clear match history" clears local history after confirmation; cloud history is deleted only by account deletion (documented in the UI).
- **FR-32** Rules and About screens are reachable from Settings and contain only claims the app actually satisfies.

### 6.7 Cross-cutting UX

- **FR-33** Every network failure surfaces a retryable, non-blocking message; no silent data loss.
- **FR-34** Android hardware back follows the visible hierarchy and never exits from mid-game without confirmation.
- **FR-35** A crash in any screen is contained by an error boundary offering "Reload".
- **FR-36** All interactive controls have accessibility labels and roles; text scales with system font size.

---

## 7. Non-functional requirements

| # | Requirement |
|---|-------------|
| NFR-1 | Cold start to interactive Home ≤ 2.5 s on a mid-range Android device; splash never exceeds 1.8 s artificially. |
| NFR-2 | 60 fps scrolling on leaderboard/history lists of 100 rows; lists virtualised. |
| NFR-3 | No screen logs PII or tokens in production builds. |
| NFR-4 | All Firestore reads/writes are bounded (`limit`, indexed queries); no unbounded collection scans. |
| NFR-5 | App Check enforced on Firestore and callable functions in release builds. |
| NFR-6 | Every release build carries a unique `versionCode`, is signed by an EAS-managed keystore that is backed up. |
| NFR-7 | Crashes and non-fatal errors reported to a crash service with readable stack traces. |
| NFR-8 | The app runs on Android 8.0 (API 26) and above, targeting the current Play-required API level. |
| NFR-9 | `tsc --noEmit`, ESLint and unit tests must pass before a build is produced (CI). |

---

## 8. Data model (target)

```
users/{uid}
  displayName, email, isGuest, points, hideFromLeaderboard,
  stats { gamesPlayed, wins, losses, winRate, highScore,
          currentStreak, bestStreak, averageAttempts },
  createdAt, updatedAt
  └─ history/{matchId}
       id, mode, difficultyOrMode, outcome, targetNumber,
       attempts, score, durationSeconds, playedAt, recordedAt

publicProfiles/{uid}          # denormalised, no email
  displayName, points, wins, tier, hideFromLeaderboard, updatedAt

matches/{matchId}             # server-written, source of truth for ranking
  uid, mode, difficulty, outcome, attempts, hintsUsed, durationSeconds,
  score, clientMatchId (unique), createdAt

leaderboards/{period}/entries/{uid}
  displayName, points, wins, tier, updatedAt

rooms/{roomId}                # roomId = room_<code>
  code, hostUid, hostName, guestUid, guestName, status,
  selectedMode, targetNumber, currentTurnUid, setterUid,
  guesses[], winnerUid, rematchAgreed[], createdAt, expiresAt

config/{doc}                  # optional: feature flags, min version
```

### 8.1 Access matrix

| Path | Read | Write |
|------|------|-------|
| `users/{uid}` | owner only | owner only |
| `users/{uid}/history/*` | owner only | owner only |
| `publicProfiles/*` | any signed-in user | owner only, `uid` must match, fields whitelisted |
| `matches/*` | owner (own matches) | owner, create-only, validated shape |
| `leaderboards/{period}/entries/{uid}` | public | owner only, monotonic and capped |
| `rooms/{roomId}` | signed-in participants | participants, with field-level guards |
| `config/*` | public | denied (console only) |

Removed: global `history` collection and `rooms/*/guesses` subcollection rules (neither is used by the app today).

### 8.2 Write path on the free plan

There is no server, so integrity is enforced by rules plus attestation plus caps, not by trusting the client outright:

1. **Shape validation.** Every write must match the expected field set and types; unknown fields are rejected.
2. **Ownership.** A user can only write documents keyed by their own `uid`.
3. **Monotonic and capped.** `points` may not decrease (except on account deletion) and may not increase by more than the maximum single-match award. Stats are bounded (`wins ≤ gamesPlayed`, `winRate` 0–100).
4. **Idempotency.** Match documents use `clientMatchId` as their ID; `setDoc` with absolute values means a retry overwrites rather than compounds.
5. **Attestation.** App Check (Play Integrity in release) rejects requests from modified clients or scripts that do not carry a valid app attestation token.
6. **Window scoping.** Weekly and monthly entries are written under the current period key, so boards reset naturally.
7. **Manual review.** A Cloud Function is not available, so an operator reads anomalous matches (score/time mismatches) from the console and removes entries by hand.

What this does **not** prevent: a determined attacker on a rooted device with a patched binary can still write plausible scores within the caps. v1.0 accepts this; the leaderboard is described as casual, and no rewards depend on it.

**Account deletion** is client-side: re-authenticate, delete `users/{uid}` including the `history` subcollection, `publicProfiles/{uid}` and the three leaderboard entries in a batch, then call `deleteUser()`. A web page explains the process for users who no longer have the app.

**Room expiry** uses a Firestore **TTL policy** on `rooms.expiresAt` — free, no scheduler.

---

## 9. Architecture

### 9.1 Principles

1. **Routes are thin.** A route file wires a screen; it contains no business logic.
2. **Features own their state.** `auth`, `solo`, `duel`, `leaderboard`, `history`, `profile` each expose hooks and an API module. No god-context.
3. **One source of truth per rule.** Scoring lives in `solo/engine.ts`; the same formula is enforced by the write rules' caps. No magic numbers in screens.
4. **Fail visibly.** Every async boundary has an error state; no empty `catch`.
5. **No dead code.** If it is not reachable from a route, it does not ship.

### 9.2 Target tree

```
app/                          # expo-router, routes only
  _layout.tsx                 # providers, splash gate, error boundary
  index.tsx                   # → onboarding | login | home
  onboarding.tsx
  (auth)/ login | signup | forgot-password
  (main)/ _layout.tsx         # bottom tabs: home, ranks, history, profile
          home | ranks | history | profile | settings | rules | about
          solo/ difficulty | [session] | result
          duel/ index | [code] | result
src/
  components/
    ui/      Button, Card, Input, Screen, EmptyState, ErrorState, Skeleton
    game/    Numpad, ShieldRow, ClueCard, RangeBar
  features/
    auth/        api.ts, useAuth.ts, useSession.ts, types.ts
    solo/        engine.ts, useSoloGame.ts, types.ts
    duel/        api.ts, useRoom.ts, types.ts
    leaderboard/ api.ts, useLeaderboard.ts
    history/     api.ts, useHistory.ts
    profile/     api.ts, useProfile.ts
  lib/           firebase.ts, outbox.ts, net.ts, log.ts, format.ts
  constants/     theme.ts, rules.ts
  types/         index.ts
assets/
```

Migration note: the current `AppContext` (714 lines) splits into `AuthProvider` (auth + profile), `SettingsProvider`, and feature hooks. Navigation state leaves React entirely — it becomes the router.

### 9.3 Navigation

Expo Router with typed routes, single stack per tab, deep link scheme `guessify://`.
Enables FR-13/FR-14 properly: `guessify://duel/ABC123` can be shared as a join link, and Android back is handled by the router instead of a hand-written `BackHandler`.

### 9.4 Firebase

- `lib/firebase.ts`: `initializeFirestore(app, { experimentalForceLongPolling: true })` — the RN listener stalls seen in production are the same class of problem fixed in BloodLine; long polling makes duel state reliable on mobile networks and emulators.
- Auth persistence via `getReactNativePersistence(AsyncStorage)`.
- App Check with Play Integrity in release, debug provider in development.
- Offline: local outbox in AsyncStorage for match awards; Firestore listener state is online-only and surfaced in the UI.
- **Spark plan only.** No Cloud Functions, no scheduled jobs. Room cleanup uses a TTL policy on `rooms.expiresAt`; leaderboard windows use period-keyed documents; deletion is client-side.
- Note for local development: the Firestore emulator and Auth emulator are free and should be used for rules tests.

---

## 10. Compliance and store requirements

| Item | Requirement |
|------|-------------|
| Developer account | $25 one-time, identity verification |
| Testing gate | Closed test with **12 testers opted in continuously for 14 days** before production access (personal accounts created after 13 Nov 2023) |
| Build | Signed `.aab`, unique `versionCode`, target API level required by Play |
| Data safety | Declare: email, user ID, game stats, crash logs; declare encryption in transit; declare deletion path |
| Account deletion | In-app path (FR-4) **and** a public web URL (FR-5) |
| Privacy policy | Publicly hosted, linked in Play listing and in-app Settings |
| Content rating | Questionnaire; expected "Everyone", no ads, no user-generated content beyond a display name |
| Target audience | 13+; no child-directed design, so COPPA/ Families policy does not apply |
| Listing assets | 512×512 icon, 1024×500 feature graphic, 2–8 phone screenshots, 80-char short description, 4000-char full description |
| Permissions | Only `INTERNET` and `VIBRATE`; remove leftover storage and overlay permissions from the generated manifest |

---

## 11. Cleanup register (must reach zero before 1.0)

| Item | Action |
|------|--------|
| `src/services/multiplayerService.ts` (in-memory room simulator) | Delete. It can silently stand in for Firestore when env vars are missing — unacceptable in production. Replace with a loud config error. |
| Fake native Google path (`authService.ts:213-247`) and `loginWithGoogle` plumbing | Delete. Reintroduce only with real OAuth (decision D3). |
| `googleBtn`, `googleBtnText` styles in `LoginScreen.tsx` | Delete. |
| `loginAsUser` (context) | Delete — unused duplicate of sign-in. |
| `screenParams` | Delete with the custom navigator; router params replace it. |
| `MAX_ATTEMPTS` constant | Delete — shields already encode attempts. |
| `hint.penalty` field | Delete — scoring already subtracts 50 per hint. |
| `settings.notifications` | Delete the toggle until push exists (or implement push in 1.1). |
| `MULTIPLAYER_POINTS` hardcoded 150/45 in `AppContext` | Import the constant (or move scoring to the engine). |
| `firestore.rules` entries for `rooms/*/guesses` and global `history` | Delete — paths are unused. |
| `android/` stale prebuild (`versionCode 1`, `versionName 1.0.0`) | Delete; let EAS generate it. Never build releases from it. |
| `dist/` | Delete. |
| `expo-linear-gradient`, `react-native-svg`, `expo-font` | Uninstall — zero imports. |
| `react-dom`, `react-native-web`, `web` config + `favicon.png` | Remove with the web target. |
| `@expo/ngrok` | Remove unless tunnel development is still used. |
| `console.log/warn` in services | Replace with `lib/log.ts` (silent in release, forwards to crash reporting). |
| Hardcoded `v1.1` on splash | Read from `expo-constants`. |
| Two patch-level Expo mismatches (`expo`, `expo-splash-screen`) | `npx expo install --fix`. |

---

## 12. Success metrics

- Crash-free sessions ≥ 99.5 % during the closed test.
- Zero P0/P1 bugs open at production application.
- Median solo round completion (start → result) ≥ 60 %.
- Duel rounds completed (both players submit ≥ 1 guess) ≥ 80 %.
- 12 testers retained for the full 14 days.

## 13. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| 12 testers / 14 days is a hard gate | Launch delay | Start the closed test at the end of Phase 4, not after "everything is perfect" |
| No server (Spark plan) means client-authored scores | Score inflation by a modified client | Caps + shape validation in rules, App Check attestation, idempotent absolute writes, manual anomaly review. Leaderboard described as casual, no rewards attached. |
| Expo Router migration touches every screen | Regression risk | Freeze features during migration; keep the old navigator on a branch until parity is verified |
| Referee-held secret means the setter can lie | Unfair duels | Accepted for friendly 1v1; documented. Revisit with Blaze if duels become competitive. |
| Keystore loss | App can never be updated | Back up the EAS keystore before the first production build |

## 14. Decisions

- **D1** ~~Cloud Functions (Blaze)~~ — **resolved: no Blaze.** v1.0 runs on Spark; §8.2 is the integrity model.
- **D2** Expo Router migration — **approved** (required for FR-13 share links and FR-34 back handling).
- **D3** Google Sign-In in v1.0 or v1.1 — recommend v1.1.
- **D4** Drop the web target — **approved**.
- **D5** Who are the 12 closed testers, and can they commit to 14 continuous days.
