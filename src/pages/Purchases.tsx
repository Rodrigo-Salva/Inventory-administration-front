import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { 
    Package, Plus, Calendar, 
    CheckCircle2, Clock, XCircle, 
    Truck, Eye, FileDown, DollarSign
} from 'lucide-react'
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

            {isLoading ? (
                <div className="text-center py-24">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                    <p className="mt-4 text-sm text-gray-500 font-bold uppercase tracking-widest font-mono">Cargando compras...</p>
                </div>
            ) : data?.items.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                    <Truck className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No hay registros de compras</p>
                    <button onClick={() => navigate('/purchases/new')} className="mt-4 text-primary-600 font-black text-sm uppercase tracking-widest hover:underline">
                        Registrar mi primera compra
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {data?.items.map((purchase) => {
                        const status = statusMap[purchase.status as keyof typeof statusMap]
                        return (
                            <div key={purchase.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 hover:border-primary-100 hover:shadow-2xl hover:shadow-gray-200/50 transition-all group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className={clsx("h-14 w-14 rounded-2xl flex items-center justify-center border", status.color)}>
                                            <status.icon className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-black text-gray-900 leading-tight">Compra #{purchase.id}</h3>
                                                {purchase.reference_number && (
                                                    <span className="px-2 py-0.5 bg-gray-100 text-[10px] font-mono font-black text-gray-400 rounded-md uppercase tracking-tighter">REF: {purchase.reference_number}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-gray-500 text-xs font-bold uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> {(purchase as any).supplier_name || purchase.supplier?.name}</span>
                                                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(purchase.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-8">
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Compra</p>
                                                <p className="text-2xl font-black text-gray-900 tracking-tighter">${Number(purchase.total_amount).toLocaleString()}</p>
                                            </div>
                                            
                                            {(purchase as any).payment_status && (
                                                <div className={clsx(
                                                    "flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-tighter",
                                                    paymentStatusMap[(purchase as any).payment_status as keyof typeof paymentStatusMap]?.color || "bg-gray-50 text-gray-500 border-gray-100"
                                                )}>
                                                    <span className={clsx(
                                                        "h-2 w-2 rounded-full",
                                                        paymentStatusMap[(purchase as any).payment_status as keyof typeof paymentStatusMap]?.dot || "bg-gray-300"
                                                    )} />
                                                    {paymentStatusMap[(purchase as any).payment_status as keyof typeof paymentStatusMap]?.label || (purchase as any).payment_status}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {purchase.status === 'draft' && hasPermission('purchases:receive') && (
                                                <button 
                                                    onClick={() => receiveMutation.mutate(purchase.id)}
                                                    disabled={receiveMutation.isPending}
                                                    className="btn bg-emerald-600 hover:bg-emerald-500 text-white h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100"
                                                >
                                                    {receiveMutation.isPending ? 'Recibiendo...' : 'Recibir Stock'}
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleExportPDF(purchase.id)}
                                                className="p-3 bg-indigo-50 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100"
                                                title="Descargar PDF"
                                            >
                                                <FileDown className="h-5 w-5" />
                                            </button>
                                            <button className="p-3 bg-gray-50 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all border border-transparent hover:border-primary-100">
                                                <Eye className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
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
        </div>
    )
}
