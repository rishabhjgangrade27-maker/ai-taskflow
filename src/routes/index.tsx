import { createFileRoute } from "@tanstack/react-router";
import { TaskDashboard } from "@/components/TaskDashboard";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "ATPOS — AI Task Productivity Optimization System" },
      {
        name: "description",
        content:
          "ATPOS is a clean AI-powered productivity dashboard for prioritizing tasks, generating breakdowns, and surfacing your next best action.",
      },
    ],
  }),
});

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <TaskDashboard />
    </main>
  );
}
