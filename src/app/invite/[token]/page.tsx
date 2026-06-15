"use client";

import { useSession } from "next-auth/react";
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
      toast.error(error.message);
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
    if (status === "authenticated" && !accepting) {
      setAccepting(true);
      acceptInvitation.mutate({ token });
    }
  }, [status, token, accepting]);

  if (status === "loading" || accepting) {
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Invitation Error</h1>
          <p className="mb-6 text-gray-600">
            There was a problem accepting your invitation. Please contact the person who
            invited you for a new invitation link.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
