import { Handle, Position } from "@xyflow/react";

export default function ConditionNode({ data }) {
  return (
    <div className="min-w-30 rounded-xl border bg-white shadow-md">
      <div className="rounded-t-xl bg-orange-500 px-4 py-3 text-white">
        <div className="font-semibold">
          🔀 {data.label}
        </div>

        <div className="text-xs opacity-80">
          Condition
        </div>
      </div>

      <div className="px-4 py-3 text-sm text-gray-600">
        Check a condition
      </div>

      <Handle
        type="target"
        position={Position.Top}
      />

      <Handle
        id="true"
        type="source"
        position={Position.Bottom}
        style={{ left: "30%" }}
      />

      <Handle 
        id="false"
        type="source"
        position={Position.Bottom}
        style={{ left: "70%" }}
      />
    </div>
  );
}