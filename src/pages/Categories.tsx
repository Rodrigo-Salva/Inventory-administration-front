import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { FolderTree } from 'lucide-react'
import type { Category } from '@/types'

export default function Categories() {
    const { data: categories, isLoading } = useQuery<Category[]>({
        queryKey: ['categories-tree'],
        queryFn: async () => {
            const response = await api.get('/api/v1/categories/tree')
            return response.data
        },
    })

    const renderCategory = (category: Category, level = 0) => (
        <div key={category.id} className={`${level > 0 ? 'ml-6 mt-2' : 'mt-2'}`}>
            <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                <FolderTree className="h-5 w-5 text-primary-600" />
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{category.name}</span>
                        <span className="text-xs text-gray-500">({category.code})</span>
                    </div>
                    {category.description && (
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    )}
                </div>
                <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                >
                    {category.is_active ? 'Activa' : 'Inactiva'}
                </span>
            </div>
            {category.children && category.children.length > 0 && (
                <div className="mt-2">
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
            </div>

            <div className="card">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                        <p className="mt-2 text-sm text-gray-600">Cargando categorías...</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {categories?.map((category) => renderCategory(category))}
                    </div>
                )}
            </div>
        </div>
    )
}
