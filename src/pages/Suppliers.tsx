import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { Building2, Mail, Phone, MapPin, Plus, Edit, Trash2, X, Globe, User } from 'lucide-react'
import type { Supplier, PaginatedResponse } from '@/types'

export default function Suppliers() {
    const [page, setPage] = useState(1)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        tax_id: '',
        contact_name: '',
        email: '',
        phone: '',
        mobile: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
        website: '',
        payment_terms: '',
        notes: '',
        is_active: true
    })

    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery<PaginatedResponse<Supplier>>({
        queryKey: ['suppliers', page],
        queryFn: async () => {
            const response = await api.get(`/api/v1/suppliers/?page=${page}&size=10`)
            return response.data
        },
    })

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/api/v1/suppliers/', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] })
            toast.success('Proveedor creado')
            closeModal()
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al crear'),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/api/v1/suppliers/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] })
            toast.success('Proveedor actualizado')
            closeModal()
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al actualizar'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/api/v1/suppliers/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] })
            toast.success('Proveedor eliminado')
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al eliminar'),
    })

    const openModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier)
            setFormData({
                name: supplier.name,
                code: supplier.code,
                tax_id: supplier.tax_id || '',
                contact_name: supplier.contact_name || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                mobile: supplier.mobile || '',
                address: supplier.address || '',
                city: supplier.city || '',
                state: supplier.state || '',
                country: supplier.country || '',
                postal_code: supplier.postal_code || '',
                website: supplier.website || '',
                payment_terms: supplier.payment_terms || '',
                notes: supplier.notes || '',
                is_active: supplier.is_active
            })
        } else {
            setEditingSupplier(null)
            setFormData({
                name: '',
                code: '',
                tax_id: '',
                contact_name: '',
                email: '',
                phone: '',
                mobile: '',
                address: '',
                city: '',
                state: '',
                country: '',
                postal_code: '',
                website: '',
                payment_terms: '',
                notes: '',
                is_active: true
            })
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingSupplier(null)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (editingSupplier) {
            updateMutation.mutate({ id: editingSupplier.id, data: formData })
        } else {
            createMutation.mutate(formData)
        }
    }

    const handleDelete = (id: number, name: string) => {
        if (confirm(`¿Eliminar proveedor "${name}"?`)) {
            deleteMutation.mutate(id)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
                    <p className="mt-1 text-sm text-gray-600">Gestión de proveedores y contactos</p>
                </div>
                <button 
                    onClick={() => openModal()}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Nuevo Proveedor
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600 font-medium">Cargando proveedores...</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {data?.items.map((supplier) => (
                            <div key={supplier.id} className="card group hover:border-primary-300 hover:shadow-md transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                                            <Building2 className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{supplier.name}</h3>
                                            <p className="text-xs font-mono text-gray-500 uppercase">{supplier.code}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span
                                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${supplier.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {supplier.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-5 space-y-2.5">
                                    {supplier.contact_name && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium text-gray-900">{supplier.contact_name}</span>
                                        </div>
                                    )}
                                    {supplier.email && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            <a href={`mailto:${supplier.email}`} className="hover:text-primary-600 transition-colors">{supplier.email}</a>
                                        </div>
                                    )}
                                    {supplier.phone && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <span>{supplier.phone}</span>
                                        </div>
                                    )}
                                    {supplier.city && (
                                        <div className="flex items-start gap-2 text-sm text-gray-600">
                                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                            <span>
                                                {supplier.city}
                                                {(supplier.state || supplier.country) && ', '}
                                                {supplier.state}
                                                {supplier.country && ` (${supplier.country})`}
                                            </span>
                                        </div>
                                    )}
                                    {supplier.website && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Globe className="h-4 w-4 text-gray-400" />
                                            <a href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                                                Sitio Web
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {supplier.notes && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <p className="text-xs text-gray-500 line-clamp-2 italic">{supplier.notes}</p>
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => openModal(supplier)}
                                        className="btn bg-blue-50 text-blue-600 hover:bg-blue-100 border-none px-3 py-1.5 text-xs"
                                    >
                                        <Edit className="h-4 w-4 mr-1.5" />
                                        Editar
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(supplier.id, supplier.name)}
                                        className="btn bg-red-50 text-red-600 hover:bg-red-100 border-none px-3 py-1.5 text-xs"
                                    >
                                        <Trash2 className="h-4 w-4 mr-1.5" />
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {data && data.metadata.pages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="btn btn-secondary px-6"
                            >
                                Anterior
                            </button>
                            <span className="text-sm font-semibold text-gray-900">
                                Página {page} de {data.metadata.pages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(data.metadata.pages, p + 1))}
                                disabled={page === data.metadata.pages}
                                className="btn btn-secondary px-6"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
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
                                    <Building2 className="h-6 w-6 text-primary-600" />
                                    {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                                </h3>

                                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-1">Información General</h4>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700">Nombre de la Empresa *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="input mt-1.5"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700">Código de Proveedor *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="input mt-1.5 font-mono"
                                                    value={formData.code}
                                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700">ID Fiscal / RUC / NIT</label>
                                                <input
                                                    type="text"
                                                    className="input mt-1.5"
                                                    value={formData.tax_id}
                                                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700">Nombre de Contacto</label>
                                                <input
                                                    type="text"
                                                    className="input mt-1.5"
                                                    value={formData.contact_name}
                                                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-1">Ubicación y Web</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-semibold text-gray-700">País</label>
                                                    <input
                                                        type="text"
                                                        className="input mt-1.5"
                                                        value={formData.country}
                                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700">Ciudad</label>
                                                    <input
                                                        type="text"
                                                        className="input mt-1.5"
                                                        value={formData.city}
                                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700">Estado/Provincia</label>
                                                    <input
                                                        type="text"
                                                        className="input mt-1.5"
                                                        value={formData.state}
                                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700">Dirección</label>
                                                <input
                                                    type="text"
                                                    className="input mt-1.5"
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700">Sito Web</label>
                                                <div className="relative mt-1.5">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                        <Globe className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="https://..."
                                                        className="input pl-10"
                                                        value={formData.website}
                                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-1">Contacto y Términos</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700">Email</label>
                                                <input
                                                    type="email"
                                                    className="input mt-1.5"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700">Teléfono</label>
                                                <input
                                                    type="text"
                                                    className="input mt-1.5"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700">Términos de Pago</label>
                                                <select
                                                    className="input mt-1.5"
                                                    value={formData.payment_terms}
                                                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                                                >
                                                    <option value="">Seleccionar...</option>
                                                    <option value="contado">Al Contado</option>
                                                    <option value="15d">Neto 15 días</option>
                                                    <option value="30d">Neto 30 días</option>
                                                    <option value="60d">Neto 60 días</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                                        <span className="text-sm font-semibold text-gray-700">Estado del Proveedor</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                        </label>
                                    </div>

                                    <div className="pt-4 flex gap-4">
                                        <button
                                            type="button"
                                            className="btn btn-secondary flex-1 h-12 font-bold"
                                            onClick={closeModal}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary flex-1 h-12 font-bold shadow-lg shadow-primary-200"
                                            disabled={createMutation.isPending || updateMutation.isPending}
                                        >
                                            {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : (editingSupplier ? 'Actualizar Proveedor' : 'Crear Proveedor')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
