import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Search, X, Package, Tag, Building2, Barcode, DollarSign, Layers, History, ArrowUpRight, ArrowDownRight, PlusCircle, MinusCircle, UploadCloud, FileDown } from 'lucide-react'
import clsx from 'clsx'
import type { Product, PaginatedResponse, Category, Supplier } from '@/types'

export default function Products() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
    const [isQuickMoveModalOpen, setIsQuickMoveModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [quickMoveType, setQuickMoveType] = useState<'entry' | 'exit'>('entry')
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        barcode: '',
        description: '',
        category_id: '',
        supplier_id: '',
        price: '',
        cost: '',
        stock: '0',
        min_stock: '5',
        max_stock: '',
        is_active: true
    })
    const [quickMoveData, setQuickMoveData] = useState({
        quantity: '',
        reference: '',
        notes: ''
    })

    const queryClient = useQueryClient()

    // 1. Cargar Productos
    const { data: productData, isLoading } = useQuery<PaginatedResponse<Product>>({
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

    // 2. Cargar Categorías para el selector
    const { data: categories } = useQuery<Category[]>({
        queryKey: ['categories-flat-all'],
        queryFn: async () => {
            const response = await api.get('/api/v1/categories/')
            return response.data.items || []
        }
    })

    // 3. Cargar Proveedores para el selector
    const { data: suppliers } = useQuery<PaginatedResponse<Supplier>>({
        queryKey: ['suppliers-all'],
        queryFn: async () => {
            const response = await api.get('/api/v1/suppliers/?size=100')
            return response.data
        }
    })

    // 4. Cargar Historial de un Producto
    const { data: movementsData, isLoading: isLoadingMovements } = useQuery({
        queryKey: ['product-movements', selectedProduct?.id],
        queryFn: async () => {
            if (!selectedProduct) return null
            const response = await api.get(`/api/v1/inventory/?product_id=${selectedProduct.id}&size=50`)
            return response.data
        },
        enabled: !!selectedProduct && isHistoryModalOpen
    })

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/api/v1/products/', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            toast.success('Producto creado')
            closeModal()
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al crear'),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/api/v1/products/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            toast.success('Producto actualizado')
            closeModal()
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al actualizar'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/api/v1/products/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            toast.success('Producto eliminado')
        },
        onError: () => toast.error('Error al eliminar producto'),
    })

    const quickMoveMutation = useMutation({
        mutationFn: (data: any) => {
            const endpoint = quickMoveType === 'entry' ? '/api/v1/inventory/add-stock' : '/api/v1/inventory/remove-stock'
            return api.post(endpoint, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            toast.success(quickMoveType === 'entry' ? 'Entrada registrada' : 'Salida registrada')
            setIsQuickMoveModalOpen(false)
            setQuickMoveData({ quantity: '', reference: '', notes: '' })
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error en movimiento'),
    })

    const bulkImportMutation = useMutation({
        mutationFn: (data: any) => api.post('/api/v1/products/bulk', data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            const { created, skipped, errors } = res.data
            toast.success(`Importación terminada: ${created} creados, ${skipped} omitidos`)
            if (errors.length > 0) {
                console.error('Errores de importación:', errors)
                toast.error(`Hubo ${errors.length} errores (ver consola)`)
            }
            setIsImportModalOpen(false)
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al importar'),
    })

    const openModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product)
            setFormData({
                name: product.name,
                sku: product.sku,
                barcode: product.barcode || '',
                description: product.description || '',
                category_id: product.category_id?.toString() || '',
                supplier_id: product.supplier_id?.toString() || '',
                price: product.price.toString(),
                cost: product.cost?.toString() || '',
                stock: product.stock.toString(),
                min_stock: product.min_stock.toString(),
                max_stock: product.max_stock?.toString() || '',
                is_active: product.is_active
            })
        } else {
            setEditingProduct(null)
            setFormData({
                name: '',
                sku: '',
                barcode: '',
                description: '',
                category_id: '',
                supplier_id: '',
                price: '',
                cost: '',
                stock: '0',
                min_stock: '5',
                max_stock: '',
                is_active: true
            })
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingProduct(null)
    }

    const openQuickMove = (product: Product, type: 'entry' | 'exit') => {
        setSelectedProduct(product)
        setQuickMoveType(type)
        setIsQuickMoveModalOpen(true)
    }

    const handleQuickMoveSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedProduct) return
        quickMoveMutation.mutate({
            product_id: selectedProduct.id,
            quantity: parseInt(quickMoveData.quantity),
            reference: quickMoveData.reference,
            notes: quickMoveData.notes
        })
    }

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (event) => {
            const text = event.target?.result as string
            const lines = text.split('\n').filter(l => l.trim().length > 0)
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
            
            const products = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim())
                const p: any = {}
                headers.forEach((header, i) => {
                    p[header] = values[i]
                })
                return {
                    name: p.nombre || p.name,
                    sku: p.sku,
                    barcode: p.barcode || p.codigo || '',
                    description: p.descripcion || p.description || '',
                    price: parseFloat(p.precio || p.price || '0'),
                    cost: parseFloat(p.costo || p.cost || '0'),
                    stock: parseInt(p.stock || '0'),
                    min_stock: parseInt(p.min_stock || p.minimo || '10'),
                    category_id: p.category_id ? parseInt(p.category_id) : null,
                    supplier_id: p.supplier_id ? parseInt(p.supplier_id) : null,
                    is_active: true
                }
            }).filter(p => p.sku && p.name)

            if (products.length === 0) {
                toast.error('No se encontraron productos válidos en el CSV')
                return
            }

            bulkImportMutation.mutate({ products })
        }
        reader.readAsText(file)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const payload = {
            ...formData,
            category_id: formData.category_id ? parseInt(formData.category_id) : null,
            supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
            price: parseFloat(formData.price),
            cost: formData.cost ? parseFloat(formData.cost) : null,
            stock: parseInt(formData.stock),
            min_stock: parseInt(formData.min_stock),
            max_stock: formData.max_stock ? parseInt(formData.max_stock) : null
        }
        
        if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, data: payload })
        } else {
            createMutation.mutate(payload)
        }
    }

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
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsImportModalOpen(true)}
                        className="btn btn-secondary flex items-center gap-2"
                    >
                        <UploadCloud className="h-5 w-5" />
                        Importar (CSV)
                    </button>
                    <button 
                        onClick={() => openModal()}
                        className="btn btn-primary flex items-center gap-2 shadow-lg shadow-primary-200"
                    >
                        <Plus className="h-5 w-5" />
                        Nuevo Producto
                    </button>
                </div>
            </div>

            <div className="card border-none shadow-sm">
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o SKU..."
                            className="input pl-10 h-11 focus:ring-2 focus:ring-primary-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                        <p className="mt-2 text-sm text-gray-600 font-medium">Cargando catálogo...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">SKU / Código</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Precio</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {productData?.items.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                                        <Package className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{product.name}</div>
                                                        <div className={clsx(
                                                            "px-2 py-0.5 text-[10px] inline-block font-bold rounded-full uppercase tracking-wider mt-0.5",
                                                            product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                        )}>
                                                            {product.is_active ? 'Activo' : 'Inactivo'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-mono text-gray-600">{product.sku}</div>
                                                {product.barcode && <div className="text-[10px] text-gray-400 font-mono">{product.barcode}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                                    <Tag className="h-3.5 w-3.5 text-gray-400" />
                                                    {categories?.find(c => c.id === product.category_id)?.name || <span className="text-gray-400 italic">Sin categoría</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900">${Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                {product.cost && <div className="text-[10px] text-gray-400">Costo: ${Number(product.cost).toFixed(2)}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className={clsx(
                                                        "text-sm font-bold",
                                                        product.stock <= product.min_stock ? 'text-red-600' : 'text-green-600'
                                                    )}>
                                                        {product.stock} unidades
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">Min: {product.min_stock}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => openQuickMove(product, 'entry')}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-md"
                                                        title="Entrada Rápida"
                                                    >
                                                        <PlusCircle className="h-5 w-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => openQuickMove(product, 'exit')}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                                                        title="Salida Rápida"
                                                    >
                                                        <MinusCircle className="h-5 w-5" />
                                                    </button>
                                                    <div className="mx-1 h-8 w-px bg-gray-200 self-center"></div>
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedProduct(product)
                                                            setIsHistoryModalOpen(true)
                                                        }}
                                                        className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-md"
                                                        title="Ver historial de movimientos"
                                                    >
                                                        <History className="h-5 w-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => openModal(product)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
                                                    >
                                                        <Edit className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id, product.name)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {productData && productData.metadata.pages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-4 mt-2">
                                <div className="flex flex-1 justify-between sm:hidden">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="btn btn-secondary text-xs"
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => setPage((p) => Math.min(productData.metadata.pages, p + 1))}
                                        disabled={page === productData.metadata.pages}
                                        className="btn btn-secondary text-xs"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <p className="text-xs text-gray-500">
                                        Página <span className="font-bold">{page}</span> de <span className="font-bold">{productData.metadata.pages}</span> ({productData.metadata.total} productos)
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="btn btn-secondary h-9 px-4 text-xs"
                                        >
                                            Anterior
                                        </button>
                                        <button
                                            onClick={() => setPage((p) => Math.min(productData.metadata.pages, p + 1))}
                                            disabled={page === productData.metadata.pages}
                                            className="btn btn-secondary h-9 px-4 text-xs"
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

            {/* Modal de Producto */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm" onClick={closeModal} />
                        <div className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-2xl">
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Package className="h-6 w-6 text-primary-600" />
                                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                                </h3>

                                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-1">Identificación</h4>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700">Nombre del Producto *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="input mt-1.5 focus:ring-2 focus:ring-primary-500"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700">SKU / Referencia *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        className="input mt-1.5 font-mono text-xs"
                                                        value={formData.sku}
                                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700">Código de Barras</label>
                                                    <div className="relative mt-1.5">
                                                        <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            className="input pl-9 font-mono text-xs"
                                                            value={formData.barcode}
                                                            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700">Categoría</label>
                                                <div className="relative mt-1.5">
                                                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <select
                                                        className="input pl-9"
                                                        value={formData.category_id}
                                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                                    >
                                                        <option value="">Seleccionar Categoría...</option>
                                                        {categories?.map(c => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700">Proveedor</label>
                                                <div className="relative mt-1.5">
                                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <select
                                                        className="input pl-9"
                                                        value={formData.supplier_id}
                                                        onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                                                    >
                                                        <option value="">Seleccionar Proveedor...</option>
                                                        {suppliers?.items.map(s => (
                                                            <option key={s.id} value={s.id}>{s.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-1">Precios y Stock</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700">Precio Venta *</label>
                                                    <div className="relative mt-1.5">
                                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            required
                                                            className="input pl-9 font-bold text-primary-700"
                                                            value={formData.price}
                                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700">Costo de Compra</label>
                                                    <div className="relative mt-1.5">
                                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="input pl-9 text-gray-600 bg-gray-50 border-gray-100"
                                                            value={formData.cost}
                                                            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700">Stock Inicial</label>
                                                    <input
                                                        type="number"
                                                        required
                                                        disabled={!!editingProduct}
                                                        className={clsx("input mt-1.5", editingProduct && "bg-gray-100 text-gray-400")}
                                                        value={formData.stock}
                                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700">Mínimo</label>
                                                    <input
                                                        type="number"
                                                        required
                                                        className="input mt-1.5 border-red-100 focus:border-red-400 focus:ring-red-100"
                                                        value={formData.min_stock}
                                                        onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700">Máximo</label>
                                                    <input
                                                        type="number"
                                                        className="input mt-1.5"
                                                        value={formData.max_stock}
                                                        onChange={(e) => setFormData({ ...formData, max_stock: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700">Descripción Corta</label>
                                                <textarea
                                                    className="input mt-1.5 h-[102px] resize-none text-xs"
                                                    placeholder="Breve descripción del producto..."
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">Estado de Disponibilidad</span>
                                            <span className="text-[10px] text-gray-500 italic">Determina si el producto puede venderse actualmente</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                            />
                                            <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                        </label>
                                    </div>

                                    <div className="pt-2 flex gap-4">
                                        <button
                                            type="button"
                                            className="btn btn-secondary flex-1 h-12 font-bold"
                                            onClick={closeModal}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary flex-1 h-12 font-bold shadow-xl shadow-primary-200"
                                            disabled={createMutation.isPending || updateMutation.isPending}
                                        >
                                            {createMutation.isPending || updateMutation.isPending 
                                                ? 'Guardando...' 
                                                : (editingProduct ? 'Aplicar Cambios' : 'Crear Producto')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Historial (Timeline) */}
            {isHistoryModalOpen && selectedProduct && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm" onClick={() => setIsHistoryModalOpen(false)} />
                        <div className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-xl">
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="p-8">
                                <header className="mb-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                            <History className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">Kardex de Inventario</h3>
                                            <p className="text-sm text-gray-500">{selectedProduct.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex bg-gray-50 p-3 rounded-xl border border-gray-100 mt-4 justify-between items-center">
                                        <div className="text-xs text-gray-500 font-mono uppercase tracking-widest">{selectedProduct.sku}</div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-gray-400 uppercase font-bold">Stock Actual</span>
                                            <span className="text-lg font-black text-primary-600">{selectedProduct.stock}</span>
                                        </div>
                                    </div>
                                </header>

                                {isLoadingMovements ? (
                                    <div className="py-12 text-center">
                                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 before:via-gray-100 before:to-transparent">
                                        {movementsData?.items.map((m: any) => (
                                            <div key={m.id} className="relative pl-12 group">
                                                <div className={clsx(
                                                    "absolute left-0 mt-1 h-10 w-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110",
                                                    m.movement_type === 'entry' && "bg-green-500 text-white",
                                                    m.movement_type === 'exit' && "bg-red-500 text-white",
                                                    m.movement_type === 'adjustment' && "bg-blue-500 text-white"
                                                )}>
                                                    {m.movement_type === 'entry' && <ArrowUpRight className="h-5 w-5" />}
                                                    {m.movement_type === 'exit' && <ArrowDownRight className="h-5 w-5" />}
                                                    {m.movement_type === 'adjustment' && <History className="h-5 w-5" />}
                                                </div>
                                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                                                            {new Date(m.created_at).toLocaleString()}
                                                        </span>
                                                        <span className={clsx(
                                                            "text-sm font-black",
                                                            m.quantity > 0 ? "text-green-600" : "text-red-600"
                                                        )}>
                                                            {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-800 capitalize">{m.movement_type}</p>
                                                    {m.notes && <p className="text-xs text-gray-500 mt-1 italic">"{m.notes}"</p>}
                                                    <div className="mt-3 flex gap-4 text-[10px] font-bold text-gray-400 border-t pt-3 border-gray-50">
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                                                            ANTES: {m.stock_before}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-200"></div>
                                                            DESPUÉS: {m.stock_after}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {movementsData?.items.length === 0 && (
                                            <div className="text-center py-12 text-gray-500 italic text-sm">
                                                No hay historial registrado para este producto.
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <button 
                                        onClick={() => setIsHistoryModalOpen(false)}
                                        className="w-full btn btn-secondary h-12 font-bold"
                                    >
                                        Cerrar Historial
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Movimiento Rápido */}
            {isQuickMoveModalOpen && selectedProduct && (
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm" onClick={() => setIsQuickMoveModalOpen(false)} />
                        <div className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-md">
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">
                                    {quickMoveType === 'entry' ? 'Entrada de Stock' : 'Salida de Stock'}
                                </h3>
                                <div className="p-3 bg-gray-50 rounded-xl mb-4 flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <Package className="h-5 w-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 font-bold uppercase">{selectedProduct.sku}</div>
                                        <div className="text-sm font-bold text-gray-900">{selectedProduct.name}</div>
                                    </div>
                                </div>
                                <form onSubmit={handleQuickMoveSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad</label>
                                        <input 
                                            type="number"
                                            required
                                            min="1"
                                            className="input"
                                            value={quickMoveData.quantity}
                                            onChange={(e) => setQuickMoveData({...quickMoveData, quantity: e.target.value})}
                                            placeholder="0"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Referencia / Folio</label>
                                        <input 
                                            type="text"
                                            className="input"
                                            value={quickMoveData.reference}
                                            onChange={(e) => setQuickMoveData({...quickMoveData, reference: e.target.value})}
                                            placeholder="Ej: Factura #123"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button type="button" onClick={() => setIsQuickMoveModalOpen(false)} className="btn btn-secondary flex-1">Cancelar</button>
                                        <button 
                                            type="submit" 
                                            className={clsx(
                                                "btn flex-1 text-white font-bold",
                                                quickMoveType === 'entry' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                                            )}
                                            disabled={quickMoveMutation.isPending}
                                        >
                                            {quickMoveMutation.isPending ? 'Procesando...' : (quickMoveType === 'entry' ? 'Cargar Entrada' : 'Registrar Salida')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Importación CSV */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm" onClick={() => setIsImportModalOpen(false)} />
                        <div className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-lg">
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
                                            <UploadCloud className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">Importar Productos</h3>
                                            <p className="text-sm text-gray-500">Carga masiva desde archivo CSV</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
                                    <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                                        <FileDown className="h-4 w-4" /> Instrucciones
                                    </h4>
                                    <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                                        <li>El archivo debe ser formato <strong>CSV</strong> (separado por comas).</li>
                                        <li>Columnas obligatorias: <strong>nombre, sku, precio, stock</strong>.</li>
                                        <li>Columnas opcionales: barcode, descripcion, costo, minimo.</li>
                                        <li>Si el SKU ya existe, el producto será omitido.</li>
                                    </ul>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-primary-400 transition-colors">
                                        <input 
                                            type="file" 
                                            accept=".csv"
                                            onChange={handleImportCSV}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            disabled={bulkImportMutation.isPending}
                                        />
                                        <UploadCloud className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                                        <div className="text-sm font-bold text-gray-600">
                                            {bulkImportMutation.isPending ? 'Subiendo y procesando...' : 'Haz clic o arrastra tu archivo CSV aquí'}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">Límite recomendado: 100 productos por carga</div>
                                    </div>

                                    <button 
                                        onClick={() => setIsImportModalOpen(false)}
                                        className="btn btn-secondary w-full"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
