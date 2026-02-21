import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface UserActivityProps {
    data: { name: string; value: number }[]
}

const COLORS = ['#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE', '#E0E7FF']

export default function UserActivityChart({ data }: UserActivityProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                <p className="text-sm font-medium">No hay actividad registrada</p>
            </div>
        )
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                    <XAxis type="number" hide />
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fontWeight: 500, fill: '#6B7280' }}
                    />
                    <Tooltip 
                        cursor={{ fill: '#F9FAFB' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={20}>
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
