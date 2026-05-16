const relatorioModel = require('../models/relatorioModel');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const mustache = require('mustache');
const { Jimp, JimpMime } = require('jimp');
let sharp;
try { sharp = require('sharp'); } catch { sharp = null; }
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableBorders,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  UnderlineType,
  VerticalAlign,
  WidthType,
} = require('docx');

const COMMON_CHROME_PATHS = process.platform === 'win32'
  ? [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      process.env.CHROME_PATH,
      process.env.CHROMIUM_PATH,
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    ]
  : [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      process.env.CHROME_PATH,
      process.env.CHROMIUM_PATH,
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/microsoft-edge'
    ]
  .filter(Boolean);

const findChromeExecutable = () => {
  for (const executablePath of COMMON_CHROME_PATHS) {
    if (typeof executablePath === 'string' && fs.existsSync(executablePath)) {
      return executablePath;
    }
  }

  return undefined;
};

/** Chrome compartilhado entre gerações de PDF (evita ~5–20s de launch a cada laudo no Render). */
let pdfBrowserSingleton = null;
let pdfBrowserLaunchPromise = null;

/** Cache de logo processada por empresa (Jimp crop+resize+cores extraídas). TTL de 5 min. */
const logoProcessadaCache = new Map();
const LOGO_CACHE_TTL_MS = 5 * 60 * 1000;

/** Executa fn em paralelo com no máximo `limit` concurrent. Mantém ordem do array original. */
async function mapComConcorrencia(items, fn, limit = 6) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function obtainPdfBrowser() {
  if (pdfBrowserSingleton) {
    try {
      if (typeof pdfBrowserSingleton.isConnected === 'function' && pdfBrowserSingleton.isConnected()) {
        return pdfBrowserSingleton;
      }
    } catch {
      /* browser inválido */
    }
    pdfBrowserSingleton = null;
  }
  if (pdfBrowserLaunchPromise) {
    return pdfBrowserLaunchPromise;
  }
  const chromePath = process.platform === 'win32' ? findChromeExecutable() : undefined;
  pdfBrowserLaunchPromise = puppeteer
    .launch({
      headless: 'new',
      ...(chromePath ? { executablePath: chromePath } : {}),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-background-networking',
      ],
      protocolTimeout: 300_000,
    })
    .then((browser) => {
      pdfBrowserSingleton = browser;
      pdfBrowserLaunchPromise = null;
      browser.on('disconnected', () => {
        pdfBrowserSingleton = null;
      });
      return browser;
    })
    .catch((err) => {
      pdfBrowserLaunchPromise = null;
      throw err;
    });
  return pdfBrowserLaunchPromise;
}

async function closeSharedPdfBrowser() {
  const b = pdfBrowserSingleton;
  pdfBrowserSingleton = null;
  pdfBrowserLaunchPromise = null;
  if (b) {
    await b.close().catch(() => {});
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_API_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const relatoriosDir = path.join(__dirname, '../../uploads/relatorios');
const FOTO_MAX_WIDTH = 720;
const FOTO_MAX_HEIGHT = 720;
const FOTO_JPEG_QUALITY = 38;
const LOGO_MAX_WIDTH = 900;
const LOGO_MAX_HEIGHT = 360;
const LOGO_CROP_PADDING_RATIO = 0.02;
const DOCX_ORANGE = 'FF4500';
const DOCX_BLUE_LIGHT = 'F5E7E1';
const DOCX_TEXT = '222222';
const DOCX_MUTED = '555555';
const DOCX_BORDER = 'D8D8D8';
const SYSTEM_ORANGE_STRIPE_COLORS = ['#ff4500', '#ff6b35', '#ff8c42'];
const MESES_PT_BR = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
const PROPERTY_TYPE_DISPLAY = {
  APARTAMENTO: 'Apartamento',
  CASA_RESIDENCIAL: 'Casa Residencial',
  CASA_COMERCIAL: 'Casa Comercial',
  LOJA: 'Loja',
  SALA_COMERCIAL: 'Sala Comercial',
  GALPAO: 'Galpão',
  CASA: 'Casa Residencial',
  COMERCIAL: 'Comercial',
  TERRENO: 'Terreno',
  OUTRO: 'Outro',
};
const PROPERTY_TYPE_BY_NORMALIZED = {
  APARTAMENTO: 'APARTAMENTO',
  CASA: 'CASA_RESIDENCIAL',
  CASARESIDENCIAL: 'CASA_RESIDENCIAL',
  CASACOMERCIAL: 'CASA_COMERCIAL',
  COMERCIAL: 'COMERCIAL',
  LOJA: 'LOJA',
  SALACOMERCIAL: 'SALA_COMERCIAL',
  GALPAO: 'GALPAO',
  TERRENO: 'TERRENO',
  OUTRO: 'OUTRO',
};
const CONCLUSAO_TEXTOS = [
  'O presente laudo é parte integrante do contrato de locação realizado entre o locatário e o locador acima qualificados, o locatário reconhece no presente ato o compromisso assumido de entregar o imóvel locado nas mesmas condições que por ele recebido e neste laudo descrita.',
  'Este relatório retratará fidedignamente o estado do imóvel no momento da vistoria. Caso algo não esteja relatado em forma de texto, mas estejam visíveis nas fotos que acompanham a vistoria, as mesmas poderão ser utilizadas para efeitos de comprovação das características e estado de conservação, se encontrando as imagens em qualidade e resolução superior arquivadas com a administradora, podendo ser solicitados os arquivos originais mediante requerimento escrito.',
];
const DISPOSITIVO_LEI_LINHAS = [
  { prefixo: 'Dispositivo da Lei 8.245/91:', texto: '' },
  { prefixo: 'Art. 23', texto: '- O Locatário é obrigado a:' },
  { prefixo: 'II', texto: '- Servir-se do imóvel para uso convencionado ou presumido, compatível com a natureza deste e com o fim a que se destina, devendo tratá-lo com o mesmo cuidado como se fosse seu;' },
  { prefixo: 'III', texto: '- restituir o imóvel, finda a locação, no estado em que o recebeu, salvo as deteriorações decorrentes do seu uso normal;' },
  { prefixo: 'IV', texto: '- Não modificar a forma interna ou externa do imóvel sem o consentimento prévio e por escrito do locador;' },
  { prefixo: 'IX', texto: '- Permitir a vistoria do imóvel pelo Locador ou por seu mandatário, mediante combinação prévia de dia e hora, bem como admitir que seja visitado e examinado por terceiros, na hipótese prevista no art.27;' },
  { prefixo: 'PARÁGRAFO ÚNICO:', texto: 'qualquer discordância por parte do locatário, com relação ao laudo de vistoria, deverá ser feita, no prazo improrrogável de até 05(cinco) dias contados da data de realização da mesma.' },
];
const DECLARACAO_ASSINATURA_TEXTOS = [
  'Declaro ter participado pessoalmente da vistoria acima descrita, que fica fazendo parte integrante do Contrato de Locação por mim firmado, assumindo neste ato o encargo de deixar o imóvel nas mesmas condições em que ora recebo.',
  'Declaro para os devidos fins, que concordo com todos os itens do termo de vistoria acima.',
];
const logoCandidates = [
  path.join(__dirname, '../../public/VistoriaPro1.png'),
  path.join(process.cwd(), 'public/VistoriaPro1.png'),
  path.join(__dirname, '../../../frontend/public/VistoriaPro.png'),
  path.join(__dirname, '../../public/VistoriaPro.png'),
  path.join(process.cwd(), 'public/VistoriaPro.png')
];

function getRelatorioBaseUrl(req) {
  const internalPort = process.env.PORT || '3000';
  const host = process.env.INTERNAL_BASE_URL || `http://127.0.0.1:${internalPort}`;
  return host.replace(/\/$/, '');
}

function getLogoDataUri() {
  for (const candidate of logoCandidates) {
    if (fs.existsSync(candidate)) {
      const extension = path.extname(candidate).toLowerCase();
      const mimeType = extension === '.png' ? 'image/png' : 'image/svg+xml';
      const buffer = fs.readFileSync(candidate);
      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    }
  }

  return '';
}

function normalizarUrlImagem(req, url) {
  if (!url) return '';
  if (/^data:|^https?:\/\//i.test(url)) return url;

  const baseUrl = getRelatorioBaseUrl(req);
  try {
    return new URL(url, `${baseUrl}/`).toString();
  } catch {
    return url;
  }
}

function getMimeTypeByPath(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.gif') return 'image/gif';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.svg') return 'image/svg+xml';
  return 'image/jpeg';
}

function dataUriToBuffer(dataUri) {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64')
  };
}

function getLogoImageData() {
  for (const candidate of logoCandidates) {
    if (fs.existsSync(candidate)) {
      const mimeType = getMimeTypeByPath(candidate);
      return {
        type: mimeType.includes('png') ? 'png' : 'jpg',
        buffer: fs.readFileSync(candidate)
      };
    }
  }

  return null;
}

function getDocxImageType(mimeType = '') {
  const normalized = mimeType.toLowerCase().split(';')[0];
  if (normalized.includes('png')) return 'png';
  if (normalized.includes('jpeg') || normalized.includes('jpg')) return 'jpg';
  if (normalized.includes('gif')) return 'gif';
  if (normalized.includes('bmp')) return 'bmp';
  return null;
}

function isLogoContentPixel(r, g, b, alpha) {
  if (alpha < 20) return false;
  if (alpha < 245) return true;

  return r < 246 || g < 246 || b < 246;
}

function encontrarCaixaConteudoLogo(image) {
  const { data, width, height } = image.bitmap;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (width * y + x) * 4;
      if (!isLogoContentPixel(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) continue;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < 0 || maxY < 0) return null;

  return {
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
  };
}

function expandirCaixaLogo(box, image) {
  const { width, height } = image.bitmap;
  const padding = Math.max(6, Math.round(Math.max(box.w, box.h) * LOGO_CROP_PADDING_RATIO));
  const x = Math.max(0, box.x - padding);
  const y = Math.max(0, box.y - padding);
  const right = Math.min(width, box.x + box.w + padding);
  const bottom = Math.min(height, box.y + box.h + padding);

  return {
    x,
    y,
    w: Math.max(1, right - x),
    h: Math.max(1, bottom - y),
  };
}

async function prepararLogoParaLaudo(imageData) {
  const mimeType = imageData?.mimeType?.split(';')[0] || '';
  const type = getDocxImageType(mimeType);
  if (!imageData?.buffer || !type || mimeType.includes('svg')) return null;

  try {
    const image = await Jimp.read(imageData.buffer);
    const contentBox = encontrarCaixaConteudoLogo(image);

    if (contentBox) {
      const cropBox = expandirCaixaLogo(contentBox, image);
      const shouldCrop = cropBox.w < image.bitmap.width - 8 || cropBox.h < image.bitmap.height - 8;

      if (shouldCrop) {
        image.crop(cropBox);
      }
    }

    image.scaleToFit({ w: LOGO_MAX_WIDTH, h: LOGO_MAX_HEIGHT });
    const buffer = await image.getBuffer(JimpMime.png);

    return {
      mimeType: JimpMime.png,
      type: 'png',
      buffer,
      width: image.bitmap.width,
      height: image.bitmap.height,
    };
  } catch (err) {
    console.warn('[gerarRelatorio] Nao foi possivel preparar a logomarca:', err.message);
    return {
      mimeType,
      type,
      buffer: imageData.buffer,
    };
  }
}

function clampColor(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((channel) => clampColor(channel).toString(16).padStart(2, '0')).join('')}`;
}

function hexToRgb(hex) {
  const clean = String(hex || '').replace('#', '');
  if (!/^[\da-f]{6}$/i.test(clean)) return { r: 255, g: 69, b: 0 };

  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function mixHex(hex, targetHex, amount) {
  const base = hexToRgb(hex);
  const target = hexToRgb(targetHex);

  return rgbToHex({
    r: base.r + (target.r - base.r) * amount,
    g: base.g + (target.g - base.g) * amount,
    b: base.b + (target.b - base.b) * amount,
  });
}

function rgbToHsl({ r, g, b }) {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;
  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { hue: 0, saturation: 0, lightness };
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue;
  if (max === nr) hue = ((ng - nb) / delta) % 6;
  else if (max === ng) hue = (nb - nr) / delta + 2;
  else hue = (nr - ng) / delta + 4;

  return { hue: (hue * 60 + 360) % 360, saturation, lightness };
}

function criarCoresFaixaPorBase(baseHex) {
  return [
    baseHex,
    mixHex(baseHex, '#ffffff', 0.22),
    mixHex(baseHex, '#ffffff', 0.42),
  ];
}

async function extrairCoresFaixaDaLogo(logoImageData) {
  if (!logoImageData?.buffer) return SYSTEM_ORANGE_STRIPE_COLORS;

  try {
    const image = await Jimp.read(logoImageData.buffer);
    const { data, width, height } = image.bitmap;
    const sampleStep = Math.max(1, Math.floor(Math.sqrt((width * height) / 6000)));
    const buckets = new Map();

    for (let y = 0; y < height; y += sampleStep) {
      for (let x = 0; x < width; x += sampleStep) {
        const idx = (width * y + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const alpha = data[idx + 3];
        if (alpha < 120) continue;

        const hsl = rgbToHsl({ r, g, b });
        const colorfulness = Math.max(r, g, b) - Math.min(r, g, b);
        const isAlmostWhite = r > 238 && g > 238 && b > 238;
        const isAlmostBlack = r < 35 && g < 35 && b < 35;
        if (isAlmostWhite || isAlmostBlack) continue;
        if (hsl.saturation < 0.22 || colorfulness < 32 || hsl.lightness < 0.16 || hsl.lightness > 0.88) continue;

        const bucketKey = Math.round(hsl.hue / 18) * 18;
        const bucket = buckets.get(bucketKey) || { weight: 0, r: 0, g: 0, b: 0 };
        const weight = hsl.saturation * (1 - Math.abs(hsl.lightness - 0.5) * 0.45);
        bucket.weight += weight;
        bucket.r += r * weight;
        bucket.g += g * weight;
        bucket.b += b * weight;
        buckets.set(bucketKey, bucket);
      }
    }

    const dominant = [...buckets.values()].sort((a, b) => b.weight - a.weight)[0];
    if (!dominant?.weight) return SYSTEM_ORANGE_STRIPE_COLORS;

    const baseHex = rgbToHex({
      r: dominant.r / dominant.weight,
      g: dominant.g / dominant.weight,
      b: dominant.b / dominant.weight,
    });

    return criarCoresFaixaPorBase(baseHex);
  } catch (err) {
    console.warn('[gerarRelatorio] Nao foi possivel extrair cores da logomarca:', err.message);
    return SYSTEM_ORANGE_STRIPE_COLORS;
  }
}

function montarLinhaEmpresa(data) {
  return joinNonEmpty([
    data.empresa_nome,
    data.empresa_cnpj ? `CNPJ: ${data.empresa_cnpj}` : '',
    data.empresa_creci ? `CRECI: ${data.empresa_creci}` : ''
  ], ' | ');
}

function montarContatoEmpresa(data) {
  return joinNonEmpty([
    data.empresa_endereco,
    data.empresa_responsavel_nome ? `Resp.: ${data.empresa_responsavel_nome}` : '',
    data.empresa_email,
    data.empresa_site,
    data.empresa_telefone ? `Tel.: ${data.empresa_telefone}` : '',
    data.empresa_whatsapp ? `WhatsApp: ${data.empresa_whatsapp}` : '',
    data.empresa_instagram ? `Instagram: ${data.empresa_instagram}` : ''
  ], ' | ');
}

async function getEmpresaLogoReportData(req, empresa) {
  const logoUrl = valorInformado(empresa?.logo_url);
  if (logoUrl) {
    const imageData = await obterImagemBuffer(req, logoUrl);
    const mimeType = imageData?.mimeType?.split(';')[0] || '';

    if (imageData?.buffer && /^image\//i.test(mimeType)) {
      if (mimeType.includes('svg')) {
        return {
          dataUri: `data:${mimeType};base64,${imageData.buffer.toString('base64')}`,
          imageData: null,
        };
      }

      const logo = await prepararLogoParaLaudo({ ...imageData, mimeType });
      if (logo?.buffer) {
        return {
          dataUri: `data:${logo.mimeType};base64,${logo.buffer.toString('base64')}`,
          imageData: logo,
        };
      }
    }
  }

  return { dataUri: '', imageData: null };
}

async function getEmpresaLogoReportDataCached(req, empresa) {
  const cacheKey = String(empresa?.id || '');
  const logoUrl = valorInformado(empresa?.logo_url);
  const cached = logoProcessadaCache.get(cacheKey);
  if (cached && cached.logoUrl === logoUrl && (Date.now() - cached.timestamp) < LOGO_CACHE_TTL_MS) {
    return cached;
  }
  const { dataUri, imageData } = await getEmpresaLogoReportData(req, empresa);
  const faixaRodapeCores = await extrairCoresFaixaDaLogo(imageData);
  const entry = { dataUri, imageData, faixaRodapeCores, logoUrl, timestamp: Date.now() };
  logoProcessadaCache.set(cacheKey, entry);
  return entry;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function valorInformado(value) {
  const text = String(value || '').trim();
  return text && text !== '-' ? text : '';
}

function joinNonEmpty(values, separator = ', ') {
  return values
    .map(valorInformado)
    .filter(Boolean)
    .join(separator);
}

function formatarDataBR(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function obterPartesData(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return {
        ano: Number(match[1]),
        mes: Number(match[2]),
        dia: Number(match[3]),
      };
    }
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    ano: date.getUTCFullYear(),
    mes: date.getUTCMonth() + 1,
    dia: date.getUTCDate(),
  };
}

function formatarDataExtenso(value) {
  const partes = obterPartesData(value);
  if (!partes) return formatarDataBR(value);

  return `${String(partes.dia).padStart(2, '0')} de ${MESES_PT_BR[partes.mes - 1]} de ${partes.ano}`;
}

function formatarLocalDataExtenso(data) {
  const local = joinNonEmpty([data.imovel_cidade, data.imovel_uf], ', ');
  const dataExtenso = formatarDataExtenso(data.data_vistoria || data.data);

  return joinNonEmpty([local, dataExtenso], ' ');
}

function documentoCpf(value) {
  const cpf = valorInformado(value);
  return cpf ? `CPF: ${cpf}` : 'CPF:';
}

function documentoCnpj(value) {
  const cnpj = valorInformado(value);
  return cnpj ? `CNPJ: ${cnpj}` : '';
}

function normalizarTipoImovelRelatorio(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_-]+/g, '')
    .toUpperCase();
}

function formatarTipoImovelRelatorio(value) {
  const text = valorInformado(value);
  if (!text) return '';

  const normalized = normalizarTipoImovelRelatorio(text);
  const key = PROPERTY_TYPE_BY_NORMALIZED[normalized] || normalized;
  if (PROPERTY_TYPE_DISPLAY[key]) return PROPERTY_TYPE_DISPLAY[key];

  return text
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word) => word ? word.charAt(0).toUpperCase() + word.slice(1) : '')
    .join(' ');
}

function montarPessoa({ nome, nacionalidade, profissao, cpf, rg, rg_orgao, rg_uf, endereco }) {
  const partes = [];
  const nomeFormatado = valorInformado(nome);
  if (nomeFormatado) partes.push(nomeFormatado.toUpperCase());

  const qualificacao = joinNonEmpty([nacionalidade, profissao]);
  if (qualificacao) partes.push(qualificacao);
  if (cpf) partes.push(`inscrito(a) no CPF sob o nº ${cpf}`);
  if (rg) {
    const orgao = joinNonEmpty([rg_orgao, rg_uf], '/');
    partes.push(`documento de identidade nº ${rg}${orgao ? ` - ${orgao}` : ''}`);
  }
  if (endereco) partes.push(`residente e domiciliado(a) à ${endereco}`);

  return partes.join(', ');
}

function montarAberturaBlocos(data) {
  const blocos = [];
  const locador = montarPessoa({
    nome: data.proprietario_nome,
    nacionalidade: data.proprietario_nacionalidade,
    profissao: data.proprietario_profissao,
    cpf: data.proprietario_cpf,
    rg: data.proprietario_rg,
    rg_orgao: data.proprietario_rg_orgao,
    rg_uf: data.proprietario_rg_uf,
    endereco: data.proprietario_endereco,
  });

  const administradora = data.administradora_nome
    ? joinNonEmpty([
        `neste ato representado(a) pela administradora ${data.administradora_nome}`,
        data.administradora_cnpj ? `pessoa jurídica inscrita no CNPJ nº ${data.administradora_cnpj}` : '',
        data.administradora_endereco ? `sediada à ${data.administradora_endereco}` : '',
        data.socio_nome ? `representada por ${joinNonEmpty([data.socio_nome, data.socio_profissao, data.socio_cpf ? `CPF nº ${data.socio_cpf}` : ''])}` : ''
      ])
    : '';

  if (locador || administradora) {
    blocos.push({
      label: 'LOCADOR(A)',
      texto: [locador, administradora].filter(Boolean).join(', ') + '.',
    });
  }

  const locatarios = (data.locatarios || [])
    .map((locatario) => montarPessoa(locatario))
    .filter(Boolean);

  if (locatarios.length) {
    blocos.push({
      label: 'LOCATÁRIO(A)',
      texto: `${locatarios.join('; ')}.`,
    });
  }

  const objeto = joinNonEmpty([
    data.objeto || data.tipo_imovel ? `O imóvel objeto da presente locação é ${data.objeto || formatarTipoImovelRelatorio(data.tipo_imovel)}` : '',
    data.imovel_endereco ? `localizado à ${data.imovel_endereco}` : '',
    data.imovel_matricula ? `matrícula nº ${data.imovel_matricula}` : '',
    data.imovel_cartorio ? `registrado no ${data.imovel_cartorio}` : ''
  ]);

  if (objeto) {
    blocos.push({
      label: 'OBJETO',
      texto: `${objeto}.`,
    });
  }

  return blocos;
}

function montarDadosImovel(data) {
  const ambientes = (data.comodos || [])
    .map((comodo) => comodo.nome)
    .filter(Boolean)
    .join('; ');

  return [
    { label: 'Tipo de vistoria', valor: data.tipo_vistoria || 'Entrada' },
    { label: 'Tipo de imóvel', valor: formatarTipoImovelRelatorio(data.tipo_imovel) },
    { label: 'Contrato', valor: data.numero_contrato },
    { label: 'Data da vistoria', valor: formatarDataBR(data.data_vistoria || data.data) },
    { label: 'Endereço', valor: data.imovel_endereco, full: true },
    { label: 'Matrícula', valor: data.imovel_matricula },
    { label: 'Cartório', valor: data.imovel_cartorio },
    { label: 'Ambientes', valor: ambientes, full: true },
  ].filter((item) => valorInformado(item.valor));
}

function montarObservacoesPadrao() {
  return [
    {
      prefixo: '•',
      texto: 'A presente vistoria segue aos ditames do art. 22, inc. I e V, bem como art. 23, inc. II e III da Lei de Locação 8.245/91, estando o locatário ciente dos seus direitos e deveres para o adequado cumprimento do contrato.',
    },
    {
      prefixo: '•',
      texto: 'A descrição buscou ser minuciosa, bem como as fotos são apenas do que é visível, como as características do imóvel, acabamentos e seu estado de conservação, não se responsabilizando a administradora ou vistoriador pela eventual detecção de vícios ocultos no imóvel ou pela avaliar de fundações e estruturas, atentando apenas que pela sua experiência e percepção o imóvel cumpre com todos os requisitos mínimos de habitabilidade, conforto, bem estar e para a saúde e segurança dos seus moradores.',
    },
    {
      prefixo: '•',
      texto: 'Quando algo não for relatado de forma escrita nesta vistoria, mas constar nas fotos, estas poderão ser usadas como comprovação do estado e características do imóvel.',
    },
    {
      prefixo: '•',
      texto: 'Os critérios da conservação do imóvel estão descritos abaixo:',
    },
    {
      prefixo: '1.',
      texto: 'Estado BOM: Sem sinais de desgastes ou com pequenas irregularidades.',
      criterio: true,
    },
    {
      prefixo: '2.',
      texto: 'Estado REGULAR: Com avarias.',
      criterio: true,
    },
    {
      prefixo: '3.',
      texto: 'Estado RUIM: Com danos graves e/ou relevantes.',
      criterio: true,
    },
  ];
}

function montarDadosConclusao(data) {
  const locatario = (data.locatarios || []).find((item) => valorInformado(item.nome)) || {};
  const vistoriadorNome = valorInformado(data.vistoriador_nome).toUpperCase();
  const locadorNome = valorInformado(data.empresa_nome).toUpperCase();
  const locatarioNome = valorInformado(locatario.nome).toUpperCase();

  return {
    conclusao_textos: CONCLUSAO_TEXTOS,
    dispositivo_lei: DISPOSITIVO_LEI_LINHAS,
    declaracao_assinatura_textos: DECLARACAO_ASSINATURA_TEXTOS,
    vistoriador_nome: vistoriadorNome,
    vistoriador_cpf: valorInformado(data.vistoriador_cpf),
    local_data_extenso: formatarLocalDataExtenso(data),
    locador_assinatura_nome: locadorNome,
    locador_assinatura_documento: documentoCnpj(data.empresa_cnpj),
    locatario_assinatura_nome: locatarioNome,
    locatario_assinatura_documento: documentoCpf(locatario.cpf),
  };
}

function extrairTopicos(...textos) {
  const vistos = new Set();
  const topicos = [];

  for (const texto of textos) {
    const limpo = limparHtml(texto);
    if (!limpo) continue;

    const partes = limpo
      .replace(/\r/g, '\n')
      .split(/\n+|(?:^|\s)[•\-]\s+/)
      .map((parte) => parte.replace(/^[•\-\d.)\s]+/, '').trim())
      .filter(Boolean);

    for (const parte of partes) {
      const normalizado = parte.toLowerCase();
      if (!vistos.has(normalizado)) {
        vistos.add(normalizado);
        topicos.push(parte);
      }
    }
  }

  return topicos;
}

function montarHeaderTemplatePdf(data) {
  const logo = data.logo_data_uri
    ? `<img src="${data.logo_data_uri}" style="width:260px; height:74px; object-fit:contain; object-position:left top;" />`
    : `<div style="font-size:24px; line-height:1.1; font-weight:800; color:#222;">${escapeHtml(data.empresa_nome || 'Empresa')}</div>`;

  return `
    <div style="width:100%; height:96px; box-sizing:border-box; padding:8px 16mm 0 16mm; font-family:Arial, sans-serif; display:flex; align-items:flex-start; color:#222;">
      ${logo}
    </div>
  `;
}

function formatarSiteRodape(value) {
  return valorInformado(value)
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, 'www.')
    .replace(/\/$/, '');
}

function formatarInstagramRodape(value) {
  const text = valorInformado(value)
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/\/$/, '');

  if (!text) return '';
  return text.startsWith('@') ? text : `@${text}`;
}

function rodapeIconeSvg(tipo) {
  const common = 'width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"';

  if (tipo === 'pin') {
    return `<svg ${common}><path d="M12 21s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.4"/></svg>`;
  }

  if (tipo === 'globe') {
    return `<svg ${common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21"/><path d="M12 3c-2.2 2.5-3.3 5.5-3.3 9S9.8 18.5 12 21"/></svg>`;
  }

  if (tipo === 'mail') {
    return `<svg ${common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>`;
  }

  return `<svg ${common}><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L4 20l1-3.8A8.5 8.5 0 1 1 20.5 11.7z"/><path d="M9.2 7.8c.2-.4.4-.4.7-.4h.6c.2 0 .5.1.6.5l.7 1.7c.1.4 0 .6-.2.8l-.5.5c.7 1.3 1.7 2.2 3 2.9l.5-.5c.2-.2.5-.3.8-.2l1.7.8c.4.2.5.4.5.7v.6c0 .3-.1.6-.4.8-.5.3-1.1.5-1.8.5-3.6-.1-8.1-4.4-8.2-8.1 0-.7.2-1.3.5-1.8z"/></svg>`;
}

function montarLinhaIconeRodape(tipo, texto) {
  if (!valorInformado(texto)) return '';

  return `
    <div style="display:flex; align-items:center; gap:8px; min-height:31px;">
      <span style="display:inline-flex; width:30px; justify-content:center; flex:0 0 30px;">${rodapeIconeSvg(tipo)}</span>
      <span style="display:block; padding-top:1px;">${escapeHtml(texto)}</span>
    </div>
  `;
}

function obterCoresFaixaRodape(data) {
  const cores = Array.isArray(data?.faixa_rodape_cores) && data.faixa_rodape_cores.length >= 3
    ? data.faixa_rodape_cores
    : SYSTEM_ORANGE_STRIPE_COLORS;

  return SYSTEM_ORANGE_STRIPE_COLORS.map((fallback, index) => {
    const cor = String(cores[index] || '').trim();
    return /^#[\da-f]{6}$/i.test(cor) ? cor : fallback;
  });
}

function obterCoresFaixaRodapeDocx(data) {
  return obterCoresFaixaRodape(data).map((cor) => cor.replace('#', '').toUpperCase());
}

function montarFooterTemplatePdf(data) {
  const endereco = valorInformado(data.empresa_endereco);
  const site = formatarSiteRodape(data.empresa_site);
  const email = valorInformado(data.empresa_email);
  const telefone = valorInformado(data.empresa_telefone);
  const whatsapp = valorInformado(data.empresa_whatsapp);
  const instagram = formatarInstagramRodape(data.empresa_instagram);
  const contatoDireita = [telefone, whatsapp].filter(Boolean).map(escapeHtml).join('<br>');
  const [faixaCor1, faixaCor2, faixaCor3] = obterCoresFaixaRodape(data);

  return `
    <div style="width:100%; height:182px; box-sizing:border-box; padding:0; font-family:Arial, Helvetica, sans-serif; color:#111; position:relative; top:20px; overflow:hidden;">
      <div style="position:absolute; left:38px; bottom:42px; width:260px; display:grid; gap:6px; font-size:12px; line-height:1.16; font-weight:700; white-space:normal;">
        ${montarLinhaIconeRodape('pin', endereco)}
        ${montarLinhaIconeRodape('globe', site)}
        ${montarLinhaIconeRodape('mail', email)}
      </div>
      <div style="position:absolute; right:24px; bottom:49px; width:220px; font-size:12px; line-height:1.16; font-weight:700; text-align:left;">
        ${contatoDireita ? `
          <div style="display:flex; align-items:flex-start; gap:7px; margin-bottom:17px;">
            <span style="display:inline-flex; width:30px; flex:0 0 30px; justify-content:center;">${rodapeIconeSvg('whatsapp')}</span>
            <span style="display:block; padding-top:3px;">${contatoDireita}</span>
          </div>
        ` : ''}
        ${instagram ? `<div style="padding-left:37px;"><div style="margin-bottom:4px;">Siga no Instagram:</div><div>${escapeHtml(instagram)}</div></div>` : ''}
      </div>
      <svg width="100%" height="4" viewBox="0 0 1000 4" preserveAspectRatio="none" style="position:absolute; left:0; right:0; bottom:36px; width:100%; height:4px; display:block;">
        <rect x="0" y="0" width="1000" height="4" fill="#111111"></rect>
      </svg>
      <svg width="100%" height="23" viewBox="0 0 1000 23" preserveAspectRatio="none" style="position:absolute; left:0; bottom:0; width:100%; height:23px; display:block;">
        <rect x="0" y="0" width="443" height="23" fill="${faixaCor1}"></rect>
        <rect x="443" y="0" width="347" height="23" fill="${faixaCor2}"></rect>
        <rect x="790" y="0" width="210" height="23" fill="${faixaCor3}"></rect>
      </svg>
    </div>
  `;
}

async function obterImagemBuffer(req, url) {
  const resolvedUrl = normalizarUrlImagem(req, url);
  if (!resolvedUrl) return null;

  if (/^data:/i.test(resolvedUrl)) {
    return dataUriToBuffer(resolvedUrl);
  }

  try {
    const parsedUrl = new URL(resolvedUrl);
    if (parsedUrl.pathname.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, '../../', decodeURIComponent(parsedUrl.pathname.replace(/^\//, '')));
      if (fs.existsSync(localPath)) {
        return {
          mimeType: getMimeTypeByPath(localPath),
          buffer: fs.readFileSync(localPath)
        };
      }
    }

    if (typeof fetch === 'function') {
      const response = await fetch(resolvedUrl);
      if (!response.ok) return null;

      const contentType = response.headers.get('content-type') || getMimeTypeByPath(parsedUrl.pathname);
      const buffer = Buffer.from(await response.arrayBuffer());
      return { mimeType: contentType, buffer };
    }
  } catch (err) {
    console.warn('[gerarRelatorio] Não foi possível carregar imagem do relatório:', err.message);
  }

  return null;
}

async function compactarImagemParaRelatorio(req, url) {
  const resolvedUrl = normalizarUrlImagem(req, url);
  if (!resolvedUrl) return { url: '', buffer: null };

  const imageData = await obterImagemBuffer(req, url);
  if (!imageData || !imageData.buffer || imageData.mimeType.includes('svg')) {
    return { url: resolvedUrl, buffer: null };
  }

  // Sharp: nativo/libvips, ~50x mais rápido que Jimp para fotos de câmera (>3MB)
  if (sharp) {
    try {
      const compactedBuffer = await sharp(imageData.buffer)
        .rotate()
        .resize(FOTO_MAX_WIDTH, FOTO_MAX_HEIGHT, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: FOTO_JPEG_QUALITY })
        .toBuffer();
      const finalMeta = await sharp(compactedBuffer).metadata();
      return {
        url: `data:image/jpeg;base64,${compactedBuffer.toString('base64')}`,
        buffer: compactedBuffer,
        width: finalMeta.width || FOTO_MAX_WIDTH,
        height: finalMeta.height || FOTO_MAX_HEIGHT,
      };
    } catch (err) {
      console.warn('[gerarRelatorio] Sharp falhou, usando Jimp:', err.message);
    }
  }

  // Fallback: Jimp (puro JS, mais lento mas sempre disponível)
  try {
    const image = await Jimp.read(imageData.buffer);
    image.scaleToFit({ w: FOTO_MAX_WIDTH, h: FOTO_MAX_HEIGHT });
    const compactedBuffer = await image.getBuffer(JimpMime.jpeg, { quality: FOTO_JPEG_QUALITY });
    return {
      url: `data:image/jpeg;base64,${compactedBuffer.toString('base64')}`,
      buffer: compactedBuffer,
      width: image.bitmap.width,
      height: image.bitmap.height,
    };
  } catch (err) {
    console.warn('[gerarRelatorio] Não foi possível compactar imagem do relatório:', err.message);
    return { url: resolvedUrl, buffer: null };
  }
}

function limparHtml(texto) {
  return String(texto || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function criarTituloSecaoDocx(texto, options = {}) {
  return new Paragraph({
    keepNext: true,
    keepLines: true,
    pageBreakBefore: Boolean(options.pageBreakBefore),
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 90 },
    children: [
      new TextRun({
        text: texto.toUpperCase(),
        bold: true,
        color: DOCX_TEXT,
        size: 20,
        underline: { type: UnderlineType.SINGLE },
      }),
    ],
  });
}

function calcularDimensoesImagemDocx(foto, maxWidth = 185, maxHeight = 155) {
  const originalWidth = foto.imageWidth || maxWidth;
  const originalHeight = foto.imageHeight || maxHeight;
  let width = Math.min(maxWidth, originalWidth);
  let height = Math.max(1, Math.round(originalHeight * (width / originalWidth)));

  if (height > maxHeight) {
    height = maxHeight;
    width = Math.max(1, Math.round(originalWidth * (height / originalHeight)));
  }

  return { width, height };
}

function criarImagemDocx(foto, maxWidth = 185, maxHeight = 155) {
  if (!foto.imageBuffer) return null;

  const { width, height } = calcularDimensoesImagemDocx(foto, maxWidth, maxHeight);

  return new Paragraph({
    keepLines: true,
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 60 },
    children: [
      new ImageRun({
        type: 'jpg',
        data: foto.imageBuffer,
        transformation: { width, height },
      }),
    ],
  });
}

function criarParagrafoRotuloDocx(label, texto) {
  return new Paragraph({
    keepLines: true,
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 65, line: 235 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, color: DOCX_TEXT, size: 18 }),
      new TextRun({ text: texto, color: DOCX_TEXT, size: 18 }),
    ],
  });
}

function criarItemListaDocx(texto) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 55, line: 235 },
    children: [new TextRun({ text: texto, color: DOCX_TEXT, size: 18 })],
  });
}

function criarObservacaoDocx(observacao) {
  const paragraphOptions = {
    alignment: AlignmentType.JUSTIFIED,
    spacing: {
      after: observacao.criterio ? 25 : 52,
      line: 220,
    },
    children: [
      new TextRun({ text: `${observacao.prefixo} `, color: DOCX_TEXT, size: 17 }),
      new TextRun({ text: observacao.texto, color: DOCX_TEXT, size: 17 }),
    ],
  };

  if (observacao.criterio) {
    paragraphOptions.indent = { left: 180 };
  }

  return new Paragraph(paragraphOptions);
}

function criarTabelaDadosDocx(itens) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, color: DOCX_BORDER, size: 1 },
      bottom: { style: BorderStyle.SINGLE, color: DOCX_BORDER, size: 1 },
      left: { style: BorderStyle.SINGLE, color: DOCX_BORDER, size: 1 },
      right: { style: BorderStyle.SINGLE, color: DOCX_BORDER, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, color: DOCX_BORDER, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, color: DOCX_BORDER, size: 1 },
    },
    rows: itens.map((item) => (
      new TableRow({
        children: [
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: DOCX_BLUE_LIGHT, color: 'auto' },
            margins: { top: 55, bottom: 55, left: 80, right: 80 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                children: [new TextRun({ text: item.label.toUpperCase(), bold: true, color: DOCX_TEXT, size: 16 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 72, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 55, bottom: 55, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: String(item.valor || ''), color: DOCX_TEXT, size: 17 })],
              }),
            ],
          }),
        ],
      })
    )),
  });
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function criarGradeFotosDocx(fotos) {
  if (!fotos || fotos.length === 0) return [];

  return chunkArray(fotos, 3).map((linha) => {
    const cells = Array.from({ length: 3 }, (_, index) => {
      const foto = linha[index];
      const imagem = foto ? criarImagemDocx(foto) : null;
      return new TableCell({
        width: { size: 33, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 80, bottom: 80, left: 80, right: 80 },
        borders: {
          top: { style: BorderStyle.SINGLE, color: DOCX_BORDER, size: 1 },
          bottom: { style: BorderStyle.SINGLE, color: DOCX_BORDER, size: 1 },
          left: { style: BorderStyle.SINGLE, color: DOCX_BORDER, size: 1 },
          right: { style: BorderStyle.SINGLE, color: DOCX_BORDER, size: 1 },
        },
        children: imagem ? [imagem] : [new Paragraph({ text: '' })],
      });
    });

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: TableBorders.NONE,
      rows: [
        new TableRow({
          cantSplit: true,
          children: cells,
        }),
      ],
    });
  });
}

function criarBlocoFotoDocx(foto) {
  const imagem = criarImagemDocx(foto, 260, 210);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: TableBorders.NONE,
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            verticalAlign: VerticalAlign.TOP,
            borders: TableBorders.NONE,
            children: imagem ? [imagem] : [new Paragraph({ text: '' })],
          }),
        ],
      }),
    ],
  });
}

function criarBlocoComodoDocx(comodo) {
  const children = [
    new Paragraph({
      keepNext: true,
      keepLines: true,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 220, after: 100 },
      border: {
        left: { color: DOCX_ORANGE, space: 8, style: BorderStyle.SINGLE, size: 18 },
      },
      children: [
        new TextRun({
          text: `  ${comodo.nome || 'Cômodo'}`.toUpperCase(),
          bold: true,
          color: DOCX_TEXT,
          size: 24,
        }),
      ],
    }),
  ];

  for (const topico of comodo.topicos || []) {
    children.push(criarItemListaDocx(topico));
  }

  if (!comodo.topicos?.length && comodo.estado_geral) {
    children.push(criarParagrafoRotuloDocx('Estado geral', comodo.estado_geral));
  }

  if ((comodo.fotos || []).length > 0) {
    children.push(...criarGradeFotosDocx(comodo.fotos));
  }

  children.push(new Paragraph({ spacing: { after: 130 }, children: [new TextRun({ text: '' })] }));
  return children;
}

function criarParagrafoRodapeDocx(label, value) {
  if (!valorInformado(value)) return null;

  const children = [];
  if (label) {
    children.push(new TextRun({ text: `${label}: `, bold: true, color: DOCX_TEXT, size: 16 }));
  }
  children.push(new TextRun({ text: String(value), bold: true, color: DOCX_TEXT, size: 16 }));

  return new Paragraph({
    spacing: { after: 55 },
    children,
  });
}

function criarRodapeEmpresaDocx(data) {
  const contatos = joinNonEmpty([data.empresa_whatsapp, data.empresa_telefone], ' / ');
  const instagram = formatarInstagramRodape(data.empresa_instagram);
  const [faixaCor1, faixaCor2, faixaCor3] = obterCoresFaixaRodapeDocx(data);

  const leftChildren = [
    criarParagrafoRodapeDocx('', data.empresa_endereco),
    criarParagrafoRodapeDocx('', formatarSiteRodape(data.empresa_site)),
    criarParagrafoRodapeDocx('', data.empresa_email),
  ].filter(Boolean);

  const rightChildren = [
    criarParagrafoRodapeDocx('', contatos),
    instagram ? new Paragraph({
      spacing: { before: 90, after: 30 },
      children: [new TextRun({ text: 'Siga no Instagram:', bold: true, color: DOCX_TEXT, size: 16 })],
    }) : null,
    criarParagrafoRodapeDocx('', instagram),
  ].filter(Boolean);

  return [
    new Paragraph({
      border: {
        top: { color: DOCX_TEXT, space: 8, style: BorderStyle.SINGLE, size: 8 },
      },
      spacing: { before: 80, after: 60 },
      children: [new TextRun({ text: '' })],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: TableBorders.NONE,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 58, type: WidthType.PERCENTAGE },
              borders: TableBorders.NONE,
              margins: { top: 0, bottom: 0, left: 0, right: 120 },
              children: leftChildren.length ? leftChildren : [new Paragraph({ text: '' })],
            }),
            new TableCell({
              width: { size: 42, type: WidthType.PERCENTAGE },
              borders: TableBorders.NONE,
              margins: { top: 0, bottom: 0, left: 120, right: 0 },
              children: rightChildren.length ? rightChildren : [new Paragraph({ text: '' })],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ spacing: { before: 70, after: 0 }, children: [new TextRun({ text: '' })] }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: TableBorders.NONE,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 44, type: WidthType.PERCENTAGE },
              borders: TableBorders.NONE,
              shading: { type: ShadingType.CLEAR, fill: faixaCor1, color: 'auto' },
              children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: '' })] })],
            }),
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              borders: TableBorders.NONE,
              shading: { type: ShadingType.CLEAR, fill: faixaCor2, color: 'auto' },
              children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: '' })] })],
            }),
            new TableCell({
              width: { size: 21, type: WidthType.PERCENTAGE },
              borders: TableBorders.NONE,
              shading: { type: ShadingType.CLEAR, fill: faixaCor3, color: 'auto' },
              children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: '' })] })],
            }),
          ],
        }),
      ],
    }),
  ];
}

function calcularDimensoesLogoDocx(logo, maxWidth = 220, maxHeight = 82) {
  const width = Number(logo?.width);
  const height = Number(logo?.height);
  if (!width || !height) return { width: maxWidth, height: maxHeight };

  const ratio = width / height;
  let finalWidth = maxWidth;
  let finalHeight = Math.round(finalWidth / ratio);

  if (finalHeight > maxHeight) {
    finalHeight = maxHeight;
    finalWidth = Math.round(finalHeight * ratio);
  }

  return {
    width: Math.max(1, finalWidth),
    height: Math.max(1, finalHeight),
  };
}

function criarParagrafoTextoDocx(texto, options = {}) {
  return new Paragraph({
    pageBreakBefore: Boolean(options.pageBreakBefore),
    alignment: options.alignment || AlignmentType.JUSTIFIED,
    spacing: options.spacing || { after: 140, line: 235 },
    indent: options.indent,
    children: [
      new TextRun({
        text: texto,
        bold: Boolean(options.bold),
        italics: Boolean(options.italics),
        color: DOCX_TEXT,
        size: options.size || 18,
      }),
    ],
  });
}

function criarLinhaLeiDocx(item) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80, line: 220 },
    indent: { left: 1700, right: 1400 },
    children: [
      new TextRun({ text: item.prefixo, bold: true, italics: true, color: DOCX_TEXT, size: 18 }),
      new TextRun({ text: item.texto ? ` ${item.texto}` : '', italics: true, color: DOCX_TEXT, size: 18 }),
    ],
  });
}

function criarLinhaAssinaturaDocx(label, nome, documento, options = {}) {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: options.before || 640, after: 35 },
      children: [new TextRun({ text: '___________________________________________', color: DOCX_TEXT, size: 18 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 25 },
      children: [new TextRun({ text: label, bold: true, color: DOCX_TEXT, size: 18 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [new TextRun({ text: nome || '', bold: true, color: DOCX_TEXT, size: 18 })],
    }),
    documento ? new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [new TextRun({ text: documento, bold: true, color: DOCX_TEXT, size: 18 })],
    }) : null,
  ].filter(Boolean);
}

function criarConclusaoDocx(data) {
  const conclusao = montarDadosConclusao(data);
  const children = [
    criarTituloSecaoDocx('Conclusão', { pageBreakBefore: true }),
    ...conclusao.conclusao_textos.map((texto) => criarParagrafoTextoDocx(texto, {
      indent: { left: 520, right: 520 },
      spacing: { after: 145, line: 230 },
    })),
    new Paragraph({ spacing: { before: 560, after: 120 }, children: [new TextRun({ text: '' })] }),
    ...conclusao.dispositivo_lei.map(criarLinhaLeiDocx),
  ];

  return children;
}

function criarAssinaturasDocx(data) {
  const conclusao = montarDadosConclusao(data);
  return [
    criarParagrafoTextoDocx(conclusao.declaracao_assinatura_textos[0], {
      pageBreakBefore: true,
      indent: { left: 520, right: 520 },
      spacing: { before: 120, after: 160, line: 230 },
    }),
    criarParagrafoTextoDocx(conclusao.declaracao_assinatura_textos[1], {
      indent: { left: 520, right: 520 },
      spacing: { after: 520, line: 230 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: TableBorders.NONE,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: TableBorders.NONE,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 35 },
                  children: [new TextRun({ text: '______________________________', color: DOCX_TEXT, size: 18 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [new TextRun({ text: `VISTORIADOR: ${conclusao.vistoriador_nome}`, bold: true, color: DOCX_TEXT, size: 17 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [new TextRun({ text: documentoCpf(conclusao.vistoriador_cpf), bold: true, color: DOCX_TEXT, size: 17 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: TableBorders.NONE,
              verticalAlign: VerticalAlign.BOTTOM,
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { before: 220 },
                  children: [new TextRun({ text: conclusao.local_data_extenso, color: DOCX_TEXT, size: 17 })],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    ...criarLinhaAssinaturaDocx('LOCADOR(A):', conclusao.locador_assinatura_nome, conclusao.locador_assinatura_documento, { before: 660 }),
    ...criarLinhaAssinaturaDocx('LOCATÁRIO(A):', conclusao.locatario_assinatura_nome, conclusao.locatario_assinatura_documento, { before: 700 }),
    new Paragraph({ spacing: { before: 760, after: 80 }, children: [new TextRun({ text: '' })] }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: TableBorders.NONE,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: TableBorders.NONE,
              children: [
                new Paragraph({ children: [new TextRun({ text: 'Testemunha 1', color: DOCX_TEXT, size: 16 })] }),
                new Paragraph({ children: [new TextRun({ text: 'CPF:', color: DOCX_TEXT, size: 16 })] }),
                new Paragraph({ children: [new TextRun({ text: 'Nome:', color: DOCX_TEXT, size: 16 })] }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: TableBorders.NONE,
              children: [
                new Paragraph({ children: [new TextRun({ text: 'Testemunha 2', color: DOCX_TEXT, size: 16 })] }),
                new Paragraph({ children: [new TextRun({ text: 'CPF:', color: DOCX_TEXT, size: 16 })] }),
                new Paragraph({ children: [new TextRun({ text: 'Nome:', color: DOCX_TEXT, size: 16 })] }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];
}

async function criarDocxBuffer(data, logoImageData = null) {
  const children = [];
  const logo = logoImageData;

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 30 },
      children: [
        new TextRun({
          text: 'LAUDO DE VISTORIA: LOCAÇÃO DE IMÓVEL RESIDENCIAL',
          bold: true,
          color: DOCX_TEXT,
          size: 22,
          underline: { type: UnderlineType.SINGLE },
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 130 },
      children: [
        new TextRun({
          text: `ANEXO AO CONTRATO DE LOCAÇÃO Nº ${data.numero_contrato || ''}`,
          bold: true,
          color: DOCX_TEXT,
          size: 19,
        }),
      ],
    })
  );

  for (const bloco of data.abertura_blocos || []) {
    children.push(criarParagrafoRotuloDocx(bloco.label, bloco.texto));
  }

  if ((data.dados_imovel || []).length) {
    children.push(criarTituloSecaoDocx('Dados do imóvel'));
    children.push(criarTabelaDadosDocx(data.dados_imovel));
  }

  children.push(criarTituloSecaoDocx('Observações sobre a vistoria e seu entendimento'));
  for (const observacao of data.observacoes_padrao || []) {
    children.push(criarObservacaoDocx(observacao));
  }

  if ((data.comodos || []).length > 0) {
    children.push(criarTituloSecaoDocx('Descrição dos ambientes', { pageBreakBefore: true }));

    for (const comodo of data.comodos || []) {
      children.push(...criarBlocoComodoDocx(comodo));
    }
  }

  if ((data.fotos_sem_comodo || []).length > 0) {
    children.push(criarTituloSecaoDocx('Fotos sem cômodo vinculado'));
    for (const foto of data.fotos_sem_comodo || []) {
      children.push(criarBlocoFotoDocx(foto));
      children.push(new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: '' })] }));
    }
  }

  children.push(...criarConclusaoDocx(data));
  children.push(...criarAssinaturasDocx(data));

  const document = new Document({
    creator: 'VistoriaPro',
    title: 'Laudo de Vistoria',
    sections: [{
      properties: {
        page: {
          margin: {
            top: 900,
            right: 900,
            bottom: 1120,
            left: 900,
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { after: 100 },
              children: logo
                ? [new ImageRun({
                    type: logo.type,
                    data: logo.buffer,
                    transformation: calcularDimensoesLogoDocx(logo),
                  })]
                : [new TextRun({ text: data.empresa_nome || 'Empresa', bold: true, size: 30 })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: criarRodapeEmpresaDocx(data),
        }),
      },
      children,
    }],
  });

  return Packer.toBuffer(document);
}

async function salvarArquivoRelatorio(req, nomeArquivo, buffer, contentType) {
  if (supabase) {
    const { error: uploadError } = await supabase.storage
      .from('relatorios')
      .upload(nomeArquivo, buffer, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      throw new Error('Erro ao salvar relatório no Supabase Storage: ' + uploadError.message);
    }

    const { data: publicUrlData } = supabase
      .storage
      .from('relatorios')
      .getPublicUrl(nomeArquivo);

    return publicUrlData.publicUrl;
  }

  fs.mkdirSync(relatoriosDir, { recursive: true });
  const localPath = path.join(relatoriosDir, nomeArquivo);
  fs.writeFileSync(localPath, buffer);
  return `${req.protocol}://${req.get('host')}/uploads/relatorios/${nomeArquivo}`;
}

async function carregarImagemCompactada(req, url) {
  return compactarImagemParaRelatorio(req, url);
}

const vistoriaModel = require('../models/vistoriaModel');
const imovelModel = require('../models/imovelModel');
const empresaModel = require('../models/empresaModel');

const fotoModel = require('../models/fotoModel');
const comodoVistoriaModel = require('../models/comodoVistoriaModel');
const locatarioVistoriaListModel = require('../models/locatarioVistoriaListModel');
const transcricaoModel = require('../models/transcricaoModel');
const usuarioModel = require('../models/usuarioModel');

/**
 * Remove Buffers e strings gigantes (logo base64) antes de persistir em JSONB.
 * Sem isso, o INSERT em relatorios.dados_adicionais estoura limite ou falha na serialização.
 */
function sanitizarDadosAdicionaisParaBanco(data) {
  try {
    return JSON.parse(
      JSON.stringify(data, (key, value) => {
        if (Buffer.isBuffer(value)) return undefined;
        if (key === 'logo_data_uri' && typeof value === 'string' && value.length > 4000) {
          return `[base64 omitido: ${value.length} caracteres]`;
        }
        return value;
      }),
    );
  } catch (err) {
    console.warn('[gerarRelatorio] Falha ao sanitizar dados_adicionais:', err.message);
    return {
      erro_serializacao: err.message,
      data_geracao: data?.data_geracao,
      numero_contrato: data?.numero_contrato,
    };
  }
}

module.exports = {
  async gerarRelatorio(req, res) {
    try {
      const { vistoria_id, formato = 'pdf' } = req.body;
      if (!vistoria_id) {
        return res.status(400).json({ error: 'vistoria_id é obrigatório.' });
      }

      if (!['pdf', 'word'].includes(formato)) {
        return res.status(400).json({ error: 'Formato inválido. Use pdf ou word.' });
      }

      // Busca dados da vistoria
      const vistoria = await vistoriaModel.buscarPorId(vistoria_id, req.usuario.empresa_id);
      if (!vistoria) return res.status(404).json({ error: 'Vistoria não encontrada.' });

      // Busca imóvel, empresa e dados da vistoria em paralelo (reduz round-trips ao banco)
      const [imovel, empresa, fotos, transcricoes, comodos, locatariosRaw, vistoriador] = await Promise.all([
        imovelModel.buscarPorId(vistoria.imovel_id || vistoria.imovel || vistoria.imovelId, vistoria.empresa_id),
        empresaModel.buscarPorId(vistoria.empresa_id),
        fotoModel.listarPorVistoria(vistoria_id, req.usuario.empresa_id),
        transcricaoModel.listarPorVistoria(vistoria_id, req.usuario.empresa_id),
        comodoVistoriaModel.listarPorVistoria(vistoria_id, req.usuario.empresa_id),
        locatarioVistoriaListModel.listarPorVistoria(vistoria_id, req.usuario.empresa_id),
        usuarioModel.buscarPorId(vistoria.usuario_id || req.usuario.id),
      ]);

      // Logo com cache por empresa (evita reprocessar Jimp a cada geração)
      const { dataUri: logoDataUri, imageData: logoImageData, faixaRodapeCores } = await getEmpresaLogoReportDataCached(req, empresa);

      // Garante que todos os campos dos locatários sejam string (evita null no template)
      let locatarios = locatariosRaw.map(l => ({
        id: l.id,
        vistoria_id: l.vistoria_id,
        nome: l.nome || '',
        nacionalidade: l.nacionalidade || '',
        profissao: l.profissao || '',
        cpf: l.cpf || '',
        rg: l.rg || '',
        rg_orgao: l.rg_orgao || '',
        rg_uf: l.rg_uf || '',
        endereco: l.endereco || ''
      }));

      // Mapeia transcrições por foto_id
      const transcricaoPorFoto = {};
      transcricoes.forEach(t => {
        if (t.foto_id) transcricaoPorFoto[String(t.foto_id)] = t.texto;
      });

      // Compacta fotos com Sharp (nativo, ~50x mais rápido que Jimp) — concorrência limitada a 6
      const fotosPorComodo = {};
      const fotosEnriquecidas = await mapComConcorrencia(
        fotos,
        async (f) => {
          const descricao = transcricaoPorFoto[String(f.id)] || f.descricao;
          const imagemCompactada = await carregarImagemCompactada(req, f.url);
          return { f, descricao, imagemCompactada };
        },
        6,
      );
      for (const { f, descricao, imagemCompactada } of fotosEnriquecidas) {
        const key = f.comodo_id ? String(f.comodo_id) : (f.comodo_nome || 'outros');
        if (!fotosPorComodo[key]) fotosPorComodo[key] = [];
        fotosPorComodo[key].push({
          url: imagemCompactada.url,
          imageBuffer: imagemCompactada.buffer,
          imageWidth: imagemCompactada.width,
          imageHeight: imagemCompactada.height,
          descricao,
        });
      }


      // Monta array de cômodos com fotos e tópicos técnicos para o laudo
      const comodosCompletos = comodos.map((c, index) => {
        const fotosDoComodo = Array.isArray(fotosPorComodo[String(c.id)])
          ? fotosPorComodo[String(c.id)]
          : (fotosPorComodo[c.nome] || []);
        const descricaoComodo = c.descricao && c.descricao.trim() !== '' && c.descricao !== 'Cômodo vistoriado via app'
          ? c.descricao
          : '';
        const topicos = extrairTopicos(
          descricaoComodo,
          ...fotosDoComodo.map((foto) => foto.descricao)
        );

        return {
          indice: index + 1,
          nome: c.nome,
          estado_geral: c.estado_geral || '',
          descricao: descricaoComodo,
          topicos,
          tem_topicos: topicos.length > 0,
          fotos: fotosDoComodo,
          tem_fotos: fotosDoComodo.length > 0,
        };
      }).filter((comodo) => comodo.tem_topicos || comodo.tem_fotos);

      // Fotos sem cômodo (caso existam)
      const fotosSemComodo = fotosPorComodo['outros'] || [];


      // Monta dados para o template
      const data = {
        numero_contrato: vistoria.numero_contrato || '',
        objeto: vistoria.objeto || '',
        data_vistoria: vistoria.data_vistoria || vistoria.data || '',
        data: vistoria.data || '',
        tipo_vistoria: vistoria.tipo_vistoria || 'Entrada',
        tipo_imovel: formatarTipoImovelRelatorio(imovel?.tipo || ''),
        imovel_endereco: imovel?.endereco_completo || vistoria.endereco || '',
        imovel_cidade: imovel?.cidade || '',
        imovel_uf: imovel?.uf || '',
        imovel_matricula: imovel?.imovel_matricula || imovel?.matricula || '',
        imovel_cartorio: imovel?.imovel_cartorio || imovel?.cartorio || '',
        proprietario_nome: imovel?.proprietario_nome || '',
        proprietario_nacionalidade: imovel?.proprietario_nacionalidade || '',
        proprietario_profissao: imovel?.proprietario_profissao || '',
        proprietario_cpf: imovel?.proprietario_cpf || '',
        proprietario_rg: imovel?.proprietario_rg || '',
        proprietario_rg_orgao: imovel?.proprietario_rg_orgao || '',
        proprietario_rg_uf: imovel?.proprietario_rg_uf || '',
        proprietario_endereco: imovel?.proprietario_endereco || '',
        administradora_nome: imovel?.administradora_nome || '',
        administradora_cnpj: imovel?.administradora_cnpj || '',
        administradora_endereco: imovel?.administradora_endereco || '',
        socio_nome: imovel?.socio_nome || '',
        socio_cpf: imovel?.socio_cpf || '',
        socio_profissao: imovel?.socio_profissao || '',
        representante_tipo: imovel?.representante_tipo || '',
        observacoes_gerais: vistoria.observacoes_gerais || '',
        empresa_nome: empresa?.nome || 'VistoriaPro',
        empresa_cnpj: empresa?.cnpj || '',
        empresa_email: empresa?.email || '',
        empresa_telefone: empresa?.telefone || '',
        empresa_whatsapp: empresa?.whatsapp || '',
        empresa_endereco: empresa?.endereco || '',
        empresa_site: empresa?.site || '',
        empresa_instagram: empresa?.instagram || '',
        empresa_responsavel_nome: empresa?.responsavel_nome || '',
        empresa_creci: empresa?.creci || '',
        vistoriador_nome: vistoriador?.nome || '',
        vistoriador_cpf: vistoriador?.cpf || '',
        vistoriador_email: vistoriador?.email || '',
        locatarios: locatarios,
        comodos: comodosCompletos,
        fotos_sem_comodo: fotosSemComodo,
        data_geracao: new Date().toLocaleDateString('pt-BR'),
        logo_data_uri: logoDataUri,
        faixa_rodape_cores: faixaRodapeCores,
      };

      data.abertura_blocos = montarAberturaBlocos(data);
      data.dados_imovel = montarDadosImovel(data);
      data.observacoes_padrao = montarObservacoesPadrao(data);
      Object.assign(data, montarDadosConclusao(data));
      data.tem_dados_imovel = data.dados_imovel.length > 0;
      data.tem_comodos = data.comodos.length > 0;
      data.tem_fotos_sem_comodo = data.fotos_sem_comodo.length > 0;
      data.texto_abertura = data.abertura_blocos
        .map((bloco) => `${bloco.label}: ${bloco.texto}`)
        .join('\n\n');

      // Renderização do template com Mustache
      const templatePath = path.join(__dirname, '../templates/relatorio.html');
      const htmlBase = fs.readFileSync(templatePath, 'utf8');
      const html = mustache.render(htmlBase, data);

      let buffer;
      let contentType;
      let extensao;

      if (formato === 'word') {
        buffer = await criarDocxBuffer(data, logoImageData);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        extensao = 'docx';
      } else {
        // Geração do PDF: reutiliza o mesmo Chrome entre laudos (fecha só a aba)
        const browser = await obtainPdfBrowser();
        const page = await browser.newPage();
        try {
          await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 300_000 });
          await page.emulateMediaType('print');
          buffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: montarHeaderTemplatePdf(data),
            footerTemplate: montarFooterTemplatePdf(data),
            margin: {
              top: '112px',
              bottom: '182px',
              left: '16mm',
              right: '16mm'
            }
          });
        } finally {
          await page.close().catch(() => {});
        }
        contentType = 'application/pdf';
        extensao = 'pdf';
      }

      const nomeArquivo = `relatorio_vistoria_${vistoria_id}_${Date.now()}.${extensao}`;
      const fileUrl = await salvarArquivoRelatorio(req, nomeArquivo, buffer, contentType);

      // Salva no banco
      const relatorio = await relatorioModel.gerar({
        vistoria_id,
        url_arquivo: nomeArquivo,
        dados_adicionais: sanitizarDadosAdicionaisParaBanco(data),
      });
      res.status(201).json({ message: 'Relatório gerado', relatorio, url: fileUrl, formato });
    } catch (err) {
      console.error('[gerarRelatorio] Erro ao gerar relatório:', err);
      res.status(500).json({ error: err.message });
    }
  },
  async listarRelatoriosPorVistoria(req, res) {
    try {
      const vistoriaId = req.query.vistoria_id || req.params.vistoria_id || req.params.vistoriaId;
      if (!vistoriaId) {
        return res.status(400).json({ error: 'vistoria_id é obrigatório.' });
      }
      const relatorios = await relatorioModel.listarPorVistoria(vistoriaId, req.usuario.empresa_id);
      res.json(relatorios);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async buscarRelatorioPorId(req, res) {
    try {
      const relatorio = await relatorioModel.buscarPorId(req.params.id, req.usuario.empresa_id);
      if (!relatorio) return res.status(404).json({ error: 'Relatório não encontrado' });
      res.json(relatorio);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async deletarRelatorio(req, res) {
    try {
      const deletado = await relatorioModel.deletar(req.params.id, req.usuario.empresa_id);
      if (!deletado) return res.status(404).json({ error: 'Relatório não encontrado' });
      res.json({ message: 'Relatório deletado' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async downloadRelatorio(req, res) {
    try {
      const relatorio = await relatorioModel.buscarPorId(req.params.id, req.usuario.empresa_id);
      if (!relatorio || !relatorio.url_arquivo) {
        return res.status(404).json({ error: 'Relatório não encontrado.' });
      }

      if (supabase) {
        const { data: publicUrlData } = supabase
          .storage
          .from('relatorios')
          .getPublicUrl(relatorio.url_arquivo);
        const pdfUrl = publicUrlData.publicUrl;
        if (!pdfUrl) {
          return res.status(404).json({ error: 'Arquivo do relatório não encontrado no storage.' });
        }
        return res.redirect(pdfUrl);
      }

      const localPath = path.join(relatoriosDir, relatorio.url_arquivo);
      if (!fs.existsSync(localPath)) {
        return res.status(404).json({ error: 'Arquivo do relatório não encontrado no armazenamento local.' });
      }

      return res.download(localPath);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async listarRelatorios(req, res) {
    try {
      const relatorios = await relatorioModel.listarTodos(req.usuario.empresa_id);
      res.json(relatorios);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  closeSharedPdfBrowser,
};
