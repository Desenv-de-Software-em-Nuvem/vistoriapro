import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const PasswordService = {
  /**
   * Gera um hash seguro da senha
   * @param {string} password - Senha em texto plano
   * @returns {Promise<string>} Hash da senha
   */
  hash: async (password) => {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  /**
   * Compara uma senha em texto plano com um hash
   * @param {string} password - Senha em texto plano
   * @param {string} hash - Hash armazenado no banco
   * @returns {Promise<boolean>} True se a senha corresponder, false caso contrário
   */
  compare: async (password, hash) => {
    return bcrypt.compare(password, hash);
  },
};
