import React from 'react';
import { Package, Weight, CheckCircle, AlertTriangle } from 'lucide-react';

const THEME_STYLES = {
    A03: {
        badgeBg: 'bg-blue-600 text-white',
        tagBg: 'bg-blue-50 text-blue-700 border-blue-100',
        topBar: 'bg-blue-600'
    },
    A04: {
        badgeBg: 'bg-violet-600 text-white',
        tagBg: 'bg-violet-50 text-violet-700 border-violet-100',
        topBar: 'bg-violet-600'
    }
};

export function ProductStockCard({ product }) {
    const {
        id,
        name,
        subtitle,
        weightPerPkg = 10,
        lowStockThreshold = 10,
        totalStock = 0,
        totalWeight = 0
    } = product;

    const theme = THEME_STYLES[id] || THEME_STYLES.A03;
    const isOptimal = totalStock > lowStockThreshold;
    const statusLabel = isOptimal ? 'Optimal Seviye' : 'Stok Az';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className={`h-1.5 w-full ${theme.topBar}`} />

            <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                {/* Product Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-wide ${theme.badgeBg}`}>
                            {id}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 leading-tight">{name}</h2>
                            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
                        </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${theme.tagBg}`}>
                        {weightPerPkg} kg / Paket
                    </span>
                </div>

                {/* Stock & Weight Metrics */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                            <span>Mevcut Stok</span>
                            <Package size={15} className="text-slate-400" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-bold text-slate-900">{totalStock}</span>
                            <span className="text-slate-500 text-xs font-medium">Paket</span>
                        </div>
                    </div>

                    <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                            <span>Toplam Ağırlık</span>
                            <Weight size={15} className="text-slate-400" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-bold text-slate-900">{totalWeight}</span>
                            <span className="text-slate-500 text-xs font-medium">kg</span>
                        </div>
                    </div>
                </div>

                {/* Per-Product Stock Status Banner */}
                <div
                    className={`px-4 py-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isOptimal
                            ? 'bg-green-50 border-green-100'
                            : 'bg-amber-50 border-amber-200'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className={`p-1.5 rounded-full ${
                                isOptimal
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-amber-100 text-amber-600'
                            }`}
                        >
                            {isOptimal ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                        </div>
                        <div>
                            <div
                                className={`text-xs font-medium ${
                                    isOptimal ? 'text-green-800' : 'text-amber-800'
                                }`}
                            >
                                Stok Durumu
                            </div>
                            <div
                                className={`text-sm font-bold ${
                                    isOptimal ? 'text-green-900' : 'text-amber-900'
                                }`}
                            >
                                {statusLabel}
                            </div>
                        </div>
                    </div>
                    <span
                        className={`text-xs font-medium ${
                            isOptimal ? 'text-green-700' : 'text-amber-700'
                        }`}
                    >
                        {isOptimal
                            ? `> ${lowStockThreshold} Paket`
                            : `≤ ${lowStockThreshold} Paket (${lowStockThreshold * weightPerPkg} kg)`}
                    </span>
                </div>
            </div>
        </div>
    );
}

