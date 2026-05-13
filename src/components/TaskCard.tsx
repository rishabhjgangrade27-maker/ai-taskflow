import type { AIResults, Task } from "@/utils/supabaseClient";

type Props = {
  task: Task;
  onDelete: (id: string) => void;
  onToggle: (id: string, next: boolean) => void;
  ai?: {
    priority?: string;
    summary?: string;
    steps?: string[];
    suggestedDeadline?: string;
    estimateMinutes?: number;
  };
};

const priorityStyles: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  low: "bg-success/10 text-success border-success/20",
};

function formatDeadline(d: string | null) {
  if (!d) return "No deadline";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TaskCard({ task, onDelete, onToggle, ai }: Props) {
  const priorityKey = ai?.priority?.toLowerCase?.() ?? "";
  const priorityCls = priorityStyles[priorityKey] ?? "bg-muted text-muted-foreground border-border";

  return (
    <div
      className={`rounded-xl border bg-card p-4 shadow-[var(--shadow-card)] transition-opacity ${
        task.is_completed ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={task.is_completed}
          onChange={(e) => onToggle(task.id, e.target.checked)}
          className="mt-1 h-4 w-4 cursor-pointer rounded border-border accent-[var(--color-primary)]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`text-sm font-semibold text-foreground ${
                task.is_completed ? "line-through" : ""
              }`}
            >
              {task.title}
            </h3>
            {ai?.priority && (
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${priorityCls}`}
              >
                {ai.priority}
              </span>
            )}
          </div>
          {task.description && (
            <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>📅 {formatDeadline(task.deadline)}</span>
            <span>⏱ {task.estimated_duration_minutes} min</span>
            {ai?.estimateMinutes != null && ai.estimateMinutes !== task.estimated_duration_minutes && (
              <span className="text-primary">AI est: {ai.estimateMinutes} min</span>
            )}
            {ai?.suggestedDeadline && (
              <span className="text-primary">
                AI deadline: {formatDeadline(ai.suggestedDeadline)}
              </span>
            )}
          </div>

          {(ai?.summary || (ai?.steps && ai.steps.length > 0)) && (
            <div className="mt-3 rounded-md border bg-accent/40 p-3">
              {ai?.summary && (
                <p className="text-xs text-foreground">
                  <span className="font-medium">Summary: </span>
                  {ai.summary}
                </p>
              )}
              {ai?.steps && ai.steps.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-foreground">Suggested steps</p>
                  <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-xs text-muted-foreground">
                    {ai.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
          className="rounded-md border border-transparent p-1.5 text-muted-foreground transition-colors hover:border-border hover:text-destructive"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function buildAiIndex(results: AIResults | null) {
  const idx: Record<string, NonNullable<Props["ai"]>> = {};
  if (!results) return idx;
  for (const p of results.priority ?? []) {
    if (!p?.id) continue;
    idx[p.id] = { ...(idx[p.id] ?? {}), priority: p.priority };
  }
  for (const s of results.summaries ?? []) {
    if (!s?.id) continue;
    idx[s.id] = { ...(idx[s.id] ?? {}), summary: s.summary };
  }
  for (const b of results.breakdowns ?? []) {
    if (!b?.id) continue;
    idx[b.id] = { ...(idx[b.id] ?? {}), steps: Array.isArray(b.steps) ? b.steps : [] };
  }
  for (const d of results.deadlines ?? []) {
    if (!d?.id) continue;
    idx[d.id] = { ...(idx[d.id] ?? {}), suggestedDeadline: d.suggested_deadline };
  }
  for (const e of results.estimations ?? []) {
    if (!e?.id) continue;
    idx[e.id] = { ...(idx[e.id] ?? {}), estimateMinutes: e.minutes };
  }
  return idx;
}
