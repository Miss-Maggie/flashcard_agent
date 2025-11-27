# Database Migration Scripts

## Step 1: Export Data from Lovable Cloud

```bash
npx tsx scripts/export-data.ts
```

This will create a `data-export.json` file with all your data.

## Step 2: Set Up Local Supabase

```bash
# Initialize Supabase (if not already done)
supabase init

# Start local Supabase
supabase start

# Get your local credentials
supabase status
```

## Step 3: Update Import Script

Open `scripts/import-data.ts` and replace `YOUR_LOCAL_ANON_KEY` with the `anon key` from `supabase status`.

## Step 4: Run Migrations

```bash
# Apply all migrations to local database
supabase db reset
```

## Step 5: Import Data

```bash
npx tsx scripts/import-data.ts
```

## Notes

- The export script uses your Lovable Cloud credentials
- The import script connects to your local Supabase (http://127.0.0.1:54321)
- Make sure to run migrations before importing data
- Data is imported with upsert, so you can run the import multiple times safely
