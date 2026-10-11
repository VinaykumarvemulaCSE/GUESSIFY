# Guessify: Product Requirements Document

*Version 1.1 | 11 October 2026 | Supersedes Smart Number Guessing Game PRD v1.0 (10 October 2026)*

| Field | Details |
| --- | --- |
| Product | Guessify (formerly Smart Number Guessing Game) |
| Platform | Android first; architecture portable to iOS |
| Client | React Native + Expo + TypeScript |
| Backend | Firebase Authentication, Cloud Firestore, Cloud Functions (Blaze plan) |
| Experience | Solo play, private two-player multiplayer, leaderboards |
| Design source | Stitch export: 43 screens + Guessify Gaming System |
| Status | Ready for Phase 1 and 2. Rule decisions in Section 19 are recommended defaults awaiting owner confirmation. |

**What changed from v1.0:** the leaderboard moves from P2 to P0; the 10-attempt limit, guest solo play, turn timer, hint count and scoring formula are now defined; the room code format is fixed; the product is named Guessify; and screens that exist in the design but were absent from the PRD (onboarding, game rules, about, history, theme selector, help) are added with priorities.

# 1. Executive Summary

Guessify is a mobile game where players discover a hidden number through guesses and high/low feedback. It supports solo play across three difficulty levels, private two-player rooms joined with a short code, and weekly, monthly and all-time leaderboards. The host controls multiplayer mode selection, and players can rematch without leaving the room.

## 1.1 Product vision

A quick-to-learn, responsive, friendly guessing game that is fun alone, easy to play with a friend remotely, and gives players a reason to come back through rankings.

## 1.2 Product goals

- Make the first game easy to start with minimal setup.
- Provide reliable guess feedback, attempts, hints and scoring.
- Allow two players to create or join a private room and play synchronized rounds.
- Keep hidden numbers and all score calculations protected from client-side tampering.
- Make rematches simple while preserving the room.
- Provide fair, tamper-resistant rankings.

## 1.3 Non-goals for the first release

- Public matchmaking, open chat, tournaments, clans.
- Real-money wagering, gambling or paid advantages.
- Voice or video calls, friend lists, cross-game progression.
- Full offline play (a connection is required for ranked scoring).

# 2. Users and Roles

| Role | Description | Key permissions |
| --- | --- | --- |
| Guest | Anonymous user who has not signed in. | Play unranked solo rounds; view onboarding, rules and the leaderboard. Cannot create or join rooms. |
| Registered player | Authenticated user. | Solo (ranked), multiplayer, profile, history, leaderboard participation. |
| Host | Player who created a room. | Share code, select mode, propose rematch. |
| Joining player | Player who joined with a code. | Ready up, confirm mode, play per mode rules. |
| Administrator | Operational role. | Outside MVP. |

Host and joining roles are room-specific, not permanent account types.

# 3. Scope and Prioritization

| Priority | Included capabilities |
| --- | --- |
| P0: MVP | Splash and onboarding, email sign-up/login/reset, guest solo, dashboard, three solo difficulties, guess feedback, attempts, hints, scoring, solo result, private rooms, waiting room, three multiplayer modes, results and rematch, **leaderboard (weekly, monthly, all-time)**, **match history**, profile and settings, game rules and about, error/empty/loading states, backend rules. |
| P1: Post-MVP | Google sign-in, XP and levels, themes, achievements and medals, streaks, push notifications, avatars, account deletion, expanded accessibility. |
| P2: Later | Public matchmaking, tournaments, localization, monetization, advanced analytics, friends-only leaderboards. |

Platform notes: Android first, Expo-compatible dependencies, no unnecessary native modules, UI and rules portable to iOS.

# 4. Screen Inventory (mapped to design)

| Group | Screens (design folder) | Priority |
| --- | --- | --- |
| Entry | Splash; Welcome onboarding; Onboarding: Think, Guess, Win; Onboarding: Play Your Way | P0 |
| Auth | Login; Create Account; Reset Password | P0 |
| Home | Main Dashboard | P0 |
| Solo | Choose Difficulty; Solo Gameplay (numpad); Gameplay Hint; Guess Feedback; Correct Guess; Round Result Victory; Game Over | P0 |
| Multiplayer | Multiplayer Menu; Create Room; Join Room; Join Room Help; Waiting Room; Mode Selection (Host); Mode Confirmation; Live Gameplay; Result and Rematch | P0 |
| Ranking and history | Leaderboard; Game History | P0 |
| Account | Player Profile; Settings; Game Rules; About Guessify | P0 |
| Theme | Theme Selector | P1 |
| System states | Error Screen; Connection Lost; Opponent Disconnected; Invalid Room Code; Empty State; Loading State | P0 |

# 5. Functional Requirements

## 5.1 Authentication and profile

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| AUTH-001 | Sign up with name, email, password, confirmation. | P0 | Valid details create an account; invalid email, weak password, mismatch and duplicate email show clear errors. |
| AUTH-002 | Log in and out with email and password. | P0 | Valid credentials start a session; invalid ones show a safe generic error; logout clears the local session. |
| AUTH-003 | Password reset. | P0 | Reset flow does not reveal whether an email is registered. |
| AUTH-004 | Session persists across restarts. | P0 | Signed-in users return to the dashboard unless the session is invalid. |
| AUTH-005 | Google sign-in. | P1 | Provider success maps to a profile; cancellation and errors are handled. |
| AUTH-006 | Guest access. | P0 | Guests can play solo only; results are not ranked or saved to the server; prompts to register appear on the result screen. |
| PROF-001 | View and update display name. | P0 | Only the owner can read and update their profile. |
| PROF-002 | Delete account. | P1 | Requires confirmation; follows the retention policy. |

## 5.2 Dashboard and navigation

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| NAV-001 | Dashboard shows display name and main actions. | P0 | Play, Ranks, Profile and Settings are reachable from the bottom navigation. |
| NAV-002 | Protect active multiplayer rounds. | P0 | Leaving an active room prompts or follows the leave policy. |
| NAV-003 | Consistent Android back behavior. | P0 | Back never submits a guess or resets a round. |

## 5.3 Single-player

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| SP-001 | Choose Easy (1–50), Medium (1–100) or Hard (1–1000). | P0 | Ranges are inclusive. |
| SP-002 | One secret integer per round. | P0 | In range and constant for the round. For signed-in players the secret is generated and held server-side. |
| SP-003 | Submit an integer guess using the in-app numpad. | P0 | Blank, non-integer and out-of-range input is rejected with actionable feedback. |
| SP-004 | Feedback: Too High, Too Low or Correct. | P0 | Correct comparison; feedback is shown with text and an icon, not color alone. |
| SP-005 | Track attempts out of 10. | P0 | Each valid guess counts once; invalid guesses do not count. |
| SP-006 | Hints (2 per round). | P0 | Hint 1 narrows the range; hint 2 gives a property (even/odd and digit sum). Hints never reveal the number. Each hint applies the hint penalty. |
| SP-007 | Final score. | P0 | Deterministic per Section 6.1. |
| SP-008 | Surrender. | P0 | Confirmation prompt; ends the round as a loss and reveals the number. |
| SP-009 | Result screen. | P0 | Shows outcome, attempts, score, time, difficulty and guess journey; Play Again starts a fresh round; Dashboard exits cleanly. |
| SP-010 | Round ends at 10 attempts. | P0 | The tenth wrong guess ends the round as a loss (Game Over screen). |

## 5.4 Multiplayer rooms and readiness

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| MP-ROOM-001 | Create a private room. | P0 | Unique 6-character alphanumeric code; creator becomes host. |
| MP-ROOM-002 | Copy or share the code. | P0 | Copies the active code; share cancellation handled; confirmation toast shown. |
| MP-ROOM-003 | Join by code. | P0 | Valid open room admits the player; invalid, expired, full or started rooms show specific messages (Invalid Room Code and Join Room Help screens). |
| MP-ROOM-004 | Max two active players. | P0 | A third player is rejected. |
| MP-ROOM-005 | Ready status. | P0 | Both players see each other's latest status in near real time. |
| MP-ROOM-006 | Start conditions. | P0 | Backend rejects a start request unless both players are ready and have confirmed the mode. |
| MP-ROOM-007 | Disconnect handling. | P0 | The remaining player sees a status update (Opponent Disconnected screen) and can wait or leave. |
| MP-ROOM-008 | Code expiry. | P0 | Waiting rooms expire after 5 minutes (countdown shown); closed rooms cannot be rejoined. |

## 5.5 Multiplayer modes and play

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| MP-MODE-001 | Only the host selects the mode. | P0 | Backend rejects non-host selection. |
| MP-MODE-002 | Mode is broadcast for confirmation. | P0 | Both clients show the same mode and confirmation state. |
| MP-MODE-003 | Both Together: both guess the same secret, alternating turns. | P0 | One guess per turn, visible turn indicator, 30-second turn timer, attempts tracked per player; first correct guess wins. |
| MP-MODE-004 | You Guess: host guesses, friend sets the number. | P0 | Only the host submits guesses; the secret is never sent to the host client. |
| MP-MODE-005 | Your Friend Guesses: friend guesses, host sets the number. | P0 | Only the joining player submits guesses; the secret is never sent to the guesser client. |
| MP-MODE-006 | Synchronized state. | P0 | Clients converge on authoritative state after each accepted action. |
| MP-MODE-007 | Server validation. | P0 | Out-of-turn, duplicate, malformed and unauthorized actions are rejected. |
| MP-MODE-008 | Result for both players. | P0 | Both receive the same winner or draw and score summary. |
| MP-MODE-009 | Turn timeout. | P0 | If the timer expires the turn passes without adding an attempt; three consecutive timeouts forfeit the round. |

## 5.6 Results and rematch

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| RESULT-001 | Result screen content. | P0 | Names, mode, attempts, time, points and outcome, plus the chronology trail. |
| RESULT-002 | Rematch. | P0 | Host proposes and may choose a new mode; shows the agreement count (for example 1/2); starts when both agree. |
| RESULT-003 | Rematch resets round state. | P0 | New secret, guesses, attempts and readiness; room and players preserved. |
| RESULT-004 | Leave. | P0 | Either player may return to the dashboard; the other player is notified. |

## 5.7 Leaderboard

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| LB-001 | Weekly, Monthly and All-time boards. | P0 | Tabs switch boards; the weekly board shows a reset countdown. |
| LB-002 | Top 50 with podium for ranks 1–3. | P0 | Shows rank, display name, points and tier badge. |
| LB-003 | Player's own rank is pinned. | P0 | Shown even when outside the top 50, with percentile and daily rank change where available. |
| LB-004 | Points are awarded only by trusted backend logic. | P0 | Clients cannot write points or ranks. |
| LB-005 | Guests are not ranked. | P0 | Guests see the board and a prompt to sign up. |
| LB-006 | Privacy opt-out. | P0 | A Settings toggle hides the player from public boards; their points are still tracked. |
| LB-007 | Periodic reset. | P0 | Weekly board resets Monday 00:00 UTC; monthly on the 1st; all-time never. |

## 5.8 Match history

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| HIST-001 | Show recent matches with filters (All, Victories, Defeats). | P0 | Each row shows mode or difficulty, outcome, target, attempts, score and time. |
| HIST-002 | Career summary. | P0 | Games played, win rate, average guesses. |
| HIST-003 | Clear history. | P0 | Confirmation required; clears the user's own history only. Leaderboard points are unaffected. |

# 6. Gameplay Rules

| Rule | MVP behavior | Status |
| --- | --- | --- |
| Number ranges | Easy 1–50, Medium 1–100, Hard 1–1000, inclusive. Multiplayer default 1–100. | Defined |
| Guess validity | Whole numbers inside the active range only. | Defined |
| Repeated guesses | Allowed; each valid guess counts as an attempt. | Defined |
| Attempt limit | 10 per player per round. | Proposed default |
| Hints | 2 per solo round; none in multiplayer MVP. | Proposed default |
| Both Together | Alternating turns, 30s timer, first correct guess wins; if both exhaust attempts the round is a draw. | Proposed default |
| Setter modes | Guesser wins by solving within 10 attempts; otherwise the setter wins. | Proposed default |
| Number setter | Setter submits a valid secret privately; it cannot be changed once play begins. | Defined |
| Host disconnect | Pause for a 60-second grace period, then close the room. | Proposed default |
| Room expiry | Waiting rooms close after 5 minutes. | Proposed default |

## 6.1 Scoring formula (proposed, tune after playtesting)

Solo score on a win: `score = max(50, difficultyBase − 25 × (attempts − 1) − 50 × hintsUsed)` with bases of 500 (Easy), 800 (Medium) and 1000 (Hard). A loss scores 0. Scores are computed on the backend for signed-in players. All constants live in one configuration module so they can be tuned without code changes elsewhere.

## 6.2 Multiplayer points

Winner 150 points, loser 45 points, draw 75 points, matching the values shown in the design. Points are awarded once per completed round by the backend.

# 7. Leaderboard Design Rules

- **Ranking points** = solo win scores + multiplayer round points, accumulated within each period.
- **Tie-break:** the player who reached the score first ranks higher.
- **Tiers** (display only): Grandmaster, Tier II, Tier III and so on, derived from rank bands, not stored by the client.
- **Anti-cheat:** ranked solo rounds are created, guessed and scored through Cloud Functions; the secret never reaches the device. Rate-limit round creation. Reject results from rounds that were not created by the server.
- **Storage:** one document per user per period, written only by functions, readable by authenticated users for the top-N query. Cache the top 50 per board to limit reads.
- **Display data:** display name and points only; no email or UID in public documents.

# 8. UI/UX Requirements

## 8.1 Design system (Guessify Gaming System)

| Token | Value |
| --- | --- |
| Background / surface | #0f131d, containers #171b26 to #313540 |
| Primary (amber) | #ffe1a7, container #fbbf24 |
| Secondary (cyan) | #7bd0ff, container #00a6e0 |
| Tertiary (violet) | #ebdfff, container #d2beff |
| Error | #ffb4ab, container #93000a |
| Text | on-surface #dfe2f1, variant #d3c5ac |
| Typography | Plus Jakarta Sans for UI; Space Grotesk for keypad and room codes |
| Corner radius | 4, 8, 12, 16, 24 px |

Implement these as design tokens in `constants/` so themes (P1) can swap them.

## 8.2 Requirements

- Mobile-first layouts using flexible units, not fixed pixel positions.
- Clear primary action per screen; disabled states when unavailable.
- Immediate feedback for guess submission, readiness, room creation, joining and confirmation.
- Loading, empty, validation, offline, retry, opponent-left and expired-room states.
- Accessible contrast, labels and touch targets; never rely on color alone; support system font scaling.
- A custom numpad is used for guesses so the system keyboard does not obscure the screen.
- Sound, haptics and keypad vibration are user toggles in Settings.

## 8.3 Required UI states

Idle, loading, success, validation error, network error, disabled, retrying. Room: waiting, opponent connected, ready, both ready, expired. Gameplay: your turn, opponent's turn, guess submitted, too high, too low, correct, round complete, reconnecting.

# 9. Technical Architecture

| Layer | Choice | Responsibilities |
| --- | --- | --- |
| Framework | React Native + Expo | App shell, navigation, device integration. |
| Language | TypeScript | Typed UI, domain models, service contracts. |
| Navigation | Expo Router | Auth, tabs (Play, Ranks, Profile, Settings), solo, room, result routes. |
| Styling | StyleSheet with design tokens | Reusable components. |
| Identity | Firebase Authentication | Email/password; anonymous for guests; Google later. |
| Database | Cloud Firestore | Profiles, rooms, public round state, results, leaderboards. |
| Trusted logic | Cloud Functions | Room actions, secrets, guess validation, scoring, leaderboard updates, cleanup. |
| Realtime | Firestore listeners | Presence, readiness, guesses, results, rematch. |
| Testing | Jest unit tests plus two-device integration tests | Rules, security rules, sync, reconnect. |
| Source control | Git + GitHub | History and review. |

Principles: keep UI separate from game rules; backend is authoritative; typed service functions only; server timestamps and transactions for concurrent actions; explicit reconnect behavior; no secrets in the app bundle.

## 9.1 Suggested project structure

```
app/ (auth), (tabs), solo, multiplayer, profile, leaderboard
components/ ui, game
features/ auth, solo, multiplayer, leaderboard, profile
lib/ firebase, validation
services/ auth, rooms, game, leaderboard
domain/ models, rules, scoring
hooks/  constants/  assets/  tests/  functions/
```

# 10. Data Model (logical)

| Entity | Important fields | Access |
| --- | --- | --- |
| UserProfile | uid, displayName, email, hideFromLeaderboard, createdAt | Owner read and update of permitted fields. |
| Room | roomId, code, hostUid, playerUids\[2\], status, createdAt, expiresAt, currentRoundId | Code lookup via function; two members max. |
| RoomMember | uid, role, ready, connected, lastSeenAt | Validated by backend. |
| Round | roundId, roomId, mode, status, rangeMin, rangeMax, turnUid, turnDeadline | Public safe state only. |
| SecretState | roundId, secretNumber, setterUid | Server-only. |
| Guess | guessId, uid, value, result, sequence, createdAt | Written by functions; idempotent. |
| RoundResult | roundId, winnerUid, outcome, attemptsByUid, pointsByUid | Written by functions only. |
| SoloRound | roundId, uid, difficulty, status, attempts, hintsUsed, startedAt | Secret held server-side. |
| MatchHistory | uid, roundId, mode, outcome, score, attempts, playedAt | Owner read; owner can clear. |
| LeaderboardEntry | period, uid, displayName, points, wins, updatedAt | Functions write; authenticated read. |

Exact Firestore paths, security rules, indexes, TTL cleanup and callable contracts are designed in Phase 5.

# 11. Security, Privacy and Fairness

- Authentication required for ranked and multiplayer operations.
- Enforce membership and host permissions on the backend, not just in the UI.
- Never place a secret in a document readable by the guesser, or in logs.
- Guesses go through a function that validates identity, membership, round status, turn, range and duplicates.
- Winner, scores and leaderboard points are computed server-side only.
- Minimal Firestore rules; rate-limit room creation, code attempts and guess submission.
- Generic auth error messages.
- Document collected data, purpose, retention and deletion. No location, contacts or microphone permissions.
- No chat or user-generated content in MVP. Display names should be length-limited and filtered because they appear on public leaderboards.

**Release privacy checklist:** privacy policy and support contact; accurate data-safety disclosures; account deletion path; room and match retention policy; production security-rule review.

# 12. Non-Functional Requirements

| ID | Requirement | Target |
| --- | --- | --- |
| NFR-001 | Responsiveness | Local interactions feel immediate; pending state for network calls. |
| NFR-002 | Realtime | Typical updates visible in under 1.5 seconds at p95 (to be measured). |
| NFR-003 | Reliability | Transient disconnects do not corrupt rounds; reconnect reloads authoritative state. |
| NFR-004 | Security | No client can read a secret it is not authorized to see. |
| NFR-005 | Compatibility | Multiple Android screen sizes and a chosen OS range. |
| NFR-006 | Maintainability | Rules and scoring are testable without UI. |
| NFR-007 | Accessibility | Labels, contrast, no color-only feedback. |
| NFR-008 | Observability | Diagnose errors without logging passwords, tokens or secrets. |
| NFR-009 | Cost | Leaderboard reads are cached and bounded. |

# 13. Error Handling and Edge Cases

Invalid guess input; repeated taps on Submit; invalid, expired, closed, full or started room codes; start before readiness; non-host actions; disconnects in waiting, play, result and rematch; app restarted mid-round; near-simultaneous submissions; host or guest leaving; rematch accepted by only one player; backend failure after a pending action; expired auth or deleted account during a round; leaderboard load failure (show cached data and retry); guest attempting ranked features. For every case the UI states what happened, preserves authoritative state and offers a safe next step. Never silently create a second round or duplicate a guess.

# 14. Testing and Acceptance

| Area | Coverage |
| --- | --- |
| Game rules | Range bounds, high/low/correct, attempts, hints, scoring, end states, 10-attempt limit. |
| Authentication | Sign-up, login, logout, reset, guest, session restore. |
| Room lifecycle | Create, share, join, invalid code, capacity, expiry, close. |
| Roles and modes | Host selection, confirmations, all three modes, timeouts. |
| Realtime | Readiness, guesses, results, rematch convergence. |
| Security | Unauthorized reads and writes, secret access, forged scores and forged leaderboard points. |
| Leaderboard | Point awards, period resets, tie-breaks, opt-out, caching. |
| Network recovery | Disconnect, reconnect, restart mid-round. |
| Device/UI | Small and large screens, keyboard and numpad, font scaling, Android back. |
| Release | Production config, build, privacy disclosures, smoke tests. |

## 14.1 MVP acceptance criteria

1. A new user can register, log in and reach the dashboard; a guest can play solo.
2. A player completes a round on all three difficulties and sees a result.
3. Two players create and join a room and see each other's readiness.
4. The host selects each mode and both confirm.
5. All three modes follow the agreed role and turn rules.
6. The guesser cannot retrieve the secret through client access or unauthorized reads.
7. Both players see the same result and can rematch without recreating the room.
8. Ranked results appear on the weekly, monthly and all-time boards, and a client cannot forge points.
9. Invalid inputs, expired rooms, network loss and player departure are handled without crashes or corrupted state.
10. Core tests pass on at least two devices or emulators with different sessions.

# 15. Analytics and Success Metrics

Registration completion; guest-to-registered conversion; solo completion rate; room join success; multiplayer completion rate; rematch rate; leaderboard views per active user; day-1 and day-7 retention; crash-free sessions; reconnect recovery. Collect only what is needed; never log passwords, tokens or secret numbers.

# 16. Release and Deployment

Separate development, testing and production Firebase projects; environment configuration kept out of version control; consistent app identifier, icon, splash and versioning; automated tests plus a two-device smoke test per release candidate; Android build through EAS with protected signing credentials; store listing, screenshots, privacy policy and data-safety form; crash and backend monitoring with a documented hotfix procedure; billing alerts on the Blaze plan.

# 17. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Secret leaks to the guesser | Breaks fairness. | Server-only secret state; test rules and payloads. |
| Leaderboard cheating | Rankings lose trust. | Server-generated solo rounds and server-computed points. |
| Conflicting simultaneous actions | Wrong turns or counts. | Transactions, idempotency, explicit state machine. |
| Player disconnects | Stuck round. | Persisted state, grace period, cleanup. |
| Unclear rules | Inconsistent UX. | Decisions in Section 19 approved before Phase 3. |
| Firebase cost growth | Unexpected bills. | Cache boards, budget alerts, bounded queries. |
| Offensive display names | Public leaderboard harm. | Length limits, filtering, opt-out. |
| Feature creep | MVP delay. | Keep XP, themes, achievements and Google sign-in in P1. |

# 18. Implementation Roadmap

| Phase | Deliverables | Exit criteria |
| --- | --- | --- |
| 1. Foundation | Expo + TypeScript, Expo Router, design tokens, shared components. | App runs on Android with the route structure. |
| 2. UI prototype | All P0 screens with mock data and states. | Full navigation demo without a backend. |
| 3. Solo engine | Ranges, guesses, hints, attempts, scoring, results, history (local). | Rule tests pass for all difficulties. |
| 4. Authentication | Email auth, guest, profile, session persistence. | Auth happy and error paths pass. |
| 5. Multiplayer backend | Rooms, codes, access control, presence. | Two clients create and join securely. |
| 6. Multiplayer modes | Mode selection, confirmation, play, secrets, scoring. | All three modes pass two-client tests. |
| 7. Leaderboard and server-scored solo | Functions for ranked rounds, points, boards, resets. | Boards update correctly; forgery tests fail as expected. |
| 8. Recovery and polish | Reconnect, rematch, edge cases, accessibility. | Acceptance checklist passes. |
| 9. Release | Production config, build, store assets, privacy materials. | Release candidate passes smoke tests. |

# 19. Decisions Log

All items below are recommended defaults and take effect unless the owner changes them.

| # | Decision | Default | Status |
| --- | --- | --- | --- |
| 1 | Attempt limit | 10 attempts with a Surrender option | Awaiting confirmation |
| 2 | Guest play | Guest solo allowed, unranked | Awaiting confirmation |
| 3 | Scoring | Section 6.1 formula and bases 500 / 800 / 1000 | Awaiting confirmation |
| 4 | Hints | 2 per solo round: range, then property | Awaiting confirmation |
| 5 | Both Together | Alternating turns, 30s timer, first correct wins | Awaiting confirmation |
| 6 | Product name | Guessify | Awaiting confirmation |
| 7 | Hard range | 1–1000 (Settings screen shows 1–500 in error) | Awaiting confirmation |
| 8 | Room code | 6-character alphanumeric, 5-minute expiry | Awaiting confirmation |
| 9 | Leaderboard scope | P0, three periods, server-scored | Awaiting confirmation |
| 10 | Google sign-in, XP, themes, achievements | P1 | Awaiting confirmation |

# 20. Glossary

| Term | Meaning |
| --- | --- |
| Host | Player who creates a room and selects the mode. |
| Joining player | Second player who enters with the code. |
| Guesser | Player trying to find the number. |
| Number setter | Player who chooses the secret in setter modes. |
| Round | One complete instance of a mode, from setup to result. |
| Room | Persistent two-player space that can hold many rounds. |
| Ranked round | A signed-in round created and scored by the backend, eligible for leaderboard points. |
| Authoritative backend | Trusted server logic that validates actions and determines outcomes. |
| Leaderboard period | Weekly, monthly or all-time window used to accumulate points. |

*Maintenance: update this document whenever a rule, flow, data model or acceptance criterion changes, recording the decision, date, reason and affected requirement IDs.*
