"use client";

import { useState, useEffect } from "react";
import { LiveGame } from "@/types/game";
import { Player } from "@/types/player";
import { subscribeToGame, subscribeToPlayers } from "@/lib/game/gameService";

export function useGame(gameId: string) {
  const [game, setGame] = useState<LiveGame | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;

    setLoading(true);

    const unsubGame = subscribeToGame(gameId, (gameData) => {
      setGame(gameData);
      setLoading(false);
    });

    const unsubPlayers = subscribeToPlayers(gameId, (playerList) => {
      setPlayers(playerList);
    });

    return () => {
      unsubGame();
      unsubPlayers();
    };
  }, [gameId]);

  return { game, players, loading };
}
