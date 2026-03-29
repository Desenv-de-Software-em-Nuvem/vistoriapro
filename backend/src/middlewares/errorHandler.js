export default function errorHandler(err, req, res, next) {
  // Log detalhado localmente/CI (não enviar stack ao cliente)
  console.error(err);

  const status = err.status && Number.isInteger(err.status) ? err.status : 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Erro interno no servidor'
    : err.message || 'Erro interno no servidor';

  res.status(status).json({ error: message });
}
