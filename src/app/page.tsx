import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./api/auth/auth-options";
import { DashboardHeader } from "./components/DashboardHeader";
import { StatusPanel } from "./components/StatusPanel";
import { TasksPanel } from "./components/TasksPanel";
import { ModelWorkflowPanel } from "./components/ModelWorkflowPanel";
import { ApiUsagePanel } from "./components/ApiUsagePanel";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <DashboardHeader />
        
        {/* Top row: compact panels */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ModelWorkflowPanel />
          <ApiUsagePanel />
          <StatusPanel />
        </div>
        
        {/* Bottom row: tasks (full width) */}
        <TasksPanel />
      </div>
    </main>
  );
}
