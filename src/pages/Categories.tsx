import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { FolderTree, Plus, Edit, Trash2, X, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Category } from '@/types'

export default function Categories() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        parent_id: '',
        is_active: true
    })

    const queryClient = useQueryClient()

    // 1. Cargar árbol de categorías
    const { data: tree, isLoading } = useQuery<Category[]>({
        queryKey: ['categories-tree'],
        queryFn: async () => {
            const response = await api.get('/api/v1/categories/tree')
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

    const handleDelete = (id: number, name: string) => {
        if (confirm(`¿Eliminar categoría "${name}"? No podrá eliminarse si tiene subcategorías.`)) {
            deleteMutation.mutate(id)
        }
    }

    const renderCategory = (category: Category, level = 0) => (
        <div key={category.id} className={`${level > 0 ? 'ml-6 mt-2' : 'mt-2'}`}>
            <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg group hover:border-primary-300 hover:shadow-sm transition-all">
                <FolderTree className="h-5 w-5 text-primary-500" />
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{category.name}</span>
                        <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{category.code}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => openModal(category)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Editar"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button 
                        onClick={() => handleDelete(category.id, category.name)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>

                <span
                    className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full ${category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}
                >
                    {category.is_active ? 'Activa' : 'Inactiva'}
                </span>
            </div>
            {category.children && category.children.length > 0 && (
                <div className="mt-2 border-l-2 border-gray-100 ml-2 pl-2">
                    {category.children.map((child) => renderCategory(child, level + 1))}
                </div>
            )}
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
                    <p className="mt-1 text-sm text-gray-600">Organización jerárquica de productos</p>
                </div>
                <button 
                    onClick={() => openModal()}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Nueva Categoría
                </button>
            </div>

            <div className="card border-none shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                        <p className="mt-2 text-sm text-gray-600 font-medium">Cargando jerarquía...</p>
                    </div>
                ) : (
                    <div className="space-y-1 p-4">
                        {tree && tree.length > 0 ? (
                            tree.map((category) => renderCategory(category))
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                <FolderTree className="h-12 w-12 text-gray-300 mx-auto" />
                                <p className="mt-2 text-gray-500">No hay categorías registradas</p>
                                <button onClick={() => openModal()} className="mt-4 text-primary-600 font-semibold hover:underline">
                                    Crea la primera categoría
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
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
                                    {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
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
        </div>
    )
}
