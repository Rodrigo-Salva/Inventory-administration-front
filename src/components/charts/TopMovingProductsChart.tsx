import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface TopMovingProductsProps {
    data: { name: string; value: number }[]
}

export default function TopMovingProductsChart({ data }: TopMovingProductsProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                <p className="text-sm font-medium">No hay datos de movimientos</p>
            </div>
        )
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.slice(0, 5)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#2563EB" stopOpacity={1}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#9CA3AF' }}
                    />
                    <YAxis hide />
                    <Tooltip 
                        cursor={{ fill: '#F9FAFB' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ fontWeight: 700, color: '#1F2937' }}
                    />
                    <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
