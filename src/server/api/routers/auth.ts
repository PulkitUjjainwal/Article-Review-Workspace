import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { hashPassword, validatePassword, validateEmail } from "~/lib/auth";
import { sendPasswordResetEmail } from "~/lib/email";
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
      // Validate email
      const emailValidation = validateEmail(input.email);
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
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(input.password);

      // Create user
      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      return {
        success: true,
        message: "Account created successfully! Please sign in.",
        user,
      };
    }),

  // REMOVED: checkEmail endpoint - was a security vulnerability (email enumeration)
  // If you need this functionality, implement it on the client side during registration
  // and handle the "email already exists" error from the register mutation

  // Request password reset
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user exists
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
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
            email: input.email,
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
            to: input.email,
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
});
