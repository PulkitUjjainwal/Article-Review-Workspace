"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import { toast } from "~/components/ui/Toast";

export default function AcceptInvitePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get invitation details to show which email it was sent to
  const { data: invitationDetails } = api.member.getInvitationDetails.useQuery(
    { token },
    { enabled: !!token }
  );

  const acceptInvitation = api.member.acceptInvitation.useMutation({
    onSuccess: (data: any) => {
      toast.success("Invitation accepted! Welcome to the project.");
      // Redirect to project
      if (data?.project?.id) {
        router.push(`/project/${data.project.id}`);
      } else {
        router.push("/dashboard");
      }
    },
    onError: (error) => {
      console.error("Invitation error:", error);
      setError(error.message);
      setAccepting(false);
    },
  });

  useEffect(() => {
    // Redirect to sign in if not authenticated
    if (status === "unauthenticated") {
      // Store the token in sessionStorage to redirect back after sign in
      if (typeof window !== "undefined") {
        sessionStorage.setItem("pendingInviteToken", token);
      }
      router.push("/auth/signin");
    }

    // Automatically accept when authenticated
    if (status === "authenticated" && !accepting && !error) {
      setAccepting(true);
      acceptInvitation.mutate({ token });
    }
  }, [status, token, accepting, error]);

  const handleSignOut = async () => {
    // Store token before signing out
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pendingInviteToken", token);
    }
    await signOut({ redirect: false });
    router.push("/auth/signin");
  };

  if (status === "loading" || (accepting && !error)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <h1 className="text-2xl font-bold text-gray-900">
            {status === "loading" ? "Loading..." : "Accepting invitation..."}
          </h1>
          <p className="mt-2 text-gray-600">Please wait while we process your invitation</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    const isWrongEmailError = error.includes("different email");
    const isExpiredError = error.includes("expired");
    const isAlreadyAccepted = error.includes("already been accepted");
    const isAlreadyMember = error.includes("already a member");

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
          <div className="text-center">
            <div className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full ${isWrongEmailError ? 'bg-yellow-100' : 'bg-red-100'}`}>
              <svg
                className={`h-8 w-8 ${isWrongEmailError ? 'text-yellow-600' : 'text-red-600'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isWrongEmailError ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                )}
              </svg>
            </div>

            {isWrongEmailError ? (
              <>
                <h1 className="mb-3 text-2xl font-bold text-gray-900">Wrong Email Account</h1>
                <div className="mb-6 space-y-3 text-left">
                  <p className="text-gray-700">
                    You're currently signed in as:
                  </p>
                  <div className="rounded-lg bg-gray-100 p-3">
                    <p className="font-semibold text-gray-900">{session?.user?.email}</p>
                  </div>

                  {invitationDetails?.email && (
                    <>
                      <p className="text-gray-700">
                        But this invitation was sent to:
                      </p>
                      <div className="rounded-lg bg-blue-50 border-2 border-blue-200 p-3">
                        <p className="font-semibold text-blue-900">{invitationDetails.email}</p>
                      </div>
                    </>
                  )}

                  <p className="text-sm text-gray-600">
                    To accept this invitation, please sign out and sign in with the email address that received the invitation.
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={handleSignOut}
                    className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    Sign Out & Try Again
                  </button>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </>
            ) : isAlreadyAccepted || isAlreadyMember ? (
              <>
                <h1 className="mb-3 text-2xl font-bold text-gray-900">
                  {isAlreadyMember ? "Already a Member" : "Already Accepted"}
                </h1>
                <p className="mb-6 text-gray-600">
                  {error}
                </p>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  Go to Dashboard
                </button>
              </>
            ) : isExpiredError ? (
              <>
                <h1 className="mb-3 text-2xl font-bold text-gray-900">Invitation Expired</h1>
                <p className="mb-6 text-gray-600">
                  This invitation has expired. Please ask the project admin to resend the invitation.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="mb-3 text-2xl font-bold text-gray-900">Invitation Error</h1>
                <p className="mb-6 text-gray-600">{error}</p>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  Go to Dashboard
                  </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // This shouldn't normally be reached
  return null;
}
