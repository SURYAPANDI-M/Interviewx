# InterviewX live company research setup

The `research-company-interviews` Supabase Edge Function searches public web results and uses an LLM to structure evidence for any company, role, seniority and location. It requires provider credentials configured as server-side Supabase Edge Function secrets.

## Required secrets

In Supabase Dashboard → Edge Functions → Secrets for the InterviewX project, add:

- `TAVILY_API_KEY` — public web search API key.
- `OPENAI_API_KEY` — model API key used to classify evidence and generate the research response.
- `OPENAI_MODEL` (optional) — model name; defaults to `gpt-4.1-mini`.

Never place provider keys in `public/config.js` or browser code. The function requires a signed-in Supabase user JWT and validates the session before searching. It returns a clear `PROVIDER_KEYS_MISSING` response if either required key is absent.

## Output and evidence rules

- Official employer information, first-person candidate reports and general role-based inference are separate.
- Each specific claim must refer to source IDs and source URLs returned from public search.
- Sparse or contradictory evidence must be disclosed.
- Sample questions are practice prompts, not guaranteed or leaked interview questions.
- Research is point-in-time and is not exhaustive; candidates should verify current steps with the recruiter.

## Test checklist

1. Configure both required secrets in Supabase.
2. Sign in to InterviewX and enter an arbitrary company, role/job description, seniority and location.
3. Click **Research this company**.
4. Verify source links, sparse evidence labels, and unknown-company research.
5. Test missing keys, no search results, expired session, mobile layout and reduced-motion mode.

## API

`POST /functions/v1/research-company-interviews`

Body: `{ "company": "Example Co", "role": "Software Engineer", "seniority": "Mid level (3–5 years)", "location": "India", "jobDescription": "...", "resumeSummary": "..." }`
