import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./api/auth/auth-options";
import { DashboardHeader } from "./components/DashboardHeader";
import { StatusPanel } from "./components/StatusPanel";
import { TasksPanel } from "./components/TasksPanel";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <DashboardHeader />
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="lg:w-1/2">
            <StatusPanel />
          </div>
          <div className="lg:w-1/2">
            <TasksPanel />
          </div>
        </div>
      </div>
    </main>
  );
}
