import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Shield, User as UserIcon, X, FileDown, Filter, Search } from 'lucide-react'
import type { User, PaginatedResponse, UserRole, Role } from '@/types'
import Pagination from '@/components/common/Pagination'
import DateRangePicker from '@/components/common/DateRangePicker'
import clsx from 'clsx'
import { useEffect } from 'react'
import { usePermissions } from '@/hooks/usePermissions'

export default function Users() {
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [isFiltersVisible, setIsFiltersVisible] = useState(false)
    const [page, setPage] = useState(1)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        is_admin: false,
        role: 'SELLER' as UserRole,
        role_id: undefined as number | undefined,
        is_active: true
    })

    const queryClient = useQueryClient()
    const { hasPermission } = usePermissions()

    const { data: roles } = useQuery<Role[]>({
        queryKey: ['roles'],
        queryFn: async () => {
            const response = await api.get('/api/v1/roles/')
            return response.data
        }
    })

    const { data: usersData, isLoading } = useQuery<PaginatedResponse<User>>({
        queryKey: ['users', page, search, filterStatus, startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                size: '10',
                ...(search && { search }),
                ...(filterStatus !== 'all' && { is_active: (filterStatus === 'active' ? 'true' : 'false') }),
                ...(startDate && { start_date: startDate }),
                ...(endDate && { end_date: endDate }),
            })
            const response = await api.get(`/api/v1/users/?${params.toString()}`)
            return response.data
        },
    })

    // Resetear a la página 1 cuando cambian los filtros
    useEffect(() => {
        setPage(1)
    }, [search, filterStatus, startDate, endDate])

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/api/v1/users', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            toast.success('Usuario creado')
            closeModal()
        },
        onError: (err: any) => {
            const detail = err.response?.data?.detail
            const message = typeof detail === 'string' 
                ? detail 
                : (Array.isArray(detail) ? detail[0]?.msg : 'Error al crear usuario')
            toast.error(message)
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/api/v1/users/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            toast.success('Usuario actualizado')
            closeModal()
        },
        onError: (err: any) => {
            const detail = err.response?.data?.detail
            const message = typeof detail === 'string' 
                ? detail 
                : (Array.isArray(detail) ? detail[0]?.msg : 'Error al actualizar usuario')
            toast.error(message)
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/api/v1/users/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            toast.success('Usuario eliminado')
        },
        onError: (err: any) => {
            const detail = err.response?.data?.detail
            const message = typeof detail === 'string' 
                ? detail 
                : (Array.isArray(detail) ? detail[0]?.msg : 'Error al eliminar usuario')
            toast.error(message)
        },
    })

    const openModal = (user?: User) => {
        if (user) {
            setEditingUser(user)
            setFormData({
                email: user.email,
                password: '',
                is_admin: user.is_admin,
                role: user.role,
                role_id: user.role_id,
                is_active: user.is_active
            })
        } else {
            setEditingUser(null)
            setFormData({
                email: '',
                password: '',
                is_admin: false,
                role: 'SELLER' as UserRole,
                role_id: undefined,
                is_active: true
            })
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingUser(null)
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
            const response = await api.get(`/api/v1/reports/users-excel?${params}`, {
                responseType: 'blob'
            })
            
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `Usuarios_${new Date().toISOString().split('T')[0]}.xlsx`)
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
        if (editingUser) {
            const { password, ...rest } = formData
            const data = password ? formData : rest
            updateMutation.mutate({ id: editingUser.id, data })
        } else {
            createMutation.mutate(formData)
        }
    }

    const handleDelete = (id: number, email: string) => {
        if (confirm(`¿Eliminar usuario "${email}"?`)) {
            deleteMutation.mutate(id)
        }
    }

    if (!hasPermission('users:view')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Shield className="h-16 w-16 text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Acceso Denegado</h2>
                <p className="text-gray-500 mt-2">No tienes permisos para ver los usuarios.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
                    <p className="mt-1 text-sm text-gray-600">Gestión de acceso de tu equipo</p>
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
                    {hasPermission('users:create') && (
                        <button 
                            onClick={() => openModal()}
                            className="btn btn-primary flex items-center gap-2 h-10 rounded-xl"
                        >
                            <Plus className="h-5 w-5" />
                            <span className="hidden sm:inline">Nuevo Usuario</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por email..."
                    className="input pl-12 h-12 text-base bg-white border-gray-100 shadow-xl shadow-gray-200/50 rounded-2xl focus:ring-primary-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="card overflow-hidden border-none shadow-xl shadow-gray-200/50">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                        <p className="mt-2 text-sm text-gray-600">Cargando usuarios...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {/* Tabla (Desktop) */}
                        <table className="min-w-full divide-y divide-gray-200 hidden lg:table">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Registro</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {usersData?.items.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center border border-primary-100">
                                                        <UserIcon className="h-5 w-5 text-primary-600" />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    {user.role_obj ? (
                                                        <span className="text-sm text-primary-700 font-bold">{user.role_obj.name}</span>
                                                    ) : (
                                                        <>
                                                            {user.role === 'SUPERADMIN' && <><Shield className="h-4 w-4 text-purple-600" /><span className="text-sm text-purple-700 font-bold">Super Admin</span></>}
                                                            {user.role === 'ADMIN' && <><Shield className="h-4 w-4 text-primary-600" /><span className="text-sm text-primary-700 font-bold">Admin</span></>}
                                                            {user.role === 'MANAGER' && <><UserIcon className="h-4 w-4 text-blue-600" /><span className="text-sm text-blue-700 font-bold">Manager</span></>}
                                                            {user.role === 'SELLER' && <><UserIcon className="h-4 w-4 text-gray-500" /><span className="text-sm text-gray-600">Vendedor</span></>}
                                                            {!user.role && (user.is_admin ? <span className="text-sm text-primary-700 font-bold">Admin</span> : <span className="text-sm text-gray-600">Operador</span>)}
                                                        </>
                                                    )}
                                                </div>
                                                {user.is_admin && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN' && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary-100 text-primary-800 w-fit">
                                                        Admin Sist.
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={clsx(
                                                "px-2.5 py-1 text-[10px] uppercase font-black tracking-widest rounded-md",
                                                user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                            )}>
                                                {user.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-1">
                                                {hasPermission('users:edit') && (
                                                    <button 
                                                        onClick={() => openModal(user)}
                                                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit className="h-5 w-5" />
                                                    </button>
                                                )}
                                                {hasPermission('users:delete') && (
                                                    <button
                                                        onClick={() => handleDelete(user.id, user.email)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

                        {/* Tarjetas (Móvil) */}
                        <div className="lg:hidden space-y-4 p-1">
                            {usersData?.items.map((user) => (
                                <div key={user.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center border border-primary-100">
                                                <UserIcon className="h-5 w-5 text-primary-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">{user.email}</div>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    {user.role === 'SUPERADMIN' && <><Shield className="h-3 w-3 text-purple-600" /><span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">Super Admin</span></>}
                                                    {user.role === 'ADMIN' && <><Shield className="h-3 w-3 text-primary-600" /><span className="text-[10px] text-primary-700 font-bold uppercase tracking-wider">Admin</span></>}
                                                    {user.role === 'MANAGER' && <><UserIcon className="h-3 w-3 text-blue-600" /><span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">Manager</span></>}
                                                    {user.role === 'SELLER' && <><UserIcon className="h-3 w-3 text-gray-500" /><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Vendedor</span></>}
                                                    {!user.role && (user.is_admin ? <span className="text-sm text-primary-700 font-bold">Admin</span> : <span className="text-sm text-gray-600">Operador</span>)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={clsx(
                                                "px-2 py-0.5 text-[10px] uppercase font-black tracking-widest rounded-md",
                                                user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                            )}>
                                                {user.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                            <p className="text-[10px] text-gray-400 mt-1 font-bold">{new Date(user.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-3 border-t border-gray-50 justify-end">
                                        {hasPermission('users:edit') && (
                                            <button 
                                                onClick={() => openModal(user)}
                                                className="px-4 py-2 text-sm font-bold text-primary-600 bg-primary-50 rounded-xl flex-1 max-w-[120px] text-center"
                                            >
                                                Editar
                                            </button>
                                        )}
                                        {hasPermission('users:delete') && (
                                            <button 
                                                onClick={() => handleDelete(user.id, user.email)}
                                                className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 rounded-xl flex-1 max-w-[120px] text-center"
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Pagination 
                            currentPage={page}
                            totalPages={usersData?.metadata?.pages || 0}
                            onPageChange={setPage}
                            totalItems={usersData?.metadata?.total}
                        />
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeModal} />
                        <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
                        <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">
                                    {editingUser ? 'Editar Usuario' : 'Agregar nuevo Usuario'}
                                </h3>
                                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                        <input
                                            type="email"
                                            required
                                            className="input mt-1"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Contraseña {editingUser && '(dejar en blanco para no cambiar)'}
                                        </label>
                                        <input
                                            type="password"
                                            required={!editingUser}
                                            className="input mt-1"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Tipo de Usuario (Rol)</label>
                                            <select
                                                className="input mt-1"
                                                value={formData.role_id || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value
                                                    if (!val) return;
                                                    const selectedRole = roles?.find(r => r.id === Number(val))
                                                    setFormData({ 
                                                        ...formData, 
                                                        role_id: Number(val), 
                                                        is_admin: selectedRole?.name.toUpperCase().includes('ADMIN') || false,
                                                        role: 'SELLER' // Valor por defecto para compatibilidad backend
                                                    })
                                                }}
                                            >
                                                <option value="">Seleccionar Tipo de Usuario...</option>
                                                {roles?.map(role => (
                                                    <option key={role.id} value={role.id}>{role.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Estado</label>
                                            <div className="flex items-center mt-3 gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                        checked={formData.is_active}
                                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                    />
                                                    <span className="text-sm text-gray-700">Activo</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 sm:mt-6 flex gap-3">
                                        <button
                                            type="button"
                                            className="btn btn-secondary flex-1"
                                            onClick={closeModal}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary flex-1"
                                            disabled={createMutation.isPending || updateMutation.isPending}
                                        >
                                            {editingUser ? 'Actualizar' : 'Crear'}
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
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Estado de Usuario</label>
                                    <select 
                                        className="input h-12 bg-gray-50 border-gray-100 rounded-xl text-sm font-medium focus:bg-white transition-all"
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value as any)}
                                    >
                                        <option value="all">Todos los estados</option>
                                        <option value="active">Solo Activos</option>
                                        <option value="inactive">Solo Inactivos</option>
                                    </select>
                                </div>

                                <DateRangePicker 
                                    startDate={startDate} 
                                    endDate={endDate} 
                                    onChange={({start, end}) => {
                                        setStartDate(start)
                                        setEndDate(end)
                                    }} 
                                />

                                <div className="pt-6 border-t border-gray-50 flex flex-col gap-3">
                                    {hasPermission('reports:view') && (
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
                                            className="btn border border-gray-200 text-gray-500 h-11 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50"
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
