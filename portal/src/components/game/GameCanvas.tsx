"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { BaseGame } from "@/engine/BaseGame";
import type { GameStatus } from "@/engine/types";
import type { GameRegistryEntry } from "@/games";
import { useGpStore } from "@/store/useGpStore";
import { GameOverlay } from "./GameOverlay";

interface Props {
  gameEntry: GameRegistryEntry;
}

export function GameCanvas({ gameEntry }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<BaseGame | null>(null);
  const { deductGp, canAfford } = useGpStore();
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");
  const [score, setScore] = useState(0);
  const [insufficientGp, setInsufficientGp] = useState(false);

  // Responsive scaling
  useEffect(() => {
    const resize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const container = containerRef.current;
      const { width, height } = gameEntry.config;
      const scaleX = (container.clientWidth - 32) / width;
      const scaleY = (container.clientHeight - 32) / height;
      const scale = Math.min(scaleX, scaleY, 1);
      canvasRef.current.style.width = `${width * scale}px`;
      canvasRef.current.style.height = `${height * scale}px`;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [gameEntry]);

  // Cleanup on unmount or game change
  useEffect(() => {
    return () => {
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, [gameEntry.id]);

  const handleStart = useCallback(async () => {
    if (!canAfford(gameEntry.gpCost)) {
      setInsufficientGp(true);
      return;
    }
    setInsufficientGp(false);

    gameRef.current?.destroy();

    deductGp(gameEntry.gpCost);

    const game = await gameEntry.create(canvasRef.current!, {
      onScoreChange: setScore,
      onStatusChange: setGameStatus,
      onGameOver: () => {},
    });
    gameRef.current = game;
    game.start();
  }, [gameEntry, canAfford, deductGp]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center"
    >
      <div className="relative border-glow rounded-2xl">
        <canvas
          ref={canvasRef}
          className="rounded-2xl bg-black"
          width={gameEntry.config.width}
          height={gameEntry.config.height}
        />
        {gameStatus === "idle" && (
          <GameOverlay
            type="start"
            gameName={gameEntry.name}
            gpCost={gameEntry.gpCost}
            insufficientGp={insufficientGp}
            onAction={handleStart}
          />
        )}
        {gameStatus === "game_over" && (
          <GameOverlay
            type="gameover"
            score={score}
            gpCost={gameEntry.gpCost}
            insufficientGp={!canAfford(gameEntry.gpCost)}
            onAction={handleStart}
          />
        )}
      </div>
    </div>
  );
}
