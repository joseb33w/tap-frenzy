import './style.css';
import { getCurrentSession, onAuthChange } from './lib/supabase';
import { renderAuthScreen } from './screens/AuthScreen';
import { renderHomeScreen } from './screens/HomeScreen';
import { renderGameScreen } from './screens/GameScreen';
import { renderLeaderboardScreen } from './screens/LeaderboardScreen';

type Route = 'auth' | 'home' | 'game' | 'leaderboard';

interface AppState {
  route: Route;
  userId: string | null;
  email: string | null;
  offline: boolean;
}

const root = document.getElementById('app') as HTMLDivElement;

let activeGame: { stop: () => void } | null = null;
const state: AppState = {
  route: 'auth',
  userId: null,
  email: null,
  offline: false,
};

function stopActiveGame() {
  if (activeGame) {
    activeGame.stop();
    activeGame = null;
  }
}

function go(route: Route) {
  stopActiveGame();
  state.route = route;
  render();
}

function render() {
  switch (state.route) {
    case 'auth':
      renderAuthScreen({ root });
      break;
    case 'home':
      renderHomeScreen({
        root,
        email: state.email,
        onPlay: () => go('game'),
        onLeaderboard: () => go('leaderboard'),
        onSignedOut: () => {
          state.userId = null;
          state.email = null;
          state.offline = false;
          go('auth');
        },
      });
      break;
    case 'game':
      activeGame = renderGameScreen({
        root,
        isOffline: state.offline,
        onHome: () => go('home'),
        onLeaderboard: () => go('leaderboard'),
      });
      break;
    case 'leaderboard':
      renderLeaderboardScreen({
        root,
        currentUserId: state.userId,
        onHome: () => go('home'),
        onPlay: () => go('game'),
      });
      break;
  }
}

async function bootstrap() {
  const session = await getCurrentSession();
  if (session?.user) {
    state.userId = session.user.id;
    state.email = session.user.email ?? null;
    state.route = 'home';
  } else {
    state.route = 'auth';
  }
  render();

  onAuthChange((s) => {
    if (s?.user) {
      const wasSignedOut = state.userId === null;
      state.userId = s.user.id;
      state.email = s.user.email ?? null;
      state.offline = false;
      if (wasSignedOut) go('home');
    } else {
      state.userId = null;
      state.email = null;
      if (state.route !== 'auth') go('auth');
    }
  });
}

interface TapFrenzyDevHook {
  enterOfflineMode: () => void;
  go: (route: Route) => void;
  currentRoute: () => Route;
}

declare global {
  interface Window {
    __tapFrenzy?: TapFrenzyDevHook;
  }
}

window.__tapFrenzy = {
  enterOfflineMode: () => {
    state.offline = true;
    state.userId = 'offline-test-user';
    state.email = 'offline@test.local';
    go('home');
  },
  go: (r: Route) => go(r),
  currentRoute: () => state.route,
};

void bootstrap();
