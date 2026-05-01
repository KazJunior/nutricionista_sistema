import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_API_KEY = Deno.env.get("GOOGLE_API_KEY");

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  try {
    const { patientData } = await req.json();
    
    if (!GEMINI_API_KEY) {
      throw new Error("GOOGLE_API_KEY não configurada.");
    }

    const prompt = `
      Você é um nutricionista experiente e atencioso. 
      Gere um plano alimentar semanal completo (7 dias, de Segunda a Domingo) para o seguinte paciente:
      
      Nome: ${patientData.nome}
      Objetivos: ${patientData.objetivos?.join(', ') || 'Não especificado'}
      Objetivo Adicional: ${patientData.objetivo_texto || 'Nenhum'}
      Restrições Alimentares: ${patientData.restricoes?.join(', ') || 'Nenhuma'}
      Alergias: ${patientData.alergias?.join(', ') || 'Nenhuma'}
      Patologias: ${patientData.patologias?.join(', ') || 'Nenhuma'}
      Hábitos: 
      - Refeições por dia: ${patientData.habitos?.refeicoes_por_dia || 5}
      - Ingestão de água: ${patientData.habitos?.agua || 2}L
      - Horário: Acorda às ${patientData.habitos?.acorda || '07:00'}, dorme às ${patientData.habitos?.dorme || '22:00'}
      - Atividade Física: ${patientData.habitos?.atividade || 'Não especificada'}

      REGRAS IMPORTANTES:
      1. O plano deve ser variado e equilibrado.
      2. Respeite RIGOROSAMENTE as alergias e restrições.
      3. Adapte as porções ao objetivo (ex: déficit calórico para emagrecer, superávit para ganhar massa).
      4. As refeições devem ser práticas e realistas.
      
      FORMATO DE RETORNO (JSON APENAS):
      Retorne um objeto JSON com a chave "plano_semanal" contendo um array de 7 objetos.
      Cada objeto deve ter:
      - "dia": Nome do dia (Ex: "Segunda")
      - "refeicoes": Um objeto com as chaves: cafe_da_manha, lanche_da_manha, almoco, lanche_da_tarde, jantar, ceia.
      Use apenas as chaves necessárias para atingir o número de refeições do paciente (${patientData.habitos?.refeicoes_por_dia || 5}).
      Cada refeição deve ser um ARRAY de strings (ex: ["2 fatias de pão integral", "1 ovo mexido"]).

      RETORNE APENAS O JSON, SEM TEXTO ADICIONAL OU FORMATAÇÃO MARKDOWN.
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: "application/json",
          },
        }),
      }
    );

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error.message);
    }

    const textResponse = result.candidates[0].content.parts[0].text;
    const planData = JSON.parse(textResponse);

    return new Response(JSON.stringify(planData), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      },
    });
  }
});
