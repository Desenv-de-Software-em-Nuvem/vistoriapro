function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET é obrigatório em produção.');
  }

  return secret || 'vistoriapro_secret';
}

module.exports = {
  getJwtSecret,
};
