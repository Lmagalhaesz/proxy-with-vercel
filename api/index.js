export const config = {
  api: {
    bodyParser: false, // importante para aceitar FormData
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const webhookUrl = 'https://leofreesemagalhaes2006.app.n8n.cloud/webhook-test/importacao-clientes'; // seu webhook real

    const forwardRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers['content-type'],
      },
      body: req,
    });

    if (!forwardRes.ok) {
      const msg = await forwardRes.text();
      throw new Error(msg);
    }

    const blob = await forwardRes.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    res.setHeader('Content-Disposition', 'attachment; filename="importacao_clientes.csv"');
    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(buffer);
  } catch (error) {
    console.error('Erro no proxy:', error);
    res.status(500).json({ error: 'Erro ao processar o arquivo.' });
  }
}
