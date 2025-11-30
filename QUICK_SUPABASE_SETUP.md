# Quick Supabase Setup - 5 Minutes

## Step 1: Create Supabase Project

1. Go to https://supabase.com/
2. Click **"Start your project"** or **"Sign in"**
3. Click **"New Project"**
4. Fill in:
   - **Name**: `HyperFit` (or any name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
5. Click **"Create new project"**
6. Wait 2-3 minutes for setup

## Step 2: Get Your Credentials

1. In your Supabase dashboard, click **Settings** (gear icon) in the left sidebar
2. Click **API** under Project Settings
3. You'll see two important values:

   **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - Copy this entire URL

   **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - Click the eye icon to reveal it
   - Copy the entire key

## Step 3: Update Your Config File

1. Open `supabase.config.ts` in your project
2. Replace the placeholder values:

```typescript
export const supabaseConfig = {
  supabaseUrl: "https://xxxxxxxxxxxxx.supabase.co",  // Paste your Project URL here
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // Paste your anon key here
};
```

3. Save the file

## Step 4: Set Up Database (Required)

1. In Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **"New query"**
3. Open `supabase-migration.sql` from your project
4. Copy ALL the SQL code from that file
5. Paste it into the SQL Editor
6. Click **"Run"** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

## Step 5: Verify Setup

1. In Supabase dashboard, click **Table Editor** in the left sidebar
2. You should see a table called **`user_data`**
3. If you see it, you're all set! ✅

## Step 6: Test the App

Run your app:
```bash
npm start
```

The app should now work! You can:
- Sign up with email/password
- Sign in with email/password

## Optional: Enable Google OAuth (Later)

Google OAuth setup is more complex. You can skip this for now and add it later. See `SUPABASE_SETUP.md` for detailed Google OAuth instructions.

---

## Troubleshooting

**Error: "Invalid supabaseUrl"**
- Make sure you copied the ENTIRE URL including `https://`
- No trailing slashes
- Should look like: `https://xxxxxxxxxxxxx.supabase.co`

**Error: "relation user_data does not exist"**
- You need to run the SQL migration (Step 4)
- Go to SQL Editor and run `supabase-migration.sql`

**Error: "permission denied"**
- The SQL migration should have set up permissions automatically
- If not, check that you ran the complete migration file

## Need Help?

- Full setup guide: See `SUPABASE_SETUP.md`
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com/


