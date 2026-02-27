import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { Shield, Lock, Plus, X, Trash2, CheckSquare, Square, Edit, LayoutDashboard, Package, Layers, Truck, ClipboardList, ShoppingCart, History, Users as UsersIcon, Settings as SettingsIcon, BarChart3 } from 'lucide-react'
import type { Role, Permission } from '@/types'
import clsx from 'clsx'
import { usePermissions } from '@/hooks/usePermissions'

export default function Roles() {
    const queryClient = useQueryClient()
    const { hasPermission } = usePermissions()
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newRoleData, setNewRoleData] = useState({ name: '', description: '' })
    const [editingBasicInfo, setEditingBasicInfo] = useState(false)
    const [roleEditData, setRoleEditData] = useState({ name: '', description: '' })

    const { data: roles, isLoading: isLoadingRoles } = useQuery<Role[]>({
        queryKey: ['roles'],
        queryFn: async () => {
            const response = await api.get('/api/v1/roles/')
            return response.data
        },
    })

    const { data: permissions, isLoading: isLoadingPermissions } = useQuery<Permission[]>({
        queryKey: ['permissions'],
        queryFn: async () => {
            const response = await api.get('/api/v1/roles/permissions')
            return response.data
        },
    })

    const selectedRole = roles?.find(r => r.id === selectedRoleId)

    const updateRoleMutation = useMutation({
        mutationFn: ({ id, ...data }: { id: number, name?: string, description?: string, permission_ids?: number[] }) => 
            api.put(`/api/v1/roles/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] })
            toast.success('Permisos actualizados correctamente')
        },
        onError: (err: any) => {
            const detail = err.response?.data?.detail
            const message = typeof detail === 'string' 
                ? detail 
                : (Array.isArray(detail) ? detail[0]?.msg : 'Error al actualizar permisos')
            toast.error(message)
        }
    })

    const createRoleMutation = useMutation({
        mutationFn: (data: any) => api.post('/api/v1/roles/', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] })
            toast.success('Rol creado correctamente')
            setIsCreateModalOpen(false)
            setNewRoleData({ name: '', description: '' })
        },
        onError: (err: any) => {
            const detail = err.response?.data?.detail
            const message = typeof detail === 'string' 
                ? detail 
                : (Array.isArray(detail) ? detail[0]?.msg : 'Error al crear rol')
            toast.error(message)
        }
    })

    const deleteRoleMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/api/v1/roles/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] })
            toast.success('Rol eliminado')
            if (selectedRoleId === selectedRoleId) setSelectedRoleId(null)
        },
        onError: (err: any) => {
            const detail = err.response?.data?.detail
            const message = typeof detail === 'string' 
                ? detail 
                : (Array.isArray(detail) ? detail[0]?.msg : 'Error al eliminar rol')
            toast.error(message)
        }
    })

    const handleTogglePermission = (permissionId: number) => {
        if (!selectedRole) return
        
        const currentPerms = selectedRole.permissions.map(p => p.id)
        let newPerms: number[]
        
        if (currentPerms.includes(permissionId)) {
            newPerms = currentPerms.filter(id => id !== permissionId)
        } else {
            newPerms = [...currentPerms, permissionId]
        }
        
        updateRoleMutation.mutate({ id: selectedRole.id, permission_ids: newPerms })
    }

    const handleToggleModule = (modulePerms: Permission[]) => {
        if (!selectedRole) return
        
        const currentPermIds = selectedRole.permissions.map(p => p.id)
        const modulePermIds = modulePerms.map(p => p.id)
        const allPresent = modulePermIds.every(id => currentPermIds.includes(id))
        
        let newPerms: number[]
        if (allPresent) {
            // Uncheck all in module
            newPerms = currentPermIds.filter(id => !modulePermIds.includes(id))
        } else {
            // Check all in module
            newPerms = Array.from(new Set([...currentPermIds, ...modulePermIds]))
        }
        
        updateRoleMutation.mutate({ id: selectedRole.id, permission_ids: newPerms })
    }

    const handleSaveBasicInfo = () => {
        if (!selectedRole) return
        updateRoleMutation.mutate({ 
            id: selectedRole.id, 
            name: roleEditData.name, 
            description: roleEditData.description 
        }, {
            onSuccess: () => setEditingBasicInfo(false)
        })
    }

    const startEditing = () => {
        if (!selectedRole) return
        setRoleEditData({ name: selectedRole.name, description: selectedRole.description || '' })
        setEditingBasicInfo(true)
    }

    const getModuleConfig = (module: string) => {
        switch(module) {
            case 'dashboard': return { icon: <LayoutDashboard className="h-5 w-5" />, name: 'Dashboard', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', shadow: 'shadow-blue-50' };
            case 'products': return { icon: <Package className="h-5 w-5" />, name: 'Productos', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', shadow: 'shadow-orange-50' };
            case 'categories': return { icon: <Layers className="h-5 w-5" />, name: 'Categorías', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', shadow: 'shadow-amber-50' };
            case 'suppliers': return { icon: <Truck className="h-5 w-5" />, name: 'Proveedores', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', shadow: 'shadow-indigo-50' };
            case 'inventory': return { icon: <ClipboardList className="h-5 w-5" />, name: 'Inventario', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', shadow: 'shadow-rose-50' };
            case 'sales': return { icon: <ShoppingCart className="h-5 w-5" />, name: 'Ventas (POS)', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', shadow: 'shadow-emerald-50' };
            case 'sales_history': return { icon: <History className="h-5 w-5" />, name: 'Historial Ventas', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100', shadow: 'shadow-cyan-50' };
            case 'users': return { icon: <UsersIcon className="h-5 w-5" />, name: 'Usuarios', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', shadow: 'shadow-purple-50' };
            case 'roles_permissions': return { icon: <Shield className="h-5 w-5" />, name: 'Roles y Permisos', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', shadow: 'shadow-blue-100' };
            case 'settings': return { icon: <SettingsIcon className="h-5 w-5" />, name: 'Configuración', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100', shadow: 'shadow-gray-50' };
            case 'reports': return { icon: <BarChart3 className="h-5 w-5" />, name: 'Reportes', color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100', shadow: 'shadow-pink-50' };
            default: return { icon: <Shield className="h-5 w-5" />, name: module, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100', shadow: 'shadow-gray-50' };
        }
    }

    const groupedPermissions = permissions?.reduce((acc, perm) => {
        if (!acc[perm.module]) acc[perm.module] = []
        acc[perm.module].push(perm)
        return acc
    }, {} as Record<string, Permission[]>)

    if (isLoadingRoles || isLoadingPermissions) {
        return <div className="flex h-96 items-center justify-center">Cargando...</div>
    }

    if (!hasPermission('roles:manage')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Shield className="h-16 w-16 text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Acceso Denegado</h2>
                <p className="text-gray-500 mt-2">No tienes permisos para gestionar roles y permisos.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Roles y Permisos</h1>
                    <p className="text-sm text-gray-600">Configura qué puede ver y hacer cada tipo de usuario</p>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo Rol
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Lista de Roles */}
                <div className="lg:col-span-1 space-y-3">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-2">Tipos de Usuario</h2>
                    {roles?.map(role => (
                        <div 
                            key={role.id}
                            onClick={() => setSelectedRoleId(role.id)}
                            className={clsx(
                                "p-4 rounded-xl cursor-pointer transition-all border flex items-center justify-between group",
                                selectedRoleId === role.id 
                                    ? "bg-primary-50 border-primary-200 text-primary-700 shadow-sm" 
                                    : "bg-white border-gray-100 text-gray-700 hover:bg-gray-50"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Shield className={clsx("h-5 w-5", selectedRoleId === role.id ? "text-primary-600" : "text-gray-400")} />
                                <div>
                                    <p className="font-bold text-sm">{role.name}</p>
                                    <p className="text-[10px] opacity-70">{role.permissions.length} permisos</p>
                                </div>
                            </div>
                            {selectedRoleId === role.id && (
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        const msg = role.is_system 
                                            ? '¡CUIDADO! Este es un ROL DEL SISTEMA. Si lo eliminas, los usuarios que lo tengan asignado podrían tener problemas. ¿Estás SEGURO de querer borrarlo?' 
                                            : '¿Estás seguro de que quieres eliminar este tipo de usuario?';
                                        if(confirm(msg)) deleteRoleMutation.mutate(role.id);
                                    }}
                                    className="p-1 hover:bg-red-100 text-red-500 rounded-lg"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Grid de Permisos */}
                <div className="lg:col-span-3">
                    {selectedRole ? (
                        <div className="card bg-white p-6 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between border-b pb-4">
                                {editingBasicInfo ? (
                                    <div className="flex-1 space-y-3 mr-4">
                                        <input 
                                            className="input text-lg font-bold py-1"
                                            value={roleEditData.name}
                                            onChange={e => setRoleEditData({...roleEditData, name: e.target.value})}
                                            autoFocus
                                        />
                                        <input 
                                            className="input text-sm py-1"
                                            value={roleEditData.description}
                                            onChange={e => setRoleEditData({...roleEditData, description: e.target.value})}
                                            placeholder="Añade una descripción..."
                                        />
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={handleSaveBasicInfo}
                                                className="btn btn-primary btn-sm"
                                                disabled={updateRoleMutation.isPending}
                                            >
                                                {updateRoleMutation.isPending ? 'Guardando...' : 'Guardar'}
                                            </button>
                                            <button 
                                                onClick={() => setEditingBasicInfo(false)}
                                                className="btn btn-secondary btn-sm"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="group cursor-pointer" onClick={startEditing}>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-2xl font-extrabold text-gray-900 group-hover:text-primary-600 transition-colors">
                                                {selectedRole.name}
                                            </h3>
                                            <div className="p-1.5 bg-gray-50 text-gray-400 group-hover:text-primary-600 group-hover:bg-primary-50 rounded-lg transition-all">
                                                <Edit className="h-4 w-4" />
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{selectedRole.description || 'Sin descripción'}</p>
                                    </div>
                                )}
                                {selectedRole.is_system && (
                                    <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                                        <Lock className="h-3 w-3" />Rol del Sistema
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between bg-primary-50/30 p-4 rounded-2xl border border-primary-100/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-100 text-primary-600 rounded-xl">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 text-left">Configuración de Privilegios</h4>
                                        <p className="text-[11px] text-gray-500">Marca los módulos independientes para dar acceso</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleToggleModule(permissions || [])}
                                        className="btn bg-white text-primary-600 text-xs py-1.5 border border-primary-100 hover:bg-primary-50 active:scale-95 transition-all"
                                    >
                                        Marcar todo el sistema
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {groupedPermissions && Object.entries(groupedPermissions).map(([module, perms]) => {
                                    const config = getModuleConfig(module)
                                    const currentPermIds = selectedRole.permissions.map(p => p.id)
                                    const allChecked = perms.every(p => currentPermIds.includes(p.id))

                                    return (
                                        <div 
                                            key={module} 
                                            className={clsx(
                                                "group border rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white",
                                                allChecked ? config.border : "border-gray-100",
                                                allChecked && config.shadow
                                            )}
                                        >
                                            <div className={clsx(
                                                "px-5 py-4 border-b border-gray-100 flex items-center justify-between",
                                                config.bg
                                            )}>
                                                <div className="flex items-center gap-3">
                                                    <div className={clsx("p-2 rounded-xl bg-white shadow-sm", config.color)}>
                                                        {config.icon}
                                                    </div>
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-700">
                                                        {config.name}
                                                    </h4>
                                                </div>
                                                <div 
                                                    className="cursor-pointer active:scale-90 transition-transform"
                                                    onClick={() => handleToggleModule(perms)}
                                                >
                                                    {allChecked ? (
                                                        <div className="p-1 bg-emerald-500 text-white rounded-full">
                                                            <CheckSquare className="h-3 w-3" />
                                                        </div>
                                                    ) : (
                                                        <div className="p-1 bg-white border border-gray-200 text-gray-300 rounded-full hover:border-primary-400">
                                                            <Square className="h-3 w-3" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-5 space-y-3 bg-white">
                                                {perms.sort((a, b) => {
                                                    // Ordenar: Ver > Crear > Editar > Eliminar > Otros
                                                    const order = { 'view': 1, 'create': 2, 'edit': 3, 'manage': 4, 'delete': 5 };
                                                    const getOrder = (codename: string) => {
                                                        const suffix = codename.split(':')[1];
                                                        return order[suffix as keyof typeof order] || 99;
                                                    };
                                                    return getOrder(a.codename) - getOrder(b.codename);
                                                }).map(perm => {
                                                    const isChecked = currentPermIds.includes(perm.id)
                                                    return (
                                                        <div 
                                                            key={perm.id}
                                                            onClick={() => handleTogglePermission(perm.id)}
                                                            className={clsx(
                                                                "flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer group/item",
                                                                isChecked 
                                                                    ? "bg-primary-50/50" 
                                                                    : "hover:bg-gray-50 bg-gray-50/20 shadow-inner border border-gray-100/50"
                                                            )}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className={clsx(
                                                                    "text-sm font-bold transition-colors",
                                                                    isChecked ? "text-primary-700" : "text-gray-500"
                                                                )}>
                                                                    {perm.name}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400 font-mono uppercase">
                                                                    {perm.codename.split(':')[1]}
                                                                </span>
                                                            </div>
                                                            
                                                            {/* Switch de Prender/Apagar */}
                                                            <div className={clsx(
                                                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none",
                                                                isChecked ? "bg-primary-600" : "bg-gray-200"
                                                            )}>
                                                                <span
                                                                    className={clsx(
                                                                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200",
                                                                        isChecked ? "translate-x-6" : "translate-x-1"
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="h-96 bg-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-gray-400 gap-4">
                            <Shield className="h-12 w-12 opacity-20" />
                            <p className="font-medium">Selecciona un tipo de usuario para configurar sus permisos</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Crear Rol */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-gray-900/60 transition-opacity" onClick={() => setIsCreateModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Crear Nuevo Tipo de Usuario</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Nombre del Rol</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: Vigilante, Supervisor..."
                                    className="input focus:ring-primary-500"
                                    value={newRoleData.name}
                                    onChange={e => setNewRoleData({...newRoleData, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Descripción</label>
                                <textarea 
                                    className="input min-h-[100px] py-3 focus:ring-primary-500"
                                    placeholder="¿Qué funciones cumple este rol?"
                                    value={newRoleData.description}
                                    onChange={e => setNewRoleData({...newRoleData, description: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setIsCreateModalOpen(false)} className="btn border border-gray-200 flex-1">Cancelar</button>
                                <button 
                                    onClick={() => createRoleMutation.mutate(newRoleData)}
                                    className="btn btn-primary flex-1"
                                    disabled={!newRoleData.name}
                                >
                                    Crear Rol
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
