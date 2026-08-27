"use client";

export default function NodeConfigPanel({ node, onUpdate, onClose, }) {
  if (!node) {
    return (
      <aside className="w-80 border-l bg-slate-900 p-5">
        <p className="text-sm text-gray-500">
          Select a node to configure it.
        </p>
      </aside>
    );
  }

  const config = node.data?.config || {};

  return (
    <aside className="w-80 border-l bg-slate-900 p-5">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {node.data?.label}
        </h2>

        <button
          onClick={onClose}
          className="text-gray-500 hover:text-black"
        > × </button>
      </div>

      {node.type === "http" && (
        <HttpConfig
          config={config}
          onUpdate={onUpdate}
        />
      )}

      {node.type === "email" && (
        <EmailConfig
          config={config}
          onUpdate={onUpdate}
        />
      )}

      {node.type === "condition" && (
        <ConditionConfig
          config={config}
          onUpdate={onUpdate}
        />
      )}

      {node.type === "trigger" && (
        <TriggerConfig
          config={config}
          onUpdate={onUpdate}
        />
      )}
    </aside>
  );
}

function HttpConfig({ config, onUpdate }) {
  return (
    <div className="space-y-5 ">
      <div>
        <label className="mb-2 block text-sm font-medium">
          Method
        </label>

        <select
          value={config.method || "GET"}
          onChange={(e) =>
            onUpdate({
              method: e.target.value,
            })
          }
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white outline-none focus:border-blue-500"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          URL
        </label>

        <input
          value={config.url || ""}
          onChange={(e) =>
            onUpdate({
              url: e.target.value,
            })
          }
          placeholder="https://api.example.com"
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Body
        </label>

        <textarea
          value={config.body || ""}
          onChange={(e) =>
            onUpdate({
              body: e.target.value,
            })
          }
          placeholder='{"message":"hello"}'
          rows={5}
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}


function EmailConfig({ config, onUpdate }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium">
          To
        </label>

        <input
          value={config.to || ""}
          onChange={(e) =>
            onUpdate({
              to: e.target.value,
            })
          }
          placeholder="user@example.com"
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Subject
        </label>

        <input
          value={config.subject || ""}
          onChange={(e) =>
            onUpdate({
              subject: e.target.value,
            })
          }
          placeholder="Workflow completed"
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Message
        </label>

        <textarea
          value={config.body || ""}
          onChange={(e) =>
            onUpdate({
              body: e.target.value,
            })
          }
          placeholder="Your workflow has completed."
          rows={6}
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>
    </div>
  );
}


function ConditionConfig({ config, onUpdate }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium">
          Field
        </label>

        <input
          value={config.field || ""}
          onChange={(e) =>
            onUpdate({
              field: e.target.value,
            })
          }
          placeholder="status"
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Operator
        </label>

        <select
          value={config.operator || "equals"}
          onChange={(e) =>
            onUpdate({
              operator: e.target.value,
            })
          }
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white outline-none focus:border-blue-500"
        >
          <option value="equals">Equals</option>
          <option value="not_equals"> Not Equals </option>
          <option value="contains">Contains</option>
          <option value="greater_than"> Greater Than </option>
          <option value="less_than"> Less Than </option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Value
        </label>

        <input
          value={config.value || ""}
          onChange={(e) =>
            onUpdate({
              value: e.target.value,
            })
          }
          placeholder="success"
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>
    </div>
  );
}


function TriggerConfig({ config, onUpdate }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium">
          Trigger Type
        </label>

        <select
          value={config.triggerType || "manual"}
          onChange={(e) =>
            onUpdate({
              triggerType: e.target.value,
            })
          }
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white outline-none focus:border-blue-500"
        >
          <option value="manual">Manual</option>
          <option value="webhook">Webhook</option>
          <option value="schedule">Schedule</option>
        </select>
      </div>
    </div>
  );
}