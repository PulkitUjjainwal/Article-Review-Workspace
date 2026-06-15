"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import { Input, TextArea } from "~/components/ui/Input";

export default function OrganizationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [showCreateProject, setShowCreateProject] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const { data: organization, isLoading } = api.organization.getBySlug.useQuery(
    { slug },
    {
      enabled: status === "authenticated" && !!slug,
    }
  );

  const { data: projects } = api.project.listByOrganization.useQuery(
    { organizationId: organization?.id ?? "" },
    {
      enabled: !!organization?.id,
    }
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!session || !organization) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {organization.name}
                </h1>
                {organization.description && (
                  <p className="text-sm text-gray-600">
                    {organization.description}
                  </p>
                )}
              </div>
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              {organization.userRole}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">
              {projects?.length ?? 0}
            </div>
            <div className="text-sm text-gray-600">Projects</div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">
              {organization.members.length}
            </div>
            <div className="text-sm text-gray-600">Members</div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">
              {projects?.reduce((sum, p) => sum + (p.articleCount ?? 0), 0) ?? 0}
            </div>
            <div className="text-sm text-gray-600">Total Articles</div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
          <button
            onClick={() => setShowCreateProject(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Create Project
          </button>
        </div>

        {projects && projects.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No projects yet
            </h3>
            <p className="mb-4 text-gray-600">
              Create a project to start reviewing articles
            </p>
            <button
              onClick={() => setShowCreateProject(true)}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects?.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/project/${project.id}`)}
                className="cursor-pointer rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {project.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex gap-4 text-gray-600">
                    <span>{project.articleCount ?? 0} articles</span>
                    <span>{project.memberCount ?? 0} members</span>
                  </div>
                  {project.userRole && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                      {project.userRole}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateProject && organization && (
        <CreateProjectModal
          organizationId={organization.id}
          onClose={() => setShowCreateProject(false)}
        />
      )}
    </div>
  );
}

function CreateProjectModal({
  organizationId,
  onClose,
}: {
  organizationId: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const utils = api.useUtils();
  const router = useRouter();

  const createProject = api.project.create.useMutation({
    onSuccess: (data) => {
      utils.project.listByOrganization.invalidate();
      router.push(`/project/${data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject.mutate({ organizationId, name, description });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          Create Project
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            type="text"
            label="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="COVID-19 Vaccine Efficacy Review"
            autoFocus
          />
          <TextArea
            id="description"
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Systematic review of COVID-19 vaccine efficacy studies"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createProject.isPending}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createProject.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
