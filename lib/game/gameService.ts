import { db } from "../firebase/client";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Unsubscribe,
} from "firebase/firestore";
import { LiveGame, GameSettings, GameStatus } from "@/types/game";
import { Player } from "@/types/player";
import { generatePin } from "../utils";
import { fisherYatesShuffle } from "../shuffle/fisherYates";

const DEFAULT_SETTINGS: GameSettings = {
  shuffleQuestions: true,
  shuffleOptions: true,
  scoringType: "speed",
  allowAnswerChanges: false,
  leaderboardVisibleToHost: true,
  antiCheatingMode: true,
};

export async function createLiveGame(params: {
  quizId: string;
  quizTitle: string;
  questionIds: string[];
  hostId: string;
  hostName?: string;
  settings?: Partial<GameSettings>;
}): Promise<LiveGame> {
  const gameId = `game_${Date.now()}`;
  const gamePin = generatePin();

  const finalSettings: GameSettings = {
    ...DEFAULT_SETTINGS,
    ...(params.settings || {}),
  };

  // If Anti-Cheating mode is ON, enforce shuffle
  if (finalSettings.antiCheatingMode) {
    finalSettings.shuffleQuestions = true;
    finalSettings.shuffleOptions = true;
  }

  const questionOrder = finalSettings.shuffleQuestions
    ? fisherYatesShuffle(params.questionIds)
    : [...params.questionIds];

  const newGame: LiveGame = {
    id: gameId,
    gamePin,
    quizId: params.quizId,
    quizTitle: params.quizTitle,
    hostId: params.hostId,
    hostName: params.hostName || "Host",
    status: "LOBBY",
    questionOrder,
    currentQuestionIndex: 0,
    currentQuestionId: questionOrder[0] || null,
    questionStartedAt: null,
    questionEndsAt: null,
    isPaused: false,
    pausedRemainingSeconds: null,
    settings: finalSettings,
    isJoiningLocked: false,
    totalPlayersCount: 0,
    activeQuestionAnsweredCount: 0,
    createdAt: Date.now(),
  };

  // 1. Save locally for fast synchronous dev / demo mode
  if (typeof window !== "undefined") {
    localStorage.setItem(`dquiz_game_${gamePin}`, JSON.stringify(newGame));
    localStorage.setItem(`dquiz_game_id_${gameId}`, JSON.stringify(newGame));

    const hostGamesRaw = localStorage.getItem(`dquiz_host_games_${params.hostId}`);
    const hostGames = hostGamesRaw ? JSON.parse(hostGamesRaw) : [];
    localStorage.setItem(
      `dquiz_host_games_${params.hostId}`,
      JSON.stringify([newGame, ...hostGames])
    );
  }

  // 2. Save in Firestore
  try {
    await setDoc(doc(db, "games", gameId), {
      ...newGame,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Firestore createLiveGame fallback to local state:", err);
  }

  return newGame;
}

export async function getGame(gameId: string): Promise<LiveGame | null> {
  try {
    const snap = await getDoc(doc(db, "games", gameId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as LiveGame;
    }
  } catch (err) {
    console.warn("Firestore getGame fallback:", err);
  }

  if (typeof window !== "undefined") {
    const local = localStorage.getItem(`dquiz_game_id_${gameId}`);
    if (local) return JSON.parse(local);
  }
  return null;
}

export function subscribeToGame(
  gameId: string,
  callback: (game: LiveGame | null) => void
): Unsubscribe {
  try {
    const gameDocRef = doc(db, "games", gameId);
    return onSnapshot(
      gameDocRef,
      (snap) => {
        if (snap.exists()) {
          callback({ id: snap.id, ...snap.data() } as LiveGame);
        } else {
          // Check local fallback
          if (typeof window !== "undefined") {
            const local = localStorage.getItem(`dquiz_game_id_${gameId}`);
            callback(local ? JSON.parse(local) : null);
          } else {
            callback(null);
          }
        }
      },
      (err) => {
        console.warn("Firestore onSnapshot error, using local fallback polling:", err);
        if (typeof window !== "undefined") {
          const local = localStorage.getItem(`dquiz_game_id_${gameId}`);
          callback(local ? JSON.parse(local) : null);
        }
      }
    );
  } catch (err) {
    console.warn("Firestore listener setup error, using local state:", err);
    if (typeof window !== "undefined") {
      const local = localStorage.getItem(`dquiz_game_id_${gameId}`);
      callback(local ? JSON.parse(local) : null);
    }
    return () => {};
  }
}

export function subscribeToPlayers(
  gameId: string,
  callback: (players: Player[]) => void
): Unsubscribe {
  try {
    const playersRef = collection(db, "games", gameId, "players");
    return onSnapshot(
      playersRef,
      (snap) => {
        const players = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Player));
        callback(players);
      },
      (err) => {
        console.warn("Firestore subscribeToPlayers notice:", err);
        // Fallback to local storage players
        if (typeof window !== "undefined") {
          const raw = localStorage.getItem(`dquiz_game_players_${gameId}`);
          callback(raw ? JSON.parse(raw) : []);
        }
      }
    );
  } catch (err) {
    console.warn("Players listener setup:", err);
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(`dquiz_game_players_${gameId}`);
      callback(raw ? JSON.parse(raw) : []);
    }
    return () => {};
  }
}

export async function toggleLockJoining(gameId: string, isLocked: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, "games", gameId), {
      isJoiningLocked: isLocked,
    });
  } catch (err) {
    console.warn("toggleLockJoining firestore fallback:", err);
  }

  if (typeof window !== "undefined") {
    const localRaw = localStorage.getItem(`dquiz_game_id_${gameId}`);
    if (localRaw) {
      const game: LiveGame = JSON.parse(localRaw);
      game.isJoiningLocked = isLocked;
      localStorage.setItem(`dquiz_game_id_${gameId}`, JSON.stringify(game));
      localStorage.setItem(`dquiz_game_${game.gamePin}`, JSON.stringify(game));
    }
  }
}

export async function removePlayer(gameId: string, playerId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "games", gameId, "players", playerId));
  } catch (err) {
    console.warn("removePlayer firestore fallback:", err);
  }

  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(`dquiz_game_players_${gameId}`);
    if (raw) {
      const players: Player[] = JSON.parse(raw);
      const updated = players.filter((p) => p.id !== playerId);
      localStorage.setItem(`dquiz_game_players_${gameId}`, JSON.stringify(updated));
    }
  }
}

export async function regenerateQuestionShuffle(
  gameId: string,
  originalQuestionIds: string[]
): Promise<string[]> {
  const shuffled = fisherYatesShuffle(originalQuestionIds);
  try {
    await updateDoc(doc(db, "games", gameId), {
      questionOrder: shuffled,
      currentQuestionId: shuffled[0] || null,
    });
  } catch (err) {
    console.warn("regenerateQuestionShuffle firestore fallback:", err);
  }

  if (typeof window !== "undefined") {
    const localRaw = localStorage.getItem(`dquiz_game_id_${gameId}`);
    if (localRaw) {
      const game: LiveGame = JSON.parse(localRaw);
      game.questionOrder = shuffled;
      game.currentQuestionId = shuffled[0] || null;
      localStorage.setItem(`dquiz_game_id_${gameId}`, JSON.stringify(game));
      localStorage.setItem(`dquiz_game_${game.gamePin}`, JSON.stringify(game));
    }
  }
  return shuffled;
}

export async function updateGameSettings(
  gameId: string,
  settings: Partial<GameSettings>
): Promise<void> {
  try {
    await updateDoc(doc(db, "games", gameId), {
      settings,
    });
  } catch (err) {
    console.warn("updateGameSettings fallback:", err);
  }

  if (typeof window !== "undefined") {
    const localRaw = localStorage.getItem(`dquiz_game_id_${gameId}`);
    if (localRaw) {
      const game: LiveGame = JSON.parse(localRaw);
      game.settings = { ...game.settings, ...settings };
      localStorage.setItem(`dquiz_game_id_${gameId}`, JSON.stringify(game));
      localStorage.setItem(`dquiz_game_${game.gamePin}`, JSON.stringify(game));
    }
  }
}

export async function getGamesByHost(hostId: string): Promise<LiveGame[]> {
  try {
    const gamesRef = collection(db, "games");
    const q = query(gamesRef, where("hostId", "==", hostId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LiveGame));
    }
  } catch (err) {
    console.warn("Firestore getGamesByHost fallback:", err);
  }

  if (typeof window !== "undefined") {
    const hostGamesRaw = localStorage.getItem(`dquiz_host_games_${hostId}`);
    if (hostGamesRaw) return JSON.parse(hostGamesRaw);
  }
  return [];
}
