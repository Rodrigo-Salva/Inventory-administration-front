import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Receipt, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import api from '@/api/client';
import toast from 'react-hot-toast';
import { ExpenseCategory } from '@/types';

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    cashSessionId?: number | null;
}

export default function ExpenseModal({ isOpen, onClose, cashSessionId }: ExpenseModalProps) {
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [categoryId, setCategoryId] = useState<string>('');

    // Cargar categorías
    const { data: categories } = useQuery<ExpenseCategory[]>({
        queryKey: ['expense-categories'],
        queryFn: async () => {
            const response = await api.get('/api/v1/expenses/categories');
            return response.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/api/v1/expenses/', data);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Egreso registrado correctamente');
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['pos-current-session'] }); // Para que el POS se entere
            onClose();
            setAmount('');
            setDescription('');
            setCategoryId('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'Error al registrar el egreso');
        }
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!amount || !description || !categoryId) {
            toast.error('Por favor completa todos los campos');
            return;
        }

        createMutation.mutate({
            amount: parseFloat(amount),
            description,
            category_id: parseInt(categoryId),
            cash_session_id: cashSessionId
        });
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
                <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-red-50 text-red-600">
                                    <Receipt className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                                        Registrar Egreso
                                    </h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                        {cashSessionId ? 'Vinculado al turno actual' : 'Gasto general del negocio'}
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
                                    Monto del Egreso
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

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                                    Categoría
                                </label>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none appearance-none"
                                    required
                                >
                                    <option value="">Selecciona una categoría</option>
                                    {categories?.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                                    Descripción / Motivo
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ej: Pago de luz, Compra de café, etc."
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none resize-none h-24"
                                    required
                                />
                            </div>

                            {cashSessionId && (
                                <div className="p-4 bg-amber-50 rounded-2xl flex gap-3 border border-amber-100">
                                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                                    <p className="text-[10px] font-bold text-amber-700 leading-normal">
                                        Este gasto se restará automáticamente del saldo esperado al cerrar la caja.
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="w-full h-16 rounded-2xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-sm transition-all active:scale-[0.98] shadow-xl shadow-red-200"
                            >
                                {createMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span>Registrar Egreso</span>
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
