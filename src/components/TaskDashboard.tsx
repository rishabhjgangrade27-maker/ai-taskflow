import { useEffect, useMemo, useState } from "react";
import { supabase, type AIResults, type Task } from "@/utils/supabaseClient";
import { TaskForm, type TaskInput } from "./TaskForm";
import { TaskCard, buildAiIndex, PRIORITY_ORDER } from "./TaskCard";
import { EmptyState } from "./EmptyState";
import { LoadingState, TaskSkeleton } from "./LoadingState";
import { NextActionCard } from "./NextActionCard";
import { Sparkles } from "lucide-react";

export function TaskDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [aiResults, setAiResults] = useState<AIResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTasks((data ?? []) as Task[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const addTask = async (input: TaskInput) => {
    const payload = {
      title: input.title,
      description: input.description || null,
      deadline: input.deadline ? new Date(input.deadline).toISOString() : null,
      estimated_duration_minutes: input.estimated_duration_minutes,
      is_completed: false,
    };
    const { data, error } = await supabase.from("tasks").insert(payload).select().single();
    if (error) throw new Error(error.message);
    if (data) setTasks((prev) => [data as Task, ...prev]);
  };

  const deleteTask = async (id: string) => {
    const prev = tasks;
    setTasks((p) => p.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      setTasks(prev);
      setError(error.message);
    }
  };

  const toggleTask = async (id: string, next: boolean) => {
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, is_completed: next } : t)));
    const { error } = await supabase.from("tasks").update({ is_completed: next }).eq("id", id);
    if (error) setError(error.message);
  };

  const processWithAI = async () => {
    if (!tasks.length) return;
    setProcessing(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("process-tasks", {
        body: { tasks },
      });
      if (error) throw new Error(error.message);
      if (!data || typeof data !== "object") throw new Error("AI returned an empty response.");
      setAiResults(data as AIResults);
    } catch (e) {
      setAiResults(null);
      setError(e instanceof Error ? `AI processing failed: ${e.message}` : "AI processing failed.");
    } finally {
      setProcessing(false);
    }
  };

  const aiIndex = useMemo(() => buildAiIndex(aiResults), [aiResults]);

  const sortedActive = useMemo(() => {
    const active = tasks.filter((t) => !t.is_completed);
    return [...active].sort((a, b) => {
      const pa = PRIORITY_ORDER[aiIndex[a.id]?.priority?.toLowerCase?.() ?? ""] ?? 99;
      const pb = PRIORITY_ORDER[aiIndex[b.id]?.priority?.toLowerCase?.() ?? ""] ?? 99;
      if (pa !== pb) return pa - pb;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [tasks, aiIndex]);

  const done = tasks.filter((t) => t.is_completed);

  const nextActionId = aiResults?.next_action?.id;
  const nextActionTask = nextActionId ? tasks.find((t) => t.id === nextActionId) : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            A
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ATPOS</p>
            <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
              AI Task Productivity Dashboard
            </h1>
          </div>
        </div>
        <button
          onClick={processWithAI}
          disabled={processing || tasks.length === 0}
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        >
          {processing ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
              Processing…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Process Tasks with AI
            </>
          )}
        </button>
      </header>

      {error && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {nextActionTask && (
        <div className="mb-8">
          <NextActionCard task={nextActionTask} reason={aiResults?.next_action?.reason} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <TaskForm onAdd={addTask} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Your tasks{" "}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({sortedActive.length} active{done.length ? ` · ${done.length} done` : ""})
              </span>
            </h2>
            {aiResults && (
              <span className="text-[11px] text-muted-foreground">Sorted by AI priority</span>
            )}
          </div>

          {loading ? (
            <LoadingState label="Loading tasks…" />
          ) : tasks.length === 0 ? (
            <EmptyState />
          ) : processing ? (
            <TaskSkeleton />
          ) : (
            <div className="space-y-3">
              {sortedActive.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDelete={deleteTask}
                  onToggle={toggleTask}
                  ai={aiIndex[task.id]}
                />
              ))}
              {done.length > 0 && (
                <div className="pt-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Completed
                  </p>
                  <div className="space-y-3">
                    {done.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onDelete={deleteTask}
                        onToggle={toggleTask}
                        ai={aiIndex[task.id]}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
