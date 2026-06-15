import { type NextAuthOptions, type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import { verifyPassword } from "~/lib/auth";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}

/**
 * Options for NextAuth.js
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id as string,
      },
    }),
  },
  // Note: Don't use adapter with CredentialsProvider + JWT strategy
  // adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error("Email or password not provided");
            return null;
          }

          console.log("Attempting to sign in with email:", credentials.email);

          // Find user by email
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            console.error("User not found");
            return null;
          }

          // Check if user has a password (credentials auth)
          if (!user.password) {
            console.error("User does not have a password set (may be OAuth user)");
            return null;
          }

          // Verify password
          const isValidPassword = await verifyPassword(credentials.password, user.password);

          if (!isValidPassword) {
            console.error("Invalid password");
            return null;
          }

          console.log("Authentication successful for user:", user.id);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
    /**
     * Add OAuth providers here:
     * GitHubProvider({
     *   clientId: process.env.GITHUB_ID!,
     *   clientSecret: process.env.GITHUB_SECRET!,
     * }),
     */
  ],
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
