"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useGpStore } from "@/store/useGpStore";
import { AVATAR_OPTIONS, DIFFICULTY_LABELS, DAILY_GP_OPTIONS } from "@/config/constants";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { nickname, avatar, difficulty, dailyGp, setNickname, setAvatar, setDifficulty, setDailyGp } =
    useSettingsStore();
  const { refreshBalance } = useGpStore();
  const [localNickname, setLocalNickname] = useState(nickname);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalNickname(nickname);
  }, [nickname, open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const commitNickname = () => {
    setNickname(localNickname);
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="glass w-[380px] max-h-[85vh] rounded-2xl border border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <h2 className="text-text-primary text-base font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors p-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 pb-6 flex-1 min-h-0">
          {/* Avatar Selection */}
          <div className="mb-5">
            <label className="text-text-secondary text-[11px] uppercase tracking-wider font-medium mb-2 block">
              Avatar
            </label>
            <div className="max-h-[240px] overflow-y-auto rounded-lg pr-1">
              <div className="grid grid-cols-5 gap-2">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  key={av}
                  onClick={() => setAvatar(av)}
                  className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all ${
                    avatar === av
                      ? "border-accent scale-110 shadow-[0_0_12px_rgba(108,92,231,0.4)]"
                      : "border-border hover:border-text-muted"
                  }`}
                >
                  <Image
                    src={`/images/avatars/${av}.png`}
                    alt={av}
                    width={56}
                    height={56}
                    className="object-cover w-full h-full"
                  />
                  {avatar === av && (
                    <div className="absolute inset-0 flex items-center justify-center bg-accent/30">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
              </div>
            </div>
          </div>

          {/* Nickname */}
          <div className="mb-5">
            <label className="text-text-secondary text-[11px] uppercase tracking-wider font-medium mb-2 block">
              Nickname
            </label>
            <input
              type="text"
              value={localNickname}
              onChange={(e) => setLocalNickname(e.target.value.slice(0, 20))}
              onBlur={commitNickname}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitNickname();
              }}
              maxLength={20}
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-primary text-sm outline-none focus:border-accent transition-colors"
              placeholder="Enter nickname..."
            />
          </div>

          {/* Difficulty */}
          <div className="mb-5">
            <label className="text-text-secondary text-[11px] uppercase tracking-wider font-medium mb-2 block">
              Difficulty
            </label>
            <div className="glass rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-primary text-sm font-medium">
                  {DIFFICULTY_LABELS[difficulty]}
                </span>
                <span className="text-accent text-xs font-semibold">{difficulty}/5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="w-full h-1.5 appearance-none rounded-full bg-bg-primary cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent
                  [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(108,92,231,0.5)]
                  [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
                  [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-0"
              />
              <div className="flex justify-between mt-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <span
                    key={v}
                    className={`text-[9px] ${v === difficulty ? "text-accent" : "text-text-muted"}`}
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Daily GP */}
          <div>
            <label className="text-text-secondary text-[11px] uppercase tracking-wider font-medium mb-2 block">
              Daily Game Points
            </label>
            <div className="flex gap-2 flex-wrap">
              {DAILY_GP_OPTIONS.map((gp) => (
                <button
                  key={gp}
                  onClick={() => {
                    setDailyGp(gp);
                    refreshBalance();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    dailyGp === gp
                      ? "bg-accent text-white shadow-[0_0_10px_rgba(108,92,231,0.4)]"
                      : "bg-bg-primary border border-border text-text-secondary hover:border-text-muted"
                  }`}
                >
                  {gp}
                </button>
              ))}
            </div>
            <p className="text-text-muted text-[9px] mt-1.5">Resets your balance immediately</p>
          </div>
        </div>
      </div>
    </div>
  );
}
