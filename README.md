# Auto Hunt POS

Real, deployable version of the Auto Hunt point-of-sale system: 4 divisions (Auto Body, Towing,
Mechanic, Auto Hub — Parts & Car Sale), cash in/out + debit sale ledgers per division, AI photo
estimates, reward points, and daily reports.

Data is stored in Supabase (a hosted Postgres database), so it persists for real and everyone on
your team sees the same records.

---

## 1. Set up Supabase (~5 minutes)

1. Go to **supabase.com** → sign up (free) → **New Project**.
2. Give it a name (e.g. `auto-hunt-pos`) and a database password — save that password somewhere safe.
3. Wait ~2 minutes for the project to finish setting up.
4. In the left sidebar, click **SQL Editor** → **New query**.
5. Open the file `supabase/schema.sql` from this project, copy all of it, paste it into the SQL editor, and click **Run**. This creates the `transactions` table.
6. In the left sidebar, click **Project Settings → API**.
7. Copy the **Project URL** and the **anon public** key — you'll need both in step 3 below.

## 2. Get an Anthropic API key (for the AI photo estimate feature)

1. Go to **console.anthropic.com** → sign in → **API Keys** → **Create Key**.
2. Copy the key (starts with `sk-ant-...`).

## 3. Configure the project

1. In this project folder, copy `.env.local.example` to a new file named `.env.local`.
2. Fill in the three values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<your Supabase Project URL>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your Supabase anon public key>
   ANTHROPIC_API_KEY=<your Anthropic API key>
   ```

## 4. Run it locally

```bash
npm install
npm run dev
```

Open **http://localhost:3000** — you should see the app loading real (empty) data from Supabase.

## 5. Deploy it live (Vercel)

1. Push this project to a GitHub repository (create one on github.com, then `git init`, `git add .`, `git commit -m "init"`, `git remote add origin <your repo url>`, `git push`).
2. Go to **vercel.com** → sign up with GitHub → **Add New Project** → select your repo.
3. Before deploying, click **Environment Variables** and add the same three values from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
4. Click **Deploy**. In about a minute you'll get a live URL like `auto-hunt-pos.vercel.app` — that's your real, working app.

---

## Notes for going further

- **Security**: the database currently allows anyone with the app URL to read/write records (see the RLS policies in `supabase/schema.sql`). That's fine for testing, but before sharing the URL widely, add authentication (Supabase Auth is a natural fit) and lock the policies down to logged-in staff only.
- **Reward points**: awarded automatically — 5 points per $100 — on any Cash In or Debit Sale record of $500 or more that has a customer name attached.
- **AI photo estimate**: uploads go straight from the browser to your own `/api/estimate` route, which calls Claude server-side — your Anthropic key never reaches the browser.
- **Editing branding/colors**: see `lib/types.ts` (division colors) and `tailwind.config.ts`.
