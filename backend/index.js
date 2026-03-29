require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const yaml = require('yaml');
const pool = require('./src/config/database');
const routes = require('./src/routes');
const path = require('path');
const { loggingMiddleware, errorLoggingMiddleware } = require('./src/middlewares/logging');

// Log para verificar variáveis de ambiente
console.log('=== INICIANDO VISTORIAPRO BACKEND ===');
console.log('🔄 Build Version: 2026-02-22T04:00:00Z (com Swagger UI)');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL configurada:', process.env.DATABASE_URL ? 'SIM' : 'NÃO');
console.log('JWT_SECRET configurado:', process.env.JWT_SECRET ? 'SIM' : 'NÃO');

const app = express();

// Configuração CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://imob-vistorias.netlify.app',
        'https://vistoriapro.netlify.app',
        'https://*.netlify.app',
        'http://localhost:5173',
        'capacitor://localhost',
        'file://',
        'https://localhost'
      ]
    : [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'capacitor://localhost',
        'file://',
        'https://localhost'
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ===== MIDDLEWARE DE LOGGING =====
app.use(loggingMiddleware);

app.use(express.json({ limit: '50mb', charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware para garantir UTF-8 nas respostas
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();;
});

// Disponibilizar pool para outros módulos
app.locals.pool = pool;

app.get('/', (req, res) => {
  res.json({ 
    message: 'API VistoriaPro rodando!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoint
app.get('/debug', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    port: process.env.PORT,
    hasDatabase: !!process.env.DATABASE_URL,
    hasJWT: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
    databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'undefined'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

// ===== SWAGGER/OPENAPI DOCUMENTATION =====
try {
  const swaggerFile = fs.readFileSync(path.join(__dirname, 'swagger.yaml'), 'utf8');
  const swaggerSpec = yaml.parse(swaggerFile);
  
  // Atualizar servidores dinamicamente
  swaggerSpec.servers = [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://vistoriapro-production.up.railway.app'
        : 'http://localhost:3000',
      description: process.env.NODE_ENV === 'production' ? 'Servidor de Produção' : 'Servidor Local'
    }
  ];
  
  // Endpoint para servir a spec em JSON
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
  });
  
  // Página HTML customizada do Swagger UI via CDN
  app.get('/docs/', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VistoriaPro API - Documentação Swagger</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3/swagger-ui.css">
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *,
    *:before,
    *:after {
      box-sizing: inherit;
    }
    body {
      margin: 0;
      padding: 0;
      background: #fafafa;
      font-family: sans-serif;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@3/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@3/swagger-ui-standalone-preset.js"></script>
  <script>
    SwaggerUIBundle({
      url: "/swagger.json",
      dom_id: '#swagger-ui',
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIStandalonePreset
      ],
      layout: "StandaloneLayout",
      persistAuthorization: true,
    })
  </script>
</body>
</html>
    `);
  });
  
  // Redirect /docs para /docs/
  app.get('/docs', (req, res) => {
    res.redirect(301, '/docs/');
  });
  
  console.log('✓ Swagger UI disponível em /docs/ (via CDN)');
  console.log('✓ Spec JSON disponível em /swagger.json');
} catch (error) {
  console.error('❌ Erro ao carregar swagger.yaml:', error.message);
}

// Migration endpoint (temporário)
app.get('/migrate/imoveis', async (req, res) => {
  try {
    console.log('Executando migration da tabela imoveis...');
    
    // Criar tabela imoveis
    await pool.query(`
      CREATE TABLE IF NOT EXISTS imoveis (
          id SERIAL PRIMARY KEY,
          empresa_id INTEGER NOT NULL,
          nome VARCHAR(255) NOT NULL,
          endereco_completo TEXT NOT NULL,
          unidade VARCHAR(50),
          cidade VARCHAR(100) NOT NULL,
          uf VARCHAR(2) NOT NULL,
          cep VARCHAR(10),
          tipo VARCHAR(50) NOT NULL,
          observacoes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
      )
    `);

    // Criar índices
    await pool.query('CREATE INDEX IF NOT EXISTS idx_imoveis_empresa_id ON imoveis(empresa_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_imoveis_tipo ON imoveis(tipo)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_imoveis_cidade ON imoveis(cidade)');

    console.log('Migration executada com sucesso!');
    res.json({ 
      success: true, 
      message: 'Tabela imoveis criada com sucesso!' 
    });
  } catch (error) {
    console.error('Erro na migration:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint temporário para setup inicial
app.get('/setup', async (req, res) => {
  try {
    // Verificar se existem usuários
    const usuariosResult = await pool.query('SELECT COUNT(*) as count FROM usuarios');
    const countUsuarios = parseInt(usuariosResult.rows[0].count);
    
    if (countUsuarios === 0) {
      // Verificar se existe empresa
      const empresasResult = await pool.query('SELECT COUNT(*) as count FROM empresas');
      const countEmpresas = parseInt(empresasResult.rows[0].count);
      
      let empresaId;
      if (countEmpresas === 0) {
        // Criar empresa padrão
        const empresaResult = await pool.query(
          'INSERT INTO empresas (nome, cnpj, endereco, telefone, email) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          ['Imobiliária VistoriaPro', '12.345.678/0001-90', 'Rua Principal, 123', '(11) 99999-9999', 'contato@vistoriapro.com']
        );
        empresaId = empresaResult.rows[0].id;
      } else {
        const empresaResult = await pool.query('SELECT id FROM empresas LIMIT 1');
        empresaId = empresaResult.rows[0].id;
      }
      
      // Criar usuário admin
      const bcrypt = require('bcrypt');
      const senhaHash = await bcrypt.hash('admin123', 10);
      
      await pool.query(
        'INSERT INTO usuarios (empresa_id, nome, email, senha_hash, papel) VALUES ($1, $2, $3, $4, $5)',
        [empresaId, 'Administrador', 'admin@vistoriapro.com', senhaHash, 'admin']
      );
      
      res.json({
        success: true,
        message: 'Setup inicial realizado com sucesso!',
        credentials: {
          email: 'admin@vistoriapro.com',
          senha: 'admin123'
        }
      });
    } else {
      // Listar usuários existentes (apenas emails)
      const usuariosExistentes = await pool.query('SELECT email, papel FROM usuarios');
      res.json({
        success: true,
        message: 'Usuários já existem no sistema',
        usuarios: usuariosExistentes.rows
      });
    }
  } catch (err) {
    console.error('Erro no setup:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Exemplo de rota de teste com o banco
app.get('/test-db', async (req, res) => {
  try {
    console.log('Testando conexão com o banco...');
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    console.log('Conexão com banco OK');
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Conexão com banco de dados funcionando!'
    });
  } catch (err) {
    console.error('Erro ao conectar com o banco:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message,
      message: 'Erro ao conectar com o banco de dados'
    });
  }
});

// Disponibilizar pool para outros módulos
app.locals.pool = pool;

app.use('/api', routes);
app.use('/relatorios', express.static(path.join(__dirname, 'relatorios')));

// ===== MIDDLEWARE DE TRATAMENTO DE ERROS COM LOGGING =====
app.use(errorLoggingMiddleware);

// Middleware de erro genérico (deve ser o último)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Erro interno do servidor'
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

module.exports = app;
