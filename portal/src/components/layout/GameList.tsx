"use client";

import { usePathname } from "next/navigation";
import { GAME_REGISTRY } from "@/games";
import { GameListItem } from "./GameListItem";

export function GameList() {
  const pathname = usePathname();
  const activeId = pathname.startsWith("/play/")
    ? pathname.split("/play/")[1]
    : null;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-text-muted text-[10px] uppercase tracking-wider font-medium px-3 py-2">
        Games
      </p>
      {GAME_REGISTRY.map((game) => (
        <GameListItem
          key={game.id}
          game={game}
          isActive={activeId === game.id}
        />
      ))}
    </div>
  );
}
