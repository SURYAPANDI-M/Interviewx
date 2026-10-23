# InterviewX Company Interview Research System

## Product requirement

Support any employer, country, role family, job title, seniority, and hiring track. Do not present a fixed round sequence as universal. The interview plan must be generated for the selected company + role + level + location + job description, from current public evidence.

## Candidate coverage

Normalize experience into these dimensions:

- Career stage: internship, graduate/new grad, entry-level, early career, mid-level, senior, staff/principal, manager, director/executive, career switcher.
- Experience: exact user-provided years (YOE), never infer a level from YOE alone.
- Role family: software engineering, frontend, backend, mobile, data engineering, data science, ML/AI, SRE/platform/DevOps/cloud, security, QA/SDET, product management, design/UX, analytics, IT/support, sales, customer success, finance, operations, HR/recruiting, marketing, hardware/chip, research, and other/custom.
- Role specialization and stack from the job description.
- Location/country, hiring track, and report date.

## Evidence hierarchy

1. Official employer careers/interview guidance: authoritative for the employer's stated process, but often not detailed enough to predict every round.
2. Public first-person candidate reports with role, level, location, date, rounds, and outcome.
3. Multiple independent candidate reports that converge on the same pattern.
4. Reputable interview-preparation guides, clearly marked as secondary.
5. Generic role-based preparation only when company-specific evidence is absent.

Initial public research starting points (not exhaustive):

- Candidate reports: https://interviewexperiences.in/experiences
- LeetCode Discuss: https://leetcode.com/discuss/
- Chill Interview: https://www.chillinterview.com/
- AskedBefore employer pages: https://askedbefore.io/
- Official Amazon SDE-II guidance: https://www.amazon.jobs/content/en/how-we-hire/sde-ii-interview-prep
- Official Amazon SDE-III guidance: https://amazon.jobs/content/en/how-we-hire/sde-iii-interview-prep
- Official Microsoft technical-interview guidance: https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing.html

Examples from initial research (all are reports, not guaranteed interview scripts):
- Amazon SDE-2, 3–4 YOE, Bengaluru, reported April 2026: https://leetcode.com/discuss/post/8420230/amazon-sde-2-interview-experience-2026-e-t1g8/
- Google candidate experiences and level-specific reports: https://leetcode.com/discuss/
- Microsoft candidate experiences: https://leetcode.com/discuss/
- Flipkart candidate experiences: https://leetcode.com/discuss/

## Required research record

Every extracted claim should be stored with:
- employer name and aliases;
- role family, exact role, seniority/level, YOE band if reported, location;
- source URL, source type, source publication/interview date, access date;
- report count supporting the pattern;
- round/stage, topic, example question or task when publicly reported;
- observed frequency = reports mentioning a pattern / eligible reports reviewed (not a probability of being asked);
- confidence label: High (multiple recent independent reports), Medium (some corroboration), Low (single/old/ambiguous report);
- freshness status and next review date;
- contradictions and sample limitations;
- explicit distinction between reported experience, official process, and generic inference.

Never claim a reported question is guaranteed to recur. Do not copy proprietary/leaked question banks, bypass access controls, or collect personal identifying details. Respect source terms and robots/access policies; store concise derived summaries and link to original sources rather than republishing full reports.

## Research workflow for every interview request

1. Parse employer, role, level, YOE, location, JD, and interview date if known.
2. Search official employer guidance and recent public candidate reports.
3. Prefer reports from the last 12–24 months; retain older reports only as historical context.
4. Deduplicate reposts and group reports by role/level/location.
5. Extract stages, topic tags, question/task summaries, evaluation signals, and outcomes.
6. Compare patterns across sources; show counts, source dates, links, and confidence.
7. If evidence is sparse, state that plainly and show a role-based fallback in a separate section.
8. Generate a level-appropriate preparation plan and mock interview, then refresh the evidence when the user starts a new session.

## UI requirements

- Search any company, not just a preset list.
- Ask for role, level/YOE, location, and optional job description.
- Display “Official guidance”, “Candidate-reported patterns”, and “General role preparation” separately.
- Show source links and dates next to each claim.
- Show report counts and confidence; never turn report frequency into certainty.
- Offer filters for recency, location, level, role, and round.
- Include a “not enough evidence” state rather than inventing company-specific rounds.
- Let users flag outdated or incorrect information.
- Preserve the existing dark navy/blue/violet InterviewX theme.

## Technical implementation needed

The current static single-page app and hard-coded examples cannot independently research every employer. A production-grade version needs a server-side research service with a configurable search provider, rate limits, source allowlists/quality checks, caching, deduplication, provenance records, and scheduled refreshes. API keys must stay server-side (e.g. Supabase Edge Function secrets), never in browser JavaScript. The service should return normalized evidence records, not an unsourced generated answer.

Suggested API contract:
- Request: employer, role, seniority, YOE, location, jobDescription, maxAgeDays.
- Response: evidence summary, stage patterns, topic patterns, source records, confidence, coverage gaps, generated preparation plan.
- If search is unavailable or sources are sparse, return a clear degraded/evidence-limited status and do not fabricate results.

## Acceptance criteria

- Works for arbitrary company names and role families.
- Separates official facts from candidate anecdotes and generic guidance.
- Shows citations for every company-specific claim.
- Supports internship through executive levels, with role-specific evaluation criteria.
- Gives a clear low-evidence fallback for obscure companies or niche roles.
- Has automated tests for source attribution, freshness, deduplication, uncertainty labels, and prompt-injection resistance in retrieved pages.
- No deployment to production until preview and API integration are tested.
