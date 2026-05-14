/**
 * Horizontal recovery metrics bar shown at the bottom of the dashboard.
 */
export default function RecoveryBar({ recovery, sustainability }) {
  const metrics = [
    { label: "Lead", value: recovery.lead_kg.toFixed(1), unit: "kg", color: "text-yellow-400" },
    { label: "Lithium", value: recovery.lithium_kg.toFixed(1), unit: "kg", color: "text-cyan-400" },
    { label: "Copper", value: recovery.copper_kg.toFixed(1), unit: "kg", color: "text-orange-400" },
    { label: "Cobalt", value: recovery.cobalt_kg.toFixed(1), unit: "kg", color: "text-purple-400" },
    { label: "Plastic", value: recovery.plastic_kg.toFixed(1), unit: "kg", color: "text-green-400" },
    { label: "Carbon Saved", value: sustainability.carbon_saved_tons.toFixed(2), unit: "t", color: "text-emerald-400" },
    { label: "Efficiency", value: recovery.efficiency.toFixed(1), unit: "%", color: "text-brand-400" },
  ];

  return (
    <div className="card flex items-center justify-between gap-4 overflow-x-auto">
      {metrics.map((m) => (
        <div key={m.label} className="flex flex-col items-center min-w-[70px]">
          <span className={`text-lg font-bold font-mono ${m.color}`}>
            {m.value}
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
            {m.label} ({m.unit})
          </span>
        </div>
      ))}
    </div>
  );
}
