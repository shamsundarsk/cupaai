import TokenTable from "../components/TokenTable";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useRef, useEffect, useState } from "react";

export default function Hazards({ twin }) {
  // Build a rolling history of the max risk score across all tokens.
  const historyRef = useRef([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const maxRisk = twin.tokens.length
      ? Math.max(...twin.tokens.map((t) => t.risk_score))
      : 0;
    historyRef.current = [
      ...historyRef.current.slice(-59),
      { tick: twin.tick, risk: +(maxRisk * 100).toFixed(1) },
    ];
    setHistory([...historyRef.current]);
  }, [twin.tick]);

  const dangerTokens = twin.tokens.filter(
    (t) => t.risk_level === "HIGH" || t.risk_level === "CRITICAL"
  );

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* Header stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Active Tokens"
          value={twin.tokens.length}
          color="text-gray-200"
        />
        <StatCard
          label="High Risk"
          value={dangerTokens.length}
          color="text-red-400"
        />
        <StatCard
          label="Isolated"
          value={twin.tokens.filter((t) => t.isolated).length}
          color="text-yellow-400"
        />
        <StatCard
          label="Hazards Prevented"
          value={twin.sustainability.hazards_prevented}
          color="text-emerald-400"
        />
      </div>

      {/* Risk trend chart */}
      <div className="card">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Peak Risk Score (rolling)
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={history}>
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e222e" />
            <XAxis dataKey="tick" hide />
            <YAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: "#161922",
                border: "1px solid #272c3a",
                borderRadius: 8,
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="risk"
              stroke="#ef4444"
              fill="url(#riskGrad)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Token table */}
      <div className="card">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Battery & Material Hazard Monitor
        </h3>
        <TokenTable tokens={twin.tokens} />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="card flex flex-col items-center justify-center py-4">
      <span className={`text-2xl font-bold font-mono ${color}`}>{value}</span>
      <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
        {label}
      </span>
    </div>
  );
}
