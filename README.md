# Tap Frenzy

A one-page mobile tap game. A glowing colored circle appears at a random position, shrinks from 100px → 0 over 1.2 seconds. Tap it before it disappears for +1 point. Misses cost a life — 3 lives total. New circle every 0.4–0.8s; circles speed up every 10 points. 30-second round timer. Game over → "Try again" + leaderboard.

## Stack

- **Vite 6** + **TypeScript 5** + **Tailwind CSS v4** (via the official `@tailwindcss/vite` plugin)
- **Supabase JS v2** — magic-link auth, one table `tap_scores`, per-user RLS
- No framework (vanilla TS modules) — every screen is a small render-to-DOM function

## Getting started

```bash
npm install
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Build for production:

```bash
npm run build
npm run preview   # serve the production build locally
```

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | yes | e.g. `https://YOUR_PROJECT_ID.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | yes | Supabase publishable / anon key. Safe to expose in the bundle. |
| `VITE_TAP_SCORES_TABLE` | no | Defaults to `usr_nmexs7bytxq2_tap_scores`. Override only if you create the table under a different name. |

## Supabase schema

Create the `tap_scores` table in the Supabase SQL editor:

```sql
CREATE TABLE IF NOT EXISTS public."usr_nmexs7bytxq2_tap_scores" (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  score integer not null,
  played_at timestamptz not null default now()
);

ALTER TABLE public."usr_nmexs7bytxq2_tap_scores" ENABLE ROW LEVEL SECURITY;

-- Owner can do everything to their own rows
CREATE POLICY "auth_user_access" ON public."usr_nmexs7bytxq2_tap_scores"
  FOR ALL TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- All signed-in users can read all rows (needed for the global top-10 leaderboard)
CREATE POLICY "global_read" ON public."usr_nmexs7bytxq2_tap_scores"
  FOR SELECT TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public."usr_nmexs7bytxq2_tap_scores" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."usr_nmexs7bytxq2_tap_scores" TO service_role;

CREATE INDEX IF NOT EXISTS idx_tap_scores_score_desc
  ON public."usr_nmexs7bytxq2_tap_scores" (score DESC);
CREATE INDEX IF NOT EXISTS idx_tap_scores_user_id
  ON public."usr_nmexs7bytxq2_tap_scores" (user_id);
```

In **Supabase Dashboard → Authentication → URL Configuration**, add your deployment URL(s) to the **Site URL** and **Additional Redirect URLs** so magic-link clicks bring users back to the app.

## Project structure

```
src/
├── main.ts                    # bootstraps + route switching
├── style.css                  # @import "tailwindcss" + custom utility classes
├── screens/
│   ├── AuthScreen.ts          # email entry → signInWithOtp
│   ├── HomeScreen.ts          # play / leaderboard / sign-out
│   ├── GameScreen.ts          # arena + HUD + game-over modal
│   └── LeaderboardScreen.ts   # personal top 5 + global top 10
├── game/
│   ├── Circle.ts              # spawn, shrink, hit detection, DOM rendering
│   ├── GameLoop.ts            # rAF loop + spawn scheduler
│   └── Score.ts               # score + lives + timer state machine
├── components/
│   ├── LivesIndicator.ts      # heart icons
│   ├── Leaderboard.ts         # leaderboard rendering + data fetch
│   └── GameOverModal.ts       # final score + Try again
└── lib/
    ├── supabase.ts            # client + auth + score CRUD
    └── rng.ts                 # mulberry32 seedable random
```

## License

MIT
