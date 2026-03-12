import React, { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { branchApi, Branch } from '@/api/branches'
import toast from 'react-hot-toast'
import { Package, X } from 'lucide-react'
import clsx from 'clsx'

interface QuickMoveModalProps {
    isOpen: boolean
    onClose: () => void
    product: any
    type: 'entry' | 'exit'
    onSuccess?: () => void
}

export default function QuickMoveModal({ isOpen, onClose, product, type, onSuccess }: QuickMoveModalProps) {
    const queryClient = useQueryClient()
    const [formData, setFormData] = useState({
        quantity: '',
        reference: '',
        notes: '',
        branch_id: ''
    })

    const { data: branches } = useQuery<Branch[]>({
        queryKey: ["branches-active"],
        queryFn: async () => {
            const response = await branchApi.getActive()
            return response.data || []
        },
        enabled: isOpen
    })

    const mutation = useMutation({
        mutationFn: (data: any) => {
            const endpoint = type === 'entry'
                ? '/api/v1/inventory/add-stock'
                : '/api/v1/inventory/remove-stock'
            return api.post(endpoint, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            queryClient.invalidateQueries({ queryKey: ["stock-levels"] })
            toast.success(type === 'entry' ? "Entrada registrada" : "Salida registrada")
            onSuccess?.()
            onClose()
            setFormData({ quantity: '', reference: '', notes: '', branch_id: '' })
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || "Error en movimiento"),
    })

    if (!isOpen || !product) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        mutation.mutate({
            product_id: product.id,
            ...formData
        })
    }

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div
                    className="fixed inset-0 bg-white bg-opacity-70 backdrop-blur-sm"
                    onClick={onClose}
                />
                <div className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-md">
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            {type === "entry" ? "Entrada de Stock" : "Salida de Stock"}
                        </h3>
                        <div className="p-3 bg-white rounded-xl mb-4 flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <Package className="h-5 w-5 text-primary-600" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 font-bold uppercase">
                                    {product.sku}
                                </div>
                                <div className="text-sm font-bold text-gray-900">
                                    {product.name}
                                </div>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    Sucursal de Destino/Origen *
                                </label>
                                <select
                                    required
                                    className="input"
                                    value={formData.branch_id}
                                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                                >
                                    <option value="" disabled>Seleccione una sucursal</option>
                                    {branches?.map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    Cantidad
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    className="input"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    placeholder="0"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    Referencia / Folio
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.reference}
                                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                    placeholder="Ej: Factura #123"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className={clsx(
                                        "btn flex-1 text-white font-bold",
                                        type === "entry" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700",
                                    )}
                                    disabled={mutation.isPending}
                                >
                                    {mutation.isPending ? "Procesando..." : type === "entry" ? "Cargar Entrada" : "Registrar Salida"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
