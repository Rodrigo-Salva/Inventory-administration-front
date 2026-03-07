import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { User, Mail, Phone, MapPin, Plus, Edit, Trash2, X, Filter, Shield, Search } from 'lucide-react'
import clsx from 'clsx'
import type { Customer, PaginatedResponse } from '@/types'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import Pagination from '@/components/common/Pagination'
import { usePermissions } from '@/hooks/usePermissions'

export default function Customers() {
    const [page, setPage] = useState(1)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
    const [isFiltersVisible, setIsFiltersVisible] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        document_type: '',
        document_number: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        notes: '',
        is_active: true
    })

    // Modal de confirmación de eliminación
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [customerToDelete, setCustomerToDelete] = useState<{ id: number, name: string } | null>(null)

    const queryClient = useQueryClient()
    const { hasPermission } = usePermissions()

    const { data, isLoading } = useQuery<PaginatedResponse<Customer>>({
        queryKey: ['customers', page, search, filterStatus],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                size: '10',
                ...(search && { search }),
                ...(filterStatus !== 'all' && { is_active: (filterStatus === 'active' ? 'true' : 'false') }),
            })
            const response = await api.get(`/api/v1/customers/?${params.toString()}`)
            return response.data
        },
    })

    // Resetear a la página 1 cuando cambian los filtros
    useEffect(() => {
        setPage(1)
    }, [search, filterStatus])

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/api/v1/customers/', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] })
            toast.success('Cliente creado correctamente')
            closeModal()
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al crear cliente'),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/api/v1/customers/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] })
            toast.success('Cliente actualizado correctamente')
            closeModal()
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al actualizar cliente'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/api/v1/customers/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] })
            toast.success('Cliente eliminado correctamente')
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al eliminar cliente'),
    })

    const openModal = (customer?: Customer) => {
        if (customer) {
            setEditingCustomer(customer)
            setFormData({
                name: customer.name,
                document_type: customer.document_type || '',
                document_number: customer.document_number || '',
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address || '',
                city: customer.city || '',
                state: customer.state || '',
                country: customer.country || '',
                notes: customer.notes || '',
                is_active: customer.is_active
            })
        } else {
            setEditingCustomer(null)
            setFormData({
                name: '',
                document_type: '',
                document_number: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                state: '',
                country: '',
                notes: '',
                is_active: true
            })
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingCustomer(null)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (editingCustomer) {
            updateMutation.mutate({ id: editingCustomer.id, data: formData })
        } else {
            createMutation.mutate(formData)
        }
    }

    const handleDeleteClick = (id: number, name: string) => {
        setCustomerToDelete({ id, name })
        setIsDeleteModalOpen(true)
    }

    const confirmDelete = () => {
        if (customerToDelete) {
            deleteMutation.mutate(customerToDelete.id)
            setIsDeleteModalOpen(false)
        }
    }

    if (!hasPermission('customers:view')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Shield className="h-16 w-16 text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Acceso Denegado</h2>
                <p className="text-gray-500 mt-2">No tienes permisos para ver los clientes.</p>
            </div>
        )
    }

    const renderCustomers = () => {
        if (!data?.items || data.items.length === 0) {
            return (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <User className="h-16 w-16 text-gray-200 mx-auto" />
                    <p className="mt-4 text-gray-400 font-bold">No hay clientes registrados</p>
                    <button onClick={() => openModal()} className="mt-4 text-primary-600 font-black text-sm uppercase tracking-wider hover:underline">
                        Registrar mi primer cliente
                    </button>
                </div>
            )
        }

        return (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.items.map((customer) => (
                    <div key={customer.id} className="card group hover:border-primary-200 hover:shadow-xl transition-all border-none shadow-lg shadow-gray-200/50 flex flex-col p-5">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 flex-shrink-0 rounded-2xl bg-gray-50 flex items-center justify-center text-primary-500 group-hover:bg-primary-50 transition-colors border border-transparent group-hover:border-primary-100">
                                    <User className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 leading-tight group-hover:text-primary-700 transition-colors line-clamp-1">{customer.name}</h3>
                                    {customer.document_number && (
                                        <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">{customer.document_type}: {customer.document_number}</span>
                                    )}
                                </div>
                            </div>
                            <span
                                className={clsx(
                                    "px-2.5 py-1 text-[10px] uppercase font-black tracking-widest rounded-md",
                                    customer.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                )}
                            >
                                {customer.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>

                        <div className="mt-6 space-y-3.5 flex-1">
                            {customer.email && (
                                <div className="flex items-center gap-3 text-sm group/item">
                                    <div className="h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover/item:bg-primary-50 group-hover/item:text-primary-500 transition-colors">
                                        <Mail className="h-3.5 w-3.5" />
                                    </div>
                                    <a href={`mailto:${customer.email}`} className="font-medium text-gray-500 hover:text-primary-600 transition-colors truncate">{customer.email}</a>
                                </div>
                            )}
                            {customer.phone && (
                                <div className="flex items-center gap-3 text-sm group/item">
                                    <div className="h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover/item:bg-primary-50 group-hover/item:text-primary-500 transition-colors">
                                        <Phone className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="font-medium text-gray-500">{customer.phone}</span>
                                </div>
                            )}
                            {customer.city && (
                                <div className="flex items-center gap-3 text-sm group/item">
                                    <div className="h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover/item:bg-primary-50 group-hover/item:text-primary-500 transition-colors">
                                        <MapPin className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="font-medium text-gray-500 truncate">{customer.city}, {customer.country}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                {hasPermission('customers:edit') && (
                                    <button 
                                        onClick={() => openModal(customer)}
                                        className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                        title="Editar"
                                    >
                                        <Edit className="h-4.5 w-4.5" />
                                    </button>
                                )}
                                {hasPermission('customers:delete') && (
                                    <button 
                                        onClick={() => handleDeleteClick(customer.id, customer.name)}
                                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="h-4.5 w-4.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">Clientes</h1>
                    <p className="mt-1 text-sm text-gray-500 font-medium italic">Gestión de cartera de clientes (CRM)</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsFiltersVisible(true)}
                        className={clsx(
                            "btn flex items-center gap-2 h-10 px-4 transition-all border shadow-sm rounded-xl text-xs uppercase tracking-widest font-bold",
                            filterStatus !== 'all'
                                ? "bg-primary-50 border-primary-200 text-primary-700 font-bold" 
                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        <Filter className="h-4 w-4" />
                        Filtrar
                        {filterStatus !== 'all' && (
                            <span className="flex h-2 w-2 rounded-full bg-primary-600 animate-pulse" />
                        )}
                    </button>
                    {hasPermission('customers:create') && (
                        <button 
                            onClick={() => openModal()}
                            className="btn btn-primary flex items-center gap-2 h-10 rounded-xl px-4 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-200"
                        >
                            <Plus className="h-5 w-5" />
                            <span className="hidden sm:inline">Nuevo Cliente</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar clientes por nombre, documento o email..."
                    className="input pl-12 h-12 text-base bg-white border-gray-100 shadow-xl shadow-gray-200/50 rounded-2xl focus:ring-primary-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div className="text-center py-24">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                    <p className="mt-4 text-sm text-gray-500 font-bold uppercase tracking-widest">Cargando clientes...</p>
                </div>
            ) : (
                <>
                    {renderCustomers()}
                    <div className="mt-8">
                        <Pagination 
                            currentPage={page}
                            totalPages={data?.metadata?.pages || 0}
                            onPageChange={setPage}
                            totalItems={data?.metadata?.total}
                        />
                    </div>
                </>
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="¿Eliminar Cliente?"
                message={`¿Estás seguro de que deseas eliminar al cliente "${customerToDelete?.name}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar Cliente"
                type="danger"
            />

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
                                    <User className="h-6 w-6 text-primary-600" />
                                    {editingCustomer ? 'Editar Cliente' : 'Agregar nuevo Cliente'}
                                </h3>

                                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-1">Identificación</h4>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700">Nombre Completo *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="input mt-1.5"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700">Tipo Doc.</label>
                                                    <select
                                                        className="input mt-1.5"
                                                        value={formData.document_type}
                                                        onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                                                    >
                                                        <option value="">Seleccionar...</option>
                                                        <option value="DNI">DNI</option>
                                                        <option value="RUC">RUC</option>
                                                        <option value="NIT">NIT</option>
                                                        <option value="PASSPORT">Pasaporte</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700">Número Doc.</label>
                                                    <input
                                                        type="text"
                                                        className="input mt-1.5"
                                                        value={formData.document_number}
                                                        onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                                                    />
                                                </div>
                                            </div>
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
                                                <label className="block text-sm font-semibold text-gray-700">Teléfono / Móvil</label>
                                                <input
                                                    type="text"
                                                    className="input mt-1.5"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-1">Ubicación</h4>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700">País</label>
                                                <input
                                                    type="text"
                                                    className="input mt-1.5"
                                                    value={formData.country}
                                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
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
                                                    <label className="block text-sm font-semibold text-gray-700">Estado</label>
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
                                                <textarea
                                                    className="input mt-1.5 h-20 py-2"
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700">Notas Adicionales</label>
                                        <textarea
                                            className="input mt-1.5 h-20 py-2"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                                        <span className="text-sm font-semibold text-gray-700">Estado del Cliente</span>
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
                                            {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : (editingCustomer ? 'Actualizar Cliente' : 'Crear Cliente')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isFiltersVisible && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsFiltersVisible(false)} />
                        <div className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all sm:w-full sm:max-w-lg">
                            <div className="px-6 py-6 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900 line-clamp-1">Filtros</h3>
                                <button onClick={() => setIsFiltersVisible(false)} className="text-gray-400 hover:text-gray-500 p-1">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 font-black">Estado</label>
                                    <select 
                                        className="input h-12 bg-gray-50 border-gray-100 rounded-xl"
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value as any)}
                                    >
                                        <option value="all">Todos los clientes</option>
                                        <option value="active">Solo Activos</option>
                                        <option value="inactive">Solo Inactivos</option>
                                    </select>
                                </div>
                                <div className="pt-6 border-t flex flex-col gap-3">
                                    <button 
                                        onClick={() => {
                                            setSearch('')
                                            setFilterStatus('all')
                                            setIsFiltersVisible(false)
                                        }}
                                        className="btn border border-gray-200 text-gray-500 h-11 rounded-xl font-bold uppercase tracking-widest text-xs"
                                    >
                                        Limpiar Filtros
                                    </button>
                                    <button 
                                        onClick={() => setIsFiltersVisible(false)}
                                        className="btn btn-primary h-11 rounded-xl font-bold uppercase tracking-widest text-xs"
                                    >
                                        Aplicar
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
