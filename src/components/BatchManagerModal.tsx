import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import toast from "react-hot-toast";
import { X, Package, Calendar, Plus, Loader2, Info, CheckCircle } from 'lucide-react';
import type { Product, ProductBatch } from "@/types";
import { usePermissions } from "@/hooks/usePermissions";
import clsx from "clsx";

interface BatchManagerModalProps {
    product: Product;
    onClose: () => void;
}

export default function BatchManagerModal({ product, onClose }: BatchManagerModalProps) {
    const queryClient = useQueryClient();
    const { hasPermission } = usePermissions();
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        batch_number: "",
        expiration_date: "",
        initial_quantity: "",
    });

    // 1. Cargar Lotes
    const { data: batches, isLoading } = useQuery<ProductBatch[]>({
        queryKey: ["product-batches", product.id],
        queryFn: async () => {
            const response = await api.get(`/api/v1/product-batches/product/${product.id}`);
            return response.data;
        },
    });

    // 2. Mutación para Crear Lote
    const createBatchMutation = useMutation({
        mutationFn: (data: any) => api.post("/api/v1/product-batches", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["product-batches", product.id] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Lote registrado correctamente");
            setIsCreating(false);
            setFormData({ batch_number: "", expiration_date: "", initial_quantity: "" });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || "Error al crear lote");
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.batch_number || !formData.expiration_date || !formData.initial_quantity) {
            toast.error("Por favor completa todos los campos");
            return;
        }

        createBatchMutation.mutate({
            product_id: product.id,
            batch_number: formData.batch_number,
            expiration_date: formData.expiration_date,
            initial_quantity: parseInt(formData.initial_quantity),
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl shadow-sm">
                            <Package className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight line-clamp-1">
                                Lotes: {product.name}
                            </h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                Gestión de inventario por fecha de vencimiento
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-xl transition-all">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {isCreating ? (
                        <form onSubmit={handleSubmit} className="bg-primary-50/30 p-6 rounded-[2rem] border border-primary-100 mb-8 animate-in slide-in-from-top duration-300">
                            <h4 className="text-xs font-black text-primary-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Registrar Nuevo Lote físico
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Número de Lote</label>
                                    <input 
                                        type="text"
                                        placeholder="Ej: LOT-2024-001"
                                        className="input h-12 rounded-2xl border-gray-200 bg-white"
                                        value={formData.batch_number}
                                        onChange={e => setFormData({...formData, batch_number: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fecha de Vencimiento</label>
                                    <input 
                                        type="date"
                                        className="input h-12 rounded-2xl border-gray-200 bg-white"
                                        value={formData.expiration_date}
                                        onChange={e => setFormData({...formData, expiration_date: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cantidad Inicial (Ingreso)</label>
                                    <input 
                                        type="number"
                                        placeholder="0"
                                        className="input h-12 rounded-2xl border-gray-200 bg-white"
                                        value={formData.initial_quantity}
                                        onChange={e => setFormData({...formData, initial_quantity: e.target.value})}
                                        required
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button 
                                    type="submit"
                                    disabled={createBatchMutation.isPending}
                                    className="flex-1 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-200 transition-all flex items-center justify-center gap-2"
                                >
                                    {createBatchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                    Guardar Lote
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-6 h-12 bg-white border border-gray-200 text-gray-500 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2 text-primary-600">
                                <Info className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Lotes actuales</span>
                            </div>
                            {hasPermission('batches:manage') && (
                                <button 
                                    onClick={() => setIsCreating(true)}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-200 hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nuevo Lote
                                </button>
                            )}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="py-20 text-center">
                            <Loader2 className="h-10 w-10 animate-spin text-primary-200 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Consultando registros...</p>
                        </div>
                    ) : batches?.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem]">
                            <Package className="h-12 w-12 text-gray-100 mx-auto mb-4" />
                            <p className="text-sm font-bold text-gray-400">Este producto no tiene lotes registrados.</p>
                            <p className="text-xs text-gray-300 mt-1">Registra un lote para empezar el control de vencimientos.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {batches?.map((batch) => {
                                const expDate = new Date(batch.expiration_date);
                                const isExpiringSoon = expDate.getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000;
                                const isExpired = expDate.getTime() < new Date().getTime();

                                return (
                                    <div 
                                        key={batch.id}
                                        className={clsx(
                                            "p-6 rounded-[2rem] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                                            isExpired ? "bg-red-50/30 border-red-100" : 
                                            isExpiringSoon ? "bg-orange-50/30 border-orange-100" : "bg-white border-gray-100 hover:border-primary-100"
                                        )}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={clsx(
                                                "p-3 rounded-2xl",
                                                isExpired ? "bg-red-100 text-red-600" : 
                                                isExpiringSoon ? "bg-orange-100 text-orange-600" : "bg-primary-50 text-primary-600"
                                            )}>
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h5 className="text-sm font-black text-gray-800 uppercase tracking-tight">Lote {batch.batch_number}</h5>
                                                    {isExpired && (
                                                        <span className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[7px] font-black uppercase tracking-widest">Vencido</span>
                                                    )}
                                                </div>
                                                <p className={clsx(
                                                    "text-[10px] font-bold uppercase tracking-wider mt-0.5",
                                                    isExpired ? "text-red-500" : isExpiringSoon ? "text-orange-500" : "text-gray-400"
                                                )}>
                                                    Vence: {new Date(batch.expiration_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 text-right">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 leading-none">Stock Disponible</span>
                                                <span className={clsx(
                                                    "text-2xl font-black tracking-tighter",
                                                    batch.current_quantity === 0 ? "text-gray-300" : "text-gray-900"
                                                )}>
                                                    {batch.current_quantity}
                                                </span>
                                            </div>
                                            <div className="h-8 w-px bg-gray-100 hidden sm:block" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 leading-none">Inicial</span>
                                                <span className="text-sm font-bold text-gray-400">{batch.initial_quantity}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="h-12 px-8 bg-white border border-gray-200 text-gray-500 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all shadow-sm"
                    >
                        Cerrar Panel
                    </button>
                </div>
            </div>
        </div>
    );
}
