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

const COLORS = ["#4f46e5", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b"];

export default function TopSellingProductsChart({ data }: TopSellingProductsChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
        <XAxis type="number" hide />
        <YAxis
          dataKey="name"
          type="category"
          axisLine={false}
          tickLine={false}
          width={100}
          tick={{ fontSize: 10, fontWeight: 900, fill: "#374151", textAnchor: 'end' }}
        />
        <Tooltip
          cursor={{ fill: "#f9fafb" }}
          contentStyle={{
            borderRadius: "16px",
            border: "none",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          }}
        />
        <Bar dataKey="value" name="Vendidos" radius={[0, 10, 10, 0]} barSize={20}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
