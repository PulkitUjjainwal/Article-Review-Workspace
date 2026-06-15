"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import { Input, TextArea } from "~/components/ui/Input";
import { WelcomeTour } from "~/components/WelcomeTour";
import { Button } from "~/components/ui/Button";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import { EmptyState } from "~/components/ui/EmptyState";
import { PendingInvitations } from "~/components/PendingInvitations";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Show welcome tour for first-time users
  useEffect(() => {
    if (status === "authenticated") {
      const hasSeenTour = localStorage.getItem("hasSeenWelcomeTour");
      if (!hasSeenTour) {
        setShowWelcomeTour(true);
      }
    }
  }, [status]);

  const { data: organizations, isLoading } = api.organization.list.useQuery(
    undefined,
    {
      enabled: status === "authenticated",
    }
  );

  if (status === "loading" || isLoading) {
    return <LoadingSpinner fullScreen message="Loading your workspace..." />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Article Review Workspace
              </h1>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Welcome back, <span className="font-semibold">{session.user?.name ?? session.user?.email}</span>
              </p>
            </div>
            <Button
              onClick={() => router.push("/api/auth/signout")}
              variant="secondary"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Pending Invitations */}
        <PendingInvitations />

        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Your Organizations
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your research organizations and teams
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Organization
          </Button>
        </div>

        {/* Organizations Grid */}
        {organizations && organizations.length === 0 ? (
          <EmptyState
            icon={
              <svg className="h-20 w-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            title="No organizations yet"
            description="Get started by creating your first organization to manage your systematic literature reviews"
            action={{
              label: "Create Your First Organization",
              onClick: () => setShowCreateModal(true)
            }}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {organizations?.map((org) => (
              <div
                key={org.id}
                onClick={() => router.push(`/org/${org.slug}`)}
                className="group cursor-pointer rounded-xl border-2 border-gray-200 bg-white p-6 shadow-md transition-all hover:shadow-xl hover:border-blue-300 hover:-translate-y-1"
              >
                <div className="mb-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-3 shadow-md">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                      org.userRole === "OWNER"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                        : org.userRole === "ADMIN"
                        ? "bg-blue-100 text-blue-800 ring-2 ring-blue-200"
                        : "bg-gray-100 text-gray-700 ring-2 ring-gray-200"
                    }`}>
                      {org.userRole}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {org.name}
                  </h3>
                  {org.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {org.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span className="font-medium">{org.projectCount}</span> projects
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="font-medium">{org.memberCount}</span> members
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Organization Modal */}
      {showCreateModal && (
        <CreateOrganizationModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Welcome Tour */}
      {showWelcomeTour && (
        <WelcomeTour
          onComplete={() => {
            setShowWelcomeTour(false);
            localStorage.setItem("hasSeenWelcomeTour", "true");
          }}
        />
      )}
    </div>
  );
}

function CreateOrganizationModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const utils = api.useUtils();
  const router = useRouter();

  const createOrg = api.organization.create.useMutation({
    onSuccess: (data) => {
      utils.organization.list.invalidate();
      router.push(`/org/${data.slug}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrg.mutate({ name, description });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl animate-slideUp">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-3 shadow-md">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Create Organization
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="name"
            type="text"
            label="Organization Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Acme Research Lab"
            autoFocus
          />
          <TextArea
            id="description"
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief description of your organization"
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createOrg.isPending}
              className="flex-1"
            >
              {createOrg.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
