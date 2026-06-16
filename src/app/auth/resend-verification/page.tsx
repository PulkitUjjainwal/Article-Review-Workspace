"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";
import { toast } from "~/components/ui/Toast";
import { api } from "~/lib/api";

const ResendVerificationPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const resendVerificationMutation = api.auth.resendVerificationEmail.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send verification email. Please try again.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    resendVerificationMutation.mutate({ email });
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            {/* Success Icon */}
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-green-100 p-4">
                <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center">
              <h1 className="mb-3 text-2xl font-bold text-gray-900">
                Check Your Email
              </h1>
              <p className="mb-6 text-gray-600">
                A new verification link has been sent to <strong>{email}</strong>.
              </p>
              <p className="mb-8 text-sm text-gray-500">
                Didn't receive an email? Check your spam folder or try again in a few minutes.
              </p>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => setIsSubmitted(false)}
                >
                  Try Another Email
                </Button>
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-4 shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Resend Verification Email
            </h1>
            <p className="text-gray-600">
              Enter your email to receive a new verification link
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={resendVerificationMutation.isPending}
              disabled={resendVerificationMutation.isPending || !email}
            >
              {resendVerificationMutation.isPending ? "Sending..." : "Send Verification Link"}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <Link href="/auth/signin" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResendVerificationPage;
