"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Sparkles, MessageCircle, X, Send } from "lucide-react";
import { subscribeToNaviEvents, getNaviPromptForEvent, NaviEventData } from "@/lib/naviEvents";

// ==================== TIPOS ====================
interface Particle {
    id: number;
    x: number;
    y: number;
    opacity: number;
    scale: number;
}

interface ThoughtMessage {
    id: number;
    text: string;
}

// ==================== COMPONENTE PRINCIPAL ====================
export function NaviFairy() {
    const [isOpen, setIsOpen] = useState(false);
    const controls = useAnimation();

    // Chat State
    const [messages, setMessages] = useState<{ role: 'user' | 'navi', text: string }[]>([
        { role: 'navi', text: "¡Hola! Soy Navi. ✨ ¿Qué planeas lograr hoy?" }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ThoughtBubble State (Mensajes flotantes estilo pensamiento)
    const [thoughtMessage, setThoughtMessage] = useState<ThoughtMessage | null>(null);

    // Particles State (Destellos de luz)
    const [particles, setParticles] = useState<Particle[]>([]);
    const particleIdRef = useRef(0);

    // Posición actual de Navi para rastrear movimiento
    const [naviPosition, setNaviPosition] = useState({ x: 0, y: 0 });
    const lastPositionRef = useRef({ x: 0, y: 0 });

    // ==================== SCROLL TO BOTTOM ====================
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // ==================== CHAT CON NAVI (API) ====================
    const sendMessageToNavi = useCallback(async (userMessage: string, isAutomatic: boolean = false) => {
        if (!isAutomatic) {
            setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        }
        setIsThinking(true);

        try {
            const context = {
                hora: new Date().toLocaleTimeString(),
                pagina: "Dashboard",
                esAutomatico: isAutomatic
            };

            const response = await fetch("http://localhost:8000/navi/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage, context })
            });

            if (!response.ok) throw new Error("Error backend");

            const data = await response.json();

            if (isAutomatic) {
                // Mostrar como "pensamiento" flotante
                showThoughtBubble(data.response);
            } else {
                // Agregar al chat normal
                setMessages(prev => [...prev, { role: 'navi', text: data.response }]);
            }
        } catch (error) {
            const errorMsg = "¡Ups! Algo interfirió con mi magia... 😵‍💫";
            if (isAutomatic) {
                showThoughtBubble(errorMsg);
            } else {
                setMessages(prev => [...prev, { role: 'navi', text: errorMsg }]);
            }
        } finally {
            setIsThinking(false);
        }
    }, []);

    const handleSend = async () => {
        if (!inputValue.trim()) return;
        const userMsg = inputValue;
        setInputValue("");
        await sendMessageToNavi(userMsg, false);
    };

    // ==================== THOUGHT BUBBLE (BURBUJA DE PENSAMIENTO) ====================
    const showThoughtBubble = (text: string) => {
        const newThought: ThoughtMessage = {
            id: Date.now(),
            text
        };
        setThoughtMessage(newThought);

        // Auto-ocultar después de 4 segundos
        setTimeout(() => {
            setThoughtMessage(prev => prev?.id === newThought.id ? null : prev);
        }, 4000);
    };

    // ==================== SISTEMA DE EVENTOS (DISPARADORES) ====================
    useEffect(() => {
        const unsubscribe = subscribeToNaviEvents((event: NaviEventData) => {
            // Generar prompt contextual y enviar a la API
            const prompt = getNaviPromptForEvent(event);
            sendMessageToNavi(prompt, true); // true = mensaje automático (mostrar en ThoughtBubble)
        });

        return unsubscribe;
    }, [sendMessageToNavi]);

    // ==================== PARTÍCULAS DE LUZ (DESTELLOS) ====================
    const createParticle = useCallback((x: number, y: number) => {
        const newParticle: Particle = {
            id: particleIdRef.current++,
            x: x + (Math.random() - 0.5) * 20, // Pequeña variación aleatoria
            y: y + (Math.random() - 0.5) * 20,
            opacity: 1,
            scale: 0.5 + Math.random() * 0.5
        };

        setParticles(prev => [...prev.slice(-15), newParticle]); // Máximo 15 partículas

        // Eliminar partícula después de animación
        setTimeout(() => {
            setParticles(prev => prev.filter(p => p.id !== newParticle.id));
        }, 800);
    }, []);

    // Rastrear movimiento de Navi para crear partículas
    useEffect(() => {
        const distance = Math.hypot(
            naviPosition.x - lastPositionRef.current.x,
            naviPosition.y - lastPositionRef.current.y
        );

        // Solo crear partícula si se movió suficiente
        if (distance > 5) {
            createParticle(
                window.innerWidth - 60 + naviPosition.x,
                window.innerHeight - 60 + naviPosition.y
            );
            lastPositionRef.current = { ...naviPosition };
        }
    }, [naviPosition, createParticle]);

    // ==================== MOVIMIENTO AUTÓNOMO ====================
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const moveRandomly = async () => {
            if (isOpen) return; // Quedarse quieto cuando está chateando

            // Límites de la pantalla (aproximados)
            const maxX = window.innerWidth - 100;
            const maxY = window.innerHeight - 100;
            const minX = 50;
            const minY = 50;

            // Posición aleatoria
            const randomX = Math.random() * (maxX - minX) + minX;
            const randomY = Math.random() * (maxY - minY) + minY;

            // Duración aleatoria para sensación natural
            const duration = Math.random() * 3 + 2;

            const targetX = randomX - window.innerWidth + 100;
            const targetY = randomY - window.innerHeight + 100;

            await controls.start({
                x: targetX,
                y: targetY,
                transition: {
                    duration: duration,
                    ease: "easeInOut",
                    onUpdate: (latest: number) => {
                        // Actualizar posición para crear partículas
                        // Nota: Framer Motion no expone onUpdate directamente así,
                        // usamos intervalo alternativo
                    }
                }
            });

            // Actualizar posición después de la animación
            setNaviPosition({ x: targetX, y: targetY });

            // Esperar antes del próximo movimiento
            timeoutId = setTimeout(moveRandomly, Math.random() * 5000 + 2000);
        };

        // Iniciar patrulla
        moveRandomly();

        return () => clearTimeout(timeoutId);
    }, [controls, isOpen]);

    // Crear partículas periódicamente durante movimiento
    useEffect(() => {
        if (isOpen) return;

        const interval = setInterval(() => {
            // Crear partícula en la posición actual de Navi
            createParticle(
                window.innerWidth - 60 + naviPosition.x,
                window.innerHeight - 60 + naviPosition.y
            );
        }, 150); // Cada 150ms durante movimiento

        return () => clearInterval(interval);
    }, [isOpen, naviPosition, createParticle]);

    // ==================== RENDER ====================
    return (
        <div className="fixed z-[90] bottom-10 right-10 pointer-events-none">

            {/* ✨ PARTÍCULAS DE DESTELLOS */}
            {particles.map(particle => (
                <motion.div
                    key={particle.id}
                    initial={{ opacity: 1, scale: particle.scale }}
                    animate={{ opacity: 0, scale: 0, y: -20 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="fixed pointer-events-none"
                    style={{
                        left: particle.x,
                        top: particle.y,
                        width: 8,
                        height: 8,
                    }}
                >
                    <div className="w-full h-full bg-blue-300 rounded-full shadow-[0_0_10px_3px_rgba(147,197,253,0.8)]" />
                </motion.div>
            ))}

            {/* Área Interactiva */}
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
                        controls.stop(); // Detener movimiento al hacer clic
                    }}
                    onDrag={(event, info) => {
                        // Crear partículas mientras se arrastra
                        createParticle(info.point.x, info.point.y);
                    }}
                    className="w-16 h-16 cursor-pointer relative flex items-center justify-center"
                >
                    {/* 💭 THOUGHT BUBBLE - Ahora DENTRO de Navi para que lo siga */}
                    <AnimatePresence>
                        {thoughtMessage && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                className="absolute pointer-events-none"
                                style={{
                                    bottom: 70,  // Justo encima de Navi
                                    right: -10,  // Ligeramente a la izquierda
                                    zIndex: 1000
                                }}
                            >
                                {/* Burbuja estilo pensamiento */}
                                <div className="relative w-64">
                                    {/* Contenido de la burbuja */}
                                    <div className="bg-gradient-to-br from-blue-500/90 to-indigo-600/90 backdrop-blur-xl px-4 py-3 rounded-2xl rounded-br-sm shadow-2xl border border-blue-400/30">
                                        <p className="text-white text-sm font-medium leading-relaxed break-words">
                                            {thoughtMessage.text}
                                        </p>
                                    </div>

                                    {/* Círculos de pensamiento (estilo comic) */}
                                    <div className="absolute -bottom-2 right-2 w-3 h-3 bg-blue-500/80 rounded-full" />
                                    <div className="absolute -bottom-4 right-0 w-2 h-2 bg-blue-400/60 rounded-full" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Alas (Animación) */}
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 0.2 }}
                        className="absolute w-20 h-10 bg-blue-400/30 blur-md rounded-full -z-10"
                    />

                    {/* Aura de destellos */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute w-12 h-12 bg-blue-300/20 rounded-full blur-lg"
                    />

                    {/* Cuerpo (Orbe brillante) */}
                    <div className="w-8 h-8 bg-blue-200 rounded-full shadow-[0_0_20px_5px_rgba(96,165,250,0.6)] animate-pulse flex items-center justify-center">
                        <Sparkles size={16} className="text-white" />
                    </div>

                    {/* Halo */}
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
                </motion.div>

                {/* 💬 CHAT POPOVER */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: -20 }}
                            exit={{ opacity: 0, scale: 0.8, y: 20 }}
                            className="absolute bottom-20 right-0 w-[90vw] max-w-sm md:w-80 bg-[#1a1c26]/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                            style={{ maxHeight: '70vh' }}
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
