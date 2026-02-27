import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { TrendingUp, TrendingDown, RefreshCw, FileDown, Filter, Calendar, History, Search, X } from 'lucide-react'
import type { Product, PaginatedResponse } from '@/types'
import DateRangePicker from '@/components/common/DateRangePicker'
import Pagination from '@/components/common/Pagination'
import clsx from 'clsx'
import { useEffect } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { Shield } from 'lucide-react'

export default function Inventory() {
    const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
    const [quantity, setQuantity] = useState('')
    const [notes, setNotes] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all')
    const [page, setPage] = useState(1)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [isFiltersVisible, setIsFiltersVisible] = useState(false)
    const [movementSearch, setMovementSearch] = useState('')
    const queryClient = useQueryClient()
    const { hasPermission } = usePermissions()

    const { data: categoriesData } = useQuery<PaginatedResponse<any>>({
        queryKey: ['categories-all'],
        queryFn: async () => {
            const response = await api.get('/api/v1/categories/?size=100')
            return response.data
        }
    })

    const { data: productsData } = useQuery<PaginatedResponse<Product>>({
        queryKey: ['products-filtered', selectedCategory],
        queryFn: async () => {
            const params = new URLSearchParams({
                size: '200',
                ...(selectedCategory !== 'all' && { category_id: selectedCategory.toString() })
            })
            const response = await api.get(`/api/v1/products/?${params.toString()}`)
            return response.data
        },
    })

    // 3. Cargar historial de movimientos con filtros
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
        }
    })

    useEffect(() => {
        setPage(1)
    }, [startDate, endDate, movementSearch])

    const addStockMutation = useMutation({
        mutationFn: (data: any) => api.post('/api/v1/inventory/add-stock', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products-filtered'] })
            toast.success('Stock agregado exitosamente')
            resetForm()
        },
        onError: () => toast.error('Error al agregar stock'),
    })

    const removeStockMutation = useMutation({
        mutationFn: (data: any) => api.post('/api/v1/inventory/remove-stock', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products-filtered'] })
            toast.success('Stock removido exitosamente')
            resetForm()
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'Error al remover stock')
        },
    })

    const adjustStockMutation = useMutation({
        mutationFn: (data: any) => api.post('/api/v1/inventory/adjust-stock', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products-filtered'] })
            toast.success('Stock ajustado exitosamente')
            resetForm()
        },
        onError: () => toast.error('Error al ajustar stock'),
    })

    const resetForm = () => {
        setSelectedProduct(null)
        setQuantity('')
        setNotes('')
    }

    const handleAddStock = () => {
        if (!selectedProduct || !quantity) {
            toast.error('Selecciona un producto y cantidad')
            return
        }
        addStockMutation.mutate({
            product_id: selectedProduct,
            quantity: parseInt(quantity),
            notes,
        })
    }

    const handleRemoveStock = () => {
        if (!selectedProduct || !quantity) {
            toast.error('Selecciona un producto y cantidad')
            return
        }
        removeStockMutation.mutate({
            product_id: selectedProduct,
            quantity: parseInt(quantity),
            notes,
        })
    }

    const handleAdjustStock = () => {
        if (!selectedProduct || !quantity) {
            toast.error('Selecciona un producto y cantidad')
            return
        }
        adjustStockMutation.mutate({
            product_id: selectedProduct,
            new_stock: parseInt(quantity),
            notes,
        })
    }

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

    const selectedProductData = productsData?.items?.find((p: Product) => p.id === selectedProduct)

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
                    <h1 className="text-2xl font-black text-gray-900 leading-tight tracking-tight">Kardex de Inventario</h1>
                    <p className="mt-1 text-sm text-gray-500 font-medium italic">Control de existencias y flujo de mercancía</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsFiltersVisible(true)}
                        className={clsx(
                            "btn flex items-center gap-2 h-10 px-4 transition-all border shadow-sm rounded-xl text-xs uppercase tracking-widest font-bold",
                            (startDate || endDate || movementSearch)
                                ? "bg-primary-50 border-primary-200 text-primary-700" 
                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        <Filter className="h-4 w-4" />
                        Filtrar Historial
                        {(startDate || endDate || movementSearch) && (
                            <span className="flex h-2 w-2 rounded-full bg-primary-600 animate-pulse" />
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {hasPermission('inventory:adjust') && (
                    <div className="card">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Movimiento de Stock</h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Categoría</label>
                                    <select
                                        className="input"
                                        value={selectedCategory}
                                        onChange={(e) => {
                                            setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))
                                            setSelectedProduct(null)
                                        }}
                                    >
                                        <option value="all">Todas las categorías</option>
                                        {categoriesData?.items?.map((cat: any) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                                    <select
                                        className="input"
                                        value={selectedProduct || ''}
                                        onChange={(e) => setSelectedProduct(Number(e.target.value))}
                                    >
                                        <option value="">Seleccionar producto...</option>
                                        {productsData?.items?.map((product: Product) => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} - Stock: {product.stock}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {selectedProductData && (
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">SKU:</span>
                                            <span className="ml-2 font-medium">{selectedProductData.sku}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Stock Actual:</span>
                                            <span className="ml-2 font-semibold text-primary-600">{selectedProductData.stock}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Stock Mínimo:</span>
                                            <span className="ml-2">{selectedProductData.min_stock}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Precio:</span>
                                            <span className="ml-2">${Number(selectedProductData.price).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                                <textarea
                                    className="input"
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Razón del movimiento..."
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                                <button
                                    onClick={handleAddStock}
                                    disabled={!selectedProduct || !quantity}
                                    className="btn btn-primary flex items-center justify-center gap-2 h-11 sm:h-auto"
                                >
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="sm:hidden md:inline">Agregar</span>
                                    <span className="hidden sm:inline md:hidden">Add</span>
                                </button>
                                <button
                                    onClick={handleRemoveStock}
                                    disabled={!selectedProduct || !quantity}
                                    className="btn btn-danger flex items-center justify-center gap-2 h-11 sm:h-auto"
                                >
                                    <TrendingDown className="h-4 w-4" />
                                    <span className="sm:hidden md:inline">Remover</span>
                                    <span className="hidden sm:inline md:hidden">Out</span>
                                </button>
                                <button
                                    onClick={handleAdjustStock}
                                    disabled={!selectedProduct || !quantity}
                                    className="btn btn-secondary flex items-center justify-center gap-2 h-11 sm:h-auto"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    <span className="sm:hidden md:inline">Ajustar</span>
                                    <span className="hidden sm:inline md:hidden">Fix</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos con Stock Bajo</h2>
                    <div className="space-y-3">
                        {productsData?.items
                            ?.filter((p: Product) => p.stock <= p.min_stock)
                            .slice(0, 5)
                            .map((product: Product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">{product.name}</p>
                                        <p className="text-sm text-gray-600">{product.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-red-600">{product.stock} unidades</p>
                                        <p className="text-xs text-gray-500">Mín: {product.min_stock}</p>
                                    </div>
                                </div>
                            ))}
                        {productsData?.items?.filter((p: Product) => p.stock <= p.min_stock).length === 0 && (
                            <p className="text-center text-gray-500 py-8">No hay productos con stock bajo</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="card border-none shadow-xl shadow-gray-200/50">
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
                                    <tr key={m.id} className="text-sm hover:bg-gray-50/50 transition-colors">
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
                                                m.type === 'ADD' ? 'bg-emerald-50 text-emerald-700' : 
                                                m.type === 'REMOVE' ? 'bg-red-50 text-red-700' : 
                                                'bg-blue-50 text-blue-700'
                                            )}>
                                                {m.type === 'ADD' ? <TrendingUp className="h-3 w-3" /> : 
                                                 m.type === 'REMOVE' ? <TrendingDown className="h-3 w-3" /> : 
                                                 <RefreshCw className="h-3 w-3" />}
                                                {m.type === 'ADD' ? 'Entrada' : m.type === 'REMOVE' ? 'Salida' : 'Ajuste'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 max-w-[200px]">
                                            <div className="font-bold text-gray-900 truncate">{m.product?.name}</div>
                                            <div className="text-[10px] font-mono text-gray-400 truncate uppercase mt-0.5">{m.product?.sku}</div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <span className={clsx(
                                                "font-black text-lg",
                                                m.type === 'ADD' ? 'text-emerald-600' : 
                                                m.type === 'REMOVE' ? 'text-red-600' : 
                                                'text-blue-600'
                                            )}>
                                                {m.type === 'REMOVE' ? '-' : m.type === 'ADD' ? '+' : ''}{m.quantity}
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
                                    <h3 className="text-xl font-bold text-gray-900 line-clamp-1">Filtros de Búsqueda</h3>
                                </div>
                                <button onClick={() => setIsFiltersVisible(false)} className="text-gray-400 hover:text-gray-500 p-1 hover:bg-gray-50 rounded-lg">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="px-6 py-8 space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 font-black">Búsqueda Rápida</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="text"
                                            placeholder="Producto, SKU o notas..."
                                            className="input pl-12 h-12 bg-gray-50 border-gray-100 rounded-xl text-sm font-medium focus:bg-white transition-all shadow-sm"
                                            value={movementSearch}
                                            onChange={(e) => setMovementSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                    <DateRangePicker 
                                        startDate={startDate} 
                                        endDate={endDate} 
                                        onChange={({start, end}) => {
                                            setStartDate(start)
                                            setEndDate(end)
                                        }} 
                                    />

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
                                            className="btn border border-gray-200 text-gray-500 h-11 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50 shadow-sm"
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
        </div>
    )
}
