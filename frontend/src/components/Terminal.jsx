import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal as TerminalIcon } from 'lucide-react';

const Terminal = ({ projectId, onClose }) => {
    const [logs, setLogs] = useState([]);
    const bottomRef = useRef(null);
    const wsRef = useRef(null);

    useEffect(() => {
        if (!projectId) return;

        // Connect WebSocket
        const ws = new WebSocket(`ws://localhost:8000/api/ws/${projectId}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            setLogs((prev) => [...prev, event.data]);
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            setLogs((prev) => [...prev, '>>> Connection Error']);
        };

        return () => {
            if (ws.readyState === 1) ws.close();
        };
    }, [projectId]);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-4xl h-[80vh] bg-[#0c0c0c] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="h-12 border-b border-white/5 bg-white/5 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2 text-white/70">
                        <TerminalIcon size={16} />
                        <span className="font-mono text-sm">Terminal: {projectId}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 font-mono text-sm space-y-1">
                    {logs.length === 0 && <div className="text-white/30 italic">Waiting for logs...</div>}
                    {logs.map((log, i) => (
                        <div key={i} className="break-words text-white/80 border-l-2 border-transparent hover:border-white/10 pl-2">
                            {/* Basic ANSI escape code cleaning if needed, but for now raw string */}
                            {log}
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Terminal;
