"use client";

const nodeOptions = [
    {
        type: "trigger",
        label: "⚡ Manual Trigger",
    },
    {
        type: "http",
        label: "🌐 HTTP Request",
    },
    {
        type: "email",
        label: "✉️ Send Email",
    },
    {
        type: "condition",
        label: "🔀 Condition",
    },
];

export default function NodePalette({ onAddNode }) {
    return (
        <aside className="w-64 border-r border-slate-800 bg-slate-900 p-4">
            <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Nodes
            </h2>

            <div className="space-y-3">
                {nodeOptions.map((node) => (
                    <button
                        key={node.type}
                        onClick={() => onAddNode(node.type)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-left text-sm text-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-700 active:scale-[0.98]"
                    >
                        {node.label}
                    </button>
                ))}
            </div>
        </aside>
    );
}