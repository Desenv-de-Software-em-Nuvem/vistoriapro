const aiDescriptionService = require('../services/aiDescriptionService');

module.exports = {
  async descreverFoto(req, res) {
    try {
      const { imagem, comodo_nome } = req.body;
      const resultado = await aiDescriptionService.descreverFoto({
        imageDataUrl: imagem,
        comodoNome: comodo_nome
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
