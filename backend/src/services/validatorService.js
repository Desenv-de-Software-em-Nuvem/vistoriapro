/**
 * Serviço de Validação de Dados
 * 
 * Implementa validações robustas para:
 * - Email
 * - Telefone
 * - CPF/CNPJ
 * - Senha
 * - Campos de texto
 * - Datas
 * - URLs
 */

class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.field = field;
    this.statusCode = 400;
  }
}

class Validator {
  /**
   * Valida email
   */
  static validateEmail(email) {
    if (!email) {
      throw new ValidationError('email', 'Email é obrigatório');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).toLowerCase())) {
      throw new ValidationError('email', 'Email inválido');
    }

    return true;
  }

  /**
   * Valida senha
   */
  static validatePassword(password) {
    if (!password || password.length < 8) {
      return false;
    }

    // Opcional: validar complexidade
    if (process.env.STRICT_PASSWORD_VALIDATION === 'true') {
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);

      if (!hasUppercase || !hasLowercase || !hasNumbers) {
        return false;
      }
    }

    return true;
  }

  /**
   * Valida telefone brasileiro
   */
  static validatePhone(phone) {
    if (!phone) {
      return false;
    }

    const phoneRegex = /^\(?([0-9]{2})\)?\s?([0-9]{4,5})\-?([0-9]{4})$/;
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return false;
    }

    return phoneRegex.test(phone) || /^\d{10,11}$/.test(cleanPhone);
  }

  /**
   * Valida CPF
   */
  static validateCPF(cpf) {
    if (!cpf) {
      throw new ValidationError('cpf', 'CPF é obrigatório');
    }

    const cleanCPF = cpf.replace(/\D/g, '');

    if (cleanCPF.length !== 11) {
      throw new ValidationError('cpf', 'CPF deve conter 11 dígitos');
    }

    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      throw new ValidationError('cpf', 'CPF inválido');
    }

    // Validar primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }

    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) {
      throw new ValidationError('cpf', 'CPF inválido');
    }

    // Validar segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) {
      throw new ValidationError('cpf', 'CPF inválido');
    }

    return true;
  }

  /**
   * Valida CNPJ
   */
  static validateCNPJ(cnpj) {
    if (!cnpj) {
      throw new ValidationError('cnpj', 'CNPJ é obrigatório');
    }

    const cleanCNPJ = cnpj.replace(/\D/g, '');

    if (cleanCNPJ.length !== 14) {
      throw new ValidationError('cnpj', 'CNPJ deve conter 14 dígitos');
    }

    if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
      throw new ValidationError('cnpj', 'CNPJ inválido');
    }

    // Validar primeiro dígito verificador
    let size = cleanCNPJ.length - 2;
    let numbers = cleanCNPJ.substring(0, size);
    let digits = cleanCNPJ.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += numbers.charAt(size - i) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) {
      throw new ValidationError('cnpj', 'CNPJ inválido');
    }

    // Validar segundo dígito verificador
    size = size + 1;
    numbers = cleanCNPJ.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += numbers.charAt(size - i) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) {
      throw new ValidationError('cnpj', 'CNPJ inválido');
    }

    return true;
  }

  /**
   * Valida string requerida
   */
  static validateString(value, fieldName, minLength = 1, maxLength = null) {
    if (!value) {
      throw new ValidationError(fieldName, `${fieldName} é obrigatório`);
    }

    if (typeof value !== 'string') {
      throw new ValidationError(fieldName, `${fieldName} deve ser texto`);
    }

    if (value.trim().length < minLength) {
      throw new ValidationError(
        fieldName,
        `${fieldName} deve ter no mínimo ${minLength} caractere(s)`
      );
    }

    if (maxLength && value.length > maxLength) {
      throw new ValidationError(
        fieldName,
        `${fieldName} não pode ter mais de ${maxLength} caracteres`
      );
    }

    return true;
  }

  /**
   * Valida número inteiro
   */
  static validateInteger(value, fieldName) {
    if (value === null || value === undefined) {
      throw new ValidationError(fieldName, `${fieldName} é obrigatório`);
    }

    const num = parseInt(value);
    if (isNaN(num)) {
      throw new ValidationError(fieldName, `${fieldName} deve ser um número`);
    }

    if (num <= 0) {
      throw new ValidationError(fieldName, `${fieldName} deve ser um número positivo`);
    }

    return true;
  }

  /**
   * Valida data
   */
  static validateDate(dateString, fieldName) {
    if (!dateString) {
      throw new ValidationError(fieldName, `${fieldName} é obrigatório`);
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new ValidationError(fieldName, `${fieldName} deve ser uma data válida`);
    }

    return true;
  }

  /**
   * Valida URL
   */
  static validateURL(url, fieldName) {
    if (!url) {
      throw new ValidationError(fieldName, `${fieldName} é obrigatório`);
    }

    try {
      new URL(url);
      return true;
    } catch {
      throw new ValidationError(fieldName, `${fieldName} deve ser uma URL válida`);
    }
  }

  /**
   * Valida um objeto contra um schema
   */
  static validateObject(data, schema) {
    const errors = [];

    for (const [field, rule] of Object.entries(schema)) {
      try {
        const value = data[field];
        
        // Verificar obrigatoriedade
        if (rule.required && (value === null || value === undefined)) {
          throw new ValidationError(field, rule.message || `${field} é obrigatório`);
        }

        // Aplicar validador customizado
        if (rule.validator && value !== null && value !== undefined) {
          rule.validator(value);
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          errors.push({
            field: error.field,
            message: error.message,
          });
        } else {
          errors.push({
            field,
            message: error.message,
          });
        }
      }
    }

    if (errors.length > 0) {
      const error = new Error('Validação falhou');
      error.statusCode = 400;
      error.errors = errors;
      throw error;
    }

    return true;
  }

  /**
   * Sanitiza uma string removendo caracteres perigosos
   */
  static sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    return str
      .replace(/[<>]/g, '') // Remove < e >
      .trim();
  }

  /**
   * Sanitiza um objeto inteiro
   */
  static sanitizeObject(obj) {
    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

module.exports = { Validator, ValidationError };
