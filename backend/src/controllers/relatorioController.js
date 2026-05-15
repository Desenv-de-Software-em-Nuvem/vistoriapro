const relatorioModel = require('../models/relatorioModel');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const mustache = require('mustache');
const { Jimp, JimpMime } = require('jimp');
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  PageNumber,
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

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_API_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const relatoriosDir = path.join(__dirname, '../../uploads/relatorios');
const FOTO_MAX_WIDTH = 720;
const FOTO_MAX_HEIGHT = 720;
const FOTO_JPEG_QUALITY = 38;
const DOCX_ORANGE = 'FF6933';
const DOCX_BLUE_LIGHT = 'F5E7E1';
const DOCX_TEXT = '222222';
const DOCX_MUTED = '555555';
const DOCX_BORDER = 'D8D8D8';
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

function primeiraMaiuscula(value) {
  const text = valorInformado(value);
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
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
    data.objeto || data.tipo_imovel ? `O imóvel objeto da presente locação é ${data.objeto || primeiraMaiuscula(data.tipo_imovel)}` : '',
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
    { label: 'Tipo de imóvel', valor: data.tipo_imovel },
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
    ? `<img src="${data.logo_data_uri}" style="height:42px; max-width:170px; object-fit:contain; object-position:left center;" />`
    : `<div style="font-size:17px; font-weight:700; color:#222;">${escapeHtml(data.empresa_nome || 'VistoriaPro')}</div>`;

  return `
    <div style="width:100%; height:62px; box-sizing:border-box; padding:10px 16mm 0 16mm; font-family:Arial, sans-serif;">
      ${logo}
    </div>
  `;
}

function montarFooterTemplatePdf(data) {
  const contato = joinNonEmpty([
    data.empresa_endereco,
    data.empresa_email,
    data.empresa_telefone
  ], ' • ');

  return `
    <div style="width:100%; box-sizing:border-box; padding:0 16mm 6px 16mm; font-family:Arial, sans-serif; color:#242424;">
      <div style="border-top:1px solid #222; padding-top:4px; display:flex; justify-content:space-between; gap:10px; align-items:flex-end; font-size:7px; line-height:1.2;">
        <div style="max-width:68%; white-space:normal;">${escapeHtml(contato || data.empresa_nome || 'VistoriaPro')}</div>
        <div style="text-align:right; white-space:nowrap;">Gerado em ${escapeHtml(data.data_geracao)} · Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>
      </div>
      <div style="height:5px; margin:5px -16mm 0 -16mm; background:linear-gradient(90deg,#ff6933 0%,#ff6933 45%,#cf5d49 45%,#cf5d49 78%,#d98983 78%,#d98983 100%);"></div>
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

  try {
    const image = await Jimp.read(imageData.buffer);
    image.scaleToFit({ w: FOTO_MAX_WIDTH, h: FOTO_MAX_HEIGHT });
    const compactedBuffer = await image.getBuffer(JimpMime.jpeg, { quality: FOTO_JPEG_QUALITY });
    return {
      url: `data:image/jpeg;base64,${compactedBuffer.toString('base64')}`,
      buffer: compactedBuffer,
      width: image.bitmap.width,
      height: image.bitmap.height
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

async function criarDocxBuffer(data) {
  const children = [];
  const logo = getLogoImageData();

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

  const document = new Document({
    creator: 'VistoriaPro',
    title: 'Laudo de Vistoria',
    sections: [{
      properties: {
        page: {
          margin: {
            top: 900,
            right: 900,
            bottom: 720,
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
                    transformation: { width: 135, height: 66 },
                  })]
                : [new TextRun({ text: data.empresa_nome || 'VistoriaPro', bold: true, size: 24 })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: {
                top: { color: DOCX_TEXT, space: 8, style: BorderStyle.SINGLE, size: 8 },
              },
              spacing: { before: 80 },
              children: [
                new TextRun({ text: `${data.empresa_nome || 'VistoriaPro'} · Gerado em ${data.data_geracao} · Página `, size: 14, color: DOCX_MUTED }),
                new TextRun({ children: [PageNumber.CURRENT], size: 14, color: DOCX_MUTED }),
                new TextRun({ text: ' de ', size: 14, color: DOCX_MUTED }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: DOCX_MUTED }),
              ],
            }),
          ],
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

      // Busca imóvel relacionado
      const imovel = await imovelModel.buscarPorId(vistoria.imovel_id || vistoria.imovel || vistoria.imovelId, vistoria.empresa_id);

      // Busca dados da empresa para cabeçalho e rodapé do laudo
      const empresa = await empresaModel.buscarPorId(req.usuario.empresa_id);

      // Busca fotos
      const fotos = await fotoModel.listarPorVistoria(vistoria_id, req.usuario.empresa_id);
      // Busca transcrições
      const transcricoes = await transcricaoModel.listarPorVistoria(vistoria_id, req.usuario.empresa_id);
      // Busca cômodos
      const comodos = await comodoVistoriaModel.listarPorVistoria(vistoria_id, req.usuario.empresa_id);
      // Busca locatários detalhados
      let locatarios = await locatarioVistoriaListModel.listarPorVistoria(vistoria_id, req.usuario.empresa_id);
      // Garante que todos os campos dos locatários sejam string (evita null no template)
      locatarios = locatarios.map(l => ({
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

      // Agrupa fotos por cômodo (garantindo tipo string para id)
      const fotosPorComodo = {};
      for (const f of fotos) {
        const key = f.comodo_id ? String(f.comodo_id) : (f.comodo_nome || 'outros');
        if (!fotosPorComodo[key]) fotosPorComodo[key] = [];
        // Usa a transcrição como descrição, se existir
        const descricao = transcricaoPorFoto[String(f.id)] || f.descricao;
        const imagemCompactada = await carregarImagemCompactada(req, f.url);
        fotosPorComodo[key].push({
          url: imagemCompactada.url,
          imageBuffer: imagemCompactada.buffer,
          imageWidth: imagemCompactada.width,
          imageHeight: imagemCompactada.height,
          descricao
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
        tipo_imovel: imovel?.tipo || '',
        imovel_endereco: imovel?.endereco_completo || vistoria.endereco || '',
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
        empresa_endereco: empresa?.endereco || '',
        locatarios: locatarios,
        comodos: comodosCompletos,
        fotos_sem_comodo: fotosSemComodo,
        data_geracao: new Date().toLocaleDateString('pt-BR'),
        logo_data_uri: getLogoDataUri(),
      };

      data.abertura_blocos = montarAberturaBlocos(data);
      data.dados_imovel = montarDadosImovel(data);
      data.observacoes_padrao = montarObservacoesPadrao(data);
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
        buffer = await criarDocxBuffer(data);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        extensao = 'docx';
      } else {
        // Geração do PDF
        const browser = await puppeteer.launch({
          headless: 'new',
          executablePath: findChromeExecutable(),
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.emulateMediaType('print');
        await page.evaluate(async () => {
          await Promise.all(Array.from(document.images).map((img) => {
            if (img.complete && img.naturalWidth > 0) return Promise.resolve();
            if (typeof img.decode === 'function') {
              return img.decode().catch(() => undefined);
            }
            return new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          }));
        });
        buffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: montarHeaderTemplatePdf(data),
          footerTemplate: montarFooterTemplatePdf(data),
          margin: {
            top: '68px',
            bottom: '56px',
            left: '16mm',
            right: '16mm'
          }
        });
        await browser.close();
        contentType = 'application/pdf';
        extensao = 'pdf';
      }

      const nomeArquivo = `relatorio_vistoria_${vistoria_id}_${Date.now()}.${extensao}`;
      const fileUrl = await salvarArquivoRelatorio(req, nomeArquivo, buffer, contentType);

      // Salva no banco
      const relatorio = await relatorioModel.gerar({ vistoria_id, url_arquivo: nomeArquivo, dados_adicionais: data });
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
};
