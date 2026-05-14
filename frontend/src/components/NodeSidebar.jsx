const statusBadge = (status) => {
  switch (status) {
    case "danger":
      return <span className="badge-danger">DANGER</span>;
    case "warning":
      return <span className="badge-warning">WARNING</span>;
    case "running":
      return <span className="badge-safe">RUNNING</span>;
    default:
      return <span className="text-gray-600 text-xs">IDLE</span>;
  }
};

export default function NodeSidebar({ nodes }) {
  return (
    <div className="card h-full flex flex-col">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Processing Nodes
      </h3>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="bg-surface-700/50 rounded-lg px-3 py-2 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">{node.icon}</span>
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-200 truncate">
                  {node.short}
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  Q:{node.queue_length} A:{node.active_count}/{node.capacity}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              {statusBadge(node.status)}
              <span className="text-[10px] text-gray-500 font-mono">
                {node.avg_progress.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
