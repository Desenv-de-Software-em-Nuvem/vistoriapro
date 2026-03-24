# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar package.json e package-lock.json (ou yarn.lock)
COPY backend/package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Instalar dumb-init para melhorar o gerenciamento de sinais
RUN apk add --no-cache dumb-init

# Copiar node_modules do stage anterior
COPY --from=builder /app/node_modules ./node_modules

# Copiar código da aplicação
COPY backend/ ./

# Criar diretório para uploads
RUN mkdir -p ./uploads/fotos

# Expor porta
EXPOSE 3000

# Variáveis de ambiente padrão (podem ser sobrescritas no docker run com -e)
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=postgresql://placeholder \
    JWT_SECRET=placeholder

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000), (res) => { if (res.statusCode !== 200) throw new Error(res.statusCode) })" || exit 1

# Usar dumb-init como entrypoint para garantir que os sinais SIGTERM sejam processados corretamente
ENTRYPOINT ["dumb-init", "--"]

# Comando padrão
CMD ["node", "server.js"]
