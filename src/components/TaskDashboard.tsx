import { useEffect, useMemo, useState } from "react";
import { supabase, type AIResults, type Task } from "@/utils/supabaseClient";
import { TaskForm, type TaskInput } from "./TaskForm";
import { TaskCard, buildAiIndex } from "./TaskCard";
import { EmptyState } from "./EmptyState";
import { LoadingState } from "./LoadingState";
import { NextActionCard } from "./NextActionCard";

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
    const { data, error } = await supabase
      .from("tasks")
      .insert(payload)
      .select()
      .single();
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
    const { error } = await supabase
      .from("tasks")
      .update({ is_completed: next })
      .eq("id", id);
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
      if (!data || typeof data !== "object") {
        throw new Error("AI returned an empty response.");
      }
      setAiResults(data as AIResults);
    } catch (e) {
      setAiResults(null);
      setError(
        e instanceof Error
          ? `AI processing failed: ${e.message}`
          : "AI processing failed. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  const aiIndex = useMemo(() => buildAiIndex(aiResults), [aiResults]);
  const active = tasks.filter((t) => !t.is_completed);
  const done = tasks.filter((t) => t.is_completed);

  const nextActionId = aiResults?.next_action?.id;
  const nextActionTask = nextActionId ? tasks.find((t) => t.id === nextActionId) : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
      <header className="mb-8 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            A
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">ATPOS</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          AI Task Productivity Optimization
        </h1>
        <p className="text-sm text-muted-foreground">
          A focused workspace to capture tasks and get AI prioritization, summaries, and next actions.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <TaskForm onAdd={addTask} />
          <div className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">AI Assistant</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Process your tasks for priorities, breakdowns, and the best next action.
                </p>
              </div>
              <button
                onClick={processWithAI}
                disabled={processing || tasks.length === 0}
                className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                    Processing…
                  </>
                ) : (
                  "Process Tasks with AI"
                )}
              </button>
            </div>
            {nextActionTask && (
              <div className="mt-4">
                <NextActionCard task={nextActionTask} reason={aiResults?.next_action?.reason} />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Your tasks{" "}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({active.length} active{done.length ? ` · ${done.length} done` : ""})
              </span>
            </h2>
          </div>

          {loading ? (
            <LoadingState label="Loading tasks…" />
          ) : tasks.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {active.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDelete={deleteTask}
                  onToggle={toggleTask}
                  ai={aiIndex[task.id]}
                />
              ))}
              {done.length > 0 && (
                <div className="pt-2">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
