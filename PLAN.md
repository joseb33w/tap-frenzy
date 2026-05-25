# Goal

Build **Tap Frenzy** — a one-page mobile tap game with Supabase magic-link auth and a top-5 personal + top-10 global leaderboard.

Gameplay:
- Glowing colored circle spawns at a random screen position.
- Shrinks from 100px → 0 over 1.2s.
- Tap before it disappears → +1 point.
- Miss (let it disappear) → -1 life. 3 lives total.
- New circle every 0.4–0.8s; spawn rate gets ~5% faster every 10 points.
- 30-second round timer at top.
- Game over → "Try again" + leaderboard.

# Files to touch

```
.
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
├── .gitignore (update)
├── README.md
└── src/
    ├── main.ts                 # bootstraps app + screen routing
    ├── style.css               # @import "tailwindcss"
    ├── screens/
    │   ├── AuthScreen.ts
    │   ├── HomeScreen.ts
    │   ├── GameScreen.ts
    │   └── LeaderboardScreen.ts
    ├── game/
    │   ├── Circle.ts           # single circle entity (spawn, shrink, hit detection)
    │   ├── GameLoop.ts         # requestAnimationFrame loop + spawn scheduler
    │   └── Score.ts            # score + lives + timer state machine
    ├── components/
    │   ├── LivesIndicator.ts   # heart icons rendering current lives
    │   ├── Leaderboard.ts      # personal-top-5 + global-top-10 view
    │   └── GameOverModal.ts    # final score + Try again button
    └── lib/
        ├── supabase.ts         # createClient + signInWithOtp + signOut helpers
        └── rng.ts              # seedable random (mulberry32) for fair circle placement
```

# Backend

Supabase project: shared Gogi project.

Table: `public."usr_nmexs7bytxq2_tap_scores"`
- `id uuid primary key default gen_random_uuid()`
- `user_id text not null` — Supabase `auth.uid()::text`
- `score integer not null`
- `played_at timestamptz not null default now()`

Policies:
- `auth_user_access` (ALL, authenticated): rows scoped to `auth.uid()::text = user_id`.
- `global_read` (SELECT, authenticated): every authenticated user can read all scores → enables global top-10 leaderboard.

Grants: `SELECT, INSERT, UPDATE, DELETE` to `authenticated` and `service_role`.

Indexes: `(score DESC)`, `(user_id)`.

# Verification approach

1. **Type check**: `npx tsc --noEmit`.
2. **Build**: `npm run build`.
3. **Backend integration test** (`/workspace/verify/`):
   - Create a real test user via service-role admin API.
   - Sign in to a normal client session for that user.
   - Insert a `tap_scores` row → confirm RLS allows the owner.
   - Insert a row as a DIFFERENT user with the wrong `user_id` → confirm RLS rejects (negative test).
   - Read scores → confirm the row is visible.
   - Delete the test user (service role) — cleanup.
4. **Frontend integration test** (Playwright in `/workspace/verify/`):
   - Load served `dist/`.
   - Page renders without console errors.
   - Auth screen present; clicking "Play as guest" (if implemented) is NOT in scope — magic link is the only path.
   - Game can start in offline/anonymous-stub mode for the headless drive? No — the user requested magic-link auth, which can't be completed in headless. Verify the rendering + UI logic + dev-mode hook that lets us drive the game loop without auth.
5. **Game loop test** (Playwright):
   - Spawn a circle, dispatch a click on it, assert score increments.
   - Let a circle disappear, assert lives decrements.
   - Run for 30 simulated seconds, assert game over modal appears.

# Out of scope

- Sound effects, haptics, dark/light mode toggle.
- Persisting in-progress games (server-side checkpoints).
- Social sharing of scores.
- Username display (we use the email's local part for the leaderboard).
