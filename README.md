# Article Review Workspace

A comprehensive systematic literature review platform for research teams to collaborate on article screening and review processes.

## 🌟 Live Demo

**Production:** https://article-review-workspace-ten.vercel.app/
**Repository:** [\[Your GitHub URL\]](https://github.com/PulkitUjjainwal/Article-Review-Workspace)

## ✨ Features

### Authentication & Authorization
- 🔐 Secure user registration and login with NextAuth.js
- 🔑 Password reset functionality via email
- 👥 Role-based access control (Owner, Admin, Member)
- 🛡️ Bcrypt password hashing and JWT sessions

### Organization & Project Management
- 🏢 Create and manage multiple organizations
- 📁 Create projects within organizations
- 📊 Project statistics and progress tracking
- 📈 Visual charts for review status distribution

### Team Collaboration
- ✉️ Invite team members via email
- 🎫 Token-based invitation system with expiration
- 🔄 Accept/decline invitations from dashboard or email
- 👤 Assign and manage member roles

### Article Management
- 📥 Import articles from Excel files (.xlsx, .xls, .csv)
- 🔍 Advanced filtering (status, year, journal, author)
- 🔢 Multi-column sorting and pagination
- 📝 Individual and bulk review updates
- 📜 Review history tracking
- ⌨️ Keyboard shortcuts for efficient workflow
- ⏪ Undo/redo functionality
- 📤 Export to Excel and CSV

### Email Integration
- 📧 AWS SES integration for transactional emails
- 💌 Professional HTML email templates
- 🔔 Password reset notifications
- 📬 Project invitation emails

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16.2.9 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **UI Components:** Custom components with Tailwind
- **State Management:** React Query (TanStack Query)
- **Forms:** React Hook Form with Zod validation

### Backend
- **API:** tRPC for type-safe APIs
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js with JWT strategy
- **Email:** AWS SES (AWS SDK v3)
- **Validation:** Zod schemas

### DevOps & Tools
- **Deployment:** Vercel (recommended)
- **Database Hosting:** Neon PostgreSQL
- **Version Control:** Git
- **Package Manager:** npm
- **Testing:** Jest with Testing Library

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- AWS account with SES configured
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/article-review-workspace.git
cd article-review-workspace
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"  # Auto-detected in production

# AWS SES (Email Service)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_SES_REGION="us-west-2"
AWS_SES_SENDER="noreply@yourdomain.com"  # Must be verified in AWS SES
```

### 4. Set Up the Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed database with sample data
npx prisma db seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your application!

## 📦 Build & Deploy

### Production Build

```bash
npm run build
npm start
```

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## 📖 Usage Guide

### Creating Your First Project

1. **Sign Up:** Create an account at `/auth/signup`
2. **Create Organization:** From dashboard, click "Create Organization"
3. **Create Project:** Within organization, click "New Project"
4. **Invite Team:** Go to project members, invite collaborators
5. **Import Articles:** Upload Excel file with article data
6. **Review Articles:** Screen articles with filtering and sorting
7. **Export Results:** Download reviewed articles as Excel/CSV

### Keyboard Shortcuts

- `j` / `k` - Navigate down/up through articles
- `i` - Mark as Include
- `e` - Mark as Exclude
- `m` - Mark as Maybe
- `Space` - Select/deselect article
- `Enter` - Open article details
- `Cmd/Ctrl + Z` - Undo last action
- `Cmd/Ctrl + Shift + Z` - Redo action

## 🔒 Security Features

- ✅ Password hashing with bcryptjs (10 rounds)
- ✅ Password strength validation
- ✅ Email format validation
- ✅ Secure token generation (crypto.randomBytes)
- ✅ Role-based authorization
- ✅ SQL injection protection (Prisma ORM)
- ✅ XSS protection (React auto-escaping)
- ✅ CSRF protection (NextAuth.js)
- ✅ Environment-aware logging

## 📊 Database Schema

The application uses 13 database models:

- **Authentication:** User, Account, Session, VerificationToken, PasswordResetToken
- **Organizations:** Organization, OrganizationMember
- **Projects:** Project, ProjectMember, ProjectInvitation
- **Articles:** Article, ReviewHistory

See [prisma/schema.prisma](./prisma/schema.prisma) for full schema.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📝 Project Structure

```
article-review-workspace/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/        # Dashboard
│   │   ├── org/              # Organization pages
│   │   ├── project/          # Project pages
│   │   └── invite/           # Invitation pages
│   ├── components/           # React components
│   │   └── ui/              # UI components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   ├── server/              # Server-side code
│   │   ├── api/            # tRPC API routes
│   │   └── auth.ts         # Authentication config
│   └── __tests__/          # Test files
├── public/                  # Static assets
├── .env.example            # Environment variables template
├── package.json            # Dependencies
└── README.md              # This file
```

## 🤝 Contributing

This is an assignment project, but suggestions are welcome!

## 📄 License

This project is created for educational/assignment purposes.

## 👨‍💻 Author

**[Your Name]**
- Email: [your.email@example.com]
- LinkedIn: [Your LinkedIn URL]
- Portfolio: [Your Portfolio URL]

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting platform
- Prisma for the excellent ORM
- tRPC for type-safe APIs

## 📞 Support

For questions or issues, please contact:
- Email: [your.email@example.com]
- GitHub Issues: [Repository Issues URL]

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies.**
