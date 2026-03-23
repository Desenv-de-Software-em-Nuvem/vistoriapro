# VistoriaPro API

API REST para sistema de vistorias imobiliárias construída com Node.js, Express, TypeORM e PostgreSQL.

## 🚀 Funcionalidades

- ✅ **Autenticação JWT** - Todas as rotas protegidas com tokens JWT
- ✅ **Criptografia de Senhas** - Hash bcrypt para senhas
- ✅ **Documentação Swagger** - API documentada interativamente
- ✅ **Banco PostgreSQL** - Persistência com TypeORM
- ✅ **Migrations** - Controle de versão do banco de dados
- ✅ **Validação de Dados** - Controle de acesso por papéis

## 🔐 Autenticação

A API utiliza autenticação JWT. Todas as rotas (exceto login) requerem token válido.

### Login
```bash
curl -X POST http://localhost:3000/api/usuarios/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Usar Token
```bash
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:3000/api/usuarios
```

**Usuário de teste:** `admin@example.com` / `admin123`

## 📚 Documentação

- **Swagger UI:** `http://localhost:3000/api/docs/`
- **Guia de Autenticação:** [AUTH.md](AUTH.md)
- **Migrations:** [MIGRATIONS.md](MIGRATIONS.md)

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

### Instalação
```bash
# Clonar repositório
git clone <repository-url>
cd vistoriaprounifor/backend

# Instalar dependências
npm install

# Configurar banco de dados
# Editar variáveis em .env ou usar defaults
```

### Banco de Dados
```bash
# Criar banco completo (desenvolvimento)
npm run db:recreate

# Executar migration específica
npm run db:migrate alter-usuarios-senha-hash.sql

# Criar usuário de teste
npm run db:create-test-user
```

### Executar
```bash
# Desenvolvimento
npm start
# ou
node index.js

# API disponível em: http://localhost:3000
# Documentação: http://localhost:3000/api/docs/
```

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/          # Configurações (banco, etc.)
│   ├── controllers/     # Lógica dos endpoints
│   ├── entities/        # Modelos TypeORM
│   ├── middlewares/     # Middleware de autenticação
│   ├── repositories/    # Camada de dados
│   ├── routes/          # Definição das rotas
│   ├── services/        # Serviços (password, etc.)
│   └── data-source.js   # Configuração TypeORM
├── scripts/             # Scripts utilitários
├── migrations/          # Scripts SQL de migração
├── index.js            # Ponto de entrada da aplicação
└── package.json
```

## 🔑 Papéis de Usuário

- **admin**: Acesso total ao sistema
- **vistoriador**: Acesso leitura, algumas operações
- **cliente**: Acesso limitado

## 🧪 Testes Automatizados

A suíte de testes utiliza **Jest** e **Supertest** e cobre todas as rotas do backend com mocks das integrações externas (banco de dados, etc.), tornando os testes determinísticos e executáveis sem necessidade de banco de dados ativo.

### Executar Testes

```bash
# Rodar todos os testes
npm test

# Rodar testes com relatório de cobertura
npm run test:coverage
```

### Estrutura dos Testes

```
backend/
└── src/
    └── __tests__/
        ├── helpers/
        │   └── auth.js          # Gerador de token JWT para testes
        ├── root.test.js         # GET / e GET /test-db
        ├── api.test.js          # GET /api e GET /api/docs/swagger.json
        ├── usuarios.test.js     # CRUD /api/usuarios + autenticação
        ├── empresas.test.js     # CRUD /api/empresas
        ├── imoveis.test.js      # CRUD /api/imoveis
        ├── vistorias.test.js    # CRUD /api/vistorias
        ├── comodos.test.js      # CRUD /api/comodos
        ├── fotos.test.js        # CRUD /api/fotos
        ├── transcricoes.test.js # CRUD /api/transcricoes
        └── locatarios.test.js   # CRUD /api/locatarios
```

### Cobertura de Rotas

| Recurso | GET / | GET /:id | POST | PUT /:id | DELETE /:id |
|---------|-------|----------|------|----------|-------------|
| `/api/usuarios` | — | ✅ | ✅ | ✅ | ✅ |
| `/api/usuarios/auth/login` | — | — | ✅ | — | — |
| `/api/usuarios/auth/perfil` | ✅ | — | — | — | — |
| `/api/empresas` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/imoveis` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/vistorias` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/comodos` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/fotos` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/transcricoes` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/locatarios` | ✅ | ✅ | ✅ | ✅ | ✅ |

### Cenários Testados por Rota

Para cada endpoint são validados:
- ✅ **Status de sucesso** (200, 201, 204)
- ✅ **Corpo da resposta** esperado
- ✅ **Autenticação** (401 sem token, 403 token inválido/expirado)
- ✅ **Autorização por papel** (403 quando `vistoriador` tenta operações de `admin`)
- ✅ **Recursos não encontrados** (404)
- ✅ **Validação de dados** (400 campos obrigatórios ausentes)

### Scripts de Teste no package.json

```bash
npm test              # npm run test — executa todos os testes
npm run test:coverage # executa testes + gera relatório de cobertura em coverage/
```

## 🔧 Scripts Disponíveis (anteriores)

### Autenticação
- `POST /api/usuarios/auth/login` - Login
- `GET /api/usuarios/auth/perfil` - Perfil do usuário

### Usuários (Admin)
- `GET /api/usuarios` - Listar usuários
- `POST /api/usuarios` - Criar usuário
- `GET /api/usuarios/:id` - Obter usuário
- `PUT /api/usuarios/:id` - Atualizar usuário
- `DELETE /api/usuarios/:id` - Deletar usuário

### Empresas (Admin)
- `GET /api/empresas` - Listar empresas
- `POST /api/empresas` - Criar empresa
- `GET /api/empresas/:id` - Obter empresa
- `PUT /api/empresas/:id` - Atualizar empresa
- `DELETE /api/empresas/:id` - Deletar empresa

### Outros Recursos
- Imóveis, Vistorias, Cômodos, Fotos, Transcrições, Locatários
- `GET /` - Listar (Autenticado)
- `POST /` - Criar (Admin)
- `GET /:id` - Obter (Autenticado)
- `PUT /:id` - Atualizar (Admin)
- `DELETE /:id` - Deletar (Admin)

## 🔧 Scripts Disponíveis

```bash
npm run db:recreate    # Recriar banco do zero
npm run db:migrate     # Executar migration específica
npm run db:create-test-user  # Criar usuário de teste
```

## 📝 Licença

ISC