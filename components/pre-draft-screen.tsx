"use client";

import React from "react";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DraftMode, PlayerSet } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Trophy, Clock, Users, History, DollarSign, Database } from "lucide-react";

interface PreDraftScreenProps {
  onStart: (
    name1: string,
    name2: string,
    playerSet: PlayerSet,
    draftMode: DraftMode,
  ) => Promise<void>;
  savedSnakePlayerCount: number;
  onClearSavedSnakePlayers: () => void;
}

const PLAYER_SET_OPTIONS: {
  value: PlayerSet;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "current",
    label: "Current Stars",
    description: "Today's top NBA players",
    icon: <Users className="h-5 w-5" />,
  },
  {
    value: "historical",
    label: "All-Time Legends",
    description: "The greatest to ever play",
    icon: <History className="h-5 w-5" />,
  },
  {
    value: "all",
    label: "Current + Legends",
    description: "250 players across all eras",
    icon: <Trophy className="h-5 w-5" />,
  },
];

const DRAFT_MODE_OPTIONS: {
  value: DraftMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "normal",
    label: "Normal Draft",
    description: "Classic full player board",
    icon: <Trophy className="h-5 w-5" />,
  },
  {
    value: "snakeSaved",
    label: "Saved Snake",
    description: "Carry drafted players into the next run",
    icon: <Database className="h-5 w-5" />,
  },
  {
    value: "money",
    label: "Money Draft",
    description: "$15 budget, $1-$5 tier pools",
    icon: <DollarSign className="h-5 w-5" />,
  },
];

export function PreDraftScreen({
  onStart,
  savedSnakePlayerCount,
  onClearSavedSnakePlayers,
}: PreDraftScreenProps) {
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [playerSet, setPlayerSet] = useState<PlayerSet>("current");
  const [draftMode, setDraftMode] = useState<DraftMode>("normal");
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await onStart(name1, name2, playerSet, draftMode);
    } catch (error) {
      console.error("Failed to start draft:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <Trophy className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-foreground md:text-5xl">
          HoopDrft
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Head-to-head snake draft. Normal and saved snake are 10 rounds, money mode is 5.
          Choose your player pool, name your squads, and get on the clock.
        </p>
      </div>

      <div className="flex w-full max-w-lg flex-col gap-5">
        {/* Draft mode selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Draft Type
          </label>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
            {DRAFT_MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDraftMode(option.value)}
                className={cn(
                  "flex min-h-32 flex-col items-center justify-center gap-1.5 rounded-lg border px-3 py-3 text-center transition-all",
                  draftMode === option.value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/30 hover:bg-secondary/60",
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                    draftMode === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {option.icon}
                </div>
                <span className="text-xs font-bold">{option.label}</span>
                <span className="text-[11px] leading-tight text-muted-foreground">
                  {option.description}
                </span>
              </button>
            ))}
          </div>
          {draftMode === "snakeSaved" && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
              <span>{savedSnakePlayerCount} saved drafted players will be excluded</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearSavedSnakePlayers}
                className="h-auto px-2 py-1 text-xs font-semibold"
              >
                Clear Saved
              </Button>
            </div>
          )}
        </div>

        {/* Player set selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Player Pool
          </label>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
            {PLAYER_SET_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPlayerSet(option.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-2.5 text-center transition-all",
                  playerSet === option.value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/30 hover:bg-secondary/60",
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                    playerSet === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {option.icon}
                </div>
                <span className="text-xs font-bold">{option.label}</span>
                <span className="text-[11px] leading-tight text-muted-foreground">
                  {option.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Team names */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-bold uppercase tracking-widest text-team-1"
              htmlFor="team1"
            >
              Team 1
            </label>
            <Input
              id="team1"
              placeholder="Enter team name..."
              value={name1}
              onChange={(e) => setName1(e.target.value)}
              className="border-team-1/30 bg-secondary/50 text-foreground placeholder:text-muted-foreground focus-visible:ring-team-1"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-bold uppercase tracking-widest text-team-2"
              htmlFor="team2"
            >
              Team 2
            </label>
            <Input
              id="team2"
              placeholder="Enter team name..."
              value={name2}
              onChange={(e) => setName2(e.target.value)}
              className="border-team-2/30 bg-secondary/50 text-foreground placeholder:text-muted-foreground focus-visible:ring-team-2"
            />
          </div>
        </div>

        {/* Info pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
            <Clock className="h-3 w-3" /> 2 min per pick
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
            <Users className="h-3 w-3" /> Snake draft
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
            <Trophy className="h-3 w-3" /> {draftMode === "money" ? "5 rounds" : "10 rounds"}
          </span>
        </div>

        <Button
          size="default"
          onClick={handleStart}
          disabled={isLoading}
          className="h-10 w-full bg-primary font-display text-base font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
        >
          {isLoading ? "Loading Players..." : "Start Draft"}
        </Button>
      </div>
    </div>
  );
}
