import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { branchApi } from '@/api/branches'
import { ClipboardList, Plus, AlertCircle, History, CheckCircle2, ArrowRight, Search, ScanLine, X, Loader2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { InventoryAudit, Branch, Product, InventoryAuditItem } from '@/types'
import clsx from 'clsx'
import BarcodeScanner from '@/components/pos/BarcodeScanner'

export default function InventoryAudits() {
    const queryClient = useQueryClient()
    const [isCreating, setIsCreating] = useState(false)
    const [selectedBranch, setSelectedBranch] = useState('')
    const [notes, setNotes] = useState('')
    const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null)

    // 1. Cargar Sucursales
    const { data: branches } = useQuery<Branch[]>({
        queryKey: ["branches-active"],
        queryFn: async () => {
            const response = await branchApi.getActive()
            return response.data || []
        }
    })

    // 2. Cargar Auditorías Recientes
    const { data: audits, isLoading: isLoadingAudits } = useQuery<InventoryAudit[]>({
        queryKey: ["inventory-audits"],
        queryFn: async () => {
            const response = await api.get('/api/v1/inventory-audits')
            return response.data
        }
    })

    const startAuditMutation = useMutation({
        mutationFn: (data: any) => api.post('/api/v1/inventory-audits', data),
        onSuccess: (res) => {
            toast.success("Auditoría iniciada")
            setIsCreating(false)
            setSelectedAuditId(res.data.id)
            queryClient.invalidateQueries({ queryKey: ["inventory-audits"] })
        },
        onError: () => toast.error("Error al iniciar auditoría")
    })

    const handleStartAudit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedBranch) return toast.error("Seleccione una sucursal")
        startAuditMutation.mutate({ branch_id: parseInt(selectedBranch), notes })
    }

    if (selectedAuditId) {
        return <AuditCountingView auditId={selectedAuditId} onBack={() => {
            setSelectedAuditId(null)
            queryClient.invalidateQueries({ queryKey: ["inventory-audits"] })
        }} />
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
                        <ClipboardList className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Toma Física</h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Auditoría y Reconciliación</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="h-14 px-8 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 group active:scale-95"
                >
                    <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                    <span>Nueva Auditoría</span>
                </button>
            </div>

            {isCreating && (
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Plus className="h-5 w-5" />
                        </div>
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Configurar Nueva Sesión</h2>
                    </div>
                    
                    <form onSubmit={handleStartAudit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Seleccionar Sucursal</label>
                            <select 
                                className="w-full h-16 px-6 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-black focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all appearance-none"
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                required
                            >
                                <option value="" className="font-bold">Sucursal a auditar...</option>
                                {branches?.map((b) => (
                                    <option key={b.id} value={b.id} className="font-bold">{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Propósito / Nota</label>
                            <input 
                                type="text" 
                                className="w-full h-16 px-6 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-black focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all placeholder:text-gray-300" 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ej: Inventario Mensual de Abarrotes"
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-50 mt-4">
                            <button type="button" onClick={() => setIsCreating(false)} className="h-16 px-10 text-gray-400 font-bold uppercase tracking-widest text-[10px] hover:text-gray-600 transition-all">Descartar</button>
                            <button type="submit" className="h-16 px-12 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all" disabled={startAuditMutation.isPending}>
                                {startAuditMutation.isPending ? "INICIANDO..." : "ABRIR AUDITORÍA"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
                    <div className="px-8 py-8 border-b border-gray-50 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                                <History className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Sesiones de Bodega</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Historial de tomas físicas</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 p-6">
                        {isLoadingAudits ? (
                            <div className="h-full flex flex-col items-center justify-center">
                                <Loader2 className="h-10 w-10 text-indigo-400 animate-spin mb-4" />
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Sincronizando registros...</p>
                            </div>
                        ) : audits && audits.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {audits.map((audit) => (
                                    <div 
                                        key={audit.id} 
                                        onClick={() => setSelectedAuditId(audit.id)}
                                        className="group p-6 bg-white border border-gray-100 rounded-[2rem] flex items-center justify-between hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-50 transition-all cursor-pointer relative"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={clsx(
                                                "h-16 w-16 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl transition-all group-hover:scale-110",
                                                audit.status === 'COMPLETED' ? 'bg-emerald-500 shadow-emerald-100' : 'bg-indigo-500 shadow-indigo-100 animate-pulse'
                                            )}>
                                                {audit.status === 'COMPLETED' ? <CheckCircle2 className="h-8 w-8" /> : <ClipboardList className="h-8 w-8" />}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-3">
                                                    #{audit.id}
                                                    <span className="text-[10px] font-black bg-gray-100 text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest">{audit.branch?.name}</span>
                                                </h4>
                                                <div className="flex items-center gap-4 mt-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <History className="h-3 w-3 text-gray-300" />
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                                            {new Date(audit.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <span className={clsx(
                                                        "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm",
                                                        audit.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                                                    )}>
                                                        {audit.status === 'IN_PROGRESS' ? 'Sincronizando' : 'Finalizada'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Conteos</p>
                                                <p className="text-2xl font-black text-gray-900 tracking-tighter">{audit.items?.length || 0}</p>
                                            </div>
                                            <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all text-gray-300 shadow-inner">
                                                <ArrowRight className="h-6 w-6" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                <div className="h-32 w-32 bg-gray-50 rounded-[3rem] flex items-center justify-center mb-8 rotate-3 shadow-inner">
                                    <ClipboardList className="h-16 w-16 text-gray-200" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Archivo Vacío</h3>
                                <p className="text-sm text-gray-400 font-bold max-w-xs leading-relaxed uppercase tracking-tighter">
                                    No hay tomas físicas pendientes. Inicia una nueva sesión para validar tu stock real.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-[0_20px_50px_rgba(30,41,59,0.3)] min-h-[400px] flex flex-col justify-between">
                        <div className="absolute -top-10 -right-10 p-20 opacity-10 rotate-[25deg] pointer-events-none scale-150">
                            <ClipboardList className="h-64 w-64" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl">
                                    <AlertCircle className="h-8 w-8 text-indigo-300" />
                                </div>
                                <div>
                                    <h3 className="font-black text-white text-lg uppercase tracking-[0.2em]">Guía WMS</h3>
                                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em]">Proceso Auditores</p>
                                </div>
                            </div>
                            <ul className="space-y-6">
                                <li className="flex gap-4">
                                    <div className="h-6 w-6 bg-emerald-500 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black shadow-lg shadow-emerald-500/30">1</div>
                                    <p className="text-sm font-bold text-indigo-100 leading-tight">Escanee productos o use la búsqueda manual.</p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="h-6 w-6 bg-emerald-500 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black shadow-lg shadow-emerald-500/30">2</div>
                                    <p className="text-sm font-bold text-indigo-100 leading-tight">Ingrese la cantidad física real contada en estantería.</p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="h-6 w-6 bg-emerald-500 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black shadow-lg shadow-emerald-500/30">3</div>
                                    <p className="text-sm font-bold text-indigo-100 leading-tight">Finalice para generar ajustes automáticos de stock.</p>
                                </li>
                            </ul>
                        </div>
                        
                        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-[2rem] border border-white/5 mt-8">
                            <p className="text-[10px] text-indigo-200 font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" /> Importante
                            </p>
                            <p className="text-[11px] text-indigo-50 font-medium italic opacity-70">
                                "La precisión del inventario es la base de un centro logístico eficiente."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function AuditCountingView({ auditId, onBack }: { auditId: number, onBack: () => void }) {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [foundProducts, setFoundProducts] = useState<Product[]>([])
    const [isSearching, setIsSearching] = useState(false)

    // Cargar detalles de la auditoría actual
    const { data: audit, isLoading: isLoadingAudit } = useQuery<InventoryAudit>({
        queryKey: ["inventory-audit", auditId],
        queryFn: async () => {
            const response = await api.get(`/api/v1/inventory-audits/${auditId}`)
            return response.data
        }
    })

    // Mutación para agregar item contado
    const addItemMutation = useMutation({
        mutationFn: (data: { product_id: number, counted_stock: number }) => 
            api.post(`/api/v1/inventory-audits/${auditId}/items`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory-audit", auditId] })
            setFoundProducts([])
            setSearch('')
            toast.success("Producto registrado")
        },
        onError: () => toast.error("Error al registrar producto")
    })

    const removeAuditItemMutation = useMutation({
        mutationFn: (itemId: number) => api.delete(`/api/v1/inventory-audits/${auditId}/items/${itemId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory-audit", auditId] })
            toast.success("Item eliminado")
        },
        onError: () => toast.error("Error al eliminar item")
    })

    const completeAuditMutation = useMutation({
        mutationFn: () => api.post(`/api/v1/inventory-audits/${auditId}/complete`),
        onSuccess: () => {
            toast.success("Auditoría finalizada con éxito")
            onBack()
        },
        onError: () => toast.error("Error al finalizar auditoría")
    })

    const handleSearch = async (query: string) => {
        if (query.length < 3) return
        setIsSearching(true)
        try {
            const response = await api.get('/api/v1/products', { params: { search: query, size: 5 } })
            setFoundProducts(response.data.items || [])
        } finally {
            setIsSearching(false)
        }
    }

    const onScan = async (barcode: string) => {
        setIsSearching(true)
        try {
            const response = await api.get('/api/v1/products', { params: { search: barcode } })
            const products = response.data.items || []
            if (products.length === 1) {
                // Si encontramos exactamente uno, lo agregamos con cantidad 1 (o abrimos diálogo de cantidad)
                // Por ahora lo mostramos para confirmación
                setFoundProducts(products)
                setIsScannerOpen(false)
            } else if (products.length > 1) {
                setFoundProducts(products)
                setIsScannerOpen(false)
            } else {
                toast.error("Producto no encontrado")
            }
        } finally {
            setIsSearching(false)
        }
    }

    const handleAddProduct = (productId: number) => {
        const qty = prompt("Ingrese cantidad contada:", "1")
        if (qty !== null) {
            const numQty = parseFloat(qty)
            if (!isNaN(numQty)) {
                addItemMutation.mutate({ product_id: productId, counted_stock: numQty })
            }
        }
    }

    if (isLoadingAudit || !audit) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Header móvil optimizado */}
            <div className="px-6 py-8 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={onBack} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all">
                        <ArrowRight className="h-5 w-5 rotate-180 text-gray-500" />
                    </button>
                    <div className="text-center">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Auditoría #{auditId}</h2>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{audit.branch?.name}</p>
                    </div>
                    {audit.status === 'IN_PROGRESS' && (
                        <button 
                            onClick={() => {
                                if (confirm("¿Deseas finalizar el conteo? Se aplicarán los ajustes de stock.")) {
                                    completeAuditMutation.mutate()
                                }
                            }}
                            disabled={completeAuditMutation.isPending}
                            className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all active:scale-95"
                        >
                            <CheckCircle2 className="h-6 w-6" />
                        </button>
                    )}
                </div>

                {/* Buscador y Scanner */}
                <div className="flex gap-3">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                            {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                        </div>
                        <input 
                            type="text" 
                            className="w-full h-16 pl-16 pr-6 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-black focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                            placeholder="Buscar SKU o nombre..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                if (e.target.value.length >= 3) handleSearch(e.target.value)
                            }}
                        />
                    </div>
                    <button 
                        onClick={() => setIsScannerOpen(true)}
                        className="h-16 w-16 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-indigo-200 active:scale-90 transition-all active:bg-indigo-700"
                    >
                        <ScanLine className="h-7 w-7" />
                    </button>
                </div>

                {/* Resultados de búsqueda flotantes */}
                {foundProducts.length > 0 && (
                    <div className="absolute left-6 right-6 top-32 mt-4 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-4 z-40 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-50 mb-2">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resultados</p>
                             <button onClick={() => setFoundProducts([])} className="text-gray-300 hover:text-red-500"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {foundProducts.map((p: Product) => (
                                <div key={p.id} onClick={() => handleAddProduct(p.id)} className="p-4 flex items-center justify-between hover:bg-gray-50 rounded-2xl cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                         <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                                             <ScanLine className="h-5 w-5" />
                                         </div>
                                         <div>
                                             <p className="text-sm font-black text-gray-900 group-hover:text-indigo-600 uppercase transition-all">{p.name}</p>
                                             <p className="text-[10px] font-bold text-gray-400">SKU: {p.sku}</p>
                                         </div>
                                    </div>
                                    <Plus className="h-5 w-5 text-gray-300" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Lista de Items Contados */}
            <div className="flex-1 p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Productos Contados</h3>
                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest">{audit.items?.length || 0} ITEMS</span>
                </div>

                {audit.items && audit.items.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {audit.items.map((item: InventoryAuditItem) => (
                            <div key={item.id} className="p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100">
                                            <span className="text-sm font-black uppercase tracking-widest">{item.product?.name?.substring(0, 2)}</span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.product?.name}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 mt-0.5">SKU: {item.product?.sku}</p>
                                        </div>
                                    </div>
                                    {audit.status === 'IN_PROGRESS' && (
                                        <button 
                                            onClick={() => {
                                                if (confirm("¿Eliminar este registro de conteo?")) {
                                                    removeAuditItemMutation.mutate(item.id)
                                                }
                                            }}
                                            className="p-2 text-gray-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 bg-gray-50/50 rounded-2xl text-center border border-gray-50/50">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Teórico</p>
                                        <p className="text-sm font-black text-gray-900 tracking-tighter">{item.expected_stock}</p>
                                    </div>
                                    <div className="p-3 bg-indigo-50/50 rounded-2xl text-center border border-indigo-100 shadow-sm">
                                        <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">Contado</p>
                                        <p className="text-sm font-black text-indigo-600 tracking-tighter">{item.counted_stock}</p>
                                    </div>
                                    <div className={clsx(
                                        "p-3 rounded-2xl text-center border",
                                        item.discrepancy === 0 ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600' : 
                                        item.discrepancy > 0 ? 'bg-amber-50/50 border-amber-100 text-amber-600' : 
                                        'bg-rose-50/50 border-rose-100 text-rose-600'
                                    )}>
                                        <p className="text-[8px] font-black uppercase tracking-widest mb-1">Difer.</p>
                                        <p className="text-sm font-black tracking-tighter">{item.discrepancy > 0 ? `+${item.discrepancy}` : item.discrepancy}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40 grayscale">
                        <div className="h-24 w-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner">
                            <Plus className="h-10 w-10 text-gray-300" />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Comienza el escaneo</p>
                    </div>
                )}
            </div>

            {/* Scanner Component */}
            {isScannerOpen && (
                <BarcodeScanner 
                    onScan={onScan} 
                    onClose={() => setIsScannerOpen(false)} 
                    keepOpen={false} 
                />
            )}

            {/* Float Menu for Finalizing Audit on Small Devices */}
            {audit.status === 'IN_PROGRESS' && (
                <div className="md:hidden fixed bottom-6 left-6 right-6 z-20">
                    <button 
                        onClick={() => {
                            if (confirm("¿Finalizar toma física?")) completeAuditMutation.mutate()
                        }}
                        className="w-full h-16 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <CheckCircle2 className="h-6 w-6" />
                        Finalizar Auditoría
                    </button>
                </div>
            )}
        </div>
    )
}
