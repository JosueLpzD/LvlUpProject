"use client";

import { AppShell } from "@/components/layout/AppShell";
import { TimeBlockPlanner } from "@/components/productivity/TimeBlockPlanner";
import { SkillTrack } from "@/components/progression/SkillTrack";
import { LootShop } from "@/components/marketplace/LootShop";
import { FloatingPomodoro } from "@/components/productivity/FloatingPomodoro";
import { WeeklyCalendarView } from "@/components/dashboard/WeeklyCalendarView";
import { ActiveQuestBoard } from "@/components/dashboard/ActiveQuestBoard";

export default function Home() {
  return (
    <AppShell>
      <FloatingPomodoro />

      <div className="flex flex-col gap-6 w-full h-screen px-4 pb-4 overflow-hidden relative" data-component="PageContainer">

        {/* Header Section */}
        <div className="border-b border-zinc-800/50 py-4 shrink-0 border border-zinc-800/30 rounded-xl px-6 bg-black/20 mt-2" data-component="HeaderSection">
          <WeeklyCalendarView />
        </div>

        {/* Content Area */}
        <div className="flex flex-1 gap-6 overflow-hidden min-h-0" data-component="ContentArea">

          {/* Main: Time Planner */}
          <div className="flex-1 border border-zinc-800/50 rounded-2xl relative overflow-hidden flex flex-col shadow-2xl" data-component="MainSection">
            <div className="absolute top-2 right-2 text-[10px] text-zinc-600 font-mono bg-black/50 px-2 rounded pointer-events-none z-50">MAIN SECTION</div>
            <TimeBlockPlanner />
          </div>

          {/* Right Sidebar: Components */}
          <div className="w-96 border border-zinc-800/50 rounded-2xl p-4 flex flex-col gap-6 overflow-y-auto bg-zinc-950/30" data-component="RightSidebar">
            <ActiveQuestBoard />
            <SkillTrack attribute="intellect" label="Inteligencia" />
            <SkillTrack attribute="strength" label="Fuerza" />
            <LootShop />
          </div>

        </div>
      </div>
    </AppShell>
  );
}
