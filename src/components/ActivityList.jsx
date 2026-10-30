import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { getProductInfo } from '../../lib/products.js';

const PRODUCT_BADGE_STYLES = {
    A03: 'bg-blue-50 text-blue-700 border-blue-200',
    A04: 'bg-violet-50 text-violet-700 border-violet-200',
    OPTIMA: 'bg-slate-100 text-slate-600 border-slate-200'
};

export function ActivityList({ activities = [], showAll = false, onToggleShowAll }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-semibold text-slate-800">Son Hareketler</h3>
                <button
                    type="button"
                    onClick={onToggleShowAll}
                    className="text-sm text-blue-600 font-medium hover:text-blue-700"
                >
                    {showAll ? 'Daha Az Göster' : 'Tümünü Gör'}
                </button>
            </div>

            <div className="divide-y divide-slate-100">
                {activities.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                        <Clock size={32} className="opacity-50" />
                        <p>Henüz işlem yok</p>
                    </div>
                ) : (
                    activities.map((activity, index) => {
                        const prodInfo = getProductInfo(activity.product);
                        const badgeClass = PRODUCT_BADGE_STYLES[prodInfo.id] || PRODUCT_BADGE_STYLES.OPTIMA;
                        const weightKg = activity.weight ?? (activity.amount * prodInfo.weightPerPkg);

                        return (
                            <div
                                key={activity._id || index}
                                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div
                                        className={`p-2 rounded-full shrink-0 ${
                                            activity.type === 'IN'
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-red-100 text-red-600'
                                        }`}
                                    >
                                        {activity.type === 'IN' ? (
                                            <ArrowDownLeft size={20} />
                                        ) : (
                                            <ArrowUpRight size={20} />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-medium text-slate-900">
                                                {activity.details === 'Shipment Received'
                                                    ? 'Teslimat Alındı'
                                                    : activity.details === 'Package Taken'
                                                    ? 'Paket Çıkışı'
                                                    : activity.details ||
                                                      (activity.type === 'IN' ? 'Teslimat Alındı' : 'Paket Çıkışı')}
                                            </span>
                                            <span
                                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeClass}`}
                                            >
                                                {prodInfo.name}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-500 truncate mt-0.5">
                                            {activity.user} tarafından • {new Date(activity.date).toLocaleDateString('tr-TR')}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <div
                                        className={`font-bold ${
                                            activity.type === 'IN' ? 'text-green-600' : 'text-red-600'
                                        }`}
                                    >
                                        {activity.type === 'IN' ? '+' : '-'}
                                        {activity.amount} Paket
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium">
                                        {weightKg} kg
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
