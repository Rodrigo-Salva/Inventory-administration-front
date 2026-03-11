import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { FileText, Search, CreditCard, Banknote, RefreshCcw, CheckCircle2, ArrowRight, X, Receipt } from "lucide-react";
import clsx from "clsx";
import type { PaginatedResponse } from "@/types";
import { usePermissions } from "@/hooks/usePermissions";
import Pagination from "@/components/common/Pagination";

export default function QuotesList() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [lastSaleId, setLastSaleId] = useState<number | null>(null);
    const [convertingQuote, setConvertingQuote] = useState<any | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash");
    const queryClient = useQueryClient();
    const { hasPermission } = usePermissions();

    const downloadTicket = async (saleId: number) => {
        const toastId = toast.loading("Generando boleta...");
        try {
            const response = await api.get(`/api/v1/sales/${saleId}/ticket`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Boleta_${saleId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Boleta generada", { id: toastId });
        } catch (err) {
            console.error("Error al descargar boleta", err);
            toast.error("Error al generar boleta", { id: toastId });
        }
    };

    const { data: quotesData, isLoading } = useQuery<PaginatedResponse<any>>({
        queryKey: ["quotes", page, search, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                size: "10"
            });
            if (search) params.append("search", search);
            if (statusFilter) params.append("status", statusFilter);
            
            const response = await api.get(`/api/v1/quotes/?${params}`);
            return response.data;
        },
    });

    const convertMutation = useMutation({
        mutationFn: async ({ quoteId, payment_method }: { quoteId: number, payment_method: string }) => {
            const response = await api.post(`/api/v1/quotes/${quoteId}/convert?payment_method=${payment_method}`);
            return response.data;
        },
        onSuccess: (data) => {
            toast.success("Cotización convertida a venta exitosamente");
            setIsPaymentModalOpen(false);
            setConvertingQuote(null);
            setLastSaleId(data.id);
            setIsSuccessModalOpen(true);
            queryClient.invalidateQueries({ queryKey: ["quotes"] });
            downloadTicket(data.id);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Error al convertir la cotización");
        }
    });

    const handleConvertClick = (quote: any) => {
        setConvertingQuote(quote);
        setIsPaymentModalOpen(true);
    };

    const confirmConversion = () => {
        if (!convertingQuote) return;
        convertMutation.mutate({ 
            quoteId: convertingQuote.id, 
            payment_method: paymentMethod 
        });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
            case 'accepted': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'converted': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'rejected': return 'bg-red-50 text-red-600 border-red-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'accepted': return 'Aceptada';
            case 'converted': return 'Convertida a Venta';
            case 'rejected': return 'Rechazada';
            default: return status;
        }
    };

    if (!hasPermission('quotes:view')) {
        return (
            <div className="flex justify-center p-8 bg-white rounded-[2rem]">
                <p className="text-gray-500">No tienes permisos para ver cotizaciones.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Cotizaciones</h1>
                    <p className="text-gray-500 text-sm">Gestiona los presupuestos emitidos a clientes</p>
                </div>
                <div className="flex flex-wrap gap-2 lg:gap-3">
                    <select
                        className="btn flex items-center gap-2 h-10 px-4 transition-all border shadow-sm rounded-xl text-xs uppercase tracking-widest font-bold bg-white border-gray-200 text-gray-600 hover:bg-white"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Filtrar: Todos</option>
                        <option value="pending">Pendiente</option>
                        <option value="converted">Convertida</option>
                        <option value="rejected">Rechazada</option>
                    </select>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text"
                    placeholder="Buscar por ID, cliente..."
                    className="input pl-12 h-12 text-base bg-white border-gray-100 shadow-xl shadow-gray-200/50 rounded-2xl focus:ring-primary-500 w-full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Cliente / Usuario</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Cargando cotizaciones...</td>
                                </tr>
                            ) : quotesData?.items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 italic">No se encontraron cotizaciones</td>
                                </tr>
                            ) : (
                                quotesData?.items.map((quote) => (
                                    <tr key={quote.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-gray-900">COT-{String(quote.id).padStart(5, '0')}</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {format(new Date(quote.created_at), 'dd/MM/yyyy HH:mm')}
                                            <div className="text-[10px] text-gray-400 mt-1">Válida hasta: {format(new Date(quote.valid_until), 'dd/MM/yyyy')}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{quote.customer ? quote.customer.name : 'Cliente Al Paso'}</div>
                                            <div className="text-xs text-gray-500">Generada por: {quote.user?.full_name || 'Desconocido'}</div>
                                        </td>
                                        <td className="px-6 py-4 font-black tracking-tight text-gray-900">
                                            ${quote.total_amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx("px-3 py-1 rounded-full text-xs font-bold border", getStatusStyle(quote.status))}>
                                                {getStatusLabel(quote.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {quote.status === 'pending' && (
                                                <button 
                                                    onClick={() => handleConvertClick(quote)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white rounded-lg text-xs font-bold transition-colors uppercase tracking-wider"
                                                >
                                                    <RefreshCcw className="h-3 w-3" /> Convertir a Venta
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination
                currentPage={page}
                totalPages={quotesData?.metadata?.total_pages || quotesData?.metadata?.pages || 0}
                onPageChange={setPage}
                totalItems={quotesData?.metadata?.total_items || quotesData?.metadata?.total}
            />

            {/* MODAL DE CONVERSIÓN (PAGO) */}
            {isPaymentModalOpen && convertingQuote && (
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)} />
                        <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Convertir a Venta</h3>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cotización #{convertingQuote.id}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                                        <X className="h-6 w-6 text-gray-300" />
                                    </button>
                                </div>

                                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 mb-8 flex justify-between items-center">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Monto Total</span>
                                    <span className="text-4xl font-black text-gray-900 tracking-tighter">${convertingQuote.total_amount.toLocaleString()}</span>
                                </div>

                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Método de Pago</h4>
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    {[
                                        { id: 'cash', name: 'Efectivo', icon: Banknote, color: 'emerald' },
                                        { id: 'card', name: 'Tarjeta', icon: CreditCard, color: 'blue' },
                                        { id: 'transfer', name: 'Transferencia', icon: ArrowRight, color: 'indigo' },
                                    ].map((method) => (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id as any)}
                                            className={clsx(
                                                "p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 active:scale-95",
                                                paymentMethod === method.id 
                                                    ? `bg-${method.color}-50/50 border-${method.color}-500 text-${method.color}-600 shadow-xl shadow-${method.color}-100` 
                                                    : "bg-white border-gray-50 text-gray-400 hover:border-gray-100"
                                            )}
                                        >
                                            <method.icon className="h-8 w-8" />
                                            <span className="text-xs font-black uppercase tracking-widest">{method.name}</span>
                                            {paymentMethod === method.id && (
                                                <div className={clsx(`h-2 w-2 rounded-full bg-${method.color}-500 animate-pulse`)} />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <button 
                                    onClick={confirmConversion}
                                    disabled={convertMutation.isPending}
                                    className="w-full h-16 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl shadow-xl shadow-primary-200/50 flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-sm transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {convertMutation.isPending ? "Procesando..." : (
                                        <>
                                            <CheckCircle2 className="h-5 w-5" />
                                            <span>Confirmar Venta</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE ÉXITO - VENTA COMPLETADA */}
            {isSuccessModalOpen && (
                <div className="fixed inset-0 z-[70] overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-white/90 backdrop-blur-md" />
                        <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden p-10 text-center border border-gray-100">
                            <div className="flex justify-center mb-6">
                                <div className="p-6 bg-emerald-50 text-emerald-500 rounded-full animate-bounce">
                                    <CheckCircle2 className="h-16 w-16" />
                                </div>
                            </div>
                            
                            <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">¡Venta Exitosa!</h3>
                            <p className="text-gray-500 font-medium mb-10">La cotización se convirtió a venta y el inventario ha sido actualizado.</p>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => lastSaleId && downloadTicket(lastSaleId)}
                                    className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-100 transition-all active:scale-95"
                                >
                                    <Receipt className="h-6 w-6" />
                                    Imprimir Boleta / Ticket
                                </button>
                                
                                <button 
                                    onClick={() => {
                                        setIsSuccessModalOpen(false);
                                        setLastSaleId(null);
                                    }}
                                    className="w-full h-16 bg-white border border-gray-100 hover:bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
