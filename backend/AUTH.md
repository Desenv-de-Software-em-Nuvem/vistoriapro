# VistoriaPro API - Autenticação JWT

## 🔐 Autenticação JWT Implementada

Todas as rotas da API agora estão protegidas com autenticação JWT (JSON Web Token). Apenas o endpoint de login é público.

## 🚀 Como Usar

### 1. Fazer Login

```bash
curl -X POST http://localhost:3000/api/usuarios/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

**Resposta:**
```json
{
  "message": "Autenticação bem-sucedida",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 6,
    "nome": "Administrador",
    "email": "admin@example.com",
    "papel": "admin"
  },
  "expiresIn": "24h"
}
```

### 2. Usar Token nas Requisições

```bash
curl -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  http://localhost:3000/api/usuarios
```

## 📋 Usuário de Teste

Para testes, foi criado um usuário administrador:

- **Email:** `admin@example.com`
- **Senha:** `admin123`
- **Papel:** `admin`

Para recriar/atualizar este usuário:
```bash
npm run db:create-test-user
```

## 🔒 Níveis de Acesso

### 👑 Admin (Administrador)
- ✅ Pode listar, criar, editar e deletar usuários
- ✅ Pode gerenciar empresas, imóveis, vistorias, etc.
- ✅ Acesso total ao sistema

### 👷‍♂️ Vistoriador
- ✅ Pode visualizar dados (empresas, imóveis, vistorias)
- ❌ Não pode criar/editar/deletar dados administrativos
- ❌ Não pode gerenciar usuários

### 👤 Cliente
- ✅ Pode visualizar dados relacionados
- ❌ Acesso muito restrito

## 🛡️ Middleware de Autenticação

### `authenticateToken`
- Verifica se o token JWT é válido
- Adiciona informações do usuário em `req.user`
- Retorna 401 se token não fornecido
- Retorna 403 se token inválido/expirado

### `requireRole(roles)`
- Verifica se usuário tem papel específico
- Aceita string ou array de papéis
- Retorna 403 se acesso negado

## 📚 Endpoints Protegidos

### Usuários
- `GET /api/usuarios` - **Admin only**
- `GET /api/usuarios/:id` - **Proprietário ou Admin**
- `POST /api/usuarios` - **Admin only**
- `PUT /api/usuarios/:id` - **Proprietário ou Admin**
- `DELETE /api/usuarios/:id` - **Admin only**
- `GET /api/usuarios/auth/perfil` - **Autenticado**

### Empresas
- `GET /api/empresas` - **Admin only**
- `POST /api/empresas` - **Admin only**
- `PUT /api/empresas/:id` - **Admin only**
- `DELETE /api/empresas/:id` - **Admin only**

### Imóveis, Vistorias, Cômodos, Fotos, Transcrições, Locatários
- `GET /` - **Autenticado**
- `POST /` - **Admin only**
- `PUT /:id` - **Admin only**
- `DELETE /:id` - **Admin only**

## 🔧 Configuração

### Variáveis de Ambiente
```bash
JWT_SECRET=vistoriapro-secret-key-2024
JWT_EXPIRES_IN=24h
```

### Dependências Instaladas
- `jsonwebtoken` - Para geração e validação de tokens
- `bcrypt` - Para hash de senhas (já estava instalado)

## 📖 Documentação Swagger

Acesse `http://localhost:3000/api/docs/` para ver a documentação interativa com exemplos de uso.

**Para testar endpoints protegidos:**
1. Faça login para obter token
2. Clique em "Authorize" no Swagger UI
3. Cole o token: `Bearer SEU_TOKEN_AQUI`

## 🧪 Testes

### Teste Básico de Autenticação
```bash
# 1. Tentar acessar sem token (deve falhar)
curl http://localhost:3000/api/usuarios

# 2. Fazer login
TOKEN=$(curl -s -X POST http://localhost:3000/api/usuarios/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | jq -r '.token')

# 3. Acessar com token (deve funcionar)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/usuarios
```

## 🚨 Tratamento de Erros

### 401 Unauthorized
- Token não fornecido
- Token expirado

### 403 Forbidden
- Token inválido
- Usuário sem permissão para operação

### Respostas de Erro
```json
{
  "error": "Token de acesso não fornecido",
  "message": "Use: Authorization: Bearer <token>"
}
```

## 🔄 Próximos Passos

- [ ] Implementar refresh tokens
- [ ] Adicionar rate limiting
- [ ] Implementar logout (blacklist de tokens)
- [ ] Adicionar mais papéis de usuário
- [ ] Implementar permissões granulares por recurso