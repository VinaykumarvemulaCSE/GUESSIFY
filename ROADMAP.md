# Guessify — Roadmap to v1.0 (Play Store)

Companion to `PRD.md`. Requirement IDs (`FR-x`, `NFR-x`) and findings (`B-x`) refer to that document.

**Current position:** working prototype, real users, no production hardening.
**Target:** signed Android build on Play production.
**Effort:** ~15–18 focused days of work + 14 days of closed testing + up to 7 days of Google review ⇒ **5–6 calendar weeks** at 2–3 h/day.

---

## Timeline at a glance

| Phase | Focus | Effort | Gate |
|-------|-------|--------|------|
| 0 | Baseline & hygiene | 1 day | Clean tree, builds, private repo pushed |
| 1 | Architecture | 3–4 days | Router + feature modules, parity with today |
| 2 | Security & data integrity | 3–4 days | Rules enforced, capped writes, App Check, TTL |
| 3 | Reliability & UX | 3–4 days | Offline, errors, a11y, tests green |
| 4 | Store readiness | 3–4 days | Internal testing build installed by 3 people |
| 5 | Closed test | 14 days | 12 testers × 14 days, then production access |
| 6 | Post-launch | ongoing | v1.1 scope |

Phases 0–4 = **~13–16 focused days**. Do not compress Phase 5; it is a Google-imposed clock, not a task.

---

## Phase 0 — Baseline and hygiene (1 day)

**Goal:** know exactly what ships, remove everything that does not.

**Status:** code cleanup done 23 Oct 2026 (commit `99d8c83`); repo push and tag still blocked on GitHub authentication.

- [ ] `git init` is already done; push to a **private** GitHub repo today (3 commits, no remote — one disk failure and the app is gone).
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

- [ ] Install and configure `expo-router`; add `scheme: "guessify"`, `main: "expo-router/entry"`.
- [ ] Create route groups: `(auth)`, `(main)` with bottom tabs (Home, Ranks, History, Profile), `solo/*`, `duel/*`.
- [ ] Port all 21 screens to routes. **No screen behaviour changes** during the port.
- [ ] Delete the custom `App.tsx` navigator, `screenStack`, `navigateTo`, `goBack`, `screenParams`, and the manual `BackHandler`.
- [ ] Split `AppContext`:
  - `AuthProvider` — session, profile, sign-in/out, delete account.
  - `SettingsProvider` — sound, haptics, keypad.
  - `features/*/use*.ts` — solo session, room subscription, leaderboard, history.
- [ ] Move logic out of screens into feature modules; screens become layout + hooks.
- [ ] Extract shared UI into `components/ui` (`Button`, `Card`, `Input`, `Screen`, `EmptyState`, `ErrorState`, `Skeleton`) and `components/game`.
- [ ] Add `ErrorBoundary` at the root layout with a "Reload" action (FR-35).
- [ ] Add a single `lib/firebase.ts` with long polling and App Check wiring (App Check enforcement lands in Phase 2).
- [ ] Verify parity: every path reachable today is reachable after migration, including hardware back and mid-game exit confirmation.

**Done when:** no file imports from `src/context/AppContext.tsx` (deleted), every route renders, back behaves identically or better, `guessify://duel/ABC123` opens the join flow.

---

## Phase 2 — Security and data integrity (3–4 days)

**Goal:** a client cannot see another user's email, cannot write an unbounded score, and cannot read a duel secret.

**Constraint:** Firebase **Spark plan only** — no Cloud Functions. Integrity comes from rules, caps, App Check and a referee model (PRD §8.2).

### 2a. Firestore rules (1 day)

- [ ] Rewrite `firestore.rules` to the matrix in PRD §8.1.
- [ ] `users/*` and `users/*/history/*`: owner-only read/write.
- [ ] `publicProfiles/*`: signed-in read; owner write with a whitelisted field set (no email).
- [ ] `matches/*`: owner create-only, validated shape, `clientMatchId` as document ID.
- [ ] `leaderboards/*`: public read; owner write, monotonic and capped at the max single-match award.
- [ ] `rooms/*`: participants only; field-level guards (no rewriting `hostUid`; a guest can only claim the empty guest seat; only the referee writes guess results).
- [ ] Delete unused rules for `rooms/*/guesses` and global `history`.
- [ ] Rules unit tests with `@firebase/rules-unit-testing` against the emulator: unauthorised read fails, email is unreachable, owner read succeeds, oversized points write fails, third player join fails.

### 2b. Integrity without a server (1 day)

- [ ] Make match writes idempotent and absolute (`clientMatchId` doc ID, `setDoc`), so retries cannot double-award.
- [ ] Period-key leaderboards (`2026-W43`, `2026-10`, `allTime`) written on award — real windows instead of derived multipliers. Implements FR-23.
- [ ] Bounds in rules: `points` monotonic and ≤ previous + max award; `wins ≤ gamesPlayed`; `winRate` 0–100; timestamps server-generated. Implements FR-22.
- [ ] Enable App Check (debug provider locally, Play Integrity in release) and enforce on Firestore (NFR-5).
- [ ] Add a TTL policy on `rooms.expiresAt` in the Firebase console; verify a test room disappears. Implements FR-21.
- [ ] Add an anomaly log line for `durationSeconds` vs `attempts` mismatches; document the manual review step.

### 2c. Client integration (1–2 days)

- [ ] Delete the fake native Google path (B8) and its dead plumbing. Ship v1.0 with email + guest only (D3).
- [ ] Implement the **referee model** for duels: the secret never enters Firestore while `PLAYING`; the setter's client evaluates guesses and writes results; the target is revealed only on `RESULT` (closes B6, FR-16).
- [ ] Add `lib/outbox.ts`: queue match awards locally, flush on reconnect, idempotent by `clientMatchId` (FR-12).
- [ ] Client-side account deletion: re-authenticate, batch-delete history/public profile/leaderboard entries/user doc, then `deleteUser()` (FR-4).
- [ ] Rewrite storage errors: never `catch {}`; surface a user-facing "not saved" state (B10, FR-33).

**Done when:** a script holding only the app's API key cannot read any email, cannot write an unbounded score, and sees no room secret; rules tests pass in CI; deleting an account removes every trace; stale rooms vanish via TTL.

---

## Phase 3 — Reliability and UX (3–4 days)

**Goal:** testers do not hit blank screens, lost guesses, or silent failures.

- [ ] Duel guess submission via `runTransaction`; reject off-turn and post-result guesses. Implements FR-17 (B5).
- [ ] `joinRoom` seated transactionally; third player rejected deterministically (B5).
- [ ] Room lifecycle UI: "opponent left", "room expired", "connection lost" states instead of frozen screens.
- [ ] Session restore from Firebase auth state; guests restored or explicitly re-onboarded (B11, B12).
- [ ] Network status banner + retry on every failed fetch; skeletons for leaderboard/history first load.
- [ ] Virtualise leaderboard and history lists; page 50 rows (NFR-2).
- [ ] Accessibility pass: `accessibilityRole`, `accessibilityLabel`, `allowFontScaling` on all interactive controls (B15, FR-36, NFR-2).
- [ ] Haptics/sound respect settings everywhere (currently some screens call Haptics directly, bypassing the toggle).
- [ ] Jest setup + unit tests for `solo/engine.ts` (18–24 cases: score bounds, warm/cold thresholds, hint penalty, shield exhaustion) and the duel state machine (turn order, idempotent result).
- [ ] GitHub Actions: `tsc --noEmit`, `expo lint`, `jest` on every push (NFR-9).

**Done when:** two devices racing guesses in the same room never lose an entry; airplane-mode solo round syncs on reconnect; unit tests cover both engines; CI green.

---

## Phase 4 — Store readiness (3–4 days)

**Goal:** everything Play asks for, produced once and versioned.

- [ ] `app.json`: `android.versionCode`, `android.permissions` limited to `INTERNET` and `VIBRATE`, `userInterfaceStyle` matching the actual dark theme, splash colour consistent.
- [ ] `eas.json`: `production.autoIncrement: true`, `channel` if OTA updates are planned.
- [ ] `eas build --profile production --platform android`; install the `.aab`-derived APK from the internal track on at least two physical devices (one low-end).
- [ ] Back up the EAS keystore; store credentials in a password manager (NFR-6).
- [ ] Sentry (`@sentry/react-native`) with release/dist tags; verify a test error arrives (NFR-7).
- [ ] Analytics: skip for v1.0, or PostHog RN if desired. No Firebase Analytics (incompatible with the JS SDK in RN).
- [ ] Privacy policy page hosted on the portfolio site; linked from Play listing and Settings.
- [ ] Account-deletion web page on the portfolio site; URL recorded for Play Console.
- [ ] Play Console: create app, complete Data Safety (email, user ID, game stats, crash logs, deletion), content rating questionnaire, target audience 13+, ads = none.
- [ ] Listing assets: 512×512 icon, 1024×500 feature graphic, 4–6 screenshots (home, solo, clue, duel, result, leaderboard), short + full description.
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
