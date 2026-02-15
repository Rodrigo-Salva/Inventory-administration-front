import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import type { Product, PaginatedResponse } from '@/types'

export default function Products() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery<PaginatedResponse<Product>>({
        queryKey: ['products', page, search],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                size: '10',
                ...(search && { search }),
            })
            const response = await api.get(`/api/v1/products/?${params}`)
            return response.data
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/api/v1/products/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            toast.success('Producto eliminado')
        },
        onError: () => toast.error('Error al eliminar producto'),
    })

    const handleDelete = (id: number, name: string) => {
        if (confirm(`¿Eliminar producto "${name}"?`)) {
            deleteMutation.mutate(id)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
                    <p className="mt-1 text-sm text-gray-600">Gestión de productos del inventario</p>
                </div>
                <button className="btn btn-primary flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Nuevo Producto
                </button>
            </div>

            <div className="card">
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            className="input pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                        <p className="mt-2 text-sm text-gray-600">Cargando productos...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Producto
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            SKU
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Precio
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Stock
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Estado
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {data?.items.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                {product.description && (
                                                    <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                                ${Number(product.price).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`text-sm font-semibold ${product.stock <= product.min_stock ? 'text-red-600' : 'text-green-600'
                                                        }`}
                                                >
                                                    {product.stock}
                                                </span>
                                                <span className="text-sm text-gray-500"> / {product.min_stock}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                >
                                                    {product.is_active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button className="text-primary-600 hover:text-primary-900 mr-3">
                                                    <Edit className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id, product.name)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {data && data.metadata.pages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                                <div className="flex flex-1 justify-between sm:hidden">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="btn btn-secondary"
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => setPage((p) => Math.min(data.metadata.pages, p + 1))}
                                        disabled={page === data.metadata.pages}
                                        className="btn btn-secondary"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Mostrando <span className="font-medium">{(page - 1) * 10 + 1}</span> a{' '}
                                            <span className="font-medium">{Math.min(page * 10, data.metadata.total)}</span> de{' '}
                                            <span className="font-medium">{data.metadata.total}</span> resultados
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="btn btn-secondary"
                                        >
                                            Anterior
                                        </button>
                                        <button
                                            onClick={() => setPage((p) => Math.min(data.metadata.pages, p + 1))}
                                            disabled={page === data.metadata.pages}
                                            className="btn btn-secondary"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
