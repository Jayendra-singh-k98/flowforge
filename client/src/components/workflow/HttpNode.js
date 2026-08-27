import { Handle, Position } from "@xyflow/react";

export default function HttpNode({ data }) {
    const config = data?.config || {};

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

            <div className="space-y-1 px-4 py-3 text-sm text-gray-600">
                <div>
                    <span className="font-medium">
                        {config.method || "GET"}
                    </span>
                </div>

                <div className="truncate">
                    {config.url || "No URL configured"}
                </div>
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