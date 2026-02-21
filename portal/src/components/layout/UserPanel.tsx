"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useGpStore } from "@/store/useGpStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { SettingsModal } from "./SettingsModal";

export function UserPanel() {
  const { balance, isLoaded, initialize } = useGpStore();
  const {
    nickname,
    avatar,
    dailyGp,
    isLoaded: settingsLoaded,
    initialize: initSettings,
  } = useSettingsStore();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    initialize();
    initSettings();
  }, [initialize, initSettings]);

  const percentage = isLoaded ? (balance / dailyGp) * 100 : 0;

  return (
    <div className="px-5 py-4 border-b border-border">
      {/* User info */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full overflow-hidden border border-border flex-shrink-0">
          {settingsLoaded ? (
            <Image
              src={`/images/avatars/${avatar}.png`}
              alt="avatar"
              width={32}
              height={32}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent/30 to-cyan/30 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-light">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-text-primary text-xs font-medium truncate">
            {settingsLoaded ? nickname : "Guest"}
          </p>
          <p className="text-text-muted text-[10px]">Free tier</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="text-text-muted hover:text-text-primary transition-colors p-1 flex-shrink-0"
          title="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>

      {/* GP display */}
      <div className="glass rounded-xl px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-text-secondary text-[10px] uppercase tracking-wider font-medium">
            Game Points
          </span>
          <span className="text-gold text-xs font-semibold glow-gold">
            {isLoaded ? balance : "--"}
            <span className="text-text-muted font-normal"> / {dailyGp}</span>
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

      <SettingsModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
