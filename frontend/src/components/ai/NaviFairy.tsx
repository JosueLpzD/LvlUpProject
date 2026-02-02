"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation, useMotionValue } from "framer-motion";
import { Sparkles, MessageCircle, X, Send } from "lucide-react";

export function NaviFairy() {
    const [isOpen, setIsOpen] = useState(false);
    const controls = useAnimation();
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const [messages, setMessages] = useState<{ role: 'user' | 'navi', text: string }[]>([
        { role: 'navi', text: "¡Hola! Soy Navi. ✨ ¿Qué planeas lograr hoy?" }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg = inputValue;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInputValue("");
        setIsThinking(true);

        try {
            // Contexto básico (se podría mejorar pasando props reales)
            const context = {
                hora: new Date().toLocaleTimeString(),
                pagina: "Dashboard"
            };

            const response = await fetch("http://localhost:8000/navi/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMsg, context })
            });

            if (!response.ok) throw new Error("Error backend");

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'navi', text: data.response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'navi', text: "¡Ups! Algo interfirió con mi magia... 😵‍💫" }]);
        } finally {
            setIsThinking(false);
        }
    };

    // --- AUTONOMOUS BEHAVIOR ---
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const moveRandomly = async () => {
            if (isOpen) return; // Stay still when chatting

            // Screen boundaries (approximate)
            const maxX = window.innerWidth - 100;
            const maxY = window.innerHeight - 100;
            const minX = 50;
            const minY = 50;

            // Random position
            const randomX = Math.random() * (maxX - minX) + minX;
            const randomY = Math.random() * (maxY - minY) + minY;

            // Random duration for natural feel
            const duration = Math.random() * 3 + 2;

            await controls.start({
                x: randomX - window.innerWidth + 100, // Adjust logic for fixed bottom-right origin or just use absolute
                y: randomY - window.innerHeight + 100,
                transition: {
                    duration: duration,
                    ease: "easeInOut"
                }
            });

            // Wait a bit before next move
            timeoutId = setTimeout(moveRandomly, Math.random() * 5000 + 2000);
        };

        // Escaping mechanisms
        const handleMouseMove = (e: MouseEvent) => {
            // Basic avoidance - if mouse gets too close (within 100px), jump away
            // Note: Implementation requires tracking current position carefully. 
            // For simplicity, we'll stick to random roaming for now, 
            // as true avoidance conflicts with the drag logic and is complex to robustly implement 
            // without knowing exact current screen coords compared to mouse.
        };

        // Start patrol
        moveRandomly();

        return () => clearTimeout(timeoutId);
    }, [controls, isOpen]);


    return (
        <div className="fixed z-[999] bottom-10 right-10 pointer-events-none">
            {/* Area Interactiva (Para arrastrar - Futura implementación, por ahora fijo bottom-right pero interactivo) */}
            <div className="pointer-events-auto relative">

                {/* 🧚 CORPUS NAVI (La Hada) */}
                <motion.div
                    drag
                    animate={controls}
                    dragConstraints={false}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        setIsOpen(!isOpen);
                        controls.stop(); // Stop moving when clicked
                    }}
                    className="w-16 h-16 cursor-pointer relative flex items-center justify-center"
                >
                    {/* Alas (Animación CSS o Framer) */}
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 0.2 }}
                        className="absolute w-20 h-10 bg-blue-400/30 blur-md rounded-full -z-10"
                    />

                    {/* Cuerpo (Orbe brillante) */}
                    <div className="w-8 h-8 bg-blue-200 rounded-full shadow-[0_0_20px_5px_rgba(96,165,250,0.6)] animate-pulse flex items-center justify-center">
                        <Sparkles size={16} className="text-white" />
                    </div>

                    {/* Halo */}
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
                </motion.div>

                {/* 💭 CHAT POPOVER */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: -20 }}
                            exit={{ opacity: 0, scale: 0.8, y: 20 }}
                            className="absolute bottom-20 right-0 w-80 bg-[#1a1c26]/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                            style={{ height: '400px' }}
                        >
                            {/* Header */}
                            <div className="p-3 bg-blue-500/10 border-b border-blue-500/20 flex justify-between items-center">
                                <span className="font-bold text-blue-300 flex items-center gap-2">
                                    <Sparkles size={14} /> Navi
                                </span>
                                <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white" title="Cerrar chat">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-zinc-800 text-zinc-200 self-end rounded-tr-none'
                                        : 'bg-blue-600/20 text-blue-100 border border-blue-500/30 self-start rounded-tl-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                ))}
                                {isThinking && (
                                    <div className="self-start text-xs text-blue-400 animate-pulse pl-2">
                                        Navi está pensando... ✨
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-3 border-t border-zinc-800 bg-zinc-900/50">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Escribe algo..."
                                        className="flex-1 bg-zinc-800 border-none rounded-full px-4 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!inputValue.trim()}
                                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Enviar mensaje"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
