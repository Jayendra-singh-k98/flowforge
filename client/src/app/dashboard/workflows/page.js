"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getWorkflows, deleteWorkflow, getWorkflowExecutions } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const ACTIVE_STATUSES = ["running", "queued", "pending"];

export default function WorkflowsPage() {
  const toast = useToast();

  const [workflows, setWorkflows] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getWorkflows();
        const loaded = response?.data?.workflows || [];
        setWorkflows(loaded);

        // Derive each workflow's real status from its latest execution
        const withStatus = await Promise.all(
          loaded.map(async (workflow) => {
            try {
              const execRes = await getWorkflowExecutions(workflow._id);
              const executions = execRes?.data?.executions || [];
              const latest = executions[0]; // your API already returns newest first

              if (!latest) return { ...workflow, displayStatus: "draft" };

              if (ACTIVE_STATUSES.includes(latest.status)) {
                return { ...workflow, displayStatus: "running" };
              }
              if (latest.status === "failed") {
                return { ...workflow, displayStatus: "failed" };
              }
              return { ...workflow, displayStatus: "completed" };
            } catch {
              return { ...workflow, displayStatus: "draft" };
            }
          })
        );

        setWorkflows(withStatus);
      } catch (error) {
        console.error("Load workflows error:", error);
        setError(error.message || "Failed to load workflows.");
      } finally {
        setLoading(false);
      }
    };

    loadWorkflows();
  }, []);

  const requestDelete = (event, workflow) => {
    event.preventDefault();
    event.stopPropagation();
    setConfirmTarget({ id: workflow._id, name: workflow.name });
  };

  const confirmDelete = async () => {
    if (!confirmTarget) return;
    const workflowId = confirmTarget.id;

    try {
      setDeletingId(workflowId);
      await deleteWorkflow(workflowId);
      setWorkflows((current) => current.filter((w) => w._id !== workflowId));
      toast.success("Workflow deleted.");
    } catch (error) {
      console.error("Delete workflow error:", error);
      toast.error(error.message || "Failed to delete workflow.");
    } finally {
      setDeletingId(null);
      setConfirmTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto max-w-7xl p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="mt-2 text-slate-400">Manage your workflows and automation.</p>
        </div>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">My Workflows</h3>
              <p className="text-sm text-slate-400">Create and manage your automation workflows.</p>
            </div>
            <Link
              href="/dashboard/workflows/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium transition hover:bg-blue-700"
            >
              + New Workflow
            </Link>
          </div>

          {loading && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
              Loading workflows...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-900 bg-red-950/30 p-6 text-center">
              <p className="text-red-400">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && workflows.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
              <h4 className="text-lg font-semibold">No workflows yet</h4>
              <p className="mt-2 text-sm text-slate-400">Create your first workflow to get started.</p>
              <Link
                href="/dashboard/workflows/new"
                className="mt-5 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
              >
                + Create Workflow
              </Link>
            </div>
          )}

          {!loading && !error && workflows.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {workflows.map((workflow) => (
                <WorkflowCard
                  key={workflow._id}
                  name={workflow.name}
                  status={workflow.displayStatus || workflow.status}
                  workflowId={workflow._id}
                  onDelete={(event) => requestDelete(event, workflow)}
                  deleting={deletingId === workflow._id}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete workflow?"
        description={confirmTarget ? `"${confirmTarget.name}" will be permanently deleted. This can't be undone.` : ""}
        confirmLabel="Delete"
        danger
        loading={!!deletingId}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

function WorkflowCard({ name, status, workflowId, onDelete, deleting }) {
  const statusConfig = {
    completed: { dot: "bg-green-400", pill: "bg-green-500/10 text-green-400" },
    running: { dot: "bg-blue-400 animate-pulse", pill: "bg-blue-500/10 text-blue-400" },
    failed: { dot: "bg-red-400", pill: "bg-red-500/10 text-red-400" },
    draft: { dot: "bg-slate-500", pill: "bg-slate-800 text-slate-400" },
  };
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900 hover:shadow-xl hover:shadow-black/20">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/0 blur-2xl transition-colors duration-300 group-hover:bg-blue-500/10" />

      <div className="relative">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h4 className="min-w-0 truncate text-base font-semibold text-white">{name}</h4>

          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${config.pill}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
            {status}
          </span>
        </div>

        <p className="mb-5 text-xs text-slate-500">Workflow ID: {workflowId?.slice(-8)}</p>

        <div className="mb-4 h-px w-full bg-slate-800" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/workflows/${workflowId}`} className="inline-flex items-center gap-1 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300">
              Open
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>

            <Link href={`/dashboard/workflows/${workflowId}/executions`} className="inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-200">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Executions
            </Link>
          </div>

          <button
            onClick={onDelete}
            disabled={deleting}
            className="rounded-lg px-2.5 py-1.5 text-sm text-red-400/80 transition-colors hover:bg-red-950/50 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}