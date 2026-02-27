import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface CategoryData {
    name: string
    value: number
}

interface Props {
    data: CategoryData[]
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#f43f5e', '#8b5cf6', '#ec4899']

export default function CategoryValueChart({ data }: Props) {
    const filteredData = data.filter(item => item.value > 0)
    const totalValue = filteredData.reduce((acc, curr) => acc + curr.value, 0)
    
    if (filteredData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                <p className="text-xs font-bold uppercase tracking-widest">Sin datos de valorización</p>
            </div>
        )
    }

    return (
        <div className="h-full w-full relative flex flex-col">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={filteredData}
                        cx="50%"
                        cy="50%"
                        innerRadius="65%"
                        outerRadius="90%"
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                    >
                        {filteredData.map((_entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]}
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                        ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value: number | undefined) => value ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 0 })}` : '$0.00'}
                        contentStyle={{ 
                            borderRadius: '20px', 
                            border: 'none', 
                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                            padding: '16px',
                            backgroundColor: '#ffffff'
                        }}
                        itemStyle={{
                            fontSize: '12px',
                            fontWeight: '900',
                            color: '#1e293b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    />
                    <Legend 
                        layout="horizontal" 
                        align="center" 
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '9px', paddingTop: '30px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">${totalValue > 1000 ? (totalValue/1000).toFixed(1) + 'k' : totalValue.toFixed(0)}</p>
            </div>
        </div>
    )
}
