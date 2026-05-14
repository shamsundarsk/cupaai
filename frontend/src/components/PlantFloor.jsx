import { motion } from "framer-motion";

/**
 * Animated SVG-based plant floor map.
 * Draws nodes as circles/boxes, conveyors as lines, and material tokens
 * as animated dots flowing between nodes.
 */
export default function PlantFloor({ nodes, conveyors, tokens, isolationNodeId }) {
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const statusColor = (status) => {
    switch (status) {
      case "danger":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      case "running":
        return "#22c55e";
      default:
        return "#4b5563";
    }
  };

  return (
    <div className="card h-full relative overflow-hidden">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Live Plant Floor
      </h3>
      <svg
        viewBox="0 0 100 64"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Conveyors */}
        {conveyors.map(([from, to], i) => {
          const a = nodeMap[from];
          const b = nodeMap[to];
          if (!a || !b) return null;
          return (
            <line
              key={i}
              x1={a.position[0]}
              y1={a.position[1]}
              x2={b.position[0]}
              y2={b.position[1]}
              stroke="#374151"
              strokeWidth="0.4"
              strokeDasharray="1 0.6"
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            <motion.circle
              cx={node.position[0]}
              cy={node.position[1]}
              r={2.2}
              fill={statusColor(node.status)}
              fillOpacity={0.2}
              stroke={statusColor(node.status)}
              strokeWidth={0.3}
              animate={{
                r: node.status === "danger" ? [2.2, 2.8, 2.2] : 2.2,
              }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <text
              x={node.position[0]}
              y={node.position[1] - 3.2}
              textAnchor="middle"
              className="fill-gray-400"
              fontSize="1.6"
              fontFamily="Inter, sans-serif"
            >
              {node.short}
            </text>
            <text
              x={node.position[0]}
              y={node.position[1] + 0.5}
              textAnchor="middle"
              fontSize="2.2"
            >
              {node.icon}
            </text>
          </g>
        ))}

        {/* Material tokens */}
        {tokens
          .filter((t) => t.state !== "done")
          .map((token) => {
            const node = nodeMap[token.current_node];
            if (!node) return null;
            // Offset tokens slightly so they don't stack.
            const hash = token.id.charCodeAt(token.id.length - 1) % 7;
            const ox = ((hash % 3) - 1) * 1.8;
            const oy = (Math.floor(hash / 3) - 0.5) * 1.8;
            return (
              <motion.circle
                key={token.id}
                cx={node.position[0] + ox}
                cy={node.position[1] + oy}
                r={0.9}
                fill={token.color}
                fillOpacity={0.85}
                stroke={token.risk_level === "CRITICAL" ? "#ef4444" : "transparent"}
                strokeWidth={0.3}
                initial={false}
                animate={{
                  cx: node.position[0] + ox,
                  cy: node.position[1] + oy,
                }}
                transition={{ type: "spring", stiffness: 60, damping: 14 }}
              />
            );
          })}
      </svg>
    </div>
  );
}
