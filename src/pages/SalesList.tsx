import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import toast from "react-hot-toast";
import { 
    Receipt, Trash2, Eye, FileDown, 
    CheckCircle2, XCircle, ShoppingBag,
    Filter, RefreshCcw, MoreHorizontal, X,
    Search, FileText, AlertTriangle
} from 'lucide-react'
import type { Sale, PaginatedResponse } from "@/types";
import Pagination from "@/components/common/Pagination";
import DateRangePicker from "@/components/common/DateRangePicker";
import clsx from "clsx";
import { 
    AreaChart, Area, XAxis, YAxis, 
    CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { User as UserIcon } from 'lucide-react';

export default function SalesList() {
    const [page, setPage] = useState(1);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("");
    const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("");
    const [filterSellerId, setFilterSellerId] = useState<string>("");
    const [search, setSearch] = useState("");
    const [isFiltersVisible, setIsFiltersVisible] = useState(false);
    
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const queryClient = useQueryClient();

    const handleExportExcel = async () => {
        const toastId = toast.loading("Generando Excel de ventas...");
        try {
            const params = new URLSearchParams({
                ...(startDate && { start_date: startDate }),
                ...(endDate && { end_date: endDate }),
                ...(filterStatus && { status: filterStatus }),
                ...(filterPaymentMethod && { payment_method: filterPaymentMethod }),
            });
            const response = await api.get(`/api/v1/reports/sales-excel?${params}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Ventas_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Excel descargado correctamente", { id: toastId });
        } catch (err) {
            toast.error("Error al exportar a Excel", { id: toastId });
        }
    };

    const handleExportPDF = async () => {
        const toastId = toast.loading("Generando Reporte PDF...");
        try {
            const params = new URLSearchParams({
                ...(startDate && { start_date: startDate }),
                ...(endDate && { end_date: endDate }),
                ...(filterStatus && { status: filterStatus }),
                ...(filterPaymentMethod && { payment_method: filterPaymentMethod }),
                ...(search && { search }),
            });
            const response = await api.get(`/api/v1/reports/sales-pdf?${params}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Reporte_Ventas_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Reporte descargado correctamente", { id: toastId });
        } catch (err) {
            toast.error("Error al exportar a PDF", { id: toastId });
        }
    };

    // Resetear a la página 1 cuando cambian los filtros
    useEffect(() => {
        setPage(1);
    }, [startDate, endDate, filterStatus, filterPaymentMethod, search, filterSellerId]);

    // 1. Cargar Historial de Ventas
    const { data: salesData, isLoading, refetch } = useQuery<PaginatedResponse<Sale>>({
        queryKey: ["sales", page, startDate, endDate, filterStatus, filterPaymentMethod, search],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                size: "10",
                ...(startDate && { start_date: startDate }),
                ...(endDate && { end_date: endDate }),
                ...(filterStatus && { status: filterStatus }),
                ...(filterPaymentMethod && { payment_method: filterPaymentMethod }),
                ...(search && { search }),
                ...(filterSellerId && { seller_id: filterSellerId }),
            });
            const response = await api.get(`/api/v1/sales/?${params}`);
            return response.data;
        },
    });

    // 1.1 Cargar Estadísticas y Tendencias
    const { data: statsData, isLoading: isLoadingStats } = useQuery({
        queryKey: ["sales-stats", startDate, endDate, filterStatus, filterPaymentMethod, search, filterSellerId],
        queryFn: async () => {
            const params = new URLSearchParams({
                ...(startDate && { start_date: startDate }),
                ...(endDate && { end_date: endDate }),
                ...(filterStatus && { status: filterStatus }),
                ...(filterPaymentMethod && { payment_method: filterPaymentMethod }),
                ...(search && { search }),
                ...(filterSellerId && { seller_id: filterSellerId }),
            });
            const response = await api.get(`/api/v1/reports/sales-history-stats?${params}`);
            return response.data;
        },
    });

    // 2. Mutación para Anular Venta
    const annulMutation = useMutation({
        mutationFn: async (saleId: number) => {
            const response = await api.post(`/api/v1/sales/${saleId}/annul`);
            return response.data;
        },
        onSuccess: () => {
            toast.success("Venta anulada correctamente");
            queryClient.invalidateQueries({ queryKey: ["sales"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setIsDetailsModalOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Error al anular la venta");
        }
    });

    const downloadTicket = async (saleId: number) => {
        const toastId = toast.loading("Generando ticket...");
        try {
            const response = await api.get(`/api/v1/sales/${saleId}/ticket`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Ticket_${saleId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Ticket descargado", { id: toastId });
        } catch (err) {
            toast.error("Error al descargar ticket", { id: toastId });
        }
    };

    const handleViewDetails = (sale: Sale) => {
        setSelectedSale(sale);
        setIsDetailsModalOpen(true);
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <CheckCircle2 className="h-3 w-3" />
                        Completada
                    </span>
                );
            case 'annulled':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <XCircle className="h-3 w-3" />
                        Anulada
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 antialiased pb-10">
            {/* Header con Estilo Premium */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100">
                            <ShoppingBag className="h-6 w-6" />
                        </div>
                        Historial de Ventas
                    </h2>
                    <p className="text-gray-500 font-medium mt-1">Gestiona y consulta todas las transacciones realizadas.</p>
                </div>

                <div className="flex-1 max-w-xl group relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Buscar por ID de venta o nombre de producto..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-14 pl-14 pr-6 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                        className={clsx(
                            "h-14 px-5 bg-white border rounded-2xl text-gray-500 font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm",
                            (startDate || endDate || filterStatus || filterPaymentMethod || search) 
                                ? "border-indigo-200 bg-indigo-50 text-indigo-600" 
                                : "border-gray-100 hover:bg-gray-50"
                        )}
                    >
                        <Filter className="h-4 w-4" />
                        Filtros
                        {(startDate || endDate || filterStatus || filterPaymentMethod || search) && (
                            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                        )}
                    </button>
                    <button 
                        onClick={() => {
                            queryClient.invalidateQueries({ queryKey: ["sales"] });
                            refetch();
                        }}
                        className="h-14 w-14 bg-white border border-gray-100 rounded-2xl text-gray-500 hover:text-indigo-600 transition-all flex items-center justify-center shadow-sm"
                    >
                        <RefreshCcw className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* KPIs / Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden group hover:scale-[1.02] transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        <ShoppingBag className="h-16 w-16 text-indigo-600" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Artículos Vendidos</p>
                    <h4 className="text-3xl font-black text-gray-900 tracking-tighter">
                        {isLoadingStats ? "..." : (statsData?.total_items ?? 0)}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">Salida Inventario</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden group hover:scale-[1.02] transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        <Receipt className="h-16 w-16 text-emerald-600" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Utilidad Bruta</p>
                    <h4 className="text-3xl font-black text-gray-900 tracking-tighter">
                        {isLoadingStats ? "..." : `$${(statsData?.estimated_profit ?? 0).toLocaleString()}`}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Margen: {(statsData?.profit_margin ?? 0).toFixed(1)}%</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden group hover:scale-[1.02] transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        <Filter className="h-16 w-16 text-orange-600" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ticket Promedio</p>
                    <h4 className="text-3xl font-black text-gray-900 tracking-tighter">
                        {isLoadingStats ? "..." : `$${(statsData?.avg_sale ?? 0).toFixed(2)}`}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase">Promedio</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden group hover:scale-[1.02] transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        <CheckCircle2 className="h-16 w-16 text-blue-600" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Producto Estrella</p>
                    <h4 className="text-xl font-black text-gray-900 tracking-tight truncate pr-8">
                        {isLoadingStats ? "..." : (statsData?.top_product ?? "N/A")}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">Más Vendido</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gráfico de Tendencia */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-2xl shadow-gray-200/30 overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-gray-900 tracking-tight">Tendencia de Ventas</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Actividad económica en el tiempo</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] animate-pulse" />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">En Vivo</span>
                        </div>
                    </div>

                    <div className="h-[250px] w-full">
                        {isLoadingStats ? (
                            <div className="h-full w-full bg-gray-50/50 animate-pulse rounded-2xl" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={statsData?.trends || []}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 10, fontWeight: 900, fill: '#9ca3af'}}
                                        dy={10}
                                        tickFormatter={(val) => {
                                            if (!val) return "";
                                            const d = new Date(val);
                                            return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
                                        }}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 10, fontWeight: 900, fill: '#9ca3af'}}
                                        dx={-10}
                                        tickFormatter={(val) => `$${val}`}
                                    />
                                    <Tooltip 
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-white p-4 rounded-2xl shadow-2xl border border-gray-50">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                            {new Date(payload[0].payload.date).toLocaleDateString()}
                                                        </p>
                                                        <p className="text-lg font-black text-indigo-600">
                                                            ${Number(payload[0].value).toLocaleString()}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-gray-500">
                                                            {payload[0].payload.count} Ventas realizadas
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        stroke="#6366f1" 
                                        strokeWidth={4} 
                                        fillOpacity={1} 
                                        fill="url(#colorRevenue)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Gráfico de Métodos de Pago */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-2xl shadow-gray-200/30 overflow-hidden">
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">Métodos de Pago</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Distribución de ingresos</p>
                    
                    <div className="h-[200px] w-full relative">
                        {isLoadingStats ? (
                            <div className="h-full w-full bg-gray-50/50 animate-pulse rounded-2xl" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statsData?.payment_distribution || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statsData?.payment_distribution?.map((entry: any, index: number) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={
                                                    entry.name === 'cash' ? '#10b981' : 
                                                    entry.name === 'card' ? '#6366f1' : 
                                                    entry.name === 'transfer' ? '#f59e0b' : '#94a3b8'
                                                } 
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                         content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-50">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                            {payload[0].name.toUpperCase()}
                                                        </p>
                                                        <p className="text-sm font-black text-gray-900">
                                                            ${Number(payload[0].value).toLocaleString()}
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {statsData?.payment_distribution?.map((p: any) => (
                            <div key={p.name} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50">
                                <span className={clsx(
                                    "h-2 w-2 rounded-full",
                                    p.name === 'cash' ? 'bg-emerald-500' : 
                                    p.name === 'card' ? 'bg-indigo-500' : 
                                    p.name === 'transfer' ? 'bg-orange-500' : 'bg-slate-400'
                                )} />
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter truncate">
                                    {p.name}: ${p.value.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Widget de Stock Bajo */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-2xl shadow-gray-200/30">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 tracking-tight">Alertas de Stock</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Productos por agotar</p>
                    </div>
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                </div>

                <div className="space-y-4">
                    {isLoadingStats ? (
                        [1, 2, 3].map(i => <div key={i} className="h-14 w-full bg-gray-50 animate-pulse rounded-2xl" />)
                    ) : statsData?.low_stock_items?.length > 0 ? (
                        statsData.low_stock_items.map((item: any) => (
                            <div key={item.id} className="group p-4 rounded-[1.5rem] bg-gray-50/50 border border-transparent hover:border-rose-100 hover:bg-white transition-all flex items-center justify-between">
                                <div className="flex-1 min-w-0 pr-4">
                                    <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tight">{item.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-rose-500 rounded-full" 
                                                style={{ width: `${Math.min((item.stock / item.min_stock) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-black text-rose-600">{item.stock} / {item.min_stock}</span>
                                    </div>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                                    <RefreshCcw className="h-4 w-4 text-gray-300 group-hover:text-indigo-600" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center bg-emerald-50/50 rounded-[2rem] border border-emerald-100/50">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                            <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">Stock Saludable</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Filtros Avanzados (Estilo según referencia) */}
            {isFiltersVisible && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div 
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
                        onClick={() => setIsFiltersVisible(false)} 
                    />
                    
                    <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl shadow-slate-900/20 overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300">
                        {/* Header Modal */}
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Filter className="h-6 w-6" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Filtros Avanzados</h3>
                            </div>
                            <button 
                                onClick={() => setIsFiltersVisible(false)} 
                                className="p-2 hover:bg-gray-50 rounded-xl transition-all group"
                            >
                                <X className="h-8 w-8 text-gray-200 group-hover:text-gray-400" />
                            </button>
                        </div>

                        {/* Contenido Modal */}
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Estado */}
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Estado de Venta</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: '', label: 'TODOS' },
                                            { id: 'completed', label: 'COMPLETADA' },
                                            { id: 'annulled', label: 'ANULADA' }
                                        ].map((s) => (
                                            <button
                                                key={s.id}
                                                onClick={() => setFilterStatus(s.id)}
                                                className={clsx(
                                                    "h-12 px-2 rounded-xl text-[11px] font-black transition-all border uppercase tracking-widest",
                                                    filterStatus === s.id 
                                                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" 
                                                        : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50 hover:border-indigo-200"
                                                )}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Método de Pago */}
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Método de Pago</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: '', label: 'TODOS' },
                                            { id: 'cash', label: 'EFECTIVO' },
                                            { id: 'card', label: 'TARJETA' },
                                            { id: 'transfer', label: 'TRANSFERENCIA' }
                                        ].map((p) => (
                                            <button
                                                key={p.id}
                                                onClick={() => setFilterPaymentMethod(p.id)}
                                                className={clsx(
                                                    "h-12 px-2 rounded-xl text-[11px] font-black transition-all border uppercase tracking-widest",
                                                    filterPaymentMethod === p.id 
                                                        ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-100" 
                                                        : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50 hover:border-slate-300"
                                                )}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Vendedor */}
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Filtrar por Vendedor</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setFilterSellerId("")}
                                        className={clsx(
                                            "h-12 px-2 rounded-xl text-[11px] font-black transition-all border uppercase tracking-widest flex items-center justify-center gap-2",
                                            filterSellerId === "" 
                                                ? "bg-indigo-600 border-indigo-600 text-white" 
                                                : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50"
                                        )}
                                    >
                                        TODOS
                                    </button>
                                    {statsData?.sellers?.map((s: any) => (
                                        <button
                                            key={s.id}
                                            onClick={() => setFilterSellerId(s.id.toString())}
                                            className={clsx(
                                                "h-12 px-2 rounded-xl text-[11px] font-black transition-all border uppercase tracking-widest flex items-center justify-center gap-2",
                                                filterSellerId === s.id.toString()
                                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" 
                                                    : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50 hover:border-indigo-200"
                                            )}
                                        >
                                            <UserIcon className="h-3 w-3" />
                                            {s.email}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Rango de Fechas */}
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Rango de Registro</label>
                                <DateRangePicker 
                                    startDate={startDate}
                                    endDate={endDate}
                                    onChange={({ start, end }) => {
                                        setStartDate(start);
                                        setEndDate(end);
                                    }}
                                    className="!gap-6"
                                />
                            </div>
                        </div>

                        {/* Footer Modal */}
                        <div className="px-8 py-8 bg-gray-50/50 border-t border-gray-100 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <button 
                                    onClick={handleExportExcel}
                                    className="w-full h-14 bg-[#009d71] text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.1em] text-[10px] hover:bg-[#008661] transition-all shadow-lg shadow-emerald-200 active:scale-[0.98]"
                                >
                                    <FileDown className="h-5 w-5" />
                                    Exportar Excel
                                </button>
                                <button 
                                    onClick={handleExportPDF}
                                    className="w-full h-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.1em] text-[10px] hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 active:scale-[0.98]"
                                >
                                    <FileText className="h-5 w-5" />
                                    Reporte PDF
                                </button>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => {
                                        setStartDate("");
                                        setEndDate("");
                                        setFilterStatus("");
                                        setFilterPaymentMethod("");
                                        setFilterSellerId("");
                                        setSearch("");
                                    }}
                                    className="flex-1 h-14 bg-white border border-gray-200 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all"
                                >
                                    Limpiar Filtros
                                </button>
                                <button 
                                    onClick={() => setIsFiltersVisible(false)}
                                    className="flex-[1.5] h-14 bg-[#0088cc] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#0077b3] transition-all shadow-lg shadow-blue-100 active:scale-[0.98]"
                                >
                                    Aplicar Filtros
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabla de Ventas Premium */}
            <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-2xl shadow-gray-200/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">ID Venta</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Fecha</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Vendedor</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Método</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4 h-16 bg-white"></td>
                                    </tr>
                                ))
                            ) : salesData?.items.map((sale) => (
                                <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-black text-gray-900 font-mono tracking-tighter">#{sale.id}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-700">
                                                {new Date(sale.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="h-7 w-7 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600 border border-indigo-100 uppercase">
                                                {sale.user?.email?.[0] || 'U'}
                                            </div>
                                            <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">
                                                {sale.user?.email ? sale.user.email.split('@')[0] : 'Sistema'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{sale.payment_method}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-lg font-black text-gray-900 tracking-tighter">
                                            ${Number(sale.total_amount).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        {statusBadge(sale.status)}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleViewDetails(sale)}
                                                className="p-2.5 bg-white border border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100 rounded-xl shadow-sm transition-all"
                                                title="Ver Detalles"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => downloadTicket(sale.id)}
                                                className="p-2.5 bg-white border border-gray-100 text-gray-400 hover:text-emerald-600 hover:border-emerald-100 rounded-xl shadow-sm transition-all"
                                                title="Descargar Ticket"
                                            >
                                                <Receipt className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <button className="md:hidden p-2 text-gray-400">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {salesData && salesData.pages > 1 && (
                    <div className="p-6 border-t border-gray-50 bg-gray-50/30">
                        <Pagination 
                            currentPage={page}
                            totalPages={salesData.pages}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </div>

            {/* MODAL DE DETALLES Y ANULACIÓN */}
            {isDetailsModalOpen && selectedSale && (
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setIsDetailsModalOpen(false)} />
                        <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100">
                            {/* Header del Modal */}
                            <div className="px-8 py-8 border-b border-gray-50 bg-white flex items-center justify-between sticky top-0 z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                        <Receipt className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Venta #{selectedSale.id}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {statusBadge(selectedSale.status)}
                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">•</span>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                {new Date(selectedSale.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-all group">
                                    <XCircle className="h-8 w-8 text-gray-200 group-hover:text-gray-400" />
                                </button>
                            </div>

                            {/* Contenido del Modal */}
                            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                {/* Lista de Items */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Productos en la Venta</label>
                                    <div className="space-y-3">
                                        {selectedSale.items.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-indigo-400 shadow-sm border border-gray-100">
                                                        <span className="text-[10px] font-black uppercase tracking-tighter">x{item.quantity}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{item.product?.name || 'Producto Eliminado'}</p>
                                                        <p className="text-[10px] font-bold text-indigo-600 font-mono tracking-widest">SKU: {item.product?.sku || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-gray-900">${Number(item.subtotal).toLocaleString()}</p>
                                                    <p className="text-[10px] font-bold text-gray-400">Unit: ${Number(item.unit_price).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Resumen Financiero */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Resumen de Pago</p>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center opacity-60">
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Método</span>
                                                <span className="text-xs font-black uppercase">{selectedSale.payment_method}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-t border-white/5">
                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Total Final</span>
                                                <span className="text-2xl font-black tracking-tighter">${Number(selectedSale.total_amount).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Notas de la Venta</p>
                                        <p className="text-sm font-medium text-gray-600 italic">
                                            {selectedSale.notes || 'Sin notas adicionales para esta venta.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer con Acciones Críticas */}
                            <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-3">
                                <button 
                                    onClick={() => downloadTicket(selectedSale.id)}
                                    className="flex-1 h-16 bg-white border border-gray-200 text-gray-600 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-all shadow-sm"
                                >
                                    <FileDown className="h-5 w-5" />
                                    Descargar Ticket
                                </button>
                                
                                {selectedSale.status === 'completed' && (
                                    <button 
                                        onClick={() => {
                                            if (confirm("¿Estás seguro de que deseas anular esta venta? El stock será devuelto al inventario automáticamente.")) {
                                                annulMutation.mutate(selectedSale.id);
                                            }
                                        }}
                                        disabled={annulMutation.isPending}
                                        className="h-16 px-8 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {annulMutation.isPending ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                                        Anular Venta
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
