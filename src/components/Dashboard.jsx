import React, { useEffect, useState } from 'react';
import { Package, Weight, Plus, LogOut } from 'lucide-react'; // LogOut is for Take icon, maybe Upload/Export better?
import { StatsCard } from './StatsCard';
import { StatusCard } from './StatusCard';
import { ActionCard } from './ActionCard';
import { ActivityList } from './ActivityList';
import { TransactionModal } from './TransactionModal';

export function Dashboard() {
    const [data, setData] = useState({
        stats: { totalStock: 0, totalWeight: 0 },
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null });

    const fetchData = async () => {
        try {
            const res = await fetch('/api/inventory');
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

    const handleAction = (type) => {
        setModalConfig({ isOpen: true, type });
    };

    const handleSuccess = () => {
        fetchData();
        // Maybe show toast?
    };

    const stockStatus = data.stats.totalStock > 10 ? 'Optimal Seviye' : 'Stok Az';
    const isOptimal = data.stats.totalStock > 10;

    if (loading) return <div className="animate-pulse p-4">Loading dashboard...</div>;

    return (
        <div className="space-y-6">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatsCard
                    title="Total Stock"
                    value={data.stats.totalStock}
                    unit="Pkgs"
                    icon={Package} // Using Package icon for stock
                    colorClass="text-slate-900"
                />
                <StatsCard
                    title="Total Weight"
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
                    title="Receive Shipment"
                    icon={Plus}
                    variant="primary"
                    onClick={() => handleAction('IN')}
                />
                <ActionCard
                    title="Take Package"
                    icon={LogOut} // Using LogOut (exit) icon for taking package
                    variant="outline"
                    onClick={() => handleAction('OUT')}
                />
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
                <ActivityList activities={data.recentActivity} />
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
