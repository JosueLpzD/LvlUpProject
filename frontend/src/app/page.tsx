"use client";

import { AppShell } from "@/components/layout/AppShell";
import { TimeBlockPlanner } from "@/components/productivity/TimeBlockPlanner";
import { SkillTrack } from "@/components/progression/SkillTrack";
import { LootShop } from "@/components/marketplace/LootShop";
import { FloatingPomodoro } from "@/components/productivity/FloatingPomodoro";
import { WeeklyCalendarView } from "@/components/dashboard/WeeklyCalendarView";
import { ActiveQuestBoard } from "@/components/dashboard/ActiveQuestBoard";
import { NaviFairy } from "@/components/ai/NaviFairy";

export default function Home() {
  return (
    <AppShell>
      <FloatingPomodoro />
      <NaviFairy />

      {/* Main Scrollable Container */}
      <div className="w-full h-full overflow-y-auto custom-scrollbar p-6 flex flex-col gap-10" data-component="PageContainer">

        {/* 1. TimeBlock Planner (Priority #1) */}
        <section className="w-full flex flex-col gap-4" data-component="TimeBlockSection">
          <h2 className="text-xl font-bold text-zinc-400 uppercase tracking-widest pl-2 border-l-4 border-amber-500">Planificador del Día</h2>
          <div className="border border-zinc-800/50 rounded-3xl overflow-hidden shadow-2xl bg-[#13151b]/50 relative">
            <TimeBlockPlanner />
          </div>
        </section>

        {/* 2. Weekly Calendar (Priority #2) */}
        <section className="w-full shrink-0" data-component="CalendarSection">
          <h2 className="text-xl font-bold text-zinc-400 uppercase tracking-widest pl-2 border-l-4 border-teal-500 mb-4">Calendario Semanal</h2>
          <div className="bg-black/20 border border-zinc-800/50 rounded-2xl p-4">
            <WeeklyCalendarView />
          </div>
        </section>

        {/* 3. Other Components (Priority #3) */}
        <section className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12" data-component="WidgetsSection">
          {/* Column 1: Quests */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Misiones</h3>
            <ActiveQuestBoard />
          </div>

          {/* Column 2: Skills */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Progreso</h3>
            <SkillTrack attribute="intellect" label="Inteligencia" />
            <SkillTrack attribute="strength" label="Fuerza" />
          </div>

          {/* Column 3: Shop */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Tienda</h3>
            <LootShop />
          </div>
        </section>

      </div>
    </AppShell>
  );
}
