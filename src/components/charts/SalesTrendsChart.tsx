import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SalesTrendsChartProps {
  data: any[];
}

export default function SalesTrendsChart({ data }: SalesTrendsChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fontWeight: 700, fill: "#9ca3af" }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
          }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fontWeight: 700, fill: "#9ca3af" }}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "16px",
            border: "none",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            padding: "12px",
          }}
          itemStyle={{
            fontSize: "12px",
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Ventas ($)"
          stroke="#4f46e5"
          strokeWidth={4}
          fillOpacity={1}
          fill="url(#colorRevenue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
