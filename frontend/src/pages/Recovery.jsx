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

const COLORS = {
  Lead: "#f59e0b",
  Lithium: "#22d3ee",
  Copper: "#fb923c",
  Cobalt: "#a78bfa",
  Plastic: "#34d399",
};

export default function Recovery({ twin }) {
  const { recovery } = twin;

  const data = [
    { name: "Lead", kg: +recovery.lead_kg.toFixed(1) },
    { name: "Lithium", kg: +recovery.lithium_kg.toFixed(1) },
    { name: "Copper", kg: +recovery.copper_kg.toFixed(1) },
    { name: "Cobalt", kg: +recovery.cobalt_kg.toFixed(1) },
    { name: "Plastic", kg: +recovery.plastic_kg.toFixed(1) },
  ];

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-4">
        {data.map((d) => (
          <div key={d.name} className="card flex flex-col items-center py-4">
            <span
              className="text-2xl font-bold font-mono"
              style={{ color: COLORS[d.name] }}
            >
              {d.kg}
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
              {d.name} (kg)
            </span>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="card">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Material Recovery (kg)
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e222e" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
            />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: "#161922",
                border: "1px solid #272c3a",
                borderRadius: 8,
                fontSize: 11,
              }}
            />
            <Bar dataKey="kg" radius={[6, 6, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.name} fill={COLORS[d.name]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Extra stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center py-4">
          <span className="text-xl font-bold font-mono text-brand-400">
            {recovery.total_processed}
          </span>
          <p className="text-[10px] text-gray-500 uppercase mt-1">
            Total Processed
          </p>
        </div>
        <div className="card text-center py-4">
          <span className="text-xl font-bold font-mono text-brand-400">
            {recovery.efficiency.toFixed(1)}%
          </span>
          <p className="text-[10px] text-gray-500 uppercase mt-1">
            Recovery Efficiency
          </p>
        </div>
        <div className="card text-center py-4">
          <span className="text-xl font-bold font-mono text-emerald-400">
            {twin.sustainability.waste_diverted_tons.toFixed(2)} t
          </span>
          <p className="text-[10px] text-gray-500 uppercase mt-1">
            Waste Diverted
          </p>
        </div>
      </div>
    </div>
  );
}
