import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { Building2, Mail, Phone, MapPin, Plus, Edit, Trash2, X, Globe, User, Package, FileDown, Filter } from 'lucide-react'
import clsx from 'clsx'
import type { Supplier, PaginatedResponse } from '@/types'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import Pagination from '@/components/common/Pagination'
import DateRangePicker from '@/components/common/DateRangePicker'

export default function Suppliers() {
    const [page, setPage] = useState(1)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [isFiltersVisible, setIsFiltersVisible] = useState(false)
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

    const renderSuppliers = () => {
        if (!data?.items || data.items.length === 0) {
            return (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <Building2 className="h-16 w-16 text-gray-200 mx-auto" />
                    <p className="mt-4 text-gray-400 font-bold">No hay proveedores registrados</p>
                    <button onClick={() => openModal()} className="mt-4 text-primary-600 font-black text-sm uppercase tracking-wider hover:underline">
                        Registrar mi primer proveedor
                    </button>
                </div>
            )
        }

        return (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.items.map((supplier) => (
                    <div key={supplier.id} className="card group hover:border-primary-200 hover:shadow-xl transition-all border-none shadow-lg shadow-gray-200/50 flex flex-col">
                        <div className="flex items-start justify-between p-1">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 flex-shrink-0 rounded-2xl bg-gray-50 flex items-center justify-center text-primary-500 group-hover:bg-primary-50 transition-colors border border-transparent group-hover:border-primary-100">
                                    <Building2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 leading-tight group-hover:text-primary-700 transition-colors line-clamp-1">{supplier.name}</h3>
                                    <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">{supplier.code}</span>
                                </div>
                            </div>
                            <span
                                className={clsx(
                                    "px-2.5 py-1 text-[10px] uppercase font-black tracking-widest rounded-md",
                                    supplier.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                )}
                            >
                                {supplier.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>

                        <div className="mt-6 space-y-3.5 flex-1">
                            {supplier.contact_name && (
                                <div className="flex items-center gap-3 text-sm group/item">
                                    <div className="h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover/item:bg-primary-50 group-hover/item:text-primary-500 transition-colors">
                                        <User className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="font-bold text-gray-700">{supplier.contact_name}</span>
                                </div>
                            )}
                            {supplier.email && (
                                <div className="flex items-center gap-3 text-sm group/item">
                                    <div className="h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover/item:bg-primary-50 group-hover/item:text-primary-500 transition-colors">
                                        <Mail className="h-3.5 w-3.5" />
                                    </div>
                                    <a href={`mailto:${supplier.email}`} className="font-medium text-gray-500 hover:text-primary-600 transition-colors truncate">{supplier.email}</a>
                                </div>
                            )}
                            {supplier.phone && (
                                <div className="flex items-center gap-3 text-sm group/item">
                                    <div className="h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover/item:bg-primary-50 group-hover/item:text-primary-500 transition-colors">
                                        <Phone className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="font-medium text-gray-500">{supplier.phone}</span>
                                </div>
                            )}
                            {supplier.city && (
                                <div className="flex items-center gap-3 text-sm group/item">
                                    <div className="h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover/item:bg-primary-50 group-hover/item:text-primary-500 transition-colors">
                                        <MapPin className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="font-medium text-gray-500 truncate">{supplier.city}, {supplier.country}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
                                {supplier.payment_terms ? (
                                    <>
                                        <Package className="h-3 w-3" />
                                        <span>{supplier.payment_terms}</span>
                                    </>
                                ) : (
                                    <span>Ver detalles</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => openModal(supplier)}
                                    className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                    title="Editar"
                                >
                                    <Edit className="h-4.5 w-4.5" />
                                </button>
                                <button 
                                    onClick={() => handleDeleteClick(supplier.id, supplier.name)}
                                    className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    title="Eliminar"
                                >
                                    <Trash2 className="h-4.5 w-4.5" />
                                </button>
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
                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        <Filter className="h-4 w-4" />
                        Filtrar
                        {(startDate || endDate || filterStatus !== 'all') && (
                            <span className="flex h-2 w-2 rounded-full bg-primary-600 animate-pulse" />
                        )}
                    </button>
                    <button 
                        onClick={() => openModal()}
                        className="btn btn-primary flex items-center gap-2 h-10 rounded-xl px-4 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-200"
                    >
                        <Plus className="h-5 w-5" />
                        <span className="hidden sm:inline">Nuevo Proveedor</span>
                    </button>
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
                        totalPages={data?.metadata.pages || 0}
                        onPageChange={setPage}
                        totalItems={data?.metadata.total}
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
                                    {editingSupplier ? 'Editar Proveedor' : 'Agregar nuevo Proveedor'}
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
                                <button onClick={() => setIsFiltersVisible(false)} className="text-gray-400 hover:text-gray-500 p-1 hover:bg-gray-50 rounded-lg">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="px-6 py-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 font-black">Estado</label>
                                        <select 
                                            className="input h-12 bg-gray-50 border-gray-100 rounded-xl text-sm font-medium focus:bg-white transition-all shadow-sm"
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
                                    <button 
                                        onClick={handleExportExcel}
                                        className="btn bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-emerald-200"
                                    >
                                        <FileDown className="h-5 w-5" />
                                        Exportar a Excel
                                    </button>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => {
                                                setSearch('')
                                                setFilterStatus('all')
                                                setStartDate('')
                                                setEndDate('')
                                                setIsFiltersVisible(false)
                                            }}
                                            className="btn border border-gray-200 text-gray-500 h-11 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50 shadow-sm"
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
        </div>
    )
}
