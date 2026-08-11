import type { CurrentSession } from "@/lib/auth/session";
import { WorkspaceNav } from "@/components/workspace-nav";

type WorkspaceShellProps = {
  children: React.ReactNode;
  session: CurrentSession;
};

export function WorkspaceShell({ children, session }: WorkspaceShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <WorkspaceNav session={session} />
      <main className="lg:pl-72">
        <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
