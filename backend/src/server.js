// backend/src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { startWhatsAppClient, getQrCode, getStatus } from './whatsapp/client.js';
import { setupRoutes } from './api/routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configurar todas as rotas da API
setupRoutes(app);

// Endpoint do QR Code do WhatsApp
app.get('/api/whatsapp/qr', (req, res) => {
  const qr = getQrCode();
  const status = getStatus();
  
  if (status.isReady) {
    res.json({ qr: null, status: 'connected' });
  } else if (qr) {
    res.json({ qr: qr, status: 'waiting' });
  } else {
    res.json({ qr: null, status: 'loading' });
  }
});

// Endpoint do status do WhatsApp
app.get('/api/whatsapp/status', (req, res) => {
  const status = getStatus();
  res.json({ isReady: status.isReady, hasQr: status.hasQr });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Jennyfer Backend' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✨ Jennyfer Backend rodando na porta ${PORT}`);
  console.log(`📱 API disponível em http://localhost:${PORT}`);
  console.log(`📋 Rotas disponíveis:`);
  console.log(`   - GET  /api/users`);
  console.log(`   - GET  /api/campaigns`);
  console.log(`   - GET  /api/images`);
  console.log(`   - GET  /api/trends`);
  console.log(`   - GET  /api/whatsapp/qr`);
  console.log(`   - GET  /health`);
});

// Iniciar cliente WhatsApp
startWhatsAppClient();