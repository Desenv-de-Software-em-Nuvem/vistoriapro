const DEFAULT_GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

function getProviderConfig() {
  const provider = (process.env.AI_PROVIDER || 'groq').toLowerCase();
  const apiKey = process.env.AI_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || (
    provider === 'openai'
      ? 'https://api.openai.com/v1'
      : 'https://api.groq.com/openai/v1'
  );
  const model = process.env.AI_MODEL || (
    provider === 'openai' ? DEFAULT_OPENAI_MODEL : DEFAULT_GROQ_MODEL
  );

  return { provider, apiKey, baseUrl, model };
}

function assertImageDataUrl(imageDataUrl) {
  if (!imageDataUrl || typeof imageDataUrl !== 'string') {
    throw Object.assign(new Error('Imagem é obrigatória.'), { statusCode: 400 });
  }

  if (!/^data:image\/(png|jpe?g|webp);base64,/i.test(imageDataUrl)) {
    throw Object.assign(new Error('Envie a imagem como data URL base64.'), { statusCode: 400 });
  }
}

async function descreverFoto({ imageDataUrl, comodoNome }) {
  if (process.env.AI_ENABLED === 'false') {
    throw Object.assign(new Error('IA desativada neste ambiente.'), { statusCode: 503 });
  }

  assertImageDataUrl(imageDataUrl);

  const { provider, apiKey, baseUrl, model } = getProviderConfig();
  if (!apiKey) {
    throw Object.assign(new Error('Chave da API de IA não configurada.'), { statusCode: 503 });
  }

  const prompt = [
    'Você é um vistoriador imobiliário profissional elaborando texto para laudo de vistoria de entrada.',
    `Analise a foto do cômodo "${comodoNome || 'não informado'}" e descreva tecnicamente apenas o que estiver visível.`,
    'Use o padrão de laudo: item, material/acabamento, cor quando visível e estado de conservação.',
    'Quando aplicável, cite portas, maçanetas, fechaduras, piso, paredes, teto, luminárias, tomadas, interruptores, janelas, louças/metais, bancadas, armários e equipamentos aparentes.',
    'Omita completamente qualquer item que não esteja visível na foto.',
    'Classifique a conservação com termos como "em bom estado de conservação", "estado regular" ou "com avaria visível", somente quando a imagem permitir.',
    'Não afirme funcionamento elétrico/hidráulico se a foto não comprovar; prefira "aparentemente em bom estado de conservação".',
    'Não use frases como "a imagem mostra", "parece ser", "não é possível determinar", "não visível" ou "não identificado".',
    'Não invente danos, medidas, materiais, marcas ou problemas que não estejam evidentes.',
    'Responda em português do Brasil, com 1 a 4 itens iniciados por "•", no estilo de laudo, usando frases completas e naturais.'
  ].join(' ');

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 320,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: imageDataUrl }
            }
          ]
        }
      ]
    })
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body?.error?.message || body?.message || `Erro ${response.status} na API de IA`;
    throw Object.assign(new Error(detail), { statusCode: response.status >= 500 ? 502 : response.status });
  }

  const descricao = body?.choices?.[0]?.message?.content?.trim();
  if (!descricao) {
    throw Object.assign(new Error('A IA não retornou uma descrição.'), { statusCode: 502 });
  }

  return { descricao, provider, model };
}

module.exports = {
  descreverFoto
};
