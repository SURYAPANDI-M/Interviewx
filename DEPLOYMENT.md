# InterviewX deployment guide

This package turns the uploaded single-file prototype into a deployable static web app with Supabase authentication, private resume storage, profile persistence, and saved interview records. AI evaluation is provided as a server-side Supabase Edge Function template. A public URL cannot be created from this folder alone; it must be published through a hosting account and connected backend.

## 1. Create the backend
1. Create a Supabase project at https://supabase.com/.
2. In **SQL Editor**, run `supabase/schema.sql`.
3. In **Project Settings → API**, copy the Project URL and the **publishable/anon public key**. Do not use the `service_role` key in the browser.
4. Edit `public/config.js` and replace both placeholders. These values are public client configuration; never put an OpenAI key or service-role key in this file.
5. In **Authentication → URL Configuration**, add the final deployment URL to Site URL and Redirect URLs. Enable email confirmation for production.
6. Configure Google/Apple OAuth only if you want those buttons active. Add the provider credentials in Supabase and set the exact authorized redirect URLs.

## 2. Deploy the website
Recommended simple static hosting: Netlify, Vercel, or Cloudflare Pages.
- Publish the `public/` directory as the site root.
- The entry file is `public/index.html` and `public/config.js` must be included.
- For Vercel, a minimal `vercel.json` is included. For Netlify, `netlify.toml` is included.
- After deployment, update the Supabase Site URL and Redirect URLs to the real HTTPS domain, then test signup, confirmation, login, reset password, logout, profile save, resume upload, and interview history.

## 3. Enable AI evaluation
1. Install the Supabase CLI and log in from your development machine.
2. Link the local project: `supabase link --project-ref YOUR_PROJECT_REF`.
3. Set secrets: `supabase secrets set OPENAI_API_KEY=YOUR_KEY OPENAI_MODEL=gpt-4.1-mini`.
4. Deploy: `supabase functions deploy evaluate-answer`.
5. Before exposing the feature in the UI, call this function with the user's access token, display its evaluation as coaching rather than a hiring prediction, and save feedback only to the authenticated user's interview row. The page calls this function after each saved answer and displays the available coaching feedback. If the function is missing or the provider key is unset, answers are still saved and the results screen clearly reports that AI evaluation is unavailable.

## 4. Pre-launch checklist
- [ ] Replace Supabase placeholders in `public/config.js`.
- [ ] Run `supabase/schema.sql` successfully.
- [ ] Confirm RLS policies work with two separate test users (neither user can read the other's profile, interviews, or resumes).
- [ ] Configure email sender / confirmation and password reset URLs.
- [ ] Configure OAuth providers or hide those buttons until configured.
- [ ] Deploy the Edge Function and set provider secrets only in Supabase.
- [ ] Wire AI evaluation results into the results screen before advertising AI scoring as available.
- [ ] Add privacy policy, terms, retention/deletion workflow, and consent notices before storing sensitive resume or interview data from real users.
- [ ] Test at mobile widths, keyboard-only navigation, and a screen reader; run Lighthouse/accessibility checks.
- [ ] Add rate limits, abuse protection, monitoring, backups, and cost alerts.

## Current implementation boundary
Authentication, profile persistence, private resume upload, and interview session/answer persistence require the Supabase project configuration above. The AI function is supplied but must be deployed and wired to the UI. Company pages currently link to official company sites; automated cited company research is not yet connected. Live audio/video recording and speech-to-text are also not implemented. Camera/microphone recording and speech-to-text are intentionally not represented as working features until a secure provider and explicit consent flow are integrated.


## Connected resources (2026-10-20)

- Supabase project: `interviewx` (Mumbai / `ap-south-1`)
- Supabase URL: `https://jwdibyqmtbldpumrkvmj.supabase.co`
- Database migration `interviewx_initial_schema` was applied and verified; `profiles` and `interviews` tables exist.
- Edge Function `evaluate-answer` is deployed with JWT verification enabled.
- The AI endpoint requires the `OPENAI_API_KEY` secret to be added in Supabase Dashboard → Edge Functions / Secrets (or Project Settings → Edge Functions → Secrets, depending on dashboard layout). Do not place the key in `public/config.js` or commit it to source control. Until configured, evaluation responds with `AI provider is not configured`.

## Current deployment status

A Vercel project named `interviewx` has been created, but the site source has not yet been deployed to a public production URL. Do not share a Vercel URL as live until a successful deployment is listed in Vercel. After deployment, verify auth, resume upload, saved sessions, and AI evaluation end-to-end.
