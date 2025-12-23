import React from 'react';
import { Activity, Layers, Code, Zap } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, colorClass }) => (
    <div className={`p-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm relative overflow-hidden group`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
        <div className="flex items-center gap-4 relative z-10">
            <div className={`p-3 rounded-xl bg-white/5 text-white/80 group-hover:text-white transition-colors`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm text-white/40 font-medium whitespace-nowrap">{label}</p>
                <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
            </div>
        </div>
    </div>
);

const DashboardStats = ({ projects }) => {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'online').length;

    // Most common type
    const types = projects.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
    }, {});

    const sortedTypes = Object.entries(types).sort((a, b) => b[1] - a[1]);
    const topType = sortedTypes.length > 0 ? sortedTypes[0] : ['-', 0];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
                icon={Layers}
                label="Total Applications"
                value={total}
                colorClass="from-blue-500 to-cyan-500"
            />
            <StatCard
                icon={Activity}
                label="Online Systems"
                value={active}
                colorClass="from-emerald-500 to-green-500"
            />
            <StatCard
                icon={Code}
                label="Dominant Stack"
                value={topType[0].toUpperCase()}
                colorClass="from-purple-500 to-pink-500"
            />
            <StatCard
                icon={Zap}
                label="System Load"
                value={`${total > 0 ? Math.round((active / total) * 100) : 0}%`}
                colorClass="from-amber-500 to-orange-500"
            />
        </div>
    );
};

export default DashboardStats;
