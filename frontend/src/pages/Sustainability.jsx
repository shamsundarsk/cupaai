import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useRef, useEffect, useState } from "react";

export default function Sustainability({ twin }) {
  const { sustainability } = twin;

  // Rolling history for the line chart.
  const histRef = useRef([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    histRef.current = [
      ...histRef.current.slice(-59),
      {
        tick: twin.tick,
        carbon: +sustainability.carbon_saved_tons.toFixed(3),
        diverted: +sustainability.waste_diverted_tons.toFixed(3),
        energy: +sustainability.energy_consumption_mwh.toFixed(3),
      },
    ];
    setHistory([...histRef.current]);
  }, [twin.tick]);

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* KPI cards */}
      <div className="grid grid-cols-5 gap-4">
        <KPI
          label="Carbon Saved"
          value={sustainability.carbon_saved_tons.toFixed(2)}
          unit="tons"
          color="text-emerald-400"
        />
        <KPI
          label="Waste Diverted"
          value={sustainability.waste_diverted_tons.toFixed(2)}
          unit="tons"
          color="text-green-400"
        />
        <KPI
          label="Energy Used"
          value={sustainability.energy_consumption_mwh.toFixed(2)}
          unit="MWh"
          color="text-yellow-400"
        />
        <KPI
          label="Hazards Prevented"
          value={sustainability.hazards_prevented}
          unit=""
          color="text-red-400"
        />
        <KPI
          label="Recovery Eff."
          value={sustainability.recovery_efficiency.toFixed(1)}
          unit="%"
          color="text-brand-400"
        />
      </div>

      {/* Trend chart */}
      <div className="card">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Sustainability Trends (live)
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e222e" />
            <XAxis dataKey="tick" hide />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: "#161922",
                border: "1px solid #272c3a",
                borderRadius: 8,
                fontSize: 11,
              }}
            />
            <Line
              type="monotone"
              dataKey="carbon"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
              name="Carbon Saved (t)"
            />
            <Line
              type="monotone"
              dataKey="diverted"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
              name="Waste Diverted (t)"
            />
            <Line
              type="monotone"
              dataKey="energy"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="Energy (MWh)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Explanation */}
      <div className="card text-sm text-gray-400 leading-relaxed">
        <p>
          <strong className="text-gray-200">UrbanMine Twin AI</strong> tracks
          sustainability metrics in real time as materials flow through the
          recycling plant. Carbon savings are calculated from recovered metals
          displacing virgin mining. Waste diversion measures mass kept out of
          landfill. Energy consumption reflects the plant's operational load.
        </p>
      </div>
    </div>
  );
}

function KPI({ label, value, unit, color }) {
  return (
    <div className="card flex flex-col items-center justify-center py-4">
      <span className={`text-2xl font-bold font-mono ${color}`}>{value}</span>
      <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
        {label} {unit && `(${unit})`}
      </span>
    </div>
  );
}
