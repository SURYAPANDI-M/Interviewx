import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };

type SearchResult = { title?: string; url?: string; content?: string; score?: number; published_date?: string };
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Please sign in to research a company." }, 401);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Your session is invalid. Please sign in again." }, 401);

    const body = await req.json();
    const company = String(body.company || "").trim().slice(0, 160);
    const role = String(body.role || "").trim().slice(0, 160);
    const seniority = String(body.seniority || "Not specified").trim().slice(0, 80);
    const location = String(body.location || "Not specified").trim().slice(0, 100);
    const jobDescription = String(body.jobDescription || "").trim().slice(0, 8000);
    const resumeSummary = String(body.resumeSummary || "").trim().slice(0, 2500);
    if (!company || !role) return json({ error: "Company and role are required." }, 400);

    const tavilyKey = Deno.env.get("TAVILY_API_KEY");
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    if (!tavilyKey || !openAiKey) {
      const missing = [!tavilyKey ? "TAVILY_API_KEY" : "", !openAiKey ? "OPENAI_API_KEY" : ""].filter(Boolean);
      return json({
        error: "Company research is deployed, but its search/AI provider keys still need to be configured.",
        code: "PROVIDER_KEYS_MISSING",
        missing,
        setup: "Add these secrets in Supabase Dashboard → Edge Functions → Secrets, then retry. Never put provider keys in public/config.js."
      }, 503);
    }

    const queries = [
      `site:${company.replace(/[^a-zA-Z0-9 .&'-]/g, " ")} official careers interview process ${role}`,
      `${company} ${role} ${seniority} interview experience candidate report ${location}`,
      `${company} ${role} interview questions candidate experience ${seniority}`,
      `${company} ${role} job description skills technical assessment interview`
    ];
    const allResults: SearchResult[] = [];
    const queryErrors: string[] = [];
    for (const query of queries) {
      try {
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tavilyKey}` },
          body: JSON.stringify({ query, search_depth: "advanced", topic: "general", max_results: 5, include_answer: false, include_raw_content: false })
        });
        if (!response.ok) { queryErrors.push(`Search provider returned ${response.status}`); continue; }
        const data = await response.json();
        for (const result of (data.results || []) as SearchResult[]) {
          if (result.url && !allResults.some(x => x.url === result.url)) allResults.push(result);
        }
      } catch { queryErrors.push("A public search request failed."); }
    }

    const sources = allResults.slice(0, 16).map((r, i) => ({
      id: `S${i + 1}`, title: String(r.title || "Untitled source").slice(0, 240),
      url: r.url, snippet: String(r.content || "").slice(0, 1600),
      publishedDate: r.published_date || null
    }));
    if (!sources.length) return json({ error: "The public search returned no usable sources. Try again or check the search provider configuration.", code: "NO_SOURCES" }, 502);

    const prompt = {
      company, role, seniority, location, jobDescription, resumeSummary,
      sources,
      outputRules: [
        "Only describe company-specific interview practices when supported by the supplied sources.",
        "Separate official employer information from first-person candidate reports and from general role-based preparation.",
        "Every source-specific claim must include one or more sourceIds matching the supplied source IDs.",
        "Never invent source URLs, dates, number of candidate reports, exact round counts, or guaranteed questions.",
        "When evidence is sparse or contradictory, say so plainly and lower confidence.",
        "Use the job description and resume summary to tailor preparation, but do not repeat private personal details unnecessarily.",
        "Return a valid JSON object with: summary (string), evidenceStatus ('strong'|'moderate'|'limited'), confidenceNote (string), officialProcess (array of {claim, sourceIds}), reportedRounds (array of {name, whatToExpect, sourceIds, evidenceType:'candidate-report'|'official'|'inference'}), questionThemes (array of {theme, whyRelevant, sampleQuestions: string[], sourceIds, evidenceType}), preparationPlan (array of {period, tasks: string[]}), gapsAndContradictions (string[]), sources (array of {id,title,url,publishedDate,sourceType:'official'|'candidate-report'|'other'}), caveats (string[]).",
        "If there are no credible first-person candidate reports, reportedRounds must not pretend to be observed company rounds; label general role guidance as inference.",
        "Sample questions must be labelled practice prompts, not leaked or guaranteed real interview questions."
      ]
    };

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openAiKey}` },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are InterviewX's evidence-led company interview research analyst. Work only from provided public search results and user-provided role details. Be transparent, careful, and source-grounded. Do not imply exhaustive web coverage." },
          { role: "user", content: JSON.stringify(prompt) }
        ]
      })
    });
    if (!aiResponse.ok) {
      console.error("AI provider error status", aiResponse.status);
      return json({ error: "The research analysis service failed. Please retry shortly.", code: "AI_PROVIDER_ERROR" }, 502);
    }
    const aiData = await aiResponse.json();
    let research;
    try { research = JSON.parse(aiData.choices?.[0]?.message?.content || "{}"); }
    catch { return json({ error: "The research service returned an unreadable result. Please retry.", code: "INVALID_AI_RESPONSE" }, 502); }

    research.sources = Array.isArray(research.sources) ? research.sources : sources.map(s => ({ ...s, sourceType: "other" }));
    return json({
      research,
      meta: { company, role, seniority, location, searchedAt: new Date().toISOString(), sourceCount: sources.length, searchQueries: queries.length, partialSearchErrors: queryErrors.length > 0, sourceEvidence: sources }
    });
  } catch (error) {
    console.error("research-company-interviews failed", error);
    return json({ error: "Company research failed unexpectedly. Please retry." }, 500);
  }
});
