import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { downloadConsumptionReport } from '../utils/pdfGenerator.js';

const FILTER_OPTIONS = [
    { id: 'ALL', label: 'Tümü' },
    { id: 'A03', label: 'SAFE® A03' },
    { id: 'A04', label: 'SAFE® A04' }
];

export function ConsumptionChart({ data = [], weekOffset = 0, onPrevWeeks, onNextWeeks }) {
    const [selectedWeekIndex, setSelectedWeekIndex] = useState(null);
    const [productFilter, setProductFilter] = useState('ALL');
    const [pdfLoading, setPdfLoading] = useState(false);

    const isDrillDown = selectedWeekIndex !== null;

    const currentData = isDrillDown
        ? data[selectedWeekIndex]?.days || []
        : data;

    const selectedWeekLabel = isDrillDown ? data[selectedWeekIndex]?.weekLabel : '';
    const selectedWeekRange = isDrillDown ? data[selectedWeekIndex]?.dateRangeLabel : '';

    useEffect(() => {
        setSelectedWeekIndex(null);
    }, [weekOffset]);

    const getMetrics = (item) => {
        const a03 = item.byProduct?.A03 || { weight: 0, packages: 0 };
        const a04 = item.byProduct?.A04 || { weight: 0, packages: 0 };
        const optima = item.byProduct?.OPTIMA || { weight: 0, packages: 0 };

        if (productFilter === 'A03') {
            return { weight: a03.weight, packages: a03.packages, a03, a04, optima };
        }
        if (productFilter === 'A04') {
            return { weight: a04.weight, packages: a04.packages, a03, a04, optima };
        }
        return {
            weight: item.weight || 0,
            packages: item.packages || 0,
            a03,
            a04,
            optima
        };
    };

    const maxWeight = Math.max(...currentData.map(d => getMetrics(d).weight), 10);
    const hasAnyOptima = currentData.some(d => (d.byProduct?.OPTIMA?.weight || 0) > 0);

    const handleGeneratePDF = async () => {
        try {
            setPdfLoading(true);
            const res = await fetch('/api/inventory?report=true');
            if (!res.ok) throw new Error('Rapor verisi alınamadı.');
            const resData = await res.json();

            await downloadConsumptionReport(resData);
        } catch (err) {
            console.error(err);
            alert('Rapor oluşturulurken bir hata oluştu.');
        } finally {
            setPdfLoading(false);
        }
    };

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 transition-all duration-300">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    {isDrillDown ? (
                        <button
                            type="button"
                            onClick={() => setSelectedWeekIndex(null)}
                            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800"
                            title="Haftalık Görünüme Dön"
                            aria-label="Haftalık Görünüme Dön"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleGeneratePDF}
                            disabled={pdfLoading}
                            className={`p-1.5 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 transition-colors shadow-sm flex items-center justify-center ${
                                pdfLoading ? 'opacity-50 cursor-wait' : ''
                            }`}
                            title="PDF Raporu Al"
                            aria-label="PDF Raporu Al"
                        >
                            <FileText size={18} />
                        </button>
                    )}
                    <div>
                        <h3 className="font-semibold text-slate-800">
                            {isDrillDown
                                ? `${selectedWeekLabel} Günlük Detayı`
                                : 'Haftalık Yem Tüketimi'}
                        </h3>
                        <p className="text-xs text-slate-500">
                            {isDrillDown
                                ? `${selectedWeekRange} haftası günlük harcanan miktar`
                                : weekOffset === 0
                                ? 'Son 7 haftada harcanan toplam yem miktarı (kg)'
                                : `${weekOffset * 7} hafta öncesine ait 7 haftalık yem miktarı (kg)`}
                        </p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                    <div
                        role="group"
                        aria-label="Yem türüne göre filtrele"
                        className="inline-flex bg-slate-100 p-1 rounded-lg"
                    >
                        {FILTER_OPTIONS.map((opt) => {
                            const active = productFilter === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setProductFilter(opt.id)}
                                    aria-pressed={active}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                                        active
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Color Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mb-3 px-1">
                {(productFilter === 'ALL' || productFilter === 'A03') && (
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
                        <span className="font-medium">SAFE® A03 (10 kg)</span>
                    </div>
                )}
                {(productFilter === 'ALL' || productFilter === 'A04') && (
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-violet-600 inline-block" />
                        <span className="font-medium">SAFE® A04 (10 kg)</span>
                    </div>
                )}
                {productFilter === 'ALL' && hasAnyOptima && (
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block" />
                        <span className="font-medium">Optima (Eski • 4 kg)</span>
                    </div>
                )}
            </div>

            {/* Layout with stable sidebar arrows */}
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Left Arrow (Previous / Older Weeks) */}
                <button
                    type="button"
                    onClick={onPrevWeeks}
                    disabled={isDrillDown}
                    aria-label="Önceki 7 Hafta"
                    className={`p-2 hover:bg-slate-50 active:bg-slate-100 border border-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all duration-300 shadow-sm self-center h-10 flex items-center justify-center ${
                        isDrillDown ? 'opacity-0 pointer-events-none select-none' : ''
                    }`}
                    title="Önceki 7 Hafta"
                >
                    <ChevronLeft size={20} />
                </button>

                {/* Main Graph Area */}
                <div className="flex-1 min-w-0">
                    {/* Chart Container */}
                    <div className="h-44 flex items-end gap-2.5 sm:gap-4 pt-8 pb-2 px-2 border-b border-slate-100">
                        {currentData.map((item, i) => {
                            const metrics = getMetrics(item);
                            const heightPercent = (metrics.weight / maxWeight) * 100;
                            const hasData = metrics.weight > 0;
                            const canDrillDown = !isDrillDown && hasData;

                            return (
                                <div
                                    key={i}
                                    onClick={() => canDrillDown && setSelectedWeekIndex(i)}
                                    onKeyDown={(e) => {
                                        if (canDrillDown && (e.key === 'Enter' || e.key === ' ')) {
                                            e.preventDefault();
                                            setSelectedWeekIndex(i);
                                        }
                                    }}
                                    role={canDrillDown ? 'button' : undefined}
                                    tabIndex={canDrillDown ? 0 : undefined}
                                    aria-label={canDrillDown ? `${item.weekLabel} (${item.dateRangeLabel}) günlük detayını aç: ${metrics.weight} kg` : undefined}
                                    className={`flex-1 flex flex-col items-center h-full justify-end group relative ${
                                        canDrillDown ? 'cursor-pointer focus:outline-none' : ''
                                    }`}
                                >
                                    {/* Hover Tooltip */}
                                    <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-md flex flex-col items-start gap-0.5">
                                        <div className="w-full flex items-baseline justify-between gap-3 border-b border-slate-700 pb-1 mb-0.5">
                                            <span className="font-semibold">{metrics.weight} kg</span>
                                            <span className="text-[10px] text-slate-300">{metrics.packages} Paket</span>
                                        </div>

                                        {productFilter === 'ALL' && hasData && (
                                            <div className="space-y-0.5 text-[10px]">
                                                {metrics.a03.weight > 0 && (
                                                    <div className="flex items-center gap-1.5 text-blue-200">
                                                        <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                                                        <span>A03: {metrics.a03.weight} kg ({metrics.a03.packages} Pkt)</span>
                                                    </div>
                                                )}
                                                {metrics.a04.weight > 0 && (
                                                    <div className="flex items-center gap-1.5 text-violet-200">
                                                        <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
                                                        <span>A04: {metrics.a04.weight} kg ({metrics.a04.packages} Pkt)</span>
                                                    </div>
                                                )}
                                                {metrics.optima.weight > 0 && (
                                                    <div className="flex items-center gap-1.5 text-slate-300">
                                                        <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                                                        <span>Optima: {metrics.optima.weight} kg ({metrics.optima.packages} Pkt)</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {canDrillDown && (
                                            <span className="text-[9px] text-blue-300 mt-1 self-center">
                                                Günlük Detay için Tıkla
                                            </span>
                                        )}
                                    </div>

                                    {/* Stacked / Filtered Bar */}
                                    {hasData ? (
                                        productFilter === 'ALL' ? (
                                            <div
                                                style={{ height: `${Math.max(heightPercent, 6)}%` }}
                                                className="w-full max-w-[40px] rounded-t-md overflow-hidden flex flex-col-reverse transition-all duration-500 ease-out shadow-sm group-focus-visible:ring-2 group-focus-visible:ring-blue-500"
                                            >
                                                {metrics.a03.weight > 0 && (
                                                    <div
                                                        style={{ height: `${(metrics.a03.weight / metrics.weight) * 100}%` }}
                                                        className="w-full bg-blue-600 group-hover:bg-blue-700 transition-colors"
                                                    />
                                                )}
                                                {metrics.a04.weight > 0 && (
                                                    <div
                                                        style={{ height: `${(metrics.a04.weight / metrics.weight) * 100}%` }}
                                                        className="w-full bg-violet-600 group-hover:bg-violet-700 transition-colors"
                                                    />
                                                )}
                                                {metrics.optima.weight > 0 && (
                                                    <div
                                                        style={{ height: `${(metrics.optima.weight / metrics.weight) * 100}%` }}
                                                        className="w-full bg-slate-400 group-hover:bg-slate-500 transition-colors"
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <div
                                                style={{ height: `${Math.max(heightPercent, 6)}%` }}
                                                className={`w-full max-w-[40px] rounded-t-md transition-all duration-500 ease-out shadow-sm group-focus-visible:ring-2 group-focus-visible:ring-blue-500 ${
                                                    productFilter === 'A03'
                                                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                                                        : 'bg-violet-600 hover:bg-violet-700 shadow-violet-100'
                                                }`}
                                            />
                                        )
                                    ) : (
                                        <div
                                            style={{ height: '3%' }}
                                            className="w-full max-w-[40px] rounded-t-md bg-slate-100"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* X Axis Labels */}
                    <div className="flex gap-2.5 sm:gap-4 px-2 pt-2">
                        {currentData.map((item, i) => {
                            const metrics = getMetrics(item);
                            return (
                                <div key={i} className="flex-1 text-center min-w-0">
                                    <span className="text-xs font-semibold text-slate-500 block truncate">
                                        {isDrillDown ? item.dayName : item.weekLabel}
                                    </span>
                                    <span className="text-[9px] text-slate-400 block truncate">
                                        {isDrillDown ? `${metrics.weight} kg` : item.dateRangeLabel}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Arrow (Next / Newer Weeks) */}
                <button
                    type="button"
                    onClick={onNextWeeks}
                    disabled={weekOffset === 0 || isDrillDown}
                    aria-label="Sonraki 7 Hafta"
                    className={`p-2 border border-slate-100 rounded-lg text-slate-400 transition-all duration-300 shadow-sm self-center h-10 flex items-center justify-center ${
                        isDrillDown
                            ? 'opacity-0 pointer-events-none select-none'
                            : weekOffset === 0
                            ? 'opacity-40 cursor-not-allowed bg-slate-50'
                            : 'hover:bg-slate-50 active:bg-slate-100 hover:text-slate-700'
                    }`}
                    title="Sonraki 7 Hafta"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}
