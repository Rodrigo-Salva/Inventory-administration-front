import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { Package, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react'

export default function Dashboard() {
    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const response = await api.get('/api/v1/products/')
            return response.data
        },
    })

    const stats = [
        {
            name: 'Total Productos',
            value: products?.metadata?.total || 0,
            icon: Package,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            name: 'Stock Bajo',
            value: products?.items?.filter((p: any) => p.stock <= p.min_stock).length || 0,
            icon: TrendingDown,
            color: 'text-red-600',
            bgColor: 'bg-red-100',
        },
        {
            name: 'Productos Activos',
            value: products?.items?.filter((p: any) => p.is_active).length || 0,
            icon: AlertTriangle,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            name: 'Valor Inventario',
            value: `$${products?.items?.reduce((acc: number, p: any) => acc + Number(p.price) * p.stock, 0).toFixed(2) || '0.00'}`,
            icon: DollarSign,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
    ]

    const lowStockProducts = products?.items?.filter((p: any) => p.stock <= p.min_stock).slice(0, 5) || []

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">Resumen general del inventario</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div key={stat.name} className="card">
                        <div className="flex items-center">
                            <div className={`flex-shrink-0 rounded-lg ${stat.bgColor} p-3`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {lowStockProducts.length > 0 && (
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos con Stock Bajo</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Producto
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        SKU
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock Actual
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock Mínimo
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {lowStockProducts.map((product: any) => (
                                    <tr key={product.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {product.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                                            {product.stock}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.min_stock}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
