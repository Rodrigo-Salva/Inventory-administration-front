import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import toast from "react-hot-toast";
import { 
    Search, ShoppingCart, Trash2, Plus, Minus, Package, 
    CreditCard, Banknote, Receipt, X, CheckCircle2, 
    ArrowRight, Loader2, ScanLine
} from 'lucide-react'
import clsx from "clsx";
import type { Product, PaginatedResponse } from "@/types";

interface CartItem extends Product {
    cartQuantity: number;
}

export default function Sales() {
    const [search, setSearch] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [lastSaleId, setLastSaleId] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash");
    const queryClient = useQueryClient();

    // 1. Cargar Productos
    const { data: productData, isLoading } = useQuery<PaginatedResponse<Product>>({
        queryKey: ["products-pos", search],
        queryFn: async () => {
            const params = new URLSearchParams({
                search,
                size: "20", // Mostrar suficientes productos para selección
                is_active: "true"
            });
            const response = await api.get(`/api/v1/products/?${params}`);
            return response.data;
        },
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
            console.error("Error al descargar ticket", err);
            toast.error("Error al generar ticket", { id: toastId });
        }
    };

    // 2. Mutación para Crear Venta
    const createSaleMutation = useMutation({
        mutationFn: async (saleData: any) => {
            const response = await api.post("/api/v1/sales/", saleData);
            return response.data;
        },
        onSuccess: (data: any) => {
            setLastSaleId(data.id);
            setIsPaymentModalOpen(false);
            setIsSuccessModalOpen(true);
            
            // Opcional: Descarga automática inmediata
            downloadTicket(data.id);

            setCart([]);
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["products-pos"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Error al procesar la venta");
        }
    });

    // Funciones del Carrito
    const addToCart = (product: Product) => {
        if (product.stock <= 0) {
            toast.error("Producto sin stock");
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.cartQuantity >= product.stock) {
                    toast.error("No hay más stock disponible");
                    return prev;
                }
                return prev.map(item => 
                    item.id === product.id 
                        ? { ...item, cartQuantity: item.cartQuantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, cartQuantity: 1 }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQty = item.cartQuantity + delta;
                if (newQty <= 0) return item;
                if (newQty > item.stock) {
                    toast.error("Stock máximo alcanzado");
                    return item;
                }
                return { ...item, cartQuantity: newQty };
            }
            return item;
        }));
    };

    const total = useMemo(() => {
        return cart.reduce((acc, item) => acc + (Number(item.price) * item.cartQuantity), 0);
    }, [cart]);

    const handleCheckout = () => {
        if (cart.length === 0) {
            toast.error("El carrito está vacío");
            return;
        }
        setIsPaymentModalOpen(true);
    };

    const confirmSale = () => {
        const saleData = {
            payment_method: paymentMethod,
            items: cart.map(item => ({
                product_id: item.id,
                quantity: item.cartQuantity,
                unit_price: item.price
            }))
        };
        createSaleMutation.mutate(saleData);
    };

    useEffect(() => {
        const styles = `
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #e2e8f0;
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #cbd5e1;
        }
        `;
        
        const styleTag = document.createElement('style');
        styleTag.textContent = styles;
        document.head.appendChild(styleTag);
        
        return () => {
            document.head.removeChild(styleTag);
        };
    }, []);

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6 antialiased">
            {/* SECCIÓN IZQUIERDA: BÚSQUEDA Y PRODUCTOS */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
                {/* Barra de Búsqueda Premium */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-primary-500/5 blur-2xl rounded-3xl group-focus-within:bg-primary-500/10 transition-all" />
                    <div className="relative bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/40 p-2 flex items-center gap-3">
                        <div className="p-3 bg-gray-50 rounded-2xl text-gray-400 group-focus-within:text-primary-500 transition-colors">
                            <Search className="h-6 w-6" />
                        </div>
                        <input 
                            type="text"
                            placeholder="Buscar producto por nombre, SKU o escanea QR..."
                            className="bg-transparent border-none focus:ring-0 text-lg font-medium text-gray-800 placeholder:text-gray-400 w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                        <div className="flex items-center gap-2 px-4 border-l border-gray-100">
                            <ScanLine className="h-5 w-5 text-gray-300" />
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest hidden sm:block">Scanner Activo</span>
                        </div>
                    </div>
                </div>

                {/* Grid de Productos */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-400">
                            <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
                            <p className="font-bold uppercase tracking-[0.2em] text-xs">Cargando catálogo...</p>
                        </div>
                    ) : productData?.items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-400 italic">
                            <Package className="h-16 w-16 opacity-20" />
                            <p>No se encontraron productos</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
                            {productData?.items.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    disabled={product.stock <= 0}
                                    className={clsx(
                                        "group text-left p-4 rounded-[2rem] border transition-all duration-300 active:scale-95",
                                        product.stock <= 0 
                                            ? "bg-gray-50 border-gray-100 opacity-60 grayscale cursor-not-allowed" 
                                            : "bg-white border-gray-100 hover:border-primary-200 hover:shadow-2xl hover:shadow-primary-100/50"
                                    )}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={clsx(
                                            "p-3 rounded-2xl shadow-sm transition-colors",
                                            product.stock <= 0 ? "bg-gray-200" : "bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white"
                                        )}>
                                            <Package className="h-5 w-5" />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Precio</span>
                                            <span className="text-lg font-black text-gray-900">
                                                ${Number(product.price).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <h3 className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors uppercase text-sm line-clamp-1 mb-1">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-mono font-bold text-gray-400">{product.sku}</span>
                                        <div className={clsx(
                                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter",
                                            product.stock > 10 ? "bg-emerald-50 text-emerald-600" : 
                                            product.stock > 0 ? "bg-orange-50 text-orange-600" : "bg-red-50 text-red-600"
                                        )}>
                                            Stock: {product.stock}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* SECCIÓN DERECHA: CARRITO Y PAGO */}
            <div className="w-[400px] flex flex-col bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 overflow-hidden">
                <div className="p-6 bg-gray-50/50 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
                            <ShoppingCart className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Carrito</h2>
                    </div>
                    {cart.length > 0 && (
                        <button 
                            onClick={() => setCart([])}
                            className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors"
                        >
                            Vaciar
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-4 italic p-8 text-center">
                            <div className="p-6 bg-gray-50 rounded-full">
                                <Search className="h-10 w-10 opacity-20" />
                            </div>
                            <p className="text-sm">Escanea productos o búscalos para comenzar la venta</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="group bg-white p-3 rounded-2xl border border-gray-100 hover:border-primary-100 hover:shadow-lg transition-all">
                                <div className="flex gap-3">
                                    <div className="h-12 w-12 flex-shrink-0 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                                        <Package className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold text-gray-900 uppercase truncate mb-0.5">{item.name}</h4>
                                        <p className="text-[10px] font-bold text-indigo-600">${Number(item.price).toLocaleString()} c/u</p>
                                    </div>
                                    <button 
                                        onClick={() => removeFromCart(item.id)}
                                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                                        <button 
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white text-gray-500 hover:text-red-500 hover:shadow-sm transition-all"
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-8 text-center text-xs font-black text-gray-900">{item.cartQuantity}</span>
                                        <button 
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white text-gray-500 hover:text-emerald-500 hover:shadow-sm transition-all"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter block leading-none">Subtotal</span>
                                        <span className="text-sm font-black text-gray-900 tracking-tight">
                                            ${(Number(item.price) * item.cartQuantity).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* RESUMEN Y BOTÓN ACCIÓN */}
                <div className="p-6 bg-slate-900">
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center text-slate-400">
                            <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                            <span className="text-sm font-bold">${total.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                            <span className="text-[10px] font-black uppercase tracking-widest">Impuestos (Incl.)</span>
                            <span className="text-sm font-bold">$0.00</span>
                        </div>
                        <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                            <span className="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em]">Total a Pagar</span>
                            <span className="text-3xl font-black text-white tracking-tighter">${total.toLocaleString()}</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className={clsx(
                            "w-full h-16 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] font-black uppercase tracking-[0.15em] text-sm shadow-2xl",
                            cart.length === 0 
                                ? "bg-slate-800 text-slate-600 grayscale cursor-not-allowed" 
                                : "bg-primary-600 hover:bg-primary-500 text-white shadow-primary-600/30"
                        )}
                    >
                        <span>Completar Venta</span>
                        <ArrowRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* MODAL DE PAGO */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)} />
                        <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                            <Receipt className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Finalizar Compra</h3>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Selecciona método de pago</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                                        <X className="h-6 w-6 text-gray-300" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    {[
                                        { id: 'cash', name: 'Efectivo', icon: Banknote, color: 'emerald' },
                                        { id: 'card', name: 'Tarjeta', icon: CreditCard, color: 'blue' },
                                        { id: 'transfer', name: 'Transferencia', icon: ArrowRight, color: 'indigo' },
                                        { id: 'other', name: 'Otros', icon: Plus, color: 'gray' },
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
                                                <div className={clsx("h-2 w-2 rounded-full bg-current animate-pulse")} />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 mb-8 flex justify-between items-center">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Monto Total</span>
                                    <span className="text-4xl font-black text-gray-900 tracking-tighter">${total.toLocaleString()}</span>
                                </div>

                                <button 
                                    onClick={confirmSale}
                                    disabled={createSaleMutation.isPending}
                                    className="w-full h-16 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl shadow-xl shadow-primary-200/50 flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-sm transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {createSaleMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>Procesando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-5 w-5" />
                                            <span>Confirmar y Pagar</span>
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
                        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md" />
                        <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden p-10 text-center border border-gray-100">
                            <div className="flex justify-center mb-6">
                                <div className="p-6 bg-emerald-50 text-emerald-500 rounded-full animate-bounce">
                                    <CheckCircle2 className="h-16 w-16" />
                                </div>
                            </div>
                            
                            <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">¡Venta Exitosa!</h3>
                            <p className="text-gray-500 font-medium mb-10">La transacción se ha registrado correctamente y el inventario ha sido actualizado.</p>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => lastSaleId && downloadTicket(lastSaleId)}
                                    className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-100 transition-all active:scale-95"
                                >
                                    <Receipt className="h-6 w-6" />
                                    Imprimir Ticket
                                </button>
                                
                                <button 
                                    onClick={() => {
                                        setIsSuccessModalOpen(false);
                                        setLastSaleId(null);
                                    }}
                                    className="w-full h-16 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                                >
                                    Nueva Venta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

