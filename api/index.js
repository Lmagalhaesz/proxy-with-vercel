export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // CORS preflight
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const webhookUrl = 'https://leofreesemagalhaes2006.app.n8n.cloud/webhook-test/importacao-clientes'; // coloque o seu

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: req.headers,
      body: req,
    });

    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    res.setHeader('Content-Disposition', 'attachment; filename="importacao_clientes.csv"');
    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(buffer);
  } catch (error) {
    console.error('Erro ao enviar para o N8N:', error);
    res.status(500).json({ error: 'Erro no proxy' });
  }
}
