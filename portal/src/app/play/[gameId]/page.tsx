"use client";

import { use } from "react";
import { getGameById } from "@/games";
import { GameCanvas } from "@/components/game/GameCanvas";

export default function PlayPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const gameEntry = getGameById(gameId);

  if (!gameEntry) {
    return (
      <div className="text-center">
        <h2 className="text-danger text-lg font-semibold mb-2">
          Game not found
        </h2>
        <p className="text-text-muted text-sm">
          This game does not exist
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 px-1">
        <h1 className="text-text-primary text-base font-semibold">
          {gameEntry.name}
        </h1>
        <span className="text-text-muted text-xs bg-bg-card px-3 py-1 rounded-full border border-border">
          {gameEntry.controls}
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <GameCanvas gameEntry={gameEntry} />
      </div>
    </div>
  );
}
