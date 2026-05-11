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
const FOTO_MAX_WIDTH = 900;
const FOTO_MAX_HEIGHT = 900;
const FOTO_JPEG_QUALITY = 42;
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

async function carregarImagemCompactada(req, url) {
  const resolvedUrl = normalizarUrlImagem(req, url);
  if (!resolvedUrl) return '';

  return resolvedUrl;
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
      const { vistoria_id } = req.body;
      if (!vistoria_id) {
        return res.status(400).json({ error: 'vistoria_id é obrigatório.' });
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
        const urlCompacta = await carregarImagemCompactada(req, f.url);
        fotosPorComodo[key].push({ url: urlCompacta, descricao });
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
        objeto: imovel?.objeto || '',
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

      // Geração do PDF
      const html = htmlFinalDebug;
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
      const nomeArquivo = `relatorio_vistoria_${vistoria_id}_${Date.now()}.pdf`;
      const pdfBuffer = await page.pdf({
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

      let pdfUrl;
      if (supabase) {
        // Salva no Supabase Storage quando configurado
        const { error: uploadError } = await supabase.storage
          .from('relatorios')
          .upload(nomeArquivo, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
          });
        if (uploadError) {
          throw new Error('Erro ao salvar PDF no Supabase Storage: ' + uploadError.message);
        }

        const { data: publicUrlData } = supabase
          .storage
          .from('relatorios')
          .getPublicUrl(nomeArquivo);
        pdfUrl = publicUrlData.publicUrl;
      } else {
        fs.mkdirSync(relatoriosDir, { recursive: true });
        const localPath = path.join(relatoriosDir, nomeArquivo);
        fs.writeFileSync(localPath, pdfBuffer);
        pdfUrl = `${req.protocol}://${req.get('host')}/uploads/relatorios/${nomeArquivo}`;
      }

      // Salva no banco
      const relatorio = await relatorioModel.gerar({ vistoria_id, url_arquivo: nomeArquivo, dados_adicionais: data });
      res.status(201).json({ message: 'Relatório gerado', relatorio, url: pdfUrl });
    } catch (err) {
      console.error('[gerarRelatorio] Erro ao gerar PDF:', err);
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
