"use client";

import { UserPanel } from "./UserPanel";
import { GameList } from "./GameList";

export function Sidebar() {
  return (
    <aside className="w-72 h-screen bg-bg-secondary/80 backdrop-blur-xl border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-cyan flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <h1 className="text-text-primary font-semibold text-sm tracking-wide">
              Seri Arcade
            </h1>
            <p className="text-text-muted text-[10px]">Game Portal</p>
          </div>
        </div>
      </div>

      <UserPanel />

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <GameList />
      </nav>

      <div className="px-5 py-3 border-t border-border">
        <p className="text-text-muted text-[10px]">
          v1.0 &middot; Seri Arcade
        </p>
      </div>
    </aside>
  );
}
