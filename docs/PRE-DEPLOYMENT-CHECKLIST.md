# Pre-Deployment Checklist ✅

## Before You Deploy

### 1. Build Verification
- [x] Production build completes successfully
- [x] No TypeScript errors
- [x] No build warnings (except lockfile warning - safe to ignore)

```bash
npm run build
```

### 2. Environment Variables Ready

#### Required Variables:
- [ ] `DATABASE_URL` - PostgreSQL connection string from Neon
- [ ] `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL` - Your production URL (update after first deploy)

#### Email Service (AWS SES):
- [ ] `AWS_ACCESS_KEY_ID` - Your AWS access key
- [ ] `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- [ ] `AWS_SES_REGION` - AWS region (e.g., us-west-2)
- [ ] `AWS_SES_SENDER` - Verified sender email in AWS SES

**Note:** If you don't configure AWS SES, the app will work but email invitations will fail. You can skip this for initial deployment and add it later.

### 3. Database Setup

#### Neon Database:
1. [ ] Created Neon account at https://neon.tech
2. [ ] Created PostgreSQL database
3. [ ] Copied connection string (with `?sslmode=require`)
4. [ ] Saved connection string securely

### 4. AWS SES Setup (Optional but Recommended)

1. [ ] Verified sender email in AWS SES console
2. [ ] Created IAM user with SES send permissions
3. [ ] Generated access keys for IAM user
4. [ ] Saved credentials securely

**Permission needed for IAM user:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

### 5. Git Repository

- [ ] All changes committed
- [ ] Pushed to GitHub
- [ ] Repository is accessible (public or connected to Vercel)

```bash
git status  # Should show "working tree clean"
git push origin main
```

### 6. Feature Verification (Local)

Test these features locally before deploying:

- [ ] Sign up with email/password works
- [ ] Sign in with email/password works
- [ ] Sign out works
- [ ] Create organization
- [ ] Create project
- [ ] Import articles from Excel/CSV
- [ ] Review articles (Include/Exclude/Maybe)
- [ ] Invite member (will fail if AWS SES not configured - that's OK)
- [ ] Accept invitation (if email works)

### 7. Deployment Platform

#### Using Vercel (Recommended):
- [ ] Created Vercel account
- [ ] Connected GitHub account
- [ ] Ready to import project

#### Using Other Platform:
- [ ] Platform supports Next.js 16
- [ ] Platform supports Node.js 18+
- [ ] Can configure environment variables
- [ ] Can run `prisma generate` during build

---

## Deployment Steps

### Quick Deploy to Vercel:

1. **Import Project:**
   - Go to https://vercel.com/new
   - Select your GitHub repository
   - Root directory: `article-review-workspace`

2. **Add Environment Variables:**
   Copy from your `.env` file (exclude AWS credentials if not ready):
   ```env
   DATABASE_URL=postgres://...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

3. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes

4. **Run Migrations:**
   ```bash
   # Update .env with production DATABASE_URL
   npm run db:push
   ```

5. **Update NEXTAUTH_URL:**
   - Copy your Vercel URL
   - Update environment variable in Vercel
   - Redeploy

6. **Test Production:**
   - Visit your site
   - Create account
   - Test core features

---

## Common Issues & Solutions

### Issue: Build fails with "Prisma Client not found"
**Solution:** Add postinstall script to package.json:
```json
"scripts": {
  "postinstall": "prisma generate"
}
```

### Issue: "Can't reach database server"
**Solution:**
- Verify DATABASE_URL is correct
- Ensure it has `?sslmode=require`
- Check Neon database is not paused

### Issue: Email invitations fail
**Solution:**
- Verify AWS credentials are correct
- Check sender email is verified in AWS SES
- Ensure IAM user has SES send permissions
- Check AWS SES is in production mode (not sandbox)

### Issue: Sign in fails after deployment
**Solution:**
- Verify NEXTAUTH_URL matches your exact deployment URL
- No trailing slash
- Must be HTTPS in production
- Redeploy after updating

### Issue: "NEXTAUTH_SECRET must be set"
**Solution:**
- Generate: `openssl rand -base64 32`
- Add to Vercel environment variables
- Redeploy

---

## Performance Checklist

- [x] Static pages are prerendered
- [x] API routes are optimized
- [x] Database queries use indexes
- [x] No console.logs in production (minimal)

---

## Security Checklist

- [x] NEXTAUTH_SECRET is strong and unique
- [x] Database credentials are not in code
- [x] AWS credentials are not in code
- [x] Passwords are hashed with bcrypt
- [x] SQL injection protection (Prisma)
- [x] XSS protection (React)
- [x] CSRF protection (NextAuth)

---

## Post-Deployment

### After First Deploy:

1. [ ] Test sign up flow
2. [ ] Test sign in flow
3. [ ] Create test organization
4. [ ] Create test project
5. [ ] Import sample articles
6. [ ] Test review workflow
7. [ ] Test email invitations (if AWS SES configured)
8. [ ] Check browser console for errors
9. [ ] Verify all pages load correctly
10. [ ] Test on mobile device

### Optional Enhancements:

- [ ] Add custom domain
- [ ] Set up monitoring (Vercel Analytics)
- [ ] Configure error tracking (Sentry)
- [ ] Add backup strategy for database
- [ ] Set up staging environment

---

## Support

**Full deployment guide:** See `DEPLOYMENT.md`

**Environment variables:** See `.env.example`

**Repository:** https://github.com/YOUR_USERNAME/article-review-workspace

---

## Ready to Deploy? 🚀

If all checkboxes above are checked, you're ready to deploy!

**Next step:** Follow `DEPLOYMENT.md` for detailed instructions.
