"use client";

import { useEffect } from "react";
import { useGpStore } from "@/store/useGpStore";

export function UserPanel() {
  const { balance, dailyAmount, isLoaded, initialize } = useGpStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const percentage = isLoaded ? (balance / dailyAmount) * 100 : 0;

  return (
    <div className="px-5 py-4 border-b border-border">
      {/* User info */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/30 to-cyan/30 border border-border flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-light">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div>
          <p className="text-text-primary text-xs font-medium">Guest</p>
          <p className="text-text-muted text-[10px]">Free tier</p>
        </div>
      </div>

      {/* GP display */}
      <div className="glass rounded-xl px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-text-secondary text-[10px] uppercase tracking-wider font-medium">
            Game Points
          </span>
          <span className="text-gold text-xs font-semibold glow-gold">
            {isLoaded ? balance : "--"}
            <span className="text-text-muted font-normal"> / {dailyAmount}</span>
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-text-muted text-[9px] mt-1.5">Resets daily</p>
      </div>
    </div>
  );
}
