import jwt from 'jsonwebtoken';

// Chave secreta para JWT (em produção, usar variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'vistoriapro-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Middleware para verificar token JWT
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Token de acesso não fornecido',
      message: 'Use: Authorization: Bearer <token>'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expirado',
          message: 'Faça login novamente'
        });
      }
      return res.status(403).json({
        error: 'Token inválido',
        message: 'Token malformado ou inválido'
      });
    }

    // Adiciona informações do usuário na requisição
    req.user = user;
    next();
  });
};

/**
 * Middleware para verificar se o usuário tem um papel específico
 */
export const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const userRole = req.user.papel;
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: `Esta operação requer um dos seguintes papéis: ${roles.join(', ')}`,
        userRole: userRole
      });
    }

    next();
  };
};

/**
 * Gera um token JWT para o usuário
 */
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    nome: user.nome,
    email: user.email,
    papel: user.papel,
    empresa_id: user.empresa_id
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Middleware opcional - permite acesso se autenticado, mas não bloqueia se não estiver
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }

  next();
};
