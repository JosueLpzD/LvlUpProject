"use client";

import { AppShell } from "@/components/layout/AppShell";
import { TimeBlockPlanner } from "@/components/productivity/TimeBlockPlanner";
import { SkillTrack } from "@/components/progression/SkillTrack";
import { LootShop } from "@/components/marketplace/LootShop";
import { FloatingPomodoro } from "@/components/productivity/FloatingPomodoro";

export default function Home() {
  return (
    <AppShell>
      {/* Floating Widget - HIDDEN FOR FOCUS MODE
      <FloatingPomodoro />
      */}

      <div className="flex flex-col gap-6 w-full h-screen px-4 pb-4 overflow-hidden relative">

        {/* Header Section - HIDDEN FOR FOCUS MODE
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-zinc-800/50 py-4 shrink-0 border border-zinc-800/30 rounded-xl px-6 bg-black/20 mt-2">
           ...
        </div>
        */}

        {/* Content Area */}
        <div className="flex flex-1 gap-6 overflow-hidden min-h-0">

          {/* Main: Time Planner */}
          <div className="flex-1 border border-zinc-800/50 rounded-2xl relative overflow-hidden flex flex-col shadow-2xl">
            <div className="absolute top-2 right-2 text-[10px] text-zinc-600 font-mono bg-black/50 px-2 rounded pointer-events-none z-50">MAIN SECTION</div>
            <TimeBlockPlanner />
          </div>

          {/* Right Sidebar: Components - HIDDEN FOR FOCUS MODE
            <div className="w-80 border border-zinc-800/50 rounded-2xl p-4 flex flex-col gap-6 overflow-y-auto bg-zinc-950/30">
                 ...
            </div>
            */}

        </div>
      </div>
    </AppShell>
  );
}
