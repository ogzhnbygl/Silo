export const PRODUCTS = {
    A03: {
        id: 'A03',
        name: 'SAFE® A03',
        shortName: 'SAFE A03',
        subtitle: 'Üreme & Büyüme Yemi (Breeding)',
        weightPerPkg: 10,
        lowStockThreshold: 10, // <= 10 paket (<= 100 kg) => Stok Az
    },
    A04: {
        id: 'A04',
        name: 'SAFE® A04',
        shortName: 'SAFE A04',
        subtitle: 'Bakım & İdame Yemi (Maintenance)',
        weightPerPkg: 10,
        lowStockThreshold: 10, // <= 10 paket (<= 100 kg) => Stok Az
    }
};

export const ACTIVE_PRODUCT_IDS = ['A03', 'A04'];

export const LEGACY_PRODUCT = {
    id: 'OPTIMA',
    name: 'Optima 4kg',
    shortName: 'Optima 4kg',
    subtitle: 'Eski Yem (4 kg)',
    weightPerPkg: 4,
    isLegacy: true
};

export function getProductInfo(productId) {
    if (productId && PRODUCTS[productId]) {
        return PRODUCTS[productId];
    }
    return LEGACY_PRODUCT;
}

