# Migrations - Banco de Dados

Documentação sobre migrations e scripts de atualização do banco de dados.

## Estrutura

As migrations estão localizadas em `backend/migrations/` e são executadas em ordem alfabética.

## Scripts Disponíveis

### Recriar Banco de Dados Completo

Executa TODAS as migrations do zero. **Use apenas em desenvolvimento!**

```bash
node backend/scripts/recreate-database.js
```

Este script:
- Lê todos os arquivos `.sql` em `backend/migrations/`
- Executa em ordem alfabética
- Para se encontrar algum erro

**Variáveis de ambiente:**
```bash
DB_USER=postgres
DB_HOST=localhost
DB_NAME=vistoriapro
DB_PASSWORD=postgres
DB_PORT=5432
```

### Executar Migration Específica

Executa uma migration individual pelo nome.

```bash
node backend/scripts/run-migration.js alter-usuarios-senha-hash.sql
```

Útil para:
- Aplicar atualizações em produção
- Testar migrations isoladamente
- Rollback manual (quando necessário)

## Migrations Disponíveis

### 1. `1-createdb.sql`
- Cria estrutura inicial do banco
- Tabelas: usuarios, empresas, imoveis, etc.

### 2. `add-permitido-vistoria.sql`
- Adiciona campoxxx

### 3. `alter-usuarios-senha-hash.sql` (NOVA)
- Aumenta tamanho da coluna `senha_hash` de 200 para 255
- Necessária para hashes bcrypt (60+ caracteres)
- **Aplicar após instalar bcrypt**

Execução:
```bash
node backend/scripts/run-migration.js alter-usuarios-senha-hash.sql
```

## Guia de Desenvolvimento

### Criar Nova Migration

1. Criar arquivo em `backend/migrations/` com padrão de nome descritivo:
   - Exemplo: `alter-vistorias-add-campo.sql`

2. Escrever SQL com comentários descritivos:

```sql
-- Migration: Descrição da mudança
-- Data: DD de MMMM de YYYY

-- Comandos SQL aqui
ALTER TABLE tabela ADD COLUMN novo_campo VARCHAR(100);
```

3. Testar localmente:
```bash
node backend/scripts/run-migration.js seu-nome-migration.sql
```

4. Verificar se tudo funcionou:
```bash
# Verificar estrutura do banco
psql -U postgres -d vistoriapro -c "\dt"
psql -U postgres -d vistoriapro -c "\d usuarios"
```

### Boas Práticas

- ✅ Uma migration por mudança lógica
- ✅ Nomes descritivos e em inglês/português consistente
- ✅ Adicione comentários explaining o objetivo
- ✅ Teste antes de fazer commit
- ✅ Nunca delete/altere migrations já executadas em produção
- ❌ Não execute migrations manualmente no banco

## Fluxo de Deployment

1. Atualizar código local
2. Criar nova migration se necessário
3. Testar: `node backend/scripts/run-migration.js migration-name.sql`
4. Fazer commit
5. Em produção: executar migration com script

## Troubleshooting

**Erro: "FATAL: database does not exist"**
- Garantir que o banco existe: `createdb vistoriapro`

**Erro: "permission denied"**
- Verificar credenciais em `.env`
- Garantir permissões do usuário PostgreSQL

**Erro: "column already exists"**
- Migration pode ter sido executada antes
- Verificar status do banco manualmente
