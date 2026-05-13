import type { Task } from "@/utils/supabaseClient";
import { Rocket } from "lucide-react";

type Props = {
  task?: Task;
  reason?: string;
};

export function NextActionCard({ task, reason }: Props) {
  if (!task) return null;
  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-accent/40 to-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Rocket className="h-4 w-4" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
          Next Recommended Task
        </span>
      </div>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
        {task.title}
      </h2>
      {reason && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{reason}</p>
      )}
    </div>
  );
}
