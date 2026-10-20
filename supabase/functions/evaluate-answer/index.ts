// Supabase Edge Function: server-side AI evaluation. Set OPENAI_API_KEY as a Supabase secret.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://deno.land/x/openai@v4.24.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const body = await req.json();
    const question = String(body.question || "").slice(0, 5000);
    const answer = String(body.answer || "").slice(0, 12000);
    const role = String(body.role || "").slice(0, 200);
    const company = String(body.company || "").slice(0, 200);
    if (!question.trim() || !answer.trim()) return new Response(JSON.stringify({ error: "Question and answer are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "AI provider is not configured" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const ai = new OpenAI({ apiKey });
    const completion = await ai.chat.completions.create({
      model: Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a fair interview coach. Evaluate only the supplied answer. Do not infer protected traits. Return JSON with score (0-100), strengths (array of strings), improvements (array of strings), structure (string), sample_improved_answer (string), and caveat (string). Be specific, constructive, and do not claim to predict hiring outcomes." },
        { role: "user", content: JSON.stringify({ company, role, question, answer }) }
      ]
    });
    const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
    return new Response(JSON.stringify({ evaluation: result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("evaluate-answer failed", error);
    return new Response(JSON.stringify({ error: "Evaluation failed. Please try again." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
