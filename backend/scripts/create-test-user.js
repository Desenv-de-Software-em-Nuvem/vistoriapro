// Script para criar usuário de teste
// Uso: node scripts/create-test-user.js

import { AppDataSource } from '../src/data-source.js';
import { PasswordService } from '../src/services/passwordService.js';

async function createTestUser() {
  try {
    await AppDataSource.initialize();
    console.log('Conectado ao banco de dados!');

    // Primeiro, verificar se já existe uma empresa
    const empresaRepository = AppDataSource.getRepository('Empresa');
    let empresa = await empresaRepository.findOne({ where: {} });

    if (!empresa) {
      // Criar empresa de teste
      empresa = await empresaRepository.save({
        nome: 'Empresa Teste',
        cnpj: '12345678000199',
        email: 'empresa@teste.com',
        telefone: '(11) 99999-9999',
        endereco: 'Rua Teste, 123'
      });
      console.log('Empresa de teste criada com ID:', empresa.id);
    } else {
      console.log('Empresa existente encontrada com ID:', empresa.id);
    }

    // Verificar se usuário já existe
    const usuarioRepository = AppDataSource.getRepository('Usuario');
    let testUser = await usuarioRepository.findOne({ where: { email: 'admin@example.com' } });

    // Gerar hash da senha
    const hashedPassword = await PasswordService.hash('admin123');

    if (testUser) {
      // Atualizar usuário existente
      testUser.senha_hash = hashedPassword;
      testUser.papel = 'admin';
      testUser.empresa = empresa;
      await usuarioRepository.save(testUser);
      console.log('Usuário de teste atualizado com sucesso!');
    } else {
      // Criar novo usuário
      testUser = await usuarioRepository.save({
        nome: 'Administrador',
        email: 'admin@example.com',
        senha_hash: hashedPassword,
        papel: 'admin',
        empresa: empresa
      });
      console.log('Usuário de teste criado com sucesso!');
    }

    console.log('Email: admin@example.com');
    console.log('Senha: admin123');
    console.log('Papel: admin');

  } catch (err) {
    console.error('Erro ao criar usuário de teste:', err.message);
  } finally {
    await AppDataSource.destroy();
  }
}

createTestUser();
