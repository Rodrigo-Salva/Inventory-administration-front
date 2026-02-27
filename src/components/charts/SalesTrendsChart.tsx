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
        margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fontWeight: 800, fill: "#94a3b8" }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
          }}
          dy={15}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fontWeight: 800, fill: "#94a3b8" }}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
          contentStyle={{
            borderRadius: "20px",
            border: "none",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            padding: "16px",
            backgroundColor: "#ffffff",
          }}
          itemStyle={{
            fontSize: "12px",
            fontWeight: "900",
            color: "#1e293b",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        />
        <Area
          type="basis"
          dataKey="revenue"
          name="Ventas ($)"
          stroke="#6366f1"
          strokeWidth={4}
          fillOpacity={1}
          fill="url(#colorRevenue)"
          animationDuration={1500}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
