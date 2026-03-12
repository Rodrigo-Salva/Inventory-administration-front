import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { 
    ArrowRightLeft, Plus, 
    CheckCircle2, Clock, XCircle, 
    Eye, Package, ArrowRight,
    Search, FileText
} from 'lucide-react'
import DetailModal from '@/components/common/DetailModal'
import clsx from 'clsx'
import type { StockTransfer, PaginatedResponse, Branch, Product } from '@/types'
import Pagination from '@/components/common/Pagination'
import { usePermissions } from '@/hooks/usePermissions'

export default function StockTransfers() {
    const [page, setPage] = useState(1)
    const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    
    const queryClient = useQueryClient()
    const { hasPermission } = usePermissions()

    const { data, isLoading } = useQuery<PaginatedResponse<StockTransfer>>({
        queryKey: ['stock-transfers', page],
        queryFn: async () => {
            const response = await api.get(`/api/v1/stock-transfers/?page=${page}&size=10`)
            // Backend returns a list directly in this case or structured? 
            // My repo returns List[StockTransfer]. 
            // I should wrap it in PaginatedResponse structure for consistency if not already.
            return {
                items: response.data,
                total: response.data.length, // Placeholder if no metadata
                page: 1,
                size: 10,
                pages: 1
            } as PaginatedResponse<StockTransfer>
        },
    })

    const completeMutation = useMutation({
        mutationFn: (id: number) => api.put(`/api/v1/stock-transfers/${id}/complete`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-transfers'] })
            queryClient.invalidateQueries({ queryKey: ['inventory'] })
            toast.success('Traslado completado. Stock actualizado en ambas sucursales.')
            setIsDetailModalOpen(false)
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al completar traslado'),
    })

    const cancelMutation = useMutation({
        mutationFn: (id: number) => api.put(`/api/v1/stock-transfers/${id}/cancel`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-transfers'] })
            toast.success('Traslado cancelado')
            setIsDetailModalOpen(false)
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al cancelar traslado'),
    })

    const statusMap = {
        pending: { label: 'Pendiente', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
        completed: { label: 'Completado', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
        cancelled: { label: 'Cancelado', color: 'bg-red-50 text-red-700 border-red-100', icon: XCircle }
    }

    const { data: stats } = useQuery({
        queryKey: ['stock-transfers-stats'],
        queryFn: async () => {
            const response = await api.get('/api/v1/stock-transfers/stats')
            return response.data
        }
    })

    if (!hasPermission('transfers:view')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-gray-100">
                <ArrowRightLeft className="h-16 w-16 text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Acceso Denegado</h2>
                <p className="text-gray-500 mt-2">No tienes permisos para ver los traslados.</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Traslados entre Sucursales</h1>
                    <p className="mt-1 text-sm text-gray-500 italic">Mueve mercancía de forma segura entre tus ubicaciones</p>
                </div>
                <div className="flex items-center gap-3">
                    {hasPermission('transfers:create') && (
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="btn btn-primary flex items-center gap-2 h-10 rounded-xl px-4 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-200"
                        >
                            <Plus className="h-5 w-5" />
                            Nuevo Traslado
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
                            <ArrowRightLeft className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Traslados</p>
                            <p className="text-2xl font-black text-gray-900">{stats?.total_count || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">En Proceso</p>
                            <p className="text-2xl font-black text-gray-900">{stats?.pending_count || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Completados</p>
                            <p className="text-2xl font-black text-gray-900">{stats?.completed_count || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                            <XCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cancelados</p>
                            <p className="text-2xl font-black text-gray-900">{stats?.cancelled_count || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-24">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                    <p className="mt-4 text-sm text-gray-500 font-bold uppercase tracking-widest font-mono">Cargando traslados...</p>
                </div>
            ) : data?.items.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200">
                    <ArrowRightLeft className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No hay registros de traslados</p>
                    <button onClick={() => setIsCreateModalOpen(true)} className="mt-4 text-primary-600 font-black text-sm uppercase tracking-widest hover:underline text-[10px]">
                        Realizar mi primer traslado
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">ID / Referencia</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Ruta (Origen → Destino)</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Items</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {data?.items.map((transfer) => {
                                const status = statusMap[transfer.status as keyof typeof statusMap]
                                return (
                                    <tr key={transfer.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900">#{transfer.id}</span>
                                                {transfer.reference && (
                                                    <span className="text-[10px] font-mono text-gray-400 uppercase">{transfer.reference}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{transfer.from_branch?.name}</span>
                                                </div>
                                                <ArrowRight className="h-3 w-3 text-gray-300" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{transfer.to_branch?.name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                            {new Date(transfer.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <div className="h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-500 border border-gray-100">
                                                    {transfer.items.length}
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Variedades</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={clsx(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                status.color
                                            )}>
                                                <status.icon className="h-3 w-3" />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => {
                                                        setSelectedTransfer(transfer)
                                                        setIsDetailModalOpen(true)
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                                    title="Ver Detalles"
                                                >
                                                    <Eye className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-8">
                <Pagination 
                    currentPage={page}
                    totalPages={data?.metadata?.pages || 1}
                    onPageChange={setPage}
                    totalItems={data?.metadata?.total || data?.items.length || 0}
                />
            </div>

            {/* Modal de Detalle */}
            <DetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title={`Traslado #${selectedTransfer?.id}`}
                subtitle={`De ${selectedTransfer?.from_branch?.name} a ${selectedTransfer?.to_branch?.name}`}
                icon={ArrowRightLeft}
                statusBadge={
                    selectedTransfer && (
                        <span className={clsx(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            statusMap[selectedTransfer.status as keyof typeof statusMap]?.color
                        )}>
                            {statusMap[selectedTransfer.status as keyof typeof statusMap]?.label}
                        </span>
                    )
                }
                sections={[
                    {
                        title: "Ruta del Traslado",
                        fields: [
                            { label: "Sucursal Origen", value: selectedTransfer?.from_branch?.name },
                            { label: "Sucursal Destino", value: selectedTransfer?.to_branch?.name },
                            { label: "Fecha Creación", value: selectedTransfer ? new Date(selectedTransfer.created_at).toLocaleString() : "" },
                            { label: "Usuario", value: selectedTransfer?.user?.email },
                        ]
                    },
                    {
                        title: "Productos",
                        fields: selectedTransfer?.items?.map((item: any) => ({
                            label: item.product?.name || `Producto #${item.product_id}`,
                            value: `${item.quantity} unidades ${item.batch_number ? `(Lote: ${item.batch_number})` : ''}`,
                            fullWidth: true
                        })) || []
                    },
                    {
                        title: "Notas",
                        fields: [
                            { label: "Observaciones", value: selectedTransfer?.notes || "Sin notas", fullWidth: true },
                        ]
                    }
                ]}
                footerActions={
                    selectedTransfer?.status === 'pending' && hasPermission('transfers:manage') ? (
                        <>
                            <button 
                                onClick={() => cancelMutation.mutate(selectedTransfer.id)}
                                disabled={cancelMutation.isPending}
                                className="flex-[1] h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] hover:bg-red-100 transition-all active:scale-95"
                            >
                                <XCircle className="h-5 w-5" />
                                Cancelar
                            </button>
                            <button 
                                onClick={() => completeMutation.mutate(selectedTransfer.id)}
                                disabled={completeMutation.isPending}
                                className="flex-[2] h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                            >
                                <CheckCircle2 className="h-5 w-5" />
                                Completar Traslado
                            </button>
                        </>
                    ) : null
                }
            />

            {/* Modal de Creación (Continuará en el siguiente paso con el formulario completo) */}
            <CreateTransferModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
            />
        </div>
    )
}

function CreateTransferModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [fromBranchId, setFromBranchId] = useState('')
    const [toBranchId, setToBranchId] = useState('')
    const [items, setItems] = useState<{ product_id: number; quantity: number, name: string }[]>([])
    const [notes, setNotes] = useState('')
    
    const queryClient = useQueryClient()

    const { data: branches } = useQuery<Branch[]>({
        queryKey: ['branches-active'],
        queryFn: async () => {
            const res = await api.get('/api/v1/branches/active')
            return res.data
        }
    })

    const { data: products } = useQuery<Product[]>({
        queryKey: ['products-simple'],
        queryFn: async () => {
            const res = await api.get('/api/v1/products/?size=1000')
            return res.data.items
        }
    })

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/api/v1/stock-transfers/', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-transfers'] })
            toast.success('Traslado creado exitosamente')
            onClose()
            setItems([])
            setFromBranchId('')
            setToBranchId('')
            setNotes('')
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al crear traslado')
    })

    if (!isOpen) return null

    const handleAddItem = (product: Product) => {
        if (items.find(i => i.product_id === product.id)) return
        setItems([...items, { product_id: product.id, quantity: 1, name: product.name }])
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!fromBranchId || !toBranchId) return toast.error('Selecciona sucursales de origen y destino')
        if (fromBranchId === toBranchId) return toast.error('La sucursal de origen y destino no pueden ser la misma')
        if (items.length === 0) return toast.error('Agrega al menos un producto')
        
        createMutation.mutate({
            from_branch_id: parseInt(fromBranchId),
            to_branch_id: parseInt(toBranchId),
            items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
            notes
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 bg-gray-50 border-b border-gray-100 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Nuevo Traslado</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Configura el movimiento de stock</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-100">
                            <XCircle className="h-6 w-6 text-gray-400" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Sucursal Origen</label>
                            <select 
                                required
                                value={fromBranchId}
                                onChange={(e) => setFromBranchId(e.target.value)}
                                className="input h-14 rounded-2xl px-6 font-bold text-gray-700 bg-gray-50 border-gray-100 focus:bg-white"
                            >
                                <option value="">Seleccionar Origen...</option>
                                {branches?.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Sucursal Destino</label>
                            <select 
                                required
                                value={toBranchId}
                                onChange={(e) => setToBranchId(e.target.value)}
                                className="input h-14 rounded-2xl px-6 font-bold text-gray-700 bg-gray-50 border-gray-100 focus:bg-white"
                            >
                                <option value="">Seleccionar Destino...</option>
                                {branches?.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary-500" />
                            Productos a Trasladar
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 border-r border-gray-100 pr-6 space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar producto..." 
                                        className="input h-11 pl-11 rounded-xl text-xs font-bold bg-gray-50 border-transparent"
                                    />
                                </div>
                                <div className="max-h-[300px] overflow-y-auto space-y-1">
                                    {products?.map(p => (
                                        <button 
                                            key={p.id}
                                            type="button"
                                            onClick={() => handleAddItem(p)}
                                            className="w-full text-left p-3 hover:bg-primary-50 rounded-xl transition-all group flex items-center justify-between"
                                        >
                                            <span className="text-xs font-bold text-gray-700 group-hover:text-primary-700">{p.name}</span>
                                            <Plus className="h-3 w-3 text-gray-300 group-hover:text-primary-400" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-3">
                                {items.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                                        <FileText className="h-10 w-10 mb-2 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No hay items seleccionados</p>
                                    </div>
                                ) : (
                                    items.map((item, idx) => (
                                        <div key={item.product_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-primary-100 hover:bg-white transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-xs font-black text-primary-600 border border-gray-100">
                                                    {idx + 1}
                                                </div>
                                                <span className="text-sm font-bold text-gray-800">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const newItems = [...items]
                                                        newItems[idx].quantity = parseInt(e.target.value) || 1
                                                        setItems(newItems)
                                                    }}
                                                    className="w-20 h-10 rounded-xl border-gray-200 text-center font-black text-sm"
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => setItems(items.filter((_, i) => i !== idx))}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <XCircle className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Notas Adicionales</label>
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="input min-h-[100px] rounded-2xl px-6 py-4 font-bold text-gray-700 bg-gray-50 border-gray-100 focus:bg-white"
                            placeholder="Ej: Traslado de stock por falta de inventario en sucursal norte"
                        />
                    </div>
                </form>

                <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4 shrink-0">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-white transition-all"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit"
                        onClick={handleSubmit}
                        disabled={createMutation.isPending}
                        className="flex-[2] h-14 bg-primary-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-100 hover:bg-primary-700 transition-all disabled:opacity-50"
                    >
                        {createMutation.isPending ? 'Creando...' : 'Confirmar Traslado'}
                    </button>
                </div>
            </div>
        </div>
    )
}
