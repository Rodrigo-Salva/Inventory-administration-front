import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import { 
    ArrowLeft, Package, Hash, 
    ArrowUpRight, ArrowDownRight, RefreshCw, Info,
    Tag
} from 'lucide-react';
import clsx from "clsx";
import type { InventoryMovement, Product } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Kardex() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    // 1. Cargar datos del producto
    const { data: product } = useQuery<Product>({
        queryKey: ["product", id],
        queryFn: async () => {
            const response = await api.get(`/api/v1/products/${id}`);
            return response.data;
        },
        enabled: !!id
    });

    // 2. Cargar historial completo (Kardex)
    const { data: movements, isLoading } = useQuery<InventoryMovement[]>({
        queryKey: ["kardex", id],
        queryFn: async () => {
            const response = await api.get(`/api/v1/inventory/kardex/${id}`);
            return response.data;
        },
        enabled: !!id
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-500 font-medium">Cargando historial de movimientos...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2.5 hover:bg-white rounded-xl transition-colors border border-gray-200 bg-white shadow-sm"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-gray-900 uppercase">Kardex de Inventario</h1>
                            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-[10px] font-black rounded-full uppercase tracking-tighter">
                                Profesional
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Control detallado de entradas y salidas</p>
                    </div>
                </div>
            </div>

            {/* Header de Producto */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 card bg-white border-none shadow-sm p-6 flex items-center gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 border border-primary-100 shadow-inner">
                        <Package className="h-8 w-8" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 uppercase leading-tight">{product?.name}</h2>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-[11px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-lg border border-gray-100">
                                <Hash className="h-3 w-3" /> SKU: {product?.sku}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-lg border border-gray-100">
                                <Tag className="h-3 w-3" /> {product?.category?.name || "Sin Categoría"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="card bg-white border-none shadow-sm p-6 text-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Stock Actual</span>
                    <span className={clsx(
                        "text-3xl font-black",
                        (product?.stock || 0) <= (product?.min_stock || 0) ? "text-red-600" : "text-emerald-600"
                    )}>
                        {product?.stock}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Unidades</span>
                </div>

                <div className="card bg-white border-none shadow-sm p-6 text-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Precio Unit.</span>
                    <span className="text-3xl font-black text-gray-900">
                        ${Number(product?.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Venta</span>
                </div>
            </div>

            {/* Línea de Tiempo de Movimientos */}
            <div className="card border-none shadow-sm bg-white overflow-hidden">
                <div className="px-6 py-4 bg-white/50 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Historial de Operaciones</h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {movements?.length || 0} Registros encontrados
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                            <tr className="bg-white/30">
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha / Hora</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Cantidad</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">S. Anterior</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">S. Nuevo</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Referencia / Notas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {movements?.map((m) => (
                                <tr key={m.id} className="hover:bg-white/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-900">
                                                {format(new Date(m.created_at), "dd MMM, yyyy", { locale: es })}
                                            </span>
                                            <span className="text-[10px] font-medium text-gray-400">
                                                {format(new Date(m.created_at), "HH:mm aaa")}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={clsx(
                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                                            m.movement_type === "entry" && "bg-emerald-50 text-emerald-700 border border-emerald-100",
                                            m.movement_type === "exit" && "bg-rose-50 text-rose-700 border border-rose-100",
                                            m.movement_type === "adjustment" && "bg-amber-50 text-amber-700 border border-amber-100",
                                            m.movement_type === "initial" && "bg-blue-50 text-blue-700 border border-blue-100"
                                        )}>
                                            {m.movement_type === "entry" && <ArrowUpRight className="h-3 w-3" />}
                                            {m.movement_type === "exit" && <ArrowDownRight className="h-3 w-3" />}
                                            {m.movement_type === "adjustment" && <RefreshCw className="h-3 w-3" />}
                                            {m.movement_type === "initial" && <Package className="h-3 w-3" />}
                                            {m.movement_type}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={clsx(
                                            "text-sm font-black",
                                            m.movement_type === "entry" || m.movement_type === "initial" ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            {m.movement_type === "entry" || m.movement_type === "initial" ? "+" : "-"}{Math.abs(m.quantity)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold text-gray-400">
                                        {m.stock_before}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-black text-gray-900">{m.stock_after}</span>
                                            <div className="w-8 h-0.5 bg-white mt-1 rounded-full"></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col max-w-xs">
                                            {m.reference && (
                                                <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-100 inline-block w-fit mb-1">
                                                    REF: {m.reference}
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-500 italic truncate" title={m.notes || ""}>
                                                {m.notes || "Sin notas"}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {movements?.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                            <Info className="h-10 w-10 text-gray-300" />
                        </div>
                        <h4 className="text-gray-900 font-bold">Sin movimientos</h4>
                        <p className="text-gray-500 text-sm">Este producto aún no registra operaciones de inventario.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
