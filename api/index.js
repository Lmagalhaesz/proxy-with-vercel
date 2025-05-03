import Busboy from 'busboy';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  try {
    const { buffer, type } = await parseFormData(req);

    let webhookUrl;
    let downloadFileName;

    if (type === 'Clientes') {
      webhookUrl = 'https://leofreesemagalhaes2006.app.n8n.cloud/webhook-test/importacao-clientes';
      downloadFileName = 'importacao_clientes_f.xlsx';
    } else if (type === 'Servicos') {
      webhookUrl = 'https://leofreesemagalhaes2006.app.n8n.cloud/webhook-test/importacao-servicos';
      downloadFileName = 'importacao_servicos_f.xlsx';
    } else {
      return res.status(400).json({ error: "Tipo inválido. Use 'Clientes' ou 'Servicos'" });
    }

    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: buffer,
    });

    if (!n8nResponse.ok) {
      const text = await n8nResponse.text(); // consumir uma única vez
      console.error('Erro N8N:', text);
      return res.status(500).json({ error: "Erro ao repassar para o N8N", detail: text });
    }

    const blob = await n8nResponse.blob();
    const arrayBuffer = await blob.arrayBuffer(); // 👈 só consome uma vez
    const finalBuffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.status(200).send(finalBuffer);

  } catch (err) {
    console.error("Erro no Proxy:", err);
    res.status(500).json({ error: "Erro no Proxy", detail: err.message });
  }
}

function parseFormData(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const chunks = [];
    let type = 'Clientes';

    busboy.on('file', (_, file) => {
      file.on('data', (data) => chunks.push(data));
    });

    busboy.on('field', (fieldname, val) => {
      if (fieldname === 'type') type = val;
    });

    busboy.on('finish', () => resolve({ buffer: Buffer.concat(chunks), type }));
    busboy.on('error', reject);
    req.pipe(busboy);
  });
}
