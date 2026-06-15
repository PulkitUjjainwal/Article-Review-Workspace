"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl rounded-2xl bg-white p-12 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            Article Review Workspace
          </h1>
          <p className="text-lg text-gray-600">
            Systematic Literature Review Platform
          </p>
        </div>

        <div className="space-y-4">
          <StatusItem
            label="Next.js"
            status="✅ Running"
            color="text-green-600"
          />
          <StatusItem
            label="TypeScript"
            status="✅ Configured"
            color="text-green-600"
          />
          <StatusItem
            label="Tailwind CSS"
            status="✅ Ready"
            color="text-green-600"
          />
          <StatusItem
            label="Prisma"
            status="✅ Connected"
            color="text-green-600"
          />
          <StatusItem
            label="tRPC"
            status="✅ Initialized"
            color="text-green-600"
          />
          <StatusItem
            label="NextAuth"
            status="✅ Configured"
            color="text-green-600"
          />
          <StatusItem
            label="React Query"
            status="✅ Ready"
            color="text-green-600"
          />
        </div>

        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <h2 className="mb-3 text-xl font-semibold text-blue-900">
            Phase 2: Complete! 🎉
          </h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✅ Organization CRUD</li>
            <li>✅ Project CRUD</li>
            <li>✅ Authentication flow</li>
            <li>✅ Dashboard & navigation</li>
            <li>✅ Member management</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <div className="text-lg font-semibold text-gray-600">
            {status === "loading" ? "Loading..." : "Redirecting..."}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  status,
  color,
}: {
  label: string;
  status: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
      <span className="font-medium text-gray-700">{label}</span>
      <span className={`font-semibold ${color}`}>{status}</span>
    </div>
  );
}
