// backend/src/whatsapp/client.js
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import { handleIncomingMessage } from './handler.js';

let client = null;
let isReady = false;
let currentQr = null;

// Verificar se está em ambiente que suporta Chrome
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

export async function startWhatsAppClient() {
  // Não iniciar WhatsApp no Render
  if (isProduction && process.env.RENDER) {
    console.log('⚠️ WhatsApp desativado no servidor cloud (Render)');
    console.log('💡 Use o WhatsApp localmente ou em uma VPS com Chrome');
    return;
  }

  try {
    console.log('📱 Iniciando WhatsApp...');

    client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './sessions'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      }
    });

    client.on('qr', (qr) => {
      currentQr = qr;
      console.log('📟 QR Code gerado! Escaneie no frontend');
    });

    client.on('authenticated', () => {
      console.log('🔐 Autenticado com sucesso!');
    });

    client.on('ready', () => {
      isReady = true;
      currentQr = null;
      console.log('✅ WhatsApp CONECTADO!');
      console.log('✨ Jennyfer está pronta para atender!');
    });

    client.on('message', async (message) => {
      if (!isReady) return;
      if (message.from === 'status@broadcast') return;
      await handleIncomingMessage(client, message);
    });

    client.on('auth_failure', (msg) => {
      console.error('❌ Falha na autenticação:', msg);
    });

    client.on('disconnected', (reason) => {
      console.log('⚠️ WhatsApp desconectado:', reason);
      isReady = false;
      console.log('🔄 Tentando reconectar em 10 segundos...');
      setTimeout(() => startWhatsAppClient(), 10000);
    });

    await client.initialize();
    
  } catch (error) {
    console.error('❌ Erro ao iniciar WhatsApp:', error.message);
    console.log('🔄 Reiniciando em 10 segundos...');
    setTimeout(() => startWhatsAppClient(), 10000);
  }
}

export function getQrCode() {
  return currentQr;
}

export function getStatus() {
  return { 
    isReady: isReady, 
    hasQr: !!currentQr 
  };
}

export function getWhatsAppClient() {
  return { client, isReady };
}
