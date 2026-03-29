# Relatório Técnico — VistoriaPro

Data: 29/03/2026

------------
Documento técnico objetivo com descrição do sistema, arquitetura em nuvem, tecnologias, estratégia de CI/CD, papéis da equipe e principais dificuldades com soluções adotadas.

1. Visão geral do sistema
-------------------------
- Aplicação: sistema de vistorias imobiliárias (API REST + frontend) para registrar inspeções, fotos, cômodos e gerar laudos.
- Componentes principais:
  - Backend: Node.js + Express + TypeORM (PostgreSQL).
  - Frontend: aplicação SPA (diretório `frontend`).
  - Banco: PostgreSQL (container ou serviço gerenciado).
  - Autenticação: JWT com papéis (admin, vistoriador, cliente).

2. Diagrama de arquitetura em nuvem (descrição)
------------------------------------------------
# Arquitetura adotada no projeto:

- Código-fonte: GitHub (repositório público) com GitHub Actions para CI (build e testes).
- Backend: containerizado e implantado no Railway (serviço de hosting/containers).
- Banco de dados: Supabase (Postgres gerenciado) usado pelo backend.
- Frontend: SPA hospedada no Netlify (deploy automático a partir do repositório).
- Registro de imagens: a imagem Docker é construída e gerida pelo Railway; o Railway realiza o build/push e o deploy automático do container. 
- Armazenamento de arquivos: Supabase Storage..

Fluxo de deploy (específico):

1. Desenvolvedor faz push para `dev` ou `main`.
2. GitHub Actions executa testes e builds:
  - Backend: testes com Jest; build da imagem Docker (se aplicável).
  - Frontend: build da aplicação (artifact enviado ao Netlify ou Netlify faz build pelo próprio hook).
3. Frontend: Netlify publica automaticamente após merge/push (integração Git).
4. Backend: a imagem Docker é construída pelo CI/integration e entregue ao Railway, que realiza o deploy automático do container.
5. Banco: Supabase provê o Postgres; credenciais e variáveis de ambiente são gerenciadas via secrets do Railway/Netlify/Supabase.
6. Arquivos estáticos e uploads podem ser armazenados no Supabase Storage, com regras de segurança e rotas protegidas no backend.

3. Tecnologias e serviços utilizados
-----------------------------------
- Node.js 20/22 (backend)
- Express, TypeORM, PostgreSQL
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- Trivy (scan de vulnerabilidades)
- Jest + Supertest (testes automatizados)
- dotenv para variáveis de ambiente

4. Estratégia de deploy e CI/CD
-------------------------------
Estado atual (implementado):
- Pipeline em `.github/workflows/ci-cd.yml` realiza:
  - Instalação de dependências
  - Execução de testes backend e frontend
  - Build do frontend
  - Build (e push condicional) da imagem Docker
  - Varredura de vulnerabilidades com Trivy

Pontos a finalizar para deploy automático completo:
- Configurar secrets para os serviços usados (ex.: `RAILWAY_TOKEN` / variáveis do projeto Railway, `NETLIFY_AUTH_TOKEN`, `SUPABASE_URL`, `SUPABASE_KEY`).
- Ajustar o job `deploy` no workflow para disparar deploy automático no Railway quando houver push/merge para `prod`, usando os secrets configurados.
- Ajustar o deploy do frontend para Netlify (integração Git ou deploy hook) e garantir que Netlify use a branch correta.

Boas práticas recomendadas:
- Manter testes rápidos e isolados para CI.
- Usar tags semânticas e builds reproduzíveis.
- Separar pipelines por branch (`dev` → staging, `prod` → production).
- Proteger a branch `prod`: exigir PR aprovado, revisão e CI verde antes do merge.

5. Segurança e boas práticas observadas
-------------------------------------
O que já existe:
- Uso de `dotenv` e variáveis de ambiente em `data-source.js` e `docker-compose.yml`.
- Middlewares de autenticação e autorização em `backend/src/middlewares/auth.js` e aplicação nas rotas.
- Dockerfile usa usuário não-root (`node`) e healthcheck.
- Scanner de vulnerabilidades (Trivy) no pipeline.

Recomendações e correções prioritárias:
- Remover segredos hardcoded (ex.: `DATABASE_URL` padrão e `JWT` default no código).
- Tornar `JWT_SECRET` obrigatório em produção: abortar startup se não configurado.
- Centralizar tratamento de erros: adicionar middleware global `errorHandler` e usar logger (winston/pino).
- Fornecer um arquivo `env.example` com variáveis necessárias e instruções para `secrets` no CI.
- Proteger rota de upload e validar tamanho/tipo de arquivos antes de salvar.

6. Papéis e contribuições da equipe
----------------------------------
- Backend: desenvolvimento da API, banco, autenticação, testes e Docker.
- Frontend: interface do usuário e integração com API.
- DevOps: pipeline de CI/CD, configuração de container e deploy.
- QA/Testes: criação e execução de testes automatizados e revisão de qualidade.

7. Dificuldades encontradas e soluções adotadas
-----------------------------------------------
- Falta de integração de deploy automático no workflow (job `deploy` com placeholder).
  - Solução: definir provedor e completar job com comandos de deploy ou usar integração nativa (ex.: Railway/GitHub Integration).

- Segredos em fallback no código (`JWT_SECRET`, `DATABASE_URL`).
  - Solução: remover valores padrão inseguros; exigir `JWT_SECRET` em produção e documentar `env.example`.

- Necessidade de tratamento centralizado de erros para não vazar informações sensíveis.
  - Solução: adicionar middleware `errorHandler` que loga detalhes internamente e retorna mensagens genéricas ao cliente.

8. Entregáveis e verificação
----------------------------
- Repositório público com:
  - Código organizado em `backend/` e `frontend/`.
  - `Dockerfile` em raiz: presente.
  - `docker-compose.yml`: presente e usa variáveis de ambiente.
  - `.github/workflows/ci-cd.yml`: presente, executa build e testes; deploy precisa de configuração final do provedor.
  - `README.md`: presente e descreve execução via Docker.

- Arquiteto(a) de Software em Nuvem:  Daniel Leite Delfino - 2425168 
  - Responsabilidades: definição da arquitetura em nuvem, estratégias de deploy, segurança e observabilidade; organização do repositório; revisão final dos entregáveis.
  - Principais commits/PRs: (adicione hashes ou links de PRs relevantes)

- Desenvolvedor(a) Back-end: João Sampaio de Andrade Neto - 2427419
  - Responsabilidades: implementação da API, migrations, scripts de seed, testes backend.

- Desenvolvedor(a) Front-end: José Araken Lobão dos Santos - 2425094
  - Responsabilidades: interface React, PWA, integração com API, build e otimizações.

- Engenheiro(a) DevOps: Felipe Macedo Gomes - 2428003
  - Responsabilidades: Dockerfile, docker-compose, CI/CD (workflows), automação de deploy. 

- Responsável por Qualidade e Testes: João Victor Oliveira Gomes - 2314720
  - Responsabilidades: testes automatizados, coverage, validação de endpoints.
  - Principais commits/PRs: 

- Documentação e Integração : Francisco Alexandre de Brito Bezerra Filho - 2425103
  - Responsabilidades: documentação final, relatório técnico, roteiro da demo e vídeo.
