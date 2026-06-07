import clientPromise from '../lib/mongodb.js';
import { verifyUser } from './lib/auth.js';
import { z } from 'zod';

const inventoryPostSchema = z.object({
    type: z.enum(['IN', 'OUT']),
    amount: z.number().int().positive('Miktar pozitif bir tam sayı olmalıdır.'),
    weightPerPkg: z.number().positive('Paket ağırlığı pozitif bir sayı olmalıdır.').optional()
});

export default async function handler(req, res) {
    let user;
    try {
        user = await verifyUser(req);
    } catch (error) {
        return res.status(error.status || 401).json({ error: error.message });
    }

    const client = await clientPromise;
    const db = client.db('Silo_db');
    const statsCollection = db.collection('inventory_stats');
    const transactionsCollection = db.collection('transactions');

    if (req.method === 'GET') {
        try {
            // Get singleton stats
            let stats = await statsCollection.findOne({ _id: 'main' });

            if (!stats) {
                // Initialize if not exists
                stats = { _id: 'main', totalStock: 0, totalWeight: 0 };
                await statsCollection.insertOne(stats);
            }

            // Get recent transactions (last 10 by default, or all if all === 'true')
            const { all, weekOffset, report } = req.query;
            const offsetWeeks = parseInt(weekOffset, 10) || 0;
            let query = transactionsCollection.find({}).sort({ date: -1 });
            if (all !== 'true') {
                query = query.limit(10);
            }
            const recentActivity = await query.toArray();

            // Calculate weekly consumption
            const startMonday = new Date();
            const currentDay = startMonday.getDay();
            const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
            const currentMonday = new Date(startMonday);
            currentMonday.setDate(startMonday.getDate() - distanceToMonday);
            currentMonday.setHours(0, 0, 0, 0);

            let firstMonday;
            let numWeeks = 6;
            let shiftedEnd;

            if (report === 'true') {
                const oldestTx = await transactionsCollection.findOne({ type: 'OUT' }, { sort: { date: 1 } });
                if (oldestTx) {
                    const oldestDate = oldestTx.date;
                    const oldestDay = oldestDate.getDay();
                    const oldestDistance = oldestDay === 0 ? 6 : oldestDay - 1;
                    firstMonday = new Date(oldestDate);
                    firstMonday.setDate(oldestDate.getDate() - oldestDistance);
                    firstMonday.setHours(0, 0, 0, 0);
                } else {
                    firstMonday = new Date(currentMonday);
                }
                const diffTime = Math.abs(currentMonday - firstMonday);
                numWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));

                shiftedEnd = new Date(currentMonday);
                shiftedEnd.setDate(currentMonday.getDate() + 6);
                shiftedEnd.setHours(23, 59, 59, 999);
            } else {
                const shiftedMonday = new Date(currentMonday);
                shiftedMonday.setDate(shiftedMonday.getDate() - (offsetWeeks * 7 * 7));

                firstMonday = new Date(shiftedMonday);
                firstMonday.setDate(shiftedMonday.getDate() - (6 * 7));

                shiftedEnd = new Date(shiftedMonday);
                shiftedEnd.setDate(shiftedMonday.getDate() + 6);
                shiftedEnd.setHours(23, 59, 59, 999);
            }

            const consumptionRaw = await transactionsCollection.aggregate([
                {
                    $match: {
                        type: 'OUT',
                        date: { $gte: firstMonday, $lte: shiftedEnd }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        totalWeight: { $sum: "$weight" },
                        totalPackages: { $sum: "$amount" }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]).toArray();

            const weeklyConsumption = [];
            for (let w = numWeeks; w >= 0; w--) {
                const weekStart = new Date(firstMonday);
                weekStart.setDate(firstMonday.getDate() + (numWeeks - w) * 7);
                
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                weekEnd.setHours(23, 59, 59, 999);
                
                // ISO week number calculation
                const tempDate = new Date(weekStart);
                tempDate.setHours(0, 0, 0, 0);
                tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
                const weekYearRef = new Date(tempDate.getFullYear(), 0, 4);
                const weekNum = 1 + Math.round(((tempDate.getTime() - weekYearRef.getTime()) / 86400000 - 3 + (weekYearRef.getDay() + 6) % 7) / 7);

                const weekLabel = `${weekNum}. Hafta`;
                const dateRangeLabel = `${weekStart.getDate()} - ${weekEnd.getDate()} ${weekStart.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}`;

                const days = [];
                let weekWeight = 0;
                let weekPackages = 0;

                for (let d = 0; d < 7; d++) {
                    const dayDate = new Date(weekStart);
                    dayDate.setDate(weekStart.getDate() + d);
                    const dateString = dayDate.toISOString().split('T')[0];
                    const match = consumptionRaw.find(item => item._id === dateString);
                    const dayWeight = match ? match.totalWeight : 0;
                    const dayPackages = match ? match.totalPackages : 0;
                    
                    weekWeight += dayWeight;
                    weekPackages += dayPackages;

                    days.push({
                        date: dateString,
                        dayName: dayDate.toLocaleDateString('tr-TR', { weekday: 'short' }),
                        weight: dayWeight,
                        packages: dayPackages
                    });
                }

                weeklyConsumption.push({
                    weekIndex: numWeeks - w,
                    weekNum,
                    weekLabel,
                    dateRangeLabel,
                    weight: weekWeight,
                    packages: weekPackages,
                    days
                });
            }

            return res.status(200).json({ stats, recentActivity, weeklyConsumption });
        } catch (error) {
            console.error('Inventory GET Error:', error);
            return res.status(500).json({ error: 'Veri alınamadı' });
        }
    } else if (req.method === 'POST') {
        try {
            const bodyResult = inventoryPostSchema.safeParse(req.body);
            if (!bodyResult.success) {
                return res.status(400).json({ error: bodyResult.error.errors[0].message });
            }
            const { type, amount, weightPerPkg } = bodyResult.data;

            const pkgWeight = weightPerPkg || 4; // Default 4kg per package if not specified
            const totalWeightChange = amount * pkgWeight;

            // Transaction Logic
            if (type === 'IN') {
                // Update Stats
                await statsCollection.updateOne(
                    { _id: 'main' },
                    {
                        $inc: { totalStock: amount, totalWeight: totalWeightChange }
                    },
                    { upsert: true }
                );

                // Log Transaction
                await transactionsCollection.insertOne({
                    type: 'IN',
                    amount,
                    weight: totalWeightChange,
                    user: user.name,
                    date: new Date(),
                    details: 'Teslimat Alındı'
                });

            } else if (type === 'OUT') {
                // Update Stats atomically to prevent race conditions (negative stock)
                const result = await statsCollection.updateOne(
                    { _id: 'main', totalStock: { $gte: amount } },
                    {
                        $inc: { totalStock: -amount, totalWeight: -totalWeightChange }
                    }
                );

                if (result.modifiedCount === 0) {
                    return res.status(400).json({ error: 'Yetersiz stok veya envanter güncellenemedi.' });
                }

                // Log Transaction
                await transactionsCollection.insertOne({
                    type: 'OUT',
                    amount,
                    weight: totalWeightChange,
                    user: user.name,
                    date: new Date(),
                    details: 'Paket Çıkışı'
                });
            }

            return res.status(200).json({ success: true });

        } catch (error) {
            console.error('Inventory POST Error:', error);
            return res.status(500).json({ error: 'İşlem başarısız' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
