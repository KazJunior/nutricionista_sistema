import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const GEMINI_API_KEY = Deno.env.get("GOOGLE_API_KEY");

// --- SCHEMA DEFINITION ---
const MealSchema = z.array(z.string().min(1)).length(5);

const DaySchema = z.object({
  dia: z.string(),
  refeicoes: z.object({
    cafe_da_manha: MealSchema,
    lanche_manha: MealSchema,
    almoco: MealSchema,
    lanche_tarde: MealSchema,
    jantar: MealSchema,
  })
});

const PlanSchema = z.object({
  plano_semanal: z.array(DaySchema).length(7)
});

// --- HELPER FUNCTIONS ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { patientData } = await req.json();
    
    if (!GEMINI_API_KEY) {
      throw new Error("GOOGLE_API_KEY não configurada.");
    }

    const prompt = `
      Você é um nutricionista especialista em gerar planos alimentares estruturados.
      Gere um plano alimentar semanal (7 dias) para o paciente: ${patientData.nome}.
      Objetivos: ${(patientData.objetivos || []).join(", ")}.
      Restrições: ${(patientData.restricoes || []).join(", ")}.

      REGRAS ESTRUTURAIS OBRIGATÓRIAS (ZOD VALIDATION):
      1. Retorne um objeto JSON com a chave "plano_semanal".
      2. "plano_semanal" deve ser um array de EXATAMENTE 7 objetos (Segunda a Domingo).
      3. Cada dia deve ter as chaves: "dia" e "refeicoes".
      4. O objeto "refeicoes" deve conter EXATAMENTE estas 5 chaves: 
         "cafe_da_manha", "lanche_manha", "almoco", "lanche_tarde", "jantar".
      5. Cada refeição deve ser um array de EXATAMENTE 5 itens (strings curtas e descritivas).

      EXEMPLO DE ESTRUTURA:
      {
        "plano_semanal": [
          {
            "dia": "Segunda",
            "refeicoes": {
              "cafe_da_manha": ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"],
              "lanche_manha": ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"],
              "almoco": ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"],
              "lanche_tarde": ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"],
              "jantar": ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"]
            }
          },
          ... (repetir para os 7 dias)
        ]
      }

      RETORNE APENAS O JSON, SEM FORMATAÇÃO MARKDOWN OU TEXTO EXTRA.
    `;

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY;

    let attempts = 0;
    const maxAttempts = 3;
    let lastError = "";

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Tentativa ${attempts} de gerar plano...`);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" },
        }),
      });

      const result = await response.json();
      
      if (result.error) {
        lastError = result.error.message;
        console.error(`Erro na API Gemini (Tentativa ${attempts}):`, lastError);
        continue;
      }

      const textResponse = result.candidates[0].content.parts[0].text;
      let rawData;
      
      try {
        rawData = JSON.parse(textResponse);
      } catch (e) {
        lastError = "Falha ao parsear JSON da IA.";
        console.error(lastError);
        continue;
      }

      // --- ZOD VALIDATION ---
      const validation = PlanSchema.safeParse(rawData);

      if (validation.success) {
        console.log("Plano validado com sucesso pelo Zod!");
        return new Response(JSON.stringify(validation.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        lastError = "Estrutura do plano inválida: " + validation.error.message;
        console.warn(`Validação falhou (Tentativa ${attempts}):`, lastError);
      }
    }

    throw new Error("Não foi possível gerar um plano válido após " + maxAttempts + " tentativas. Último erro: " + lastError);

  } catch (error) {
    console.error("Erro final na função:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
