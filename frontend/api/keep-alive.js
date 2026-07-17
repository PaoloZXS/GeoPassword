// Endpoint keep-alive per evitare la sospensione del progetto Supabase free tier
// Chiamato periodicamente da un cron job esterno (es. cron-job.org) ogni ~5 giorni
// Esegue una query leggera per mantenere attivo il database
// URL: https://geopassword.vercel.app/api/keep-alive

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // Imposta CORS per richieste semplici
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Solo metodo GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      error: "Supabase credentials not configured",
      hint: "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel environment variables"
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query leggera: conta gli utenti (operazione minimale)
    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (error) throw error;

    console.log(`[keep-alive] OK - users count: ${count}`);

    return res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      usersCount: count,
      message: "Database mantenuto attivo con successo"
    });
  } catch (err) {
    console.error("[keep-alive] ERROR:", err.message);

    return res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
}
