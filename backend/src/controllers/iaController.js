const aiDescriptionService = require('../services/aiDescriptionService');

module.exports = {
  async descreverFoto(req, res) {
    try {
      const { imagem, imagens, comodo_nome, instrucoes } = req.body;
      const resultado = await aiDescriptionService.descreverFoto({
        imageDataUrl: imagem,
        imageDataUrls: imagens,
        comodoNome: comodo_nome,
        instrucoes,
        scopeKey: req.usuario?.empresa_id || req.usuario?.id
      });

      res.json(resultado);
    } catch (err) {
      const status = err.statusCode || 500;
      res.status(status).json({
        error: err.message || 'Erro ao descrever foto com IA.'
      });
    }
  }
};
