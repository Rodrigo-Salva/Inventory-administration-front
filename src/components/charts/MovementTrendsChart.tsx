import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface TrendsData {
    date: string
    entries: number
    exits: number
}

interface Props {
    data: TrendsData[]
}

export default function MovementTrendsChart({ data }: Props) {
    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                        dy={10}
                        tickFormatter={(str) => {
                            const date = new Date(str)
                            return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
                        }}
                    />
                    <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                        dx={-10}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            borderRadius: '16px', 
                            border: '1px solid #f1f5f9', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            padding: '12px'
                        }}
                        itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                        labelStyle={{ fontWeight: '900', color: '#1e293b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="entries" 
                        name="Entradas"
                        stroke="#10b981" 
                        fillOpacity={1} 
                        fill="url(#colorEntries)" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="exits" 
                        name="Salidas"
                        stroke="#f43f5e" 
                        fillOpacity={1} 
                        fill="url(#colorExits)" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
