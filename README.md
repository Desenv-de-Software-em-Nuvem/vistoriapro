# VistoriaPro Unifor

Sistema de vistorias imobiliárias com API REST backend.

## 📋 Visão Geral

O VistoriaPro é uma aplicação para gestão de vistorias imobiliárias, permitindo que empresas realizem inspeções estruturais, documentem cômodos, façam upload de fotos e gerem laudos técnicos.

## 🏗️ Arquitetura

- **Backend:** Node.js + Express + TypeORM
- **Banco:** PostgreSQL
- **Autenticação:** JWT com controle de acesso por papéis
- **Documentação:** Swagger UI
- **Containerização:** Docker

## 🚀 Funcionalidades

### ✅ Implementadas
- 🔐 **Autenticação JWT** - Sistema completo de login e controle de acesso
- 🔒 **Criptografia de Senhas** - Hash bcrypt para segurança
- 📚 **Documentação Swagger** - API documentada interativamente
- 🗄️ **Banco PostgreSQL** - Persistência com TypeORM
- 🔄 **Migrations** - Controle de versão do banco
- 👥 **Controle de Acesso** - Papéis: Admin, Vistoriador, Cliente

### 📋 Recursos Disponíveis
- **Usuários** - Gestão de usuários do sistema
- **Empresas** - Cadastro de empresas imobiliárias
- **Imóveis** - Controle de propriedades
- **Vistorias** - Inspeções e laudos técnicos
- **Cômodos** - Detalhamento por ambiente
- **Fotos** - Upload e organização de imagens
- **Transcrições** - Documentação textual
- **Locatários** - Gestão de inquilinos

## 🛠️ Instalação e Execução

### Pré-requisitos
- Docker e Docker Compose
- Node.js 18+ (opcional, para desenvolvimento)
- PostgreSQL 12+ (opcional, para desenvolvimento)

### Com Docker (Recomendado)
```bash
# Clonar repositório
git clone <repository-url>
cd vistoriaprounifor

# Construir e executar
docker-compose up --build

# API disponível em: http://localhost:3000
# Documentação: http://localhost:3000/api/docs/
```

### Desenvolvimento Local
```bash
# Backend
cd backend
npm install
npm run db:recreate
npm run db:create-test-user
npm start
```

## 🔐 Autenticação

### Usuário de Teste
- **Email:** `admin@example.com`
- **Senha:** `admin123`
- **Papel:** Admin

### Login via API
```bash
curl -X POST http://localhost:3000/api/usuarios/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Usar Token
```bash
curl -H "Authorization: Bearer SEU_TOKEN_JWT" \
  http://localhost:3000/api/usuarios
```

## 📁 Estrutura do Projeto

```
vistoriaprounifor/
├── backend/              # API Node.js
│   ├── src/
│   │   ├── controllers/  # Lógica dos endpoints
│   │   ├── entities/     # Modelos TypeORM
│   │   ├── middlewares/  # Autenticação JWT
│   │   ├── repositories/ # Camada de dados
│   │   ├── routes/       # Definição das rotas
│   │   └── services/     # Serviços auxiliares
│   ├── migrations/       # Scripts SQL
│   └── scripts/          # Utilitários
├── docker-compose.yml    # Orquestração
├── Dockerfile           # Containerização
└── README.md
```

## 🔑 Papéis e Permissões

- **Admin**: Acesso total ao sistema
- **Vistoriador**: Leitura e algumas operações específicas
- **Cliente**: Acesso limitado aos próprios dados

## 📚 Documentação

- **API Swagger:** `http://localhost:3000/api/docs/`
- **Guia de Autenticação:** `backend/AUTH.md`
- **Migrations:** `backend/MIGRATIONS.md`

## 🧪 Testes

```bash
# Testar conectividade
curl http://localhost:3000/api/

# Testar banco de dados
curl http://localhost:3000/test-db

# Testar autenticação
curl -X POST http://localhost:3000/api/usuarios/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## 📋 Scripts Úteis

```bash
# Backend
cd backend

# Recriar banco do zero
npm run db:recreate

# Criar usuário de teste
npm run db:create-test-user

# Executar migration específica
npm run db:migrate alter-usuarios-senha-hash.sql

# Gerar documentação Swagger
npm run swagger:generate
```

## 🐳 Docker

### Comandos Úteis
```bash
# Construir imagens
docker-compose build

# Executar em background
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Parar serviços
docker-compose down

# Limpar volumes
docker-compose down -v
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Licença

ISC

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação ou abra uma issue no repositório.
