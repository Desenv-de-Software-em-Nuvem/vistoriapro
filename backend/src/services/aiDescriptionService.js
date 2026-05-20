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

function isMockDescriptionEnabled() {
  return process.env.AI_MOCK_DESCRIPTIONS === 'true' || (process.env.AI_PROVIDER || '').toLowerCase() === 'mock';
}

function shouldFallbackOnRateLimit() {
  return process.env.NODE_ENV !== 'production' && process.env.AI_FALLBACK_ON_RATE_LIMIT !== 'false';
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

function isAreaExterna(comodoNome) {
  const nome = String(comodoNome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return [
    'externa',
    'fachada',
    'frente',
    'fundos',
    'patio',
    'jardim',
    'quintal',
    'garagem',
    'area externa',
    'terreno'
  ].some((trecho) => nome.includes(trecho));
}

function buildPrompt({ imagens, comodoNome, instrucoesDoVistoriador, consolidar = false }) {
  const areaExterna = isAreaExterna(comodoNome);
  const focoDoAmbiente = areaExterna
    ? [
        'Este ambiente é área externa/fachada/quintal/garagem. Priorize elementos externos efetivamente visíveis: fachada e pintura externa, muros, grades, portões, calçada/passeio, piso de brita, gramado, arborização, canteiros, pedras decorativas, cobertura/garagem, pilares, vigas, laje/forro externo, esquadrias externas, venezianas, portas externas, aparelho de ar-condicionado externo, pontos elétricos aparentes, mangueira/torneira externa e áreas em obra ou sem acabamento.',
        'Para área externa, não use categorias internas como móveis, louças sanitárias, box, chuveiro, armários ou eletrodomésticos, salvo se estiverem claramente visíveis.'
      ]
    : [
        'Priorize elementos internos efetivamente visíveis: instalação elétrica/tomadas/interruptores, pontos de luz/luminárias, paredes/revestimentos/pintura/rodapés, piso, forro/teto, portas/maçanetas/fechaduras, janelas/esquadrias/travas, bancadas/pias/tanques/torneiras/metais, louças sanitárias/box/chuveiro, armários/móveis/equipamentos aparentes.'
      ];

  return [
    'Você é um vistoriador imobiliário profissional. Gere texto para laudo de vistoria de imóvel, com linguagem técnica, objetiva, verificável e baseada somente nas fotos.',
    consolidar
      ? `Consolide as descrições técnicas das ${imagens.length} foto(s) do ambiente "${comodoNome || 'não informado'}" em um único texto.`
      : `Analise as ${imagens.length} foto(s) anexadas do ambiente "${comodoNome || 'não informado'}" e gere uma descrição consolidada.`,
    'As fotos são evidências complementares do mesmo ambiente. Não descreva foto por foto; descreva o conjunto observado.',
    ...focoDoAmbiente,
    'Faça primeiro um inventário mental dos elementos realmente visíveis e só depois escreva. Cada linha deve citar um elemento concreto visto nas fotos e uma característica observável.',
    'Não use linhas-padrão para preencher espaço. Não cite portas, janelas, móveis, equipamentos, piso ou paredes se essa linha não acrescentar uma característica específica visível.',
    'Proibido escrever: "não identificado", "não foram identificadas avarias", "sem avarias significativas", "aparentemente", "parece", "a imagem mostra", "na foto", "material não identificado", "móveis e equipamentos".',
    'Não invente funcionamento, teste, marca, modelo, medida, quantidade exata, material oculto ou estado de conservação quando a evidência visual não sustentar.',
    'Nunca afirme "funcionando" para lâmpadas, tomadas, interruptores, torneiras, fechaduras, trancas, ar-condicionado ou eletrodomésticos apenas pela foto. Só use "funcionando" se as instruções do vistoriador disserem que foi testado.',
    'Quando houver obra inacabada ou acabamento pendente, descreva isso de forma direta: alvenaria aparente, concreto aparente, instalação aparente, forro/laje visível, revestimento ausente, piso em concreto bruto, pintura não executada ou acabamento pendente.',
    'Quando houver conservação visível, use termos moderados e específicos: "em bom estado visual", "com marcas de uso", "com sujidade", "com desgaste", "com manchas", "com fissuras", "com pintura irregular", "com acabamento pendente".',
    'Não escreva uma observação final genérica. A linha "Observação:" só é permitida para registrar algo concreto visto nas fotos.',
    instrucoesDoVistoriador
      ? `Instruções complementares do vistoriador: ${instrucoesDoVistoriador}`
      : '',
    'Formato obrigatório: português do Brasil, sem título, sem bullets, sem numeração, com 6 a 12 linhas curtas. Comece cada linha pelo elemento vistoriado, por exemplo "Fachada:", "Muros:", "Gradil:", "Calçada:", "Gramado:", "Garagem:", "Paredes:", "Forro:", "Piso:", "Instalação elétrica:".',
    'A descrição precisa ser específica o suficiente para diferenciar este imóvel de outro. Se a linha servir para qualquer imóvel, reescreva com detalhes visíveis deste conjunto de fotos.'
  ].filter(Boolean).join(' ');
}

function createMockDescricao({ comodoNome }) {
  if (isAreaExterna(comodoNome)) {
    return [
      'Fachada: edificação com pintura externa em tom cinza claro, esquadrias brancas e venezianas aparentes.',
      'Área externa: pátio com trechos em brita e áreas gramadas, com arborização de médio porte.',
      'Garagem: área coberta sob a edificação, com pilares e vigas em concreto aparente.',
      'Paredes internas da garagem: alvenaria de tijolos aparentes, com acabamento pendente.',
      'Piso da garagem: contrapiso em concreto, com marcas de uso e sujidade pontual.',
      'Muros e divisas: fechamento lateral em alvenaria, com trechos sem acabamento finalizado.',
      'Gradil e portão: fechamento frontal em estrutura metálica pintada em cor escura.',
      'Instalações aparentes: pontos elétricos e fiação visíveis na área coberta, sem teste de funcionamento.'
    ].join('\n');
  }

  return [
    'Paredes: superfícies aparentes registradas nas fotos, com estado visual descrito conforme evidência disponível.',
    'Piso: revestimento ou base visível no ambiente, com marcas de uso compatíveis com vistoria fotográfica.',
    'Aberturas: portas, janelas ou esquadrias visíveis devem ser conferidas presencialmente quanto ao funcionamento.',
    'Instalação elétrica: pontos aparentes descritos somente quanto ao estado físico visível, sem teste de funcionamento.',
    'Observação: descrição local de teste gerada sem consulta ao provedor de IA.'
  ].join('\n');
}

function normalizarDescricaoLaudo(descricao) {
  const linhas = String(descricao || '')
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean);

  const trechosProibidos = [
    'não há informações suficientes',
    'lembre-se',
    'hipotética',
    'hipotético',
    'para um laudo preciso',
    'foto específica',
    'posso fornecer uma estrutura',
    'se considerarmos',
    'não identificado',
    'não identificada',
    'não identificadas',
    'não identificados',
    'não foram identificadas avarias',
    'não foram identificados danos',
    'sem avarias significativas',
    'sem danos significativos',
    'material não identificado',
    'móveis e equipamentos',
    'aparentemente em bom estado',
    'a imagem mostra',
    'na imagem',
    'na foto'
  ];

  const topicos = linhas
    .map((linha) => linha.replace(/^[•\-*]\s+/, '').replace(/^\d+[.)]\s+/, '').trim())
    .filter(Boolean)
    .filter((linha) => {
      const texto = linha.toLowerCase();
      return !trechosProibidos.some((trecho) => texto.includes(trecho)) && ![
        'não há informações suficientes',
        'lembre-se',
        'hipotética',
        'hipotético',
        'para um laudo preciso',
        'foto específica',
        'posso fornecer uma estrutura',
        'se considerarmos'
      ].some((trecho) => texto.includes(trecho));
    })
    .slice(0, 12);

  const resultado = topicos.join('\n').trim();
  return resultado;
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
      temperature: 0.05,
      top_p: 0.85,
      max_tokens: 900,
      messages: [
        {
          role: 'system',
          content: [
            'Você responde exclusivamente como vistoriador imobiliário técnico.',
            'Sua resposta deve conter somente linhas técnicas de laudo, sem bullets, sem marcadores e sem numeração.',
            'É proibido explicar limitações, pedir mais fotos, criar exemplos hipotéticos, fazer observações sobre a tarefa ou escrever qualquer texto fora das linhas técnicas.',
            'É proibido preencher lacunas com itens genéricos. Descreva apenas elementos concretos e visíveis.',
            'Se a foto tiver pouca informação, descreva apenas os poucos elementos visíveis em linhas técnicas.'
          ].join(' ')
        },
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

  const descricao = normalizarDescricaoLaudo(body?.choices?.[0]?.message?.content);
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
  if (isMockDescriptionEnabled()) {
    return {
      descricao: createMockDescricao({ comodoNome }),
      provider: 'mock',
      model: 'local-description-mock',
      mocked: true
    };
  }

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
    let resultProvider = provider;
    let resultModel = model;
    try {
      descricao = await requestDescricao({ baseUrl, apiKey, model, prompt, imagens });
    } catch (error) {
      if (error.statusCode === 429 && shouldFallbackOnRateLimit()) {
        descricao = createMockDescricao({ comodoNome });
        resultProvider = 'mock';
        resultModel = 'local-rate-limit-fallback';
      } else {
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
    }

    const result = { descricao, provider: resultProvider, model: resultModel };
    if (resultProvider !== 'mock') {
      descriptionCache.set(cacheKey, {
        result,
        expiresAt: Date.now() + CACHE_TTL_MS
      });
      pruneCache();
    }

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
