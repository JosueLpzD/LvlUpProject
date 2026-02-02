import { ReactNode } from "react";
import { CharacterHUD } from "@/components/dashboard/CharacterHUD";

interface AppShellProps {
    children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500/30" data-component="AppShell">

            {/* Background Ambient Effect */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <CharacterHUD />

                <main className="flex-1 w-full mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 border-x border-zinc-800 bg-black/40 shadow-2xl my-4 rounded-xl" data-component="Layout: Body / Main">
                    {children}
                </main>

                <footer className="p-6 text-center text-zinc-600 text-xs border-t border-zinc-800 bg-black/60 backdrop-blur-sm" data-component="Layout: Footer">
                    <p className="font-mono uppercase tracking-widest opacity-50">Sistema Gamificado v1.0 • {new Date().getFullYear()}</p>
                </footer>
            </div>
        </div>
    );
}
