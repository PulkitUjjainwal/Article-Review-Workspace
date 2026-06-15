import { NextResponse } from "next/server";
import { sendTestEmail } from "~/lib/email";

// Test endpoint to verify Resend email configuration
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "Email parameter is required. Use: /api/test-email?email=your@email.com" },
      { status: 400 }
    );
  }

  try {
    const result = await sendTestEmail(email);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${email}!`,
        data: result.data,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send test email",
      },
      { status: 500 }
    );
  }
}
