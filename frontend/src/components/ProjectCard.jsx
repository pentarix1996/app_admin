import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, ExternalLink, Terminal as TerminalIcon, Globe, Code, FileText, Settings, Zap, Layers } from 'lucide-react';
import useSound from 'use-sound';

const ProjectCard = ({ project, onStart, onStop, onShowLogs }) => {
    const [localPort, setLocalPort] = useState(project.port || 3000);
    const isOnline = project.status === 'online';

    // Handlers
    const handleStart = () => onStart(project.id, localPort);
    const handleStop = () => onStop(project.id);

    // Icons based on type
    const getIcon = () => {
        switch (project.type) {
            case 'vite': return <Zap className="text-yellow-400" />;
            case 'nextjs': return <Layers className="text-white" />;
            case 'react': return <Globe className="text-neonBlue" />;
            case 'python': return <Code className="text-neonGreen" />;
            default: return <FileText className="text-gray-400" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel p-6 relative overflow-hidden transition-all duration-300 ${isOnline ? 'border-neonGreen/50 shadow-neonGreen/20' : 'hover:border-white/30'}`}
        >
            {/* Background Glow */}
            {isOnline && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-neonGreen/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-lg">
                        {getIcon()}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white/90">{project.name}</h3>
                        <span className="text-xs text-white/50 uppercase tracking-widest">{project.type}</span>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-mono flex items-center gap-1 ${isOnline ? 'bg-neonGreen/20 text-neonGreen shadow-[0_0_10px_rgba(10,255,10,0.3)]' : 'bg-white/10 text-gray-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-neonGreen animate-pulse' : 'bg-gray-500'}`} />
                    {isOnline ? 'RUNNING' : 'OFFLINE'}
                </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
                {/* Port Config (only editable if offline) */}
                {/* Disclaimer for Python */}
                {project.type === 'python' && (
                    <div className="mb-4 p-2 rounded bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-200/80 flex items-start gap-2">
                        <span className="mt-0.5">⚠️</span>
                        <span>
                            Ensure <strong>venv</strong> is in root & <strong>main.py</strong> is entry point.
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                    <Settings size={14} className="text-white/40 ml-1" />
                    <span className="text-xs text-white/40">PORT</span>
                    <input
                        type="number"
                        value={localPort}
                        onChange={(e) => setLocalPort(Number(e.target.value))}
                        disabled={isOnline}
                        className="bg-transparent text-sm w-full outline-none text-right font-mono text-white/80 disabled:opacity-50"
                    />
                </div>

                <div className="flex gap-2">
                    {!isOnline ? (
                        <button
                            onClick={handleStart}
                            className="flex-1 bg-white/10 hover:bg-neonGreen/20 hover:text-neonGreen hover:border-neonGreen/50 border border-transparent text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <Play size={16} /> Start
                        </button>
                    ) : (
                        <button
                            onClick={handleStop}
                            className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-2 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <Square size={16} /> Stop
                        </button>
                    )}

                    {isOnline && (
                        <>
                            <a
                                href={`http://localhost:${project.port}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
                                title="Open App"
                            >
                                <ExternalLink size={18} />
                            </a>
                            <button
                                onClick={() => onShowLogs(project.id)}
                                className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
                                title="View Logs"
                            >
                                <TerminalIcon size={18} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ProjectCard;
