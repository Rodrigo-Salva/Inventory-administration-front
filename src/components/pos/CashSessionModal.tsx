import React, { useState } from 'react';
import { usePOSStore } from '@/store/posStore';
import { X, Banknote, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface CashSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'open' | 'close';
}

export default function CashSessionModal({ isOpen, onClose, type }: CashSessionModalProps) {
    const { openSession, closeSession, isLoading } = usePOSStore();
    const [amount, setAmount] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        
        if (isNaN(numericAmount) || numericAmount < 0) {
            toast.error('Por favor ingresa un monto válido');
            return;
        }

        try {
            if (type === 'open') {
                await openSession(numericAmount, notes);
                toast.success('Caja abierta correctamente');
            } else {
                await closeSession(numericAmount);
                toast.success('Caja cerrada correctamente');
            }
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Error al procesar la sesión');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
                <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${type === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    <Banknote className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                                        {type === 'open' ? 'Abrir Caja' : 'Cerrar Caja'}
                                    </h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                        {type === 'open' ? 'Ingresa el monto inicial' : 'Ingresa el monto final fìsico'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                                <X className="h-6 w-6 text-gray-300" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                                    {type === 'open' ? 'Saldo Inicial' : 'Saldo Final en Efectivo'}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-8 pr-4 py-4 text-lg font-black text-gray-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {type === 'open' && (
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                                        Notas (Opcional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Cualquier nota sobre el turno..."
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none resize-none h-24"
                                    />
                                </div>
                            )}

                            {type === 'close' && (
                                <div className="p-4 bg-amber-50 rounded-2xl flex gap-3 border border-amber-100">
                                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                                    <p className="text-[10px] font-bold text-amber-700 leading-normal">
                                        Al cerrar la caja, se comparará el monto físico que ingreses con el total de ventas registradas en el sistema.
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-sm transition-all active:scale-[0.98] shadow-xl ${
                                    type === 'open' 
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-200' 
                                    : 'bg-red-600 hover:bg-red-500 text-white shadow-red-200'
                                }`}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span>{type === 'open' ? 'Confirmar Apertura' : 'Confirmar Cierre'}</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
