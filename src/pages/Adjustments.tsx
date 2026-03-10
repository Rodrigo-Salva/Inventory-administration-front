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
  Store,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import DetailModal from "@/components/common/DetailModal";
import clsx from "clsx";
import toast from "react-hot-toast";
import { usePermissions } from "@/hooks/usePermissions";
import type { Product, PaginatedResponse } from "@/types";
import { branchApi, Branch } from "@/api/branches";

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
  const [branchId, setBranchId] = useState("");
  const [selectedAdjustment, setSelectedAdjustment] = useState<Adjustment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const { data: adjustments, isLoading } = useQuery<Adjustment[]>({
    queryKey: ["adjustments"],
    queryFn: async () => {
      const response = await api.get("/api/v1/adjustments/");
      return response.data;
    },
  });

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ["branches-active"],
    queryFn: async () => {
      const response = await branchApi.getActive();
      return response.data || [];
    },
  });

  const { data: productsData } = useQuery<PaginatedResponse<Product>>({
    queryKey: ["products", searchTerm],
    queryFn: async () => {
      const response = await api.get(
        `/api/v1/products/?search=${searchTerm}&limit=5`,
      );
      return response.data;
    },
    enabled: searchTerm.length > 2,
  });

  const mutation = useMutation({
    mutationFn: (newAdjustment: any) =>
      api.post("/api/v1/adjustments/", newAdjustment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Ajuste realizado correctamente");
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail || "Error al realizar el ajuste",
      );
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
    if (!selectedProduct || quantity <= 0 || !branchId) {
      toast.error("Seleccione un producto, sucursal y cantidad válida");
      return;
    }
    mutation.mutate({
      product_id: selectedProduct.id,
      branch_id: parseInt(branchId),
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
              className="bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-2 h-10 rounded-xl px-4 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary-200 transition-all"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Nuevo Ajuste</span>
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
                   <th className="pb-4 pt-2 text-right">ACCIONES</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {adjustments?.map((adj) => (
                  <tr
                    key={adj.id}
                    className="group hover:bg-white/50 transition-all"
                  >
                    <td className="py-5">
                      <div
                        className={clsx(
                          "h-10 w-10 rounded-xl flex items-center justify-center font-black text-[10px]",
                          adj.adjustment_type === "IN"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-rose-50 text-rose-600",
                        )}
                      >
                        {adj.adjustment_type}
                      </div>
                    </td>
                    <td className="py-5">
                      <p className="text-sm font-black text-gray-900 truncate">
                        ID: {adj.product_id}
                      </p>
                    </td>
                    <td className="py-5">
                      <span className="px-3 py-1 bg-white text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {adj.reason}
                      </span>
                    </td>
                    <td className="py-5">
                      <span
                        className={clsx(
                          "text-sm font-black tracking-tighter",
                          adj.adjustment_type === "IN"
                            ? "text-emerald-600"
                            : "text-rose-600",
                        )}
                      >
                        {adj.adjustment_type === "IN" ? "+" : "-"}
                        {adj.quantity}
                      </span>
                    </td>
                    <td className="py-5 text-xs font-bold text-gray-500">
                      {new Date(adj.created_at).toLocaleString()}
                    </td>
                     <td className="py-5 text-xs text-gray-400 max-w-xs truncate font-medium">
                       {adj.notes || "-"}
                     </td>
                     <td className="py-5 text-right">
                       <button
                         onClick={() => {
                           setSelectedAdjustment(adj);
                           setIsDetailModalOpen(true);
                         }}
                         className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                         title="Ver Detalles"
                       >
                         <Eye className="h-5 w-5" />
                       </button>
                     </td>
                   </tr>
                ))}
              </tbody>
            </table>
            {(isLoading || adjustments?.length === 0) && (
              <div className="py-20 text-center text-gray-300 font-bold uppercase text-[10px] tracking-[0.2em]">
                {isLoading
                  ? "Cargando historial..."
                  : "Sin ajustes registrados"}
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 text-center sm:p-0">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-white/60 backdrop-blur-sm animate-in fade-in duration-300" 
              onClick={() => setIsModalOpen(false)} 
            />
            
            {/* Modal Container */}
            <div className="relative transform overflow-hidden rounded-[2.5rem] bg-white shadow-2xl transition-all w-full max-w-xl border border-gray-100 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <History className="h-6 w-6 text-primary-600" />
                  Nuevo Ajuste
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-xl transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="px-8 py-8 overflow-y-auto custom-scrollbar">
                <form id="adjustment-form" onSubmit={handleSubmit} className="space-y-6">
                  {/* Product Search */}
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-2 ml-1">
                      Buscar Producto
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Nombre o SKU..."
                        className="w-full h-14 bg-white border-gray-100 rounded-2xl px-12 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
                        autoFocus
                      />
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                    </div>

                    {productsData?.items && searchTerm.length > 2 && (
                      <div className="mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden divide-y divide-gray-50 max-h-48 overflow-y-auto">
                        {productsData.items.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedProduct(p);
                              setSearchTerm(p.name);
                            }}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-all text-left"
                          >
                            <div>
                              <p className="text-sm font-black text-gray-900">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-gray-400 font-bold">
                                SKU: {p.sku}
                              </p>
                            </div>
                            <span className="text-xs font-black text-indigo-600">
                              Stock: {p.stock}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Branch Select */}
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-2 ml-1">
                      Sucursal Afectada *
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        className="w-full h-14 bg-white border-gray-100 rounded-2xl pl-12 pr-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer shadow-sm"
                      >
                        <option value="" disabled>Seleccione una sucursal...</option>
                        {branches?.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      <Store className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 pointer-events-none" />
                    </div>
                  </div>

                  {selectedProduct && (
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 shadow-sm">
                      <Package className="h-6 w-6 text-indigo-600" />
                      <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase">
                          Seleccionado
                        </p>
                        <p className="text-sm font-black text-indigo-900">
                          {selectedProduct.name}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {/* Type Switch */}
                    <button
                      type="button"
                      onClick={() =>
                        setAdjustmentType(
                          adjustmentType === "IN" ? "OUT" : "IN",
                        )
                      }
                      className={clsx(
                        "h-14 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] transition-all border-2 shadow-sm",
                        adjustmentType === "IN"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-600"
                          : "bg-rose-50 border-rose-500 text-rose-600",
                      )}
                    >
                      {adjustmentType === "IN" ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      {adjustmentType === "IN" ? "Entrada" : "Salida"}
                    </button>

                    {/* Quantity */}
                    <input
                      type="number"
                      placeholder="Cantidad"
                      value={quantity || ""}
                      onChange={(e) =>
                        setQuantity(parseFloat(e.target.value))
                      }
                      className="h-14 bg-white border-gray-100 rounded-2xl px-4 text-center text-sm font-black text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
                    />
                  </div>

                  {/* Reason Select */}
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-2 ml-1">
                      Motivo
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full h-14 bg-white border-gray-100 rounded-2xl px-4 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer shadow-sm"
                    >
                      <option value="DAMAGE">Daño / Rotura</option>
                      <option value="LOSS">Pérdida / Robo</option>
                      <option value="CORRECTION">
                        Corrección de Inventario
                      </option>
                      <option value="INTERNAL_USE">Uso Interno</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <textarea
                    placeholder="Notas adicionales..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-24 bg-white border-gray-100 rounded-2xl p-4 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none shadow-sm"
                  />
                </form>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 h-12 text-gray-700 hover:bg-white rounded-xl border border-gray-200 transition-all shadow-sm font-bold uppercase tracking-widest text-[10px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="adjustment-form"
                  className="px-8 h-12 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 font-bold uppercase tracking-widest text-[10px]"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Procesando..." : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-3 inline-block" />
                      Confirmar Ajuste
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detalles de Ajuste"
        subtitle={selectedAdjustment?.product_name || `Producto ID: ${selectedAdjustment?.product_id}`}
        icon={History}
        statusBadge={
          selectedAdjustment && (
            <span className={clsx(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
              selectedAdjustment.adjustment_type === "IN" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}>
              {selectedAdjustment.adjustment_type === "IN" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {selectedAdjustment.adjustment_type === "IN" ? "Entrada" : "Salida"}
            </span>
          )
        }
        sections={[
          {
            title: "Información del Ajuste",
            fields: [
              { label: "Producto", value: selectedAdjustment?.product_name || `ID: ${selectedAdjustment?.product_id}` },
              { label: "Tipo", value: selectedAdjustment?.adjustment_type === "IN" ? "Entrada (+)" : "Salida (-)" },
              { label: "Cantidad", value: selectedAdjustment?.quantity },
              { label: "Motivo", value: selectedAdjustment?.reason },
            ]
          },
          {
            title: "Adicional",
            fields: [
              { label: "Notas", value: selectedAdjustment?.notes || "Sin notas", fullWidth: true },
              { label: "Fecha y Hora", value: selectedAdjustment ? new Date(selectedAdjustment.created_at).toLocaleString() : "" },
            ]
          }
        ]}
      />
    </div>
  );
}
