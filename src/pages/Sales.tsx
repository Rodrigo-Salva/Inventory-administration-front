import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import toast from "react-hot-toast";
import { 
    Search, ShoppingCart, Trash2, Plus, Minus, Package, 
    CreditCard, Banknote, Receipt, X, CheckCircle2, 
    ArrowRight, Loader2, ScanLine, Users, Shield,
    Wifi, WifiOff, RefreshCcw
} from 'lucide-react'
import clsx from "clsx";
import type { Product, Customer, PaginatedResponse, LoyaltyConfig } from "@/types";
import { usePermissions } from "@/hooks/usePermissions";
import { usePOSStore } from "@/store/posStore";
import { useOfflinePOS } from "@/hooks/useOfflinePOS";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/posDb";
import CashSessionModal from "@/components/pos/CashSessionModal";
import ExpenseModal from "@/components/pos/ExpenseModal";
import BarcodeScanner from "../components/pos/BarcodeScanner";


interface CartItem extends Product {
    cartQuantity: number;
    selectedBatchId?: number;
    selectedBatchNumber?: string;
    discount?: number; // Porcentaje
}

export default function Sales() {
    const [search, setSearch] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [sessionModalType, setSessionModalType] = useState<'open' | 'close'>('open');
    const [lastSaleId, setLastSaleId] = useState<number | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [currentProductForBatch, setCurrentProductForBatch] = useState<Product | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer" | "credit">("cash");
    const [redeemedPoints, setRedeemedPoints] = useState(0);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [continuousMode, setContinuousMode] = useState(true);
    const [globalDiscount, setGlobalDiscount] = useState(0);
    
    const queryClient = useQueryClient();
    const { hasPermission } = usePermissions();
    const { activeSession, checkActiveSession, isLoading: isSessionLoading } = usePOSStore();
    const { isOnline, saveSale } = useOfflinePOS();

    // Query local para modo offline
    const offlineProducts = useLiveQuery(() => 
        db.products.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase()) || 
            p.sku.toLowerCase().includes(search.toLowerCase()) ||
            (p.barcode?.toLowerCase().includes(search.toLowerCase()) ?? false)
        ).limit(20).toArray(),
    [search]);

    // 2.1 Cargar Configuración de Lealtad
    const { data: loyaltyConfig } = useQuery<LoyaltyConfig>({
        queryKey: ["loyalty-config"],
        queryFn: async () => {
            const res = await api.get("/api/v1/loyalty/config");
            return res.data;
        }
    });

    const pointsDiscount = useMemo(() => {
        if (!loyaltyConfig || !redeemedPoints) return 0;
        return redeemedPoints * loyaltyConfig.amount_per_point;
    }, [loyaltyConfig, redeemedPoints]);

    // 1. Cargar Productos
    const { data: productData, isLoading: isQueryLoading } = useQuery<PaginatedResponse<Product>>({
        queryKey: ["products-pos", search],
        queryFn: async () => {
            const params = new URLSearchParams({
                search,
                size: "20",
                is_active: "true"
            });
            const response = await api.get(`/api/v1/products/?${params}`);
            return response.data;
        },
        enabled: isOnline // Solo cargar de red si estamos online
    });

    const isLoading = isQueryLoading && isOnline;
    const itemsToShow = isOnline ? productData?.items : (offlineProducts || []);

    // Auto-agregar si hay coincidencia exacta de SKU o Barcode (para lectores físicos)
    useEffect(() => {
        if (search && productData?.items.length === 1) {
            const product = productData.items[0];
            if (product.sku === search || product.barcode === search) {
                addToCart(product);
                setSearch(""); // Limpiar para el siguiente escaneo
                toast.success(`Agregado: ${product.name}`, { duration: 1000, position: 'bottom-center' });
            }
        }
    }, [productData, search]);

    // 1.1 Cargar Clientes Activos
    const { data: activeCustomers } = useQuery<Customer[]>({
        queryKey: ["active-customers"],
        queryFn: async () => {
            const response = await api.get("/api/v1/customers/active");
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
            setCart([]);
            setSelectedCustomer(null);
            setRedeemedPoints(0);
            setIsPaymentModalOpen(false);
            setIsSuccessModalOpen(true);
            
            // Opcional: Descarga automática inmediata
            downloadTicket(data.id);

            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["products-pos"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Error al procesar la venta");
        }
    });

    // Funciones del Carrito
    const addToCart = (product: Product, batch?: any) => {
        if (product.stock <= 0) {
            toast.error("Producto sin stock");
            return;
        }

        // Si el producto tiene lotes y no se ha seleccionado uno, abrir modal
        if (product.batches && product.batches.length > 0 && !batch) {
            setCurrentProductForBatch(product);
            setIsBatchModalOpen(true);
            return;
        }

        setCart(prev => {
            // Un item en el carrito es único por PRODUCTO + LOTE
            const existing = prev.find(item => 
                item.id === product.id && item.selectedBatchId === batch?.id
            );
            
            if (existing) {
                const stockLimit = batch ? batch.current_quantity : product.stock;
                if (existing.cartQuantity >= stockLimit) {
                    toast.error("No hay más stock disponible en este lote");
                    return prev;
                }
                return prev.map(item => 
                    (item.id === product.id && item.selectedBatchId === batch?.id)
                        ? { ...item, cartQuantity: item.cartQuantity + 1 }
                        : item
                );
            }
            return [...prev, { 
                ...product, 
                cartQuantity: 1, 
                selectedBatchId: batch?.id,
                selectedBatchNumber: batch?.batch_number,
                discount: 0
            }];
        });
        
        if (batch) {
            setIsBatchModalOpen(false);
            setCurrentProductForBatch(null);
        }
    };

    const removeFromCart = (productId: number, batchId?: number) => {
        setCart(prev => prev.filter(item => !(item.id === productId && item.selectedBatchId === batchId)));
    };

    const updateQuantity = (productId: number, delta: number, batchId?: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId && item.selectedBatchId === batchId) {
                const newQty = item.cartQuantity + delta;
                if (newQty <= 0) return item;
                
                // Si tiene lote, el límite es el stock del lote
                const stockLimit = item.selectedBatchId 
                    ? item.batches?.find(b => b.id === item.selectedBatchId)?.current_quantity || item.stock
                    : item.stock;

                if (newQty > stockLimit) {
                    toast.error("Stock máximo alcanzado");
                    return item;
                }
                return { ...item, cartQuantity: newQty };
            }
            return item;
        }));
    };

    const updateItemDiscount = (productId: number, discount: number, batchId?: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId && item.selectedBatchId === batchId) {
                return { ...item, discount: Math.min(100, Math.max(0, discount)) };
            }
            return item;
        }));
    };

    const total = useMemo(() => {
        return cart.reduce((acc, item) => {
            const itemSubtotal = (Number(item.price) * item.cartQuantity);
            const itemDiscount = itemSubtotal * ((item.discount || 0) / 100);
            return acc + (itemSubtotal - itemDiscount);
        }, 0);
    }, [cart]);

    const totalAfterGlobalDiscount = useMemo(() => {
        return total * (1 - globalDiscount / 100);
    }, [total, globalDiscount]);

    const finalTotal = useMemo(() => {
        return Math.max(0, totalAfterGlobalDiscount - pointsDiscount);
    }, [totalAfterGlobalDiscount, pointsDiscount]);

    const handleCheckout = () => {
        if (cart.length === 0) {
            toast.error("El carrito está vacío");
            return;
        }
        setIsPaymentModalOpen(true);
    };

    const confirmSale = async () => {
        const saleData = {
            payment_method: paymentMethod,
            items: cart.map(item => ({
                product_id: item.id,
                batch_id: item.selectedBatchId || null,
                quantity: item.cartQuantity,
                unit_price: Number(item.price) * (1 - (item.discount || 0) / 100) * (1 - globalDiscount / 100)
            })),
            customer_id: selectedCustomer?.id || null,
            cash_session_id: activeSession?.id || null,
            redeemed_points: redeemedPoints,
            notes: ""
        };
        
        try {
            const result = await saveSale(saleData);
            if (result.success) {
                if (result.offline) {
                    toast.success("Venta guardada localmente (Modo Offline)");
                    setCart([]);
                    setSelectedCustomer(null);
                    setRedeemedPoints(0);
                    setIsPaymentModalOpen(false);
                    // No abrimos el éxito porque no hay PDF offline por ahora
                } else {
                    setLastSaleId(result.data.id);
                    setCart([]);
                    setSelectedCustomer(null);
                    setRedeemedPoints(0);
                    setIsPaymentModalOpen(false);
                    setIsSuccessModalOpen(true);
                    downloadTicket(result.data.id);
                    queryClient.invalidateQueries({ queryKey: ["products"] });
                    queryClient.invalidateQueries({ queryKey: ["products-pos"] });
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Error al procesar la venta");
        }
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
        
        return () => { document.head.removeChild(styleTag); };
    }, []);

    const handleScan = (data: string) => {
        setSearch(data);
        // El useEffect de auto-agregar se encargará si hay coincidencia exacta.
        // Pero para el scanner de cámara, queremos que sea proactivo:
        const found = productData?.items.find(p => p.sku === data || p.barcode === data);
        if (found) {
            addToCart(found);
            setSearch("");
            toast.success(`Agregado: ${found.name}`, { duration: 1000, position: 'bottom-center' });
        }
        
        if (!continuousMode) {
            setIsScannerOpen(false);
        }
    };

    if (!hasPermission('sales:create')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Shield className="h-16 w-16 text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Acceso Denegado</h2>
                <p className="text-gray-500 mt-2">No tienes permisos para acceder al Punto de Venta (POS).</p>
            </div>
        )
    }

    if (isSessionLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
                <p className="text-gray-500 mt-4 uppercase tracking-widest font-black text-xs">Verificando estado de la caja...</p>
            </div>
        )
    }

    if (!activeSession) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-8 bg-white rounded-[3rem] border border-dashed border-gray-200 shadow-sm">
                <div className="p-8 bg-amber-50 rounded-full mb-6">
                    <Banknote className="h-20 w-20 text-amber-500" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Caja Cerrada</h2>
                <p className="text-gray-500 mt-4 max-w-md mx-auto font-medium">
                    Para realizar ventas, primero debes abrir un turno de caja con un saldo inicial. Esto permite llevar un control exacto del efectivo.
                </p>
                <button 
                    onClick={() => {
                        setSessionModalType('open');
                        setIsSessionModalOpen(true);
                    }}
                    className="mt-10 h-16 px-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-sm transition-all active:scale-[0.98] shadow-2xl shadow-emerald-200"
                >
                    <Plus className="h-5 w-5" />
                    Abrir Caja para Empezar
                </button>
                <CashSessionModal 
                    isOpen={isSessionModalOpen} 
                    onClose={() => setIsSessionModalOpen(false)} 
                    type={sessionModalType} 
                />
            </div>
        )
    }

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6 antialiased">
            {isScannerOpen && (
                <BarcodeScanner 
                    onScan={handleScan}
                    onClose={() => setIsScannerOpen(false)} 
                    keepOpen={continuousMode}
                />
            )}
            {/* SECCIÓN IZQUIERDA: BÚSQUEDA Y PRODUCTOS */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
                {/* Barra de Búsqueda Premium */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-primary-500/5 blur-2xl rounded-3xl group-focus-within:bg-primary-500/10 transition-all" />
                    <div className="relative bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/40 p-2 flex items-center gap-3">
                        <div className="p-3 bg-white rounded-2xl text-gray-400 group-focus-within:text-primary-500 transition-colors">
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
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest hidden sm:block">Scanner Activo</span>
                        </div>
                        <button 
                            onClick={() => setIsScannerOpen(true)}
                            className="mr-2 p-3 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-2xl transition-all shadow-sm active:scale-95 flex items-center gap-2 group/scan"
                            title="Abrir Escáner de Cámara"
                        >
                            <ScanLine className="h-6 w-6" />
                            <div className="flex flex-col items-start pr-1 hidden sm:flex">
                                <span className="text-[8px] font-black uppercase tracking-tighter leading-none mb-1">Cámara</span>
                                <div 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setContinuousMode(!continuousMode);
                                    }}
                                    className={clsx(
                                        "px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest transition-colors",
                                        continuousMode ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"
                                    )}
                                >
                                    {continuousMode ? "Continuo" : "Simple"}
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Grid de Productos */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {/* Barra de Estado Offline */}
                    {!isOnline && (
                        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-3xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                                    <WifiOff className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-orange-800 uppercase tracking-tight">Modo Offline Activo</p>
                                    <p className="text-[10px] text-orange-600 font-bold uppercase">Buscando en base de datos local</p>
                                </div>
                            </div>
                            <RefreshCcw className="h-5 w-5 text-orange-300 animate-spin-slow" />
                        </div>
                    )}

                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-400">
                            <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
                            <p className="font-bold uppercase tracking-[0.2em] text-xs">Cargando catálogo...</p>
                        </div>
                    ) : itemsToShow.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-400 italic">
                            <Package className="h-16 w-16 opacity-20" />
                            <p>No se encontraron productos</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
                            {itemsToShow.map((product: Product) => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    disabled={product.stock <= 0}
                                    className={clsx(
                                        "group text-left p-4 rounded-[2rem] border transition-all duration-300 active:scale-95",
                                        product.stock <= 0 
                                            ? "bg-white border-gray-100 opacity-60 grayscale cursor-not-allowed" 
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
                <div className="p-6 bg-white/50 border-b border-gray-50 flex items-center justify-between">
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

                {/* SECCIÓN CLIENTE */}
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
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-primary-100 shadow-sm">
                                <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-bold text-gray-900 truncate uppercase">{selectedCustomer.name}</h4>
                                    <p className="text-[10px] font-medium text-gray-400 truncate">{selectedCustomer.document_number || 'Sin documento'}</p>
                                </div>
                            </div>
                                          {/* Información de Crédito del Cliente */}
                            {selectedCustomer.credit_limit > 0 && (
                                <div className="px-3 py-2 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col gap-1">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tighter">
                                        <span className="text-indigo-400">Cupo Disponible:</span>
                                        <span className="text-indigo-600">
                                            ${(Number(selectedCustomer.credit_limit) - Number(selectedCustomer.current_balance)).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="w-full h-1 bg-indigo-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-indigo-600 transition-all" 
                                            style={{ width: `${Math.min(100, (Number(selectedCustomer.current_balance) / Number(selectedCustomer.credit_limit)) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            
                            {/* Puntos de Lealtad */}
                            {loyaltyConfig?.is_active && (
                                <div className="px-3 py-2 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white font-black">P</div>
                                        <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-600">Puntos Disponibles:</span>
                                    </div>
                                    <span className="text-xs font-black text-emerald-700">{selectedCustomer.loyalty_points || 0}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="relative group/select">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within/select:text-primary-500 transition-colors" />
                            <select 
                                className="w-full bg-white border border-gray-100 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none cursor-pointer"
                                onChange={(e) => {
                                    const customer = activeCustomers?.find(c => c.id === Number(e.target.value));
                                    if (customer) setSelectedCustomer(customer);
                                }}
                                value=""
                            >
                                <option value="" disabled>Seleccionar Cliente (Caminante por defecto)</option>
                                {activeCustomers?.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} {c.document_number ? `(${c.document_number})` : ''}</option>
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
                            <p className="text-sm">Escanea productos o búscalos para comenzar la venta</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="group bg-white p-3 rounded-2xl border border-gray-100 hover:border-primary-100 hover:shadow-lg transition-all">
                                <div className="flex gap-3">
                                    <div className="h-12 w-12 flex-shrink-0 bg-white rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                                        <Package className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold text-gray-900 uppercase truncate mb-0.5">{item.name}</h4>
                                        {item.selectedBatchNumber && (
                                            <div className="flex items-center gap-1 mb-1">
                                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[8px] font-black uppercase tracking-widest">
                                                    Lote: {item.selectedBatchNumber}
                                                </span>
                                            </div>
                                        )}
                                        <p className="text-[10px] font-bold text-indigo-600">${Number(item.price).toLocaleString()} c/u</p>
                                    </div>
                                    <button 
                                        onClick={() => removeFromCart(item.id, item.selectedBatchId)}
                                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100">
                                        <button 
                                            onClick={() => updateQuantity(item.id, -1, item.selectedBatchId)}
                                            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white text-gray-500 hover:text-red-500 hover:shadow-sm transition-all"
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-8 text-center text-xs font-black text-gray-900">{item.cartQuantity}</span>
                                        <button 
                                            onClick={() => updateQuantity(item.id, 1, item.selectedBatchId)}
                                            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white text-gray-500 hover:text-emerald-500 hover:shadow-sm transition-all"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-2 mb-1">
                                            <span className="text-[9px] font-black text-primary-500 uppercase tracking-tighter self-center">DTO %:</span>
                                            <input 
                                                type="number"
                                                className="w-12 h-6 text-[10px] font-black p-1 border border-gray-100 rounded bg-gray-50 text-center focus:ring-1 focus:ring-primary-500"
                                                value={item.discount || 0}
                                                onChange={(e) => updateItemDiscount(item.id, parseInt(e.target.value) || 0, item.selectedBatchId)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter block leading-none">Subtotal</span>
                                        <span className="text-sm font-black text-gray-900 tracking-tight">
                                            ${((Number(item.price) * item.cartQuantity) * (1 - (item.discount || 0) / 100)).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* RESUMEN Y BOTÓN ACCIÓN */}
                <div className="p-6 bg-white">
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center text-slate-400">
                            <span className="text-[10px] font-black uppercase tracking-widest">Subtotal Bruto</span>
                            <span className="text-sm font-bold">${cart.reduce((acc, item) => acc + (Number(item.price) * item.cartQuantity), 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-500 font-bold">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest">Desc. Global %</span>
                                <input 
                                    type="number"
                                    className="w-14 h-7 text-xs p-1 border border-emerald-100 rounded bg-emerald-50 text-center focus:ring-1 focus:ring-emerald-500"
                                    value={globalDiscount}
                                    onChange={(e) => setGlobalDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                />
                            </div>
                            <span className="text-sm font-bold">-${(total * (globalDiscount / 100)).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                            <span className="text-[10px] font-black uppercase tracking-widest">Impuestos (Incl.)</span>
                            <span className="text-sm font-bold">$0.00</span>
                        </div>
                        {pointsDiscount > 0 && (
                            <div className="flex justify-between items-center text-emerald-500 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                <span className="text-[10px] font-black uppercase tracking-widest">Descuento Puntos ({redeemedPoints})</span>
                                <span className="text-sm font-bold">-${pointsDiscount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em]">Total a Pagar</span>
                            <span className="text-3xl font-black text-slate-900 tracking-tighter">${finalTotal.toLocaleString()}</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className={clsx(
                            "w-full h-16 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] font-black uppercase tracking-[0.15em] text-sm shadow-2xl",
                            cart.length === 0 
                                ? "bg-white text-slate-600 grayscale cursor-not-allowed" 
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
                        <div className="fixed inset-0 bg-white bg-opacity-70 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)} />
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
                                    <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                                        <X className="h-6 w-6 text-gray-300" />
                                    </button>
                                </div>

                                {/* Redención de Puntos */}
                                {loyaltyConfig?.is_active && selectedCustomer && selectedCustomer.loyalty_points >= (loyaltyConfig.min_redemption_points || 0) && (
                                    <div className="mb-8 p-6 bg-emerald-50/50 rounded-[2rem] border-2 border-emerald-100 border-dashed">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-emerald-500 rounded-lg text-white">
                                                    <ShoppingCart className="h-4 w-4" />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-widest text-emerald-700">Usar mis puntos</span>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-600">{selectedCustomer.loyalty_points} disp.</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <input 
                                                type="number" 
                                                className="flex-1 bg-white border-none rounded-xl px-4 py-3 text-sm font-black text-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                                                placeholder="Puntos a redimir..."
                                                value={redeemedPoints || ''}
                                                onChange={(e) => {
                                                    const val = Math.min(selectedCustomer.loyalty_points, Math.max(0, parseInt(e.target.value) || 0));
                                                    setRedeemedPoints(val);
                                                }}
                                            />
                                            <div className="text-right">
                                                <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Ahorro</p>
                                                <p className="text-sm font-black text-emerald-700">-${pointsDiscount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    {[
                                        { id: 'cash', name: 'Efectivo', icon: Banknote, color: 'emerald' },
                                        { id: 'card', name: 'Tarjeta', icon: CreditCard, color: 'blue' },
                                        { id: 'transfer', name: 'Transferencia', icon: ArrowRight, color: 'indigo' },
                                        { id: 'credit', name: 'Crédito', icon: Shield, color: 'purple' },
                                    ].map((method) => {
                                        const isCredit = method.id === 'credit';
                                        const hasNoCustomer = isCredit && !selectedCustomer;
                                        const noCreditLimit = isCredit && selectedCustomer && Number(selectedCustomer.credit_limit) <= 0;
                                        const insufficientCredit = isCredit && selectedCustomer && (Number(selectedCustomer.current_balance) + total > Number(selectedCustomer.credit_limit));
                                        
                                        const isDisabled = hasNoCustomer || noCreditLimit || insufficientCredit;

                                        return (
                                            <button
                                                key={method.id}
                                                onClick={() => setPaymentMethod(method.id as any)}
                                                disabled={Boolean(isDisabled)}
                                                className={clsx(
                                                    "p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 active:scale-95 group relative",
                                                    paymentMethod === method.id 
                                                        ? `bg-${method.color}-50/50 border-${method.color}-500 text-${method.color}-600 shadow-xl shadow-${method.color}-100` 
                                                        : isDisabled
                                                            ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed opacity-50"
                                                            : "bg-white border-gray-50 text-gray-400 hover:border-gray-100"
                                                )}
                                            >
                                                <method.icon className="h-8 w-8" />
                                                <span className="text-xs font-black uppercase tracking-widest">{method.name}</span>
                                                {paymentMethod === method.id && (
                                                    <div className={clsx("h-2 w-2 rounded-full bg-current animate-pulse")} />
                                                )}
                                                
                                                {isDisabled && (
                                                    <div className="absolute inset-x-0 -bottom-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="bg-red-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase whitespace-nowrap">
                                                            {hasNoCustomer ? "Sin Cliente" : noCreditLimit ? "Sin Cupo" : "Cupo Insuficiente"}
                                                        </span>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 mb-8 flex justify-between items-center">
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
                        <div className="fixed inset-0 bg-white/90 backdrop-blur-md" />
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
                                    className="w-full h-16 bg-white hover:bg-white text-gray-600 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                                >
                                    Nueva Venta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE SELECCIÓN DE LOTE */}
            {isBatchModalOpen && currentProductForBatch && (
                <div className="fixed inset-0 z-[65] overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsBatchModalOpen(false)} />
                        <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                            <Package className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight line-clamp-1">{currentProductForBatch.name}</h3>
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Selecciona un lote físico</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsBatchModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                                        <X className="h-6 w-6 text-gray-300" />
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {currentProductForBatch.batches?.filter(b => b.current_quantity > 0).length === 0 ? (
                                        <div className="p-10 text-center text-gray-400 italic">
                                            No hay lotes con stock disponible para este producto.
                                        </div>
                                    ) : (
                                        currentProductForBatch.batches?.filter(b => b.current_quantity > 0).map((batch) => {
                                            const expDate = new Date(batch.expiration_date);
                                            const isExpiringSoon = expDate.getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000;
                                            
                                            return (
                                                <button
                                                    key={batch.id}
                                                    onClick={() => addToCart(currentProductForBatch, batch)}
                                                    className="w-full flex items-center justify-between p-5 rounded-3xl border border-gray-100 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all text-left group/batch"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-gray-900 uppercase">Lote: {batch.batch_number}</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={clsx(
                                                                "text-[10px] font-bold uppercase tracking-tight",
                                                                isExpiringSoon ? "text-red-500" : "text-gray-400"
                                                            )}>
                                                                Vence: {new Date(batch.expiration_date).toLocaleDateString()}
                                                            </span>
                                                            {isExpiringSoon && (
                                                                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[8px] font-black uppercase tracking-tighter animate-pulse">
                                                                    Casi Vencido
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block leading-none mb-1">Stock Lote</span>
                                                        <span className="text-xl font-black text-gray-900 tracking-tighter group-hover/batch:text-indigo-600 transition-colors">
                                                            {batch.current_quantity}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                                
                                <div className="mt-8 pt-6 border-t border-gray-50">
                                    <button 
                                        onClick={() => setIsBatchModalOpen(false)}
                                        className="w-full h-14 bg-gray-50 hover:bg-gray-100 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <CashSessionModal 
                isOpen={isSessionModalOpen} 
                onClose={() => setIsSessionModalOpen(false)} 
                type={sessionModalType} 
            />

            {/* BOTONES FLOTANTES */}
            <div className="fixed bottom-10 right-10 z-50 flex flex-col gap-4">
                <button
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="p-4 bg-orange-600 text-white rounded-full shadow-2xl shadow-orange-200 hover:bg-orange-500 transition-all group flex items-center gap-0 hover:gap-3 px-4"
                >
                    <Receipt className="h-6 w-6" />
                    <span className="max-w-0 overflow-hidden group-hover:max-w-[200px] transition-all font-black uppercase text-[10px] tracking-widest">
                        Registrar Gasto
                    </span>
                </button>
                
                <button
                    onClick={() => {
                        setSessionModalType('close');
                        setIsSessionModalOpen(true);
                    }}
                    className="p-4 bg-red-600 text-white rounded-full shadow-2xl shadow-red-200 hover:bg-red-500 transition-all group flex items-center gap-0 hover:gap-3 px-4"
                >
                    <X className="h-6 w-6" />
                    <span className="max-w-0 overflow-hidden group-hover:max-w-[200px] transition-all font-black uppercase text-[10px] tracking-widest">
                        Cerrar Turno / Caja
                    </span>
                </button>
            </div>

            <ExpenseModal 
                isOpen={isExpenseModalOpen} 
                onClose={() => setIsExpenseModalOpen(false)} 
                cashSessionId={activeSession?.id}
            />
        </div>
    );
}

