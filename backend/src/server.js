// backend/src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getQrCode, getStatus } from './whatsapp/client.js';
import { setupRoutes } from './api/routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configurar todas as rotas da API
setupRoutes(app);

// Endpoint do QR Code do WhatsApp
app.get('/api/whatsapp/qr', (req, res) => {
  try {
    const qr = getQrCode();
    const status = getStatus();
    
    if (status.isReady) {
      res.json({ qr: null, status: 'connected' });
    } else if (qr) {
      res.json({ qr: qr, status: 'waiting' });
    } else {
      res.json({ qr: null, status: 'loading' });
    }
  } catch (error) {
    console.error('Erro ao obter QR Code:', error);
    res.status(500).json({ error: 'Erro interno', qr: null, status: 'error' });
  }
});

// Endpoint do status do WhatsApp
app.get('/api/whatsapp/status', (req, res) => {
  try {
    const status = getStatus();
    res.json({ isReady: status.isReady, hasQr: status.hasQr });
  } catch (error) {
    console.error('Erro ao obter status:', error);
    res.status(500).json({ isReady: false, hasQr: false, error: 'Erro interno' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Jennyfer Backend', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    whatsapp: 'desativado'
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Jennyfer API - Consultora de Moda IA',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      campaigns: '/api/campaigns',
      images: '/api/images',
      trends: '/api/trends',
      catalog: '/api/catalogo',
      whatsapp_qr: '/api/whatsapp/qr',
      whatsapp_status: '/api/whatsapp/status',
      health: '/health'
    },
    note: 'WhatsApp não está ativo no servidor. Use localhost para WhatsApp.'
  });
});

// Tratamento de erros 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Tratamento de erros globais
app.use((err, req, res, next) => {
  console.error('Erro global:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message 
  });
});

// Iniciar servidor (sem WhatsApp)
const server = app.listen(PORT, () => {
  console.log(`✨ Jennyfer Backend rodando na porta ${PORT}`);
  console.log(`📱 API disponível em http://localhost:${PORT}`);
  console.log(`🌐 CORS habilitado para todas as origens`);
  console.log(`⚠️ WhatsApp está DESATIVADO neste servidor`);
  console.log(`📋 Rotas disponíveis:`);
  console.log(`   - GET  /api/users`);
  console.log(`   - GET  /api/campaigns`);
  console.log(`   - GET  /api/images`);
  console.log(`   - GET  /api/trends`);
  console.log(`   - GET  /api/catalogo`);
  console.log(`   - GET  /api/whatsapp/qr`);
  console.log(`   - GET  /api/whatsapp/status`);
  console.log(`   - GET  /health`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, fechando servidor...');
  server.close(() => {
    console.log('Servidor fechado');
    process.exit(0);
  });
});

// Não iniciar WhatsApp no servidor
// startWhatsAppClient();  // DESATIVADO no servidor
