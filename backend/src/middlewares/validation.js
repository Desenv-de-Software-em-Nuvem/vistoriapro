/**
 * Middleware de Validação
 * 
 * Fornece decoradores e middlewares para validação automática
 */

const { Validator, ValidationError } = require('../services/validatorService');

/**
 * Middleware para validar corpo da requisição
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      // Sanitizar entrada
      req.body = Validator.sanitizeObject(req.body);

      // Validar schema
      Validator.validateObject(req.body, schema);

      next();
    } catch (error) {
      if (error.statusCode === 400) {
        return res.status(400).json({
          error: 'Validação falhou',
          details: error.errors,
        });
      }

      next(error);
    }
  };
};

/**
 * Middleware para validar query parameters
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      Validator.validateObject(req.query, schema);
      next();
    } catch (error) {
      if (error.statusCode === 400) {
        return res.status(400).json({
          error: 'Query parameters inválidos',
          details: error.errors,
        });
      }

      next(error);
    }
  };
};

/**
 * Schemas de validação predefinidos
 */
const ValidationSchemas = {
  // Autenticação
  LOGIN: {
    email: {
      required: true,
      validator: (v) => Validator.validateEmail(v),
    },
    senha: {
      required: true,
      validator: (v) => Validator.validatePassword(v),
    },
  },

  // Cadastro de usuário
  CREATE_USER: {
    nome: {
      required: true,
      validator: (v) => Validator.validateString(v, 'nome', 2, 255),
    },
    email: {
      required: true,
      validator: (v) => Validator.validateEmail(v),
    },
    senha: {
      required: true,
      validator: (v) => Validator.validatePassword(v),
    },
    papel: {
      required: true,
      validator: (v) => {
        const validRoles = ['admin', 'vistoriador', 'locatario'];
        if (!validRoles.includes(v)) {
          throw new ValidationError('papel', 'Papel inválido');
        }
      },
    },
  },

  // Cadastro de empresa
  CREATE_EMPRESA: {
    nome: {
      required: true,
      validator: (v) => Validator.validateString(v, 'nome', 2, 255),
    },
    cnpj: {
      required: true,
      validator: (v) => Validator.validateCNPJ(v),
    },
    email: {
      required: false,
      validator: (v) => v && Validator.validateEmail(v),
    },
  },

  // Cadastro de imóvel
  CREATE_IMOVEL: {
    endereco: {
      required: true,
      validator: (v) => Validator.validateString(v, 'endereco', 5, 500),
    },
    tipo: {
      required: true,
      validator: (v) => {
        const validTypes = ['apartamento', 'casa', 'comercial', 'terreno', 'outro'];
        if (!validTypes.includes(v)) {
          throw new ValidationError('tipo', 'Tipo de imóvel inválido');
        }
      },
    },
  },

  // Criar vistoria
  CREATE_VISTORIA: {
    imovel_id: {
      required: true,
      validator: (v) => Validator.validateInteger(v, 'imovel_id'),
    },
    data: {
      required: true,
      validator: (v) => Validator.validateDate(v, 'data'),
    },
  },

  // Paginação
  PAGINATION: {
    page: {
      required: false,
      validator: (v) => {
        if (v) {
          const page = parseInt(v);
          if (isNaN(page) || page < 1) {
            throw new ValidationError('page', 'Página deve ser um número positivo');
          }
        }
      },
    },
    limit: {
      required: false,
      validator: (v) => {
        if (v) {
          const limit = parseInt(v);
          if (isNaN(limit) || limit < 1 || limit > 100) {
            throw new ValidationError('limit', 'Limite deve estar entre 1 e 100');
          }
        }
      },
    },
  },
};

module.exports = {
  validateBody,
  validateQuery,
  ValidationSchemas,
  Validator,
  ValidationError,
};
