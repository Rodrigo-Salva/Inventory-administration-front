import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    Plus, Receipt, Search, Filter, Calendar, 
    ChevronLeft, ChevronRight, Loader2,
    User as UserIcon, Clock
} from 'lucide-react';
import api from '@/api/client';
import { Expense, ExpenseSummary } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ExpenseModal from '@/components/pos/ExpenseModal';
import { usePermissions } from '@/hooks/usePermissions';

export default function Expenses() {
    const { hasPermission } = usePermissions();
    const [page, setPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');

    const { data, isLoading } = useQuery<ExpenseSummary>({
        queryKey: ['expenses', page],
        queryFn: async () => {
            const response = await api.get('/api/v1/expenses/', {
                params: { page, page_size: 15 }
            });
            return response.data;
        }
    });

    if (!hasPermission('expenses:view')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Receipt className="h-16 w-16 text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Acceso Denegado</h2>
                <p className="text-gray-500 mt-2">No tienes permisos para ver los gastos.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-50 rounded-xl">
                            <Receipt className="h-6 w-6 text-red-600" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Gastos y Egresos</h1>
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-11">Control de salidas de dinero del negocio</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-[0.98] shadow-xl shadow-slate-200"
                >
                    <Plus className="h-5 w-5" />
                    Registrar Nuevo Gasto
                </button>
            </div>

            {/* Filters & Content */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por descripción..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                        />
                    </div>
                    
                    <div className="flex gap-2">
                        <button className="p-3 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
                            <Filter className="h-5 w-5" />
                        </button>
                        <button className="p-3 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
                            <Calendar className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
                        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mt-4">Cargando registros...</p>
                    </div>
                ) : data?.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="p-6 bg-gray-50 rounded-full mb-4">
                            <Receipt className="h-12 w-12 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No hay gastos registrados</h3>
                        <p className="text-sm text-gray-500 mt-1">Empieza registrando una salida de dinero.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Fecha</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Categoría</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Descripción</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Monto</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Usuario</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data?.items.map((expense: Expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                                                    <Clock className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {format(new Date(expense.expense_date), 'dd MMM, yyyy', { locale: es })}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400">
                                                        {format(new Date(expense.expense_date), 'hh:mm a')}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-lg tracking-wider">
                                                    {expense.category?.name || 'General'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-sm font-medium text-gray-600 italic">
                                                "{expense.description}"
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-lg font-black text-red-600 tracking-tight">
                                                - ${Number(expense.amount || 0).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <UserIcon className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                                    {expense.user_id ? `ID: ${expense.user_id}` : 'Sistema'}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {data && data.total > 15 && (
                    <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Mostrando {data.items.length} de {data.total} gastos
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-all"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={data.items.length < 15}
                                className="p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-all"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ExpenseModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </div>
    );
}
