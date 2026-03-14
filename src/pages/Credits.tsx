import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import { 
    Search, User as UserIcon, DollarSign, 
    ArrowUpCircle, ArrowDownCircle, Clock, 
    Filter, 
    Loader2, Receipt, History
} from 'lucide-react';
import clsx from "clsx";
import toast from "react-hot-toast";

interface Credit {
    id: number;
    sale_id: number;
    customer_id: number;
    total_amount: number;
    remaining_amount: number;
    status: string;
    due_date: string;
    created_at: string;
}



export default function Credits() {
    const [search, setSearch] = useState("");
    const [selectedCreditId, setSelectedCreditId] = useState<number | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [paymentNotes, setPaymentNotes] = useState("");

    const queryClient = useQueryClient();

    // 1. Cargar Clientes con Saldo Pendiente
    const { data: customersWithBalance, isLoading: isLoadingCustomers } = useQuery({
        queryKey: ["customers-credits", search],
        queryFn: async () => {
            const params = new URLSearchParams({ search, has_balance: "true" });
            const response = await api.get(`/api/v1/customers/?${params}`);
            return response.data.items;
        }
    });

    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

    // 2. Cargar Créditos del Cliente Seleccionado
    const { data: credits, isLoading: isLoadingCredits } = useQuery<Credit[]>({
        queryKey: ["credits", selectedCustomerId],
        queryFn: async () => {
            if (!selectedCustomerId) return [];
            const response = await api.get(`/api/v1/credits/customer/${selectedCustomerId}`);
            return response.data;
        },
        enabled: !!selectedCustomerId
    });

    // 3. Cargar detalle de crédito (incluye pagos)
    const { data: creditDetail, isLoading: isLoadingDetail } = useQuery({
        queryKey: ["credit-detail", selectedCreditId],
        queryFn: async () => {
            if (!selectedCreditId) return null;
            const response = await api.get(`/api/v1/credits/${selectedCreditId}`);
            return response.data;
        },
        enabled: !!selectedCreditId
    });

    // 4. Mutación para registrar pago
    const payMutation = useMutation({
        mutationFn: async (paymentData: any) => {
            const response = await api.post("/api/v1/credits/pay", paymentData);
            return response.data;
        },
        onSuccess: () => {
            toast.success("Pago registrado correctamente");
            setIsPaymentModalOpen(false);
            setPaymentAmount("");
            setPaymentNotes("");
            queryClient.invalidateQueries({ queryKey: ["credits"] });
            queryClient.invalidateQueries({ queryKey: ["credit-detail"] });
            queryClient.invalidateQueries({ queryKey: ["customers-credits"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Error al procesar el pago");
        }
    });

    const handlePaySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCreditId) return;
        payMutation.mutate({
            credit_id: selectedCreditId,
            amount: parseFloat(paymentAmount),
            payment_method: paymentMethod,
            notes: paymentNotes
        });
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6 antialiased">
            {/* SIDEBAR: LISTADO DE CLIENTES CON DEUDA */}
            <div className="w-full lg:w-80 flex flex-col bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-white/50">
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-primary-500" />
                        Deudores
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar cliente..." 
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary-500/10 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {isLoadingCustomers ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary-200" /></div>
                    ) : customersWithBalance?.map((customer: any) => (
                        <button
                            key={customer.id}
                            onClick={() => {
                                setSelectedCustomerId(customer.id);
                                setSelectedCreditId(null);
                            }}
                            className={clsx(
                                "w-full p-4 rounded-2xl border transition-all flex flex-col gap-1 text-left active:scale-[0.98]",
                                selectedCustomerId === customer.id
                                    ? "bg-primary-50 border-primary-200"
                                    : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-100"
                            )}
                        >
                            <span className="text-xs font-black text-gray-900 uppercase truncate">{customer.name}</span>
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-bold text-gray-400">Deuda Total:</span>
                                <span className="text-sm font-black text-red-600">${Number(customer.current_balance).toLocaleString()}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL: CRÉDITOS Y PAGOS */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
                {!selectedCustomerId ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-white border border-dashed border-gray-200 rounded-[3rem] text-center p-12">
                        <div className="p-8 bg-indigo-50 rounded-full mb-6">
                            <History className="h-16 w-16 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Gestión de Cobros</h3>
                        <p className="text-gray-400 mt-2 max-w-sm">Selecciona un cliente del listado de la izquierda para ver su historial de deudas y abonos.</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col gap-6">
                        {/* LISTADO DE CRÉDITOS PENDIENTES */}
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col max-h-[50%]">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                                        <ArrowUpCircle className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Créditos de Venta</h3>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {isLoadingCredits ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : credits?.map((credit) => (
                                    <button
                                        key={credit.id}
                                        onClick={() => setSelectedCreditId(credit.id)}
                                        className={clsx(
                                            "p-5 rounded-[2rem] border-2 transition-all flex flex-col gap-4 text-left group",
                                            selectedCreditId === credit.id
                                                ? "bg-indigo-50 border-indigo-500 shadow-xl shadow-indigo-100"
                                                : "bg-white border-gray-50 hover:border-gray-100"
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                Venta #{credit.sale_id}
                                            </div>
                                            <span className={clsx(
                                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter",
                                                credit.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                                            )}>
                                                {credit.status}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Saldo Pendiente</p>
                                                <h4 className="text-2xl font-black text-gray-900 tracking-tight">${Number(credit.remaining_amount).toLocaleString()}</h4>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase">Total: ${Number(credit.total_amount).toLocaleString()}</p>
                                                <div className="flex items-center gap-1 text-[9px] font-bold text-red-400 mt-1">
                                                    <Clock className="h-3 w-3" />
                                                    Vence: {new Date(credit.due_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* DETALLE Y PAGOS */}
                        <div className="flex-1 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
                            {!selectedCreditId ? (
                                <div className="flex-1 flex items-center justify-center text-gray-400 gap-3 italic">
                                    <Receipt className="h-8 w-8 opacity-20" />
                                    Selecciona una factura de arriba para ver abonos
                                </div>
                            ) : (
                                <>
                                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                                <ArrowDownCircle className="h-5 w-5" />
                                            </div>
                                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Abonos Realizados</h3>
                                        </div>
                                        {creditDetail?.status !== 'paid' && (
                                            <button 
                                                onClick={() => setIsPaymentModalOpen(true)}
                                                className="h-10 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-100"
                                            >
                                                Registrar Abono
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto p-6">
                                        {isLoadingDetail ? (
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        ) : creditDetail?.payments.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 italic opacity-50">
                                                <Filter className="h-12 w-12" />
                                                <p>Sin abonos registrados aún</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {creditDetail?.payments.map((payment: any) => (
                                                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-white rounded-xl text-emerald-500 shadow-sm">
                                                                <DollarSign className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-gray-900 uppercase">Abono {payment.payment_method}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-[10px] font-bold text-gray-400">{new Date(payment.created_at).toLocaleString()}</span>
                                                                    {payment.notes && <span className="text-[10px] font-medium text-indigo-400">— {payment.notes}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="text-lg font-black text-gray-900">+ ${Number(payment.amount).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL REGISTRAR PAGO */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[100] overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsPaymentModalOpen(false)} />
                        <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden p-10 border border-gray-100">
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-8">Registrar Abono</h3>
                            <form onSubmit={handlePaySubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Monto del Abono</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-300" />
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            required
                                            max={creditDetail?.remaining_amount}
                                            className="w-full h-16 bg-gray-50 border-none rounded-2xl pl-14 pr-6 text-2xl font-black focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                            placeholder="0.00"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                        />
                                    </div>
                                    <p className="mt-2 text-[10px] font-bold text-gray-400 text-right px-2">
                                        Saldo máximo permitido: <span className="text-emerald-500">${Number(creditDetail?.remaining_amount).toLocaleString()}</span>
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Método de Pago</label>
                                    <select 
                                        className="w-full h-14 bg-gray-50 border-none rounded-2xl px-6 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer"
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    >
                                        <option value="cash">Efectivo</option>
                                        <option value="transfer">Transferencia</option>
                                        <option value="card">Tarjeta</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Notas (Opcional)</label>
                                    <textarea 
                                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 transition-all min-h-[100px]"
                                        placeholder="Ej: Pago de cuota quincenal..."
                                        value={paymentNotes}
                                        onChange={(e) => setPaymentNotes(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => setIsPaymentModalOpen(false)}
                                        className="flex-1 h-16 bg-gray-50 hover:bg-gray-100 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={payMutation.isPending}
                                        className="flex-2 px-8 h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-emerald-100 disabled:opacity-50"
                                    >
                                        {payMutation.isPending ? "Procesando..." : "Confirmar Abono"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
