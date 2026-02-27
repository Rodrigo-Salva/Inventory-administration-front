import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { FolderTree, Plus, Edit, Trash2, X, AlertTriangle, Layers, Info, FileDown, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import type { Category, PaginatedResponse } from '@/types'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import Pagination from '@/components/common/Pagination'
import DateRangePicker from '@/components/common/DateRangePicker'
import { usePermissions } from '@/hooks/usePermissions'
import { Shield } from 'lucide-react'

export default function Categories() {
    const [page, setPage] = useState(1)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [isFiltersVisible, setIsFiltersVisible] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        parent_id: '',
        is_active: true
    })

    // Modal de confirmación de eliminación
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<{ id: number, name: string } | null>(null)

    // Resetear búsqueda cuando cambia el filtro de estado o página
    useEffect(() => {
        setPage(1)
    }, [search, filterStatus, startDate, endDate])

    const queryClient = useQueryClient()
    const { hasPermission } = usePermissions()

    // 1. Cargar árbol de categorías (con filtro de estado y fecha)
    const { data: tree, isLoading: isLoadingTree } = useQuery<Category[]>({
        queryKey: ['categories-tree', filterStatus, startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (filterStatus !== 'all') params.append('is_active', filterStatus === 'active' ? 'true' : 'false')
            if (startDate) params.append('start_date', startDate)
            if (endDate) params.append('end_date', endDate)
            const response = await api.get(`/api/v1/categories/tree?${params.toString()}`)
            return response.data
        },
    })

    // 2. Búsqueda de categorías (lista plana)
    const { data: searchResults, isLoading: isLoadingSearch } = useQuery<PaginatedResponse<Category>>({
        queryKey: ['categories-search', search, filterStatus, page, startDate, endDate],
        enabled: search.length > 0,
        queryFn: async () => {
            const params = new URLSearchParams({
                search,
                page: page.toString(),
                size: '10',
                ...(filterStatus !== 'all' && { is_active: (filterStatus === 'active' ? 'true' : 'false') }),
                ...(startDate && { start_date: startDate }),
                ...(endDate && { end_date: endDate }),
            })
            const response = await api.get(`/api/v1/categories/?${params.toString()}`)
            return response.data
        },
    })

    // 2. Cargar lista plana para el selector de padres
    const { data: flatCategories } = useQuery<Category[]>({
        queryKey: ['categories-flat'],
        queryFn: async () => {
            const response = await api.get('/api/v1/categories/')
            return response.data.items
        },
    })

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/api/v1/categories/', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories-tree'] })
            queryClient.invalidateQueries({ queryKey: ['categories-flat'] })
            toast.success('Categoría creada')
            closeModal()
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al crear'),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/api/v1/categories/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories-tree'] })
            queryClient.invalidateQueries({ queryKey: ['categories-flat'] })
            toast.success('Categoría actualizada')
            closeModal()
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al actualizar'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/api/v1/categories/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories-tree'] })
            queryClient.invalidateQueries({ queryKey: ['categories-flat'] })
            toast.success('Categoría eliminada')
        },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Error al eliminar (puede tener subcategorías)'),
    })

    const openModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category)
            setFormData({
                name: category.name,
                code: category.code,
                description: category.description || '',
                parent_id: category.parent_id?.toString() || '',
                is_active: category.is_active
            })
        } else {
            setEditingCategory(null)
            setFormData({
                name: '',
                code: '',
                description: '',
                parent_id: '',
                is_active: true
            })
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingCategory(null)
        setFormData({ name: '', code: '', description: '', parent_id: '', is_active: true })
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
            const response = await api.get(`/api/v1/reports/categories-excel?${params}`, {
                responseType: 'blob'
            })
            
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `Categorias_${new Date().toISOString().split('T')[0]}.xlsx`)
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
        const data = {
            ...formData,
            parent_id: formData.parent_id ? parseInt(formData.parent_id) : null
        }
        
        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory.id, data })
        } else {
            createMutation.mutate(data)
        }
    }

    const handleDeleteClick = (id: number, name: string) => {
        setCategoryToDelete({ id, name })
        setIsDeleteModalOpen(true)
    }

    const confirmDelete = () => {
        if (categoryToDelete) {
            deleteMutation.mutate(categoryToDelete.id)
            setIsDeleteModalOpen(false)
        }
    }

    if (!hasPermission('categories:view')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Shield className="h-16 w-16 text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Acceso Denegado</h2>
                <p className="text-gray-500 mt-2">No tienes permisos para ver las categorías.</p>
            </div>
        )
    }

    const renderCategory = (category: Category, level = 0) => (
        <div key={category.id} className={`${level > 0 ? 'ml-8 mt-3' : 'mt-4'}`}>
            <div className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl group hover:border-primary-200 hover:shadow-md transition-all">
                <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gray-50 flex items-center justify-center text-primary-500 group-hover:bg-primary-50 transition-colors">
                    <Layers className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors">{category.name}</span>
                        <span className="text-[10px] font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-400 uppercase tracking-widest">{category.code}</span>
                    </div>
                    {category.description && (
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1 italic">{category.description}</p>
                    )}
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {hasPermission('categories:edit') && (
                        <button 
                            onClick={() => openModal(category)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                    )}
                    {hasPermission('categories:delete') && (
                        <button 
                            onClick={() => handleDeleteClick(category.id, category.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Eliminar"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <span
                    className={clsx(
                        "px-2.5 py-1 text-[10px] uppercase font-black tracking-widest rounded-md",
                        category.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    )}
                >
                    {category.is_active ? 'Activa' : 'Inactiva'}
                </span>
            </div>
            {category.children && category.children.length > 0 && (
                <div className="mt-2 border-l-2 border-gray-50 ml-5 pl-2">
                    {category.children.map((child) => renderCategory(child, level + 1))}
                </div>
            )}
        </div>
    )

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">Categorías</h1>
                    <p className="mt-1 text-sm text-gray-500 font-medium italic">Estructura jerárquica de tu inventario</p>
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
                    {hasPermission('categories:create') && (
                        <button 
                            onClick={() => openModal()}
                            className="btn btn-primary flex items-center gap-2 h-10 rounded-xl px-4 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-200"
                        >
                            <Plus className="h-5 w-5" />
                            <span className="hidden sm:inline">Nueva Categoría</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="relative">
                <FolderTree className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar categorías por nombre o código..."
                    className="input pl-12 h-12 text-base bg-white border-gray-100 shadow-xl shadow-gray-200/50 rounded-2xl focus:ring-primary-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>


            {search.length > 0 ? (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <Info className="h-4 w-4 text-primary-500" />
                        Mostrando {searchResults?.metadata?.total || 0} resultados para "<span className="font-bold text-gray-900">{search}</span>"
                    </div>
                    
                    {isLoadingSearch ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                            <p className="mt-4 text-sm text-gray-400 font-bold uppercase tracking-widest">Buscando categorías...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {searchResults?.items.map((cat) => renderCategory(cat))}
                        </div>
                    )}
                    
                    {searchResults && (searchResults.metadata?.pages || 0) > 1 && (
                        <div className="pt-4">
                            <Pagination 
                                currentPage={page}
                                totalPages={searchResults.metadata?.pages || 0}
                                onPageChange={setPage}
                                totalItems={searchResults.metadata?.total}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Estructura de Árbol</h2>
                        {tree && tree.length > 0 && (
                            <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                                {tree.length} Raíces encontradas
                            </span>
                        )}
                    </div>
                    {isLoadingTree ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                            <p className="mt-4 text-sm text-gray-400 font-bold uppercase tracking-widest">Cargando árbol...</p>
                        </div>
                    ) : tree && tree.length > 0 ? (
                        <div className="animate-in fade-in duration-500">
                            {tree.map((cat) => renderCategory(cat))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <FolderTree className="h-16 w-16 text-gray-200 mx-auto" />
                            <p className="mt-4 text-gray-400 font-bold px-4">No se encontraron categorías con los filtros actuales</p>
                            <button onClick={() => openModal()} className="mt-4 text-primary-600 font-black text-sm uppercase tracking-widest hover:underline">
                                Crear mi primera categoría
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de Confirmación */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="¿Eliminar Categoría?"
                message={`¿Estás seguro de que deseas eliminar "${categoryToDelete?.name}"? Esta acción no se puede deshacer si tiene subcategorías o productos vinculados.`}
                confirmText="Eliminar Categoría"
                type="danger"
            />

            {/* Modal de Formulario */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={closeModal} />
                        <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
                        <div className="inline-block transform overflow-hidden rounded-2xl bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <FolderTree className="h-6 w-6 text-primary-600" />
                                    {editingCategory ? 'Editar Categoría' : 'Agregar nueva Categoría'}
                                </h3>
                                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700">Nombre</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Ej: Electrónica, Muebles..."
                                                className="input mt-1.5 focus:ring-2 focus:ring-primary-500"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700">Código</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="ELEC-01"
                                                className="input mt-1.5 font-mono text-sm"
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700">Categoría Padre</label>
                                            <select
                                                className="input mt-1.5"
                                                value={formData.parent_id}
                                                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                                            >
                                                <option value="">Ninguna (Raíz)</option>
                                                {flatCategories
                                                    ?.filter(c => c.id !== editingCategory?.id) // Evitar seleccionarse a sí mismo
                                                    .map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700">Descripción</label>
                                        <textarea
                                            className="input mt-1.5 h-24 resize-none"
                                            placeholder="Detalles opcionales sobre esta categoría..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-700">Estado de la categoría</span>
                                            {formData.is_active ? (
                                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">ACTIVA</span>
                                            ) : (
                                                <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">INACTIVA</span>
                                            )}
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                        </label>
                                    </div>

                                    {editingCategory && (
                                        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                                            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                                            <p className="text-xs text-amber-700 leading-tight">
                                                Si cambias el padre o el estado, afectará a todas las subcategorías y productos asociados a este nivel.
                                            </p>
                                        </div>
                                    )}

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            className="btn btn-secondary flex-1 font-semibold"
                                            onClick={closeModal}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary flex-1 font-semibold"
                                            disabled={createMutation.isPending || updateMutation.isPending}
                                        >
                                            {createMutation.isPending || updateMutation.isPending 
                                                ? 'Procesando...' 
                                                : (editingCategory ? 'Actualizar' : 'Crear Categoría')}
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
                                            <option value="active">Solo Activas</option>
                                            <option value="inactive">Solo Inactivas</option>
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
                                    {hasPermission('products:download') && ( // Usamos products:download ya que el permiso de reporte es general
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
