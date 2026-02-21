import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { Package, TrendingDown, AlertTriangle, DollarSign, ArrowUpRight, ArrowDownRight, Clock, Download, ShieldCheck } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import MovementTrendsChart from '@/components/charts/MovementTrendsChart'
import CategoryValueChart from '@/components/charts/CategoryValueChart'

export default function Dashboard() {
    const { data: dashboard, isLoading } = useQuery({
        queryKey: ['dashboard'],
        queryFn: async () => {
            const response = await api.get('/api/v1/reports/dashboard')
            return response.data
        },
    })

    const handleDownload = async () => {
        try {
            const response = await api.get('/api/v1/reports/inventory-csv', {
                responseType: 'blob'
            })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `inventario_${new Date().toISOString().slice(0, 10)}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            toast.error('Error al descargar el CSV')
        }
    }

    const handleDownloadExcel = async () => {
        const toastId = toast.loading('Generando Excel profesional...')
        try {
            const response = await api.get('/api/v1/reports/inventory-excel', {
                responseType: 'blob'
            })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `Inventario_PRO_${new Date().toISOString().slice(0, 10)}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            toast.success('Excel descargado con éxito', { id: toastId })
        } catch (error) {
            toast.error('Error al generar el Excel', { id: toastId })
        }
    }

    const stats = [
        {
            name: 'Total Productos',
            value: dashboard?.stats?.total_products || 0,
            icon: Package,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            name: 'Stock Bajo',
            value: dashboard?.stats?.low_stock_count || 0,
            icon: TrendingDown,
            color: 'text-red-600',
            bgColor: 'bg-red-100',
        },
        {
            name: 'Productos Activos',
            value: dashboard?.stats?.active_products || 0,
            icon: AlertTriangle,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            name: 'Valor Inventario',
            value: `$${dashboard?.stats?.total_inventory_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`,
            icon: DollarSign,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
    ]

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-600">Resumen y analíticas de tu inventario</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleDownload}
                        className="btn btn-secondary flex items-center gap-2"
                        title="Exportar formato CSV simple"
                    >
                        <Download className="h-5 w-5" />
                        CSV
                    </button>
                    <button 
                        onClick={handleDownloadExcel}
                        className="btn btn-primary flex items-center gap-2 shadow-lg shadow-primary-200"
                    >
                        <ShieldCheck className="h-5 w-5" />
                        Exportar Excel PRO
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div key={stat.name} className="card hover:shadow-md transition-shadow">
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

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Tendencia de Movimientos</h2>
                        <p className="text-xs text-gray-500">Entradas vs Salidas de los últimos 7 días</p>
                    </div>
                    <MovementTrendsChart data={dashboard?.trends || []} />
                </div>
                <div className="card">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Valor por Categoría</h2>
                        <p className="text-xs text-gray-500">Distribución económica del inventario</p>
                    </div>
                    <CategoryValueChart data={dashboard?.category_distribution || []} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Movements */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-gray-500" />
                            Movimientos Recientes
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cant.</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {dashboard?.recent_movements?.map((m: any) => (
                                    <tr key={m.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {m.product_name}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            <span className={clsx(
                                                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                                m.type === 'entry' ? "bg-green-100 text-green-800" : 
                                                m.type === 'exit' ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                                            )}>
                                                {m.type === 'entry' && <ArrowUpRight className="h-3 w-3 mr-1" />}
                                                {m.type === 'exit' && <ArrowDownRight className="h-3 w-3 mr-1" />}
                                                {m.type}
                                            </span>
                                        </td>
                                        <td className={clsx(
                                            "px-4 py-3 whitespace-nowrap text-sm text-right font-semibold",
                                            m.quantity > 0 ? "text-green-600" : "text-red-600"
                                        )}>
                                            {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                                            {new Date(m.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {(!dashboard?.recent_movements || dashboard.recent_movements.length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                                            No hay movimientos registrados
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Trends Placeholder (visual simple) */}
                <div className="card border-none shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Alertas de Reabastecimiento
                        </h2>
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase">Crítico</span>
                    </div>
                    <div className="space-y-3">
                        {dashboard?.low_stock_products?.length > 0 ? (
                            dashboard.low_stock_products.map((p: any) => (
                                <div key={p.id} className="group p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/products'}>
                                            <div className="h-9 w-9 bg-white rounded-lg flex items-center justify-center shadow-sm text-red-600 font-bold text-xs ring-1 ring-red-100">
                                                {p.stock}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{p.name}</p>
                                                <p className="text-[10px] text-gray-500 font-mono uppercase">{p.sku}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Mín: {p.min_stock}</p>
                                            <div className="mt-1 h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-red-500" 
                                                    style={{ width: `${Math.max(10, (p.stock / p.min_stock) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 px-4 bg-green-50 rounded-2xl border border-dashed border-green-200">
                                <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm text-green-600 mb-3">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <p className="text-sm font-bold text-green-800">Todo bajo control</p>
                                <p className="text-xs text-green-600 mt-1">No hay productos con stock por debajo del mínimo.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Resumen de Actividad (30 días)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Entradas</span>
                                </div>
                                <p className="text-xl font-bold text-gray-900">{dashboard?.stats?.entries_count || 0}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Salidas</span>
                                </div>
                                <p className="text-xl font-bold text-gray-900">{dashboard?.stats?.exits_count || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
