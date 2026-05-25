import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars. ' +
      'Create a .env file from .env.example.',
  );
}

export const TAP_SCORES_TABLE =
  (import.meta.env.VITE_TAP_SCORES_TABLE as string | undefined) ?? 'usr_nmexs7bytxq2_tap_scores';

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL ?? 'https://invalid.supabase.co',
  SUPABASE_ANON_KEY ?? 'invalid-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export type AuthChangeCallback = (session: Session | null) => void;

export function onAuthChange(cb: AuthChangeCallback): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  const redirectTo = window.location.origin + window.location.pathname;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  });
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export interface TapScoreRow {
  id: string;
  user_id: string;
  score: number;
  played_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  score: number;
  played_at: string;
  display_name: string;
}

function nameFromUserId(id: string): string {
  return id.slice(0, 6) + '…' + id.slice(-4);
}

function nameFromEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const local = email.split('@')[0];
  return local.length > 16 ? local.slice(0, 16) + '…' : local;
}

export async function submitScore(score: number): Promise<{ error: string | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return { error: 'Not signed in' };
  const { error } = await supabase.from(TAP_SCORES_TABLE).insert({
    user_id: userId,
    score,
  });
  return { error: error?.message ?? null };
}

export async function fetchMyTopScores(limit = 5): Promise<{ rows: LeaderboardEntry[]; error: string | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  const email = sessionData.session?.user?.email ?? null;
  if (!userId) return { rows: [], error: 'Not signed in' };
  const { data, error } = await supabase
    .from(TAP_SCORES_TABLE)
    .select('user_id, score, played_at')
    .eq('user_id', userId)
    .order('score', { ascending: false })
    .order('played_at', { ascending: false })
    .limit(limit);
  if (error) return { rows: [], error: error.message };
  const displayName = nameFromEmail(email) ?? 'you';
  return {
    rows: (data ?? []).map((r) => ({ ...r, display_name: displayName })),
    error: null,
  };
}

export async function fetchGlobalTopScores(limit = 10): Promise<{ rows: LeaderboardEntry[]; error: string | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const myUserId = sessionData.session?.user?.id;
  const myEmail = sessionData.session?.user?.email ?? null;
  const { data, error } = await supabase
    .from(TAP_SCORES_TABLE)
    .select('user_id, score, played_at')
    .order('score', { ascending: false })
    .order('played_at', { ascending: false })
    .limit(limit);
  if (error) return { rows: [], error: error.message };
  return {
    rows: (data ?? []).map((r) => ({
      ...r,
      display_name:
        r.user_id === myUserId
          ? nameFromEmail(myEmail) ?? 'you'
          : nameFromUserId(r.user_id),
    })),
    error: null,
  };
}
