import React from 'react';

export function ActionCard({ title, icon: Icon, onClick, variant = 'primary' }) {
    const baseClasses = "w-full p-8 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm";

    const variants = {
        primary: "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-blue-200",
        outline: "bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600"
    };

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${variants[variant]}`}
        >
            <div className={`p-3 rounded-full ${variant === 'primary' ? 'bg-white/20' : 'bg-slate-50'}`}>
                <Icon size={32} />
            </div>
            <span className="text-lg font-semibold">{title}</span>
        </button>
    );
}
