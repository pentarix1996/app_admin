import React from 'react';
import { motion } from 'framer-motion';

const FilterBar = ({ activeFilter, onFilterChange, typeCounts }) => {
    // Sort types: ALL first, then alphabetical
    const types = ['ALL', ...Object.keys(typeCounts).sort()];

    return (
        <div className="overflow-x-auto pb-4 mb-4">
            <div className="flex gap-2">
                {types.map(type => {
                    const count = type === 'ALL'
                        ? Object.values(typeCounts).reduce((a, b) => a + b, 0)
                        : typeCounts[type];

                    const isActive = activeFilter === type;

                    return (
                        <button
                            key={type}
                            onClick={() => onFilterChange(type)}
                            className={`
                                relative px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 outline-none
                                ${isActive ? 'text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}
                            `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeFilter"
                                    className="absolute inset-0 bg-white/10 rounded-full border border-white/10 backdrop-blur-md"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                                {type.toUpperCase()}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${isActive ? 'bg-indigo-500/50 text-white' : 'bg-white/5 text-white/30'}`}>
                                    {count}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default FilterBar;
