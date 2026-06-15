# Deployment Guide - Article Review Workspace

## Prerequisites

- GitHub account
- Vercel account (free tier)
- Neon account (free tier)

## Step 1: Prepare Your Repository

### 1.1 Initialize Git (if not already done)
```bash
cd article-review-workspace
git init
git add .
git commit -m "Initial commit: Article Review Workspace"
```

### 1.2 Create GitHub Repository
1. Go to https://github.com/new
2. Name: `article-review-workspace`
3. Visibility: Public or Private
4. **Don't initialize** with README/gitignore
5. Click "Create repository"

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/article-review-workspace.git
git branch -M main
git push -u origin main
```

---

## Step 2: Set Up Neon Database

### 2.1 Create Neon Account
1. Go to https://neon.tech
2. Sign up with GitHub
3. Complete verification

### 2.2 Create Database
1. Click "Create Project"
2. Project name: `article-review-db`
3. Region: Choose closest to your users
4. Postgres version: 15 or latest
5. Click "Create Project"

### 2.3 Get Connection String
1. In project dashboard, click "Connection Details"
2. Select "Pooled connection"
3. Copy the connection string (starts with `postgres://`)
4. Example:
   ```
   postgres://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
5. **Save this** - you'll need it for Vercel

---

## Step 3: Deploy to Vercel

### 3.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel to access your repositories

### 3.2 Import Project
1. Click "Add New..." → "Project"
2. Select your GitHub repository: `article-review-workspace`
3. Click "Import"

### 3.3 Configure Project
**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `article-review-workspace`

**Build Settings:**
- Build Command: `npm run build`
- Output Directory: `.next` (default)
- Install Command: `npm install`

### 3.4 Environment Variables
Click "Environment Variables" and add:

```env
# Database
DATABASE_URL=postgres://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# NextAuth
NEXTAUTH_SECRET=<generate-with-command-below>
NEXTAUTH_URL=https://your-project.vercel.app

# AWS SES (Email Service)
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_SES_REGION=us-west-2
AWS_SES_SENDER=noreply@yourdomain.com
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```
Copy the output and paste as NEXTAUTH_SECRET value.

**AWS SES Setup:**
1. Go to AWS Console → SES → Verified identities
2. Verify your sender email address
3. Create IAM user with SES permissions
4. Generate access keys
5. Add credentials to environment variables

**Note:** Leave NEXTAUTH_URL blank for now. We'll update it after deployment.

### 3.5 Deploy
1. Click "Deploy"
2. Wait 2-3 minutes for build
3. You'll see "Congratulations" when done

---

## Step 4: Run Database Migrations

### 4.1 Update Local Environment
Create `.env.production.local`:
```env
DATABASE_URL="postgres://username:password@ep-xxx.neon.tech/neondb?sslmode=require"
```

### 4.2 Run Migrations
```bash
cd article-review-workspace
npm run db:push
```

This creates all tables in your Neon database.

---

## Step 5: Update Production Settings

### 5.1 Get Your Vercel URL
After deployment, you'll have a URL like:
```
https://article-review-workspace-abc123.vercel.app
```

### 5.2 Update Environment Variable
1. Go to Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Find `NEXTAUTH_URL`
5. Update value to your actual URL:
   ```
   https://article-review-workspace-abc123.vercel.app
   ```
6. Click "Save"

### 5.3 Redeploy
1. Go to "Deployments" tab
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Wait for rebuild

---

## Step 6: Test Production

### 6.1 Visit Your Site
Go to: `https://your-project.vercel.app`

### 6.2 Create Account
1. Click "Sign Up" or go to `/auth/signup`
2. Enter name, email, and password
3. Password must have:
   - At least 8 characters
   - One uppercase letter
   - One lowercase letter
   - One number
4. Account created successfully

### 6.3 Sign In
1. Go to `/auth/signin`
2. Enter your email and password
3. Should redirect to dashboard

### 6.4 Test Features
- ✅ Create account with password
- ✅ Sign in/out
- ✅ Create organization
- ✅ Create project
- ✅ Invite members via email
- ✅ Import articles (Excel/CSV)
- ✅ Review articles (Include/Exclude/Maybe)
- ✅ Export data

---

## Troubleshooting

### Build Fails
**Error:** "Prisma Client not found"
**Fix:** Ensure `postinstall` script exists in `package.json`:
```json
"scripts": {
  "postinstall": "prisma generate"
}
```

### Database Connection Error
**Error:** "Can't reach database server"
**Fix:**
1. Verify DATABASE_URL is correct
2. Ensure it includes `?sslmode=require`
3. Check Neon database is active (not paused)

### NextAuth Error
**Error:** "NEXTAUTH_SECRET must be set"
**Fix:**
1. Generate new secret: `openssl rand -base64 32`
2. Add to Vercel environment variables
3. Redeploy

### 401 Unauthorized on Sign In
**Fix:**
1. Verify NEXTAUTH_URL matches your Vercel URL exactly
2. No trailing slash
3. HTTPS protocol
4. Redeploy after changing

---

## Custom Domain (Optional)

### Add Custom Domain
1. Go to Project Settings → Domains
2. Enter your domain: `yourapp.com`
3. Follow DNS configuration instructions
4. Update NEXTAUTH_URL to use custom domain
5. Redeploy

---

## Monitoring

### Vercel Analytics
1. Go to Analytics tab
2. View page views, performance
3. Free tier: 100k requests/month

### Neon Monitoring
1. Go to Neon dashboard
2. View database usage
3. Free tier: 512 MB storage, 3 GB transfer/month

---

## Maintenance

### Update Code
```bash
git add .
git commit -m "Update: description"
git push
```
Vercel auto-deploys on push to main.

### Database Migrations
After schema changes:
```bash
npm run db:push
```

### View Logs
- Vercel: Project → Functions → View logs
- Database: Neon → Monitoring

---

## Cost Estimate

**Free Tier (Recommended for Demo):**
- Vercel: Free (Unlimited personal projects)
- Neon: Free (512 MB, 3 GB transfer)
- **Total: $0/month**

**Paid Tier (If Needed):**
- Vercel Pro: $20/month (team features)
- Neon Scale: $19/month (larger database)
- **Total: ~$39/month**

---

## For Recruiters

**Live Demo URL:** https://your-project.vercel.app

**Tech Stack:**
- Frontend: Next.js 16, React 19, TypeScript
- Backend: tRPC, Prisma ORM
- Database: PostgreSQL (Neon)
- Styling: Tailwind CSS 4
- Auth: NextAuth.js
- Deployment: Vercel (CI/CD)

**Features Demonstrated:**
- Multi-tenant SaaS architecture
- Excel/CSV import with validation
- Systematic review workflow
- Real-time collaboration
- Type-safe full-stack development

---

## Support

Issues? Check:
1. Vercel deployment logs
2. Browser console (F12)
3. Neon database status
4. Environment variables set correctly

**Repository:** https://github.com/YOUR_USERNAME/article-review-workspace
