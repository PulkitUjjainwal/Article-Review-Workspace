import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { hashPassword, validatePassword, validateEmail } from "~/lib/auth";
import { sendPasswordResetEmail, sendEmailVerification } from "~/lib/email";
import { getBaseUrl } from "~/lib/getBaseUrl";
import { logger } from "~/lib/logger";
import crypto from "crypto";

export const authRouter = createTRPCRouter({
  // Register new user
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Normalize email: trim and lowercase
      const normalizedEmail = input.email.trim().toLowerCase();
      const normalizedName = input.name.trim();

      // Validate email
      const emailValidation = validateEmail(normalizedEmail);
      if (!emailValidation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: emailValidation.error,
        });
      }

      // Validate password
      const passwordValidation = validatePassword(input.password);
      if (!passwordValidation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: passwordValidation.error,
        });
      }

      // Check if user already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(input.password);

      // Create user (email not verified yet)
      const user = await ctx.db.user.create({
        data: {
          name: normalizedName,
          email: normalizedEmail,
          password: hashedPassword,
          emailVerified: null, // Explicitly set to null (not verified)
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      // Generate email verification token
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create email verification token
      await ctx.db.emailVerificationToken.create({
        data: {
          email: normalizedEmail,
          token,
          expires,
        },
      });

      // Get base URL and construct verification URL
      const baseUrl = getBaseUrl();
      const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;

      logger.debug('[Email Verification] Base URL:', baseUrl);
      logger.debug('[Email Verification] Verification URL:', verificationUrl);

      // Send verification email
      let emailSent = false;
      let emailError = null;

      try {
        await sendEmailVerification({
          to: normalizedEmail,
          verificationUrl,
          userName: normalizedName,
        });
        emailSent = true;
        logger.info("Verification email sent successfully to:", normalizedEmail);
      } catch (error: any) {
        emailSent = false;
        emailError = error.message || "Unknown error";
        console.error("Failed to send verification email:", error);
        logger.error("Verification email failed but registration succeeded", {
          email: normalizedEmail,
          error: error.message,
        });
      }

      return {
        success: true,
        message: emailSent
          ? "Account created successfully! Please check your email to verify your account."
          : "Account created! However, we couldn't send the verification email. Please use 'Resend verification' to try again.",
        user,
        emailSent,
        emailError: emailSent ? null : "Email delivery failed. You can resend the verification email from the sign-in page.",
      };
    }),

  // REMOVED: checkEmail endpoint - was a security vulnerability (email enumeration)
  // If you need this functionality, implement it on the client side during registration
  // and handle the "email already exists" error from the register mutation

  // Request password reset
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      // Normalize email
      const normalizedEmail = input.email.trim().toLowerCase();

      // Check if user exists
      const user = await ctx.db.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, name: true, email: true, password: true },
      });

      // Always return success to prevent email enumeration
      // But only send email if user exists and has a password (not OAuth-only)
      if (user && user.password) {
        // Generate secure random token
        const token = crypto.randomBytes(32).toString("hex");

        // Set expiration to 1 hour from now
        const expires = new Date(Date.now() + 60 * 60 * 1000);

        // Create password reset token
        await ctx.db.passwordResetToken.create({
          data: {
            email: normalizedEmail,
            token,
            expires,
          },
        });

        // Get base URL (handles dev, staging, production automatically)
        const baseUrl = getBaseUrl();
        const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

        // Only log in development - sensitive URLs
        logger.debug('[Password Reset] Base URL:', baseUrl);
        logger.debug('[Password Reset] Reset URL:', resetUrl);

        // Send password reset email
        try {
          await sendPasswordResetEmail({
            to: normalizedEmail,
            resetUrl,
            userName: user.name || undefined,
          });
        } catch (error) {
          console.error("Failed to send password reset email:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send password reset email. Please try again later.",
          });
        }
      }

      return {
        success: true,
        message: "If an account exists with this email, you will receive a password reset link.",
      };
    }),

  // Reset password
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate password
      const passwordValidation = validatePassword(input.newPassword);
      if (!passwordValidation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: passwordValidation.error,
        });
      }

      // Find reset token
      const resetToken = await ctx.db.passwordResetToken.findUnique({
        where: { token: input.token },
      });

      if (!resetToken) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token",
        });
      }

      // Check if token has been used
      if (resetToken.used) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This reset link has already been used",
        });
      }

      // Check if token is expired
      if (resetToken.expires < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This reset link has expired. Please request a new one.",
        });
      }

      // Hash new password
      const hashedPassword = await hashPassword(input.newPassword);

      // Update user password and mark token as used
      await ctx.db.$transaction([
        ctx.db.user.update({
          where: { email: resetToken.email },
          data: { password: hashedPassword },
        }),
        ctx.db.passwordResetToken.update({
          where: { token: input.token },
          data: { used: true },
        }),
      ]);

      return {
        success: true,
        message: "Password has been reset successfully. You can now sign in with your new password.",
      };
    }),

  // Verify reset token
  verifyResetToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const resetToken = await ctx.db.passwordResetToken.findUnique({
        where: { token: input.token },
      });

      if (!resetToken || resetToken.used || resetToken.expires < new Date()) {
        return { valid: false };
      }

      return { valid: true, email: resetToken.email };
    }),

  // Verify email address
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Find verification token
      const verificationToken = await ctx.db.emailVerificationToken.findUnique({
        where: { token: input.token },
      });

      if (!verificationToken) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired verification token",
        });
      }

      // Check if token has been used
      if (verificationToken.used) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This verification link has already been used",
        });
      }

      // Check if token is expired
      if (verificationToken.expires < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This verification link has expired. Please request a new one.",
        });
      }

      // Update user email verification status and mark token as used
      await ctx.db.$transaction([
        ctx.db.user.update({
          where: { email: verificationToken.email },
          data: { emailVerified: new Date() },
        }),
        ctx.db.emailVerificationToken.update({
          where: { token: input.token },
          data: { used: true },
        }),
      ]);

      return {
        success: true,
        message: "Email verified successfully! You can now sign in.",
      };
    }),

  // Resend verification email
  resendVerificationEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      // Normalize email
      const normalizedEmail = input.email.trim().toLowerCase();

      // Check if user exists
      const user = await ctx.db.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, name: true, email: true, emailVerified: true },
      });

      if (!user) {
        // Don't reveal if user exists (prevent email enumeration)
        return {
          success: true,
          message: "If an account exists with this email, a verification link has been sent.",
        };
      }

      // Check if already verified
      if (user.emailVerified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This email address is already verified.",
        });
      }

      // Delete old unused tokens for this email
      await ctx.db.emailVerificationToken.deleteMany({
        where: {
          email: normalizedEmail,
          used: false,
        },
      });

      // Generate new verification token
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create email verification token
      await ctx.db.emailVerificationToken.create({
        data: {
          email: normalizedEmail,
          token,
          expires,
        },
      });

      // Get base URL and construct verification URL
      const baseUrl = getBaseUrl();
      const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;

      logger.debug('[Resend Verification] Verification URL:', verificationUrl);

      // Send verification email
      try {
        await sendEmailVerification({
          to: normalizedEmail,
          verificationUrl,
          userName: user.name || undefined,
        });
      } catch (error) {
        console.error("Failed to send verification email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send verification email. Please try again later.",
        });
      }

      return {
        success: true,
        message: "Verification email has been sent. Please check your inbox.",
      };
    }),

  // Check verification token validity
  checkVerificationToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const verificationToken = await ctx.db.emailVerificationToken.findUnique({
        where: { token: input.token },
      });

      if (!verificationToken || verificationToken.used || verificationToken.expires < new Date()) {
        return { valid: false };
      }

      return { valid: true, email: verificationToken.email };
    }),
});
