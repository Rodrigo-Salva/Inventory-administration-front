import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface ProductData {
    name: string
    stock: number
}

interface Props {
    data: ProductData[]
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316']

export default function TopProductsChart({ data }: Props) {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                <p className="text-xs font-bold uppercase tracking-widest text-center px-4">No hay datos de stock de productos</p>
            </div>
        )
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                        width={80}
                    />
                    <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ 
                            borderRadius: '16px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            padding: '12px'
                        }}
                        itemStyle={{ fontWeight: 'bold', fontSize: '12px', color: '#1e293b' }}
                        labelStyle={{ display: 'none' }}
                    />
                    <Bar 
                        dataKey="stock" 
                        name="Stock Actual"
                        radius={[0, 8, 8, 0]} 
                        barSize={24}
                    >
                        {data.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
