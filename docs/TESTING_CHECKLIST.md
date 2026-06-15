# Testing Checklist - Article Review Workspace

## Pre-Deployment Testing

### Authentication Flow
- [ ] Sign in with email works
- [ ] Session persists after refresh
- [ ] Redirects to dashboard after sign in
- [ ] Redirects to sign in when unauthenticated
- [ ] Sign out works correctly
- [ ] Protected routes require authentication

### Organization Management
- [ ] Can create new organization
- [ ] Organization name is required
- [ ] Description is optional
- [ ] Can view organization list
- [ ] Can click into organization
- [ ] Organization shows member count
- [ ] Organization shows project count
- [ ] Role badge displays correctly (OWNER/ADMIN/MEMBER)

### Project Management
- [ ] Can create new project within organization
- [ ] Project name is required
- [ ] Description is optional
- [ ] Can view project list in organization
- [ ] Can click into project
- [ ] Project shows article stats
- [ ] Project shows member list

### Article Import
- [ ] Can navigate to import page
- [ ] Drag and drop works
- [ ] File picker works
- [ ] Excel (.xlsx) files accepted
- [ ] CSV files accepted
- [ ] Other files rejected with error message
- [ ] Preview shows before import
- [ ] Column mapping is correct
- [ ] Validation errors display with row numbers
- [ ] Duplicates are detected (PMID, DOI)
- [ ] Can proceed with valid articles only
- [ ] Import success message shows
- [ ] Imported count is correct
- [ ] Skipped count is correct (duplicates + invalid)
- [ ] Can import sample data successfully

### Article Review
- [ ] Can view article list
- [ ] Search works (title, authors, PMID, DOI)
- [ ] Search is debounced (300ms)
- [ ] Status filter works (All, Pending, Include, Exclude, Maybe)
- [ ] Advanced filters work (year, journal, author)
- [ ] Can select individual articles
- [ ] Can select all articles
- [ ] Can clear selection with ESC key
- [ ] Individual review buttons work (✓/✗/?)
- [ ] Bulk review buttons work
- [ ] Article detail modal opens
- [ ] Can add review notes in modal
- [ ] Can change decision in modal
- [ ] Modal closes with ESC key
- [ ] Modal closes clicking outside
- [ ] Review updates appear immediately (optimistic)
- [ ] Toast notifications show for success/error
- [ ] Pagination works (Next, Previous, First, Last)
- [ ] Page numbers display correctly

### Keyboard Shortcuts
- [ ] j/k navigate articles
- [ ] i marks as INCLUDE
- [ ] e marks as EXCLUDE
- [ ] m marks as MAYBE
- [ ] Space toggles selection
- [ ] Enter opens detail modal
- [ ] ESC clears selection
- [ ] ESC closes modal
- [ ] Focused row is highlighted
- [ ] Keyboard hints display
- [ ] Shortcuts work in modal

### Statistics & Charts
- [ ] Stats cards show correct numbers
- [ ] Chart displays review distribution
- [ ] Colors are correct (green/red/yellow/gray)
- [ ] Percentages are accurate
- [ ] Progress bar shows completion %
- [ ] Chart updates after review changes

### Export
- [ ] Export Excel button appears when articles exist
- [ ] Excel export downloads file
- [ ] Excel contains all article data
- [ ] File name includes project name
- [ ] File name includes timestamp
- [ ] All columns are present
- [ ] Data is formatted correctly

### Error Handling
- [ ] Error page displays for runtime errors
- [ ] 404 page displays for missing routes
- [ ] Can recover from errors (Try Again button)
- [ ] Can navigate home from error page
- [ ] Development mode shows error details
- [ ] Production mode hides error details
- [ ] Network errors show toast notification
- [ ] Invalid data shows validation errors

### Loading States
- [ ] Dashboard shows skeleton while loading
- [ ] Articles page shows skeleton while loading
- [ ] Project page shows skeleton while loading
- [ ] Loading spinners show during mutations
- [ ] Button states show "Saving..." etc.
- [ ] No flash of unstyled content

### Accessibility
- [ ] All inputs have visible labels
- [ ] Focus states are highly visible
- [ ] Keyboard navigation works throughout
- [ ] ARIA labels present on controls
- [ ] Color contrast meets WCAG AA (4.5:1+)
- [ ] Touch targets are 44px+ (mobile)
- [ ] Screen reader compatibility (test with NVDA/JAWS)
- [ ] Tab order is logical
- [ ] Skip links work (if applicable)
- [ ] Error messages are announced

### UI/UX
- [ ] Text in inputs is clearly visible
- [ ] Placeholder text has good contrast
- [ ] Buttons have hover states
- [ ] Buttons have active states
- [ ] Buttons have disabled states
- [ ] Links have hover states
- [ ] Form validation is clear
- [ ] Success messages are visible
- [ ] Error messages are visible
- [ ] Modals have backdrop
- [ ] Modals can be closed multiple ways

### Responsive Design
- [ ] Mobile view (375px) looks good
- [ ] Tablet view (768px) looks good
- [ ] Desktop view (1920px) looks good
- [ ] Touch targets are large enough
- [ ] No horizontal scroll on mobile
- [ ] Navigation works on mobile
- [ ] Modals fit on mobile screens
- [ ] Tables are scrollable on mobile
- [ ] Charts render correctly on mobile

### Performance
- [ ] Page loads in <3 seconds
- [ ] No layout shift (CLS)
- [ ] Images load quickly (if any)
- [ ] Search is debounced
- [ ] Large lists paginate
- [ ] No memory leaks (check DevTools)
- [ ] Bundle size is reasonable (<500KB)

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Security
- [ ] API routes require authentication
- [ ] Server-side authorization enforced
- [ ] Database queries are parameterized
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] HTTPS in production
- [ ] Environment variables not exposed
- [ ] No sensitive data in client bundle

## Production Testing (After Deployment)

### Deployment
- [ ] Build succeeds on Vercel
- [ ] Environment variables set correctly
- [ ] Database connection works
- [ ] Migrations ran successfully
- [ ] Production URL is accessible
- [ ] HTTPS certificate is valid
- [ ] No console errors in production

### Functionality
- [ ] Sign in works in production
- [ ] All features work as in development
- [ ] File upload works in production
- [ ] Database writes persist
- [ ] Database reads are fast
- [ ] No CORS errors
- [ ] API calls succeed

### Performance
- [ ] Lighthouse score >90 (Performance)
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s
- [ ] No unused JavaScript
- [ ] Images optimized (if any)
- [ ] Fonts load quickly

### Monitoring
- [ ] Error tracking configured (optional)
- [ ] Analytics configured (optional)
- [ ] Vercel logs accessible
- [ ] Database monitoring available

## Edge Cases

### Data Validation
- [ ] Empty file upload rejected
- [ ] Invalid PMID format rejected
- [ ] Invalid DOI format rejected
- [ ] Invalid year rejected
- [ ] Missing required fields rejected
- [ ] Very long text handles gracefully
- [ ] Special characters in names work
- [ ] Unicode characters supported

### Limits
- [ ] Large file uploads (<10MB) work
- [ ] 1000+ articles load correctly
- [ ] Pagination handles large datasets
- [ ] Search handles many results
- [ ] Bulk operations handle 100+ items

### Concurrency
- [ ] Multiple users can review simultaneously
- [ ] Optimistic updates don't conflict
- [ ] Database handles concurrent writes
- [ ] Race conditions handled

## Regression Testing

After any code changes, verify:
- [ ] Sign in still works
- [ ] Article import still works
- [ ] Article review still works
- [ ] Export still works
- [ ] No new console errors
- [ ] No broken links
- [ ] No visual regressions

## Pre-Launch Checklist

- [ ] All tests passing
- [ ] No console warnings/errors
- [ ] README updated with live demo link
- [ ] Environment variables documented
- [ ] Deployment guide verified
- [ ] Demo video recorded (optional)
- [ ] Screenshots taken for portfolio
- [ ] Code formatted and linted
- [ ] No TODO comments in critical code
- [ ] Git repository clean (no secrets)

## Post-Launch Monitoring

First 24 hours:
- [ ] Check Vercel logs for errors
- [ ] Monitor database usage
- [ ] Check performance metrics
- [ ] Verify analytics working
- [ ] Test from different locations
- [ ] Test from different devices

## Notes

**Critical Issues:** Stop and fix immediately
**Major Issues:** Fix before launch
**Minor Issues:** Document and fix post-launch
**Nice to Have:** Add to backlog

## Test Results

Date: ___________
Tester: ___________
Environment: Development / Staging / Production

Pass Rate: _____% (_____ passed / _____ total)

Critical Issues Found: ______
Major Issues Found: ______
Minor Issues Found: ______

Status: ☐ Ready for Production ☐ Needs Work

Notes:
_________________________________
_________________________________
_________________________________
