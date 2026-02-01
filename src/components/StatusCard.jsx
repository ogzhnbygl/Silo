import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export function StatusCard({ status = 'Optimal Level', isOptimal = true }) {
    return (
        <div className={`p-6 rounded-xl border ${isOptimal ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'} flex items-center gap-4`}>
            <div className={`p-2 rounded-full ${isOptimal ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                {isOptimal ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
            </div>
            <div>
                <div className={`text-sm font-medium ${isOptimal ? 'text-green-800' : 'text-amber-800'}`}>Stok Durumu</div>
                <div className={`text-lg font-bold ${isOptimal ? 'text-green-900' : 'text-amber-900'}`}>{status}</div>
            </div>
        </div>
    );
}
