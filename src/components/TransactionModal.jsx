import React, { useState } from 'react';
import { X } from 'lucide-react';

export function TransactionModal({ isOpen, onClose, type, onSuccess }) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const isReceive = type === 'IN';
    const title = isReceive ? 'Teslimat Al' : 'Paket Çıkışı';
    const buttonText = isReceive ? 'Onayla' : 'Çıkışı Onayla';
    const buttonColor = isReceive ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: type,
                    amount: parseInt(amount),
                    weightPerPkg: 4 // Hardcoded for now based on specs
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'İşlem başarısız');
            }

            onSuccess();
            onClose();
            setAmount('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Paket Sayısı
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setAmount(prev => Math.max(1, (parseInt(prev) || 0) - 1))}
                                className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition-all text-2xl font-medium"
                            >
                                -
                            </button>

                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full h-12 text-center text-xl font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                                    placeholder="0"
                                />
                                <span className="absolute right-3 top-3 text-slate-400 text-xs font-medium">PKT</span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setAmount(prev => (parseInt(prev) || 0) + 1)}
                                className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition-all text-2xl font-medium"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 ${buttonColor}`}
                        >
                            {loading ? 'İşleniyor...' : buttonText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
