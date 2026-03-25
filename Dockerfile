# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar apenas arquivos de dependência primeiro (otimiza o cache do Docker)
COPY backend/package*.json ./

# Instalar dependências
RUN npm ci --omit=dev

# Stage 2: Runtime
FROM node:22-alpine

# Instalar dumb-init
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copiar node_modules do stage anterior
COPY --from=builder /app/node_modules ./node_modules

# Copiar o restante do código
COPY backend/ ./

# Criar diretório para uploads e ajustar permissões para o usuário 'node'
RUN mkdir -p ./uploads/fotos && chown -R node:node ./uploads

# Mudar para usuário sem privilégios de root (Segurança)
USER node

# Expor porta
EXPOSE 3000

# Variáveis de ambiente
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vistoriapro

# Health check (Ajuste a rota '/' se necessário)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/', (res) => { if (res.statusCode !== 200) throw new Error(res.statusCode) })" || exit 1

ENTRYPOINT ["dumb-init", "--"]

# Verifique se o nome do arquivo é index.js, app.js ou server.js
CMD ["node", "index.js"]