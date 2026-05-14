import { motion, AnimatePresence } from "framer-motion";

const kindDot = {
  intake: "bg-blue-500",
  process: "bg-green-500",
  hazard: "bg-red-500",
  isolation: "bg-red-400",
  recovery: "bg-emerald-500",
  system: "bg-gray-500",
};

export default function EventTimeline({ events }) {
  return (
    <div className="card h-full flex flex-col">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Event Timeline
      </h3>
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        <AnimatePresence initial={false}>
          {events.slice(0, 20).map((ev) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 text-xs"
            >
              <span
                className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                  kindDot[ev.kind] || kindDot.system
                }`}
              />
              <span className="text-gray-400 leading-snug">{ev.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
