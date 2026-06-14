import { CreateWorkspaceForm } from "@/components/dashboard/CreateWorkspaceForm";

export const metadata = { title: "New workspace" };

export default function NewWorkspacePage() {
  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <h1 className="font-display text-2xl font-semibold text-ink">
        Create a workspace
      </h1>
      <p className="mt-1 text-sm text-muted">
        A workspace holds your apps, API keys, pairings, and team. You can make
        more than one.
      </p>
      <div className="card mt-6 p-6">
        <CreateWorkspaceForm />
      </div>
    </div>
  );
}
