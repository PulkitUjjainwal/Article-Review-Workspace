import { createTRPCRouter } from "./trpc";
import { organizationRouter } from "./routers/organization";
import { projectRouter } from "./routers/project";
import { articleRouter } from "./routers/article";
import { importRouter } from "./routers/import";
import { memberRouter } from "./routers/member";
import { authRouter } from "./routers/auth";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  organization: organizationRouter,
  project: projectRouter,
  article: articleRouter,
  import: importRouter,
  member: memberRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
