import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface CategoryData {
    name: string
    value: number
}

interface Props {
    data: CategoryData[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function CategoryValueChart({ data }: Props) {
    // Filtrar categorías con valor 0 para una gráfica más limpia
    const filteredData = data.filter(item => item.value > 0)
    
    if (filteredData.length === 0) {
        return (
            <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
                No hay datos de categorías
            </div>
        )
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={filteredData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {filteredData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 10px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend 
                        layout="vertical" 
                        align="right" 
                        verticalAlign="middle"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '10px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
