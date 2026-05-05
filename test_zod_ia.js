import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bblpcubhnztvhyxksnyl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_A-FQKldZ7BFuRltgiTSItQ_SUyjhaAz";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testGeneration() {
  console.log("Testando geração com Zod...");
  
  const patientData = {
    nome: "Teste Zod",
    objetivos: ["Emagrecimento"],
    restricoes: ["Sem glúten"],
    habitos: {}
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/gerar-plano-final`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ patientData })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erro desconhecido");
    }

    console.log("Plano gerado com sucesso! Estrutura Zod validada.");
    console.log(JSON.stringify(data.plano_semanal[0], null, 2));
  } catch (err) {
    console.error("Erro exato:", err.message);
  }
}

testGeneration();
