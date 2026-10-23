# Guessify — Roadmap to v1.0 (Play Store)

Companion to `PRD.md`. Requirement IDs (`FR-x`, `NFR-x`) and findings (`B-x`) refer to that document.

**Current position:** v1.0 app-side work is complete (security rules, period boards, referee duels, offline sync, deletion, feedback, legal pages, CI). Release is now account-bound: EAS production build, keystore backup, Play Console listing and the 14-day closed test.
**Target:** signed Android build on Play production.
**Effort:** account-bound release work + 14 days of closed testing + up to 7 days of Google review.

---

## Timeline at a glance

| Phase | Focus | Effort | Gate |
|-------|-------|--------|------|
| 0 | Baseline & hygiene | 1 day | Clean tree, builds, private repo pushed |
| 1 | Architecture | 3–4 days | Router + composed context, parity with today |
| 2 | Security & data integrity | 3–4 days | Rules enforced, capped writes, rules tests (App Check/TTL deferred — see 2b) |
| 3 | Reliability & UX | 3–4 days | Offline outbox, error states, feedback settings, tests + CI green |
| 4 | Store readiness | 3–4 days | Build + listing produced; install on 2 physical devices |
| 5 | Closed test | 14 days | 12 testers × 14 days, then production access |
| 6 | Post-launch | ongoing | v1.1 scope |

Phases 0–4 = app work. Do not compress Phase 5; it is a Google-imposed clock, not a task.

---

## Phase 0 — Baseline and hygiene (1 day)

**Goal:** know exactly what ships, remove everything that does not.

**Status:** code cleanup done 23 Oct 2026 (commit `99d8c83`); repo pushed to `github.com/VinaykumarvemulaCSE/GUESSIFY` (`master`).

- [x] `git init` is already done; push to a **private** GitHub repo today (3 commits, no remote — one disk failure and the app is gone).
- [x] Delete stale `android/` prebuild (`versionCode 1`, `versionName 1.0.0`) and `dist/`. EAS regenerates native folders from `app.json`.
- [x] `npx expo install --fix` → resolves the two patch-level mismatches.
- [x] Remove unused deps: `expo-linear-gradient`, `react-native-svg`, `react-dom`, `react-native-web`, `@expo/ngrok`. (`expo-font` stays — `@expo/vector-icons` declares it as a peer dependency.)
- [x] Remove the web target from `app.json` and the `web` script (decision D4).
- [x] Delete dead code per PRD §11: `multiplayerService.ts`, fake Google path, `loginAsUser`, `MAX_ATTEMPTS`, `hint.penalty`, `settings.notifications` toggle, `googleBtn` styles.
- [x] Replace `console.log/warn` with `lib/log.ts` (no-op in release).
- [x] Add a `README.md` with run/build instructions and a `.env.example` that matches the six `EXPO_PUBLIC_FIREBASE_*` variables already used.
- [ ] Tag `v1.0.0-baseline` and record the current APK if one exists.

**Done when:** `tsc --noEmit`, `expo lint`, `expo-doctor` pass; `grep` for removed identifiers returns nothing; `npx expo start` runs on a device with zero console errors.

_Verified 23 Oct 2026: typecheck, lint and `expo-doctor` (21/21) pass. Local Metro bundling fails on this machine with `EINVAL: readlink` on OneDrive placeholder files inside `node_modules` — an environment quirk, not app code; confirm the first bundle on an EAS build or a non-OneDrive checkout._

---

## Phase 1 — Architecture (3–4 days)

**Goal:** one obvious place for every concern; navigation that handles back and deep links.

Prerequisite: decision **D2**.

- [x] Install and configure `expo-router`; add `scheme: "guessify"`, `main: "expo-router/entry"`.
- [x] Create route groups: `(main)` with bottom tabs (Home, Ranks, History, Profile); auth and onboarding as flat routes; `solo/*`, `duel/*`.
- [x] Port all 21 screens to routes. **No screen behaviour changes** during the port.
- [x] Delete the custom `App.tsx` navigator, `screenStack`, `navigateTo`, `goBack`, `screenParams`, and the manual `BackHandler`.
- [ ] Split `AppContext` — **deferred for v1.0.** The composed façade stays: auth/session, settings, solo session, room subscription, leaderboard and history are separate sections inside one provider, and `useApp()` remains the only import. Extracting providers is a v1.1 refactor with no user-facing gain.
  - `AuthProvider` — session, profile, sign-in/out, delete account.
  - `SettingsProvider` — sound, haptics, keypad.
  - `features/*/use*.ts` — solo session, room subscription, leaderboard, history.
- [ ] Move logic out of screens into feature modules — partially done: domain logic lives in `lib/` and `services/`; screens keep layout + local UI state.
- [ ] Extract shared UI into `components/ui` — partially done: shared primitives live in `components/common/` (`NeonButton`, `GlowCard`, `CustomNumpad`, `GameBottomNav`, modals).
- [x] Add `ErrorBoundary` at the root layout with a "Reload" action (FR-35).
- [x] Add a single `lib/firebase.ts` with long polling (App Check wiring is deferred, see 2b).
- [x] Verify parity: every path reachable today is reachable after migration, including hardware back and mid-game exit confirmation.

**Done when:** every route renders, back behaves identically or better, and `guessify://duel/ABC123` opens the join flow. The provider split and `components/ui` extraction are deliberately deferred; both are tracked in Phase 6 and neither blocks launch.

---

## Phase 2 — Security and data integrity (3–4 days)

**Goal:** a client cannot see another user's email, cannot write an unbounded score, and cannot read a duel secret.

**Constraint:** Firebase **Spark plan only** — no Cloud Functions. Integrity comes from rules, caps, App Check and a referee model (PRD §8.2).

### 2a. Firestore rules (1 day)

- [x] Rewrite `firestore.rules` to the matrix in PRD §8.1.
- [x] `users/*`: owner-only read/write. Match history lives in `matches` (the old subcollection is gone).
- [x] `publicProfiles/*`: signed-in read; owner write with a whitelisted field set (no email).
- [x] `matches/*`: owner create-only, validated shape, `clientMatchId` as document ID.
- [x] `leaderboards/*`: public read; owner write, monotonic and capped at the max single-match award.
- [x] `rooms/*`: signed-in read so a code can be joined; participant-only writes with field guards (no rewriting `hostUid`; a guest can only claim the empty guest seat; only the referee writes guess results). The secret is rejected while `PLAYING`.
- [x] Delete unused rules for `rooms/*/guesses` and global `history`.
- [x] Rules unit tests with `@firebase/rules-unit-testing` against the emulator: unauthorised read fails, email is unreachable, owner read succeeds, oversized points write fails, third player join fails. **28 cases, green.**

### 2b. Integrity without a server (1 day)

- [x] Make match writes idempotent and absolute (`clientMatchId` doc ID, `setDoc`), so retries cannot double-award.
- [x] Period-key leaderboards (`2026-W43`, `2026-10`, `allTime`) written on award — real windows instead of derived multipliers. Implements FR-23.
- [x] Bounds in rules: `points` monotonic and ≤ previous + max award; `wins ≤ gamesPlayed`; `winRate` 0–100. Timestamps are client epoch ms (Spark, no server timestamp transform) and rules validate shape and caps only. Implements FR-22.
- [ ] Enable App Check (debug provider locally, Play Integrity in release) and enforce on Firestore (NFR-5). **Deferred:** the React Native JS SDK cannot attest with Play Integrity; App Check needs a native dev build. Ship v1.0 with rules as the boundary, revisit in v1.1.
- [ ] Add a TTL policy on `rooms.expiresAt` in the Firebase console; verify a test room disappears. Implements FR-21. **Deferred:** Firestore TTL requires a `Timestamp` field, while the app stores `expiresAt` as epoch ms. Expiry is enforced by the client on join and in the room UI; stale rooms are inert and cost a few KB each.
- [ ] Add an anomaly log line for `durationSeconds` vs `attempts` mismatches; document the manual review step. **Not shipped:** there is no server-side log to review on Spark, and a client log is not evidence.

### 2c. Client integration (1–2 days)

- [x] Delete the fake native Google path (B8) and its dead plumbing. Ship v1.0 with email + guest only (D3).
- [x] Implement the **referee model** for duels: the secret never enters Firestore while `PLAYING`; the setter's client evaluates guesses and writes results; the target is revealed only on `RESULT` (closes B6, FR-16).
- [x] Add `lib/outbox.ts`: queue match awards locally, flush on reconnect, idempotent by `clientMatchId` (FR-12).
- [x] Client-side account deletion: re-authenticate, batch-delete history/public profile/leaderboard entries/user doc, then `deleteUser()` (FR-4).
- [ ] Rewrite storage errors: never `catch {}`; surface a user-facing "not saved" state (B10, FR-33). **Partially done:** award failures stay in the outbox and the Settings sync counter makes them visible; local persistence failures are still logged rather than surfaced.

**Done when:** a script holding only the app's API key cannot read any email, cannot write an unbounded score, and sees no room secret; rules tests pass in CI; deleting an account removes every trace. Room expiry is app-enforced (TTL deferred, see 2b).

---

## Phase 3 — Reliability and UX (3–4 days)

**Goal:** testers do not hit blank screens, lost guesses, or silent failures.

- [x] Duel guess submission via `runTransaction`; reject off-turn and post-result guesses. Implements FR-17 (B5).
- [x] `joinRoom` seated transactionally; third player rejected deterministically (B5).
- [x] Room lifecycle UI: "opponent left", "room closed" and "room expired" states instead of frozen screens. (No dedicated connection-lost banner; Firestore's own offline cache covers transient drops.)
- [x] Session restore from Firebase auth state; guests restored or explicitly re-onboarded (B11, B12).
- [ ] Network status banner + retry on every failed fetch; skeletons for leaderboard/history first load. **Deferred:** Firestore serves cached reads while offline and every screen has an explicit empty/error state; a banner is nice-to-have.
- [ ] Virtualise leaderboard and history lists; page 50 rows (NFR-2). **Not needed for v1.0:** queries are capped at 50 rows, so a `ScrollView` is bounded.
- [ ] Accessibility pass: `accessibilityRole`, `accessibilityLabel`, `allowFontScaling` on all interactive controls (B15, FR-36, NFR-2). **Baseline only:** primary buttons and icon-only controls are labelled; a full audit is v1.1.
- [x] Settings toggles are honest: haptics, keypad vibration and sound are checked at every call site, via `expo-haptics` and `expo-audio`.
- [x] Vitest setup + unit tests for scoring, warm/cold thresholds, hint penalty, shield exhaustion, period keys and duel points (**18 cases**), plus the **28-case** security-rules suite.
- [x] GitHub Actions: `tsc --noEmit`, `expo lint`, engine tests and the emulator rules suite on every push (NFR-9).

**Done when:** two devices racing guesses in the same room never lose an entry; airplane-mode solo round syncs on reconnect; unit tests cover both engines; CI green.

---

## Phase 4 — Store readiness (3–4 days)

**Goal:** everything Play asks for, produced once and versioned.

- [x] `app.json`: `android.versionCode: 1`, `android.permissions` limited to `INTERNET` and `VIBRATE` (the `expo-audio` plugin is configured with recording disabled so it adds no microphone permission), light `userInterfaceStyle` with the brand-dark splash plate.
- [x] `eas.json`: `appVersionSource: "local"` with explicit `versionCode` bumps per release; OTA channels are not used in v1.0.
- [ ] `eas build --profile production --platform android`; install the `.aab`-derived APK from the internal track on at least two physical devices (one low-end). **Blocked on the Expo account and credentials.**
- [ ] Back up the EAS keystore; store credentials in a password manager (NFR-6). The keystore is generated by the first build.
- [ ] Sentry (`@sentry/react-native`) with release/dist tags; verify a test error arrives (NFR-7). **Deferred to v1.1**, together with a crash-review routine.
- [x] Analytics: skipped for v1.0. No Firebase Analytics (incompatible with the JS SDK in RN).
- [x] Privacy policy page hosted on the portfolio site; linked from Play listing and Settings — https://vinaykumar.eu.cc/privacy/guessify (live, verified 200).
- [x] Account-deletion web page on the portfolio site; URL recorded for Play Console — https://vinaykumar.eu.cc/delete-account/guessify (live, verified 200).
- [ ] Play Console: create app, complete Data Safety (email, user ID, game stats, crash logs, deletion), content rating questionnaire, target audience 13+, ads = none. **Account-bound.**
- [ ] Listing assets: 512×512 icon, 1024×500 feature graphic, 4–6 screenshots (home, solo, clue, duel, result, leaderboard), short + full description. **Needs device captures.**
- [ ] Play Console account: $25, identity verification started **now** if not already done — verification alone can take days.

**Done when:** three people install the internal-track build and complete a solo round and a duel without a crash; every Play Console section is complete and saving without errors.

---

## Phase 5 — Closed test → production (14 days + review)

**Goal:** satisfy Google's gate and collect real feedback.

- [ ] Create the closed track, upload the first build, publish the opt-in link.
- [ ] Recruit 12 testers who will stay opted in **continuously** — dropping out resets your clock for that tester.
- [ ] Weekly loop: read crash reports (Sentry), fix P0/P1 only, ship updates to the same track. No feature work.
- [ ] Track a simple sheet: tester, install date, last active, top complaint.
- [ ] After 14 continuous days with ≥12 opted-in testers: apply for production access from the Dashboard.
- [ ] Answer the production-access questions with specifics — what testers reported, what was fixed.
- [ ] On approval: promote the build, staged rollout 20 % → 100 %.

**Done when:** app is live on Play with a public link.

---

## Phase 6 — After v1.0

Ordered by value:

1. **Real Google Sign-In** (D3) — `@react-native-google-signin/google-signin`, OAuth client, SHA-1 fingerprints for the EAS keystore, `GoogleAuthProvider.credential(idToken)`.
2. **iOS build** — Apple Developer Program ($99/yr), EAS iOS credentials, safe-area and haptics re-validation.
3. **Push notifications** — only then reintroduce the `notifications` setting (FCM via Expo Notifications, or a Cloud Function that sends turn reminders).
4. **Deeper duel features** — best-of-three, friends list, invite links via the `guessify://` scheme already in place.
5. **Analytics and retention** — funnel from install → first solo round → first duel.
6. **App Check + Play Integrity** — needs a native dev build; enforce on Firestore once the app is a dev client.
7. **Room TTL** — move `expiresAt` to a Firestore `Timestamp` and enable TTL, then drop the client-only expiry check.
8. **Architecture cleanup** — split `AppContext` into auth/settings/game providers, extract `components/ui`, and add the network banner/skeletons plus the full accessibility pass.
9. **Crash reporting** — add Sentry together with the release process that will actually read it.

---

## Working agreement

- One phase per branch: `phase-0-baseline`, `phase-1-architecture`, … Merge only when its "Done when" is true.
- No feature work during Phase 1 or Phase 5.
- Every merge updates `README.md` if commands or structure changed.
- Keep `PRD.md` and this file in sync when scope moves — a stale roadmap is worse than none.

---

## Critical path

```
D2 + D3 + D4 decided (D1 = Spark, no functions)
   ↓
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → [14-day gate] → production
                                    ↑
                        Play Console verification (start now, async)
```

The only things that can run in parallel with development: Play Console identity verification, Play Console account creation, tester recruitment, and writing the privacy policy / deletion page.
