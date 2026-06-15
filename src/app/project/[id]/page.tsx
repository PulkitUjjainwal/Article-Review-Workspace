"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { api } from "~/lib/api";
import { ReviewStatsChart } from "~/components/ReviewStatsChart";
import { BackButton } from "~/components/ui/BackButton";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import { Button } from "~/components/ui/Button";

export default function ProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const { data: project, isLoading: projectLoading } =
    api.project.getById.useQuery(
      { projectId },
      {
        enabled: status === "authenticated" && !!projectId,
      }
    );

  const { data: stats, isLoading: statsLoading } =
    api.project.getStats.useQuery(
      { projectId },
      {
        enabled: status === "authenticated" && !!projectId,
      }
    );

  const isLoading = projectLoading || statsLoading;

  if (status === "loading" || isLoading) {
    return <LoadingSpinner fullScreen message="Loading project..." />;
  }

  if (!session || !project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4">
            <BackButton href={`/org/${project.organization.slug}`} />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">
                {project.organization.name}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-sm text-gray-600 max-w-2xl">{project.description}</p>
              )}
            </div>
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md ring-2 ring-blue-200">
              {project.userRole}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Articles"
            value={stats?.total ?? 0}
            color="bg-blue-100 text-blue-800"
          />
          <StatCard
            label="Pending Review"
            value={stats?.pending ?? 0}
            color="bg-gray-100 text-gray-800"
          />
          <StatCard
            label="Included"
            value={stats?.included ?? 0}
            color="bg-green-100 text-green-800"
          />
          <StatCard
            label="Excluded"
            value={stats?.excluded ?? 0}
            color="bg-red-100 text-red-800"
          />
        </div>

        {/* Statistics Chart */}
        {stats && stats.total > 0 && (
          <div className="mb-8">
            <ReviewStatsChart stats={stats} />
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex gap-2 bg-white rounded-xl p-2 shadow-md border border-gray-200">
            <button className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all">
              <div className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Overview
              </div>
            </button>
            <button
              onClick={() => router.push(`/project/${projectId}/articles`)}
              className="flex-1 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Articles
              </div>
            </button>
            <button
              onClick={() => router.push(`/project/${projectId}/import`)}
              className="flex-1 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Import
              </div>
            </button>
            <button
              onClick={() => router.push(`/project/${projectId}/members`)}
              className="flex-1 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Members
              </div>
            </button>
          </nav>
        </div>

        {/* Content Area */}
        {stats && stats.total === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-16 text-center shadow-md">
            <div className="mb-6 rounded-full bg-blue-100 p-6">
              <svg className="h-16 w-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mb-2 text-2xl font-bold text-gray-900">
              No articles yet
            </h3>
            <p className="mb-8 max-w-md text-gray-600">
              Import articles to start your systematic literature review process
            </p>
            <Button
              onClick={() => router.push(`/project/${projectId}/import`)}
              variant="primary"
              size="lg"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import Articles
            </Button>
          </div>
        ) : (
          <div className="rounded-xl bg-white p-8 shadow-md border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900">
                Project Members
              </h3>
            </div>
            <div className="space-y-3">
              {project.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-semibold text-white shadow-md">
                      {member.user.name?.[0] ?? member.user.email?.[0] ?? "?"}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {member.user.name ?? member.user.email}
                      </div>
                      {member.user.email && member.user.name && (
                        <div className="text-sm text-gray-600">
                          {member.user.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                    member.role === "OWNER"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                      : member.role === "ADMIN"
                      ? "bg-blue-100 text-blue-800 ring-2 ring-blue-200"
                      : "bg-gray-100 text-gray-700 ring-2 ring-gray-200"
                  }`}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-2xl font-bold ${color} shadow-sm`}>
          {value}
        </div>
      </div>
      <div className="text-sm font-medium text-gray-600 mt-3">{label}</div>
    </div>
  );
}
