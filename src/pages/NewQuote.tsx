import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import toast from "react-hot-toast";
import { addDays } from "date-fns";
import { 
    Search, FileText, Trash2, Plus, Minus, Package, 
    CheckCircle2, ArrowRight, Loader2, ScanLine, Users, Shield,
    Calendar
} from 'lucide-react'
import clsx from "clsx";
import type { Product, Customer, PaginatedResponse } from "@/types";
import { usePermissions } from "@/hooks/usePermissions";

interface CartItem extends Product {
    cartQuantity: number;
}

export default function NewQuote() {
    const [search, setSearch] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [lastQuoteId, setLastQuoteId] = useState<number | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [validDays, setValidDays] = useState(15);
    const [notes, setNotes] = useState("");
    
    const queryClient = useQueryClient();
    const { hasPermission } = usePermissions();

    const { data: productData, isLoading } = useQuery<PaginatedResponse<Product>>({
        queryKey: ["products-quote", search],
        queryFn: async () => {
            const params = new URLSearchParams({
                search,
                size: "20",
                is_active: "true"
            });
            const response = await api.get(`/api/v1/products/?${params}`);
            return response.data;
        },
    });

    const { data: activeCustomers } = useQuery<Customer[]>({
        queryKey: ["active-customers"],
        queryFn: async () => {
            const response = await api.get("/api/v1/customers/active");
            return response.data;
        },
    });

    const createQuoteMutation = useMutation({
        mutationFn: async (quoteData: any) => {
            const response = await api.post("/api/v1/quotes/", quoteData);
            return response.data;
        },
        onSuccess: (data: any) => {
            setLastQuoteId(data.id);
            setIsSuccessModalOpen(true);
            setSelectedCustomer(null);
            setCart([]);
            setNotes("");
            setValidDays(15);
            queryClient.invalidateQueries({ queryKey: ["quotes"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Error al procesar la cotización");
        }
    });

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
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
                return { ...item, cartQuantity: newQty };
            }
            return item;
        }));
    };

    const total = useMemo(() => {
        return cart.reduce((acc, item) => acc + (Number(item.price) * item.cartQuantity), 0);
    }, [cart]);

    const confirmQuote = () => {
        if (cart.length === 0) {
            toast.error("La cotización está vacía");
            return;
        }

        const validUntil = addDays(new Date(), validDays).toISOString().split('T')[0];

        const quoteData = {
            customer_id: selectedCustomer?.id || null,
            valid_until: validUntil,
            notes: notes,
            items: cart.map(item => ({
                product_id: item.id,
                quantity: item.cartQuantity,
                unit_price: item.price
            }))
        };
        
        createQuoteMutation.mutate(quoteData);
    };

    useEffect(() => {
        const styles = `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        `;
        const styleTag = document.createElement('style');
        styleTag.textContent = styles;
        document.head.appendChild(styleTag);
        return () => { document.head.removeChild(styleTag); };
    }, []);

    if (!hasPermission('quotes:create')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Shield className="h-16 w-16 text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Acceso Denegado</h2>
                <p className="text-gray-500 mt-2">No tienes permisos para crear cotizaciones.</p>
            </div>
        )
    }

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6 antialiased">
            {/* SECCIÓN IZQUIERDA: BÚSQUEDA Y PRODUCTOS */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
                <div className="relative group">
                    <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-3xl group-focus-within:bg-blue-500/10 transition-all" />
                    <div className="relative bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/40 p-2 flex items-center gap-3">
                        <div className="p-3 bg-white rounded-2xl text-gray-400 group-focus-within:text-blue-500 transition-colors">
                            <Search className="h-6 w-6" />
                        </div>
                        <input 
                            type="text"
                            placeholder="Buscar producto para cotizar..."
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

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-400">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
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
                                    className="group text-left p-4 rounded-[2rem] border bg-white border-gray-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-300 active:scale-95"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white shadow-sm transition-colors">
                                            <Package className="h-5 w-5" />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Precio</span>
                                            <span className="text-lg font-black text-gray-900">
                                                ${Number(product.price).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors uppercase text-sm line-clamp-1 mb-1">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-mono font-bold text-gray-400">{product.sku}</span>
                                        <div className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-gray-50 text-gray-600">
                                            Stock actual: {product.stock}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* SECCIÓN DERECHA: CARRITO Y COTIZACIÓN */}
            <div className="w-[400px] flex flex-col bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 overflow-hidden">
                <div className="p-6 bg-white/50 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                            <FileText className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Cotización</h2>
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

                <div className="px-6 py-4 bg-white/30 border-y border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</span>
                        {selectedCustomer && (
                            <button 
                                onClick={() => setSelectedCustomer(null)}
                                className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-tighter"
                            >
                                Quitar
                            </button>
                        )}
                    </div>
                    
                    {selectedCustomer ? (
                        <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-blue-100 shadow-sm">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Users className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-gray-900 truncate uppercase">{selectedCustomer.name}</h4>
                                <p className="text-[10px] font-medium text-gray-400 truncate">{selectedCustomer.document_number || 'Sin documento'}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative group/select">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within/select:text-blue-500 transition-colors" />
                            <select 
                                className="w-full bg-white border border-gray-100 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                onChange={(e) => {
                                    const customer = activeCustomers?.find(c => c.id === Number(e.target.value));
                                    if (customer) setSelectedCustomer(customer);
                                }}
                                value=""
                            >
                                <option value="" disabled>Seleccionar Cliente</option>
                                {activeCustomers?.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-4 italic p-8 text-center">
                            <div className="p-6 bg-white rounded-full">
                                <Search className="h-10 w-10 opacity-20" />
                            </div>
                            <p className="text-sm">Agrega productos para crear una cotización</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="group bg-white p-3 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-lg transition-all">
                                <div className="flex gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold text-gray-900 uppercase truncate mb-0.5">{item.name}</h4>
                                        <p className="text-[10px] font-bold text-blue-600">${Number(item.price).toLocaleString()} c/u</p>
                                    </div>
                                    <button 
                                        onClick={() => removeFromCart(item.id)}
                                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="h-7 w-7 rounded-lg text-gray-500 hover:text-red-500 hover:bg-white border"><Minus className="h-3 w-3 mx-auto" /></button>
                                        <span className="w-8 text-center text-xs font-black">{item.cartQuantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="h-7 w-7 rounded-lg text-gray-500 hover:text-emerald-500 hover:bg-white border"><Plus className="h-3 w-3 mx-auto" /></button>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-black text-gray-900">${(Number(item.price) * item.cartQuantity).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* OPCIONES DE LA COTIZACIÓN Y BOTÓN */}
                <div className="p-6 bg-white space-y-4">
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block">Validez (Días)</span>
                            <div className="flex gap-2">
                                {[5, 10, 15, 30].map(days => (
                                    <button 
                                        key={days} 
                                        onClick={() => setValidDays(days)}
                                        className={clsx("px-3 py-1 text-xs font-bold rounded-lg border", validDays === days ? "bg-blue-50 text-blue-600 border-blue-200" : "text-gray-500 border-gray-200")}
                                    >
                                        {days}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <input
                            type="text"
                            placeholder="Notas (Opcional)"
                            className="w-full text-xs p-3 rounded-xl border-gray-200"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Total</span>
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">${total.toLocaleString()}</span>
                    </div>

                    <button 
                        onClick={confirmQuote}
                        disabled={cart.length === 0 || createQuoteMutation.isPending}
                        className={clsx(
                            "w-full h-16 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] font-black uppercase tracking-[0.15em] text-sm shadow-2xl",
                            cart.length === 0 
                                ? "bg-white text-slate-600 grayscale cursor-not-allowed border" 
                                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
                        )}
                    >
                        {createQuoteMutation.isPending ? "Generando..." : "Generar Cotización"}
                        <ArrowRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* MODAL DE ÉXITO */}
            {isSuccessModalOpen && (
                <div className="fixed inset-0 z-[70] overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-white/90 backdrop-blur-md" />
                        <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden p-10 text-center border border-gray-100">
                            <div className="flex justify-center mb-6">
                                <div className="p-6 bg-blue-50 text-blue-500 rounded-full animate-bounce">
                                    <CheckCircle2 className="h-16 w-16" />
                                </div>
                            </div>
                            
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Cotización Creada</h3>
                            <p className="text-gray-500 font-medium mb-10">Generada correctamente bajo el ID #{lastQuoteId}</p>

                            <button 
                                onClick={() => setIsSuccessModalOpen(false)}
                                className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-100 transition-all active:scale-95"
                            >
                                Nueva Cotización
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
