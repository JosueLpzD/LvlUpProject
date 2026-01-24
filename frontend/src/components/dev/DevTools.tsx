"use client";

import { useState, useEffect } from "react";
import { Bug } from "lucide-react";

export function DevTools() {
    const [isDebug, setIsDebug] = useState(false);

    useEffect(() => {
        if (isDebug) {
            document.body.classList.add("debug-ui");
        } else {
            document.body.classList.remove("debug-ui");
        }
    }, [isDebug]);

    return (
        <button
            onClick={() => setIsDebug(!isDebug)}
            className={`fixed bottom-4 right-4 z-[9999] rounded-full p-3 shadow-lg transition-all ${isDebug ? "bg-red-500 text-white" : "bg-black text-white hover:bg-gray-800"
                }`}
            aria-label="Toggle Debug Mode"
        >
            <Bug size={24} />
        </button>
    );
}
