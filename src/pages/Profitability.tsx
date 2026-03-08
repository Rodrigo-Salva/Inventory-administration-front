import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import { 
    TrendingUp, DollarSign, Percent, 
    ArrowUpRight,
    Search
} from 'lucide-react';
import clsx from "clsx";
import DateRangePicker from "@/components/common/DateRangePicker";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface ProfitabilityData {
    product_id: number;
    name: string;
    sku: string;
    quantity_sold: number;
    total_revenue: number;
    total_cost: number;
    profit: number;
    margin_percentage: number;
}

export default function Profitability() {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [search, setSearch] = useState("");

    // 1. Cargar Reporte de Rentabilidad
    const { data: report, isLoading } = useQuery<ProfitabilityData[]>({
        queryKey: ["profitability", startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams({
                ...(startDate && { start_date: startDate }),
                ...(endDate && { end_date: endDate }),
            });
            const response = await api.get(`/api/v1/reports/profitability?${params}`);
            return response.data;
        }
    });

    const filteredReport = report?.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) || 
        item.sku.toLowerCase().includes(search.toLowerCase())
    );

    const totalProfit = report?.reduce((sum, item) => sum + item.profit, 0) || 0;
    const totalRevenue = report?.reduce((sum, item) => sum + item.total_revenue, 0) || 0;
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Top 5 Productos por Ganancia
    const chartData = report?.slice(0, 5).map(item => ({
        name: item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
        ganancia: item.profit,
        margen: item.margin_percentage
    })) || [];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-500 font-medium">Calculando márgenes y rentabilidad...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-primary-600" />
                        <h1 className="text-2xl font-black text-gray-900 uppercase">Rentabilidad Real</h1>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Análisis de ganancias basado en costos de compra</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <DateRangePicker 
                        startDate={startDate} 
                        endDate={endDate} 
                        onChange={({ start, end }) => {
                            setStartDate(start);
                            setEndDate(end);
                        }}
                    />
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card bg-white border-none shadow-sm p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <DollarSign className="h-16 w-16 text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Ganancia Bruta Estimada</span>
                    <span className="text-3xl font-black text-emerald-600">
                        ${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                        <ArrowUpRight className="h-3 w-3" /> Basado en ventas finalizadas
                    </div>
                </div>

                <div className="card bg-white border-none shadow-sm p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Percent className="h-16 w-16 text-primary-600" />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Margen de Utilidad Promedio</span>
                    <span className="text-3xl font-black text-primary-600">
                        {avgMargin.toFixed(2)}%
                    </span>
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full w-fit">
                        <TrendingUp className="h-3 w-3" /> Rendimiento global
                    </div>
                </div>

                <div className="card bg-white border-none shadow-sm p-6 relative overflow-hidden group text-right md:text-left">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Ingresos Totales (Ventas)</span>
                    <span className="text-3xl font-black text-gray-900">
                        ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <p className="text-[10px] font-bold text-gray-400 mt-2 italic uppercase">
                        Costos deducidos: ${ (totalRevenue - totalProfit).toLocaleString() }
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Barras */}
                <div className="card bg-white border-none shadow-sm p-6">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-6">Top 5 Productos más Rentables</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F1F5F9" />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={120} 
                                    tick={{fontSize: 10, fontWeight: 700, fill: '#64748B'}}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip 
                                    cursor={{fill: '#F8FAFC'}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="ganancia" fill="#0EA5E9" radius={[0, 4, 4, 0]} barSize={25}>
                                    {chartData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#0284C7' : '#0EA5E9'} opacity={1 - (index * 0.15)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tabla Detallada */}
                <div className="card bg-white border-none shadow-sm flex flex-col h-[384px]">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/50">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Detalle por Producto</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Filtrar..."
                                className="pl-9 h-8 text-xs border-gray-200 rounded-lg w-40 focus:ring-primary-500"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-y-auto flex-1">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="sticky top-0 bg-white z-10 shadow-sm shadow-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase">Producto</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase">Ganancia</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase">Margen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredReport?.map((item) => (
                                    <tr key={item.product_id} className="hover:bg-white/50 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-900 uppercase truncate max-w-[150px]">{item.name}</span>
                                                <span className="text-[9px] font-mono text-gray-400 leading-none">SKU: {item.sku}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right whitespace-nowrap">
                                            <span className="text-xs font-black text-emerald-600">${item.profit.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className={clsx(
                                                "inline-block px-2 py-0.5 rounded text-[10px] font-black",
                                                item.margin_percentage > 30 ? "bg-emerald-50 text-emerald-700" : 
                                                item.margin_percentage > 10 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                                            )}>
                                                {item.margin_percentage.toFixed(1)}%
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredReport?.length === 0 && (
                            <div className="p-10 text-center text-gray-400 text-xs italic">
                                No se encontraron datos para este periodo.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
