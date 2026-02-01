import clientPromise from '../lib/mongodb.js';
import { verifyUser } from './lib/auth.js';

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
            return res.status(500).json({ error: 'Failed to fetch data' });
        }
    } else if (req.method === 'POST') {
        try {
            const { type, amount, weightPerPkg } = req.body; // type: 'IN' | 'OUT'

            if (!amount || amount <= 0) {
                return res.status(400).json({ error: 'Invalid amount' });
            }

            const pkgWeight = weightPerPkg || 4; // Default 4kg per package if not specified
            const totalWeightChange = amount * pkgWeight;

            // Get current stats
            let stats = await statsCollection.findOne({ _id: 'main' });
            if (!stats) {
                stats = { _id: 'main', totalStock: 0, totalWeight: 0 };
                await statsCollection.insertOne(stats);
            }

            // Transaction Logic
            if (type === 'IN') {
                // Update Stats
                await statsCollection.updateOne(
                    { _id: 'main' },
                    {
                        $inc: { totalStock: amount, totalWeight: totalWeightChange }
                    }
                );

                // Log Transaction
                await transactionsCollection.insertOne({
                    type: 'IN',
                    amount,
                    weight: totalWeightChange,
                    user: user.name,
                    date: new Date(),
                    details: 'Shipment Received'
                });

            } else if (type === 'OUT') {
                if (stats.totalStock < amount) {
                    return res.status(400).json({ error: 'Insufficient stock' });
                }

                // Update Stats
                await statsCollection.updateOne(
                    { _id: 'main' },
                    {
                        $inc: { totalStock: -amount, totalWeight: -totalWeightChange }
                    }
                );

                // Log Transaction
                await transactionsCollection.insertOne({
                    type: 'OUT',
                    amount,
                    weight: totalWeightChange,
                    user: user.name,
                    date: new Date(),
                    details: 'Package Taken'
                });
            } else {
                return res.status(400).json({ error: 'Invalid transaction type' });
            }

            return res.status(200).json({ success: true });

        } catch (error) {
            console.error('Inventory POST Error:', error);
            return res.status(500).json({ error: 'Transaction failed' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
