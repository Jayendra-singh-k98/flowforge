import { Handle, Position } from "@xyflow/react";

export default function HttpNode({ data }) {
  return (
    <div className="min-w-30 rounded-xl border bg-white shadow-md">
      <div className="rounded-t-xl bg-purple-600 px-4 py-3 text-white">
        <div className="font-semibold">
          🌐 {data.label}
        </div>

        <div className="text-xs opacity-80">
          Action
        </div>
      </div>

      <div className="px-4 py-3 text-sm text-gray-600">
        Send an HTTP request
      </div>

      <Handle
        type="target"
        position={Position.Top}
      />

      <Handle
        type="source"
        position={Position.Bottom}
      />
    </div>
  );
}