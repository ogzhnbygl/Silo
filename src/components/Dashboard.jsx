import React, { useEffect, useState } from 'react';
import { Package, Weight, Plus, LogOut } from 'lucide-react'; // LogOut is for Take icon, maybe Upload/Export better?
import { StatsCard } from './StatsCard';
import { StatusCard } from './StatusCard';
import { ActionCard } from './ActionCard';
import { ActivityList } from './ActivityList';
import { TransactionModal } from './TransactionModal';
import { ConsumptionChart } from './ConsumptionChart';

export function Dashboard() {
    const [data, setData] = useState({
        stats: { totalStock: 0, totalWeight: 0 },
        recentActivity: [],
        weeklyConsumption: []
    });
    const [loading, setLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null });
    const [showAll, setShowAll] = useState(false);
    const [weekOffset, setWeekOffset] = useState(0);

    const fetchData = async (fetchAll = showAll, offset = weekOffset) => {
        try {
            const params = new URLSearchParams();
            if (fetchAll) params.append('all', 'true');
            if (offset > 0) params.append('weekOffset', offset.toString());

            const url = `/api/inventory?${params.toString()}`;
            const res = await fetch(url);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleToggleShowAll = () => {
        const nextShowAll = !showAll;
        setShowAll(nextShowAll);
        fetchData(nextShowAll, weekOffset);
    };

    const handlePrevWeeks = () => {
        const nextOffset = weekOffset + 1;
        setWeekOffset(nextOffset);
        fetchData(showAll, nextOffset);
    };

    const handleNextWeeks = () => {
        if (weekOffset > 0) {
            const nextOffset = weekOffset - 1;
            setWeekOffset(nextOffset);
            fetchData(showAll, nextOffset);
        }
    };

    const handleAction = (type) => {
        setModalConfig({ isOpen: true, type });
    };

    const handleSuccess = () => {
        setWeekOffset(0);
        fetchData(showAll, 0);
    };

    const stockStatus = data.stats.totalStock > 10 ? 'Optimal Seviye' : 'Stok Az';
    const isOptimal = data.stats.totalStock > 10;

    if (loading) return <div className="animate-pulse p-4">Yükleniyor...</div>;

    return (
        <div className="space-y-6">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatsCard
                    title="Toplam Stok"
                    value={data.stats.totalStock}
                    unit="Paket"
                    icon={Package} // Using Package icon for stock
                    colorClass="text-slate-900"
                />
                <StatsCard
                    title="Toplam Ağırlık"
                    value={data.stats.totalWeight}
                    unit="kg"
                    icon={Weight}
                    colorClass="text-slate-900"
                />
            </div>

            {/* Status Row */}
            <StatusCard status={stockStatus} isOptimal={isOptimal} />

            {/* Action Buttons Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ActionCard
                    title="Teslimat Al"
                    icon={Plus}
                    variant="primary"
                    onClick={() => handleAction('IN')}
                />
                <ActionCard
                    title="Paket Çıkışı"
                    icon={LogOut} // Using LogOut (exit) icon for taking package
                    variant="outline"
                    onClick={() => handleAction('OUT')}
                />
            </div>

            {/* Weekly Consumption Chart */}
            <div className="mt-8">
                <ConsumptionChart 
                    data={data.weeklyConsumption || []} 
                    weekOffset={weekOffset}
                    onPrevWeeks={handlePrevWeeks}
                    onNextWeeks={handleNextWeeks}
                />
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
                <ActivityList 
                    activities={data.recentActivity} 
                    showAll={showAll}
                    onToggleShowAll={handleToggleShowAll}
                />
            </div>

            <TransactionModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                type={modalConfig.type}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
