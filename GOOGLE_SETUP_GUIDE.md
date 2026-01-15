# Google OAuth Setup Guide

Follow these steps to configure Google OAuth for the Staff Management Application.

## Step 1: Sign In and Create/Select Project

1. **Sign in** to Google Cloud Console (currently open in your browser)
2. After signing in, you'll see the dashboard
3. Click the **project selector** at the top (next to "Google Cloud")
4. Either:
   - Select an existing project, OR
   - Click **"NEW PROJECT"**
   - Name it: "Staff Management App"
   - Click **"CREATE"**

## Step 2: Enable Required APIs

### Enable Google+ API (for OAuth)

1. In the left sidebar, go to **"APIs & Services"** → **"Library"**
2. Search for: **"Google+ API"**
3. Click on it
4. Click **"ENABLE"**
5. Wait for it to enable (takes a few seconds)

### Enable Google Sheets API

1. Still in the API Library
2. Search for: **"Google Sheets API"**
3. Click on it
4. Click **"ENABLE"**

## Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (unless you have a Google Workspace account)
3. Click **"CREATE"**

**App Information**:
- App name: `Staff Management System`
- User support email: (select your email)
- Developer contact email: (enter your email)

4. Click **"SAVE AND CONTINUE"**

**Scopes** (Step 2):
- Click **"ADD OR REMOVE SCOPES"**
- Select these scopes:
  - `userinfo.email`
  - `userinfo.profile`  
  - `openid`
- Click **"UPDATE"**
- Click **"SAVE AND CONTINUE"**

**Test Users** (Step 3):
- Click **"+ ADD USERS"**
- Add the email addresses of your initial staff:
  - `lisa@example.com` (or use your actual emails)
  - `clareh@example.com`
  - `connor@example.com`
  - `shaz@example.com`
  - `clare@example.com`
- Click **"ADD"**
- Click **"SAVE AND CONTINUE"**

5. Review and click **"BACK TO DASHBOARD"**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**

**Application type**: Web application

**Name**: `Staff Management Web Client`

**Authorized JavaScript origins**:
- Click **"+ ADD URI"**
- Enter: `http://localhost:3000`

**Authorized redirect URIs**:
- Click **"+ ADD URI"**
- Enter: `http://localhost:3000/api/auth/callback/google`

4. Click **"CREATE"**

## Step 5: Copy Your Credentials

A popup will appear with your credentials:

1. **Copy the Client ID** (looks like: `123456789-abc...xyz.apps.googleusercontent.com`)
2. **Copy the Client Secret** (looks like: `GOCSPX-...`)

**IMPORTANT**: Keep these safe! You'll add them to `.env.local` in the next step.

## Step 6: Create Service Account (for Google Sheets)

1. Still in **"Credentials"** page
2. Click **"+ CREATE CREDENTIALS"** → **"Service account"**

**Service account details**:
- Name: `staff-management-sheets`
- Service account ID: (auto-filled)
- Click **"CREATE AND CONTINUE"**

**Grant this service account access** (Step 2):
- Role: Select **"Editor"**
- Click **"CONTINUE"**

**Grant users access** (Step 3):
- Leave blank
- Click **"DONE"**

### Download Service Account Key

1. Click on the service account you just created
2. Go to the **"KEYS"** tab
3. Click **"ADD KEY"** → **"Create new key"**
4. Select **"JSON"**
5. Click **"CREATE"**
6. A JSON file will download - **keep this safe!**

## Step 7: Create Google Sheet and Share

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a **new blank spreadsheet**
3. Name it: `Staff Management - Payroll Data`
4. Copy the **Sheet ID** from the URL:
   - URL looks like: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
   - Copy the part between `/d/` and `/edit`

### Share with Service Account

1. Click **"Share"** button in the Sheet
2. Paste the service account email (from the JSON file you downloaded)
   - It looks like: `staff-management-sheets@[project-id].iam.gserviceaccountcom`
3. Set permission to **"Editor"**
4. Uncheck **"Notify people"**
5. Click **"Share"**

## Step 8: Update .env.local

Open `/Users/darrenporter/.gemini/antigravity/scratch/staff-management-app/.env.local` and update:

```bash
# Google OAuth (from Step 5)
GOOGLE_CLIENT_ID="paste-your-client-id-here"
GOOGLE_CLIENT_SECRET="paste-your-client-secret-here"

# Google Sheets (from Step 7)
GOOGLE_SHEET_ID="paste-your-sheet-id-here"

# Google Sheets Credentials (from downloaded JSON in Step 6)
# Copy the ENTIRE contents of the downloaded JSON file and paste as ONE LINE
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account","project_id":"...PASTE ENTIRE JSON HERE..."}'

# Generate a secret for NextAuth
# Run: openssl rand -base64 32
NEXTAUTH_SECRET="paste-generated-secret-here"
```

## Step 9: Generate NextAuth Secret

In your terminal, run:

```bash
openssl rand -base64 32
```

Copy the output and paste it as `NEXTAUTH_SECRET` in `.env.local`

---

## ✅ Checklist

Before continuing, make sure you have:

- [ ] Created/selected Google Cloud project
- [ ] Enabled Google+ API
- [ ] Enabled Google Sheets API
- [ ] Configured OAuth consent screen
- [ ] Created OAuth 2.0 credentials
- [ ] Copied Client ID and Client Secret
- [ ] Created Service Account
- [ ] Downloaded Service Account JSON key
- [ ] Created Google Sheet
- [ ] Shared Sheet with service account email
- [ ] Copied Sheet ID
- [ ] Updated all values in `.env.local`
- [ ] Generated NextAuth secret

---

## Troubleshooting

**Can't find "Google+ API"?**
- It might be deprecated - instead enable "Google Identity API" or use the People API

**OAuth consent screen stuck in "Testing" mode?**
- That's fine for internal use! You just need to add your staff emails as "Test Users"

**Service account email not accepting the share?**
- Make sure you copied the email exactly from the downloaded JSON file
- The email must end with `.iam.gserviceaccount.com`

---

Once you've completed all these steps, let me know and I'll continue building the application!
