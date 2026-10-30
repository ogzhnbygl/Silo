import React, { useState, useEffect, useRef, useId } from 'react';
import { X, Check } from 'lucide-react';
import { PRODUCTS, ACTIVE_PRODUCT_IDS } from '../../lib/products.js';

export function TransactionModal({ isOpen, onClose, type, onSuccess, productStats = {} }) {
    const [selectedProduct, setSelectedProduct] = useState('A03');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const dialogRef = useRef(null);
    const titleId = useId();
    const amountId = useId();
    const weightHintId = useId();
    const baseRadioId = useId();

    const isReceive = type === 'IN';
    const title = isReceive ? 'Teslimat Al' : 'Paket Çıkışı';
    const buttonText = isReceive ? 'Teslimatı Onayla' : 'Çıkışı Onayla';
    const buttonColor = isReceive ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700';

    // Sync React isOpen prop with native <dialog>.showModal() / .close()
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen) {
            setError(null);
            if (!dialog.open) {
                dialog.showModal();
            }
        } else if (dialog.open) {
            dialog.close();
        }
    }, [isOpen]);

    // Progressive enhancement fallback for <dialog closedby="any"> light dismiss
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog || typeof HTMLDialogElement === 'undefined') return;
        if ('closedBy' in HTMLDialogElement.prototype) return;

        const isOutside = (e) => {
            const r = dialog.getBoundingClientRect();
            return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        };

        let pressedOutside = false;
        const onPointerDown = (e) => {
            pressedOutside = isOutside(e);
        };
        const onPointerUp = (e) => {
            if (pressedOutside && isOutside(e)) {
                dialog.close();
            }
            pressedOutside = false;
        };

        dialog.addEventListener('pointerdown', onPointerDown);
        dialog.addEventListener('pointerup', onPointerUp);
        return () => {
            dialog.removeEventListener('pointerdown', onPointerDown);
            dialog.removeEventListener('pointerup', onPointerUp);
        };
    }, []);

    const handleDialogClose = () => {
        if (dialogRef.current) {
            dialogRef.current.returnValue = '';
        }
        setError(null);
        if (isOpen) {
            onClose();
        }
    };

    const currentProdMeta = PRODUCTS[selectedProduct] || PRODUCTS.A03;
    const parsedAmount = parseInt(amount, 10) || 0;
    const calculatedWeight = parsedAmount * currentProdMeta.weightPerPkg;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        const qty = parseInt(amount, 10);
        if (!qty || qty < 1) {
            setError('Lütfen en az 1 paket girin.');
            return;
        }

        if (!isReceive) {
            const available = productStats[selectedProduct]?.totalStock ?? 0;
            if (qty > available) {
                setError(`${currentProdMeta.name} için yeterli stok yok (Mevcut: ${available} Paket).`);
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    product: selectedProduct,
                    amount: qty
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'İşlem başarısız');
            }

            setAmount('');
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            {...{ closedby: 'any' }}
            onClose={handleDialogClose}
            className="m-auto p-0 bg-white rounded-xl shadow-xl max-w-md w-[calc(100%-2rem)] overflow-hidden border border-slate-100 text-slate-900"
        >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h2 id={titleId} className="font-semibold text-slate-900 text-base">
                    {title}
                </h2>
                <button
                    type="button"
                    onClick={() => dialogRef.current?.close()}
                    aria-label="Pencereyi kapat"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <form action="/api/inventory" method="POST" onSubmit={handleSubmit} className="p-6">
                <div aria-live="polite" role="status">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}
                </div>

                {/* Product Selection (Radio Group for 2 options) */}
                <fieldset className="mb-5">
                    <legend className="block text-sm font-medium text-slate-700 mb-2">
                        Yem Türü
                    </legend>
                    <div className="grid grid-cols-2 gap-3">
                        {ACTIVE_PRODUCT_IDS.map((prodId) => {
                            const meta = PRODUCTS[prodId];
                            const stat = productStats[prodId] || { totalStock: 0, totalWeight: 0 };
                            const isSelected = selectedProduct === prodId;
                            const radioId = `${baseRadioId}-${prodId}`;
                            const activeRing = prodId === 'A03'
                                ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                                : 'border-violet-600 bg-violet-50/60 ring-1 ring-violet-600';
                            const badgeColor = prodId === 'A03'
                                ? 'bg-blue-600 text-white'
                                : 'bg-violet-600 text-white';

                            return (
                                <div key={prodId} className="relative">
                                    <input
                                        type="radio"
                                        id={radioId}
                                        name="product"
                                        value={prodId}
                                        checked={isSelected}
                                        onChange={() => {
                                            setSelectedProduct(prodId);
                                            setError(null);
                                        }}
                                        className="visually-hidden peer"
                                    />
                                    <label
                                        htmlFor={radioId}
                                        className={`flex flex-col justify-between h-full p-3.5 rounded-xl border cursor-pointer transition-all peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600 ${
                                            isSelected
                                                ? activeRing
                                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${badgeColor}`}>
                                                {meta.id}
                                            </span>
                                            {isSelected && (
                                                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                                                    <Check size={12} />
                                                </span>
                                            )}
                                        </div>
                                        <div className="font-bold text-sm text-slate-900">{meta.name}</div>
                                        <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                                            {prodId === 'A03' ? 'Üreme & Büyüme' : 'Bakım & İdame'} • {meta.weightPerPkg} kg
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-slate-200/70 text-xs font-medium text-slate-600">
                                            Stok: <span className="font-bold text-slate-900">{stat.totalStock} Pkt</span> ({stat.totalWeight} kg)
                                        </div>
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                </fieldset>

                {/* Package Count Input */}
                <div className="mb-6">
                    <label htmlFor={amountId} className="block text-sm font-medium text-slate-700 mb-2">
                        Paket Sayısı ({currentProdMeta.weightPerPkg} kg / Paket)
                    </label>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            aria-label="Paket sayısını azalt"
                            onClick={() => {
                                setAmount(prev => String(Math.max(1, (parseInt(prev, 10) || 0) - 1)));
                                setError(null);
                            }}
                            className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition-all text-2xl font-medium"
                        >
                            -
                        </button>

                        <div className="relative flex-1">
                            <input
                                id={amountId}
                                name="amount"
                                type="number"
                                inputMode="numeric"
                                min="1"
                                required
                                value={amount}
                                aria-describedby={weightHintId}
                                onChange={(e) => {
                                    setAmount(e.target.value);
                                    setError(null);
                                }}
                                className="w-full h-12 text-center text-xl font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                                placeholder="0"
                            />
                            <span className="absolute right-3 top-3.5 text-slate-400 text-xs font-medium pointer-events-none">
                                PKT
                            </span>
                        </div>

                        <button
                            type="button"
                            aria-label="Paket sayısını artır"
                            onClick={() => {
                                setAmount(prev => String((parseInt(prev, 10) || 0) + 1));
                                setError(null);
                            }}
                            className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition-all text-2xl font-medium"
                        >
                            +
                        </button>
                    </div>
                    <p id={weightHintId} className="mt-2 text-xs text-slate-500 text-center">
                        {parsedAmount > 0 ? (
                            <>
                                Seçilen: <span className="font-semibold text-slate-700">{currentProdMeta.name}</span> • Toplam Ağırlık:{' '}
                                <span className="font-bold text-slate-900">{calculatedWeight} kg</span>
                            </>
                        ) : (
                            `${currentProdMeta.name} için işlem yapılacak paket adedini girin`
                        )}
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => dialogRef.current?.close()}
                        className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 ${buttonColor}`}
                    >
                        {loading ? 'İşleniyor...' : buttonText}
                    </button>
                </div>
            </form>
        </dialog>
    );
}
