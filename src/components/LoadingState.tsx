export function TaskSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-4 w-4 animate-pulse rounded bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted/70" />
              <div className="flex gap-2 pt-1">
                <div className="h-3 w-20 animate-pulse rounded bg-muted/60" />
                <div className="h-3 w-16 animate-pulse rounded bg-muted/60" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border bg-card/50 px-4 py-8 text-sm text-muted-foreground">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
      {label}
    </div>
  );
}
