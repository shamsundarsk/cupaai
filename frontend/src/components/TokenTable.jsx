/**
 * Compact table of live material tokens with risk indicators.
 */
const riskBadge = (level) => {
  switch (level) {
    case "CRITICAL":
      return <span className="badge-critical">{level}</span>;
    case "HIGH":
      return <span className="badge-danger">{level}</span>;
    case "MEDIUM":
      return <span className="badge-warning">{level}</span>;
    default:
      return <span className="badge-safe">{level}</span>;
  }
};

export default function TokenTable({ tokens }) {
  // Sort: highest risk first.
  const sorted = [...tokens].sort((a, b) => b.risk_score - a.risk_score);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-500 uppercase tracking-wider border-b border-surface-600">
            <th className="text-left py-2 px-2">ID</th>
            <th className="text-left py-2 px-2">Type</th>
            <th className="text-left py-2 px-2">Node</th>
            <th className="text-right py-2 px-2">Temp</th>
            <th className="text-right py-2 px-2">Gas</th>
            <th className="text-right py-2 px-2">Risk</th>
            <th className="text-center py-2 px-2">Level</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((t) => (
            <tr
              key={t.id}
              className="border-b border-surface-700/50 hover:bg-surface-700/30 transition-colors"
            >
              <td className="py-1.5 px-2 font-mono text-gray-300">{t.id}</td>
              <td className="py-1.5 px-2">
                <span className="inline-flex items-center gap-1">
                  <span>{t.icon}</span>
                  <span className="text-gray-400">{t.type_label}</span>
                </span>
              </td>
              <td className="py-1.5 px-2 text-gray-400">{t.current_node}</td>
              <td className="py-1.5 px-2 text-right font-mono text-gray-300">
                {t.temperature.toFixed(1)}°C
              </td>
              <td className="py-1.5 px-2 text-right font-mono text-gray-300">
                {t.gas_level.toFixed(0)}
              </td>
              <td className="py-1.5 px-2 text-right font-mono text-gray-300">
                {(t.risk_score * 100).toFixed(0)}%
              </td>
              <td className="py-1.5 px-2 text-center">{riskBadge(t.risk_level)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
