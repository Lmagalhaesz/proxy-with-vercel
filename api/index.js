import Busboy from 'busboy';
import FormData from 'form-data';
import fetch from 'node-fetch';


export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  try {
    const { buffer, type, filename } = await parseFormData(req);

    let webhookUrl = '';
    let downloadFileName = '';

    if (type === 'Clientes') {
      webhookUrl = 'https://leofreesemagalhaes2006.app.n8n.cloud/webhook-test/importacao-clientes';
      downloadFileName = 'importacao_clientes_f.csv';
    } else if (type === 'Servicos') {
      webhookUrl = 'https://leofreesemagalhaes2006.app.n8n.cloud/webhook-test/importacao-servicos';
      downloadFileName = 'importacao_servicos_f.csv';
    } else if (type === 'Produtos') {
      webhookUrl = 'https://leofreesemagalhaes2006.app.n8n.cloud/webhook-test/importacao-produtos';
      downloadFileName = 'importacao_produtos_f.csv';
    } else {
      return res.status(400).json({ error: "Tipo inválido. Use 'Clientes' ou 'Servicos'" });
    }

    const form = new FormData();
    form.append('file', buffer, { filename });

    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: form.getHeaders(),
      body: form
    });

    if (!n8nResponse.ok) {
      const msg = await n8nResponse.text();
      return res.status(500).json({ error: "Erro do N8N", detail: msg });
    }

    const arrayBuffer = await n8nResponse.arrayBuffer();
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
    let filename = 'arquivo.csv';

    busboy.on('file', (_, file, info) => {
      filename = info.filename || filename;
      file.on('data', chunk => chunks.push(chunk));
    });

    busboy.on('field', (name, val) => {
      if (name === 'type') type = val;
    });

    busboy.on('finish', () => resolve({ buffer: Buffer.concat(chunks), type, filename }));
    busboy.on('error', reject);
    req.pipe(busboy);
  });
}
