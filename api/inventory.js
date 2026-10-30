import clientPromise, { getDbName } from '../lib/mongodb.js';
import { verifyUser } from './lib/auth.js';
import { PRODUCTS, ACTIVE_PRODUCT_IDS, getProductInfo } from '../lib/products.js';
import { z } from 'zod';

const DAY_MS = 86400000;

const inventoryPostSchema = z.object({
    type: z.enum(['IN', 'OUT']),
    product: z.enum(['A03', 'A04'], {
        message: 'Geçerli bir yem türü seçilmelidir (SAFE® A03 veya SAFE® A04).'
    }),
    amount: z.number().int().positive('Miktar pozitif bir tam sayı olmalıdır.')
});

function getIstanbulDateString(date) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Istanbul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}

function getMondayAnchor(date) {
    const dateStr = getIstanbulDateString(date);
    const anchor = new Date(`${dateStr}T12:00:00Z`);
    const day = anchor.getUTCDay();
    const distanceToMonday = day === 0 ? 6 : day - 1;
    return new Date(anchor.getTime() - distanceToMonday * DAY_MS);
}

function getIsoWeekNumber(utcNoonDate) {
    const tempDate = new Date(Date.UTC(
        utcNoonDate.getUTCFullYear(),
        utcNoonDate.getUTCMonth(),
        utcNoonDate.getUTCDate()
    ));
    tempDate.setUTCDate(tempDate.getUTCDate() + 3 - ((tempDate.getUTCDay() + 6) % 7));
    const weekYearRef = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 4));
    return 1 + Math.round(((tempDate.getTime() - weekYearRef.getTime()) / DAY_MS - 3 + ((weekYearRef.getUTCDay() + 6) % 7)) / 7);
}

export default async function handler(req, res) {
    let user;
    try {
        user = await verifyUser(req);
    } catch (error) {
        return res.status(error.status || 401).json({ error: error.message });
    }

    const client = await clientPromise;
    const db = client.db(getDbName('Silo_db'));
    const statsCollection = db.collection('inventory_stats');
    const transactionsCollection = db.collection('transactions');

    if (req.method === 'GET') {
        try {
            // Fetch product-level stats for SAFE A03 & SAFE A04 (preserving legacy 'main' document untouched)
            const statsDocs = await statsCollection.find({ _id: { $in: ACTIVE_PRODUCT_IDS } }).toArray();
            const statsById = Object.fromEntries(statsDocs.map(doc => [doc._id, doc]));

            const productStats = {};
            for (const productId of ACTIVE_PRODUCT_IDS) {
                const productMeta = PRODUCTS[productId];
                let doc = statsById[productId];
                if (!doc) {
                    doc = {
                        _id: productId,
                        productCode: productId,
                        weightPerPkg: productMeta.weightPerPkg,
                        totalStock: 0,
                        totalWeight: 0
                    };
                    await statsCollection.updateOne(
                        { _id: productId },
                        { $setOnInsert: doc },
                        { upsert: true }
                    );
                }
                productStats[productId] = {
                    id: productId,
                    name: productMeta.name,
                    subtitle: productMeta.subtitle,
                    weightPerPkg: productMeta.weightPerPkg,
                    lowStockThreshold: productMeta.lowStockThreshold,
                    totalStock: doc.totalStock || 0,
                    totalWeight: doc.totalWeight || 0
                };
            }

            const stats = {
                totalStock: productStats.A03.totalStock + productStats.A04.totalStock,
                totalWeight: productStats.A03.totalWeight + productStats.A04.totalWeight,
                products: productStats
            };

            // Get recent transactions (last 10 by default, or all if all === 'true')
            const { all, weekOffset, report } = req.query;
            const offsetWeeks = parseInt(weekOffset, 10) || 0;
            let query = transactionsCollection.find({}).sort({ date: -1 });
            if (all !== 'true') {
                query = query.limit(10);
            }
            const rawActivity = await query.toArray();
            const recentActivity = rawActivity.map(tx => {
                const prodInfo = getProductInfo(tx.product);
                return {
                    ...tx,
                    product: prodInfo.id,
                    productName: tx.productName || prodInfo.name,
                    weightPerPkg: tx.weightPerPkg || prodInfo.weightPerPkg
                };
            });

            // Calculate weekly consumption (in Europe/Istanbul timezone)
            const currentMonday = getMondayAnchor(new Date());

            let firstMonday;
            let numWeeks = 6;
            let endSunday;

            if (report === 'true') {
                const oldestTx = await transactionsCollection.findOne({ type: 'OUT' }, { sort: { date: 1 } });
                if (oldestTx && oldestTx.date) {
                    firstMonday = getMondayAnchor(new Date(oldestTx.date));
                } else {
                    firstMonday = new Date(currentMonday);
                }
                const diffTime = Math.max(0, currentMonday.getTime() - firstMonday.getTime());
                numWeeks = Math.round(diffTime / (DAY_MS * 7));
                endSunday = new Date(currentMonday.getTime() + 6 * DAY_MS);
            } else {
                const shiftedMonday = new Date(currentMonday.getTime() - offsetWeeks * 7 * 7 * DAY_MS);
                firstMonday = new Date(shiftedMonday.getTime() - 6 * 7 * DAY_MS);
                endSunday = new Date(shiftedMonday.getTime() + 6 * DAY_MS);
            }

            const rangeStartStr = firstMonday.toISOString().split('T')[0];
            const rangeEndStr = endSunday.toISOString().split('T')[0];
            const rangeStart = new Date(`${rangeStartStr}T00:00:00.000+03:00`);
            const rangeEnd = new Date(`${rangeEndStr}T23:59:59.999+03:00`);

            const consumptionRaw = await transactionsCollection.aggregate([
                {
                    $match: {
                        type: 'OUT',
                        date: { $gte: rangeStart, $lte: rangeEnd }
                    }
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "Europe/Istanbul" } },
                            product: { $ifNull: ["$product", "OPTIMA"] }
                        },
                        totalWeight: { $sum: "$weight" },
                        totalPackages: { $sum: "$amount" }
                    }
                },
                {
                    $sort: { "_id.date": 1 }
                }
            ]).toArray();

            // Index consumption by date -> product
            const consumptionMap = new Map();
            for (const row of consumptionRaw) {
                const dateKey = row._id.date;
                const prodKey = row._id.product;
                if (!consumptionMap.has(dateKey)) {
                    consumptionMap.set(dateKey, {});
                }
                consumptionMap.get(dateKey)[prodKey] = {
                    weight: row.totalWeight || 0,
                    packages: row.totalPackages || 0
                };
            }

            const weeklyConsumption = [];
            for (let w = numWeeks; w >= 0; w--) {
                const weekIndex = numWeeks - w;
                const weekStart = new Date(firstMonday.getTime() + weekIndex * 7 * DAY_MS);
                const weekEnd = new Date(weekStart.getTime() + 6 * DAY_MS);

                const weekNum = getIsoWeekNumber(weekStart);
                const weekLabel = `${weekNum}. Hafta`;
                const dateRangeLabel = `${weekStart.getUTCDate()} - ${weekEnd.getUTCDate()} ${weekEnd.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric', timeZone: 'Europe/Istanbul' })}`;

                const days = [];
                let weekWeight = 0;
                let weekPackages = 0;
                const weekByProduct = {
                    A03: { weight: 0, packages: 0 },
                    A04: { weight: 0, packages: 0 },
                    OPTIMA: { weight: 0, packages: 0 }
                };

                for (let d = 0; d < 7; d++) {
                    const dayDate = new Date(weekStart.getTime() + d * DAY_MS);
                    const dateString = dayDate.toISOString().split('T')[0];
                    const dayProducts = consumptionMap.get(dateString) || {};

                    const a03 = dayProducts.A03 || { weight: 0, packages: 0 };
                    const a04 = dayProducts.A04 || { weight: 0, packages: 0 };
                    const optima = dayProducts.OPTIMA || { weight: 0, packages: 0 };

                    const dayWeight = a03.weight + a04.weight + optima.weight;
                    const dayPackages = a03.packages + a04.packages + optima.packages;

                    weekWeight += dayWeight;
                    weekPackages += dayPackages;
                    weekByProduct.A03.weight += a03.weight;
                    weekByProduct.A03.packages += a03.packages;
                    weekByProduct.A04.weight += a04.weight;
                    weekByProduct.A04.packages += a04.packages;
                    weekByProduct.OPTIMA.weight += optima.weight;
                    weekByProduct.OPTIMA.packages += optima.packages;

                    days.push({
                        date: dateString,
                        dayName: dayDate.toLocaleDateString('tr-TR', { weekday: 'short', timeZone: 'Europe/Istanbul' }),
                        weight: dayWeight,
                        packages: dayPackages,
                        byProduct: {
                            A03: a03,
                            A04: a04,
                            OPTIMA: optima
                        }
                    });
                }

                weeklyConsumption.push({
                    weekIndex,
                    weekNum,
                    weekLabel,
                    dateRangeLabel,
                    weight: weekWeight,
                    packages: weekPackages,
                    byProduct: weekByProduct,
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
                const msg = bodyResult.error.issues?.[0]?.message || 'Geçersiz istek verisi.';
                return res.status(400).json({ error: msg });
            }
            const { type, product, amount } = bodyResult.data;

            const productMeta = PRODUCTS[product];
            const pkgWeight = productMeta.weightPerPkg; // 10 kg per package for SAFE A03 & A04
            const totalWeightChange = amount * pkgWeight;

            // Transaction Logic
            if (type === 'IN') {
                // Update product-specific stats
                await statsCollection.updateOne(
                    { _id: product },
                    {
                        $inc: { totalStock: amount, totalWeight: totalWeightChange },
                        $set: { productCode: product, weightPerPkg: pkgWeight }
                    },
                    { upsert: true }
                );

                // Log Transaction
                await transactionsCollection.insertOne({
                    type: 'IN',
                    product,
                    productName: productMeta.name,
                    weightPerPkg: pkgWeight,
                    amount,
                    weight: totalWeightChange,
                    user: user.name,
                    date: new Date(),
                    details: 'Teslimat Alındı'
                });

            } else if (type === 'OUT') {
                // Update product-specific stats atomically to prevent race conditions (negative stock)
                const result = await statsCollection.updateOne(
                    { _id: product, totalStock: { $gte: amount } },
                    {
                        $inc: { totalStock: -amount, totalWeight: -totalWeightChange }
                    }
                );

                if (result.modifiedCount === 0) {
                    return res.status(400).json({
                        error: `${productMeta.name} için yetersiz stok veya envanter güncellenemedi.`
                    });
                }

                // Log Transaction
                await transactionsCollection.insertOne({
                    type: 'OUT',
                    product,
                    productName: productMeta.name,
                    weightPerPkg: pkgWeight,
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
