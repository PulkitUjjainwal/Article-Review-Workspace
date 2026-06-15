"use client";

import { api } from "~/lib/api";
import { toast } from "~/components/ui/Toast";
import { Button } from "~/components/ui/Button";
import { useRouter } from "next/navigation";

export function PendingInvitations() {
  const router = useRouter();

  const { data: invitations, refetch } = api.member.myPendingInvitations.useQuery();

  const acceptInvitation = api.member.acceptInvitationDashboard.useMutation({
    onSuccess: (data) => {
      toast.success(`Joined ${data.project.name}!`);
      refetch();
      // Optionally redirect to project
      if (data.project?.id) {
        setTimeout(() => {
          router.push(`/project/${data.project.id}`);
        }, 1500);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const declineInvitation = api.member.declineInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation declined");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (!invitations || invitations.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-full bg-blue-600 p-2">
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">
            Project Invitations
          </h2>
          <p className="text-sm text-gray-600">
            You have {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white">
          {invitations.length}
        </span>
      </div>

      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="rounded-lg bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {invitation.project.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    invitation.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {invitation.role}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Organization:</span> {invitation.project.organization.name}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Invited by {invitation.invitedByUser?.name || invitation.invitedByUser?.email || 'Team member'}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                  </span>
                </div>

                {invitation.project.description && (
                  <p className="text-sm text-gray-600 mt-2 italic">
                    "{invitation.project.description}"
                  </p>
                )}
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => acceptInvitation.mutate({ invitationId: invitation.id })}
                  variant="primary"
                  size="sm"
                  isLoading={acceptInvitation.isPending}
                  className="flex-1 sm:flex-none"
                >
                  ✓ Accept
                </Button>
                <Button
                  onClick={() => declineInvitation.mutate({ invitationId: invitation.id })}
                  variant="secondary"
                  size="sm"
                  isLoading={declineInvitation.isPending}
                  className="flex-1 sm:flex-none"
                >
                  ✗ Decline
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
