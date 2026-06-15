# Project Invitation System - Complete Guide

## 📧 How Email Invitations Work

### **Invitation Flow**

```
1. Admin/Owner sends invitation
   ↓
2. Email sent to recipient
   ↓
3. Recipient clicks link in email
   ↓
4. System checks authentication
   ↓
5. If not signed in → Redirect to /auth/signin
   ↓
6. After sign-in → Auto-accept invitation
   ↓
7. User added to project
   ↓
8. Redirect to project page
```

---

## 🎯 Step-by-Step User Journey

### **1. Sending an Invitation**

**Who can send:** Project Owners and Admins

**Steps:**
1. Go to Project → Members tab
2. Enter recipient's email address
3. Select role (ADMIN or MEMBER)
4. Click "Send Invite"
5. ✅ Email sent with invitation link

**Email contains:**
- Beautiful HTML template
- Project name
- Inviter's name
- "Accept Invitation" button
- Direct link to `/invite/[token]`
- Expiration notice (7 days)

---

### **2. Receiving the Invitation**

**Recipient gets email with:**

```
Subject: You've been invited to join "[Project Name]"

Hi there! 👋

[Inviter Name] has invited you to collaborate on the project
"[Project Name]" in Article Review Workspace.

Click the button below to accept the invitation and start reviewing articles:

[Accept Invitation Button]

Or copy this link: https://your-app.vercel.app/invite/abc123xyz

This invitation will expire in 7 days.
```

---

### **3. Clicking the Invitation Link**

**Scenario A: User NOT signed in**

1. Click link → Redirected to `/auth/signin`
2. Token saved in browser (sessionStorage)
3. User signs in or creates account
4. After successful auth → Automatically redirects back
5. Invitation automatically accepted
6. Redirected to project page

**Scenario B: User ALREADY signed in**

1. Click link → Goes to `/invite/[token]`
2. System validates invitation
3. If valid → Auto-accepts
4. Shows success message
5. Redirects to project page

**Scenario C: Wrong email**

If signed-in user's email doesn't match invitation:
- ❌ Error: "This invitation was sent to a different email address"
- User must sign in with correct email

---

### **4. Validation Checks**

System validates:

1. ✅ **Token exists** - Invitation found in database
2. ✅ **Not expired** - Within 7 days of creation
3. ✅ **Not already accepted** - Can't accept twice
4. ✅ **Email matches** - Must use invited email address
5. ✅ **Not already member** - Can't join if already in project

---

### **5. After Acceptance**

**What happens:**
- ✅ User added to ProjectMembers table
- ✅ Given specified role (ADMIN or MEMBER)
- ✅ Invitation marked as "accepted" (acceptedAt timestamp)
- ✅ Full access to project features
- ✅ Can view/review articles
- ✅ Can collaborate with team

**Permissions by role:**

| Action | OWNER | ADMIN | MEMBER |
|--------|-------|-------|--------|
| View articles | ✅ | ✅ | ✅ |
| Review articles | ✅ | ✅ | ✅ |
| Import articles | ✅ | ✅ | ✅ |
| Invite members | ✅ | ✅ | ❌ |
| Remove members | ✅ | ✅ | ❌ |
| Change roles | ✅ | ✅ | ❌ |
| Delete project | ✅ | ❌ | ❌ |

---

## 🔄 Resend Invitation Feature (NEW!)

### **When to use:**

- ❌ Email wasn't received
- ❌ Link expired (after 7 days)
- ❌ Email went to spam
- ❌ User deleted the email

### **How to resend:**

1. Go to Project → Members tab
2. Find invitation in "Pending Invitations" section
3. Click **"📧 Resend"** button
4. ✅ New email sent to same address
5. ✅ Expiration extended by 7 more days
6. ✅ Same token (link still works)

**Benefits:**
- ✅ **Extends expiration** - Adds 7 more days from resend time
- ✅ **Same invitation link** - Old link continues to work
- ✅ **Same role** - Maintains originally selected role
- ✅ **Unlimited resends** - Can resend as many times as needed

**Example:**
```
Day 1: Send invitation (expires Day 8)
Day 6: User didn't see email
Day 6: Click "Resend" (now expires Day 13)
Day 10: Click "Resend" again (now expires Day 17)
```

---

## 🚫 Cancel Invitation

**When to use:**
- ❌ Wrong email address
- ❌ Person shouldn't have access anymore
- ❌ Role was wrong (cancel and resend with correct role)

**How to cancel:**

1. Go to Project → Members tab
2. Find invitation in "Pending Invitations"
3. Click **"Cancel"** button
4. ✅ Invitation deleted
5. ✅ Link no longer works
6. ✅ Email recipient can't accept

**Note:** Cancelled invitations cannot be recovered. You must send a new invitation.

---

## ⚠️ Common Issues & Solutions

### **Issue 1: "Invitation not found or has expired"**

**Cause:** Link expired after 7 days

**Solution:**
1. Ask admin to click "Resend"
2. Or send new invitation

---

### **Issue 2: "This invitation has already been accepted"**

**Cause:** You've already joined the project

**Solution:**
- Go directly to project page
- Check your dashboard for the project

---

### **Issue 3: "This invitation was sent to a different email address"**

**Cause:** Signed in with wrong email

**Solution:**
1. Sign out
2. Sign in with the email that received the invitation
3. Click invitation link again

---

### **Issue 4: "You are already a member of this project"**

**Cause:** You're already in the project

**Solution:**
- Go to dashboard
- Find the project in your list
- Click to access it

---

### **Issue 5: Email not received**

**Solutions:**
1. **Check spam folder** - AWS SES emails sometimes go to spam
2. **Verify email address** - Admin should check spelling
3. **Click "Resend"** - Have admin resend invitation
4. **Check AWS SES status** - Ensure sender email is verified
5. **Production mode** - If in sandbox mode, recipient must be verified in AWS SES

---

### **Issue 6: Invitation link shows localhost**

**Cause:** NEXTAUTH_URL not set in production

**Solution:**
1. Go to Vercel → Settings → Environment Variables
2. Add: `NEXTAUTH_URL` = `https://your-app.vercel.app`
3. Redeploy
4. New invitations will have correct URL

**OR:**
- System should auto-detect from `VERCEL_URL`
- Check function logs to see what URL is being used

---

## 🔐 Security Features

1. **Unique tokens** - Cryptographically secure random tokens
2. **Expiration** - 7 days max, prevents old links from working
3. **Email verification** - Must use exact email address
4. **One-time use** - Can't accept same invitation twice
5. **Permission checks** - Only admins can invite/cancel
6. **Audit trail** - Tracks who invited whom and when

---

## 📊 Invitation States

| State | Description | Actions Available |
|-------|-------------|-------------------|
| **Pending** | Sent but not accepted | Resend, Cancel |
| **Accepted** | User joined project | None (can remove member) |
| **Expired** | Past 7 days | Resend (extends expiration) |
| **Cancelled** | Admin cancelled | None (must create new) |

---

## 🎨 UI Components

### **Pending Invitations Section**

Shows:
- 📧 Email address
- 🎭 Role (ADMIN/MEMBER)
- 📅 Expiration date
- 📧 Resend button (blue)
- ❌ Cancel button (red)

**Amber/Yellow theme** - Indicates pending status

### **Active Members Section**

Shows:
- 👤 Avatar/initials
- 📛 Name
- 📧 Email
- 🎭 Role badge
- 👤 Member count

**Green theme** - Indicates active status

---

## 🧪 Testing Checklist

### **Before Deployment:**

- [ ] Send invitation to yourself
- [ ] Check email arrives
- [ ] Click link (not signed in)
- [ ] Sign in
- [ ] Verify auto-acceptance works
- [ ] Check redirected to project
- [ ] Send another invitation
- [ ] Click link (already signed in)
- [ ] Verify immediate acceptance
- [ ] Test resend button
- [ ] Test cancel button
- [ ] Test expired invitation
- [ ] Test wrong email login

---

## 🚀 Production Checklist

### **AWS SES Configuration:**

- [ ] Sender email verified in AWS SES
- [ ] AWS credentials added to Vercel
- [ ] AWS SES in production mode (not sandbox)
- [ ] Test email sends successfully

### **Vercel Configuration:**

- [ ] NEXTAUTH_URL set (or auto-detecting)
- [ ] DATABASE_URL configured
- [ ] NEXTAUTH_SECRET set
- [ ] All AWS env vars set

### **Functional Tests:**

- [ ] Invitation email has correct URL (not localhost)
- [ ] Accept flow works end-to-end
- [ ] Resend extends expiration
- [ ] Cancel removes invitation
- [ ] Expired invitations show error
- [ ] Email validation works

---

## 📝 Email Template

The email template includes:

**Features:**
- ✅ Responsive HTML design
- ✅ Beautiful gradient header (purple/blue)
- ✅ Clear call-to-action button
- ✅ Fallback plain text version
- ✅ Project name prominently displayed
- ✅ Inviter name shown
- ✅ Link copy-paste option
- ✅ Expiration notice
- ✅ Professional footer

**Colors:**
- Header: Blue to purple gradient
- Button: Blue to purple gradient
- Text: Dark gray on white
- Links: Blue accent

---

## 🔗 Related Files

**Backend:**
- `src/server/api/routers/member.ts` - Invitation logic
- `src/lib/email.ts` - Email sending
- `src/lib/getBaseUrl.ts` - URL detection

**Frontend:**
- `src/app/invite/[token]/page.tsx` - Accept page
- `src/app/project/[id]/members/page.tsx` - Members UI
- `src/app/auth/signin/page.tsx` - Sign-in page

**Database:**
- `ProjectInvitation` table - Stores invitations
- `ProjectMember` table - Stores accepted members

---

## 💡 Best Practices

1. **Always use correct email** - Double-check before sending
2. **Set appropriate role** - MEMBER for reviewers, ADMIN for managers
3. **Monitor pending invitations** - Follow up if not accepted
4. **Resend if expired** - Better than creating duplicate invitations
5. **Cancel mistakes immediately** - Prevents wrong access
6. **Check spam folders** - Advise recipients if email delayed
7. **Use production mode AWS SES** - For unrestricted sending

---

## 🎯 Summary

**Invitation system provides:**
- ✅ Secure, token-based invitations
- ✅ Beautiful email templates
- ✅ Automatic acceptance flow
- ✅ Resend functionality with expiration extension
- ✅ Role-based access control
- ✅ Full audit trail
- ✅ User-friendly error messages

**Perfect for:**
- 👥 Onboarding team members
- 📊 Collaborative research projects
- 🎓 Academic collaboration
- 🏢 Organization-wide access

---

*Last updated: After resend functionality implementation*
