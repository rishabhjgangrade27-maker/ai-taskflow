import type { Task } from "@/utils/supabaseClient";

type Props = {
  task?: Task;
  reason?: string;
};

export function NextActionCard({ task, reason }: Props) {
  if (!task) return null;
  return (
    <div className="rounded-xl border bg-gradient-to-b from-accent/60 to-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          Next action
        </span>
        <span className="text-xs text-muted-foreground">AI recommended</span>
      </div>
      <h3 className="mt-2 text-base font-semibold text-foreground">{task.title}</h3>
      {reason && <p className="mt-1 text-sm text-muted-foreground">{reason}</p>}
    </div>
  );
}
