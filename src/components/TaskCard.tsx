import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { AIResults, Task } from "@/utils/supabaseClient";
import { Clock, Calendar, Trash2 } from "lucide-react";

type AiBits = {
  priority?: string;
  summary?: string;
  steps?: string[];
  suggestedDeadline?: string;
  estimateMinutes?: number;
};

type Props = {
  task: Task;
  onDelete: (id: string) => void;
  onToggle: (id: string, next: boolean) => void;
  ai?: AiBits;
};

const priorityStyles: Record<string, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

export function formatDeadline(d?: string | null) {
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

function formatCreated(d: string) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function TaskCard({ task, onDelete, onToggle, ai }: Props) {
  const priorityKey = ai?.priority?.toLowerCase?.() ?? "";
  const priorityCls = priorityStyles[priorityKey] ?? "bg-muted text-muted-foreground border-border";
  const hasAI = !!(ai?.summary || ai?.steps?.length || ai?.suggestedDeadline || ai?.estimateMinutes != null);

  return (
    <div
      className={`rounded-xl border bg-card shadow-[var(--shadow-card)] transition-opacity ${
        task.is_completed ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <input
          type="checkbox"
          checked={task.is_completed}
          onChange={(e) => onToggle(task.id, e.target.checked)}
          className="mt-1 h-4 w-4 cursor-pointer rounded border-border accent-[var(--color-primary)]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`text-sm font-semibold text-foreground ${task.is_completed ? "line-through" : ""}`}>
              {task.title}
            </h3>
            {ai?.priority && (
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priorityCls}`}>
                {ai.priority}
              </span>
            )}
          </div>
          {task.description && (
            <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDeadline(task.deadline)}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {task.estimated_duration_minutes} min</span>
            <span className="text-[11px] text-muted-foreground/80">Added {formatCreated(task.created_at)}</span>
          </div>
        </div>
        <button
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
          className="rounded-md border border-transparent p-1.5 text-muted-foreground transition-colors hover:border-border hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {hasAI && (
        <div className="border-t px-4 pb-2">
          <Accordion type="multiple" className="w-full">
            {ai?.summary && (
              <AccordionItem value="summary">
                <AccordionTrigger className="py-3 text-xs font-medium">Summary</AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground">{ai.summary}</AccordionContent>
              </AccordionItem>
            )}
            {ai?.steps && ai.steps.length > 0 && (
              <AccordionItem value="breakdown">
                <AccordionTrigger className="py-3 text-xs font-medium">Breakdown</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                    {ai.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
            {ai?.suggestedDeadline && (
              <AccordionItem value="deadline">
                <AccordionTrigger className="py-3 text-xs font-medium">Suggested Deadline</AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground">
                  {formatDeadline(ai.suggestedDeadline)}
                </AccordionContent>
              </AccordionItem>
            )}
            {ai?.estimateMinutes != null && (
              <AccordionItem value="estimation">
                <AccordionTrigger className="py-3 text-xs font-medium">Estimation</AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {ai.estimateMinutes} minutes</span>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      )}
    </div>
  );
}

export function buildAiIndex(results: AIResults | null) {
  const idx: Record<string, AiBits> = {};
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

export const PRIORITY_ORDER: Record<string, number> = { high: 1, medium: 2, low: 3 };
