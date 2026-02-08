"use client";

import Link from "next/link";
import type { GameRegistryEntry } from "@/games";

interface Props {
  game: GameRegistryEntry;
  isActive: boolean;
}

export function GameListItem({ game, isActive }: Props) {
  return (
    <Link
      href={`/play/${game.id}`}
      className={`group flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ${
        isActive
          ? "glass border-border-active bg-accent/5"
          : "hover:bg-bg-card border border-transparent hover:border-border"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold transition-colors ${
            isActive
              ? "bg-accent/20 text-accent-light"
              : "bg-bg-card text-text-secondary group-hover:bg-accent/10 group-hover:text-accent-light"
          }`}
        >
          {game.name.charAt(0)}
        </div>
        <div className="flex flex-col">
          <span
            className={`text-xs font-medium ${
              isActive ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary"
            }`}
          >
            {game.name}
          </span>
          <span className="text-[10px] text-text-muted">{game.description}</span>
        </div>
      </div>
      <span
        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
          isActive
            ? "bg-gold-dim text-gold"
            : "bg-bg-card text-text-muted group-hover:bg-gold-dim group-hover:text-gold"
        }`}
      >
        {game.gpCost}
      </span>
    </Link>
  );
}
