export const config = {
  api: {
    bodyParser: false, // importante para aceitar FormData
  },
};

export default async function handler(req, res) {
   // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const webhookUrl = 'https://leofreesemagalhaes2006.app.n8n.cloud/webhook-test/importacao-clientes'; // seu webhook real

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": req.headers["content-type"], // importante: só repassa o Content-Type
      },
      body: req, // repassa a stream bruta
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro do N8N:", errorText);
      return res.status(500).json({ error: "Erro vindo do N8N", detail: errorText });
    }

    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    res.setHeader("Content-Disposition", 'attachment; filename="importacao_clientes.csv"');
    res.setHeader("Content-Type", "text/csv");
    res.status(200).send(buffer);
  } catch (err) {
    console.error("Erro no proxy Vercel:", err);
    res.status(500).json({ error: "Erro no proxy", detail: err.message });
  }
}
