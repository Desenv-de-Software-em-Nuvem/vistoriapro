/**
 * Serviço de Logging
 * 
 * Implementa um sistema robusto de logging com suporte a:
 * - Diferentes níveis de severidade (ERROR, WARN, INFO, DEBUG)
 * - Formatação estruturada
 * - Rastreamento de requisições
 * - Arquivo de logs
 */

const fs = require('fs');
const path = require('path');

// Níveis de log
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

// Cores para console (apenas em desenvolvimento)
const COLORS = {
  ERROR: '\x1b[31m',    // Vermelho
  WARN: '\x1b[33m',     // Amarelo
  INFO: '\x1b[36m',     // Cyan
  DEBUG: '\x1b[35m',    // Magenta
  RESET: '\x1b[0m',
};

class Logger {
  constructor(options = {}) {
    this.logDir = options.logDir || path.join(__dirname, '../../logs');
    this.filename = options.filename || 'app.log';
    this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 10;
    this.level = options.level || LOG_LEVELS.INFO;
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    this.enableRequestId = options.enableRequestId !== false;

    // Criar diretório de logs
    if (this.enableFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    this.requestIdMap = new Map();
  }

  /**
   * Formata a mensagem de log
   */
  formatMessage(level, message, meta = {}, requestId = null) {
    const timestamp = new Date().toISOString();
    const requestIdStr = requestId && this.enableRequestId ? ` [${requestId}]` : '';
    
    const logObject = {
      timestamp,
      level,
      message,
      requestId,
      ...meta,
    };

    return {
      formatted: `${timestamp} [${level}]${requestIdStr} ${message}`,
      json: JSON.stringify(logObject),
      object: logObject,
    };
  }

  /**
   * Log de erro
   */
  error(message, meta = {}, requestId = null) {
    this.log(LOG_LEVELS.ERROR, message, meta, requestId);
  }

  /**
   * Log de aviso
   */
  warn(message, meta = {}, requestId = null) {
    this.log(LOG_LEVELS.WARN, message, meta, requestId);
  }

  /**
   * Log de informação
   */
  info(message, meta = {}, requestId = null) {
    this.log(LOG_LEVELS.INFO, message, meta, requestId);
  }

  /**
   * Log de debug
   */
  debug(message, meta = {}, requestId = null) {
    this.log(LOG_LEVELS.DEBUG, message, meta, requestId);
  }

  /**
   * Log de requisição HTTP
   */
  logRequest(req, res, duration) {
    const requestId = req.id || req.headers['x-request-id'] || this.generateRequestId();
    const statusCode = res.statusCode;
    const level = statusCode >= 400 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;

    const meta = {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      duration: `${duration}ms`,
      ip: this.getClientIp(req),
      userAgent: req.headers['user-agent'],
      userId: req.user?.id,
    };

    const message = `${req.method} ${req.originalUrl} - ${statusCode}`;
    this.log(level, message, meta, requestId);
  }

  /**
   * Log principal
   */
  log(level, message, meta = {}, requestId = null) {
    const { formatted, json } = this.formatMessage(level, message, meta, requestId);

    // Console
    if (this.enableConsole) {
      const color = COLORS[level] || '';
      console.log(`${color}${formatted}${COLORS.RESET}`);
    }

    // Arquivo
    if (this.enableFile) {
      this.writeToFile(json);
    }
  }

  /**
   * Escreve no arquivo de log
   */
  writeToFile(message) {
    try {
      const logFilePath = path.join(this.logDir, this.filename);
      const stats = fs.existsSync(logFilePath) ? fs.statSync(logFilePath) : null;

      // Rotaciona arquivo se ultrapassou tamanho máximo
      if (stats && stats.size > this.maxSize) {
        this.rotateLogFile(logFilePath);
      }

      fs.appendFileSync(logFilePath, message + '\n');
    } catch (error) {
      console.error('Erro ao escrever em arquivo de log:', error);
    }
  }

  /**
   * Rotaciona arquivo de log
   */
  rotateLogFile(logFilePath) {
    const dir = path.dirname(logFilePath);
    const ext = path.extname(this.filename);
    const name = path.basename(this.filename, ext);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedPath = path.join(dir, `${name}.${timestamp}${ext}`);

    try {
      fs.renameSync(logFilePath, rotatedPath);

      // Limpar arquivos antigos
      const files = fs.readdirSync(dir)
        .filter(f => f.startsWith(name))
        .sort()
        .reverse();

      if (files.length > this.maxFiles) {
        for (let i = this.maxFiles; i < files.length; i++) {
          fs.unlinkSync(path.join(dir, files[i]));
        }
      }
    } catch (error) {
      console.error('Erro ao rotacionar arquivo de log:', error);
    }
  }

  /**
   * Gera um ID único para requisição
   */
  generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtém IP do cliente
   */
  getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           req.connection.socket?.remoteAddress ||
           'unknown';
  }
}

module.exports = { Logger, LOG_LEVELS };
