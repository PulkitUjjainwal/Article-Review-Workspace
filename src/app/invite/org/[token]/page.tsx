"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import { Button } from "~/components/ui/Button";

export default function AcceptOrgInvitePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptInvitation = api.organization.acceptInvitation.useMutation({
    onSuccess: (data) => {
      if (data.requiresAuth) {
        // User needs to sign in/up first
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/invite/org/${token}`)}`);
      } else if (data.success) {
        // Success - redirect to organization
        router.push(`/org/${data.organizationSlug}`);
      }
    },
    onError: (error) => {
      setError(error.message);
      setIsAccepting(false);
    },
  });

  useEffect(() => {
    if (status === "authenticated" && token && !isAccepting && !error) {
      setIsAccepting(true);
      acceptInvitation.mutate({ token });
    } else if (status === "unauthenticated" && token && !isAccepting) {
      setIsAccepting(true);
      acceptInvitation.mutate({ token });
    }
  }, [status, token]);

  if (status === "loading" || isAccepting) {
    return (
      <LoadingSpinner
        fullScreen
        message={status === "loading" ? "Loading..." : "Accepting invitation..."}
      />
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-red-100 p-4">
                <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h1 className="mb-3 text-2xl font-bold text-gray-900">
                Invitation Error
              </h1>
              <p className="mb-6 text-gray-600">{error}</p>
              <Button
                onClick={() => router.push("/dashboard")}
                variant="primary"
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LoadingSpinner fullScreen message="Processing invitation..." />
  );
}
