import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import {
  TrendingDown,
  ShieldCheck,
  PlusCircle,
  MinusCircle,
  Download,
  Filter,
  X,
  Layers,
  Building2,
} from 'lucide-react'
import clsx from "clsx";
import toast from "react-hot-toast";
import MovementTrendsChart from "@/components/charts/MovementTrendsChart";
import CategoryValueChart from "@/components/charts/CategoryValueChart";
import TopProductsChart from "@/components/charts/TopProductsChart";
import SupplierDistributionChart from "@/components/charts/SupplierDistributionChart";
import UserActivityChart from "@/components/charts/UserActivityChart";
import TopMovingProductsChart from "@/components/charts/TopMovingProductsChart";
import DateRangePicker from "@/components/common/DateRangePicker";

import type { Category, Supplier, PaginatedResponse } from "@/types";

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

  const { data: suppliersData } = useQuery<PaginatedResponse<Supplier>>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await api.get("/api/v1/suppliers/");
      return response.data;
    },
  });
  const suppliers = suppliersData?.items || [];

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
    <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
      {/* Header section with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40 p-6 rounded-3xl border border-white/60 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Panel de Control
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Monitoriza tus KPIs y movimientos en tiempo real
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker 
            startDate={dateRange.start} 
            endDate={dateRange.end} 
            onChange={setDateRange}
            className="bg-white/80 p-1.5 rounded-2xl shadow-sm border border-gray-100"
          />
          <div className="h-10 w-[1px] bg-gray-200 mx-2 hidden lg:block"></div>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="btn btn-primary bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2 group shadow-xl shadow-slate-200 border-none h-12 px-6 rounded-2xl"
          >
            <ShieldCheck className="h-5 w-5 group-hover:rotate-12 transition-transform text-primary-400" />
            <span className="font-bold hidden md:inline">Reporte Ejecutivo</span>
            <span className="font-bold md:hidden">Exportar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Content Area (3/4 on large screens) */}
        <div className="xl:col-span-3 space-y-8">
          {/* Sales Activity Style Cards */}
          <section>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-1 flex items-center gap-2">
              <div className="h-1 w-4 bg-primary-500 rounded-full"></div>
              Rentabilidad y Volumen
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card zoho-card-blue flex flex-col items-center justify-center py-8 hover:scale-[1.02] cursor-default">
                <span className="text-3xl font-black text-blue-700">
                  {dashboard?.stats?.entries_count || 0}
                </span>
                <span className="text-xs font-bold text-blue-600/70 uppercase mt-2 tracking-wider">
                  Entradas
                </span>
              </div>
              <div className="card zoho-card-pink flex flex-col items-center justify-center py-8 hover:scale-[1.02] cursor-default">
                <span className="text-3xl font-black text-red-700">
                  {dashboard?.stats?.exits_count || 0}
                </span>
                <span className="text-xs font-bold text-red-600/70 uppercase mt-2 tracking-wider">
                  Salidas
                </span>
              </div>
              <div className="card zoho-card-yellow flex flex-col items-center justify-center py-8 hover:scale-[1.02] cursor-default">
                <span className="text-3xl font-black text-amber-700">
                  {dashboard?.stats?.low_stock_count || 0}
                </span>
                <span className="text-xs font-bold text-amber-600/70 uppercase mt-2 tracking-wider">
                  Bajo Stock
                </span>
              </div>
              <div className="card zoho-card-green flex flex-col items-center justify-center py-8 hover:scale-[1.02] cursor-default">
                <span className="text-3xl font-black text-emerald-700">
                  {dashboard?.stats?.total_products || 0}
                </span>
                <span className="text-xs font-bold text-emerald-600/70 uppercase mt-2 tracking-wider">
                  Productos
                </span>
              </div>
            </div>
          </section>

          {/* Charts and Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card overflow-hidden border-none shadow-xl shadow-gray-100/50">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-gray-900 leading-tight uppercase tracking-tight">
                    Flujo de Mercadería
                  </h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                    Tendencia de entradas y salidas
                  </p>
                </div>
                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                      Ingresos
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]"></div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                      Egresos
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-[250px] w-full">
                <MovementTrendsChart data={dashboard?.trends || []} />
              </div>
            </div>

            <div className="card flex flex-col hover:shadow-lg transition-shadow border-none bg-white/80 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6 px-1 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-primary-500" />
                Movimientos Críticos
              </h3>
              <div className="flex-1 space-y-4">
                {dashboard?.recent_movements?.slice(0, 5).map((m: any) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between group p-3 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={clsx(
                          "h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
                          m.type === "entry"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-rose-50 text-rose-600",
                        )}
                      >
                        {m.type === "entry" ? (
                          <PlusCircle className="h-6 w-6" />
                        ) : (
                          <MinusCircle className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">
                          {m.product_name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                          {new Date(m.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={clsx(
                          "text-base font-black tracking-tight",
                          m.quantity > 0 ? "text-emerald-600" : "text-rose-600",
                        )}
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">
                        unidades
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* New Interactive Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
             <div className="card border-none bg-white shadow-xl shadow-gray-200/50 p-8 hover:shadow-2xl transition-all group">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Stock por Proveedor</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Distribución física de unidades</p>
                  </div>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:rotate-12 transition-transform">
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>
                <SupplierDistributionChart data={dashboard?.supplier_distribution || []} />
             </div>

             <div className="card border-none bg-white shadow-xl shadow-gray-200/50 p-8 hover:shadow-2xl transition-all group">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Actividad de Usuarios</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Movimientos registrados por operador</p>
                  </div>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:rotate-12 transition-transform">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>
                <UserActivityChart data={dashboard?.user_activity || []} />
             </div>
          </div>

          {/* New Chart Section: Top Moving Products */}
          <div className="mt-6">
            <div className="card border-none bg-white shadow-xl shadow-gray-200/50 p-8 hover:shadow-2xl transition-all group">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">
                    Productos con más Movimiento
                  </h3>
                  <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">
                    Top 10 items con mayor rotación en el periodo
                  </p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <TrendingDown className="h-6 w-6" />
                </div>
              </div>
              <div className="h-[350px]">
                <TopMovingProductsChart data={dashboard?.top_moving_products || []} />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Summary (1/4 on large screens) */}
        <div className="space-y-6">
          <div className="card bg-slate-900 border-none shadow-2xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary-500/20 transition-colors"></div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2 relative z-10">
              <div className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse"></div>
              Resumen Económico
            </h3>

            <div className="space-y-8 relative z-10">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Valor Total Activos
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-600">$</span>
                  <p className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
                    {dashboard?.stats?.total_inventory_value?.toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                    )}
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 grid grid-cols-1 gap-5">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                    Categorías
                  </span>
                  <span className="text-xs font-black text-white px-3 py-1 bg-slate-800 rounded-lg border border-slate-700">
                    {dashboard?.category_distribution?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                    Entradas (Periodo)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-400">
                      +{dashboard?.stats?.entries_count || 0}
                    </span>
                    <PlusCircle className="h-4 w-4 text-emerald-500/50" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                    Salidas (Periodo)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-rose-400">
                      -{dashboard?.stats?.exits_count || 0}
                    </span>
                    <MinusCircle className="h-4 w-4 text-rose-500/50" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-dashed border-2 border-gray-200 bg-transparent flex flex-col items-center justify-center py-10 text-center group cursor-pointer hover:border-primary-300 transition-all">
            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
              <PlusCircle className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-700">Nuevo Ajuste</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-[150px]">
              Registrar entrada o salida rápida de mercadería
            </p>
          </div>

          <div className="card">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 px-1">
              Distribución por Valor
            </h3>
            <div className="h-[200px]">
              <CategoryValueChart
                data={dashboard?.category_distribution || []}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Modal de Filtros para Exportación */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm"
              onClick={() => setIsExportModalOpen(false)}
            />
            <div className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-md border border-gray-100">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
                      <Filter className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 leading-tight">
                        Exportar Inventario
                      </h3>
                      <p className="text-sm text-gray-400 font-medium">
                        Personaliza los datos del reporte
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsExportModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5">
                      <Layers className="h-3 w-3" /> Categoría
                    </label>
                    <select
                      className="input h-12 bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                      value={exportFilters.category_id}
                      onChange={(e) =>
                        setExportFilters({
                          ...exportFilters,
                          category_id: e.target.value,
                        })
                      }
                    >
                      <option value="">Todas las categorías</option>
                      {categories?.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5">
                      <Building2 className="h-3 w-3" /> Proveedor
                    </label>
                    <select
                      className="input h-12 bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                      value={exportFilters.supplier_id}
                      onChange={(e) =>
                        setExportFilters({
                          ...exportFilters,
                          supplier_id: e.target.value,
                        })
                      }
                    >
                      <option value="">Todos los proveedores</option>
                      {suppliers.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3" /> Estado del Producto
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "all", label: "Todos" },
                        { id: "active", label: "Activos" },
                        { id: "inactive", label: "Inactivos" },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() =>
                            setExportFilters({ ...exportFilters, status: s.id })
                          }
                          className={clsx(
                            "h-11 rounded-xl text-xs font-bold border transition-all uppercase tracking-wider",
                            exportFilters.status === s.id
                              ? "bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-200"
                              : "bg-white border-gray-100 text-gray-400 hover:border-gray-300",
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex flex-col gap-3">
                  <button
                    onClick={handleDownloadExcel}
                    className="btn btn-primary h-14 w-full flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary-200"
                  >
                    <Download className="h-5 w-5" />
                    <span>Generar Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => setIsExportModalOpen(false)}
                    className="btn btn-secondary h-12 w-full text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Cancelar
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
