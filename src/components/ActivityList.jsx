import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

export function ActivityList({ activities = [] }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-semibold text-slate-800">Son Hareketler</h3>
                <button className="text-sm text-blue-600 font-medium hover:text-blue-700">Tümünü Gör</button>
            </div>

            <div className="divide-y divide-slate-100">
                {activities.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                        <Clock size={32} className="opacity-50" />
                        <p>Henüz işlem yok</p>
                    </div>
                ) : (
                    activities.map((activity, index) => (
                        <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${activity.type === 'IN'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-red-100 text-red-600'
                                    }`}>
                                    {activity.type === 'IN' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                </div>
                                <div>
                                    <div className="font-medium text-slate-900">{activity.details || (activity.type === 'IN' ? 'Teslimat Alındı' : 'Paket Çıkışı')}</div>
                                    <div className="text-sm text-slate-500">
                                        {activity.user} tarafından • {new Date(activity.date).toLocaleDateString("tr-TR")}
                                    </div>
                                </div>
                            </div>
                            <div className={`font-bold ${activity.type === 'IN' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {activity.type === 'IN' ? '+' : '-'}{activity.amount} Pkg
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
