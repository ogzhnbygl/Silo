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

            // Get recent transactions (last 10)
            const recentActivity = await transactionsCollection
                .find({})
                .sort({ date: -1 })
                .limit(10)
                .toArray();

            return res.status(200).json({ stats, recentActivity });
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
