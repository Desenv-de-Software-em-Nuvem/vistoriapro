/**
 * Middleware de Logging para Express
 * 
 * Registra todas as requisições HTTP com:
 * - Método e URL
 * - Status code
 * - Tempo de resposta
 * - IP do cliente
 * - ID de rastreamento
 */

const { Logger } = require('../services/loggerService');

const logger = new Logger({
  logDir: process.env.LOG_DIR || './logs',
  filename: 'requests.log',
  enableConsole: true,
  enableFile: true,
});

/**
 * Middleware de logging de requisições
 */
const loggingMiddleware = (req, res, next) => {
  // Gerar ID único para rastreamento
  const requestId = req.id || req.headers['x-request-id'] || logger.generateRequestId();
  req.id = requestId;

  // Capture tempo inicial
  const startTime = Date.now();

  // Interceptar response.end
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;
    logger.logRequest(req, res, duration);
    originalEnd.apply(res, args);
  };

  next();
};

/**
 * Middleware de tratamento de erros com logging
 */
const errorLoggingMiddleware = (err, req, res, next) => {
  const requestId = req.id;
  const meta = {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: logger.getClientIp(req),
    userId: req.user?.id,
  };

  logger.error(`Request Error: ${err.message}`, meta, requestId);

  // Passar para o próximo middleware de erro
  next(err);
};

/**
 * Middleware para log de sucesso
 */
const successLogger = (message, level = 'info') => {
  return (req, res, next) => {
    const requestId = req.id;
    const meta = {
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id,
    };
    
    logger[level](message, meta, requestId);
    next();
  };
};

module.exports = {
  logger,
  loggingMiddleware,
  errorLoggingMiddleware,
  successLogger,
};
