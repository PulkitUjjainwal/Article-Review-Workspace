"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import { Input, Select } from "~/components/ui/Input";
import { toast } from "~/components/ui/Toast";
import { BackButton } from "~/components/ui/BackButton";
import { Button } from "~/components/ui/Button";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import { Breadcrumbs } from "~/components/ui/Breadcrumbs";

type MemberRole = "OWNER" | "ADMIN" | "MEMBER";

export default function OrganizationMembersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const { data: organization } = api.organization.getBySlug.useQuery(
    { slug },
    {
      enabled: status === "authenticated" && !!slug,
    }
  );

  const { data: members, refetch: refetchMembers } = api.organization.listMembers.useQuery(
    { organizationId: organization?.id ?? "" },
    {
      enabled: !!organization?.id,
    }
  );

  const { data: invitations, refetch: refetchInvitations } = api.organization.listInvitations.useQuery(
    { organizationId: organization?.id ?? "" },
    {
      enabled: !!organization?.id,
    }
  );

  const inviteMember = api.organization.inviteMember.useMutation({
    onSuccess: () => {
      toast.success("Invitation sent successfully!");
      setInviteEmail("");
      refetchInvitations();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeMember = api.organization.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed");
      refetchMembers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateRole = api.organization.updateMemberRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated");
      refetchMembers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const cancelInvitation = api.organization.cancelInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation canceled");
      refetchInvitations();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resendInvitation = api.organization.resendInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation resent successfully!");
      refetchInvitations();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !organization?.id) return;

    inviteMember.mutate({
      organizationId: organization.id,
      email: inviteEmail,
      role: inviteRole,
    });
  };

  const currentUserRole = members?.find(
    (m) => m.userId === session?.user?.id
  )?.role;

  const canManageMembers = currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const canChangeRoles = currentUserRole === "OWNER";

  if (status === "loading") {
    return <LoadingSpinner fullScreen message="Loading members..." />;
  }

  if (!session || !organization) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4">
            <BackButton href={`/org/${slug}`} />
          </div>
          <div className="mb-3">
            <Breadcrumbs
              items={[
                { label: organization.name, href: `/org/${slug}` },
                { label: 'Members' }
              ]}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Organization Members</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage who has access to this organization and all its projects
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Invite Member Form */}
        {canManageMembers && (
          <div className="mb-8 rounded-xl bg-white p-6 shadow-md border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">
                Invite New Member
              </h2>
            </div>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="w-full sm:w-40">
                <Select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "MEMBER")}
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </Select>
              </div>
              <Button
                type="submit"
                isLoading={inviteMember.isPending}
                variant="primary"
                className="whitespace-nowrap"
              >
                {inviteMember.isPending ? "Sending..." : "Send Invite"}
              </Button>
            </form>
            <p className="mt-3 text-sm text-gray-600 flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              An email invitation will be sent to the provided address
            </p>
          </div>
        )}

        {/* Pending Invitations */}
        {invitations && invitations.length > 0 && (
          <div className="mb-8 rounded-xl bg-white p-6 shadow-md border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">
                Pending Invitations
              </h2>
              <span className="ml-auto rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                {invitations.length}
              </span>
            </div>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4 transition-all hover:shadow-sm"
                >
                  <div className="mb-2 sm:mb-0">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {invitation.email}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Role: <span className="font-medium">{invitation.role}</span> • Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  {canManageMembers && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => resendInvitation.mutate({ invitationId: invitation.id })}
                        variant="secondary"
                        size="sm"
                        isLoading={resendInvitation.isPending}
                        title="Resend invitation email"
                      >
                        📧 Resend
                      </Button>
                      <Button
                        onClick={() => cancelInvitation.mutate({ invitationId: invitation.id })}
                        variant="danger"
                        size="sm"
                        isLoading={cancelInvitation.isPending}
                        title="Cancel invitation"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Members */}
        <div className="rounded-xl bg-white shadow-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-2">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">
                Active Members
              </h2>
              <span className="ml-auto rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                {members?.length || 0}
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {members?.map((member) => (
              <div
                key={member.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-5 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-200"
              >
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  {member.user.image ? (
                    <img
                      src={member.user.image}
                      alt={member.user.name || "User"}
                      className="h-12 w-12 rounded-full ring-2 ring-gray-200"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg ring-2 ring-gray-200 shadow-md">
                      {(member.user.name || member.user.email || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {member.user.name || "No name"}
                      {member.userId === session.user.id && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-0.5">{member.user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {canChangeRoles && member.role !== "OWNER" ? (
                    <select
                      value={member.role}
                      onChange={(e) =>
                        updateRole.mutate({
                          organizationId: organization.id,
                          userId: member.userId,
                          role: e.target.value as "ADMIN" | "MEMBER",
                        })
                      }
                      className="rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    >
                      <option value="ADMIN" className="text-gray-900">Admin</option>
                      <option value="MEMBER" className="text-gray-900">Member</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ${
                        member.role === "OWNER"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                          : member.role === "ADMIN"
                          ? "bg-blue-100 text-blue-800 ring-2 ring-blue-200"
                          : "bg-gray-100 text-gray-700 ring-2 ring-gray-200"
                      }`}
                    >
                      {member.role}
                    </span>
                  )}
                  {canManageMembers &&
                    member.role !== "OWNER" &&
                    member.userId !== session.user.id && (
                      <Button
                        onClick={() =>
                          removeMember.mutate({
                            organizationId: organization.id,
                            userId: member.userId,
                          })
                        }
                        variant="danger"
                        size="sm"
                        isLoading={removeMember.isPending}
                      >
                        Remove
                      </Button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
