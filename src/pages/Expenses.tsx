import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import { 
  Plus, Receipt, Trash2, DollarSign, 
  BarChart3, Filter, X, Search, Download
} from "lucide-react";
import toast from "react-hot-toast";
import { usePermissions } from "@/hooks/usePermissions";
import Pagination from "@/components/common/Pagination";
import { 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import DateRangePicker from "@/components/common/DateRangePicker";
import clsx from "clsx";

export default function Expenses() {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tempFilters, setTempFilters] = useState({ category: "", start: "", end: "" });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const [formData, setFormData] = useState({
    amount: "",
    category: "General",
    description: "",
    date: new Date().toISOString().split('T')[0],
    reference: ""
  });

  const { data: expensesData } = useQuery({
    queryKey: ["expenses", page, filterCategory, search, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        size: "10",
        ...(filterCategory && { category: filterCategory }),
        ...(search && { search }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate })
      });
      const response = await api.get(`/api/v1/expenses?${params}`);
      return response.data;
    }
  });

  const { data: statsData } = useQuery({
    queryKey: ["expense-stats"],
    queryFn: async () => {
      const response = await api.get("/api/v1/expenses/stats");
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/api/v1/expenses", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      toast.success("Gasto registrado");
      setIsModalOpen(false);
      setFormData({
        amount: "",
        category: "General",
        description: "",
        date: new Date().toISOString().split('T')[0],
        reference: ""
      });
    },
    onError: () => toast.error("Error al registrar el gasto")
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/v1/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      toast.success("Gasto eliminado");
    }
  });

  const handleExport = async (formatType: 'pdf' | 'excel' | 'csv') => {
    const params = new URLSearchParams({
      ...(filterCategory && { category: filterCategory }),
      ...(search && { search }),
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate })
    });
    
    try {
      toast.loading(`Generando reporte ${formatType.toUpperCase()}...`, { id: "export-loading" });
      const response = await api.get(`/api/v1/reports/expenses-${formatType}?${params}`, {
        responseType: 'blob'
      });
      
      const extensions = { pdf: 'pdf', excel: 'xlsx', csv: 'csv' };
      const extension = extensions[formatType as keyof typeof extensions];
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_gastos_${new Date().toISOString().split('T')[0]}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Reporte descargado", { id: "export-loading" });
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Error al generar el reporte", { id: "export-loading" });
    }
  };

  const applyFilters = () => {
    setFilterCategory(tempFilters.category);
    setStartDate(tempFilters.start);
    setEndDate(tempFilters.end);
    setIsFilterModalOpen(false);
    setPage(1);
  };

  const clearFilters = () => {
    setTempFilters({ category: "", start: "", end: "" });
    setFilterCategory("");
    setStartDate("");
    setEndDate("");
    setIsFilterModalOpen(false);
    setPage(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  const categories = ["General", "Alquiler", "Salarios", "Marketing", "Servicios", "Suministros", "Otros"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 ">Gastos</h1>
          <p className="mt-1 text-sm text-gray-600 ">
            Seguimiento de egresos y reportes financieros
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:gap-3">
          <button
            onClick={() => {
              setTempFilters({ category: filterCategory, start: startDate, end: endDate });
              setIsFilterModalOpen(true);
            }}
            className={clsx(
              "btn flex items-center gap-2 h-10 px-4 transition-all border shadow-sm rounded-xl text-xs uppercase tracking-widest font-bold",
              filterCategory || startDate || endDate
                ? "bg-primary-50  border-primary-200  text-primary-700  font-bold"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50",
            )}
          >
            <Filter className="h-4 w-4" />
            Filtrar
            {(filterCategory || startDate || endDate) && (
              <span className="flex h-2 w-2 rounded-full bg-primary-600 animate-pulse" />
            )}
          </button>
          {hasPermission('expenses:export') && (
            <button
                onClick={() => handleExport('pdf')}
                className="btn btn-secondary flex items-center gap-2 h-10 rounded-xl px-4 text-xs font-bold uppercase tracking-widest"
            >
                <Download className="h-5 w-5 text-gray-400 " />
                <span className="hidden sm:inline">PDF</span>
            </button>
          )}
          {hasPermission('expenses:manage') && (
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-2 h-10 rounded-xl px-4 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary-200  transition-all"
            >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">Registrar Gasto</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 " />
        <input
          type="text"
          placeholder="Buscar por descripción o referencia..."
          className="input pl-12 h-12 text-base bg-white  border-gray-100  shadow-xl shadow-gray-200/50  rounded-2xl focus:ring-primary-500 "
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white  rounded-3xl border border-slate-100  shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 bg-red-50  rounded-2xl flex items-center justify-center text-red-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400  uppercase tracking-widest">Total Gastos</p>
              <p className="text-2xl font-black text-slate-900 ">${statsData?.total_amount?.toLocaleString() || '0'}</p>
            </div>
          </div>
          
          <div className="p-6 bg-white  rounded-3xl border border-slate-100  shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 bg-amber-50  rounded-2xl flex items-center justify-center text-amber-600">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400  uppercase tracking-widest">Categoría Top</p>
              <p className="text-xl font-bold text-slate-900  capitalize">
                {Object.entries(statsData?.category_totals || {}).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A'}
              </p>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Registros</p>
              <p className="text-2xl font-black text-slate-900">{expensesData?.total || '0'}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white  rounded-3xl border border-slate-100  shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-slate-400  uppercase tracking-widest">Tendencia</h3>
            <div className="flex bg-white  p-1 rounded-xl">
              {(['daily', 'weekly', 'monthly'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                    timeRange === r 
                    ? 'bg-white  text-slate-900  shadow-sm' 
                    : 'text-slate-400  hover:text-slate-600 :text-zinc-300'
                  }`}
                >
                  {r === 'daily' ? 'D' : r === 'weekly' ? 'S' : 'M'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statsData?.[`${timeRange}_stats`] || []}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="amount" stroke="#ef4444" fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card border-none shadow-sm overflow-hidden bg-white ">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 ">
            <thead className="bg-white ">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400  uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400  uppercase tracking-widest">Descripción</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400  uppercase tracking-widest">Categoría</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400  uppercase tracking-widest">Monto</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400  uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white  divide-y divide-gray-50 ">
              {expensesData?.items?.map((expense: any) => (
                <tr key={expense.id} className="hover:bg-white :bg-white/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 ">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900 ">{expense.description}</div>
                    {expense.reference && <div className="text-[10px] text-slate-400  font-mono">REF: {expense.reference}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-white  text-slate-600 ">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-black text-red-600 ">
                      -${Number(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {hasPermission('expenses:manage') && (
                      <button 
                        onClick={() => {
                          if(confirm("¿Eliminar este gasto?")) deleteMutation.mutate(expense.id)
                        }}
                        className="p-2 text-slate-300  hover:text-red-500 :text-red-400 hover:bg-red-50 :bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {expensesData && (
          <div className="p-4 border-t border-gray-50  bg-white ">
             <Pagination
                currentPage={page}
                totalPages={Math.ceil(expensesData.total / 10)}
                onPageChange={setPage}
              />
          </div>
        )}
      </div>

      {/* Filter Modal (Floating Window) */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm"
              onClick={() => setIsFilterModalOpen(false)}
            />

            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
              <div className="bg-white  px-6 py-6 border-b border-gray-50  flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-50  text-primary-600  rounded-xl">
                    <Filter className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900  tracking-tight">
                    Filtros Avanzados
                  </h3>
                </div>
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500 :text-zinc-300 p-1 hover:bg-white :bg-white rounded-lg"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="px-6 py-8 space-y-6 bg-white ">
                <div>
                  <label className="block text-[10px] font-black text-gray-400  uppercase tracking-[0.2em] mb-2">
                    Categoría
                  </label>
                  <select
                    className="input h-12 bg-white  border-gray-100  rounded-xl text-sm font-medium focus:bg-white :bg-white transition-all shadow-sm "
                    value={tempFilters.category}
                    onChange={(e) => setTempFilters({ ...tempFilters, category: e.target.value })}
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="bg-white  p-6 rounded-2xl border border-gray-100 ">
                  <DateRangePicker
                    startDate={tempFilters.start}
                    endDate={tempFilters.end}
                    onChange={({ start, end }) => setTempFilters({ ...tempFilters, start, end })}
                  />
                </div>

                <div className="pt-6 border-t border-gray-50  flex flex-col gap-3">
                  {hasPermission('expenses:export') && (
                    <button
                      onClick={() => handleExport('excel')}
                      className="btn bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-emerald-200 "
                    >
                      <Download className="h-5 w-5" />
                      Exportar a Excel
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={clearFilters}
                      className="btn border border-gray-200  text-gray-500  h-11 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white :bg-white shadow-sm"
                    >
                      Limpiar Filtros
                    </button>
                    <button
                      onClick={applyFilters}
                      className="bg-primary-600 text-white hover:bg-primary-700 flex items-center justify-center h-11 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary-200  transition-all"
                    >
                      Aplicar Filtros
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white  rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 ">
            <div className="p-8 border-b border-gray-50  flex items-center justify-between bg-white ">
              <h2 className="text-2xl font-black text-slate-900  tracking-tight flex items-center gap-3">
                <Receipt className="h-6 w-6 text-primary-600 " />
                Registrar Gasto
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white :bg-white rounded-full transition-colors font-bold text-slate-400 ">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400  uppercase tracking-widest mb-2">Monto ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="input h-14 text-lg font-black bg-white  border-transparent focus:bg-white :bg-white focus:ring-primary-500 rounded-2xl "
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400  uppercase tracking-widest mb-2">Categoría</label>
                  <select
                    className="input h-14 bg-white  border-transparent focus:bg-white :bg-white focus:ring-primary-500 rounded-2xl "
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400  uppercase tracking-widest mb-2">Fecha</label>
                  <input
                    type="date"
                    required
                    className="input h-14 bg-white  border-transparent focus:bg-white :bg-white focus:ring-primary-500 rounded-2xl  [color-scheme:light_dark]"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400  uppercase tracking-widest mb-2">Descripción</label>
                  <textarea
                    required
                    className="input min-h-[100px] bg-white  border-transparent focus:bg-white :bg-white focus:ring-primary-500 rounded-2xl p-4 "
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Escribe el motivo del gasto..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400  uppercase tracking-widest mb-2">Referencia / Factura #</label>
                  <input
                    type="text"
                    className="input h-14 bg-white  border-transparent focus:bg-white :bg-white focus:ring-primary-500 rounded-2xl "
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-primary-600 text-white hover:bg-primary-700 w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary-200  mt-4 transition-all"
              >
                {createMutation.isPending ? "Registrando..." : "Confirmar Gasto"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
