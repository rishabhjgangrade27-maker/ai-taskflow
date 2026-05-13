import { useState, type FormEvent } from "react";

export type TaskInput = {
  title: string;
  description: string;
  deadline: string;
  estimated_duration_minutes: number;
};

type Props = {
  onAdd: (task: TaskInput) => Promise<void> | void;
};

export function TaskForm({ onAdd }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [duration, setDuration] = useState<string>("30");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    const trimmed = title.trim();
    const mins = Number(duration);
    if (!trimmed) return setErr("Title is required.");
    if (!Number.isFinite(mins) || mins <= 0)
      return setErr("Duration must be greater than 0.");

    setSubmitting(true);
    try {
      await onAdd({
        title: trimmed,
        description: description.trim(),
        deadline: deadline || "",
        estimated_duration_minutes: Math.round(mins),
      });
      setTitle("");
      setDescription("");
      setDeadline("");
      setDuration("30");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to add task.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]"
    >
      <h2 className="text-base font-semibold text-foreground">Add a task</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Capture work, then let AI prioritize it.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-foreground">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Draft project proposal"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-foreground">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional details"
            className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Deadline</label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">
            Estimated duration (min)
          </label>
          <input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
      </div>

      {err && (
        <p className="mt-3 text-xs text-destructive">{err}</p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? "Adding…" : "Add Task"}
        </button>
      </div>
    </form>
  );
}
