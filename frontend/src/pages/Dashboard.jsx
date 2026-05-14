import NodeSidebar from "../components/NodeSidebar";
import PlantFloor from "../components/PlantFloor";
import AlertPanel from "../components/AlertPanel";
import RecoveryBar from "../components/RecoveryBar";
import EventTimeline from "../components/EventTimeline";

export default function Dashboard({ twin }) {
  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Top row: sidebar + floor + alerts */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Left sidebar — node list */}
        <div className="col-span-2 min-h-0 overflow-hidden">
          <NodeSidebar nodes={twin.nodes} />
        </div>

        {/* Center — live plant floor */}
        <div className="col-span-7 min-h-0 overflow-hidden">
          <PlantFloor
            nodes={twin.nodes}
            conveyors={twin.conveyors}
            tokens={twin.tokens}
            isolationNodeId={twin.isolation_node_id}
          />
        </div>

        {/* Right — alerts + events */}
        <div className="col-span-3 min-h-0 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <AlertPanel alerts={twin.alerts} />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <EventTimeline events={twin.events} />
          </div>
        </div>
      </div>

      {/* Bottom bar — recovery metrics */}
      <RecoveryBar
        recovery={twin.recovery}
        sustainability={twin.sustainability}
      />
    </div>
  );
}
