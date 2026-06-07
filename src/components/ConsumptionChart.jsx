import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { downloadConsumptionReport } from '../utils/pdfGenerator.js';

export function ConsumptionChart({ data = [], weekOffset = 0, onPrevWeeks, onNextWeeks }) {
    const [selectedWeekIndex, setSelectedWeekIndex] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);

    // Determine current view mode
    const isDrillDown = selectedWeekIndex !== null;
    
    // Get the data set for the current view
    const currentData = isDrillDown 
        ? data[selectedWeekIndex]?.days || [] 
        : data;

    const selectedWeekLabel = isDrillDown ? data[selectedWeekIndex]?.weekLabel : '';
    const selectedWeekRange = isDrillDown ? data[selectedWeekIndex]?.dateRangeLabel : '';

    // Find max value in current data set for scaling
    const maxWeight = Math.max(...currentData.map(d => d.weight), 10);

    // Reset drill down if data changes (e.g. when changing page)
    React.useEffect(() => {
        setSelectedWeekIndex(null);
    }, [weekOffset]);

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
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                {isDrillDown ? (
                    <button
                        onClick={() => setSelectedWeekIndex(null)}
                        className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800"
                        title="Haftalık Görünüme Dön"
                    >
                        <ArrowLeft size={18} />
                    </button>
                ) : (
                    <button
                        onClick={handleGeneratePDF}
                        disabled={pdfLoading}
                        className={`p-1.5 hover:bg-slate-100 active:bg-slate-200 border border-slate-150 rounded-lg text-slate-500 hover:text-blue-600 transition-colors shadow-sm flex items-center justify-center ${
                            pdfLoading ? 'opacity-50 cursor-wait' : ''
                        }`}
                        title="PDF Raporu Al"
                    >
                        <FileText size={18} />
                    </button>
                )}
                <div>
                    <h3 className="font-semibold text-slate-800">
                        {isDrillDown 
                            ? `${selectedWeekLabel} Günlük Detayı` 
                            : 'Haftalık Yem Tüketimi'
                        }
                    </h3>
                    <p className="text-xs text-slate-500">
                        {isDrillDown 
                            ? `${selectedWeekRange} haftası günlük harcanan miktar` 
                            : weekOffset === 0 
                            ? 'Son 7 haftada harcanan toplam yem miktarı (kg)'
                            : `${weekOffset * 7} hafta öncesine ait 7 haftalık yem miktarı (kg)`
                        }
                    </p>
                </div>
            </div>

            {/* Layout with stable sidebar arrows */}
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Left Arrow (Previous / Older Weeks) */}
                <button
                    onClick={onPrevWeeks}
                    disabled={isDrillDown}
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
                            const heightPercent = (item.weight / maxWeight) * 100;
                            const hasData = item.weight > 0;
                            return (
                                <div 
                                    key={i} 
                                    onClick={() => !isDrillDown && hasData && setSelectedWeekIndex(i)}
                                    className={`flex-1 flex flex-col items-center h-full justify-end group relative ${
                                        !isDrillDown && hasData ? 'cursor-pointer' : ''
                                    }`}
                                >
                                    {/* Hover Tooltip */}
                                    <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-xs py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-md flex flex-col items-center gap-0.5">
                                        <span className="font-semibold">{item.weight} kg</span>
                                        <span className="text-[10px] text-slate-300">{item.packages} Paket</span>
                                        {!isDrillDown && hasData && (
                                            <span className="text-[8px] text-blue-300 mt-0.5">Günlük Detay için Tıkla</span>
                                        )}
                                    </div>

                                    {/* Bar */}
                                    <div 
                                        style={{ height: `${Math.max(heightPercent, 3)}%` }}
                                        className={`w-full max-w-[40px] rounded-t-md transition-all duration-500 ease-out origin-bottom ${
                                            hasData 
                                                ? 'bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-100' 
                                                : 'bg-slate-100'
                                        }`}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* X Axis Labels */}
                    <div className="flex gap-2.5 sm:gap-4 px-2 pt-2">
                        {currentData.map((item, i) => (
                            <div key={i} className="flex-1 text-center">
                                <span className="text-xs font-semibold text-slate-500 block truncate">
                                    {isDrillDown ? item.dayName : item.weekLabel}
                                </span>
                                <span className="text-[9px] text-slate-400 block truncate">
                                    {isDrillDown 
                                        ? `${item.weight} kg` 
                                        : item.dateRangeLabel
                                    }
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Arrow (Next / Newer Weeks) */}
                <button
                    onClick={onNextWeeks}
                    disabled={weekOffset === 0 || isDrillDown}
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
