/**
 * Testes para validação de dados
 */

// Funções utilitárias de validação
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return false;
  }
  return true;
};

const validatePhone = (phone) => {
  if (!phone) return false;
  const re = /^\(?([0-9]{2})\)?\s?([0-9]{4,5})\-?([0-9]{4})$/;
  return re.test(phone);
};

const validateCPF = (cpf) => {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;

  return true;
};

const validateCNPJ = (cnpj) => {
  cnpj = cnpj.replace(/\D/g, '');
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  let digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
};

describe('Validação de Dados', () => {
  describe('validateEmail', () => {
    it('deve validar um email correto', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('deve rejeitar emails inválidos', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('invalid.example.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('deve validar uma senha com no mínimo 8 caracteres', () => {
      expect(validatePassword('password123')).toBe(true);
      expect(validatePassword('12345678')).toBe(true);
    });

    it('deve rejeitar senhas com menos de 8 caracteres', () => {
      expect(validatePassword('pass')).toBe(false);
      expect(validatePassword('1234567')).toBe(false);
      expect(validatePassword('')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('deve validar telefones válidos', () => {
      expect(validatePhone('(11) 9999-9999')).toBe(true);
      expect(validatePhone('(85) 98888-8888')).toBe(true);
    });

    it('deve rejeitar telefones inválidos', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('invalid')).toBe(false);
    });
  });

  describe('validateCPF', () => {
    it('deve validar CPFs válidos', () => {
      expect(validateCPF('11144477735')).toBe(true);
    });

    it('deve rejeitar CPFs inválidos', () => {
      expect(validateCPF('00000000000')).toBe(false);
      expect(validateCPF('invalid')).toBe(false);
    });
  });

  describe('validateCNPJ', () => {
    it('deve validar CNPJs válidos', () => {
      expect(validateCNPJ('11222333000181')).toBe(true);
    });

    it('deve rejeitar CNPJs inválidos', () => {
      expect(validateCNPJ('00000000000000')).toBe(false);
      expect(validateCNPJ('invalid')).toBe(false);
    });
  });
});

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validateCPF,
  validateCNPJ,
};
