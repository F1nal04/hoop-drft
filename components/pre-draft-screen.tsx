"use client";

import React from "react";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { PlayerSet } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Trophy, Clock, Users, History } from "lucide-react";

interface PreDraftScreenProps {
  onStart: (
    name1: string,
    name2: string,
    playerSet: PlayerSet,
  ) => Promise<void>;
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

export function PreDraftScreen({ onStart }: PreDraftScreenProps) {
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [playerSet, setPlayerSet] = useState<PlayerSet>("current");
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await onStart(name1, name2, playerSet);
    } catch (error) {
      console.error("Failed to start draft:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
          <Trophy className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="font-display text-5xl font-bold uppercase tracking-tight text-foreground md:text-6xl">
          NBA Fantasy Draft
        </h1>
        <p className="max-w-md text-base leading-relaxed text-muted-foreground">
          Head-to-head snake draft. 10 rounds, 2 minutes per pick. Choose your
          player pool, name your squads, and get on the clock.
        </p>
      </div>

      <div className="flex w-full max-w-lg flex-col gap-8">
        {/* Player set selector */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Player Pool
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {PLAYER_SET_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPlayerSet(option.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-center transition-all",
                  playerSet === option.value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/30 hover:bg-secondary/60",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                    playerSet === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {option.icon}
                </div>
                <span className="text-sm font-bold">{option.label}</span>
                <span className="text-[11px] leading-tight text-muted-foreground">
                  {option.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Team names */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
            <Clock className="h-3 w-3" /> 2 min per pick
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
            <Users className="h-3 w-3" /> Snake draft
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
            <Trophy className="h-3 w-3" /> 10 rounds
          </span>
        </div>

        <Button
          size="lg"
          onClick={handleStart}
          disabled={isLoading}
          className="w-full bg-primary font-display text-lg font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
        >
          {isLoading ? "Loading Players..." : "Start Draft"}
        </Button>
      </div>
    </div>
  );
}
