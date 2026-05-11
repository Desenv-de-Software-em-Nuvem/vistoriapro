// Função para gerar o texto de abertura do laudo
function gerarTextoAbertura(data) {
  // LOCADOR(A)
  const locador = `${data.proprietario_nome?.toUpperCase() || ''}, ${data.proprietario_nacionalidade || ''}, ${data.proprietario_profissao || ''}, INSCRITA NO CPF SOB N° ${data.proprietario_cpf || ''}, PORTADORA DA IDENTIDADE RG N° ${data.proprietario_rg || ''}${data.proprietario_rg_orgao ? ' ' + data.proprietario_rg_orgao : ''}${data.proprietario_rg_uf ? ' ' + data.proprietario_rg_uf : ''}, RESIDENTE E DOMICILIADO NA ${data.proprietario_endereco || ''}.`;

  // ADMINISTRADORA
  const administradora = data.administradora_nome
    ? `NESTE ATO SENDO REPRESENTADO POR MEIO DE PROCURAÇÃO PARTICULAR E CONTRATO DE ADMINISTRAÇÃO PELA<br><b>${data.administradora_nome?.toUpperCase()}</b>, PESSOA JURÍDICA DE DIREITO PRIVADO, INSCRITA NO CNPJ: ${data.administradora_cnpj || ''} LOCALIZADA NA ${data.administradora_endereco || ''}, QUE TEM COMO SÓCIO PROPRIETÁRIO, ${data.socio_nome || ''}, ${data.socio_profissao || ''}, INSCRITO NO CPF: ${data.socio_cpf || ''}.`
    : '';

  // LOCATÁRIOS
  const locatarios = (data.locatarios || []).map(l => {
    return `<b>${l.nome?.toUpperCase() || ''}</b>, ${l.nacionalidade || ''}, ${l.profissao || ''}, PORTADORA DA CÉDULA DE IDENTIDADE EMITIDA PELA ${l.rg_orgao || ''}${l.rg_uf ? '/' + l.rg_uf : ''}, INSCRITA NO CPF SOB O Nº ${l.cpf || ''}, RESIDENTE E DOMICILIADA NA ${l.endereco || ''}.`;
  }).map((txt, idx) => `LOCATÁRIO(A): ${txt}`).join('<br>');

  // OBJETO
  const objeto = `O PRESENTE INSTRUMENTO TEM COMO OBJETO O IMÓVEL DE PROPRIEDADE DO LOCADOR, ${data.objeto || ''}, LOCALIZADO NA ${data.imovel_endereco || ''}, INSCRITO SOB A MATRÍCULA Nº ${data.imovel_matricula || ''} NO CARTÓRIO DE REGISTRO DE IMÓVEIS ${data.imovel_cartorio || ''}.`;

  return `<b>LAUDO DE VISTORIA: LOCAÇÃO DE IMÓVEL RESIDENCIAL</b><br>
<b>ANEXO AO CONTRATO DE LOCAÇÃO N° ${data.numero_contrato || ''}</b><br>
LOCADOR(A): LOCADOR: ${locador}<br>${administradora ? administradora + '<br>' : ''}${locatarios}<br>OBJETO: ${objeto}`;
}
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
const DOCX_BLUE_LIGHT = 'E3EAFC';
const DOCX_TEXT = '222222';
const DOCX_MUTED = '555555';
const logoCandidates = [
  path.join(__dirname, '../../public/VistoriaPro.png'),
  path.join(process.cwd(), 'public/VistoriaPro.png'),
  path.join(__dirname, '../../../frontend/public/VistoriaPro.png')
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

function chunkBase64(value) {
  return value.match(/.{1,76}/g)?.join('\r\n') || value;
}

function criarWordBuffer(html) {
  const boundary = `----=_VistoriaPro_${Date.now()}`;
  const imagens = [];
  const htmlComCid = html.replace(/src="data:([^;"]+);base64,([^"]+)"/g, (_, mimeType, base64Data) => {
    const id = `image${String(imagens.length + 1).padStart(3, '0')}@vistoriapro`;
    const extension = mimeType.includes('png') ? 'png' : mimeType.includes('gif') ? 'gif' : 'jpg';
    const fileName = `image${String(imagens.length + 1).padStart(3, '0')}.${extension}`;
    imagens.push({
      id,
      mimeType,
      fileName,
      base64Data: base64Data.replace(/\s/g, '')
    });
    return `src="${fileName}"`;
  });

  const parts = [
    'MIME-Version: 1.0',
    `Content-Type: multipart/related; boundary="${boundary}"; type="text/html"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="utf-8"',
    'Content-Transfer-Encoding: base64',
    'Content-Location: file:///laudo-vistoria.html',
    '',
    chunkBase64(Buffer.from(htmlComCid, 'utf8').toString('base64')),
  ];

  for (const imagem of imagens) {
    parts.push(
      '',
      `--${boundary}`,
      `Content-Type: ${imagem.mimeType}`,
      'Content-Transfer-Encoding: base64',
      `Content-ID: <${imagem.id}>`,
      `Content-Location: ${imagem.fileName}`,
      '',
      chunkBase64(imagem.base64Data)
    );
  }

  parts.push('', `--${boundary}--`, '');

  return Buffer.from(parts.join('\r\n'), 'utf8');
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

function criarTituloSecaoDocx(texto) {
  return new Paragraph({
    keepNext: true,
    keepLines: true,
    spacing: { before: 260, after: 160 },
    shading: {
      type: ShadingType.CLEAR,
      fill: DOCX_BLUE_LIGHT,
      color: 'auto',
    },
    border: {
      left: {
        color: DOCX_ORANGE,
        space: 8,
        style: BorderStyle.SINGLE,
        size: 24,
      },
    },
    children: [
      new TextRun({
        text: `  ${texto}`,
        bold: true,
        color: DOCX_ORANGE,
        size: 24,
      }),
    ],
  });
}

function criarImagemDocx(foto, keepNext = false) {
  if (!foto.imageBuffer) return null;

  const maxWidth = 330;
  const originalWidth = foto.imageWidth || maxWidth;
  const originalHeight = foto.imageHeight || 260;
  const width = Math.min(maxWidth, originalWidth);
  const height = Math.max(1, Math.round(originalHeight * (width / originalWidth)));

  return new Paragraph({
    keepNext,
    keepLines: true,
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 100 },
    children: [
      new ImageRun({
        type: 'jpg',
        data: foto.imageBuffer,
        transformation: { width, height },
      }),
    ],
  });
}

function criarDescricaoFotoDocx(foto) {
  if (!foto.descricao) return null;

  return new Paragraph({
    keepLines: true,
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 140, line: 280 },
    children: [
      new TextRun({ text: 'Descrição: ', bold: true, color: DOCX_TEXT, size: 20 }),
      new TextRun({ text: limparHtml(foto.descricao), color: DOCX_MUTED, size: 20 }),
    ],
  });
}

function criarBlocoFotoDocx(foto) {
  const children = [];
  const imageParagraph = criarImagemDocx(foto, Boolean(foto.descricao));
  if (imageParagraph) {
    children.push(imageParagraph);
  }

  const descriptionParagraph = criarDescricaoFotoDocx(foto);
  if (descriptionParagraph) {
    children.push(descriptionParagraph);
  }

  if (children.length === 0) {
    children.push(new Paragraph({ text: '' }));
  }

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
            children,
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
      spacing: { before: 180, after: 120 },
      children: [
        new TextRun({
          text: comodo.nome || 'Cômodo',
          bold: true,
          color: DOCX_TEXT,
          size: 24,
        }),
      ],
    }),
  ];

  for (const foto of comodo.fotos || []) {
    const imageParagraph = criarImagemDocx(foto, Boolean(foto.descricao));
    if (imageParagraph) {
      children.push(imageParagraph);
    }

    const descriptionParagraph = criarDescricaoFotoDocx(foto);
    if (descriptionParagraph) {
      children.push(descriptionParagraph);
    }
  }

  if (comodo.descricao) {
    children.push(new Paragraph({
      keepLines: true,
      spacing: { after: 180, line: 280 },
      children: [
        new TextRun({ text: 'Observações: ', bold: true, color: DOCX_TEXT, size: 20 }),
        new TextRun({ text: limparHtml(comodo.descricao), color: DOCX_MUTED, size: 20 }),
      ],
    }));
  }

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
            children,
          }),
        ],
      }),
    ],
  });
}

async function criarDocxBuffer(data) {
  const children = [];

  const logo = getLogoImageData();
  if (logo) {
    children.push(new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 240 },
      children: [
        new ImageRun({
          type: logo.type,
          data: logo.buffer,
          transformation: { width: 260, height: 78 },
        }),
      ],
    }));
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: 'LAUDO DE VISTORIA: LOCAÇÃO DE IMÓVEL RESIDENCIAL',
          bold: true,
          color: DOCX_TEXT,
          size: 28,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 280 },
      children: [
        new TextRun({
          text: `ANEXO AO CONTRATO DE LOCAÇÃO N° ${data.numero_contrato || ''}`,
          bold: true,
          color: DOCX_TEXT,
          size: 22,
        }),
      ],
    })
  );

  const abertura = limparHtml(data.texto_abertura);
  if (abertura) {
    for (const bloco of abertura.split('\n').filter(Boolean)) {
      children.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 140, line: 300 },
        children: [new TextRun({ text: bloco, color: DOCX_TEXT, size: 22 })],
      }));
    }
  }

  children.push(criarTituloSecaoDocx('Checklist de Cômodos'));

  for (const comodo of data.comodos || []) {
    children.push(criarBlocoComodoDocx(comodo));
    children.push(new Paragraph({ spacing: { after: 180 }, children: [new TextRun({ text: '' })] }));
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
            top: 1440,
            right: 1080,
            bottom: 1080,
            left: 1080,
          },
        },
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


      // Monta array de cômodos com fotos (id como string) e sempre força array
      const comodosCompletos = comodos.map(c => ({
        nome: c.nome,
        descricao: c.descricao && c.descricao.trim() !== '' && c.descricao !== 'Cômodo vistoriado via app' ? c.descricao : '',
        fotos: Array.isArray(fotosPorComodo[String(c.id)]) ? fotosPorComodo[String(c.id)] : (fotosPorComodo[c.nome] || [])
      }));

      // Fotos sem cômodo (caso existam)
      const fotosSemComodo = fotosPorComodo['outros'] || [];


      // Monta dados para o template
      const data = {
        numero_contrato: vistoria.numero_contrato || '',
        objeto: vistoria.objeto || '',
        data_vistoria: vistoria.data_vistoria || vistoria.data || '',
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
        locatarios: locatarios,
        comodos: comodosCompletos,
        fotos_sem_comodo: fotosSemComodo,
        data_geracao: new Date().toLocaleDateString('pt-BR'),
        logo_data_uri: getLogoDataUri(),
      };

      // Gera o texto de abertura formatado
      data.texto_abertura = gerarTextoAbertura(data);

      // Renderização do template com Mustache
      const templatePath = path.join(__dirname, '../templates/relatorio.html');
      const htmlBase = fs.readFileSync(templatePath, 'utf8');
      const htmlFinalDebug = mustache.render(htmlBase, data);
      console.log('======= HTML FINAL GERADO PARA O PDF =======\n', htmlFinalDebug);
      // Log para debug
      console.log('[gerarRelatorio] Dados enviados para o template:', data);

      const html = htmlFinalDebug;

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
          displayHeaderFooter: true,
          headerTemplate: `
            <div style='width:100%; padding:0; margin:0; height:12px; font-size:1px; line-height:1px;'></div>
          `,
          footerTemplate: `
            <div style='width:100%; text-align:center; font-size:12px; color:#888; padding:8px 0;'>
              <span class='pageNumber'></span><span class='totalPages'></span>
              <script>
                if (this.pageNumber == this.totalPages) {
                  document.write('Gerado por VistoriaPro - ${new Date().toLocaleDateString('pt-BR')}');
                }
              </script>
            </div>
          `,
          margin: {
            top: '110px', // aumenta o topo para evitar sobreposição nas páginas seguintes
            bottom: '30px',
            left: '18mm',
            right: '18mm'
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
