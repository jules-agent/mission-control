import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./api/auth/auth-options";
import { SpaceXHeader } from "./components/SpaceXHeader";
import { StatusPanel } from "./components/StatusPanel";
import { TasksPanel } from "./components/TasksPanel";
import { ModelWorkflowPanel } from "./components/ModelWorkflowPanel";
import { ApiUsagePanel } from "./components/ApiUsagePanel";
import { AutomationPanel } from "./components/AutomationPanel";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen px-4 py-4">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        {/* SpaceX-style Mission Control header */}
        <SpaceXHeader />
        
        {/* Model workflow - full width row */}
        <ModelWorkflowPanel />
        
        {/* API Usage + System Status side by side */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ApiUsagePanel />
          <StatusPanel />
        </div>
        
        {/* Automation Schedule - full width */}
        <AutomationPanel />
        
        {/* Tasks panel - full width */}
        <TasksPanel />
      </div>
    </main>
  );
}
