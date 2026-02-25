import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import {
  TrendingDown,
  ShieldCheck,
  PlusCircle,
  Download,
  X,
  Building2,
  Wallet,
  ShoppingBag,
  ArrowUpRight,
  CreditCard
} from 'lucide-react'
import clsx from "clsx";
import toast from "react-hot-toast";
import SalesTrendsChart from "@/components/charts/SalesTrendsChart";
import TopSellingProductsChart from "@/components/charts/TopSellingProductsChart";
import CategoryValueChart from "@/components/charts/CategoryValueChart";
import SupplierDistributionChart from "@/components/charts/SupplierDistributionChart";
import UserActivityChart from "@/components/charts/UserActivityChart";
import DateRangePicker from "@/components/common/DateRangePicker";

import type { Category, PaginatedResponse } from "@/types";

export default function Dashboard() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [exportFilters, setExportFilters] = useState({
    category_id: "",
    supplier_id: "",
    status: "all",
  });

  const { data: categoriesData } = useQuery<PaginatedResponse<Category>>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/api/v1/categories/");
      return response.data;
    },
  });
  const categories = categoriesData?.items || [];


  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.start) params.append("start_date", dateRange.start);
      if (dateRange.end) params.append("end_date", dateRange.end);
      const response = await api.get(`/api/v1/reports/dashboard?${params.toString()}`);
      return response.data;
    },
  });

  const handleDownloadExcel = async () => {
    const toastId = toast.loading("Generando Excel filtrado...");
    try {
      const params = new URLSearchParams();
      if (exportFilters.category_id)
        params.append("category_id", exportFilters.category_id);
      if (exportFilters.supplier_id)
        params.append("supplier_id", exportFilters.supplier_id);
      if (exportFilters.status !== "all") {
        params.append(
          "is_active",
          exportFilters.status === "active" ? "true" : "false",
        );
      }

      const response = await api.get(
        `/api/v1/reports/inventory-excel?${params.toString()}`,
        {
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Reporte_Inventario_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Excel generado con éxito", { id: toastId });
      setIsExportModalOpen(false);
    } catch (error) {
      toast.error("Error al generar el Excel", { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-10 antialiased">
      {/* Header section with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40 p-6 rounded-3xl border border-white/60 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Analítica y control de operaciones en tiempo real
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker 
            startDate={dateRange.start} 
            endDate={dateRange.end} 
            onChange={setDateRange}
            className="bg-white/80 p-1.5 rounded-2xl shadow-sm border border-gray-100"
          />
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="h-12 px-6 bg-slate-900 hover:bg-black text-white rounded-2xl flex items-center gap-2 group shadow-xl shadow-slate-200 transition-all font-bold uppercase tracking-widest text-[10px]"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            Reporte Ejecutivo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-8">
          {/* Main Profitability Cards */}
          <section>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-1 flex items-center gap-2">
              <div className="h-1 w-4 bg-indigo-500 rounded-full"></div>
              Rendimiento Comercial (Últimos 30 días)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card bg-white border-none shadow-xl shadow-indigo-100/50 flex flex-col p-6 group hover:scale-[1.02] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                </div>
                <span className="text-2xl font-black text-gray-900 tracking-tighter">
                  ${dashboard?.stats?.total_revenue?.toLocaleString()}
                </span>
                <span className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-wider">
                  Ingresos por Ventas
                </span>
              </div>

              <div className="card bg-white border-none shadow-xl shadow-emerald-100/50 flex flex-col p-6 group hover:scale-[1.02] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg font-bold">SALE</span>
                </div>
                <span className="text-2xl font-black text-gray-900 tracking-tighter">
                  {dashboard?.stats?.sales_count || 0}
                </span>
                <span className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-wider">
                  Ventas Realizadas
                </span>
              </div>

              <div className="card bg-white border-none shadow-xl shadow-amber-100/50 flex flex-col p-6 group hover:scale-[1.02] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <TrendingDown className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Alerte</span>
                </div>
                <span className="text-2xl font-black text-gray-900 tracking-tighter">
                  {dashboard?.stats?.low_stock_count || 0}
                </span>
                <span className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-wider">
                  Stock Crítico
                </span>
              </div>

              <div className="card bg-white border-none shadow-xl shadow-slate-100/50 flex flex-col p-6 group hover:scale-[1.02] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl group-hover:bg-slate-600 group-hover:text-white transition-colors">
                    <CreditCard className="h-6 w-6" />
                  </div>
                </div>
                <span className="text-2xl font-black text-gray-900 tracking-tighter">
                  ${dashboard?.stats?.total_inventory_value?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-wider">
                  Valor Stock
                </span>
              </div>
            </div>
          </section>

          {/* Sales Trends and Best Selling */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card border-none shadow-2xl shadow-gray-200/50 p-8">
              <div className="mb-8">
                <h3 className="text-lg font-black text-gray-900 leading-tight uppercase tracking-tight">Tendencia de Ventas</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Ingresos de la última semana</p>
              </div>
              <div className="h-[250px]">
                <SalesTrendsChart data={dashboard?.sales_trends || []} />
              </div>
            </div>

            <div className="card border-none shadow-2xl shadow-gray-200/50 p-8">
              <div className="mb-8">
                <h3 className="text-lg font-black text-gray-900 leading-tight uppercase tracking-tight">Más Vendidos</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Top productos por unidades vendidas</p>
              </div>
              <div className="h-[250px]">
                <TopSellingProductsChart data={dashboard?.top_selling_products || []} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card border-none shadow-2xl shadow-gray-200/50 p-8 bg-white/80 backdrop-blur-sm">
                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
                    <PlusCircle className="h-5 w-5 text-emerald-500" />
                    Movimientos Recientes
                </h3>
                <div className="space-y-4">
                    {dashboard?.recent_movements?.slice(0, 5).map((m: any) => (
                        <div key={m.id} className="flex items-center justify-between group p-3 hover:bg-gray-50 rounded-2xl transition-all border border-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className={clsx(
                                    "h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm",
                                    m.type === "entry" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                )}>
                                    {m.type === "entry" ? "IN" : "OUT"}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{m.product_name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(m.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={clsx("text-sm font-black", m.quantity > 0 ? "text-emerald-600" : "text-rose-600")}>
                                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-rows-2 gap-6">
                <div className="card border-none bg-white shadow-xl shadow-gray-200/50 p-8 hover:shadow-2xl transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Stock por Proveedor</h3>
                        <Building2 className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="h-[150px]">
                        <SupplierDistributionChart data={dashboard?.supplier_distribution || []} />
                    </div>
                </div>
                <div className="card border-none bg-white shadow-xl shadow-gray-200/50 p-8 hover:shadow-2xl transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Operadores</h3>
                        <ShieldCheck className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="h-[150px]">
                        <UserActivityChart data={dashboard?.user_activity || []} />
                    </div>
                </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card bg-slate-900 border-none shadow-2xl text-white relative overflow-hidden p-8">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Kardex Summary</h3>
            <div className="space-y-6">
                <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Entradas Totales</span>
                    <p className="text-2xl font-black text-emerald-400 mt-1">+{dashboard?.stats?.entries_count || 0}</p>
                </div>
                <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Salidas Totales</span>
                    <p className="text-2xl font-black text-rose-400 mt-1">-{dashboard?.stats?.exits_count || 0}</p>
                </div>
                <div className="pt-6 border-t border-white/5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Valorización Médiana</span>
                    <p className="text-2xl font-black text-white mt-1">${(dashboard?.stats?.total_inventory_value / (dashboard?.stats?.total_products || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}/unit</p>
                </div>
            </div>
          </div>

          <div className="card border-none shadow-xl shadow-gray-200/50 p-8">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Valor por Categoría</h3>
            <div className="h-[250px]">
              <CategoryValueChart data={dashboard?.category_distribution || []} />
            </div>
          </div>
        </div>
      </div>

      {isExportModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsExportModalOpen(false)} />
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 border border-gray-100 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16" />
                <div className="relative">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Exportar Datos</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Configuración del reporte</p>
                        </div>
                        <button onClick={() => setIsExportModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-all">
                            <X className="h-6 w-6 text-gray-400" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-2 ml-1">Categoría</label>
                            <select 
                                className="w-full h-14 bg-gray-50 border-gray-100 rounded-2xl px-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                                value={exportFilters.category_id}
                                onChange={(e) => setExportFilters({ ...exportFilters, category_id: e.target.value })}
                            >
                                <option value="">Todas las categorías</option>
                                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-2 ml-1">Estado</label>
                            <div className="grid grid-cols-3 gap-2">
                                {["all", "active", "inactive"].map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => setExportFilters({ ...exportFilters, status: s })}
                                        className={clsx(
                                            "h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                            exportFilters.status === s ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                                        )}
                                    >
                                        {s === "all" ? "Todos" : s === "active" ? "Activos" : "Inactivos"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleDownloadExcel}
                            className="w-full h-16 bg-slate-900 hover:bg-black text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-200 transition-all active:scale-95"
                        >
                            <Download className="h-5 w-5" />
                            Generar Reporte (.xlsx)
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
