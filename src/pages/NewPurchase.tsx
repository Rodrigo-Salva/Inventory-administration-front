import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { 
    Package, Plus, Trash2, ArrowLeft, 
    Save, Search, Loader2, Minus, DollarSign
} from 'lucide-react'
import type { Product, PaginatedResponse } from '@/types'

interface PurchaseItemForm {
    product_id: number
    name: string
    sku: string
    quantity: number
    unit_cost: number
    stock: number
}

export default function NewPurchase() {
    const [search, setSearch] = useState('')
    const [supplierId, setSupplierId] = useState<number | ''>('')
    const [reference, setReference] = useState('')
    const [notes, setNotes] = useState('')
    const [items, setItems] = useState<PurchaseItemForm[]>([])
    
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    // 1. Cargar proveedores
    const { data: suppliers } = useQuery<any[]>({
        queryKey: ['suppliers-list'],
        queryFn: async () => {
            const response = await api.get('/api/v1/suppliers/active')
            return response.data
        }
    })

    // 2. Cargar productos para búsqueda
    const { data: productsData, isLoading: isLoadingProducts } = useQuery<PaginatedResponse<Product>>({
        queryKey: ['products-search', search],
        queryFn: async () => {
            const params = new URLSearchParams({
                search,
                size: '5',
                is_active: 'true'
            })
            const response = await api.get(`/api/v1/products/?${params}`)
            return response.data
        },
        enabled: search.length > 1
    })

    const addItem = (product: Product) => {
        setItems(prev => {
            if (prev.find(i => i.product_id === product.id)) {
                toast.error('El producto ya está en la lista')
                return prev
            }
            return [...prev, {
                product_id: product.id,
                name: product.name,
                sku: product.sku,
                quantity: 1,
                unit_cost: Number(product.cost || 0),
                stock: product.stock
            }]
        })
        setSearch('')
    }

    const removeItem = (productId: number) => {
        setItems(prev => prev.filter(i => i.product_id !== productId))
    }

    const updateItem = (productId: number, field: keyof PurchaseItemForm, value: number) => {
        setItems(prev => prev.map(item => 
            item.product_id === productId ? { ...item, [field]: value } : item
        ))
    }

    const total = useMemo(() => {
        return items.reduce((acc, item) => acc + (item.quantity * item.unit_cost), 0)
    }, [items])

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/api/v1/purchases/', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] })
            toast.success('Compra creada como Borrador')
            navigate('/purchases')
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al crear compra')
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!supplierId) return toast.error('Selecciona un proveedor')
        if (items.length === 0) return toast.error('Agrega al menos un producto')

        const data = {
            supplier_id: Number(supplierId),
            reference_number: reference,
            notes,
            items: items.map(i => ({
                product_id: i.product_id,
                quantity: i.quantity,
                unit_cost: i.unit_cost
            }))
        }
        createMutation.mutate(data)
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/purchases')} className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-primary-600 hover:border-primary-100 transition-all shadow-sm">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Nueva Compra</h1>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5 italic">Abastecimiento de inventario</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columna Izquierda: Datos Proveedor */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 space-y-6">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-50 pb-4">Detalles del Proveedor</h3>
                        
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Proveedor *</label>
                            <select 
                                required
                                className="input h-12 rounded-2xl bg-white border-gray-100 text-sm font-bold"
                                value={supplierId}
                                onChange={(e) => setSupplierId(e.target.value === '' ? '' : Number(e.target.value))}
                            >
                                <option value="">Seleccionar proveedor...</option>
                                {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nº Referencia / Factura</label>
                            <input 
                                type="text"
                                className="input h-12 rounded-2xl bg-white border-gray-100 text-sm font-bold"
                                placeholder="Ej: FAC-2024-001"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Notas</label>
                            <textarea 
                                className="input py-3 rounded-2xl bg-white border-gray-100 text-sm font-medium h-24"
                                placeholder="Observaciones de la compra..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        <div className="pt-4">
                            <div className="bg-white p-6 rounded-[2rem] text-center shadow-2xl shadow-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Inversión Total</p>
                                <p className="text-4xl font-black text-slate-900 tracking-tighter">${total.toLocaleString()}</p>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={createMutation.isPending}
                            className="w-full h-14 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-primary-100 transition-all active:scale-[0.98]"
                        >
                            {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            Guardar Borrador
                        </button>
                    </div>
                </div>

                {/* Columna Derecha: Selección de Productos */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50">
                        <div className="relative mb-8">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input 
                                type="text"
                                className="input h-14 pl-12 rounded-2xl bg-white border-gray-100 placeholder:italic font-medium"
                                placeholder="Buscar productos para agregar a la compra..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search.length > 1 && productsData?.items && (
                                <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    {isLoadingProducts ? (
                                        <div className="p-4 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Buscando...</div>
                                    ) : productsData.items.length === 0 ? (
                                        <div className="p-4 text-center text-gray-400 text-xs font-bold italic">No se encontraron productos</div>
                                    ) : (
                                        productsData.items.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => addItem(p)}
                                                className="w-full p-4 flex items-center justify-between hover:bg-primary-50 transition-colors border-b border-gray-50 last:border-0 text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-primary-600">
                                                        <Package className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900 uppercase leading-none mb-1">{p.name}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 font-mono tracking-tighter">{p.sku}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-primary-600">${Number(p.cost || 0).toLocaleString()}</p>
                                                    <p className="text-[9px] font-bold text-gray-300 uppercase">Stock: {p.stock}</p>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {items.length === 0 ? (
                                <div className="text-center py-16 text-gray-300 italic flex flex-col items-center gap-3">
                                    <Package className="h-12 w-12 opacity-20" />
                                    <p className="text-sm">Agrega productos para iniciar la compra</p>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div key={item.product_id} className="p-5 bg-white rounded-[2rem] border border-gray-100 flex flex-col md:flex-row md:items-center gap-6 group hover:border-primary-200 transition-all">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-gray-900 uppercase text-sm truncate leading-none mb-1.5">{item.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono font-bold text-gray-400 bg-white px-2 py-0.5 rounded-md border border-gray-100">{item.sku}</span>
                                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Stock actual: {item.stock}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="w-32">
                                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 leading-none">Cantidad</label>
                                                <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1">
                                                    <button type="button" onClick={() => updateItem(item.product_id, 'quantity', Math.max(1, item.quantity - 1))} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Minus className="h-3 w-3" /></button>
                                                    <input 
                                                        type="number" 
                                                        className="w-full text-center bg-transparent border-none focus:ring-0 text-sm font-black text-gray-900" 
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.product_id, 'quantity', Number(e.target.value))}
                                                    />
                                                    <button type="button" onClick={() => updateItem(item.product_id, 'quantity', item.quantity + 1)} className="p-2 text-gray-400 hover:text-primary-600 transition-colors"><Plus className="h-3 w-3" /></button>
                                                </div>
                                            </div>

                                            <div className="w-32">
                                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 leading-none">Costo Unit.</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        className="input h-10 pl-7 text-sm font-black text-emerald-600 bg-white border-gray-200 rounded-xl"
                                                        value={item.unit_cost}
                                                        onChange={(e) => updateItem(item.product_id, 'unit_cost', Number(e.target.value))}
                                                    />
                                                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                                                </div>
                                            </div>

                                            <div className="text-right min-w-[100px]">
                                                <p className="text-[9px] font-black text-gray-300 uppercase mb-1 leading-none">Subtotal</p>
                                                <p className="text-base font-black text-gray-900 tracking-tighter">${(item.quantity * item.unit_cost).toLocaleString()}</p>
                                            </div>

                                            <button 
                                                type="button" 
                                                onClick={() => removeItem(item.product_id)}
                                                className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
