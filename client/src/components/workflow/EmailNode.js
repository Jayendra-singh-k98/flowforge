import { Handle, Position } from "@xyflow/react";

export default function EmailNode({ data }) {
  return (
    <div className="min-w-30 rounded-xl border bg-white shadow-md">
      <div className="rounded-t-xl bg-green-600 px-4 py-3 text-white">
        <div className="font-semibold">
          ✉️ {data.label}
        </div>

        <div className="text-xs opacity-80">
          Action
        </div>
      </div>

      <div className="px-4 py-3 text-sm text-gray-600">
        Send an email
      </div>

      <Handle
        type="target"
        position={Position.Top}
      />
    </div>
  );
}