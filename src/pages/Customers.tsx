import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { User, Mail, Phone, MapPin, Plus, Edit, Trash2, X, Filter, Shield, Search, Eye, CheckCircle, XCircle } from 'lucide-react'
import DetailModal from '@/components/common/DetailModal'
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
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
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
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                    <User className="h-16 w-16 text-gray-200 mx-auto" />
                    <p className="mt-4 text-gray-400 font-bold">No hay clientes registrados</p>
                    <button onClick={() => openModal()} className="mt-4 text-primary-600 font-black text-sm uppercase tracking-wider hover:underline">
                        Registrar mi primer cliente
                    </button>
                </div>
            )
        }

        return (
            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm shadow-gray-200/50">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Identificación</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Contacto</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Ubicación</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                        {data.items.map((customer) => (
                            <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100/50 shrink-0">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-gray-900 line-clamp-1">{customer.name}</span>
                                            <span className="text-[10px] font-mono text-gray-400 uppercase font-black tracking-tighter">ID: {customer.id}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600">
                                    {customer.document_number ? (
                                        <div className="flex flex-col">
                                            <span>{customer.document_number}</span>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{customer.document_type}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-300 italic font-medium text-xs">Sin documento</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                            <Mail className="h-3 w-3 text-gray-300" />
                                            {customer.email || 'Sin correo'}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                            <Phone className="h-3 w-3 text-gray-300" />
                                            {customer.phone || 'Sin teléfono'}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-700">{customer.city || 'Desconocida'}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{customer.country}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={clsx(
                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                        customer.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400 border border-gray-100'
                                    )}>
                                        <div className={clsx("h-1.5 w-1.5 rounded-full", customer.is_active ? 'bg-emerald-500' : 'bg-gray-300')} />
                                        {customer.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button 
                                            onClick={() => {
                                                setSelectedCustomer(customer)
                                                setIsDetailModalOpen(true)
                                            }}
                                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                            title="Ver Detalles"
                                        >
                                            <Eye className="h-5 w-5" />
                                        </button>
                                        {hasPermission('customers:edit') && (
                                            <button 
                                                onClick={() => openModal(customer)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                title="Editar"
                                            >
                                                <Edit className="h-5 w-5" />
                                            </button>
                                        )}
                                        {hasPermission('customers:delete') && (
                                            <button 
                                                onClick={() => handleDeleteClick(customer.id, customer.name)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
                                : "bg-white border-gray-200 text-gray-600 hover:bg-white"
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
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-white/60 backdrop-blur-sm animate-in fade-in duration-300" 
                        onClick={closeModal} 
                    />
                    
                    {/* Modal Container */}
                    <div className="relative transform overflow-hidden rounded-[2.5rem] bg-white shadow-2xl transition-all w-full max-w-xl border border-gray-100 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <User className="h-6 w-6 text-primary-600" />
                                {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-xl transition-all">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-8 py-8 overflow-y-auto custom-scrollbar">
                            <form id="customer-form" onSubmit={handleSubmit} className="space-y-6">
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

                                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border">
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

                                </form>
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 h-12 text-gray-700 hover:bg-white rounded-xl border border-gray-200 transition-all shadow-sm font-bold uppercase tracking-widest text-[10px]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    form="customer-form"
                                    className="px-8 h-12 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 font-bold uppercase tracking-widest text-[10px]"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                >
                                    {createMutation.isPending || updateMutation.isPending ? 'Procesando...' : (editingCustomer ? 'Guardar Cambios' : 'Crear Cliente')}
                                </button>
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
                                        className="input h-12 bg-white border-gray-100 rounded-xl"
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

            <DetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title={selectedCustomer?.name || "Detalles del Cliente"}
                subtitle={selectedCustomer ? `${selectedCustomer.document_type}: ${selectedCustomer.document_number}` : ""}
                icon={User}
                statusBadge={
                    selectedCustomer && (
                        <span className={clsx(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            selectedCustomer.is_active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        )}>
                            {selectedCustomer.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {selectedCustomer.is_active ? "Activa" : "Inactiva"}
                        </span>
                    )
                }
                sections={[
                    {
                        title: "Información Personal",
                        fields: [
                            { label: "Nombre Completo", value: selectedCustomer?.name },
                            { label: "Tipo de Documento", value: selectedCustomer?.document_type },
                            { label: "Número de Documento", value: selectedCustomer?.document_number },
                        ]
                    },
                    {
                        title: "Contacto",
                        fields: [
                            { label: "Email", value: selectedCustomer?.email || "N/A" },
                            { label: "Teléfono", value: selectedCustomer?.phone || "N/A" },
                        ]
                    },
                    {
                        title: "Ubicación",
                        fields: [
                            { label: "Dirección", value: selectedCustomer?.address, fullWidth: true },
                            { label: "Ciudad", value: selectedCustomer?.city },
                            { label: "Estado/Provincia", value: selectedCustomer?.state },
                            { label: "País", value: selectedCustomer?.country },
                        ]
                    },
                    {
                        title: "Otros",
                        fields: [
                            { label: "Notas", value: selectedCustomer?.notes, fullWidth: true },
                        ]
                    },
                    {
                        title: "Fechas",
                        fields: [
                            { label: "Fecha de Registro", value: selectedCustomer ? new Date(selectedCustomer.created_at).toLocaleString() : "" },
                            { label: "Última Actualización", value: selectedCustomer ? new Date(selectedCustomer.updated_at).toLocaleString() : "" },
                        ]
                    }
                ]}
                footerActions={
                    <>
                        {hasPermission('customers:edit') && (
                            <button 
                                onClick={() => {
                                    setIsDetailModalOpen(false)
                                    if (selectedCustomer) openModal(selectedCustomer)
                                }}
                                className="flex-[1.5] h-14 bg-primary-600 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 active:scale-95"
                            >
                                <Edit className="h-5 w-5" />
                                Editar Cliente
                            </button>
                        )}
                    </>
                }
            />
        </div>
    )
}
