import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { 
    Package, Plus, 
    CheckCircle2, Clock, XCircle, 
    Truck, Eye, FileDown, DollarSign, CheckCircle
} from 'lucide-react'
import DetailModal from '@/components/common/DetailModal'
import clsx from 'clsx'
import type { Purchase, PaginatedResponse } from '@/types'
import Pagination from '@/components/common/Pagination'
import { usePermissions } from '@/hooks/usePermissions'

export default function Purchases() {
    const [page, setPage] = useState(1)
    const [statusFilter, setStatusFilter] = useState<string>('')
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { hasPermission } = usePermissions()
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

    const { data, isLoading } = useQuery<PaginatedResponse<Purchase>>({
        queryKey: ['purchases', page, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                size: '10',
                ...(statusFilter && { status: statusFilter })
            })
            const response = await api.get(`/api/v1/purchases/?${params.toString()}`)
            return response.data
        },
    })

    const receiveMutation = useMutation({
        mutationFn: (id: number) => api.post(`/api/v1/purchases/${id}/receive`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] })
            queryClient.invalidateQueries({ queryKey: ['products'] })
            toast.success('Compra recibida correctamente e inventario actualizado')
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al recibir compra'),
    })

    const statusMap = {
        draft: { label: 'Borrador', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
        received: { label: 'Recibido', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
        cancelled: { label: 'Cancelado', color: 'bg-red-50 text-red-700 border-red-100', icon: XCircle }
    }

    const paymentStatusMap = {
        pending: { label: 'Pendiente', color: 'bg-rose-50 text-rose-600', dot: 'bg-rose-500' },
        partial: { label: 'Parcial', color: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' },
        paid: { label: 'Pagado', color: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' }
    }

    const handleExportPDF = async (purchaseId: number) => {
        const toastId = toast.loading('Generando PDF...')
        try {
            const response = await api.get(`/api/v1/purchases/${purchaseId}/pdf`, {
                responseType: 'blob'
            })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `Orden_Compra_${purchaseId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            toast.success('PDF generado correctamente', { id: toastId })
        } catch (error) {
            toast.error('Error al generar PDF', { id: toastId })
        }
    }

    const { data: stats } = useQuery({
        queryKey: ['purchases-stats'],
        queryFn: async () => {
            const response = await api.get('/api/v1/purchases/stats')
            return response.data
        }
    })

    if (!hasPermission('purchases:view')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-gray-100">
                <Package className="h-16 w-16 text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Acceso Denegado</h2>
                <p className="text-gray-500 mt-2">No tienes permisos para ver las compras.</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Compras e Inventario</h1>
                    <p className="mt-1 text-sm text-gray-500 italic">Gestión de entrada de mercancía de proveedores</p>
                </div>
                <div className="flex items-center gap-3">
                    <select 
                        className="input h-10 w-40 text-xs font-bold uppercase tracking-widest bg-white border-gray-200"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Todos los estados</option>
                        <option value="draft">Borradores</option>
                        <option value="received">Recibidos</option>
                        <option value="cancelled">Cancelados</option>
                    </select>
                    {hasPermission('purchases:create') && (
                        <button 
                            onClick={() => navigate('/purchases/new')}
                            className="btn btn-primary flex items-center gap-2 h-10 rounded-xl px-4 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-200"
                        >
                            <Plus className="h-5 w-5" />
                            Nueva Compra
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
                            <Truck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Compras</p>
                            <p className="text-2xl font-black text-gray-900">{stats?.total_count || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <DollarSign className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto Recibido</p>
                            <p className="text-2xl font-black text-gray-900">${(stats?.received_amount || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pendientes</p>
                            <p className="text-2xl font-black text-gray-900">{stats?.draft_count || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Completadas</p>
                            <p className="text-2xl font-black text-gray-900">{stats?.received_count || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-24">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                    <p className="mt-4 text-sm text-gray-500 font-bold uppercase tracking-widest font-mono">Cargando compras...</p>
                </div>
            ) : data?.items.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200">
                    <Truck className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No hay registros de compras</p>
                    <button onClick={() => navigate('/purchases/new')} className="mt-4 text-primary-600 font-black text-sm uppercase tracking-widest hover:underline">
                        Registrar mi primera compra
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">ID / Referencia</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Proveedor</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Pago</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {data?.items.map((purchase) => {
                                const status = statusMap[purchase.status as keyof typeof statusMap]
                                return (
                                    <tr key={purchase.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900">#{purchase.id}</span>
                                                {purchase.reference_number && (
                                                    <span className="text-[10px] font-mono text-gray-400 uppercase">{purchase.reference_number}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                                    <Truck className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <span className="text-sm font-bold text-gray-700">{(purchase as any).supplier_name || purchase.supplier?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                            {new Date(purchase.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-black text-gray-900">${Number(purchase.total_amount).toLocaleString()}</span>
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
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {(purchase as any).payment_status && (
                                                <div className={clsx(
                                                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-tighter",
                                                    paymentStatusMap[(purchase as any).payment_status as keyof typeof paymentStatusMap]?.color || "bg-white text-gray-500 border-gray-100"
                                                )}>
                                                    <span className={clsx(
                                                        "h-1.5 w-1.5 rounded-full",
                                                        paymentStatusMap[(purchase as any).payment_status as keyof typeof paymentStatusMap]?.dot || "bg-gray-300"
                                                    )} />
                                                    {paymentStatusMap[(purchase as any).payment_status as keyof typeof paymentStatusMap]?.label || (purchase as any).payment_status}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {purchase.status === 'draft' && hasPermission('purchases:receive') && (
                                                    <button 
                                                        onClick={() => receiveMutation.mutate(purchase.id)}
                                                        disabled={receiveMutation.isPending}
                                                        className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                                                    >
                                                        {receiveMutation.isPending ? '...' : 'Recibir'}
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleExportPDF(purchase.id)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                    title="Descargar PDF"
                                                >
                                                    <FileDown className="h-5 w-5" />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setSelectedPurchase(purchase)
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
                    totalPages={data?.metadata?.pages || 0}
                    onPageChange={setPage}
                    totalItems={data?.metadata?.total}
                />
            </div>

            <DetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title={`Orden de Compra #${selectedPurchase?.id}`}
                subtitle={selectedPurchase?.supplier?.name || (selectedPurchase as any)?.supplier_name || "Sin Proveedor"}
                icon={Package}
                statusBadge={
                    selectedPurchase && (
                        <span className={clsx(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            statusMap[selectedPurchase.status as keyof typeof statusMap]?.color
                        )}>
                            {selectedPurchase.status === 'received' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            {statusMap[selectedPurchase.status as keyof typeof statusMap]?.label}
                        </span>
                    )
                }
                sections={[
                    {
                        title: "Información de Compra",
                        fields: [
                            { label: "Proveedor", value: selectedPurchase?.supplier?.name || (selectedPurchase as any)?.supplier_name },
                            { label: "Referencia", value: selectedPurchase?.reference_number || "N/A" },
                            { label: "Fecha", value: selectedPurchase ? new Date(selectedPurchase.created_at).toLocaleString() : "" },
                            { label: "Total", value: selectedPurchase ? `$${Number(selectedPurchase.total_amount).toLocaleString()}` : "" },
                        ]
                    },
                    {
                        title: "Productos en la Orden",
                        fields: selectedPurchase?.items?.map((item: any) => ({
                            label: item.product?.name || `Producto #${item.product_id}`,
                            value: `${item.quantity} x $${item.unit_cost?.toLocaleString()} = $${item.subtotal?.toLocaleString()}`,
                            fullWidth: true
                        })) || []
                    },
                    {
                        title: "Notas",
                        fields: [
                            { label: "Observaciones", value: selectedPurchase?.notes || "Sin notas", fullWidth: true },
                        ]
                    }
                ]}
                footerActions={
                    <>
                        <button 
                            onClick={() => selectedPurchase && handleExportPDF(selectedPurchase.id)}
                            className="flex-[1] h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] hover:bg-indigo-100 transition-all active:scale-95"
                        >
                            <FileDown className="h-5 w-5" />
                            Descargar PDF
                        </button>
                        {selectedPurchase?.status === 'draft' && hasPermission('purchases:receive') && (
                            <button 
                                onClick={() => {
                                    receiveMutation.mutate(selectedPurchase.id)
                                    setIsDetailModalOpen(false)
                                }}
                                className="flex-[1.5] h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                            >
                                <CheckCircle2 className="h-5 w-5" />
                                Recibir Stock
                            </button>
                        )}
                    </>
                }
            />
        </div>
    )
}
