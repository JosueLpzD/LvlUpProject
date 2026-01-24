"use client";

import { useGameStore } from "@/lib/store/gameStore";
import { DayCard } from "./DayCard";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function WeeklyCalendarView() {
    const { habits } = useGameStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Generate last 5 days + next 2 days (Total 8 days)
    // In a real app, this would be dynamic infinite scroll
    const generateDays = () => {
        const dates = [];
        const today = new Date();
        // Start from 4 days ago
        for (let i = -4; i <= 2; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            dates.push(d);
        }
        return dates;
    };

    const days = generateDays();

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 320; // Approx card width
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    return (
        <div className="w-full relative group" data-component="WeeklyCalendarView">
            {/* Scroll Buttons */}
            <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/80 p-2 rounded-r-xl border border-l-0 border-zinc-700 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronLeft />
            </button>
            <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/80 p-2 rounded-l-xl border border-r-0 border-zinc-700 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight />
            </button>

            {/* Carousel */}
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-8 pt-2 px-1 snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {days.map((date, index) => (
                    <div key={index} className="snap-center shrink-0">
                        <DayCard date={date} habits={habits} />
                    </div>
                ))}
            </div>
        </div>
    );
}
