import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { 
    Shield, Package, AlertTriangle, ArrowRightLeft, ArrowUpCircle, 
    ArrowDownCircle, Search, Filter, History, Calendar, 
    TrendingUp, TrendingDown, RefreshCw, X, FileDown 
} from 'lucide-react'
import QuickMoveModal from '@/components/products/QuickMoveModal'
import { usePermissions } from '@/hooks/usePermissions'
import type { PaginatedResponse } from '@/types'
import clsx from 'clsx'
import Pagination from '@/components/common/Pagination'

export default function Inventory() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [activeTab, setActiveTab] = useState<'stock' | 'movements'>((searchParams.get('tab') as 'stock' | 'movements') || 'stock')
    const [page, setPage] = useState(1)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [isFiltersVisible, setIsFiltersVisible] = useState(false)
    const [movementSearch, setMovementSearch] = useState('')
    const [stockSearch, setStockSearch] = useState('')
    const [lowStockOnly, setLowStockOnly] = useState(false)
    const { hasPermission } = usePermissions()

    const [isQuickMoveModalOpen, setIsQuickMoveModalOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<any>(null)
    const [quickMoveType, setQuickMoveType] = useState<"entry" | "exit">("entry")

    // 1. Cargar stock actual (Productos)
    const { data: stockData, isLoading: isLoadingStock, refetch: refetchStock } = useQuery<PaginatedResponse<any>>({
        queryKey: ['stock-levels', page, stockSearch, lowStockOnly],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                size: '10',
                search: stockSearch,
                low_stock: lowStockOnly.toString()
            })
            const response = await api.get(`/api/v1/products/?${params.toString()}`)
            return response.data
        },
        enabled: activeTab === 'stock'
    })

    // 2. Cargar historial de movimientos (Kardex)
    const { data: movementsData, isLoading: isLoadingMovements } = useQuery<PaginatedResponse<any>>({
        queryKey: ['movements', page, startDate, endDate, movementSearch],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                size: '10',
                ...(movementSearch && { search: movementSearch }),
                ...(startDate && { start_date: startDate }),
                ...(endDate && { end_date: endDate }),
            })
            const response = await api.get(`/api/v1/inventory/?${params.toString()}`)
            return response.data
        },
        enabled: activeTab === 'movements'
    })

    useEffect(() => {
        const tab = searchParams.get('tab') as 'stock' | 'movements'
        if (tab && tab !== activeTab) {
            setActiveTab(tab)
        }
    }, [searchParams])

    const handleTabChange = (tab: 'stock' | 'movements') => {
        setActiveTab(tab)
        setSearchParams({ tab })
    }

    useEffect(() => {
        setPage(1)
    }, [startDate, endDate, movementSearch, stockSearch, lowStockOnly, activeTab])

    const handleExportExcel = async () => {
        try {
            const params = new URLSearchParams({
                ...(movementSearch && { search: movementSearch }),
                ...(startDate && { start_date: startDate }),
                ...(endDate && { end_date: endDate }),
            })
            
            toast.loading('Generando Excel...', { id: 'export-excel' })
            const response = await api.get(`/api/v1/reports/movements-excel?${params}`, {
                responseType: 'blob'
            })
            
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `Movimientos_${new Date().toISOString().split('T')[0]}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            toast.success('Excel generado correctamente', { id: 'export-excel' })
        } catch (error) {
            toast.error('Error al generar Excel', { id: 'export-excel' })
        }
    }

    if (!hasPermission('inventory:view')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Shield className="h-16 w-16 text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Acceso Denegado</h2>
                <p className="text-gray-500 mt-2">No tienes permisos para ver el inventario.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 leading-tight tracking-tight">Inventario Global</h1>
                    <p className="mt-1 text-sm text-gray-500 font-medium italic">Control de existencias y flujo de mercancía</p>
                </div>
                {activeTab === 'movements' && (
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsFiltersVisible(true)}
                            className={clsx(
                                "btn flex items-center gap-2 h-10 px-4 transition-all border shadow-sm rounded-xl text-xs uppercase tracking-widest font-bold",
                                (startDate || endDate || movementSearch)
                                    ? "bg-primary-50 border-primary-200 text-primary-700" 
                                    : "bg-white border-gray-200 text-gray-600 hover:bg-white"
                            )}
                        >
                            <Filter className="h-4 w-4" />
                            Filtrar Historial
                            {(startDate || endDate || movementSearch) && (
                                <span className="flex h-2 w-2 rounded-full bg-primary-600 animate-pulse" />
                            )}
                        </button>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1 p-1 bg-gray-100/50 rounded-2xl w-fit border border-gray-100">
                <button
                    onClick={() => handleTabChange('stock')}
                    className={clsx(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        activeTab === 'stock' 
                            ? "bg-white text-primary-700 shadow-sm border border-gray-100" 
                            : "text-gray-500 hover:text-gray-700 font-bold"
                    )}
                >
                    <Package className="h-4 w-4" />
                    Existencias (Stock)
                </button>
                <button
                    onClick={() => handleTabChange('movements')}
                    className={clsx(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        activeTab === 'movements' 
                            ? "bg-white text-primary-700 shadow-sm border border-gray-100" 
                            : "text-gray-500 hover:text-gray-700 font-bold"
                    )}
                >
                    <ArrowRightLeft className="h-4 w-4" />
                    Kardex (Historial)
                </button>
            </div>

            <div className="card border-none shadow-xl shadow-gray-200/50">
                {activeTab === 'stock' ? (
                    <div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
                                    <Package className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Niveles de Stock Actual</h2>
                                    <p className="text-sm text-gray-500 italic font-medium">Vista general de existencias por producto</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input 
                                        type="text"
                                        placeholder="Buscar producto..."
                                        value={stockSearch}
                                        onChange={(e) => setStockSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-primary-200 rounded-xl text-sm transition-all outline-none"
                                    />
                                </div>
                                <button
                                    onClick={() => setLowStockOnly(!lowStockOnly)}
                                    className={clsx(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                        lowStockOnly 
                                            ? "bg-red-50 text-red-700 border-red-100 shadow-sm" 
                                            : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50"
                                    )}
                                >
                                    <AlertTriangle className={clsx("h-4 w-4", lowStockOnly ? "animate-pulse" : "opacity-40")} />
                                    Solo Bajo Stock
                                </button>
                            </div>
                        </div>

                        {isLoadingStock ? (
                            <div className="text-center py-12">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                                <p className="mt-2 text-sm text-gray-400 font-bold uppercase tracking-widest">Cargando existencias...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead>
                                        <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            <th className="px-4 py-3 pb-4">Cod. / SKU</th>
                                            <th className="px-4 py-3 pb-4">Producto</th>
                                            <th className="px-4 py-3 pb-4 text-center">Ubicación</th>
                                            <th className="px-4 py-3 pb-4 text-center">Mínimo</th>
                                            <th className="px-4 py-3 pb-4 text-center">Stock Actual</th>
                                            <th className="px-4 py-3 pb-4 text-center">Estado</th>
                                            <th className="px-4 py-3 pb-4 text-right">Ajuste</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {stockData?.items.map((p: any) => {
                                            const isLow = p.stock <= p.min_stock;
                                            return (
                                                <tr key={p.id} className="text-sm hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-4 py-4">
                                                        <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md uppercase">
                                                            {p.sku}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="font-bold text-gray-900">{p.name}</div>
                                                        <div className="text-[10px] text-gray-400 font-medium italic truncate">{p.category?.name || 'S/C'}</div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        {p.branch_stocks && p.branch_stocks.length > 0 ? (
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-[10px] font-black text-primary-700 bg-primary-50 px-2 py-0.5 rounded uppercase tracking-tighter border border-primary-100">
                                                                    {p.branch_stocks[0].aisle || '-'}-{p.branch_stocks[0].shelf || '-'}-{p.branch_stocks[0].bin || '-'}
                                                                </span>
                                                                <span className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">P-E-G</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-300">---</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-xs font-bold text-gray-500">{p.min_stock}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={clsx(
                                                            "text-lg font-black",
                                                            isLow ? "text-red-600" : "text-emerald-600"
                                                        )}>
                                                            {p.stock}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        {isLow ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-[9px] font-black uppercase tracking-widest rounded-full border border-red-100 shadow-sm animate-pulse">
                                                                <AlertTriangle className="h-3 w-3" />
                                                                Bajo Stock
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                                                                Normal
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-right whitespace-nowrap">
                                                        <div className="flex justify-end gap-1 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                            <button 
                                                                onClick={() => {
                                                                    setSelectedProduct(p);
                                                                    setQuickMoveType("entry");
                                                                    setIsQuickMoveModalOpen(true);
                                                                }}
                                                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl shadow-sm border border-emerald-100/50 transition-all"
                                                                title="Agregar Stock"
                                                            >
                                                                <ArrowUpCircle className="h-5 w-5" />
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    setSelectedProduct(p);
                                                                    setQuickMoveType("exit");
                                                                    setIsQuickMoveModalOpen(true);
                                                                }}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-xl shadow-sm border border-red-100/50 transition-all"
                                                                title="Retirar Stock"
                                                            >
                                                                <ArrowDownCircle className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>

                                {stockData?.items.length === 0 && (
                                    <div className="text-center py-12">
                                        <Package className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No se encontraron productos</p>
                                    </div>
                                )}

                                {stockData && (stockData.metadata?.pages || 0) > 1 && (
                                    <div className="mt-6 pt-6 border-t border-gray-50">
                                        <Pagination 
                                            currentPage={page}
                                            totalPages={stockData.metadata?.pages || 0}
                                            onPageChange={setPage}
                                            totalItems={stockData.metadata?.total}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
                                    <History className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Historial de Movimientos</h2>
                                    <p className="text-sm text-gray-500 italic font-medium">Registro detallado de entradas, salidas y ajustes</p>
                                </div>
                            </div>
                        </div>

                        {isLoadingMovements ? (
                            <div className="text-center py-12">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                                <p className="mt-2 text-sm text-gray-400 font-bold uppercase tracking-widest">Cargando historial...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead>
                                        <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            <th className="px-4 py-3 pb-4">Fecha</th>
                                            <th className="px-4 py-3 pb-4">Tipo</th>
                                            <th className="px-4 py-3 pb-4">Producto</th>
                                            <th className="px-4 py-3 pb-4 text-right">Cantidad</th>
                                            <th className="px-4 py-3 pb-4">Notas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {movementsData?.items.map((m: any) => (
                                            <tr key={m.id} className="text-sm hover:bg-white/50 transition-colors">
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-3.5 w-3.5 text-gray-300" />
                                                        <span className="font-medium text-gray-600">{new Date(m.created_at).toLocaleDateString()}</span>
                                                        <span className="text-[10px] text-gray-400">{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={clsx(
                                                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm",
                                                        m.type === 'ENTRY' || m.type === 'INITIAL' ? 'bg-emerald-50 text-emerald-700' : 
                                                        m.type === 'EXIT' ? 'bg-red-50 text-red-700' : 
                                                        'bg-blue-50 text-blue-700'
                                                    )}>
                                                        {m.type === 'ENTRY' || m.type === 'INITIAL' ? <TrendingUp className="h-3 w-3" /> : 
                                                         m.type === 'EXIT' ? <TrendingDown className="h-3 w-3" /> : 
                                                         <RefreshCw className="h-3 w-3" />}
                                                        {m.type === 'ENTRY' || m.type === 'INITIAL' ? 'Entrada' : m.type === 'EXIT' ? 'Salida' : 'Ajuste'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 max-w-[200px]">
                                                    <div className="font-bold text-gray-900 truncate">{m.product_name}</div>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className={clsx(
                                                        "font-black text-lg",
                                                        m.type === 'ENTRY' || m.type === 'INITIAL' ? 'text-emerald-600' : 
                                                        m.type === 'EXIT' ? 'text-red-600' : 
                                                        'text-blue-600'
                                                    )}>
                                                        {m.type === 'EXIT' ? '-' : m.type === 'ENTRY' || m.type === 'INITIAL' ? '+' : ''}{m.quantity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-xs text-gray-500 italic max-w-[150px] truncate">
                                                    {m.notes || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                
                                {movementsData && (movementsData.metadata?.pages || 0) > 1 && (
                                    <div className="mt-6 pt-6 border-t border-gray-50">
                                        <Pagination 
                                            currentPage={page}
                                            totalPages={movementsData.metadata?.pages || 0}
                                            onPageChange={setPage}
                                            totalItems={movementsData.metadata?.total}
                                        />
                                    </div>
                                )}
                                
                                {movementsData?.items.length === 0 && (
                                    <div className="text-center py-12">
                                        <History className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No se encontraron movimientos</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de Filtros (Ventana Flotante) */}
            {isFiltersVisible && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsFiltersVisible(false)} />
                        
                        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-xl">
                            <div className="bg-white px-6 py-6 border-b border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
                                        <Filter className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 line-clamp-1">Filtros de Kardex</h3>
                                </div>
                                <button onClick={() => setIsFiltersVisible(false)} className="text-gray-400 hover:text-gray-500 p-1 hover:bg-white rounded-lg">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="px-6 py-8 space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Búsqueda Rápida</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="text"
                                            placeholder="Producto, SKU o notas..."
                                            className="input pl-12 h-12 bg-white border-gray-100 rounded-xl text-sm font-medium focus:bg-white transition-all shadow-sm"
                                            value={movementSearch}
                                            onChange={(e) => setMovementSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-50 flex flex-col gap-3">
                                    {hasPermission('reports:view') && (
                                        <button 
                                            onClick={handleExportExcel}
                                            className="btn bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-emerald-200"
                                        >
                                            <FileDown className="h-5 w-5" />
                                            Exportar a Excel
                                        </button>
                                    )}
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => {
                                                setMovementSearch('')
                                                setStartDate('')
                                                setEndDate('')
                                                setIsFiltersVisible(false)
                                            }}
                                            className="btn border border-gray-200 text-gray-500 h-11 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white shadow-sm"
                                        >
                                            Limpiar
                                        </button>
                                        <button 
                                            onClick={() => setIsFiltersVisible(false)}
                                            className="btn btn-primary h-11 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary-200"
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

            {/* Reutilizar modal de movimiento rápido de productos */}
            {isQuickMoveModalOpen && (
                <QuickMoveModal
                    isOpen={isQuickMoveModalOpen}
                    onClose={() => setIsQuickMoveModalOpen(false)}
                    product={selectedProduct}
                    type={quickMoveType}
                    onSuccess={() => {
                        refetchStock()
                        toast.success('Movimiento registrado correctamente')
                    }}
                />
            )}
        </div>
    )
}
