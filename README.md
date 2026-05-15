# VistoriaPro

Sistema de vistorias imobiliárias

## Visão Geral

O VistoriaPro permite registrar vistorias imobiliárias, organizar cômodos, anexar fotos e gerar laudos técnicos. O projeto está dividido em dois aplicativos:

- Backend em Node.js com Express e PostgreSQL
- Frontend em React com Vite, TypeScript, Styled Components e PWA

## Arquitetura

- Backend: Node.js + Express + PostgreSQL + JWT
- Frontend: React + Vite + TypeScript
- Documentação da API: Swagger UI
- Persistência local: PostgreSQL via Docker ou instância própria

## Funcionalidades

### Backend
- Autenticação JWT com controle por papéis
- Cadastro de usuários, empresas, imóveis, vistorias, cômodos, fotos, transcrições e locatários
- Documentação interativa da API
- Upload de imagens e geração de laudos

### Frontend
- Interface web para operação diária da vistoria
- Fluxo de login e navegação protegida
- Suporte a instalação como PWA
- Integração com a API via `VITE_API_URL`

## Requisitos

- Node.js 20+ recomendado
- npm 9+
- PostgreSQL 12+ para execução local sem Docker
- Docker e Docker Compose opcionais

## Execução Local

### 1. Backend

```bash
cd backend
npm ci
copy .env.example .env
```

No arquivo `.env`, informe uma destas opções:

- `DATABASE_URL=postgresql://usuario:senha@localhost:5432/vistoriapro`
- ou `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`

O schema canônico do sistema está em [databases/banco.sql](databases/banco.sql). Se você estiver usando PostgreSQL localmente, aplique esse arquivo uma vez antes de iniciar a API.

Depois inicie a API:

```bash
npm start
```

API local:

- `http://localhost:3000`
- `http://localhost:3000/health`
- `http://localhost:3000/docs/`

### 2. Frontend

Em outro terminal:

```bash
cd frontend
npm ci
copy .env.example .env.local
npm run dev
```

Frontend local:

- `http://localhost:5173`

Em `.env.local`, ajuste se necessário:

- `VITE_API_URL=http://localhost:3000`

## Docker

O `docker-compose.yml` sobe PostgreSQL e backend. O frontend continua sendo executado separadamente com Vite.

O Postgres do compose inicializa o banco com [databases/banco.sql](databases/banco.sql) na primeira criação do volume.

Se você usar o backend via Docker Compose, a API ficará em `http://localhost:3001`; nesse caso, ajuste `VITE_API_URL` para essa porta no frontend.

```bash
docker compose up --build
```

Serviços expostos:

- API: `http://localhost:3001`
- Banco: `localhost:5433`

## Autenticação

O projeto inclui endpoints de autenticação via JWT. Se o seu banco estiver populado com os dados iniciais, use as credenciais criadas no ambiente correspondente.

## Estrutura

```
vistoriapro/
├── backend/
├── frontend/
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## Documentação

- API: `http://localhost:3000/docs/`
- Swagger JSON: `http://localhost:3000/swagger.json`

## Deploy backend (PDF / Puppeteer)

- **Railway com Docker** (este repositório): o `Dockerfile` instala **Chromium** (`apk`) e define `PUPPETEER_EXECUTABLE_PATH`. No stage `builder`, `PUPPETEER_BROWSER_INSTALL=0` evita baixar o Chrome do Puppeteer no `npm ci` (redundante e pesado).
- **Render Web Service** (Node nativo, sem Docker): na instalação, o `postinstall` detecta o ambiente (**`RENDER_EXTERNAL_URL`** ou **`RENDER_SERVICE_NAME`**) e roda `npx puppeteer browsers install chrome`, para o PDF funcionar.
- **Desligar** o download automático: `PUPPETEER_BROWSER_INSTALL=0` no serviço.
- **Forçar** download: `PUPPETEER_BROWSER_INSTALL=1`.
- Laudo em **Word (DOCX)** não depende do Chrome.

Se aparecer erro de cache do Puppeteer no Render, faça um deploy limpo (build de novo) para o Chrome ser baixado na etapa de build.

## Observações

- O banco local precisa estar criado antes de iniciar o backend.
- As variáveis de ambiente do backend aceitam tanto `DATABASE_URL` quanto o conjunto `DB_*`.
- O frontend lê a URL da API por `VITE_API_URL`.