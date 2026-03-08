import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import {
  History,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  X,
  CheckCircle2,
} from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";
import { usePermissions } from "@/hooks/usePermissions";
import type { Product, PaginatedResponse } from "@/types";

interface Adjustment {
  id: number;
  product_id: number;
  adjustment_type: "IN" | "OUT";
  quantity: number;
  reason: string;
  notes: string;
  created_at: string;
  product_name?: string;
}

export default function Adjustments() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"IN" | "OUT">("OUT");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("DAMAGE");
  const [notes, setNotes] = useState("");
  
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const { data: adjustments, isLoading } = useQuery<Adjustment[]>({
    queryKey: ["adjustments"],
    queryFn: async () => {
      const response = await api.get("/api/v1/adjustments/");
      return response.data;
    },
  });

  const { data: productsData } = useQuery<PaginatedResponse<Product>>({
    queryKey: ["products", searchTerm],
    queryFn: async () => {
      const response = await api.get(`/api/v1/products/?search=${searchTerm}&limit=5`);
      return response.data;
    },
    enabled: searchTerm.length > 2,
  });

  const mutation = useMutation({
    mutationFn: (newAdjustment: any) => api.post("/api/v1/adjustments/", newAdjustment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Ajuste realizado correctamente");
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Error al realizar el ajuste");
    },
  });

  const resetForm = () => {
    setSelectedProduct(null);
    setSearchTerm("");
    setQuantity(0);
    setReason("DAMAGE");
    setNotes("");
    setAdjustmentType("OUT");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0) {
      toast.error("Seleccione un producto y cantidad válida");
      return;
    }
    mutation.mutate({
      product_id: selectedProduct.id,
      adjustment_type: adjustmentType,
      quantity,
      reason,
      notes,
    });
  };

  if (!hasPermission("adjustments:view")) {
    return <div className="p-8">Acceso denegado</div>;
  }

  return (
    <div className="min-h-screen bg-white/50 -m-8 p-8 pb-16 antialiased">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-5">
            <div className="hidden sm:flex h-14 w-14 bg-rose-600 rounded-2xl items-center justify-center shadow-lg shadow-rose-200">
              <History className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                Ajustes de Inventario
              </h1>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                Gestión manual de mermas, daños y correcciones de stock
              </p>
            </div>
          </div>
          {hasPermission("adjustments:create") && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="h-14 px-8 bg-white hover:bg-black text-white rounded-2xl flex items-center gap-3 group shadow-xl shadow-slate-200 transition-all font-bold uppercase tracking-widest text-[11px]"
            >
              <Plus className="h-5 w-5 text-indigo-400 group-hover:rotate-90 transition-transform" />
              Nuevo Ajuste
            </button>
          )}
        </div>

        {/* Adjustments Table */}
        <div className="card bg-white border border-gray-100/50 rounded-[3rem] shadow-sm p-10 flex flex-col overflow-hidden min-w-0">
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="pb-4 pt-2">TIPO</th>
                  <th className="pb-4 pt-2">PRODUCTO</th>
                  <th className="pb-4 pt-2">MOTIVO</th>
                  <th className="pb-4 pt-2">CANTIDAD</th>
                  <th className="pb-4 pt-2">FECHA</th>
                  <th className="pb-4 pt-2">NOTAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {adjustments?.map((adj) => (
                  <tr key={adj.id} className="group hover:bg-white/50 transition-all">
                    <td className="py-5">
                      <div className={clsx(
                        "h-10 w-10 rounded-xl flex items-center justify-center font-black text-[10px]",
                        adj.adjustment_type === "IN" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {adj.adjustment_type}
                      </div>
                    </td>
                    <td className="py-5">
                      <p className="text-sm font-black text-gray-900 truncate">ID: {adj.product_id}</p>
                    </td>
                    <td className="py-5">
                      <span className="px-3 py-1 bg-white text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {adj.reason}
                      </span>
                    </td>
                    <td className="py-5">
                      <span className={clsx(
                        "text-sm font-black tracking-tighter",
                        adj.adjustment_type === "IN" ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {adj.adjustment_type === "IN" ? "+" : "-"}{adj.quantity}
                      </span>
                    </td>
                    <td className="py-5 text-xs font-bold text-gray-500">
                      {new Date(adj.created_at).toLocaleString()}
                    </td>
                    <td className="py-5 text-xs text-gray-400 max-w-xs truncate font-medium">
                      {adj.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(isLoading || adjustments?.length === 0) && (
              <div className="py-20 text-center text-gray-300 font-bold uppercase text-[10px] tracking-[0.2em]">
                {isLoading ? "Cargando historial..." : "Sin ajustes registrados"}
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-white/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
              <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-10 border border-gray-100 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Nuevo Ajuste</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Sincronización de existencia física</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                      <X className="h-6 w-6 text-gray-400" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Product Search */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-2 ml-1">Buscar Producto</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Nombre o SKU..."
                          className="w-full h-14 bg-white border-gray-100 rounded-2xl px-12 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                      </div>
                      
                      {productsData?.items && searchTerm.length > 2 && (
                        <div className="mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden divide-y divide-gray-50">
                          {productsData.items.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedProduct(p);
                                setSearchTerm(p.name);
                              }}
                              className="w-full p-4 flex items-center justify-between hover:bg-white transition-all text-left"
                            >
                              <div>
                                <p className="text-sm font-black text-gray-900">{p.name}</p>
                                <p className="text-[10px] text-gray-400 font-bold">SKU: {p.sku}</p>
                              </div>
                              <span className="text-xs font-black text-indigo-600">Stock: {p.stock}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedProduct && (
                      <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                        <Package className="h-6 w-6 text-indigo-600" />
                        <div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase">Seleccionado</p>
                          <p className="text-sm font-black text-indigo-900">{selectedProduct.name}</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {/* Type Switch */}
                      <button
                        type="button"
                        onClick={() => setAdjustmentType(adjustmentType === "IN" ? "OUT" : "IN")}
                        className={clsx(
                          "h-14 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] transition-all border-2",
                          adjustmentType === "IN" ? "bg-emerald-50 border-emerald-500 text-emerald-600" : "bg-rose-50 border-rose-500 text-rose-600"
                        )}
                      >
                        {adjustmentType === "IN" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        {adjustmentType === "IN" ? "Entrada" : "Salida"}
                      </button>

                      {/* Quantity */}
                      <input
                        type="number"
                        placeholder="Cantidad"
                        value={quantity || ""}
                        onChange={(e) => setQuantity(parseFloat(e.target.value))}
                        className="h-14 bg-white border-gray-100 rounded-2xl px-4 text-center text-sm font-black text-gray-900 outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                      />
                    </div>

                    {/* Reason Select */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-2 ml-1">Motivo</label>
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full h-14 bg-white border-gray-100 rounded-2xl px-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-rose-500 transition-all cursor-pointer"
                      >
                        <option value="DAMAGE">Daño / Rotura</option>
                        <option value="LOSS">Pérdida / Robo</option>
                        <option value="CORRECTION">Corrección de Inventario</option>
                        <option value="INTERNAL_USE">Uso Interno</option>
                      </select>
                    </div>

                    {/* Notes */}
                    <textarea
                      placeholder="Notas adicionales..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full h-24 bg-white border-gray-100 rounded-2xl p-4 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none"
                    />

                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="w-full h-16 bg-white hover:bg-black text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {mutation.isPending ? "Procesando..." : (
                        <>
                          <CheckCircle2 className="h-5 w-5" />
                          Confirmar Ajuste
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
