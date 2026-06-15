# Claude Memory - Article Review Workspace Project

## Project Overview
Building an Article Review Workspace for EasySLR as part of a software engineering assignment.

## Assignment Context
- **Purpose**: Complete product slice for article review workspace
- **Tech Stack**: Next.js, React, TypeScript, Tailwind CSS, Prisma, PostgreSQL, NextAuth, tRPC
- **Timeline**: 1 week (8-12 focused hours recommended)
- **Deployment**: AWS preferred (SST), but documenting approach for free/local options

## Key Requirements
1. **Multi-tenant Architecture**: Organizations → Projects → Articles → Users
2. **Article Import**: Excel/CSV import with validation (PubMed-style data)
3. **Review Workflow**: Include/Exclude/Maybe decision system
4. **Authorization**: Project-scoped access control (server-side enforcement)
5. **Table Interface**: Search, filter, sort, bulk actions
6. **Data Validation**: Handle duplicates, invalid, incomplete rows

## Domain Model
```
Organization (1) ---> (many) Projects
Organization (1) ---> (many) Users (members)
Project (1) ---> (many) Articles
Project (1) ---> (many) Users (members)
Article (1) ---> (many) ReviewDecisions
User (1) ---> (many) ReviewDecisions
```

## Design Decisions
- **Scaffolding**: create-t3-app (T3 stack)
- **Review Workflow**: Include/Exclude/Maybe (simple 3-state)
- **Auth Pattern**: NextAuth with session-based authorization
- **API Layer**: tRPC for type-safe API
- **Deployment**: Document AWS/SST approach but use free tier/Railway/Vercel for demo

## Sample Data
- Located in: `sample_article_import (1).xlsx`
- Contains 20 sample articles with PubMed fields
- Known issues: duplicate PMIDs, missing data, invalid years

## Evaluation Criteria
1. Product judgment (coherent workflow)
2. Data modeling (clear boundaries)
3. Authorization (server-side enforcement)
4. Import handling (validation + feedback)
5. Frontend quality (UX, states, filters)
6. Code quality (maintainable, type-safe)
7. Testing (focused, behavioral)
8. Deployment (working or credible notes)
9. Communication (clear README, tradeoffs)

## User Preferences
- Using create-t3-app for scaffolding
- Include/Exclude/Maybe review workflow
- 8-12 hour timebox
- Want reliable deployment approach without spending money

## Next Steps
Following the implementation plan in the planning document.

## AI Usage Notes
- Using Claude Code for project planning and implementation
- Will verify all code, especially auth and validation logic
- Will test import handling with edge cases from sample data
