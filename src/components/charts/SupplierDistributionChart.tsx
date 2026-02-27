import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface SupplierDistributionProps {
    data: { name: string; value: number }[]
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function SupplierDistributionChart({ data }: SupplierDistributionProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p className="text-sm font-medium">No hay datos de proveedores</p>
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
