import React, { useEffect, useState, useCallback } from 'react';
import { Plus, LogOut } from 'lucide-react';
import { PRODUCTS, ACTIVE_PRODUCT_IDS } from '../../lib/products.js';
import { ProductStockCard } from './ProductStockCard';
import { ActionCard } from './ActionCard';
import { ActivityList } from './ActivityList';
import { TransactionModal } from './TransactionModal';
import { ConsumptionChart } from './ConsumptionChart';

const DEFAULT_PRODUCTS = {
    A03: { ...PRODUCTS.A03, totalStock: 0, totalWeight: 0 },
    A04: { ...PRODUCTS.A04, totalStock: 0, totalWeight: 0 }
};

export function Dashboard() {
    const [data, setData] = useState({
        stats: { totalStock: 0, totalWeight: 0, products: DEFAULT_PRODUCTS },
        recentActivity: [],
        weeklyConsumption: []
    });
    const [loading, setLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null });
    const [showAll, setShowAll] = useState(false);
    const [weekOffset, setWeekOffset] = useState(0);

    const fetchData = useCallback(async (fetchAll = false, offset = 0) => {
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
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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

    if (loading) return <div className="animate-pulse p-4">Yükleniyor...</div>;

    const productStats = data.stats?.products || DEFAULT_PRODUCTS;

    return (
        <div className="space-y-6">
            {/* Side-by-Side Product Stock & Status Cards (SAFE A03 & SAFE A04) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ACTIVE_PRODUCT_IDS.map((prodId) => {
                    const merged = {
                        ...PRODUCTS[prodId],
                        ...(productStats[prodId] || {})
                    };
                    return <ProductStockCard key={prodId} product={merged} />;
                })}
            </div>

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
                    icon={LogOut}
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
                productStats={productStats}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
