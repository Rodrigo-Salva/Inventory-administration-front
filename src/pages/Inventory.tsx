import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import type { Product } from '@/types'

export default function Inventory() {
    const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
    const [quantity, setQuantity] = useState('')
    const [notes, setNotes] = useState('')
    const queryClient = useQueryClient()

    const { data: products } = useQuery<any>({
        queryKey: ['products-all'],
        queryFn: async () => {
            const response = await api.get('/api/v1/products/?size=100')
            return response.data
        },
    })

    const addStockMutation = useMutation({
        mutationFn: (data: any) => api.post('/api/v1/inventory/add-stock', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products-all'] })
            toast.success('Stock agregado exitosamente')
            resetForm()
        },
        onError: () => toast.error('Error al agregar stock'),
    })

    const removeStockMutation = useMutation({
        mutationFn: (data: any) => api.post('/api/v1/inventory/remove-stock', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products-all'] })
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
            queryClient.invalidateQueries({ queryKey: ['products-all'] })
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

    const selectedProductData = products?.items?.find((p: Product) => p.id === selectedProduct)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Inventario</h1>
                <p className="mt-1 text-sm text-gray-600">Agregar, remover o ajustar stock de productos</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Movimiento de Stock</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                            <select
                                className="input"
                                value={selectedProduct || ''}
                                onChange={(e) => setSelectedProduct(Number(e.target.value))}
                            >
                                <option value="">Seleccionar producto...</option>
                                {products?.items?.map((product: Product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.name} - Stock: {product.stock}
                                    </option>
                                ))}
                            </select>
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

                        <div className="grid grid-cols-3 gap-3 pt-4">
                            <button
                                onClick={handleAddStock}
                                disabled={!selectedProduct || !quantity}
                                className="btn btn-primary flex items-center justify-center gap-2"
                            >
                                <TrendingUp className="h-4 w-4" />
                                Agregar
                            </button>
                            <button
                                onClick={handleRemoveStock}
                                disabled={!selectedProduct || !quantity}
                                className="btn btn-danger flex items-center justify-center gap-2"
                            >
                                <TrendingDown className="h-4 w-4" />
                                Remover
                            </button>
                            <button
                                onClick={handleAdjustStock}
                                disabled={!selectedProduct || !quantity}
                                className="btn btn-secondary flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Ajustar
                            </button>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos con Stock Bajo</h2>
                    <div className="space-y-3">
                        {products?.items
                            ?.filter((p: Product) => p.stock <= p.min_stock)
                            .slice(0, 10)
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
                        {products?.items?.filter((p: Product) => p.stock <= p.min_stock).length === 0 && (
                            <p className="text-center text-gray-500 py-8">No hay productos con stock bajo</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
