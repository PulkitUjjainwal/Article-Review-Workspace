import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { hashPassword, validatePassword, validateEmail } from "~/lib/auth";

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

  // Check if email exists
  checkEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });

      return { exists: !!user };
    }),
});
