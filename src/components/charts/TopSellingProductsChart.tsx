import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface TopSellingProductsChartProps {
  data: any[];
}

const COLORS = ["#6366f1", "#8b5cf6", "#d946ef", "#f43f5e", "#f59e0b"];

export default function TopSellingProductsChart({ data }: TopSellingProductsChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
        <XAxis type="number" hide />
        <YAxis
          dataKey="name"
          type="category"
          axisLine={false}
          tickLine={false}
          width={100}
          tick={{ fontSize: 10, fontWeight: 900, fill: "#475569", textAnchor: 'end' }}
        />
        <Tooltip
          cursor={{ fill: "#f8fafc", radius: 10 }}
          contentStyle={{
            borderRadius: "20px",
            border: "none",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            padding: "12px",
          }}
          itemStyle={{
            fontSize: "11px",
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        />
        <Bar dataKey="value" name="Vendidos" radius={[0, 20, 20, 0]} barSize={24} animationDuration={1500}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
