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

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

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
      const vistoria = await vistoriaModel.buscarPorId(vistoria_id);
      if (!vistoria) return res.status(404).json({ error: 'Vistoria não encontrada.' });

      // Busca imóvel relacionado
      const imovel = await imovelModel.buscarPorId(vistoria.imovel_id || vistoria.imovel || vistoria.imovelId, vistoria.empresa_id);



      // Busca fotos
      const fotos = await fotoModel.listarPorVistoria(vistoria_id);
      // Busca transcrições
      const transcricoes = await transcricaoModel.listarPorVistoria(vistoria_id);
      // Busca cômodos
      const comodos = await comodoVistoriaModel.listarPorVistoria(vistoria_id);
      // Busca locatários detalhados
      let locatarios = await locatarioVistoriaListModel.listarPorVistoria(vistoria_id);
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
      fotos.forEach(f => {
        const key = f.comodo_id ? String(f.comodo_id) : (f.comodo_nome || 'outros');
        if (!fotosPorComodo[key]) fotosPorComodo[key] = [];
        // Usa a transcrição como descrição, se existir
        const descricao = transcricaoPorFoto[String(f.id)] || f.descricao;
        fotosPorComodo[key].push({ url: f.url, descricao });
      });


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
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(html);
      const nomeArquivo = `relatorio_vistoria_${vistoria_id}_${Date.now()}.pdf`;
      const pdfBuffer = await page.pdf({
        format: 'A4',
        displayHeaderFooter: true,
        headerTemplate: `
          <div style='width:100%; text-align:left; padding-left:0; margin-left:0;'>
            <img src='data:image/svg+xml;utf8,<svg width="600" height="200" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(50, 50)"><rect x="0" y="30" width="15" height="40" fill="%23ff6b35"/><rect x="15" y="20" width="15" height="50" fill="%23ff4500"/><rect x="30" y="35" width="15" height="35" fill="%23ff8c42"/></g><text x="120" y="90" font-family="Arial, sans-serif" font-size="96" font-weight="900" fill="%23000000">Imob</text><text x="120" y="110" font-family="Arial, sans-serif" font-size="24" font-weight="500" fill="%23000000" letter-spacing="2px">EMPREENDIMENTOS</text></svg>' style='height:110px; width:auto; margin-top:0;' />
          </div>
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

      // Salva no Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('relatorios')
        .upload(nomeArquivo, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });
        if (uploadError) {
          throw new Error('Erro ao salvar PDF no Supabase Storage: ' + uploadError.message);
        }

      // Pega a URL pública
      const { data: publicUrlData } = supabase
        .storage
        .from('relatorios')
        .getPublicUrl(nomeArquivo);
      const pdfUrl = publicUrlData.publicUrl;

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
      const vistoriaId = req.query.vistoria_id || req.params.vistoria_id;
      if (!vistoriaId) {
        return res.status(400).json({ error: 'vistoria_id é obrigatório.' });
      }
      const relatorios = await relatorioModel.listarPorVistoria(vistoriaId);
      res.json(relatorios);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async buscarRelatorioPorId(req, res) {
    try {
      const relatorio = await relatorioModel.buscarPorId(req.params.id);
      if (!relatorio) return res.status(404).json({ error: 'Relatório não encontrado' });
      res.json(relatorio);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async deletarRelatorio(req, res) {
    try {
      await relatorioModel.deletar(req.params.id);
      res.json({ message: 'Relatório deletado' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async listarRelatorios(req, res) {
    try {
      const relatorios = await relatorioModel.listarTodos();
      res.json(relatorios);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async downloadRelatorio(req, res) {
    try {
      const relatorio = await relatorioModel.buscarPorId(req.params.id);
      if (!relatorio || !relatorio.url_arquivo) {
        return res.status(404).json({ error: 'Relatório não encontrado.' });
      }
      // Busca a URL pública do Supabase Storage
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
      const { data: publicUrlData } = supabase
        .storage
        .from('relatorios')
        .getPublicUrl(relatorio.url_arquivo);
      const pdfUrl = publicUrlData.publicUrl;
      if (!pdfUrl) {
        return res.status(404).json({ error: 'Arquivo do relatório não encontrado no storage.' });
      }
      // Redireciona para a URL pública do PDF
      return res.redirect(pdfUrl);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
