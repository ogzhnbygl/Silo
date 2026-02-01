import React from 'react';

export function StatsCard({ title, value, unit, icon: Icon, colorClass = 'text-slate-900' }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
            <div>
                <div className="text-slate-500 text-sm font-medium mb-1">{title}</div>
                <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${colorClass}`}>{value}</span>
                    <span className="text-slate-500 text-sm font-medium">{unit}</span>
                </div>
            </div>
            {Icon && (
                <div className="text-slate-400 bg-slate-50 p-2 rounded-lg">
                    <Icon size={20} />
                </div>
            )}
        </div>
    );
}
