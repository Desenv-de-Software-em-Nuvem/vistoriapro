import { AppDataSource } from '../data-source.js';
import Usuario from '../entities/Usuario.js';
import { PasswordService } from '../services/passwordService.js';

const repository = () => AppDataSource.getRepository(Usuario);

export const UsuarioRepository = {
  findAll: () => repository().find(),
  findById: (id) => repository().findOneBy({ id }),
  findByEmail: (email) => repository().findOneBy({ email }),
  
  create: async (data) => {
    // Criptografa a senha antes de salvar
    if (data.senha_hash) {
      data.senha_hash = await PasswordService.hash(data.senha_hash);
    }
    return repository().save(data);
  },
  
  update: async (id, data) => {
    // Criptografa a senha se estiver sendo atualizada
    if (data.senha_hash) {
      data.senha_hash = await PasswordService.hash(data.senha_hash);
    }
    await repository().update(id, data);
    return repository().findOneBy({ id });
  },
  
  delete: (id) => repository().delete(id),
  
  /**
   * Valida as credenciais do usuário
   * @param {string} email - Email do usuário
   * @param {string} password - Senha em texto plano
   * @returns {Promise<object|null>} Objeto do usuário se validado, null caso contrário
   */
  validateCredentials: async (email, password) => {
    const usuario = await repository().findOneBy({ email });
    
    if (!usuario) {
      return null;
    }
    
    const isPasswordValid = await PasswordService.compare(password, usuario.senha_hash);
    
    return isPasswordValid ? usuario : null;
  },
};
