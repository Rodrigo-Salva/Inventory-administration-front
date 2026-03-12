import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { Building2, Mail, Phone, MapPin, Plus, Edit, Trash2, X, Globe, FileDown, Filter, Eye, CheckCircle, XCircle } from 'lucide-react'
import DetailModal from '@/components/common/DetailModal'
import clsx from 'clsx'
import type { Supplier, PaginatedResponse } from '@/types'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import Pagination from '@/components/common/Pagination'
import DateRangePicker from '@/components/common/DateRangePicker'
import { usePermissions } from '@/hooks/usePermissions'
import { Shield } from 'lucide-react'

export default function Suppliers() {
    const [page, setPage] = useState(1)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [isFiltersVisible, setIsFiltersVisible] = useState(false)
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
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

    // Modal de confirmación de eliminación
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [supplierToDelete, setSupplierToDelete] = useState<{ id: number, name: string } | null>(null)

    const queryClient = useQueryClient()
    const { hasPermission } = usePermissions()

    const { data, isLoading } = useQuery<PaginatedResponse<Supplier>>({
        queryKey: ['suppliers', page, search, filterStatus, startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                size: '10',
                ...(search && { search }),
                ...(filterStatus !== 'all' && { is_active: (filterStatus === 'active' ? 'true' : 'false') }),
                ...(startDate && { start_date: startDate }),
                ...(endDate && { end_date: endDate }),
            })
            const response = await api.get(`/api/v1/suppliers/?${params.toString()}`)
            return response.data
        },
    })

    // Resetear a la página 1 cuando cambian los filtros
    useEffect(() => {
        setPage(1)
    }, [search, filterStatus, startDate, endDate])

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
        setFormData({
            name: '', code: '', tax_id: '', contact_name: '', email: '',
            phone: '', mobile: '', address: '', city: '', state: '',
            country: '', postal_code: '', website: '', payment_terms: '',
            notes: '', is_active: true
        })
    }

    const handleExportExcel = async () => {
        try {
            const params = new URLSearchParams({
                ...(search && { search }),
                ...(filterStatus !== 'all' && { is_active: (filterStatus === 'active' ? 'true' : 'false') }),
                ...(startDate && { start_date: startDate }),
                ...(endDate && { end_date: endDate }),
            })
            
            toast.loading('Generando Excel...', { id: 'export-excel' })
            const response = await api.get(`/api/v1/reports/suppliers-excel?${params}`, {
                responseType: 'blob'
            })
            
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `Proveedores_${new Date().toISOString().split('T')[0]}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            toast.success('Excel generado correctamente', { id: 'export-excel' })
        } catch (error) {
            toast.error('Error al generar Excel', { id: 'export-excel' })
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (editingSupplier) {
            updateMutation.mutate({ id: editingSupplier.id, data: formData })
        } else {
            createMutation.mutate(formData)
        }
    }

    const handleDeleteClick = (id: number, name: string) => {
        setSupplierToDelete({ id, name })
        setIsDeleteModalOpen(true)
    }

    const confirmDelete = () => {
        if (supplierToDelete) {
            deleteMutation.mutate(supplierToDelete.id)
            setIsDeleteModalOpen(false)
        }
    }

    if (!hasPermission('suppliers:view')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Shield className="h-16 w-16 text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Acceso Denegado</h2>
                <p className="text-gray-500 mt-2">No tienes permisos para ver los proveedores.</p>
            </div>
        )
    }

    const renderSuppliers = () => {
        if (!data?.items || data.items.length === 0) {
            return (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                    <Building2 className="h-16 w-16 text-gray-200 mx-auto" />
                    <p className="mt-4 text-gray-400 font-bold">No hay proveedores registrados</p>
                    <button onClick={() => openModal()} className="mt-4 text-primary-600 font-black text-sm uppercase tracking-wider hover:underline">
                        Registrar mi primer proveedor
                    </button>
                </div>
            )
        }

        return (
            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm shadow-gray-200/50">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Proveedor</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Contacto Directo</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Información</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Ubicación</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                        {data.items.map((supplier) => (
                            <tr key={supplier.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100/50 shrink-0">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-gray-900 line-clamp-1">{supplier.name}</span>
                                            <span className="text-[10px] font-mono text-gray-400 uppercase font-black tracking-tighter">REF: {supplier.code}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-700">{supplier.contact_name || 'N/A'}</span>
                                        {supplier.payment_terms && (
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Condición: {supplier.payment_terms}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                            <Mail className="h-3 w-3 text-gray-300" />
                                            {supplier.email || 'Sin correo'}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                            <Phone className="h-3 w-3 text-gray-300" />
                                            {supplier.phone || supplier.mobile || 'Sin teléfono'}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-700">{supplier.city || 'Desconocida'}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{supplier.country}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={clsx(
                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                        supplier.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400 border border-gray-100'
                                    )}>
                                        <div className={clsx("h-1.5 w-1.5 rounded-full", supplier.is_active ? 'bg-emerald-500' : 'bg-gray-300')} />
                                        {supplier.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button 
                                            onClick={() => {
                                                setSelectedSupplier(supplier)
                                                setIsDetailModalOpen(true)
                                            }}
                                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                            title="Ver Detalles"
                                        >
                                            <Eye className="h-5 w-5" />
                                        </button>
                                        {hasPermission('suppliers:edit') && (
                                            <button 
                                                onClick={() => openModal(supplier)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                title="Editar"
                                            >
                                                <Edit className="h-5 w-5" />
                                            </button>
                                        )}
                                        {hasPermission('suppliers:delete') && (
                                            <button 
                                                onClick={() => handleDeleteClick(supplier.id, supplier.name)}
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
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">Proveedores</h1>
                    <p className="mt-1 text-sm text-gray-500 font-medium italic">Gestión de aliados comerciales y contactos</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsFiltersVisible(true)}
                        className={clsx(
                            "btn flex items-center gap-2 h-10 px-4 transition-all border shadow-sm rounded-xl text-xs uppercase tracking-widest font-bold",
                            (startDate || endDate || filterStatus !== 'all')
                                ? "bg-primary-50 border-primary-200 text-primary-700 font-bold" 
                                : "bg-white border-gray-200 text-gray-600 hover:bg-white"
                        )}
                    >
                        <Filter className="h-4 w-4" />
                        Filtrar
                        {(startDate || endDate || filterStatus !== 'all') && (
                            <span className="flex h-2 w-2 rounded-full bg-primary-600 animate-pulse" />
                        )}
                    </button>
                    {hasPermission('suppliers:create') && (
                        <button 
                            onClick={() => openModal()}
                            className="btn btn-primary flex items-center gap-2 h-10 rounded-xl px-4 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-200"
                        >
                            <Plus className="h-5 w-5" />
                            <span className="hidden sm:inline">Nuevo Proveedor</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="relative">
                <Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    className="input pl-12 h-12 text-base bg-white border-gray-100 shadow-xl shadow-gray-200/50 rounded-2xl focus:ring-primary-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>


            {isLoading ? (
                <div className="text-center py-24">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                    <p className="mt-4 text-sm text-gray-500 font-bold uppercase tracking-widest">Cargando aliados comerciales...</p>
                </div>
            ) : (
                <>
                    {renderSuppliers()}

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

            {/* Modal de Confirmación */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="¿Eliminar Proveedor?"
                message={`¿Estás seguro de que deseas eliminar al proveedor "${supplierToDelete?.name}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar Proveedor"
                type="danger"
            />

            {/* Modal de Formulario */}
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
                                <Building2 className="h-6 w-6 text-primary-600" />
                                {editingSupplier ? 'Editar Proveedor' : 'Nueva Proveedor'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-xl transition-all">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-8 py-8 overflow-y-auto custom-scrollbar">
                            <form id="supplier-form" onSubmit={handleSubmit} className="space-y-6">
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

                                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border">
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
                                    form="supplier-form"
                                    className="px-8 h-12 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 font-bold uppercase tracking-widest text-[10px]"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                >
                                    {createMutation.isPending || updateMutation.isPending ? 'Procesando...' : (editingSupplier ? 'Guardar Cambios' : 'Crear Proveedor')}
                                </button>
                            </div>
                        </div>
                    </div>
            )}
            {/* Modal de Filtros (Ventana Flotante) */}
            {isFiltersVisible && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsFiltersVisible(false)} />
                        
                        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                            <div className="bg-white px-6 py-6 border-b border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
                                        <Filter className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 line-clamp-1">Filtros de Búsqueda</h3>
                                </div>
                                <button onClick={() => setIsFiltersVisible(false)} className="text-gray-400 hover:text-gray-500 p-1 hover:bg-white rounded-lg">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="px-6 py-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 font-black">Estado</label>
                                        <select 
                                            className="input h-12 bg-white border-gray-100 rounded-xl text-sm font-medium focus:bg-white transition-all shadow-sm"
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value as any)}
                                        >
                                            <option value="all">Todos los estados</option>
                                            <option value="active">Solo Activos</option>
                                            <option value="inactive">Solo Inactivos</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <DateRangePicker 
                                            startDate={startDate} 
                                            endDate={endDate} 
                                            onChange={({start, end}) => {
                                                setStartDate(start)
                                                setEndDate(end)
                                            }} 
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-50 flex flex-col gap-3">
                                    {hasPermission('products:download') && ( // Usamos el permiso de reporte general
                                        <button 
                                            onClick={handleExportExcel}
                                            className="btn bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-emerald-200"
                                        >
                                            <FileDown className="h-5 w-5" />
                                            Exportar a Excel
                                        </button>
                                    )}
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => {
                                                setSearch('')
                                                setFilterStatus('all')
                                                setStartDate('')
                                                setEndDate('')
                                                setIsFiltersVisible(false)
                                            }}
                                            className="btn border border-gray-200 text-gray-500 h-11 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white shadow-sm"
                                        >
                                            Limpiar
                                        </button>
                                        <button 
                                            onClick={() => setIsFiltersVisible(false)}
                                            className="btn btn-primary h-11 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary-200"
                                        >
                                            Aplicar Filtros
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <DetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title={selectedSupplier?.name || "Detalles del Proveedor"}
                subtitle={selectedSupplier ? `Código: ${selectedSupplier.code}` : ""}
                icon={Building2}
                statusBadge={
                    selectedSupplier && (
                        <span className={clsx(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            selectedSupplier.is_active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        )}>
                            {selectedSupplier.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {selectedSupplier.is_active ? "Activo" : "Inactivo"}
                        </span>
                    )
                }
                sections={[
                    {
                        title: "Información General",
                        fields: [
                            { label: "Nombre de la Empresa", value: selectedSupplier?.name },
                            { label: "Código", value: selectedSupplier?.code },
                            { label: "ID Fiscal / RUC / NIT", value: selectedSupplier?.tax_id || "N/A" },
                            { label: "Nombre de Contacto", value: selectedSupplier?.contact_name || "N/A" },
                        ]
                    },
                    {
                        title: "Contacto",
                        fields: [
                            { label: "Email", value: selectedSupplier?.email },
                            { label: "Teléfono", value: selectedSupplier?.phone || "N/A" },
                            { label: "Móvil", value: selectedSupplier?.mobile || "N/A" },
                            { label: "Sito Web", value: selectedSupplier?.website || "N/A" },
                        ]
                    },
                    {
                        title: "Ubicación",
                        fields: [
                            { label: "Dirección", value: selectedSupplier?.address, fullWidth: true },
                            { label: "Ciudad", value: selectedSupplier?.city },
                            { label: "Estado/Provincia", value: selectedSupplier?.state },
                            { label: "País", value: selectedSupplier?.country },
                            { label: "Código Postal", value: selectedSupplier?.postal_code },
                        ]
                    },
                    {
                        title: "Términos y Notas",
                        fields: [
                            { label: "Términos de Pago", value: selectedSupplier?.payment_terms || "N/A" },
                            { label: "Notas", value: selectedSupplier?.notes, fullWidth: true },
                        ]
                    },
                    {
                        title: "Fechas",
                        fields: [
                            { label: "Fecha de Registro", value: selectedSupplier ? new Date(selectedSupplier.created_at).toLocaleString() : "" },
                            { label: "Última Actualización", value: selectedSupplier ? new Date(selectedSupplier.updated_at).toLocaleString() : "" },
                        ]
                    }
                ]}
                footerActions={
                    <>
                        {hasPermission('suppliers:edit') && (
                            <button 
                                onClick={() => {
                                    setIsDetailModalOpen(false)
                                    if (selectedSupplier) openModal(selectedSupplier)
                                }}
                                className="flex-[1.5] h-14 bg-primary-600 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 active:scale-95"
                            >
                                <Edit className="h-5 w-5" />
                                Editar Proveedor
                            </button>
                        )}
                    </>
                }
            />
        </div>
    )
}
