import { motion, AnimatePresence } from "framer-motion";

const severityStyles = {
  danger: "border-red-700/60 bg-red-950/40 text-red-300",
  warning: "border-yellow-700/60 bg-yellow-950/40 text-yellow-300",
  info: "border-blue-700/60 bg-blue-950/40 text-blue-300",
};

export default function AlertPanel({ alerts }) {
  return (
    <div className="card h-full flex flex-col">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Live Alerts
      </h3>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        <AnimatePresence initial={false}>
          {alerts.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`border rounded-lg px-3 py-2 text-xs ${
                severityStyles[a.severity] || severityStyles.info
              }`}
            >
              <div className="font-semibold">{a.title}</div>
              <div className="opacity-80 mt-0.5 leading-snug">{a.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
        {alerts.length === 0 && (
          <p className="text-gray-600 text-xs text-center mt-6">
            No active alerts
          </p>
        )}
      </div>
    </div>
  );
}
