# Article Review Workspace - Comprehensive Project Documentation

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Design Patterns & Principles](#design-patterns--principles)
4. [Data Model & Database Design](#data-model--database-design)
5. [Authorization & Security](#authorization--security)
6. [Article Import System](#article-import-system)
7. [Review Workflow Design](#review-workflow-design)
8. [Frontend Architecture](#frontend-architecture)
9. [Backend Architecture](#backend-architecture)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Architecture](#deployment-architecture)
12. [Development Workflow](#development-workflow)
13. [Performance Considerations](#performance-considerations)
14. [Scalability & Future Enhancements](#scalability--future-enhancements)

---

## Executive Summary

### Project Overview
Article Review Workspace is a multi-tenant SaaS application designed for systematic literature review (SLR) workflows. Researchers can organize into organizations, create projects, import research articles, and collaboratively review them using a structured Include/Exclude/Maybe decision framework.

### Technical Stack
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 3.x
- **API**: tRPC for type-safe API layer
- **Database**: PostgreSQL 14+ with Prisma ORM
- **Authentication**: NextAuth.js (OAuth + credentials)
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Deployment**: Vercel (frontend) + Neon/Railway (database)

### Key Features
1. **Multi-tenant architecture** with organizations and projects
2. **Excel/CSV import** with intelligent validation and deduplication
3. **Review workflow** with Include/Exclude/Maybe decisions
4. **Fine-grained authorization** at project level
5. **Advanced table interface** with search, filter, sort, pagination
6. **Review history tracking** with audit trail
7. **Bulk operations** for efficiency
8. **Real-time collaboration** ready architecture

### Success Metrics
- ✅ Complete article review workflow (import → review → export)
- ✅ Server-side authorization enforcement
- ✅ Handles edge cases (duplicates, invalid data, concurrent reviews)
- ✅ Responsive UI with proper loading/error states
- ✅ Deployable to production with zero downtime
- ✅ Test coverage >70% for critical paths

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Next.js     │  │   React      │  │  Tailwind    │          │
│  │  Pages/App   │  │  Components  │  │    CSS       │          │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘          │
│         │                 │                                      │
│         └────────┬────────┘                                      │
│                  │ tRPC Client (Type-safe API calls)            │
└──────────────────┼─────────────────────────────────────────────┘
                   │
┌──────────────────┼─────────────────────────────────────────────┐
│                  │         API Layer (tRPC)                     │
│         ┌────────▼────────┐                                     │
│         │  tRPC Router    │                                     │
│         │  ┌───────────┐  │                                     │
│         │  │ Org Router│  │                                     │
│         │  ├───────────┤  │                                     │
│         │  │Proj Router│  │                                     │
│         │  ├───────────┤  │                                     │
│         │  │Art Router │  │                                     │
│         │  ├───────────┤  │                                     │
│         │  │Imp Router │  │                                     │
│         │  └───────────┘  │                                     │
│         └────────┬────────┘                                     │
│                  │                                               │
│         ┌────────▼────────┐                                     │
│         │   Middleware    │                                     │
│         │ ┌─────────────┐ │                                     │
│         │ │  Auth Check │ │                                     │
│         │ ├─────────────┤ │                                     │
│         │ │  Org Guard  │ │                                     │
│         │ ├─────────────┤ │                                     │
│         │ │Project Guard│ │                                     │
│         │ └─────────────┘ │                                     │
│         └────────┬────────┘                                     │
└──────────────────┼─────────────────────────────────────────────┘
                   │
┌──────────────────┼─────────────────────────────────────────────┐
│                  │      Service Layer                           │
│         ┌────────▼────────┐                                     │
│         │    Services     │                                     │
│         │ ┌─────────────┐ │                                     │
│         │ │Import Service│ │                                     │
│         │ ├─────────────┤ │                                     │
│         │ │Validation   │ │                                     │
│         │ │  Service    │ │                                     │
│         │ ├─────────────┤ │                                     │
│         │ │Authorization│ │                                     │
│         │ │  Service    │ │                                     │
│         │ ├─────────────┤ │                                     │
│         │ │Review       │ │                                     │
│         │ │  Service    │ │                                     │
│         │ └─────────────┘ │                                     │
│         └────────┬────────┘                                     │
└──────────────────┼─────────────────────────────────────────────┘
                   │
┌──────────────────┼─────────────────────────────────────────────┐
│                  │      Data Access Layer                       │
│         ┌────────▼────────┐                                     │
│         │ Prisma Client   │                                     │
│         │  (ORM/Query     │                                     │
│         │   Builder)      │                                     │
│         └────────┬────────┘                                     │
└──────────────────┼─────────────────────────────────────────────┘
                   │
┌──────────────────▼─────────────────────────────────────────────┐
│                    PostgreSQL Database                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │   Users  │ │   Orgs   │ │ Projects │ │ Articles │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Request Flow Example

**User reviews an article:**

```
1. User clicks "Include" button
   ↓
2. React component calls tRPC mutation
   ↓
3. tRPC client sends typed request to /api/trpc
   ↓
4. tRPC server receives request
   ↓
5. Middleware chain executes:
   - AuthMiddleware: Validates session
   - ProjectGuard: Checks project membership
   ↓
6. Router procedure executes:
   - article.updateReview({ articleId, decision: 'INCLUDE' })
   ↓
7. Service layer:
   - ReviewService.updateDecision()
   - Validates transition (PENDING → INCLUDE)
   - Creates ReviewHistory entry
   - Updates Article record
   ↓
8. Prisma executes database transaction:
   - INSERT INTO ReviewHistory
   - UPDATE Article SET reviewDecision, reviewedBy, reviewedAt
   ↓
9. Response flows back through layers
   ↓
10. tRPC client receives typed response
   ↓
11. React Query invalidates cache, refetches
   ↓
12. UI updates with new review status
```

---

## Design Patterns & Principles

### 1. Layered Architecture (Separation of Concerns)

Each layer has distinct responsibilities and only depends on layers below it:

**Presentation Layer** (React Components)
- User interface rendering
- User input handling
- Client-side state management
- Optimistic updates

**API Layer** (tRPC Routers)
- Request routing
- Input validation (Zod schemas)
- Authorization checks
- Response formatting

**Service Layer** (Business Logic)
- Domain logic
- Complex validations
- Multi-step operations
- External integrations

**Data Access Layer** (Prisma)
- Database queries
- Transactions
- Migrations
- Schema management

**Benefits:**
- ✅ Testability: Each layer can be tested in isolation
- ✅ Maintainability: Changes contained to relevant layer
- ✅ Reusability: Services can be used by multiple routers
- ✅ Type safety: TypeScript enforced across all layers

### 2. Repository Pattern (via Prisma)

Prisma client acts as our repository, abstracting database access:

```typescript
// Instead of raw SQL
const articles = await db.query('SELECT * FROM articles WHERE projectId = $1', [projectId]);

// We use Prisma's type-safe API
const articles = await prisma.article.findMany({
  where: { projectId },
  include: { reviewHistory: true }
});
```

**Benefits:**
- Type-safe queries with autocomplete
- Protection against SQL injection
- Easy to mock for testing
- Migration management built-in

### 3. Service Layer Pattern

Business logic encapsulated in services:

```typescript
// services/articleImport.ts
export class ArticleImportService {
  async importArticles(projectId: string, data: ArticleInput[]): Promise<ImportResult> {
    // Validation
    const validated = await this.validate(data);

    // Deduplication
    const unique = await this.dedup(validated, projectId);

    // Batch insert with transaction
    const imported = await this.batchInsert(unique, projectId);

    return { imported, skipped: validated.errors };
  }
}
```

**Benefits:**
- Reusable across different routers
- Easier to test (mock Prisma)
- Clear separation from HTTP/tRPC concerns
- Can be used in background jobs, CLI, etc.

### 4. Factory Pattern (Validators)

Create validators dynamically based on field type:

```typescript
// services/validation.ts
interface Validator {
  validate(value: any): ValidationResult;
}

class PMIDValidator implements Validator {
  validate(value: string): ValidationResult {
    if (!value) return { valid: true };
    if (!/^\d+$/.test(value)) {
      return { valid: false, error: 'PMID must be numeric' };
    }
    return { valid: true };
  }
}

class DOIValidator implements Validator {
  validate(value: string): ValidationResult {
    if (!value) return { valid: true };
    if (!/^10\.\d{4,}\//.test(value)) {
      return { valid: false, error: 'Invalid DOI format' };
    }
    return { valid: true };
  }
}

class ValidatorFactory {
  static createValidator(field: string): Validator {
    switch (field) {
      case 'pmid': return new PMIDValidator();
      case 'doi': return new DOIValidator();
      case 'publicationYear': return new YearValidator();
      default: return new NoOpValidator();
    }
  }
}
```

**Benefits:**
- Easy to add new validators
- Each validator focuses on single responsibility
- Composable validation pipeline
- Testable in isolation

### 5. Strategy Pattern (Review Workflow)

Different review strategies can be implemented:

```typescript
// services/reviewWorkflow.ts
interface ReviewStrategy {
  canTransition(from: ReviewDecision, to: ReviewDecision): boolean;
  onTransition(article: Article, user: User, to: ReviewDecision): Promise<void>;
}

class IncludeExcludeMaybeStrategy implements ReviewStrategy {
  private transitions = {
    PENDING: ['INCLUDE', 'EXCLUDE', 'MAYBE'],
    INCLUDE: ['EXCLUDE', 'MAYBE'],
    EXCLUDE: ['INCLUDE', 'MAYBE'],
    MAYBE: ['INCLUDE', 'EXCLUDE']
  };

  canTransition(from: ReviewDecision, to: ReviewDecision): boolean {
    return this.transitions[from]?.includes(to) ?? false;
  }

  async onTransition(article: Article, user: User, to: ReviewDecision) {
    // Create history entry
    await prisma.reviewHistory.create({
      data: {
        articleId: article.id,
        userId: user.id,
        decision: to,
        createdAt: new Date()
      }
    });

    // Update article
    await prisma.article.update({
      where: { id: article.id },
      data: {
        reviewDecision: to,
        reviewedBy: user.id,
        reviewedAt: new Date()
      }
    });
  }
}
```

**Benefits:**
- Easy to switch review strategies
- Can support multiple workflows per project
- Behavior encapsulated in strategy class
- Extensible for future requirements (e.g., multi-reviewer consensus)

### 6. Middleware Pattern (Authorization)

Chain of responsibility for request processing:

```typescript
// server/api/trpc.ts
const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

const projectAccess = t.middleware(async ({ ctx, input, next }) => {
  const membership = await ctx.prisma.projectMember.findFirst({
    where: {
      projectId: input.projectId,
      userId: ctx.session.user.id
    }
  });

  if (!membership) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  return next({ ctx: { ...ctx, membership } });
});

// Compose middleware
export const protectedProcedure = t.procedure.use(isAuthed);
export const projectProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .use(projectAccess);
```

**Benefits:**
- Declarative authorization
- Reusable across all project-scoped operations
- Fails fast (before business logic)
- Type-safe context enrichment

### 7. SOLID Principles Application

**Single Responsibility:**
- Each service handles one domain concern
- Each validator validates one field type
- Each component renders one UI concern

**Open/Closed:**
- New validators can be added without modifying ValidatorFactory
- New review strategies without changing ReviewService

**Liskov Substitution:**
- Any `Validator` can be used in validation pipeline
- Any `ReviewStrategy` can be used in workflow service

**Interface Segregation:**
- Small, focused interfaces (Validator, ReviewStrategy)
- Clients only depend on methods they use

**Dependency Inversion:**
- Services depend on Prisma interface, not concrete database
- Components depend on tRPC hooks, not HTTP details

---

## Data Model & Database Design

### Entity Relationship Diagram

```
┌──────────────┐
│     User     │
│──────────────│
│ id (PK)      │
│ email        │
│ name         │
│ image        │
└──────┬───────┘
       │
       │ 1
       │
       │ N
┌──────▼────────────┐
│ OrganizationMember│
│───────────────────│
│ id (PK)           │
│ userId (FK)       │
│ organizationId(FK)│
│ role              │
└──────┬────────────┘
       │
       │ N
       │
       │ 1
┌──────▼───────┐        1        N  ┌───────────┐
│ Organization │◄───────────────────┤  Project  │
│──────────────│                    │───────────│
│ id (PK)      │                    │ id (PK)   │
│ name         │                    │ name      │
│ slug (UNIQUE)│                    │ orgId (FK)│
└──────────────┘                    └─────┬─────┘
                                          │
                                          │ 1
                                          │
                                          │ N
                                    ┌─────▼──────────┐
                                    │ ProjectMember  │
                                    │────────────────│
                                    │ id (PK)        │
                                    │ projectId (FK) │
                                    │ userId (FK)    │
                                    │ role           │
                                    └────────────────┘

┌───────────┐        1        N  ┌──────────┐
│  Project  │◄───────────────────┤ Article  │
└───────────┘                    │──────────│
                                 │ id (PK)  │
                                 │ projectId│
                                 │ pmid     │
                                 │ title    │
                                 │ authors  │
                                 │ ...      │
                                 │ decision │
                                 └────┬─────┘
                                      │
                                      │ 1
                                      │
                                      │ N
                                ┌─────▼────────┐
                                │ReviewHistory │
                                │──────────────│
                                │ id (PK)      │
                                │ articleId(FK)│
                                │ userId (FK)  │
                                │ decision     │
                                │ notes        │
                                │ createdAt    │
                                └──────────────┘
```

### Database Schema (Prisma)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// NextAuth.js required models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?

  accounts                Account[]
  sessions                Session[]
  organizationMemberships OrganizationMember[]
  projectMemberships      ProjectMember[]
  reviewHistory           ReviewHistory[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// Domain models
model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?  @db.Text

  members  OrganizationMember[]
  projects Project[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([slug])
}

model OrganizationMember {
  id             String     @id @default(cuid())
  organizationId String
  userId         String
  role           MemberRole @default(MEMBER)

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([organizationId, userId])
  @@index([organizationId])
  @@index([userId])
}

model Project {
  id             String   @id @default(cuid())
  name           String
  description    String?  @db.Text
  organizationId String

  organization Organization    @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  members      ProjectMember[]
  articles     Article[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId])
}

model ProjectMember {
  id        String     @id @default(cuid())
  projectId String
  userId    String
  role      MemberRole @default(MEMBER)

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([projectId, userId])
  @@index([projectId])
  @@index([userId])
}

model Article {
  id              String   @id @default(cuid())
  projectId       String

  // PubMed metadata
  pmid            String?
  title           String   @db.Text
  authors         String?  @db.Text
  citation        String?  @db.Text
  firstAuthor     String?
  journal         String?
  publicationYear String?
  createDate      String?
  pmcid           String?
  nihmsId         String?
  doi             String?

  // Review tracking
  reviewDecision ReviewDecision @default(PENDING)
  reviewedBy     String?
  reviewedAt     DateTime?
  reviewNotes    String?        @db.Text

  // Import metadata
  importBatch String?
  importedAt  DateTime @default(now())

  project       Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  reviewHistory ReviewHistory[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([projectId])
  @@index([pmid])
  @@index([doi])
  @@index([reviewDecision])
  @@index([reviewedAt])
}

model ReviewHistory {
  id        String         @id @default(cuid())
  articleId String
  userId    String
  decision  ReviewDecision
  notes     String?        @db.Text

  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@index([articleId])
  @@index([userId])
  @@index([createdAt])
}

enum MemberRole {
  OWNER
  ADMIN
  MEMBER
}

enum ReviewDecision {
  PENDING
  INCLUDE
  EXCLUDE
  MAYBE
}
```

### Indexing Strategy

**Purpose of each index:**

1. **Relationship lookups:**
   ```prisma
   @@index([userId])        // Find all org/project memberships for user
   @@index([organizationId]) // Find all members/projects in org
   @@index([projectId])     // Find all articles in project
   ```

2. **Unique constraints:**
   ```prisma
   @@unique([organizationId, userId])  // User can't join org twice
   @@unique([projectId, userId])       // User can't join project twice
   ```

3. **Query optimization:**
   ```prisma
   @@index([reviewDecision])  // Filter articles by status
   @@index([pmid])            // Deduplication checks
   @@index([doi])             // Deduplication checks
   ```

4. **Sorting/pagination:**
   ```prisma
   @@index([reviewedAt])      // Sort by review date
   @@index([createdAt])       // Sort by import date
   ```

### Database Normalization

**3NF (Third Normal Form) achieved:**
- ✅ No partial dependencies (all non-key attributes depend on whole primary key)
- ✅ No transitive dependencies (no non-key attribute depends on another non-key attribute)
- ✅ All foreign keys properly defined with cascading deletes

**Denormalization decisions:**
- Article stores `reviewedBy` userId directly (instead of join to latest ReviewHistory)
  - **Reason**: 99% of queries need current reviewer, not full history
  - **Tradeoff**: Must update both Article and ReviewHistory on review change
  - **Mitigation**: Transaction ensures consistency

---

## Authorization & Security

### Authorization Model

**Principle: Defense in Depth**
1. ✅ Server-side enforcement (tRPC middleware)
2. ✅ Database-level constraints (foreign keys)
3. ✅ UI-level hints (hide unauthorized actions)

### Authorization Levels

**Level 1: Authentication (Session)**
```typescript
// Require user to be logged in
const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});
```

**Level 2: Organization Membership**
```typescript
// Require user to be member of organization
const organizationProcedure = protectedProcedure
  .input(z.object({ organizationId: z.string() }))
  .use(async ({ ctx, input, next }) => {
    const membership = await ctx.prisma.organizationMember.findFirst({
      where: {
        organizationId: input.organizationId,
        userId: ctx.session.user.id
      }
    });

    if (!membership) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a member of this organization' });
    }

    return next({ ctx: { ...ctx, orgMembership: membership } });
  });
```

**Level 3: Project Membership**
```typescript
// Require user to be member of project
const projectProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .use(async ({ ctx, input, next }) => {
    const membership = await ctx.prisma.projectMember.findFirst({
      where: {
        projectId: input.projectId,
        userId: ctx.session.user.id
      },
      include: {
        project: {
          include: {
            organization: {
              include: {
                members: {
                  where: { userId: ctx.session.user.id }
                }
              }
            }
          }
        }
      }
    });

    if (!membership) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a member of this project' });
    }

    return next({
      ctx: {
        ...ctx,
        projectMembership: membership,
        organization: membership.project.organization
      }
    });
  });
```

**Level 4: Role-Based (Future Enhancement)**
```typescript
// Require specific role (e.g., ADMIN)
const requireRole = (minRole: MemberRole) =>
  t.middleware(async ({ ctx, next }) => {
    const membership = ctx.projectMembership; // From projectProcedure

    const roleHierarchy = { OWNER: 3, ADMIN: 2, MEMBER: 1 };
    if (roleHierarchy[membership.role] < roleHierarchy[minRole]) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Insufficient permissions' });
    }

    return next({ ctx });
  });
```

### Authorization Flow

```
┌─────────────────────────────────────────────────┐
│           User Action (UI)                      │
│  "Click 'Include' button on article in Project"│
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│         tRPC Client Call                       │
│  api.article.updateReview.mutate({             │
│    articleId: "abc123",                        │
│    decision: "INCLUDE"                         │
│  })                                            │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│         Server: Extract Context                │
│  - Get session from cookie                     │
│  - session.user.id = "user123"                 │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│      Middleware 1: isAuthed                    │
│  ✓ Session exists                              │
│  ✓ User is authenticated                       │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│   Procedure: Get article's project             │
│  article = await prisma.article.findUnique({   │
│    where: { id: "abc123" },                    │
│    include: { project: true }                  │
│  })                                            │
│  projectId = article.project.id                │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│   Middleware 2: projectAccess                  │
│  membership = await prisma.projectMember       │
│    .findFirst({                                │
│      where: {                                  │
│        projectId: projectId,                   │
│        userId: "user123"                       │
│      }                                         │
│    })                                          │
│                                                │
│  if (!membership) → 403 FORBIDDEN ✗            │
│  if (membership) → Continue ✓                  │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│    Business Logic: Update Review               │
│  await reviewService.updateDecision(           │
│    article, user, "INCLUDE"                    │
│  )                                             │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│         Return Success                         │
│  { success: true, article: {...} }             │
└────────────────────────────────────────────────┘
```

### Security Best Practices

**1. Input Validation with Zod**
```typescript
const updateReviewInput = z.object({
  articleId: z.string().cuid(),
  decision: z.enum(['INCLUDE', 'EXCLUDE', 'MAYBE']),
  notes: z.string().max(5000).optional()
});

export const articleRouter = createTRPCRouter({
  updateReview: projectProcedure
    .input(updateReviewInput)
    .mutation(async ({ ctx, input }) => {
      // input is now type-safe and validated
    })
});
```

**2. SQL Injection Prevention**
- ✅ Use Prisma (parameterized queries)
- ❌ Never use raw SQL with string concatenation
- ✅ If raw SQL needed, use Prisma's `prisma.$queryRaw`

**3. XSS Prevention**
- ✅ React escapes by default
- ✅ Use `dangerouslySetInnerHTML` only with sanitized content
- ✅ Validate user input (remove scripts, etc.)

**4. CSRF Prevention**
- ✅ NextAuth includes CSRF protection
- ✅ Use HTTP-only cookies for session tokens
- ✅ SameSite cookie attribute set to Lax

**5. Rate Limiting (Future)**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

const rateLimitedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const { success } = await ratelimit.limit(ctx.session.user.id);
  if (!success) {
    throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
  }
  return next({ ctx });
});
```

**6. Environment Variables**
```env
# .env (never commit)
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="random-32-char-string"
NEXTAUTH_URL="http://localhost:3000"
GITHUB_ID="..."
GITHUB_SECRET="..."
```

---

## Article Import System

### Import Flow Architecture

```
┌─────────────────────────────────────────────────────┐
│              1. File Upload (Client)                │
│  User selects .xlsx file → Read with XLSX.js       │
│  Parse to JSON → Send to server                     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│           2. tRPC Procedure (Server)                │
│  import.uploadArticles({ projectId, articles[] })   │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│         3. Authorization Check                      │
│  Check user is member of project                    │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│      4. Import Service (Business Logic)             │
│  ArticleImportService.import(projectId, articles)   │
│  ┌───────────────────────────────────────────────┐  │
│  │ Step 1: Validate Each Row                     │  │
│  │  - Required fields (title)                    │  │
│  │  - Field formats (PMID, DOI, year)            │  │
│  │  - Collect errors                             │  │
│  ├───────────────────────────────────────────────┤  │
│  │ Step 2: Deduplicate                           │  │
│  │  - Check PMID against existing articles       │  │
│  │  - Check DOI against existing articles        │  │
│  │  - Skip duplicates, collect warnings          │  │
│  ├───────────────────────────────────────────────┤  │
│  │ Step 3: Transform                             │  │
│  │  - Normalize data (trim strings, etc.)        │  │
│  │  - Add metadata (importBatch ID, timestamp)   │  │
│  ├───────────────────────────────────────────────┤  │
│  │ Step 4: Batch Insert (Transaction)            │  │
│  │  - Insert all valid articles in one query     │  │
│  │  - Rollback if any fail                       │  │
│  └───────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│            5. Return Results                        │
│  {                                                   │
│    imported: 18,                                     │
│    skipped: [                                        │
│      { row: 5, error: "Duplicate PMID 38910001" },   │
│      { row: 13, error: "Missing title" }             │
│    ]                                                 │
│  }                                                   │
└─────────────────────────────────────────────────────┘
```

### Validation Rules

**Implemented validators:**

```typescript
// services/validation.ts

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  error: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface Validator {
  validate(value: any, row: number): ValidationResult;
}

// 1. Required Fields Validator
export class RequiredFieldValidator implements Validator {
  constructor(private fieldName: string) {}

  validate(value: any, row: number): ValidationResult {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return {
        valid: false,
        error: `${this.fieldName} is required`
      };
    }
    return { valid: true };
  }
}

// 2. PMID Validator
export class PMIDValidator implements Validator {
  validate(value: any, row: number): ValidationResult {
    if (!value) return { valid: true }; // Optional field

    const pmidStr = String(value).trim();
    if (!/^\d+$/.test(pmidStr)) {
      return {
        valid: false,
        error: 'PMID must contain only digits'
      };
    }

    if (pmidStr.length < 7 || pmidStr.length > 9) {
      return {
        valid: false,
        error: 'PMID must be 7-9 digits long'
      };
    }

    return { valid: true };
  }
}

// 3. DOI Validator
export class DOIValidator implements Validator {
  private doiRegex = /^10\.\d{4,}\/[^\s]+$/;

  validate(value: any, row: number): ValidationResult {
    if (!value) return { valid: true }; // Optional field

    const doiStr = String(value).trim();
    if (!this.doiRegex.test(doiStr)) {
      return {
        valid: false,
        error: 'DOI must match format: 10.xxxx/...'
      };
    }

    return { valid: true };
  }
}

// 4. Publication Year Validator
export class YearValidator implements Validator {
  validate(value: any, row: number): ValidationResult {
    if (!value) return { valid: true }; // Optional field

    const yearStr = String(value).trim();

    // Must be 4 digits
    if (!/^\d{4}$/.test(yearStr)) {
      return {
        valid: false,
        error: 'Publication year must be a 4-digit number'
      };
    }

    const year = parseInt(yearStr, 10);
    const currentYear = new Date().getFullYear();

    // Reasonable range: 1900 to current year + 1
    if (year < 1900 || year > currentYear + 1) {
      return {
        valid: false,
        error: `Publication year must be between 1900 and ${currentYear + 1}`
      };
    }

    return { valid: true };
  }
}

// 5. Validation Pipeline
export class ValidationPipeline {
  private validators: Map<string, Validator[]> = new Map();

  addValidator(field: string, validator: Validator) {
    if (!this.validators.has(field)) {
      this.validators.set(field, []);
    }
    this.validators.get(field)!.push(validator);
  }

  validate(data: Record<string, any>, row: number): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const [field, validators] of this.validators.entries()) {
      const value = data[field];

      for (const validator of validators) {
        const result = validator.validate(value, row);
        if (!result.valid) {
          errors.push({
            row,
            field,
            value,
            error: result.error!
          });
          break; // Stop at first error for this field
        }
      }
    }

    return errors;
  }
}

// Setup validation pipeline
export function createArticleValidationPipeline(): ValidationPipeline {
  const pipeline = new ValidationPipeline();

  // Required fields
  pipeline.addValidator('title', new RequiredFieldValidator('Title'));

  // Format validators
  pipeline.addValidator('pmid', new PMIDValidator());
  pipeline.addValidator('doi', new DOIValidator());
  pipeline.addValidator('publicationYear', new YearValidator());

  return pipeline;
}
```

### Deduplication Strategy

```typescript
// services/articleImport.ts

export class ArticleImportService {
  async deduplicateArticles(
    articles: ArticleInput[],
    projectId: string
  ): Promise<{
    unique: ArticleInput[];
    duplicates: Array<{ row: number; reason: string }>;
  }> {
    const duplicates: Array<{ row: number; reason: string }> = [];
    const unique: ArticleInput[] = [];

    // Get all existing PMIDs and DOIs in this project
    const existing = await prisma.article.findMany({
      where: { projectId },
      select: { pmid: true, doi: true }
    });

    const existingPMIDs = new Set(
      existing.filter(a => a.pmid).map(a => a.pmid)
    );
    const existingDOIs = new Set(
      existing.filter(a => a.doi).map(a => a.doi!.toLowerCase())
    );

    // Track PMIDs/DOIs within current import batch
    const batchPMIDs = new Set<string>();
    const batchDOIs = new Set<string>();

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      let isDuplicate = false;

      // Check PMID
      if (article.pmid) {
        if (existingPMIDs.has(article.pmid) || batchPMIDs.has(article.pmid)) {
          duplicates.push({
            row: i + 2, // Excel rows start at 2 (header is row 1)
            reason: `Duplicate PMID: ${article.pmid}`
          });
          isDuplicate = true;
        } else {
          batchPMIDs.add(article.pmid);
        }
      }

      // Check DOI (case-insensitive)
      if (!isDuplicate && article.doi) {
        const doiLower = article.doi.toLowerCase();
        if (existingDOIs.has(doiLower) || batchDOIs.has(doiLower)) {
          duplicates.push({
            row: i + 2,
            reason: `Duplicate DOI: ${article.doi}`
          });
          isDuplicate = true;
        } else {
          batchDOIs.add(doiLower);
        }
      }

      if (!isDuplicate) {
        unique.push(article);
      }
    }

    return { unique, duplicates };
  }
}
```

### Import Service Implementation

```typescript
// services/articleImport.ts

import { v4 as uuidv4 } from 'uuid';
import type { ArticleInput } from '../types';

export class ArticleImportService {
  async importArticles(
    projectId: string,
    articles: ArticleInput[],
    userId: string
  ): Promise<ImportResult> {
    const importBatchId = uuidv4();
    const results: ImportResult = {
      imported: 0,
      skipped: [],
      batchId: importBatchId
    };

    // Step 1: Validate
    const pipeline = createArticleValidationPipeline();
    const validationErrors: ValidationError[] = [];

    articles.forEach((article, index) => {
      const errors = pipeline.validate(article, index + 2);
      validationErrors.push(...errors);
    });

    // Step 2: Filter out invalid rows
    const invalidRows = new Set(validationErrors.map(e => e.row));
    const validArticles = articles.filter((_, index) =>
      !invalidRows.has(index + 2)
    );

    results.skipped.push(...validationErrors.map(e => ({
      row: e.row,
      error: `${e.field}: ${e.error}`
    })));

    // Step 3: Deduplicate
    const { unique, duplicates } = await this.deduplicateArticles(
      validArticles,
      projectId
    );

    results.skipped.push(...duplicates);

    // Step 4: Transform & Batch Insert
    if (unique.length > 0) {
      const transformed = unique.map(article => ({
        ...article,
        projectId,
        importBatch: importBatchId,
        importedAt: new Date(),
        reviewDecision: 'PENDING' as const
      }));

      await prisma.article.createMany({
        data: transformed
      });

      results.imported = unique.length;
    }

    return results;
  }
}
```

---

## Review Workflow Design

### State Machine

```
                    ┌──────────┐
                    │ PENDING  │ ◄── Initial state (on import)
                    └────┬─────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
           ▼             ▼             ▼
      ┌────────┐    ┌────────┐   ┌────────┐
      │INCLUDE │    │EXCLUDE │   │ MAYBE  │
      └───┬────┘    └───┬────┘   └───┬────┘
          │             │            │
          └─────────────┼────────────┘
                        │
                     (any state can transition
                      to any other state)
```

**Transition Rules:**
- PENDING → {INCLUDE, EXCLUDE, MAYBE}
- INCLUDE → {EXCLUDE, MAYBE} (can change decision)
- EXCLUDE → {INCLUDE, MAYBE}
- MAYBE → {INCLUDE, EXCLUDE}

**No transitions from:**
- None (all states are reversible)

### Review Service

```typescript
// services/reviewWorkflow.ts

export class ReviewWorkflowService {
  private validTransitions: Record<ReviewDecision, ReviewDecision[]> = {
    PENDING: ['INCLUDE', 'EXCLUDE', 'MAYBE'],
    INCLUDE: ['EXCLUDE', 'MAYBE', 'PENDING'],
    EXCLUDE: ['INCLUDE', 'MAYBE', 'PENDING'],
    MAYBE: ['INCLUDE', 'EXCLUDE', 'PENDING']
  };

  canTransition(from: ReviewDecision, to: ReviewDecision): boolean {
    return this.validTransitions[from]?.includes(to) ?? false;
  }

  async updateReviewDecision(
    articleId: string,
    userId: string,
    decision: ReviewDecision,
    notes?: string
  ): Promise<Article> {
    // Get current article
    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      throw new Error('Article not found');
    }

    // Validate transition
    if (!this.canTransition(article.reviewDecision, decision)) {
      throw new Error(
        `Invalid transition: ${article.reviewDecision} → ${decision}`
      );
    }

    // Use transaction to ensure consistency
    return await prisma.$transaction(async (tx) => {
      // Create history entry
      await tx.reviewHistory.create({
        data: {
          articleId,
          userId,
          decision,
          notes: notes ?? null,
          createdAt: new Date()
        }
      });

      // Update article
      const updated = await tx.article.update({
        where: { id: articleId },
        data: {
          reviewDecision: decision,
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewNotes: notes ?? null
        },
        include: {
          reviewHistory: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
              user: {
                select: { name: true, email: true, image: true }
              }
            }
          }
        }
      });

      return updated;
    });
  }

  async bulkUpdateReviewDecision(
    articleIds: string[],
    userId: string,
    decision: ReviewDecision
  ): Promise<{ updated: number; errors: string[] }> {
    const errors: string[] = [];
    let updated = 0;

    for (const articleId of articleIds) {
      try {
        await this.updateReviewDecision(articleId, userId, decision);
        updated++;
      } catch (error) {
        errors.push(`Article ${articleId}: ${error.message}`);
      }
    }

    return { updated, errors };
  }

  async getReviewHistory(
    articleId: string,
    limit = 50
  ): Promise<ReviewHistory[]> {
    return await prisma.reviewHistory.findMany({
      where: { articleId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { name: true, email: true, image: true }
        }
      }
    });
  }

  async getProjectReviewStats(
    projectId: string
  ): Promise<{
    total: number;
    pending: number;
    included: number;
    excluded: number;
    maybe: number;
  }> {
    const [total, pending, included, excluded, maybe] = await Promise.all([
      prisma.article.count({ where: { projectId } }),
      prisma.article.count({ where: { projectId, reviewDecision: 'PENDING' } }),
      prisma.article.count({ where: { projectId, reviewDecision: 'INCLUDE' } }),
      prisma.article.count({ where: { projectId, reviewDecision: 'EXCLUDE' } }),
      prisma.article.count({ where: { projectId, reviewDecision: 'MAYBE' } })
    ]);

    return { total, pending, included, excluded, maybe };
  }
}
```

---

## Frontend Architecture

### Component Hierarchy

```
App (_app.tsx)
│
├── Layout
│   ├── Navbar
│   │   ├── UserMenu
│   │   └── OrganizationSwitcher
│   ├── Sidebar
│   │   └── ProjectList
│   └── Main Content Area
│
└── Pages
    ├── Landing (index.tsx)
    ├── Auth
    │   └── SignIn
    ├── Dashboard
    │   └── OrganizationList
    ├── [orgSlug]
    │   ├── OrganizationDashboard
    │   │   ├── ProjectGrid
    │   │   └── StatsCards
    │   └── [projectId]
    │       ├── ProjectOverview
    │       │   └── ReviewStatsChart
    │       ├── Articles (Main View)
    │       │   ├── ArticleTableHeader
    │       │   │   ├── SearchBar
    │       │   │   ├── FilterDropdowns
    │       │   │   └── BulkActionBar
    │       │   ├── ArticleTable
    │       │   │   ├── TableHeader
    │       │   │   ├── ArticleRow (for each article)
    │       │   │   │   ├── SelectCheckbox
    │       │   │   │   ├── ArticleInfo
    │       │   │   │   └── ReviewControls
    │       │   │   │       ├── IncludeButton
    │       │   │   │       ├── ExcludeButton
    │       │   │   │       └── MaybeButton
    │       │   │   └── TableFooter (Pagination)
    │       │   ├── EmptyState
    │       │   └── LoadingSkeleton
    │       ├── Import
    │       │   ├── FileUploadZone
    │       │   ├── ImportPreviewTable
    │       │   └── ImportResultsModal
    │       └── Settings
    │           └── ProjectSettingsForm
    └── NewOrganization
        └── CreateOrgForm
```

### Key Components

#### 1. ArticleTable Component

```typescript
// components/article/ArticleTable.tsx

import { useState } from 'react';
import { api } from '~/utils/api';

interface ArticleTableProps {
  projectId: string;
}

export function ArticleTable({ projectId }: ArticleTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewDecision | 'ALL'>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const pageSize = 50;

  // tRPC query with pagination and filters
  const { data, isLoading, error } = api.article.list.useQuery({
    projectId,
    search: searchQuery,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    limit: pageSize,
    offset: page * pageSize
  });

  // tRPC mutation for review decision
  const updateReview = api.article.updateReview.useMutation({
    onSuccess: () => {
      // Invalidate and refetch
      void utils.article.list.invalidate();
    }
  });

  const handleReviewClick = async (
    articleId: string,
    decision: ReviewDecision
  ) => {
    await updateReview.mutateAsync({ articleId, decision });
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!data?.articles.length) return <EmptyState />;

  return (
    <div className="space-y-4">
      {/* Header with search and filters */}
      <ArticleTableHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        selectedCount={selectedIds.size}
        onBulkAction={handleBulkAction}
      />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th><input type="checkbox" onChange={handleSelectAll} /></th>
              <th>Title</th>
              <th>Authors</th>
              <th>Journal</th>
              <th>Year</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.articles.map((article) => (
              <ArticleRow
                key={article.id}
                article={article}
                isSelected={selectedIds.has(article.id)}
                onSelect={(id) => toggleSelection(id)}
                onReviewClick={handleReviewClick}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={Math.ceil(data.total / pageSize)}
        onPageChange={setPage}
      />
    </div>
  );
}
```

#### 2. ArticleRow Component

```typescript
// components/article/ArticleRow.tsx

interface ArticleRowProps {
  article: Article;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onReviewClick: (id: string, decision: ReviewDecision) => Promise<void>;
}

export function ArticleRow({
  article,
  isSelected,
  onSelect,
  onReviewClick
}: ArticleRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleReview = async (decision: ReviewDecision) => {
    setIsUpdating(true);
    try {
      await onReviewClick(article.id, decision);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <tr className={isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(article.id)}
        />
      </td>

      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{article.title}</div>
        {article.pmid && (
          <div className="text-sm text-gray-500">PMID: {article.pmid}</div>
        )}
      </td>

      <td className="px-4 py-3 text-sm text-gray-700">
        {article.firstAuthor || article.authors?.split(';')[0]}
      </td>

      <td className="px-4 py-3 text-sm text-gray-700">
        {article.journal}
      </td>

      <td className="px-4 py-3 text-sm text-gray-700">
        {article.publicationYear}
      </td>

      <td className="px-4 py-3">
        <ReviewStatusBadge status={article.reviewDecision} />
      </td>

      <td className="px-4 py-3">
        <div className="flex gap-2">
          <ReviewButton
            decision="INCLUDE"
            active={article.reviewDecision === 'INCLUDE'}
            onClick={() => handleReview('INCLUDE')}
            disabled={isUpdating}
          />
          <ReviewButton
            decision="EXCLUDE"
            active={article.reviewDecision === 'EXCLUDE'}
            onClick={() => handleReview('EXCLUDE')}
            disabled={isUpdating}
          />
          <ReviewButton
            decision="MAYBE"
            active={article.reviewDecision === 'MAYBE'}
            onClick={() => handleReview('MAYBE')}
            disabled={isUpdating}
          />
        </div>
      </td>
    </tr>
  );
}
```

#### 3. ImportModal Component

```typescript
// components/article/ImportModal.tsx

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { api } from '~/utils/api';

export function ImportModal({ projectId, onClose }: ImportModalProps) {
  const [previewData, setPreviewData] = useState<ArticleInput[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const importMutation = api.import.uploadArticles.useMutation({
    onSuccess: (result) => {
      toast.success(`Imported ${result.imported} articles`);
      if (result.skipped.length > 0) {
        toast.warning(`Skipped ${result.skipped.length} rows`);
      }
      onClose();
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      // Transform to our ArticleInput format
      const articles = json.map((row: any) => ({
        pmid: row.PMID?.toString(),
        title: row.Title,
        authors: row.Authors,
        citation: row.Citation,
        firstAuthor: row['First Author'],
        journal: row['Journal/Book'],
        publicationYear: row['Publication Year']?.toString(),
        createDate: row['Create Date'],
        pmcid: row.PMCID,
        nihmsId: row['NIHMS ID'],
        doi: row.DOI
      }));

      setPreviewData(articles);
    };

    reader.readAsBinaryString(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const handleImport = async () => {
    await importMutation.mutateAsync({
      projectId,
      articles: previewData
    });
  };

  return (
    <Modal open onClose={onClose} size="xl">
      <ModalHeader>Import Articles</ModalHeader>
      <ModalBody>
        {previewData.length === 0 ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          >
            <input {...getInputProps()} />
            <p className="text-gray-600">
              {isDragActive
                ? 'Drop the file here...'
                : 'Drag and drop an Excel file, or click to select'}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4">
              Preview: {previewData.length} articles ready to import
            </p>
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>PMID</th>
                    <th>DOI</th>
                    <th>Year</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 10).map((article, i) => (
                    <tr key={i}>
                      <td>{article.title}</td>
                      <td>{article.pmid}</td>
                      <td>{article.doi}</td>
                      <td>{article.publicationYear}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 10 && (
                <p className="text-center text-gray-500 mt-2">
                  ...and {previewData.length - 10} more
                </p>
              )}
            </div>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleImport}
          disabled={previewData.length === 0 || importMutation.isLoading}
        >
          {importMutation.isLoading ? 'Importing...' : 'Import'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
```

### State Management

**Client-side state:**
- React useState for component-local state (search query, selected rows)
- React Context for theme, user preferences (if needed)

**Server state:**
- React Query (via tRPC) for all server data
- Automatic caching, refetching, invalidation
- Optimistic updates for instant UI feedback

```typescript
// Optimistic update example
const updateReview = api.article.updateReview.useMutation({
  onMutate: async (newReview) => {
    // Cancel outgoing refetches
    await utils.article.list.cancel();

    // Snapshot previous value
    const previousArticles = utils.article.list.getData();

    // Optimistically update
    utils.article.list.setData({ projectId }, (old) => ({
      ...old,
      articles: old.articles.map((a) =>
        a.id === newReview.articleId
          ? { ...a, reviewDecision: newReview.decision }
          : a
      )
    }));

    return { previousArticles };
  },
  onError: (err, newReview, context) => {
    // Rollback on error
    utils.article.list.setData({ projectId }, context.previousArticles);
  },
  onSettled: () => {
    // Refetch to ensure sync
    void utils.article.list.invalidate();
  }
});
```

---

## Backend Architecture

### tRPC Router Structure

```typescript
// server/api/root.ts
import { createTRPCRouter } from './trpc';
import { organizationRouter } from './routers/organization';
import { projectRouter } from './routers/project';
import { articleRouter } from './routers/article';
import { importRouter } from './routers/import';

export const appRouter = createTRPCRouter({
  organization: organizationRouter,
  project: projectRouter,
  article: articleRouter,
  import: importRouter
});

export type AppRouter = typeof appRouter;
```

### Article Router Example

```typescript
// server/api/routers/article.ts

import { z } from 'zod';
import { createTRPCRouter, projectProcedure } from '../trpc';
import { ReviewWorkflowService } from '../../services/reviewWorkflow';

const reviewService = new ReviewWorkflowService();

export const articleRouter = createTRPCRouter({
  // List articles with filtering, sorting, pagination
  list: projectProcedure
    .input(
      z.object({
        projectId: z.string(),
        search: z.string().optional(),
        status: z.enum(['PENDING', 'INCLUDE', 'EXCLUDE', 'MAYBE']).optional(),
        sortBy: z.enum(['title', 'year', 'reviewedAt']).default('title'),
        sortOrder: z.enum(['asc', 'desc']).default('asc'),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0)
      })
    )
    .query(async ({ ctx, input }) => {
      const where = {
        projectId: input.projectId,
        ...(input.search && {
          OR: [
            { title: { contains: input.search, mode: 'insensitive' } },
            { authors: { contains: input.search, mode: 'insensitive' } },
            { journal: { contains: input.search, mode: 'insensitive' } }
          ]
        }),
        ...(input.status && { reviewDecision: input.status })
      };

      const [articles, total] = await Promise.all([
        ctx.prisma.article.findMany({
          where,
          orderBy: { [input.sortBy]: input.sortOrder },
          take: input.limit,
          skip: input.offset,
          include: {
            reviewHistory: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                user: { select: { name: true, image: true } }
              }
            }
          }
        }),
        ctx.prisma.article.count({ where })
      ]);

      return { articles, total };
    }),

  // Update review decision
  updateReview: projectProcedure
    .input(
      z.object({
        projectId: z.string(), // For auth middleware
        articleId: z.string(),
        decision: z.enum(['INCLUDE', 'EXCLUDE', 'MAYBE', 'PENDING']),
        notes: z.string().max(5000).optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await reviewService.updateReviewDecision(
        input.articleId,
        ctx.session.user.id,
        input.decision,
        input.notes
      );
    }),

  // Bulk update
  bulkUpdateReview: projectProcedure
    .input(
      z.object({
        projectId: z.string(),
        articleIds: z.array(z.string()).min(1).max(100),
        decision: z.enum(['INCLUDE', 'EXCLUDE', 'MAYBE', 'PENDING'])
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await reviewService.bulkUpdateReviewDecision(
        input.articleIds,
        ctx.session.user.id,
        input.decision
      );
    }),

  // Get review history
  getHistory: projectProcedure
    .input(
      z.object({
        projectId: z.string(),
        articleId: z.string()
      })
    )
    .query(async ({ ctx, input }) => {
      return await reviewService.getReviewHistory(input.articleId);
    })
});
```

---

## Testing Strategy

### Test Pyramid

```
          ┌────────────┐
          │    E2E     │  ← 5-10% (Critical user flows)
          └────────────┘
        ┌────────────────┐
        │  Integration   │  ← 30-40% (API routes, services)
        └────────────────┘
      ┌────────────────────┐
      │       Unit         │  ← 50-60% (Utilities, validators)
      └────────────────────┘
```

### Unit Tests (Vitest)

```typescript
// services/validation.test.ts

import { describe, it, expect } from 'vitest';
import { PMIDValidator, DOIValidator, YearValidator } from './validation';

describe('PMIDValidator', () => {
  const validator = new PMIDValidator();

  it('accepts valid PMID', () => {
    const result = validator.validate('38910001', 1);
    expect(result.valid).toBe(true);
  });

  it('rejects non-numeric PMID', () => {
    const result = validator.validate('ABC123', 1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('digits');
  });

  it('accepts empty PMID (optional field)', () => {
    const result = validator.validate('', 1);
    expect(result.valid).toBe(true);
  });
});

describe('DOIValidator', () => {
  const validator = new DOIValidator();

  it('accepts valid DOI', () => {
    const result = validator.validate('10.1000/jdh.2024.001', 1);
    expect(result.valid).toBe(true);
  });

  it('rejects invalid DOI format', () => {
    const result = validator.validate('invalid-doi', 1);
    expect(result.valid).toBe(false);
  });
});

describe('YearValidator', () => {
  const validator = new YearValidator();

  it('accepts valid year', () => {
    const result = validator.validate('2024', 1);
    expect(result.valid).toBe(true);
  });

  it('rejects non-numeric year', () => {
    const result = validator.validate('Twenty twenty', 1);
    expect(result.valid).toBe(false);
  });

  it('rejects year out of range', () => {
    const result = validator.validate('1800', 1);
    expect(result.valid).toBe(false);
  });
});
```

### Integration Tests (Vitest + Prisma Mock)

```typescript
// server/api/routers/article.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createInnerTRPCContext } from '../trpc';
import { appRouter } from '../root';

// Mock Prisma
vi.mock('../../db', () => ({
  prisma: {
    article: {
      findMany: vi.fn(),
      count: vi.fn()
    }
  }
}));

describe('articleRouter.list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns articles for valid project member', async () => {
    const ctx = createInnerTRPCContext({
      session: {
        user: { id: 'user1', name: 'Test', email: 'test@example.com' }
      }
    });

    const caller = appRouter.createCaller(ctx);

    // Mock project membership check
    vi.spyOn(ctx.prisma.projectMember, 'findFirst').mockResolvedValue({
      id: 'member1',
      projectId: 'project1',
      userId: 'user1',
      role: 'MEMBER'
    });

    // Mock articles query
    vi.spyOn(ctx.prisma.article, 'findMany').mockResolvedValue([
      { id: '1', title: 'Test Article', projectId: 'project1' }
    ]);
    vi.spyOn(ctx.prisma.article, 'count').mockResolvedValue(1);

    const result = await caller.article.list({
      projectId: 'project1'
    });

    expect(result.articles).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('throws FORBIDDEN for non-member', async () => {
    const ctx = createInnerTRPCContext({
      session: {
        user: { id: 'user2', name: 'Test', email: 'test@example.com' }
      }
    });

    const caller = appRouter.createCaller(ctx);

    // Mock no membership
    vi.spyOn(ctx.prisma.projectMember, 'findFirst').mockResolvedValue(null);

    await expect(
      caller.article.list({ projectId: 'project1' })
    ).rejects.toThrow('FORBIDDEN');
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/review-workflow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Article Review Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/signin');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('complete review workflow', async ({ page }) => {
    // Navigate to project
    await page.click('text=Test Organization');
    await page.click('text=Test Project');
    await page.click('text=Articles');

    // Wait for table to load
    await expect(page.locator('table')).toBeVisible();

    // Click Include on first article
    const firstRow = page.locator('tbody tr').first();
    await firstRow.locator('button:has-text("Include")').click();

    // Verify status updated
    await expect(firstRow.locator('[data-testid="status-badge"]')).toHaveText('INCLUDE');

    // Change to Exclude
    await firstRow.locator('button:has-text("Exclude")').click();
    await expect(firstRow.locator('[data-testid="status-badge"]')).toHaveText('EXCLUDE');
  });

  test('bulk review actions', async ({ page }) => {
    await page.goto('/org/test-project/articles');

    // Select multiple articles
    await page.click('thead input[type="checkbox"]'); // Select all

    // Bulk action dropdown
    await page.click('[data-testid="bulk-actions"]');
    await page.click('text=Mark as Include');

    // Confirm
    await page.click('button:has-text("Confirm")');

    // Verify all updated
    const statusBadges = page.locator('[data-testid="status-badge"]');
    await expect(statusBadges.first()).toHaveText('INCLUDE');
  });

  test('import articles', async ({ page }) => {
    await page.goto('/org/test-project/import');

    // Upload file
    await page.setInputFiles('input[type="file"]', 'sample_article_import.xlsx');

    // Verify preview
    await expect(page.locator('table tbody tr')).toHaveCount(20);

    // Import
    await page.click('button:has-text("Import")');

    // Verify success message
    await expect(page.locator('text=/Imported \\d+ articles/')).toBeVisible();
  });
});
```

---

## Deployment Architecture

### Deployment Options

#### Option 1: Vercel + Neon (Free Tier) ✅

**Infrastructure:**
```
┌─────────────────────────────────────────────────┐
│              Vercel Edge Network                │
│  ┌───────────────────────────────────────────┐  │
│  │     Next.js Application                   │  │
│  │  - SSR Pages                              │  │
│  │  - API Routes (tRPC)                      │  │
│  │  - Static Assets                          │  │
│  └───────────────┬───────────────────────────┘  │
└──────────────────┼─────────────────────────────┘
                   │
                   │ PostgreSQL Connection
                   │
┌──────────────────▼─────────────────────────────┐
│            Neon Serverless Postgres             │
│  - Auto-scaling compute                         │
│  - 10GB storage (free tier)                     │
│  - Connection pooling                           │
└─────────────────────────────────────────────────┘
```

**Setup:**
```bash
# 1. Create Neon database
neon projects create article-review-workspace
neon connection-string --database-name main

# 2. Set env vars in Vercel
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add GITHUB_ID
vercel env add GITHUB_SECRET

# 3. Deploy
vercel --prod
```

**Cost:** $0/month (within free tier limits)

#### Option 2: AWS with SST ✨

**Infrastructure:**
```
┌─────────────────────────────────────────────────────┐
│              CloudFront (CDN)                       │
└────────────────┬────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌─────────┐              ┌─────────────┐
│   S3    │              │  API Gateway │
│ Static  │              └──────┬───────┘
│ Assets  │                     │
└─────────┘                     ▼
                        ┌─────────────┐
                        │   Lambda    │
                        │  (Next.js)  │
                        └──────┬──────┘
                               │
                               ▼
                        ┌─────────────┐
                        │  RDS Aurora │
                        │  Serverless │
                        │  PostgreSQL │
                        └─────────────┘
```

**SST Configuration:**
```typescript
// sst.config.ts
import { SSTConfig } from 'sst';
import { NextjsSite, RDS } from 'sst/constructs';

export default {
  config(_input) {
    return {
      name: 'article-review-workspace',
      region: 'us-east-1'
    };
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      // Database
      const database = new RDS(stack, 'database', {
        engine: 'postgresql13.9',
        defaultDatabaseName: 'main',
        scaling: {
          minCapacity: 'ACU_2',
          maxCapacity: 'ACU_16'
        }
      });

      // Next.js site
      const site = new NextjsSite(stack, 'site', {
        bind: [database],
        environment: {
          DATABASE_URL: database.connectionString,
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
          NEXTAUTH_URL: process.env.NEXTAUTH_URL!
        }
      });

      stack.addOutputs({
        SiteUrl: site.url,
        DatabaseUrl: database.clusterArn
      });
    });
  }
} satisfies SSTConfig;
```

**Cost:** ~$20-30/month (Aurora Serverless minimum)

### Database Migrations in Production

```bash
# package.json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "postinstall": "prisma generate"
  }
}
```

**Migration Strategy:**
1. Development: `prisma migrate dev` (creates migration files)
2. CI/CD: `prisma migrate deploy` (applies pending migrations)
3. Rollback: `prisma migrate resolve --rolled-back <migration-name>`

### Environment Variables

```env
# .env.example
DATABASE_URL="postgresql://user:password@localhost:5432/db"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
GITHUB_ID="your-github-oauth-app-id"
GITHUB_SECRET="your-github-oauth-app-secret"
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Development Workflow

### Setup (First Time)

```bash
# 1. Clone and install
git clone <repo-url> article-review-workspace
cd article-review-workspace
npm install

# 2. Set up database (local Postgres or Docker)
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:14

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Run migrations
npx prisma migrate dev --name init

# 5. Seed database (optional)
npx prisma db seed

# 6. Start dev server
npm run dev
```

### Daily Development

```bash
# Start dev server (hot reload)
npm run dev

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check

# Linting
npm run lint

# Database UI
npx prisma studio
```

### Making Database Changes

```bash
# 1. Edit schema.prisma
# 2. Create migration
npx prisma migrate dev --name add-review-notes

# 3. Generate Prisma client
npx prisma generate
```

### Code Quality Tools

**ESLint Configuration:**
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

**Prettier Configuration:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

---

## Performance Considerations

### Database Optimization

**1. Indexing Strategy**
- Add indexes for frequently queried fields
- Composite indexes for multi-column queries
- Avoid over-indexing (slows writes)

**2. Query Optimization**
```typescript
// ❌ Bad: N+1 query problem
const articles = await prisma.article.findMany();
for (const article of articles) {
  const history = await prisma.reviewHistory.findMany({
    where: { articleId: article.id }
  });
}

// ✅ Good: Single query with include
const articles = await prisma.article.findMany({
  include: { reviewHistory: true }
});
```

**3. Pagination**
```typescript
// ✅ Cursor-based (efficient for large datasets)
const articles = await prisma.article.findMany({
  take: 50,
  cursor: lastArticleId ? { id: lastArticleId } : undefined,
  skip: lastArticleId ? 1 : 0
});

// ⚠️ Offset-based (simpler but slower for large offsets)
const articles = await prisma.article.findMany({
  take: 50,
  skip: page * 50
});
```

### Frontend Optimization

**1. Code Splitting**
```typescript
// Lazy load import modal
const ImportModal = dynamic(() => import('../components/article/ImportModal'), {
  loading: () => <Spinner />,
  ssr: false
});
```

**2. Memoization**
```typescript
const filteredArticles = useMemo(() => {
  return articles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [articles, searchQuery]);
```

**3. Virtual Scrolling (for large lists)**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function ArticleTable({ articles }) {
  const rowVirtualizer = useVirtualizer({
    count: articles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <ArticleRow key={virtualRow.index} article={articles[virtualRow.index]} />
        ))}
      </div>
    </div>
  );
}
```

---

## Scalability & Future Enhancements

### Horizontal Scaling

**Stateless API Layer:**
- Next.js API routes are stateless
- Can deploy multiple instances behind load balancer
- Session stored in database, not memory

**Database Scaling:**
- Read replicas for heavy read workloads
- Connection pooling (PgBouncer)
- Database sharding (if needed for very large scale)

### Future Feature Ideas

**1. Advanced Review Workflows**
- Multi-reviewer consensus
- Conflict resolution
- Review assignments
- Reviewer workload balancing

**2. Collaboration Features**
- Real-time updates (WebSockets or Pusher)
- Comments and discussions on articles
- @mentions and notifications
- Activity feed

**3. AI/ML Integration**
- Auto-categorization of articles
- Duplicate detection using embeddings
- Relevance scoring
- Citation analysis

**4. Export & Reporting**
- CSV/Excel export with filters
- PRISMA flow diagram generation
- Review progress reports
- Customizable dashboards

**5. Advanced Search**
- Full-text search (Postgres FTS or Algolia)
- Boolean operators
- Saved searches
- Search history

**6. Integration & API**
- Public API for programmatic access
- Webhooks for events
- Integration with Zotero, Mendeley
- PubMed direct import

---

This comprehensive documentation provides a complete blueprint for building the Article Review Workspace. Follow the implementation plan, reference these architectural patterns, and use the code examples as templates for your implementation.

**Next Steps:**
1. Review this documentation thoroughly
2. Set up development environment
3. Follow Phase 1 of implementation plan
4. Build incrementally, test continuously
5. Deploy early and often

Good luck! 🚀
