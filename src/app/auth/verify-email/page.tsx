"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/Button";
import { toast } from "~/components/ui/Toast";
import { api } from "~/lib/api";

const VerifyEmailForm = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const checkTokenQuery = api.auth.checkVerificationToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const verifyEmailMutation = api.auth.verifyEmail.useMutation({
    onSuccess: () => {
      toast.success("Email verified successfully!");
      setIsSuccess(true);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to verify email. Please try again.");
    },
  });

  // Auto-verify when component mounts with valid token
  useEffect(() => {
    if (token && checkTokenQuery.data?.valid && !verifyEmailMutation.isPending && !isSuccess) {
      verifyEmailMutation.mutate({ token });
    }
  }, [token, checkTokenQuery.data?.valid]);

  // Show error if token is invalid
  if (!token || (checkTokenQuery.data && !checkTokenQuery.data.valid)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            {/* Error Icon */}
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-red-100 p-4">
                <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            {/* Error Message */}
            <div className="text-center">
              <h1 className="mb-3 text-2xl font-bold text-gray-900">
                Invalid or Expired Link
              </h1>
              <p className="mb-8 text-gray-600">
                This verification link is invalid or has expired. Please request a new one.
              </p>

              <div className="space-y-3">
                <Link href="/auth/resend-verification" className="block">
                  <Button variant="primary" className="w-full">
                    Request New Verification Link
                  </Button>
                </Link>
                <Link href="/auth/signin" className="block">
                  <Button variant="secondary" className="w-full">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success screen
  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            {/* Success Icon */}
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-green-100 p-4">
                <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center">
              <h1 className="mb-3 text-2xl font-bold text-gray-900">
                Email Verified Successfully!
              </h1>
              <p className="mb-8 text-gray-600">
                Your email has been verified. You can now sign in and start collaborating on research projects.
              </p>

              <Link href="/auth/signin">
                <Button variant="primary" className="w-full">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while verifying
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <div className="text-lg text-gray-600">Verifying your email...</div>
      </div>
    </div>
  );
};

const VerifyEmailPage = () => {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
};

export default VerifyEmailPage;
