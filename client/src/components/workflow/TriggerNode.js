import { Handle, Position } from "@xyflow/react";

export default function TriggerNode({ data }) {
  return (
    <div className="min-w-30 rounded-xl border bg-white shadow-md">
      <div className="rounded-t-xl bg-blue-600 px-4 py-3 text-white">
        <div className="font-semibold">
          ⚡ {data.label}
        </div>

        <div className="text-xs opacity-80">
          Trigger
        </div>
      </div>

      <div className="px-4 py-3 text-sm text-gray-600">
        Starts the workflow
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
      />
    </div>
  );
}