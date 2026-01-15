# Staff Management & Payroll Application

A modern, cross-platform staff management and payroll web application built for restaurants and bars.

## Features

- ✅ Google OAuth Authentication
- ✅ Role-based Access Control (Staff, Manager, Admin)
- ✅ Clock In/Out System with Area Selection
- ✅ Automatic Shift Locking & Manager Approval
- ✅ Payroll Calculation with Overtime
- ✅ Google Sheets Integration
- ✅ Comprehensive Audit Logging
- ✅ Mobile-First Responsive Design

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS v4
- **APIs**: Google OAuth & Sheets API

## Prerequisites

- Node.js 20+ installed
- Google Cloud Project with OAuth 2.0 credentials
- Google Sheets API enabled

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your credentials:

#### Generate NextAuth Secret

```bash
openssl rand -base64 32
```

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Authorized JavaScript origins: `http://localhost:3000`
7. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
8. Copy the Client ID and Client Secret to `.env.local`

#### Google Sheets API Setup

1. In the same Google Cloud project, enable "Google Sheets API"
2. Create a Service Account:
   - Go to "Credentials" → "Create Credentials" → "Service Account"
   - Download the JSON key file
3. Create a new Google Sheet for the application
4. Share the sheet with the service account email (from the JSON file)
5. Copy the Sheet ID from the URL (between `/d/` and `/edit`)
6. Paste the entire JSON content (as a single line) into `GOOGLE_SHEETS_CREDENTIALS` in `.env.local`

### 3. Initialize Database

The database is already initialized with migrations and seed data. If you need to reset:

```bash
# Reset database
rm prisma/dev.db

# Run migrations
npx prisma migrate dev

# Seed initial staff
npx prisma db seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Initial Staff Members

The database is seeded with these staff members (use their emails to sign in with Google):

- **Lisa** - ADMIN - £12.50/hr (OT: £18.75/hr after 40hrs)
- **Clare H** - STAFF - £11.00/hr (OT: £16.50/hr after 40hrs)
- **Connor** - STAFF - £11.00/hr (OT: £16.50/hr after 40hrs)
- **Shaz** - MANAGER - £13.00/hr (OT: £19.50/hr after 40hrs)
- **Clare** - STAFF - £11.00/hr (OT: £16.50/hr after 40hrs)

**Note**: For development, you'll need to sign in with Google accounts that match these emails, OR you can add your own Google email to the database as an ADMIN user.

## Project Structure

```
staff-management-app/
├── prisma/
│   ├── migrations/       # Database migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts          # Seed data
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── api/        # API routes
│   │   ├── staff/      # Staff dashboard
│   │   ├── manager/    # Manager dashboard
│   │   └── admin/      # Admin dashboard
│   ├── components/      # React components
│   ├── lib/            # Utilities
│   │   ├── db.ts       # Prisma client
│   │   ├── auth.ts     # NextAuth config
│   │   ├── sheets.ts   # Google Sheets integration
│   │   └── payroll.ts  # Payroll calculations
│   └── styles/         # CSS files
└── package.json
```

## Development Workflow

1. **Staff Members** can:
   - Clock in/out
   - Select work area (Bar/Floor/Kitchen)
   - View their shift history

2. **Managers** can:
   - View all shifts
   - Approve/adjust locked shifts
   - View payroll summaries
   - Export payroll data

3. **Admins** can:
   - All manager permissions
   - Manage staff (add/edit/deactivate)
   - Configure system settings
   - Manual Google Sheets sync
   - View audit logs

## Cross-Platform Support

The application is fully responsive and works on:
- ✅ macOS (Safari, Chrome, Firefox)
- ✅ Windows (Edge, Chrome, Firefox)
- ✅ iOS (Safari, Chrome)
- ✅ Android (Chrome, Firefox)
- ✅ Tablets (iPad, Android tablets)

## Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Important**: Add all environment variables from `.env.local` to your Vercel project settings.

### Option 2: Self-Hosted

1. Build the production bundle:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

3. Make the server accessible on your network or deploy to a VPS.

## Troubleshooting

### "PrismaClient is unable to be run in the browser"

This error occurs if you try to import Prisma in client components. Make sure all database operations are in:
- API routes (`src/app/api/**/*.ts`)
- Server components
- Server actions

### Google OAuth not working

1. Check that your redirect URI is exactly: `http://localhost:3000/api/auth/callback/google`
2. Make sure the Google+ API is enabled
3. Verify your credentials in `.env.local`

### Google Sheets sync failing

1. Verify the service account has "Editor" access to the sheet
2. Check that the Sheet ID is correct
3. Ensure the JSON credentials are properly formatted (single line, no line breaks)

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
