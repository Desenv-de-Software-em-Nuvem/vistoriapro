const crypto = require('crypto');

const DEFAULT_GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const MAX_CACHE_ITEMS = 300;
const descriptionCache = new Map();
const pendingRequests = new Map();

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

  if (!/^data:image\/(png|jpe?g|webp);base64,/i.test(imageDataUrl) && !/^https?:\/\//i.test(imageDataUrl)) {
    throw Object.assign(new Error('Envie a imagem como data URL base64 ou URL pública.'), { statusCode: 400 });
  }
}

function normalizeImageDataUrls({ imageDataUrl, imageDataUrls }) {
  const imagens = Array.isArray(imageDataUrls) ? imageDataUrls : [imageDataUrl];
  const validas = imagens.filter(Boolean);

  if (!validas.length) {
    throw Object.assign(new Error('Envie ao menos uma imagem.'), { statusCode: 400 });
  }

  validas.forEach(assertImageDataUrl);
  return validas;
}

function sanitizeInstrucoes(instrucoes) {
  if (!instrucoes || typeof instrucoes !== 'string') return '';
  return instrucoes.trim().slice(0, 1200);
}

function createHash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of descriptionCache.entries()) {
    if (entry.expiresAt <= now) {
      descriptionCache.delete(key);
    }
  }

  while (descriptionCache.size > MAX_CACHE_ITEMS) {
    const oldestKey = descriptionCache.keys().next().value;
    if (!oldestKey) break;
    descriptionCache.delete(oldestKey);
  }
}

function createCacheKey({ imagens, comodoNome, instrucoes, provider, model, scopeKey }) {
  const imageHashes = imagens.map(createHash).sort();
  return createHash(JSON.stringify({
    scopeKey: scopeKey || 'global',
    provider,
    model,
    comodoNome: comodoNome || '',
    instrucoes,
    imageHashes
  }));
}

function buildPrompt({ imagens, comodoNome, instrucoesDoVistoriador, consolidar = false }) {
  return [
    'Você é um vistoriador imobiliário profissional, especialista em laudos de vistoria de entrada e ocupação de imóveis residenciais.',
    'Seu texto deve seguir o padrão técnico de imobiliárias: objetivo, minucioso, verificável e organizado por elementos do ambiente.',
    consolidar
      ? `Consolide as descrições técnicas das ${imagens.length} foto(s) do cômodo "${comodoNome || 'não informado'}" em um único texto de laudo.`
      : `Analise todas as ${imagens.length} foto(s) anexadas do cômodo "${comodoNome || 'não informado'}" e gere uma descrição consolidada do cômodo.`,
    'Use todas as fotos como evidência complementar do mesmo cômodo. Não faça uma descrição separada para cada foto; gere uma descrição única e coerente do ambiente.',
    'Quando a imagem enviada for um mosaico com marcações "Foto 1", "Foto 2" etc., trate todas as partes do mosaico como fotos do mesmo cômodo.',
    'Observe e descreva somente elementos efetivamente visíveis. Não invente medidas, marcas, modelos, funcionamento, defeitos, materiais ou quantidade quando não houver evidência visual clara.',
    'Priorize esta ordem quando os itens estiverem visíveis: Instalação elétrica/tomadas/interruptores; Ponto de luz/luminárias; Paredes/revestimentos/pintura/rodapés; Piso; Forro/teto; Portas/maçanetas/fechaduras; Janelas/esquadrias/travas; Bancadas/pias/tanques/torneiras/metais; Louças sanitárias/box/chuveiro; Armários/móveis/equipamentos aparentes; Observações de avarias, manchas, furos, desgastes ou marcas de uso.',
    'Use frases no estilo: "Paredes em alvenaria com pintura na cor branca, em bom estado de conservação." ou "Piso revestido em cerâmica na cor branca, apresentando marcas de uso pontuais."',
    'Quando houver dano, descreva a avaria com precisão e sem exagero: "possui marcas de uso", "apresenta pequenos furos", "com manchas aparentes", "com desgaste aparente", "com avaria visível".',
    'Classifique a conservação com naturalidade: "em bom estado de conservação", "com marcas de uso", "em estado regular de conservação" ou "com avaria visível", conforme a evidência.',
    'Nunca afirme "funcionando" para lâmpadas, tomadas, interruptores, torneiras, descargas, chuveiros, fechaduras, trancas, ar-condicionado ou eletrodomésticos apenas pela foto. Só use "funcionando" se as instruções complementares do vistoriador informarem que foi testado.',
    'Se não houver teste informado, use "aparentemente em bom estado de conservação" ou apenas descreva o item e seu estado físico visível.',
    'Não cite itens ausentes. Não escreva "não visível", "não identificado", "não é possível determinar", "parece", "a imagem mostra", "foto mostra" ou "na imagem".',
    'Não use linguagem comercial, opinativa ou genérica. Não diga "bonito", "moderno", "aconchegante" ou similares.',
    'Não faça conclusão jurídica nem texto sobre contrato; descreva apenas o cômodo.',
    instrucoesDoVistoriador
      ? `Instruções complementares do vistoriador: ${instrucoesDoVistoriador}`
      : '',
    'Formato obrigatório da resposta: português do Brasil, sem título, com 4 a 10 tópicos iniciados por "•". Cada tópico deve começar pelo elemento vistoriado, por exemplo: "• Paredes:", "• Piso:", "• Porta:", "• Janela:", "• Móveis:", "• Observação:".',
    'Cada tópico deve ser uma frase técnica completa, preferencialmente curta, mas específica o suficiente para servir em laudo imobiliário.'
  ].filter(Boolean).join(' ');
}

async function requestDescricao({ baseUrl, apiKey, model, prompt, imagens }) {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
        max_tokens: 850,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...imagens.map((imagem) => ({
              type: 'image_url',
              image_url: { url: imagem }
            }))
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

  return descricao;
}

async function descreverFoto({ imageDataUrl, imageDataUrls, comodoNome, instrucoes, scopeKey }) {
  if (process.env.AI_ENABLED === 'false') {
    throw Object.assign(new Error('IA desativada neste ambiente.'), { statusCode: 503 });
  }

  const imagens = normalizeImageDataUrls({ imageDataUrl, imageDataUrls });

  const { provider, apiKey, baseUrl, model } = getProviderConfig();
  if (!apiKey) {
    throw Object.assign(new Error('Chave da API de IA não configurada.'), { statusCode: 503 });
  }

  const instrucoesDoVistoriador = sanitizeInstrucoes(instrucoes);
  const cacheKey = createCacheKey({
    imagens,
    comodoNome,
    instrucoes: instrucoesDoVistoriador,
    provider,
    model,
    scopeKey
  });
  pruneCache();

  const cached = descriptionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.result, cached: true };
  }

  const pending = pendingRequests.get(cacheKey);
  if (pending) {
    const result = await pending;
    return { ...result, cached: true };
  }

  const prompt = buildPrompt({ imagens, comodoNome, instrucoesDoVistoriador });

  const requestPromise = (async () => {
    let descricao;
    try {
      descricao = await requestDescricao({ baseUrl, apiKey, model, prompt, imagens });
    } catch (error) {
      if (error.statusCode !== 400 || imagens.length === 1) {
        throw error;
      }

      const descricoesPorFoto = [];
      for (const imagem of imagens) {
        const promptFoto = buildPrompt({
          imagens: [imagem],
          comodoNome,
          instrucoesDoVistoriador
        });
        descricoesPorFoto.push(await requestDescricao({
          baseUrl,
          apiKey,
          model,
          prompt: promptFoto,
          imagens: [imagem]
        }));
      }

      descricao = descricoesPorFoto.join('\n');
    }

    const result = { descricao, provider, model };
    descriptionCache.set(cacheKey, {
      result,
      expiresAt: Date.now() + CACHE_TTL_MS
    });
    pruneCache();

    return result;
  })();

  pendingRequests.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}

module.exports = {
  descreverFoto
};
