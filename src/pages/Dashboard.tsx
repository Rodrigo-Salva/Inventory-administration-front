import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import {
  TrendingDown,
  Download,
  X,
  Wallet,
  ShoppingBag,
  ArrowUpRight,
  CreditCard,
  Shield,
  Activity,
} from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";
import SalesTrendsChart from "@/components/charts/SalesTrendsChart";
import MovementTrendsChart from "@/components/charts/MovementTrendsChart";
import TopSellingProductsChart from "@/components/charts/TopSellingProductsChart";
import TopMovingProductsChart from "@/components/charts/TopMovingProductsChart";
import SupplierDistributionChart from "@/components/charts/SupplierDistributionChart";
import CategoryValueChart from "@/components/charts/CategoryValueChart";
import UserActivityChart from "@/components/charts/UserActivityChart";
import DateRangePicker from "@/components/common/DateRangePicker";
import { usePermissions } from "@/hooks/usePermissions";

import type { Category, PaginatedResponse } from "@/types";

export default function Dashboard() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [exportFilters, setExportFilters] = useState({
    category_id: "",
    supplier_id: "",
    status: "all",
  });

  const { hasPermission } = usePermissions();

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
      const response = await api.get(
        `/api/v1/reports/dashboard?${params.toString()}`,
      );
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

  if (!hasPermission("dashboard:view")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <Shield className="h-16 w-16 text-gray-200 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Acceso Denegado</h2>
        <p className="text-gray-500 mt-2">
          No tienes permisos para ver el dashboard y gráficos.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 -m-8 p-8 pb-16 antialiased">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header section with actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-5">
            <div className="hidden sm:flex h-14 w-14 bg-indigo-600 rounded-2xl items-center justify-center shadow-lg shadow-indigo-200">
              <ShoppingBag className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                Vista General
              </h1>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                Monitoreo de inventario y rendimiento comercial en tiempo real
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <DateRangePicker
              startDate={dateRange.start}
              endDate={dateRange.end}
              onChange={setDateRange}
              className="bg-slate-50 p-2 rounded-2xl border border-gray-100"
            />
            {hasPermission("reports:view") && (
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="h-14 px-8 bg-slate-900 hover:bg-black text-white rounded-2xl flex items-center gap-3 group shadow-xl shadow-slate-200 transition-all font-bold uppercase tracking-widest text-[11px]"
              >
                <Download className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                Reporte Ejecutivo
              </button>
            )}
          </div>
        </div>

        {/* Row 1: Metrics 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 min-w-0">
          <div className="card bg-white border border-gray-100/50 rounded-[2.5rem] shadow-sm flex flex-col p-6 sm:p-8 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <Wallet className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg">
                <ArrowUpRight className="h-3 w-3" />
                <span>+12%</span>
              </div>
            </div>
            <span className="text-3xl font-black text-gray-900 tracking-tighter truncate">
              ${dashboard?.stats?.total_revenue?.toLocaleString()}
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase mt-2 tracking-widest leading-relaxed">
              Ingresos Totales
            </span>
          </div>

          <div className="card bg-white border border-gray-100/50 rounded-[2.5rem] shadow-sm flex flex-col p-6 sm:p-8 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
             <div className="flex items-center justify-between mb-5">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase">
                Ventas
              </span>
            </div>
            <span className="text-3xl font-black text-gray-900 tracking-tighter truncate">
              {dashboard?.stats?.sales_count || 0}
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase mt-2 tracking-widest leading-relaxed">
              Ventas Totales
            </span>
          </div>

          <div className="card bg-white border border-gray-100/50 rounded-[2.5rem] shadow-sm flex flex-col p-6 sm:p-8 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-all duration-300">
                <TrendingDown className="h-6 w-6" />
              </div>
            </div>
            <span className="text-3xl font-black text-gray-900 tracking-tighter truncate">
              {dashboard?.stats?.low_stock_count || 0}
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase mt-2 tracking-widest leading-relaxed">
              Productos Agotándose
            </span>
          </div>

          <div className="card bg-white border border-gray-100/50 rounded-[2.5rem] shadow-sm flex flex-col p-6 sm:p-8 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
            <span className="text-3xl font-black text-gray-900 tracking-tighter truncate">
              $
              {dashboard?.stats?.total_inventory_value?.toLocaleString(
                undefined,
                { maximumFractionDigits: 0 },
              )}
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase mt-2 tracking-widest leading-relaxed">
              Valor en Almacén
            </span>
          </div>
        </div>

        {/* Row 2: Large Statistics Chart */}
        <div className="card bg-white border border-gray-100/50 rounded-[3rem] shadow-sm hover:shadow-md transition-all p-10 flex flex-col overflow-hidden min-w-0">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">
                Estadísticas de Ingresos
              </h3>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center">
                <Wallet className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
          <div className="w-full h-[450px] min-w-0">
            <SalesTrendsChart data={dashboard?.sales_trends || []} />
          </div>
        </div>

        {/* Row 3: Top Selling Products (Full Width) */}
        <div className="card bg-white border border-gray-100/50 rounded-[3rem] shadow-sm hover:shadow-md transition-all p-10 flex flex-col overflow-hidden min-w-0">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.25em] mb-8">
            Productos Más Vendidos
          </h3>
          <div className="flex-grow w-full h-[450px]">
            <TopSellingProductsChart data={dashboard?.top_selling_products || []} />
          </div>
        </div>

        {/* Row 4: Top Moving Products (Full Width) */}
        <div className="card bg-white border border-gray-100/50 rounded-[3rem] shadow-sm hover:shadow-md transition-all p-10 flex flex-col overflow-hidden min-w-0">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.25em] mb-8">
            Productos de Alta Rotación
          </h3>
          <div className="flex-grow w-full h-[450px]">
            <TopMovingProductsChart data={dashboard?.top_moving_products || []} />
          </div>
        </div>

        {/* Row 5: Supplier Distribution (Full Width) */}
        <div className="card bg-white border border-gray-100/50 rounded-[3rem] shadow-sm hover:shadow-md transition-all p-10 flex flex-col overflow-hidden min-w-0">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.25em] mb-8">
            Distribución por Proveedores
          </h3>
          <div className="flex-grow w-full h-[450px]">
            <SupplierDistributionChart data={dashboard?.supplier_distribution || []} />
          </div>
        </div>

        {/* Row 4: Mini Horizontal KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 min-w-0">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase truncate">Productos</p>
                <p className="text-sm font-bold text-gray-900 truncate">{dashboard?.stats?.total_products || 0} SKUs</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 flex-shrink-0">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase truncate">Stock Total</p>
                <p className="text-sm font-bold text-gray-900 truncate">{dashboard?.stats?.total_stock?.toLocaleString() || 0} Unid.</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 flex-shrink-0">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase truncate">Categorías</p>
                <p className="text-sm font-bold text-gray-900 truncate">{categories.length} Activas</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm overflow-hidden">
             <div className="flex items-center gap-4 min-w-0">
              <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-black text-xs flex-shrink-0">
                {dashboard?.stats?.entries_count || 0}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase truncate">Movimientos</p>
                <p className="text-sm font-bold text-gray-900 truncate">Hoy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 6: Valor por Categoría (Full Width) */}
        <div className="card bg-white border border-gray-100/50 rounded-[3rem] shadow-sm hover:shadow-md transition-all p-10 flex flex-col overflow-hidden min-w-0">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.25em] mb-8 text-center">
            Valoración por Categoría
          </h3>
          <div className="w-full h-[450px]">
            <CategoryValueChart data={dashboard?.category_distribution || []} />
          </div>
        </div>

        {/* Row 7: Flujo de Almacén (Full Width) */}
        <div className="card bg-white border border-gray-100/50 rounded-[3rem] shadow-sm hover:shadow-md transition-all p-10 flex flex-col overflow-hidden min-w-0">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.25em] mb-8">
            Flujo de Almacén (Entradas vs Salidas)
          </h3>
          <div className="w-full h-[400px]">
            <MovementTrendsChart data={dashboard?.trends || []} />
          </div>
        </div>

        {/* Row 8: Recent Activity & User Participation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch min-w-0">
           <div className="card bg-white border border-gray-100/50 rounded-[3rem] shadow-sm p-10 flex flex-col overflow-hidden min-w-0">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.25em] mb-8">
                Actividad de Resurtido
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-4 rounded-3xl transition-all min-w-0 border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 flex-shrink-0">
                      <ArrowUpRight className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-gray-900 uppercase truncate">Último Resurtido</p>
                      <p className="text-[10px] text-gray-400 font-bold truncate">Almacén Central</p>
                    </div>
                  </div>
                  <p className="text-xs font-black text-emerald-500 ml-2 whitespace-nowrap">+150 Unidades</p>
                </div>
                <div className="pt-6">
                   <div className="w-full h-[300px]">
                      <UserActivityChart data={dashboard?.user_activity || []} />
                   </div>
                </div>
              </div>
            </div>

            <div className="card bg-white border border-gray-100/50 rounded-[3rem] shadow-sm p-10 flex flex-col overflow-hidden min-w-0 justify-center items-center bg-gradient-to-br from-white to-slate-50">
               <div className="text-center space-y-4">
                  <div className="h-20 w-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 mx-auto mb-4">
                    <Activity className="h-10 w-10 text-indigo-500 animate-pulse" />
                  </div>
                  <h4 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Monitoreo Activo</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-loose max-w-[200px] mx-auto">
                    El sistema está sincronizado con el stock en tiempo real
                  </p>
               </div>
            </div>
        </div>

        {/* Row 9: Transaction Table (Full Width) */}
        <div className="card bg-white border border-gray-100/50 rounded-[3rem] shadow-sm p-10 flex flex-col overflow-hidden min-w-0">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">
              Historial de Transacciones
            </h3>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <input 
                type="text" 
                placeholder="Buscar movimiento..." 
                className="bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold outline-none w-full sm:w-64 focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto -mx-2">
            <div className="min-w-full inline-block align-middle px-2">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="pb-4 pt-2">ÍCO</th>
                    <th className="pb-4 pt-2">PRODUCTO</th>
                    <th className="pb-4 pt-2">FECHA</th>
                    <th className="pb-4 pt-2">ID</th>
                    <th className="pb-4 pt-2">CANTIDAD</th>
                    <th className="pb-4 pt-2 text-right">ESTADO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dashboard?.recent_movements?.slice(0, 10).map((m: any) => (
                    <tr key={m.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="py-5">
                        <div className={clsx(
                          "h-10 w-10 rounded-xl flex items-center justify-center font-black text-[10px]",
                          m.type === "entry" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                          {m.type === "entry" ? "IN" : "OUT"}
                        </div>
                      </td>
                      <td className="py-5 max-w-[200px]">
                        <p className="text-sm font-black text-gray-900 truncate">{m.product_name}</p>
                      </td>
                      <td className="py-5">
                        <p className="text-xs font-bold text-gray-500">{new Date(m.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="py-5">
                        <p className="text-xs font-medium text-gray-400 tracking-wider font-mono">#{m.id.toString().padStart(6, '0')}</p>
                      </td>
                      <td className="py-5">
                        <span className={clsx(
                          "text-sm font-black tracking-tighter",
                          m.quantity >= 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="py-5 text-right">
                        <span className={clsx(
                          "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                          m.type === "entry" ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                        )}>
                          {m.type === "entry" ? "Entrada" : "Salida"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(!dashboard?.recent_movements || dashboard?.recent_movements.length === 0) && (
              <div className="py-20 text-center text-gray-300 font-bold uppercase text-[10px] tracking-[0.2em]">
                Sin transacciones recientes
              </div>
            )}
          </div>
        </div>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm"
                onClick={() => setIsExportModalOpen(false)}
              />
              <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 border border-gray-100 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                        Exportar Datos
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                        Configuración del reporte
                      </p>
                    </div>
                    <button
                      onClick={() => setIsExportModalOpen(false)}
                      className="p-2 hover:bg-gray-50 rounded-xl transition-all"
                    >
                      <X className="h-6 w-6 text-gray-400" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-2 ml-1">
                        Categoría
                      </label>
                      <select
                        className="w-full h-14 bg-gray-50 border-gray-100 rounded-2xl px-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                        value={exportFilters.category_id}
                        onChange={(e) =>
                          setExportFilters({
                            ...exportFilters,
                            category_id: e.target.value,
                          })
                        }
                      >
                        <option value="">Todas las categorías</option>
                        {categories.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-2 ml-1">
                        Estado
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {["all", "active", "inactive"].map((s) => (
                          <button
                            key={s}
                            onClick={() =>
                              setExportFilters({ ...exportFilters, status: s })
                            }
                            className={clsx(
                              "h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                              exportFilters.status === s
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                : "bg-gray-50 text-gray-400 hover:bg-gray-100",
                            )}
                          >
                            {s === "all"
                              ? "Todos"
                              : s === "active"
                                ? "Activos"
                                : "Inactivos"}
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
    </div>
  );
}
