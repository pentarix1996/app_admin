import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AnimatePresence } from 'framer-motion';
import { RefreshCw, LayoutGrid, Search } from 'lucide-react';
import ProjectCard from './ProjectCard';
import Terminal from './Terminal';
import DashboardStats from './DashboardStats';
import FilterBar from './FilterBar';

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [activeTerminal, setActiveTerminal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchProjects = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const res = await axios.get('http://localhost:8000/api/projects');
            setProjects(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            if (isManual) setTimeout(() => setRefreshing(false), 500);
        }
    };

    useEffect(() => {
        fetchProjects();
        // Poll status every 3 seconds
        const interval = setInterval(() => fetchProjects(false), 3000);
        return () => clearInterval(interval);
    }, []);

    const handleStart = async (id, port) => {
        try {
            await axios.post(`http://localhost:8000/api/projects/${id}/start?port=${port}`);
            fetchProjects();
        } catch (err) {
            const msg = err.response?.data?.detail || err.message;
            alert(`Failed to start: ${msg}`);
        }
    };

    const handleStop = async (id) => {
        try {
            await axios.post(`http://localhost:8000/api/projects/${id}/stop`);
            fetchProjects();
        } catch (err) {
            alert("Failed to stop: " + err.message);
        }
    };

    const typeCounts = projects.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
    }, {});

    const filteredProjects = projects.filter(p => {
        const matchesType = filter === 'ALL' || p.type === filter;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black text-white p-8">
            {/* Navbar */}
            <nav className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="p-3 bg-neonBlue/10 rounded-xl border border-neonBlue/20">
                        <LayoutGrid className="text-neonBlue" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
                            Project Hub
                        </h1>
                        <p className="text-xs text-white/40 font-mono">LOCAL COMMAND CENTER</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative group w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-white/40 group-focus-within:text-neonBlue transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-lg leading-5 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:bg-white/10 focus:border-neonBlue/50 transition-all sm:text-sm"
                        />
                    </div>
                    <button
                        onClick={() => fetchProjects(true)}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors group"
                        title="Refresh"
                    >
                        <RefreshCw size={20} className={`text-white/50 group-hover:text-neonBlue transition-all ${refreshing ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto">
                <DashboardStats projects={projects} />

                <FilterBar
                    activeFilter={filter}
                    onFilterChange={setFilter}
                    typeCounts={typeCounts}
                />

                {loading && projects.length === 0 ? (
                    <div className="text-center py-20 text-white/20 animate-pulse">Scanning Neural Network...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {filteredProjects.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    onStart={handleStart}
                                    onStop={handleStop}
                                    onShowLogs={setActiveTerminal}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {filteredProjects.length === 0 && !loading && (
                    <div className="text-center py-20">
                        <p className="text-white/30 mb-2">No projects found matching criteria.</p>
                        <code className="text-xs text-neonPurple bg-neonPurple/10 px-2 py-1 rounded">Check filters or PROJECT_PATH</code>
                    </div>
                )}
            </main>

            <AnimatePresence>
                {activeTerminal && (
                    <Terminal
                        projectId={activeTerminal}
                        onClose={() => setActiveTerminal(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
