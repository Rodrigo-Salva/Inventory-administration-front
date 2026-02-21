import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Shield, User as UserIcon, X } from 'lucide-react'
import type { User } from '@/types'

export default function Users() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        is_admin: false,
        is_active: true
    })

    const queryClient = useQueryClient()

    const { data: users, isLoading } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await api.get('/api/v1/users')
            return response.data
        },
    })

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/api/v1/users', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            toast.success('Usuario creado')
            closeModal()
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Error al crear usuario')
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
            toast.error(err.response?.data?.detail || 'Error al actualizar usuario')
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/api/v1/users/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            toast.success('Usuario eliminado')
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Error al eliminar usuario')
        },
    })

    const openModal = (user?: User) => {
        if (user) {
            setEditingUser(user)
            setFormData({
                email: user.email,
                password: '',
                is_admin: user.is_admin,
                is_active: user.is_active
            })
        } else {
            setEditingUser(null)
            setFormData({
                email: '',
                password: '',
                is_admin: false,
                is_active: true
            })
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingUser(null)
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
                    <p className="mt-1 text-sm text-gray-600">Gestión de acceso de tu equipo</p>
                </div>
                <button 
                    onClick={() => openModal()}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Nuevo Usuario
                </button>
            </div>

            <div className="card">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                        <p className="mt-2 text-sm text-gray-600">Cargando usuarios...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
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
                                {users?.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                        <UserIcon className="h-6 w-6 text-primary-600" />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                {user.is_admin ? (
                                                    <><Shield className="h-4 w-4 text-primary-600" /><span className="text-sm text-gray-900 font-medium">Admin</span></>
                                                ) : (
                                                    <span className="text-sm text-gray-600">Operador</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {user.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => openModal(user)}
                                                className="text-primary-600 hover:text-primary-900 mr-3"
                                            >
                                                <Edit className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id, user.email)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                                    {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
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
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                checked={formData.is_admin}
                                                onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                                            />
                                            <span className="text-sm text-gray-700">Es Administrador</span>
                                        </label>
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
        </div>
    )
}
